import api from '../utils/apiClient';

// In-memory cache for room images to avoid repeated API calls
const imageCache = new Map();
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Cache utility functions
const getCacheKey = (roomId) => `room_images_${roomId}`;

const isCacheValid = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_EXPIRY_MS;
};

const setImageCache = (roomId, data) => {
  const cacheKey = getCacheKey(roomId);
  imageCache.set(cacheKey, {
    data: data,
    timestamp: Date.now()
  });
  console.log(`💾 Cached images for room ${roomId}`);
};

const getImageCache = (roomId) => {
  const cacheKey = getCacheKey(roomId);
  const cacheEntry = imageCache.get(cacheKey);
  
  if (isCacheValid(cacheEntry)) {
    console.log(`⚡ Using cached images for room ${roomId}`);
    return cacheEntry.data;
  }
  
  if (cacheEntry) {
    // Remove expired cache entry
    imageCache.delete(cacheKey);
    console.log(`🗑️ Removed expired cache for room ${roomId}`);
  }
  
  return null;
};

const clearImageCache = (roomId = null) => {
  if (roomId) {
    const cacheKey = getCacheKey(roomId);
    imageCache.delete(cacheKey);
    console.log(`🗑️ Cleared cache for room ${roomId}`);
  } else {
    imageCache.clear();
    console.log(`🗑️ Cleared all image cache`);
  }
};

