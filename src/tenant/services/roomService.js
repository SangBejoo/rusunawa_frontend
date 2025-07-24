import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';
import tenantAuthService from './tenantAuthService';

const API_URL = `${API_BASE_URL}/v1/rooms`;

// In-memory cache for room images to avoid repeated API calls
const imageCache = new Map();
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Cache utility functions
const getCacheKey = (roomId) => `tenant_room_images_${roomId}`;

const isCacheValid = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_EXPIRY_MS;
};

const getCachedImages = (roomId) => {
  const cacheKey = getCacheKey(roomId);
  const cacheEntry = imageCache.get(cacheKey);
  
  if (isCacheValid(cacheEntry)) {
    return cacheEntry.data;
  }
  
  if (cacheEntry) {
    // Remove expired cache entry
    imageCache.delete(cacheKey);
  }
  
  return null;
};

const setImageCache = (roomId, data) => {
  const cacheKey = getCacheKey(roomId);
  imageCache.set(cacheKey, {
    data: data,
    timestamp: Date.now()
  });
};

const getImageCache = (roomId) => {
  const cacheKey = getCacheKey(roomId);
  const cacheEntry = imageCache.get(cacheKey);
  
  if (isCacheValid(cacheEntry)) {
    return cacheEntry.data;
  }
  
  if (cacheEntry) {
    // Remove expired cache entry
    imageCache.delete(cacheKey);
  }
  
  return null;
};

/**
 * Service for handling room-related operations for tenants
 */
