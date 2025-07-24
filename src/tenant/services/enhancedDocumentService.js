// Enhanced Document Service with Advanced Image/Document Upload Capabilities
import axios from 'axios';
import { API_URL, getAuthHeader, formatAPIError } from '../utils/apiConfig';

// Enhanced document service cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper functions for cache management
const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

const clearCache = (pattern) => {
  for (const [key] of cache) {
    if (pattern.test(key)) {
      cache.delete(key);
    }
  }
};

const enhancedDocumentService = {
  /**
   * Upload document with advanced image processing and validation
   * @param {Object} documentData - The document metadata
   * @param {File|Array<File>} files - Document file(s)
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise<Object>} The upload response
   */
  uploadDocumentWithImages: async (documentData, files, onProgress = null) => {
    try {
      // Normalize files to array
      const fileArray = Array.isArray(files) ? files : [files];
      
      // Enhanced validation
      if (!documentData.doc_type_id) {
        throw new Error('Document type is required');
      }

      if (!documentData.tenant_id) {
        throw new Error('Tenant ID is required');
      }

      if (fileArray.length === 0) {
        throw new Error('At least one file is required');
      }

      // Validate files
      const maxFiles = 5; // Allow multiple files for some document types
      const maxFileSize = 20 * 1024 * 1024; // 20MB per file
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (fileArray.length > maxFiles) {
        throw new Error(`Maximum ${maxFiles} files allowed`);
      }

      for (const file of fileArray) {
        if (file.size > maxFileSize) {
          throw new Error(`File ${file.name} is too large. Maximum size is 20MB`);
        }
        
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`File ${file.name} has unsupported format. Please use PDF, JPG, PNG, WEBP, DOC, DOCX, XLS, or XLSX`);
        }
      }

      // Prepare FormData
      const formData = new FormData();
      
      // Add document metadata
      Object.keys(documentData).forEach(key => {
        if (documentData[key] !== null && documentData[key] !== undefined) {
          formData.append(key, documentData[key]);
        }
      });

      // Add files
      fileArray.forEach((file, index) => {
        formData.append('files', file);
        formData.append(`file_${index}_name`, file.name);
        formData.append(`file_${index}_type`, file.type);
        formData.append(`file_${index}_size`, file.size);
      });

      // Add metadata
      formData.append('file_count', fileArray.length);
      formData.append('uploaded_at', new Date().toISOString());
      formData.append('client_info', JSON.stringify({
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }));

      const config = {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data'
        },
        timeout: 180000, // 3 minutes for large uploads
      };

      // Add progress tracking
      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        };
      }

      const response = await axios.post(
        `${API_URL}/tenants/${documentData.tenant_id}/documents`,
        formData,
        config
      );

      // Clear cache after successful upload
      clearCache(/^tenant_documents_/);
      clearCache(/^document_types$/);
      clearCache(/^document_stats_/);

      return {
        success: true,
        documents: response.data.documents || [response.data.document],
        message: response.data.message || 'Documents uploaded successfully',
        thumbnails: response.data.thumbnails || [],
        processingInfo: response.data.processing_info || {}
      };
    } catch (error) {
      console.error('Error uploading documents:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Upload multiple images for a document (e.g., multiple pages of ID card)
   * @param {number} documentId - The document ID
   * @param {Array<File>} images - Array of image files
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise<Object>} The upload response
   */
  uploadDocumentImages: async (documentId, images, onProgress = null) => {
    try {
      if (!documentId || images.length === 0) {
        throw new Error('Document ID and at least one image are required');
      }

      // Validate images
      const maxImages = 10; // Allow multiple images per document
      const maxFileSize = 15 * 1024 * 1024; // 15MB per image
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

      if (images.length > maxImages) {
        throw new Error(`Maximum ${maxImages} images allowed`);
      }

      for (const image of images) {
        if (image.size > maxFileSize) {
          throw new Error(`Image ${image.name} is too large. Maximum size is 15MB`);
        }
        
        if (!allowedTypes.includes(image.type)) {
          throw new Error(`Image ${image.name} has unsupported format. Use JPG, PNG, or WEBP`);
        }
      }

      const formData = new FormData();
      
      // Add images
      images.forEach((image, index) => {
        formData.append('images', image);
        formData.append(`image_${index}_name`, image.name);
        formData.append(`image_${index}_type`, image.type);
        formData.append(`image_${index}_order`, index + 1);
      });

      formData.append('image_count', images.length);
      formData.append('uploaded_at', new Date().toISOString());

      const config = {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data'
        },
        timeout: 180000,
      };

      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        };
      }

      const response = await axios.post(
        `${API_URL}/documents/${documentId}/images`,
        formData,
        config
      );

      // Clear cache
      clearCache(new RegExp(`^document_${documentId}`));
      clearCache(/^tenant_documents_/);

      return {
        success: true,
        images: response.data.images || [],
        thumbnails: response.data.thumbnails || [],
        message: response.data.message || 'Images uploaded successfully'
      };
    } catch (error) {
      console.error('Error uploading document images:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Get document with all images and processing information
   * @param {number} documentId - The document ID
   * @returns {Promise<Object>} The document with images
   */
  getDocumentWithImages: async (documentId) => {
    try {
      const cacheKey = `document_${documentId}_with_images`;
      const cached = getCachedData(cacheKey);
      if (cached) return cached;

      const response = await axios.get(
        `${API_URL}/documents/${documentId}?include_images=true&include_thumbnails=true`,
        { 
          headers: getAuthHeader(),
          timeout: 15000
        }
      );

      const result = {
        document: response.data.document,
        images: response.data.images || [],
        thumbnails: response.data.thumbnails || [],
        processing_info: response.data.processing_info || {},
        verification_status: response.data.verification_status || {},
        history: response.data.history || []
      };

      setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching document with images:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Get tenant documents with image counts and thumbnails
   * @param {number} tenantId - The tenant ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} The documents list with image info
   */
  getTenantDocumentsWithImages: async (tenantId, filters = {}) => {
    try {
      const cacheKey = `tenant_documents_${tenantId}_with_images_${JSON.stringify(filters)}`;
      const cached = getCachedData(cacheKey);
      if (cached) return cached;

      const params = {
        include_images: true,
        include_thumbnails: true,
        include_stats: true,
        ...filters
      };

      const response = await axios.get(
        `${API_URL}/tenants/${tenantId}/documents`,
        { 
          headers: getAuthHeader(),
          params,
          timeout: 15000
        }
      );

      const result = {
        documents: response.data.documents || [],
        totalCount: response.data.total_count || 0,
        statistics: response.data.statistics || {},
        verification_summary: response.data.verification_summary || {}
      };

      setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching tenant documents with images:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Process document images (OCR, enhancement, validation)
   * @param {number} documentId - The document ID
   * @param {Object} processingOptions - Processing options
   * @returns {Promise<Object>} The processing response
   */
  processDocumentImages: async (documentId, processingOptions = {}) => {
    try {
      const params = {
        enable_ocr: processingOptions.enableOCR || true,
        enhance_images: processingOptions.enhanceImages || true,
        validate_content: processingOptions.validateContent || true,
        extract_metadata: processingOptions.extractMetadata || true,
        quality_check: processingOptions.qualityCheck || true
      };

      const response = await axios.post(
        `${API_URL}/documents/${documentId}/process`,
        params,
        { 
          headers: getAuthHeader(),
          timeout: 120000 // 2 minutes for processing
        }
      );

      // Clear cache
      clearCache(new RegExp(`^document_${documentId}`));

      return {
        success: true,
        processing_id: response.data.processing_id,
        status: response.data.status,
        estimated_time: response.data.estimated_time,
        message: response.data.message || 'Document processing started'
      };
    } catch (error) {
      console.error('Error processing document images:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Get document processing status
   * @param {number} documentId - The document ID
   * @param {string} processingId - The processing ID
   * @returns {Promise<Object>} The processing status
   */
  getDocumentProcessingStatus: async (documentId, processingId) => {
    try {
      const response = await axios.get(
        `${API_URL}/documents/${documentId}/processing/${processingId}/status`,
        { 
          headers: getAuthHeader(),
          timeout: 10000
        }
      );

      return {
        status: response.data.status,
        progress: response.data.progress || 0,
        results: response.data.results || {},
        errors: response.data.errors || [],
        estimated_remaining: response.data.estimated_remaining || 0
      };
    } catch (error) {
      console.error('Error fetching processing status:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Delete document image
   * @param {number} documentId - The document ID
   * @param {number} imageId - The image ID
   * @returns {Promise<Object>} The delete response
   */
  deleteDocumentImage: async (documentId, imageId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/documents/${documentId}/images/${imageId}`,
        { 
          headers: getAuthHeader(),
          timeout: 10000
        }
      );

      // Clear cache
      clearCache(new RegExp(`^document_${documentId}`));
      clearCache(/^tenant_documents_/);

      return {
        success: true,
        message: response.data.message || 'Image deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting document image:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Replace document image
   * @param {number} documentId - The document ID
   * @param {number} imageId - The image ID to replace
   * @param {File} newImage - The new image file
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise<Object>} The replace response
   */
  replaceDocumentImage: async (documentId, imageId, newImage, onProgress = null) => {
    try {
      // Validate new image
      const maxFileSize = 15 * 1024 * 1024; // 15MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

      if (newImage.size > maxFileSize) {
        throw new Error('Image is too large. Maximum size is 15MB');
      }
      
      if (!allowedTypes.includes(newImage.type)) {
        throw new Error('Unsupported image format. Use JPG, PNG, or WEBP');
      }

      const formData = new FormData();
      formData.append('image', newImage);
      formData.append('image_name', newImage.name);
      formData.append('image_type', newImage.type);
      formData.append('replaced_at', new Date().toISOString());

      const config = {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000,
      };

      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        };
      }

      const response = await axios.put(
        `${API_URL}/documents/${documentId}/images/${imageId}`,
        formData,
        config
      );

      // Clear cache
      clearCache(new RegExp(`^document_${documentId}`));
      clearCache(/^tenant_documents_/);

      return {
        success: true,
        image: response.data.image,
        thumbnail: response.data.thumbnail,
        message: response.data.message || 'Image replaced successfully'
      };
    } catch (error) {
      console.error('Error replacing document image:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Get document image URL with authentication and options
   * @param {number} documentId - The document ID
   * @param {number} imageId - The image ID
   * @param {Object} options - URL options (size, quality, format)
   * @returns {string} The image URL
   */
  getDocumentImageUrl: (documentId, imageId, options = {}) => {
    const params = new URLSearchParams();
    if (options.size) params.append('size', options.size);
    if (options.quality) params.append('quality', options.quality);
    if (options.format) params.append('format', options.format);
    if (options.enhance) params.append('enhance', options.enhance);
    
    const queryString = params.toString();
    return `${API_URL}/documents/${documentId}/images/${imageId}${queryString ? `?${queryString}` : ''}`;
  },

  /**
   * Get document image thumbnail URL
   * @param {number} documentId - The document ID
   * @param {number} imageId - The image ID
   * @param {Object} options - Thumbnail options (size, format)
   * @returns {string} The thumbnail URL
   */
  getDocumentImageThumbnailUrl: (documentId, imageId, options = {}) => {
    const params = new URLSearchParams();
    if (options.size) params.append('size', options.size);
    if (options.format) params.append('format', options.format);
    
    const queryString = params.toString();
    return `${API_URL}/documents/${documentId}/images/${imageId}/thumbnail${queryString ? `?${queryString}` : ''}`;
  },

  /**
   * Get document types with image requirements and examples
   * @returns {Promise<Object>} The document types with requirements
   */
  getDocumentTypesWithImageRequirements: async () => {
    try {
      const cacheKey = 'document_types_with_requirements';
      const cached = getCachedData(cacheKey);
      if (cached) return cached;

      const response = await axios.get(
        `${API_URL}/document-types?include_requirements=true&include_examples=true`,
        { 
          headers: getAuthHeader(),
          timeout: 10000
        }
      );

      const result = {
        types: response.data.types || [],
        requirements: response.data.requirements || {},
        examples: response.data.examples || {},
        validation_rules: response.data.validation_rules || {}
      };

      setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching document types:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Validate document images against requirements
   * @param {number} docTypeId - The document type ID
   * @param {Array<File>} images - Array of image files
   * @returns {Promise<Object>} Validation results
   */
  validateDocumentImages: async (docTypeId, images) => {
    try {
      const formData = new FormData();
      formData.append('doc_type_id', docTypeId);
      
      images.forEach((image, index) => {
        formData.append('images', image);
        formData.append(`image_${index}_name`, image.name);
        formData.append(`image_${index}_type`, image.type);
      });

      const response = await axios.post(
        `${API_URL}/documents/validate-images`,
        formData,
        { 
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data'
          },
          timeout: 60000
        }
      );

      return {
        valid: response.data.valid,
        issues: response.data.issues || [],
        suggestions: response.data.suggestions || [],
        score: response.data.score || 0,
        requirements_met: response.data.requirements_met || {}
      };
    } catch (error) {
      console.error('Error validating document images:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Search documents with image filters
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Object>} Search results
   */
  searchDocumentsWithImages: async (searchParams = {}) => {
    try {
      const params = {
        q: searchParams.query || '',
        doc_type: searchParams.docType || '',
        status: searchParams.status || '',
        has_images: searchParams.hasImages || '',
        verification_status: searchParams.verificationStatus || '',
        tenant_id: searchParams.tenantId || '',
        date_from: searchParams.dateFrom || '',
        date_to: searchParams.dateTo || '',
        page: searchParams.page || 1,
        limit: searchParams.limit || 20,
        include_images: true,
        include_thumbnails: true,
        sort_by: searchParams.sortBy || 'created_at',
        sort_order: searchParams.sortOrder || 'desc'
      };

      const response = await axios.get(
        `${API_URL}/documents/search`,
        { 
          headers: getAuthHeader(),
          params,
          timeout: 15000
        }
      );

      return {
        documents: response.data.documents || [],
        pagination: response.data.pagination || {},
        facets: response.data.facets || {},
        suggestions: response.data.suggestions || []
      };
    } catch (error) {
      console.error('Error searching documents:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Generate document archive with images
   * @param {Array<number>} documentIds - Array of document IDs
   * @param {Object} archiveOptions - Archive options
   * @returns {Promise<Object>} Archive generation response
   */
  generateDocumentArchive: async (documentIds, archiveOptions = {}) => {
    try {
      const params = {
        document_ids: documentIds,
        include_images: archiveOptions.includeImages || true,
        include_thumbnails: archiveOptions.includeThumbnails || false,
        format: archiveOptions.format || 'zip',
        quality: archiveOptions.quality || 'high',
        organize_by: archiveOptions.organizeBy || 'type'
      };

      const response = await axios.post(
        `${API_URL}/documents/archive`,
        params,
        { 
          headers: getAuthHeader(),
          timeout: 120000
        }
      );

      return {
        success: true,
        archiveId: response.data.archive_id,
        downloadUrl: response.data.download_url,
        expiresAt: response.data.expires_at,
        message: response.data.message || 'Archive generation started'
      };
    } catch (error) {
      console.error('Error generating document archive:', error);
      throw formatAPIError(error);
    }
  },

  // Utility methods
  clearAllCache: () => {
    cache.clear();
  },

  getCacheSize: () => {
    return cache.size;
  },

  getCacheStats: () => {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const [key, value] of cache) {
      if (now - value.timestamp > CACHE_DURATION) {
        expired++;
      } else {
        active++;
      }
    }

    return { total: cache.size, active, expired };
  }
};

export default enhancedDocumentService;