const roomService = {
  /**
   * Get all rooms with pagination and filters
   */
  getRooms: async (params = {}) => {
    try {
      const response = await api.get('/rooms', { params });
      return response.data;    } catch (error) {
      throw new Error(error.message || 'Failed to fetch rooms');
    }
  },

  /**
   * Get room by ID
   */
  getRoomById: async (roomId) => {
    try {
      const response = await api.get(`/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch room details');
    }
  },
  /**
   * Create new room
   */
  createRoom: async (roomData) => {
    // Transform frontend data to backend format
    const transformedData = {
      name: roomData.name,
      description: roomData.description || '',
      capacity: roomData.capacity,
      classification_id: parseInt(roomData.classification_id),
      rental_type_id: parseInt(roomData.rental_type_id || 1), // Default to daily rental
      building_id: parseInt(roomData.building_id),
      floor_id: parseInt(roomData.floor_id),
      room_number: roomData.room_number || '',
      amenities: roomData.amenities?.map(amenity => ({
        name: amenity.name,
        custom_feature_name: amenity.custom_feature_name || '',
        description: amenity.description || '',
        quantity: amenity.quantity || 1
      })) || [],
      images: roomData.images?.map(image => ({
        image_data: image.imageData ? image.imageData.split(',')[1] : '', // Remove data:image/... prefix
        image_name: image.imageName,
        content_type: image.contentType,
        is_primary: image.isPrimary || false
      })) || []
    };

    try {
      const response = await api.post('/rooms', transformedData);
      return response.data;
    } catch (error) {
      // Enhanced error handling for user-friendly messages
      const errorMessage = error.message || error.response?.data?.message || 'Failed to create room';
      
      // Handle specific error cases
      if (errorMessage.includes('duplicate key value violates unique constraint "unique_room_name"')) {
        throw new Error(`Nama kamar "${transformedData.name}" sudah digunakan. Silakan pilih nama kamar yang berbeda.`);
      }
      
      if (errorMessage.includes('unique constraint')) {
        throw new Error('Data yang Anda masukkan sudah ada di sistem. Silakan periksa kembali informasi kamar.');
      }
      
      if (errorMessage.includes('foreign key constraint')) {
        throw new Error('Data gedung atau lantai yang dipilih tidak valid. Silakan pilih ulang.');
      }
      
      if (errorMessage.includes('validation')) {
        throw new Error('Data yang dimasukkan tidak valid. Silakan periksa kembali semua field.');
      }
      
      // Default friendly message
      throw new Error(`Gagal membuat kamar: ${errorMessage}`);
    }
  },
  /**
   * Update room
   */
  updateRoom: async (roomId, roomData) => {
    // Transform frontend data to backend format for updates
    const transformedData = {
      name: roomData.name,
      description: roomData.description || '',
      capacity: roomData.capacity,
      classification_id: parseInt(roomData.classification_id) || 1, // Default to 1 if not provided
      rental_type_id: parseInt(roomData.rental_type_id) || 1, // Default to 1 if not provided
      // Add building/floor/room number support
      buildingId: roomData.buildingId ? parseInt(roomData.buildingId) : undefined,
      floorId: roomData.floorId ? parseInt(roomData.floorId) : undefined,
      roomNumber: roomData.roomNumber || '',
      amenities: roomData.amenities?.map(amenity => ({
        name: amenity.name,
        custom_feature_name: amenity.custom_feature_name || '',
        description: amenity.description || '',
        quantity: amenity.quantity || 1
      })) || [],
      images: roomData.images?.map(image => ({
        image_data: image.imageData ? image.imageData.split(',')[1] : '', // Remove data:image/... prefix
        image_name: image.imageName,
        content_type: image.contentType,
        is_primary: image.isPrimary || false
      })) || []
    };

    // Debug logging
    console.log('🔧 Frontend Room Update Data:', {
      roomId,
      originalData: roomData,
      transformedData
    });

    try {
      const response = await api.put(`/rooms/${roomId}`, transformedData);
      console.log('✅ Room Update Response:', response.data);
      return response.data;
    } catch (error) {
      // Enhanced error handling for user-friendly messages
      const errorMessage = error.message || error.response?.data?.message || 'Failed to update room';
      
      // Handle specific error cases
      if (errorMessage.includes('duplicate key value violates unique constraint "unique_room_name"')) {
        throw new Error(`Nama kamar "${transformedData.name}" sudah digunakan. Silakan pilih nama kamar yang berbeda.`);
      }
      
      if (errorMessage.includes('unique constraint')) {
        throw new Error('Data yang Anda masukkan sudah ada di sistem. Silakan periksa kembali informasi kamar.');
      }
      
      if (errorMessage.includes('foreign key constraint')) {
        throw new Error('Data gedung atau lantai yang dipilih tidak valid. Silakan pilih ulang.');
      }
      
      if (errorMessage.includes('validation')) {
        throw new Error('Data yang dimasukkan tidak valid. Silakan periksa kembali semua field.');
      }
      
      // Default friendly message
      throw new Error(`Gagal memperbarui kamar: ${errorMessage}`);
    }
  },

  /**
   * Delete room
   */
  deleteRoom: async (roomId) => {
    try {
      const response = await api.delete(`/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      // Try to extract backend error message for validation errors
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      // Fallback to statusText or generic error
      if (error.response && error.response.statusText) {
        throw new Error(error.response.statusText);
      }
      throw new Error(error.message || 'Failed to delete room');
    }
  },

  /**
   * Get rooms by gender
   */
  getRoomsByGender: async (gender, params = {}) => {
    try {
      const response = await api.get(`/rooms/by-gender/${gender}`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch rooms by gender');
    }
  },

  /**
   * Get rooms by student type
   */
  getRoomsByStudentType: async (tenantType, params = {}) => {
    try {
      const response = await api.get(`/rooms/by-student-type/${tenantType}`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch rooms by student type');
    }
  },

  /**
   * Get room availability
   */
  getRoomAvailability: async (roomId, params = {}) => {
    try {
      const response = await api.get(`/rooms/${roomId}/availability`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch room availability');
    }
  },

  /**
   * Update room availability
   */
  updateRoomAvailability: async (roomId, availabilityData) => {
    try {
      const response = await api.put(`/rooms/${roomId}/availability`, availabilityData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update room availability');
    }
  },

  /**
   * Get room amenities
   */
  getRoomAmenities: async (roomId) => {
    try {
      const response = await api.get(`/rooms/${roomId}/amenities`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch room amenities');
    }
  },

  /**
   * Add room amenity
   */
  addRoomAmenity: async (roomId, amenityData) => {
    try {
      const response = await api.post(`/rooms/${roomId}/amenities`, amenityData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to add room amenity');
    }
  },
  /**
   * Update room amenity
   */
  updateRoomAmenity: async (roomId, amenityName, amenityData) => {
    try {
      const response = await api.put(`/rooms/${roomId}/amenities`, {
        room_id: roomId,
        amenity_name: amenityName,
        quantity: amenityData.quantity
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update room amenity');
    }
  },

  /**
   * Remove room amenity
   */
  removeRoomAmenity: async (roomId, amenityName) => {
    try {
      const response = await api.delete(`/rooms/${roomId}/amenities`, {
        data: {
          room_id: roomId,
          amenity_name: amenityName
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to remove room amenity');
    }
  },

  /**
   * Get room rates
   */
  getRoomRates: async (params = {}) => {
    try {
      const response = await api.get('/room-rates', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch room rates');
    }
  },

  /**
   * Update room rates
   */
  updateRoomRates: async (rateData) => {
    try {
      const response = await api.put('/room-rates', rateData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update room rates');
    }
  },
  /**
   * Get room statistics
   */
  getRoomStats: async () => {
    try {
      const response = await api.get('/rooms/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch room stats');
    }
  },

  /**
   * Upload room image
   * @param {number} roomId - Room ID
   * @param {File} imageFile - Image file
   * @returns {Promise<Object>} Upload response
   */
  uploadRoomImage: async (roomId, imageFile) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await api.post(`/rooms/${roomId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error uploading image for room ${roomId}:`, error);
      throw error.response?.data || { message: 'Failed to upload room image' };
    }
  },

  /**
   * Get room occupants
   */
  getRoomOccupants: async (roomId) => {
    try {
      const response = await api.get(`/rooms/${roomId}/occupants`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch room occupants');
    }
  },

  /**
   * Get room history
   */
  getRoomHistory: async (roomId) => {
    try {
      const response = await api.get(`/rooms/${roomId}/history`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch room history');
    }
  },

  /**
   * Get room maintenance records
   */
  getRoomMaintenance: async (roomId) => {
    try {
      const response = await api.get(`/rooms/${roomId}/maintenance`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch room maintenance');
    }
  },

  /**
   * Update room status
   */
  updateRoomStatus: async (roomId, status) => {
    try {
      const response = await api.patch(`/rooms/${roomId}/status`, { status });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update room status');
    }
  },
  /**
   * Remove occupant from room
   */
  removeOccupant: async (roomId, tenantId) => {
    try {
      const response = await api.delete(`/rooms/${roomId}/occupants/${tenantId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to remove occupant');
    }
  },
  // ============================================================================
  // ROOM IMAGE METHODS
  // ============================================================================
    /**
   * Get all images for a room with binary data for preview (with caching)
   */
  getRoomImages: async (roomId) => {
    try {
      // Check cache first
      const cachedData = getImageCache(roomId);
      if (cachedData) {
        return cachedData;
      }

      console.log(`🌐 Making API call to: /rooms/${roomId}/images`);
      const response = await api.get(`/rooms/${roomId}/images`);
      console.log('🔄 Raw API response:', response);
      
      const data = response.data;
      console.log('📊 Response data:', data);
        // Convert image data to displayable format
      if (data.images && data.images.length > 0) {
        console.log(`🖼️ Processing ${data.images.length} images`);        data.images = data.images.map((image, index) => {
          // Use imageData as the base64 data based on API response structure
          const imageUrl = image.imageData && typeof image.imageData === 'string' ? 
            `data:${image.contentType || 'image/png'};base64,${image.imageData}` : null;
          
          return {
            ...image,
            // Convert base64 image data to data URL for preview
            imageUrl: imageUrl,
            // Keep original imageData for potential re-upload scenarios
            originalImageData: image.imageData
          };
        });
        console.log('✅ Images processed successfully');
      } else {
        console.log('ℹ️ No images found in response');
      }
      
      // Cache the processed data
      setImageCache(roomId, data);
      
      return data;
    } catch (error) {
      console.error('❌ Error in getRoomImages:', error.response || error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch room images');
    }
  },

  /**
   * Get single room image with binary data
   */
  getRoomImage: async (imageId) => {
    try {
      const response = await api.get(`/room-images/${imageId}`, {
        responseType: 'blob' // For binary image data
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch room image');
    }
  },

  /**
   * Get room image URL for display
   */
  getRoomImageUrl: (imageId) => {
    return `${api.defaults.baseURL}/room-images/${imageId}`;
  },
  /**
   * Add image to room
   */  addRoomImage: async (roomId, imageData) => {
    try {
      const response = await api.post(`/rooms/${roomId}/images`, {
        image: {
          image_data: imageData.image_data,
          image_name: imageData.image_name,
          content_type: imageData.content_type,
          is_primary: imageData.is_primary || false
        }
      });
      
      // Clear cache for this room so fresh data is fetched next time
      clearImageCache(roomId);
      
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to upload room image');
    }
  },
  /**
   * Delete room image
   */
  deleteRoomImage: async (imageId, roomId = null) => {
    try {
      const response = await api.delete(`/room-images/${imageId}`);
      
      // Clear cache for this room if roomId is provided
      if (roomId) {
        clearImageCache(roomId);
      } else {
        // If roomId not provided, clear all cache to be safe
        clearImageCache();
      }
      
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to delete room image');
    }
  },

  /**
   * Set primary room image
   */
  setPrimaryRoomImage: async (imageId, roomId = null) => {
    try {
      const response = await api.put(`/room-images/${imageId}/set-primary`);
      
      // Clear cache for this room if roomId is provided
      if (roomId) {
        clearImageCache(roomId);
      } else {
        // If roomId not provided, clear all cache to be safe
        clearImageCache();
      }
      
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to set primary room image');
    }
  },
  // ============================================================================
  // ROOM IMAGE METHODS
  // ============================================================================

  /**
   * Upload room image
   */
  uploadRoomImage: async (roomId, imageFile, description = '', isPrimary = false) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('description', description);
      formData.append('isPrimary', isPrimary.toString());

      const response = await api.post(`/rooms/${roomId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to upload room image');
    }
  },


  /**
   * Update room image
   */
  updateRoomImage: async (roomId, imageId, updates) => {
    try {
      const response = await api.put(`/rooms/${roomId}/images/${imageId}`, updates);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update room image');
    }
  },

  /**
   * Delete room image
   */
  deleteRoomImage: async (roomId, imageId) => {
    try {
      const response = await api.delete(`/rooms/${roomId}/images/${imageId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to delete room image');
    }
  },

  /**
   * Get image as base64 data URL
   */
  getImageDataUrl: (imageBytes) => {
    if (!imageBytes) return null;
    // Convert bytes array to base64
    const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(imageBytes)));
    return `data:image/jpeg;base64,${base64}`;
  },

  // ============================================================================
  // ROOM AMENITY METHODS
  // ============================================================================

  /**
   * Get room amenities
   */
  getRoomAmenities: async (roomId) => {
    try {
      const response = await api.get(`/rooms/${roomId}/amenities`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch room amenities');
    }
  },

  /**
   * Add amenities to room
   */
  addRoomAmenities: async (roomId, amenities) => {
    try {
      const response = await api.post(`/rooms/${roomId}/amenities`, {
        amenities
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to add room amenities');
    }
  },

  /**
   * Update room amenity
   */
  updateRoomAmenity: async (roomId, featureId, quantity) => {
    try {
      const response = await api.put(`/rooms/${roomId}/amenities/${featureId}`, {
        quantity
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update room amenity');
    }
  },

  /**
   * Remove room amenity
   */
  removeRoomAmenity: async (roomId, featureId) => {
    try {
      const response = await api.delete(`/rooms/${roomId}/amenities/${featureId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to remove room amenity');
    }
  },
  /**
   * Get available features for amenities
   */
  getAvailableFeatures: async () => {
    try {
      const response = await api.get('/room-features');
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch available features');
    }
  },  /**
   * Get room image URL from image ID
   */
  getRoomImageUrl: (imageId) => {
    if (!imageId) return null;
    return `${process.env.REACT_APP_API_URL || 'https://qtd9x9cp-8001.asse.devtunnels.ms'}/v1/room-images/${imageId}`;
  },  /**
   * Get room image data for preview
   */
  getRoomImageData: async (imageId) => {
    try {
      const response = await api.get(`/room-images/${imageId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch room image');
    }
  },

  /**
   * Get predefined classifications for room creation
   */
  getClassifications: () => {
    // Return predefined classifications based on your rate structure
    return Promise.resolve({
      classifications: [
        { id: 1, name: 'perempuan', display_name: 'Kamar Mahasiswi' },
        { id: 2, name: 'laki_laki', display_name: 'Kamar Mahasiswa' },
        { id: 3, name: 'luar', display_name: 'Kamar untuk Pihak Luar atau non mahasiswa' },
        { id: 4, name: 'ruang_rapat', display_name: 'Ruang Rapat' }
      ]
    });
  },

  /**
   * Get predefined rental types for room creation
   */
  getRentalTypes: () => {
    // Return predefined rental types based on your rate structure
    return Promise.resolve({
      rental_types: [
        { id: 1, name: 'harian', display_name: 'Per Hari' },
        { id: 2, name: 'bulanan', display_name: 'Per Bulan' }
      ]
    });
  },

  /**
   * Convert base64 image data to displayable URL
   */
  convertImageDataToUrl: (imageData, contentType = 'image/jpeg') => {
    if (!imageData) return null;
    return `data:${contentType};base64,${imageData}`;
  },

  /**
   * Get room image metadata with preview URL
   */
  processRoomImageData: (imageData) => {
    if (!imageData) return null;
    
    return {
      ...imageData,
      imageUrl: imageData.imageData ? 
        `data:${imageData.contentType};base64,${imageData.imageData}` : null,
      fileSizeFormatted: imageData.fileSize ? 
        (imageData.fileSize / 1024).toFixed(1) + ' KB' : 'Unknown',
      uploadedAtFormatted: imageData.uploadedAt ? 
        new Date(imageData.uploadedAt).toLocaleDateString() : 'Unknown'
    };
  },

  /**
   * Validate image file before upload
   */
  validateImageFile: (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    
    if (!file) {
      throw new Error('No file selected');
    }
    
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPEG and PNG files are supported');
    }
      return true;
  },

  // ============================================================================
  // CACHE MANAGEMENT UTILITIES
  // ============================================================================
  
  /**
   * Clear image cache for a specific room or all rooms
   */
  clearImageCache: (roomId = null) => {
    clearImageCache(roomId);
  },
  
  /**
   * Get cache statistics for debugging
   */
  getCacheStats: () => {
    return {
      totalCachedRooms: imageCache.size,
      cacheKeys: Array.from(imageCache.keys()),
      cacheExpiry: `${CACHE_EXPIRY_MS / 1000 / 60} minutes`
    };
  },

  // ============================================================================
  // BUILDING MANAGEMENT APIS
  // ============================================================================

  /**
   * Get all buildings with optional filtering
   */
  getBuildings: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.genderType) params.append('gender_type', filters.genderType);
      if (filters.isActive !== undefined) params.append('is_active', filters.isActive);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const queryString = params.toString();
      const response = await api.get(`/buildings${queryString ? `?${queryString}` : ''}`);
      
      return {
        buildings: response.data.buildings || [],
        totalCount: response.data.totalCount || 0,
        status: response.data.status
      };
    } catch (error) {
      console.error('Error fetching buildings:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch buildings');
    }
  },

  /**
   * Get building by ID
   */
  getBuildingById: async (buildingId) => {
    try {
      const response = await api.get(`/buildings/${buildingId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching building:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch building');
    }
  },

  /**
   * Create new building
   */
  createBuilding: async (buildingData) => {
    try {
      const response = await api.post('/buildings', buildingData);
      return response.data;
    } catch (error) {
      console.error('Error creating building:', error);
      throw new Error(error.response?.data?.message || 'Failed to create building');
    }
  },

  /**
   * Update building
   */
  updateBuilding: async (buildingId, buildingData) => {
    try {
      const response = await api.put(`/buildings/${buildingId}`, buildingData);
      return response.data;
    } catch (error) {
      console.error('Error updating building:', error);
      throw new Error(error.response?.data?.message || 'Failed to update building');
    }
  },

  /**
   * Delete building
   */
  deleteBuilding: async (buildingId) => {
    try {
      const response = await api.delete(`/buildings/${buildingId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting building:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete building');
    }
  },

  /**
   * Get building statistics
   */
  getBuildingStats: async () => {
    try {
      const response = await api.get('/v1/buildings/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching building stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch building statistics');
    }
  },

  // ============================================================================
  // FLOOR MANAGEMENT APIS
  // ============================================================================

  /**
   * Get floors for a specific building
   */
  getBuildingFloors: async (buildingId) => {
    try {
      const response = await api.get(`/buildings/${buildingId}/floors`);
      return {
        floors: response.data.floors || [],
        status: response.data.status
      };
    } catch (error) {
      console.error('Error fetching building floors:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch building floors');
    }
  },

  /**
   * Get floor by ID
   */
  getFloorById: async (floorId) => {
    try {
      const response = await api.get(`/floors/${floorId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching floor:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch floor');
    }
  },

  /**
   * Create new floor
   */
  createFloor: async (floorData) => {
    try {
      if (!floorData.buildingId) {
        throw new Error('Building ID is required to create a floor');
      }
      const response = await api.post(`/buildings/${floorData.buildingId}/floors`, floorData);
      return response.data;
    } catch (error) {
      console.error('Error creating floor:', error);
      throw new Error(error.response?.data?.message || 'Failed to create floor');
    }
  },

  /**
   * Update floor
   */
  updateFloor: async (floorId, floorData) => {
    try {
      const response = await api.put(`/floors/${floorId}`, floorData);
      return response.data;
    } catch (error) {
      console.error('Error updating floor:', error);
      throw new Error(error.response?.data?.message || 'Failed to update floor');
    }
  },

  /**
   * Delete floor
   */
  deleteFloor: async (floorId) => {
    try {
      const response = await api.delete(`/floors/${floorId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting floor:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete floor');
    }
  },

  /**
   * Get floor statistics
   */
  getFloorStats: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.floorId) params.append('floor_id', filters.floorId);
      if (filters.buildingId) params.append('building_id', filters.buildingId);

      const queryString = params.toString();
      const response = await api.get(`/floors/stats${queryString ? `?${queryString}` : ''}`);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching floor stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch floor statistics');
    }
  },

  /**
   * Get rooms by floor
   */
  getRoomsByFloor: async (floorId, filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.classification) params.append('classification', filters.classification);
      if (filters.isAvailable !== undefined) params.append('is_available', filters.isAvailable);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const queryString = params.toString();
      const response = await api.get(`/floors/${floorId}/rooms${queryString ? `?${queryString}` : ''}`);
      
      return {
        rooms: response.data.rooms || [],
        totalCount: response.data.totalCount || 0,
        status: response.data.status
      };
    } catch (error) {
      console.error('Error fetching rooms by floor:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch rooms by floor');
    }
  }

};

export default roomService;