const roomService = {
  /**
   * Get a list of rooms with optional filtering
   * @param {Object} params - Query parameters for filtering
   * @returns {Promise<Object>} The rooms response
   */
  getRooms: async (params = {}) => {
    try {
      // Use the main rooms endpoint with optional query parameters
      const response = await axios.get(API_URL, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw error.response?.data || { message: 'Failed to fetch rooms' };
    }
  },

  /**
   * Get room details by ID
   * @param {number} roomId - The room ID
   * @returns {Promise<Object>} The room details
   */
  getRoom: async (roomId) => {
    try {
      // Ensure roomId is valid before making request
      if (!roomId || isNaN(roomId)) {
        throw new Error('Invalid room ID');
      }
      
      const response = await axios.get(`${API_URL}/${roomId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching room ${roomId}:`, error);
      throw error.response?.data || { message: 'Failed to fetch room details' };
    }
  },

  /**
   * Check if a room is available for a specific date range
   * @param {number} roomId - The room ID
   * @param {string} startDate - Check-in date in ISO format
   * @param {string} endDate - Check-out date in ISO format
   * @returns {Promise<Object>} - Availability status
   */
  checkAvailability: async (roomId, startDate, endDate) => {
    try {
      const params = { startDate, endDate };
      const response = await axios.get(`${API_URL}/${roomId}/availability`, { params });
      
      // Process the availability data to return a simple status
      const availabilityData = response.data.availability || [];
      const unavailableDates = availabilityData.filter(date => !date.isAvailable);
      
      return {
        is_available: unavailableDates.length === 0,
        unavailable_dates: unavailableDates
      };
    } catch (error) {
      console.error(`Error checking availability for room ${roomId}:`, error);
      throw error.response?.data || { message: 'Failed to check room availability' };
    }
  },

  /**
   * Check if a room has available capacity for a specific date range
   * @param {number} roomId - The room ID
   * @param {string} startDate - Check-in date in ISO format
   * @param {string} endDate - Check-out date in ISO format
   * @returns {Promise<Object>} - Capacity availability status with available slots
   */
  checkRoomCapacity: async (roomId, startDate, endDate) => {
    try {
      // Validate input parameters
      if (!roomId || isNaN(roomId)) {
        throw new Error('Invalid room ID');
      }
      
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required');
      }
      
      // Call the capacity endpoint with date parameters
      const params = { startDate, endDate };
      const response = await axios.get(`${API_URL}/${roomId}/capacity`, { params });
      
      // Parse and return the capacity availability data
      return {
        is_available: response.data.is_available || false,
        available_slots: response.data.available_slots || 0,
        room_capacity: response.data.room_capacity || 0
      };
    } catch (error) {
      console.error(`Error checking capacity for room ${roomId}:`, error);
      
      // If the error is due to the endpoint not existing, simulate a response
      // This is a fallback for backward compatibility or development
      if (error.response?.status === 404) {
        console.warn('Room capacity endpoint not found. Using simulated response.');
        
        // Get room details to check capacity if possible
        try {
          const roomDetails = await roomService.getRoom(roomId);
          // Simulate that there's at least one slot available
          return {
            is_available: true,
            available_slots: roomDetails.capacity ? Math.max(1, roomDetails.capacity - 1) : 1,
            room_capacity: roomDetails.capacity || 4
          };
        } catch (roomError) {
          // If even getting room details fails, return a generic response
          return {
            is_available: true,
            available_slots: 1,
            room_capacity: 4
          };
        }
      }
      
      throw error.response?.data || { message: 'Failed to check room capacity' };
    }
  },

  /**
   * Get room types from the available rooms data
   * @returns {Promise<Object>} Room types data
   */
  getRoomTypes: async () => {
    try {
      // Use the main rooms endpoint and extract unique types
      const response = await axios.get(API_URL);
      const rooms = response.data.rooms || [];
      
      // Extract unique classifications and rental types
      const classifications = [...new Set(rooms
        .map(room => room.classification?.name || '')
        .filter(Boolean)
      )];
      
      const rental_types = [...new Set(rooms
        .map(room => room.rentalType?.name || '')
        .filter(Boolean)
      )];
      
      return { 
        classifications, 
        rental_types 
      };
    } catch (error) {
      console.error('Error fetching room types:', error);
      throw error.response?.data || { message: 'Failed to fetch room types' };
    }
  },

  /**
   * Get occupancy status for a room by ID
   * @param {number} roomId - The room ID
   * @returns {Promise<Object>} The room occupancy status
   */
  getRoomOccupancyStatus: async (roomId) => {
    try {
      // Ensure roomId is valid before making request
      if (!roomId || isNaN(roomId)) {
        throw new Error('Invalid room ID');
      }
      
      // Get room details which include occupants array
      const response = await axios.get(`${API_URL}/${roomId}`);
      const room = response.data.room;
      
      if (!room) {
        throw new Error('Room not found');
      }
      
      // Calculate occupancy from occupants array
      const capacity = room.capacity || 4;
      const activeOccupants = (room.occupants || []).filter(occupant => 
        occupant.status === 'approved' || occupant.status === 'checked_in'
      );
      
      const occupied_slots = activeOccupants.length;
      const available_slots = Math.max(0, capacity - occupied_slots);
      const occupancy_percentage = capacity > 0 ? (occupied_slots / capacity) * 100 : 0;
      const is_fully_booked = occupied_slots >= capacity;
      
      let status = 'available';
      if (is_fully_booked) {
        status = 'fully_booked';
      } else if (occupied_slots > 0) {
        status = 'partially_occupied';
      }
      
      return {
        capacity,
        occupied_slots,
        available_slots,
        occupancy_percentage: Math.round(occupancy_percentage),
        is_fully_booked,
        status,
        active_occupants: activeOccupants
      };
    } catch (error) {
      console.error(`Error fetching occupancy status for room ${roomId}:`, error);
      throw error;
    }
  },

  /**
   * Get room availability for a specific date range
   * @param {number} roomId - The room ID
   * @param {string} startDate - Check-in date in ISO format
   * @param {string} endDate - Check-out date in ISO format
   * @returns {Promise<Object>} - Room availability data
   */
  getRoomAvailability: async (roomId, startDate, endDate) => {
    try {
      // Validate input parameters
      if (!roomId || isNaN(roomId)) {
        throw new Error('Invalid room ID');
      }
      
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required');
      }
      
      const params = { startDate, endDate };
      const response = await axios.get(`${API_URL}/${roomId}/availability`, { params });
      
      return {
        availability: response.data.availability || [],
        is_available: response.data.is_available || false
      };
    } catch (error) {
      console.error(`Error fetching availability for room ${roomId}:`, error);
      
      // Fallback response if endpoint doesn't exist
      if (error.response?.status === 404) {
        console.warn('Room availability endpoint not found. Using fallback.');
        return {
          availability: [],
          is_available: true
        };
      }
      
      throw error.response?.data || { message: 'Failed to fetch room availability' };
    }
  },
  /**
   * Get room rental types and pricing
   * @returns {Promise<Object>} Rental types data
   */
  getRentalTypes: async () => {
    try {
      // First try to get from dedicated rental types endpoint
      const response = await axios.get(`${API_BASE_URL}/v1/rental-types`);
      return response.data;
    } catch (error) {
      console.error('Error fetching rental types from API:', error);
      
      // Fallback: get from rooms data if dedicated endpoint doesn't exist
      try {
        const roomsResponse = await axios.get(API_URL);
        const rooms = roomsResponse.data.rooms || [];
        
        // Extract unique rental types from rooms
        const rentalTypesMap = new Map();
        
        rooms.forEach(room => {
          if (room.rentalType && room.rentalType.rentalTypeId) {
            rentalTypesMap.set(room.rentalType.rentalTypeId, {
              rentalTypeId: room.rentalType.rentalTypeId,
              name: room.rentalType.name
            });
          }
        });
        
        const rentalTypes = Array.from(rentalTypesMap.values());
        
        // If no rental types found, use default
        if (rentalTypes.length === 0) {
          return {
            rentalTypes: [
              { rentalTypeId: 1, name: 'harian' },
              { rentalTypeId: 2, name: 'bulanan' }
            ]
          };
        }
        
        return { rentalTypes };
      } catch (fallbackError) {
        console.error('Error in fallback rental types fetch:', fallbackError);
        
        // Final fallback with database structure
        return {
          rentalTypes: [
            { rentalTypeId: 1, name: 'harian' },
            { rentalTypeId: 2, name: 'bulanan' }
          ]
        };
      }
    }
  },

  /**
   * Calculate pricing based on dates and rental type
   * @param {number} roomId - The room ID
   * @param {string} startDate - Check-in date
   * @param {string} endDate - Check-out date
   * @param {string} rentalType - 'daily' or 'monthly'
   * @returns {Promise<Object>} Pricing calculation
   */
  calculatePricing: async (roomId, startDate, endDate, rentalType = 'daily') => {
    try {
      // Get room details first
      const roomResponse = await roomService.getRoom(roomId);
      const room = roomResponse.room || roomResponse;
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      
      let amount = 0;
      let duration = 0;
      let unit = '';
      
      if (rentalType === 'monthly') {
        // Calculate months
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
        duration = diffMonths;
        unit = 'bulan';
        amount = (room.rate || 0) * diffMonths;
      } else {
        // Calculate days
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        duration = diffDays;
        unit = 'hari';
        amount = (room.rate || 0) * diffDays;
      }
      
      return {
        baseRate: room.rate || 0,
        duration,
        unit,
        totalAmount: amount,
        rentalType
      };    } catch (error) {
      console.error(`Error calculating pricing for room ${roomId}:`, error);
      throw error.response?.data || { message: 'Failed to calculate pricing' };
    }
  },

  // ============================================================================
  // ROOM IMAGE METHODS FOR TENANTS
  // ============================================================================
    /**
   * Get all images for a room with binary data for preview (tenant view)
   * @param {number} roomId - The room ID
   * @returns {Promise<Object>} The room images response
   */
  getRoomImages: async (roomId) => {
    try {
      // Validate roomId before making request
      if (!roomId || roomId === 'undefined' || isNaN(roomId)) {
        console.warn(`❌ [Tenant] Invalid roomId provided: ${roomId}`);
        throw new Error('Invalid room ID provided');
      }

      // Check cache first
      const cachedData = getImageCache(roomId);
      if (cachedData) {
        return cachedData;
      }

      const response = await axios.get(`${API_URL}/${roomId}/images`);
      const data = response.data;
      
      // Convert image data to displayable format
      if (data.images && data.images.length > 0) {
        data.images = data.images.map((image) => {
          // Use imageData as the base64 data based on API response structure
          const imageUrl = image.imageData && typeof image.imageData === 'string' ? 
            `data:${image.contentType || 'image/png'};base64,${image.imageData}` : null;
          
          return {
            ...image,
            // Convert base64 image data to data URL for preview
            imageUrl: imageUrl,
            // Keep original imageData for potential use
            originalImageData: image.imageData
          };
        });
      }
      
      // Cache the processed data
      setImageCache(roomId, data);
      
      return data;
    } catch (error) {
      console.error('❌ [Tenant] Error in getRoomImages:', error.response || error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch room images');
    }
  },
  /**
   * Get primary room image for a room (optimized for room cards)
   * @param {number} roomId - The room ID  
   * @returns {Promise<Object|null>} The primary room image or null
   */
  getPrimaryRoomImage: async (roomId) => {
    try {
      // Validate roomId before making request
      if (!roomId || roomId === 'undefined' || isNaN(roomId)) {
        return null;
      }

      const imagesResponse = await roomService.getRoomImages(roomId);
      
      if (imagesResponse.images && imagesResponse.images.length > 0) {
        // Find primary image or use first one
        const primaryImage = imagesResponse.images.find(img => img.isPrimary) || imagesResponse.images[0];
        return primaryImage;
      }
      
      return null;
    } catch (error) {
      return null; // Return null instead of throwing to allow graceful fallback
    }
  },

  /**
   * Clear image cache for a specific room or all rooms
   * @param {number|null} roomId - Room ID to clear cache for, or null for all
   */
  clearImageCache: (roomId = null) => {
    if (roomId) {
      const cacheKey = getCacheKey(roomId);
      imageCache.delete(cacheKey);
      if (process.env.NODE_ENV === 'development') {
        console.log(`Cache cleared for room ${roomId}`);
      }
    } else {
      imageCache.clear();
      if (process.env.NODE_ENV === 'development') {
        console.log('All image cache cleared');
      }
    }
  },
  
  /**
   * Get cache statistics for debugging
   * @returns {Object} Cache statistics
   */
  getCacheStats: () => {
    return {
      totalCachedRooms: imageCache.size,
      cacheKeys: Array.from(imageCache.keys()),
      cacheExpiry: `${CACHE_EXPIRY_MS / 1000 / 60} minutes`
    };
  }
};

export default roomService;
