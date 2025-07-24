// Enhanced Issue Service with Photo Upload Capabilities
import axios from 'axios';
import { API_URL, getAuthHeader, formatAPIError } from '../utils/apiConfig';

// Enhanced issue service cache
const cache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for real-time updates

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

const enhancedIssueService = {
  /**
   * Report a new issue with multiple photo uploads and enhanced validation
   * @param {Object} issueData - The issue data
   * @param {Array<File>} photos - Array of photo files
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise<Object>} The report response
   */
  reportIssueWithPhotos: async (issueData, photos = [], onProgress = null) => {
    try {
      // Enhanced validation
      if (!issueData.title || issueData.title.trim().length < 5) {
        throw new Error('Issue title must be at least 5 characters long');
      }

      if (!issueData.description || issueData.description.trim().length < 10) {
        throw new Error('Issue description must be at least 10 characters long');
      }

      if (!issueData.category) {
        throw new Error('Please select an issue category');
      }

      if (!issueData.priority) {
        throw new Error('Please select issue priority');
      }

      // Validate photos
      const maxPhotos = 5;
      const maxFileSize = 10 * 1024 * 1024; // 10MB per file
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

      if (photos.length > maxPhotos) {
        throw new Error(`Maximum ${maxPhotos} photos allowed`);
      }

      for (const photo of photos) {
        if (photo.size > maxFileSize) {
          throw new Error(`Photo ${photo.name} is too large. Maximum size is 10MB`);
        }
        
        if (!allowedTypes.includes(photo.type)) {
          throw new Error(`Photo ${photo.name} has unsupported format. Use JPG, PNG, or WEBP`);
        }
      }

      // Prepare FormData
      const formData = new FormData();
      
      // Add issue data
      Object.keys(issueData).forEach(key => {
        if (issueData[key] !== null && issueData[key] !== undefined) {
          formData.append(key, issueData[key]);
        }
      });

      // Add photos
      photos.forEach((photo, index) => {
        formData.append('photos', photo);
        formData.append(`photo_${index}_name`, photo.name);
        formData.append(`photo_${index}_type`, photo.type);
      });

      // Add metadata
      formData.append('photo_count', photos.length);
      formData.append('reported_at', new Date().toISOString());

      const config = {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000, // 2 minutes for large uploads
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
        `${API_URL}/issues/report`,
        formData,
        config
      );

      // Clear cache after successful report
      clearCache(/^tenant_issues_/);
      clearCache(/^issue_categories$/);

      return {
        success: true,
        issue: response.data.issue,
        message: response.data.message || 'Issue reported successfully',
        photos: response.data.photos || []
      };
    } catch (error) {
      console.error('Error reporting issue with photos:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Add photos to an existing issue
   * @param {number} issueId - The issue ID
   * @param {Array<File>} photos - Array of photo files
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise<Object>} The upload response
   */
  addPhotosToIssue: async (issueId, photos, onProgress = null) => {
    try {
      if (!issueId || photos.length === 0) {
        throw new Error('Issue ID and at least one photo are required');
      }

      // Validate photos
      const maxPhotos = 3; // Additional photos limit
      const maxFileSize = 10 * 1024 * 1024; // 10MB per file
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

      if (photos.length > maxPhotos) {
        throw new Error(`Maximum ${maxPhotos} additional photos allowed`);
      }

      for (const photo of photos) {
        if (photo.size > maxFileSize) {
          throw new Error(`Photo ${photo.name} is too large. Maximum size is 10MB`);
        }
        
        if (!allowedTypes.includes(photo.type)) {
          throw new Error(`Photo ${photo.name} has unsupported format. Use JPG, PNG, or WEBP`);
        }
      }

      const formData = new FormData();
      
      // Add photos
      photos.forEach((photo, index) => {
        formData.append('photos', photo);
        formData.append(`photo_${index}_name`, photo.name);
        formData.append(`photo_${index}_type`, photo.type);
      });

      formData.append('photo_count', photos.length);
      formData.append('uploaded_at', new Date().toISOString());

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

      const response = await axios.post(
        `${API_URL}/issues/${issueId}/photos`,
        formData,
        config
      );

      // Clear cache
      clearCache(new RegExp(`^issue_${issueId}$`));
      clearCache(/^tenant_issues_/);

      return {
        success: true,
        photos: response.data.photos || [],
        message: response.data.message || 'Photos uploaded successfully'
      };
    } catch (error) {
      console.error('Error adding photos to issue:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Get issue with photos and detailed information
   * @param {number} issueId - The issue ID
   * @returns {Promise<Object>} The issue with photos
   */
  getIssueWithPhotos: async (issueId) => {
    try {
      const cacheKey = `issue_${issueId}_with_photos`;
      const cached = getCachedData(cacheKey);
      if (cached) return cached;

      const response = await axios.get(
        `${API_URL}/issues/${issueId}?include_photos=true`,
        { 
          headers: getAuthHeader(),
          timeout: 15000
        }
      );

      const result = {
        issue: response.data.issue,
        photos: response.data.photos || [],
        comments: response.data.comments || [],
        attachments: response.data.attachments || [],
        timeline: response.data.timeline || []
      };

      setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching issue with photos:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Get tenant issues with photo counts and thumbnails
   * @param {number} tenantId - The tenant ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} The issues list with photo info
   */
  getTenantIssuesWithPhotos: async (tenantId, filters = {}) => {
    try {
      const cacheKey = `tenant_issues_${tenantId}_with_photos_${JSON.stringify(filters)}`;
      const cached = getCachedData(cacheKey);
      if (cached) return cached;

      const params = {
        include_photos: true,
        include_thumbnails: true,
        ...filters
      };

      const response = await axios.get(
        `${API_URL}/tenants/${tenantId}/issues`,
        { 
          headers: getAuthHeader(),
          params,
          timeout: 15000
        }
      );

      const result = {
        issues: response.data.issues || [],
        totalCount: response.data.total_count || 0,
        filters: response.data.available_filters || {},
        statistics: response.data.statistics || {}
      };

      setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching tenant issues with photos:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Delete a photo from an issue
   * @param {number} issueId - The issue ID
   * @param {number} photoId - The photo ID
   * @returns {Promise<Object>} The delete response
   */
  deleteIssuePhoto: async (issueId, photoId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/issues/${issueId}/photos/${photoId}`,
        { 
          headers: getAuthHeader(),
          timeout: 10000
        }
      );

      // Clear cache
      clearCache(new RegExp(`^issue_${issueId}`));
      clearCache(/^tenant_issues_/);

      return {
        success: true,
        message: response.data.message || 'Photo deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting issue photo:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Get photo URL with authentication and options
   * @param {number} issueId - The issue ID
   * @param {number} photoId - The photo ID
   * @param {Object} options - URL options (size, quality, format)
   * @returns {string} The photo URL
   */
  getIssuePhotoUrl: (issueId, photoId, options = {}) => {
    const params = new URLSearchParams();
    if (options.size) params.append('size', options.size);
    if (options.quality) params.append('quality', options.quality);
    if (options.format) params.append('format', options.format);
    
    const queryString = params.toString();
    return `${API_URL}/issues/${issueId}/photos/${photoId}${queryString ? `?${queryString}` : ''}`;
  },

  /**
   * Get photo thumbnail URL
   * @param {number} issueId - The issue ID
   * @param {number} photoId - The photo ID
   * @param {Object} options - Thumbnail options (size, format)
   * @returns {string} The thumbnail URL
   */
  getIssuePhotoThumbnailUrl: (issueId, photoId, options = {}) => {
    const params = new URLSearchParams();
    if (options.size) params.append('size', options.size);
    if (options.format) params.append('format', options.format);
    
    const queryString = params.toString();
    return `${API_URL}/issues/${issueId}/photos/${photoId}/thumbnail${queryString ? `?${queryString}` : ''}`;
  },

  /**
   * Get issue categories with statistics
   * @returns {Promise<Object>} The categories list
   */
  getIssueCategoriesWithStats: async () => {
    try {
      const cacheKey = 'issue_categories_with_stats';
      const cached = getCachedData(cacheKey);
      if (cached) return cached;

      const response = await axios.get(
        `${API_URL}/issues/categories?include_stats=true`,
        { 
          headers: getAuthHeader(),
          timeout: 10000
        }
      );

      const result = {
        categories: response.data.categories || [],
        statistics: response.data.statistics || {}
      };

      setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching issue categories:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Update issue status with photos and notes
   * @param {number} issueId - The issue ID
   * @param {string} status - New status
   * @param {string} notes - Status change notes
   * @param {Array<File>} photos - Additional photos (optional)
   * @returns {Promise<Object>} The update response
   */
  updateIssueStatusWithPhotos: async (issueId, status, notes = '', photos = []) => {
    try {
      const formData = new FormData();
      formData.append('status', status);
      formData.append('notes', notes);
      formData.append('updated_at', new Date().toISOString());

      // Add photos if provided
      if (photos.length > 0) {
        photos.forEach((photo, index) => {
          formData.append('photos', photo);
          formData.append(`photo_${index}_name`, photo.name);
          formData.append(`photo_${index}_type`, photo.type);
        });
        formData.append('photo_count', photos.length);
      }

      const response = await axios.put(
        `${API_URL}/issues/${issueId}/status`,
        formData,
        { 
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data'
          },
          timeout: 60000
        }
      );

      // Clear cache
      clearCache(new RegExp(`^issue_${issueId}`));
      clearCache(/^tenant_issues_/);

      return {
        success: true,
        issue: response.data.issue,
        message: response.data.message || 'Issue status updated successfully'
      };
    } catch (error) {
      console.error('Error updating issue status:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Search issues with photo filters
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Object>} Search results
   */
  searchIssuesWithPhotos: async (searchParams = {}) => {
    try {
      const params = {
        q: searchParams.query || '',
        category: searchParams.category || '',
        status: searchParams.status || '',
        priority: searchParams.priority || '',
        has_photos: searchParams.hasPhotos || '',
        date_from: searchParams.dateFrom || '',
        date_to: searchParams.dateTo || '',
        page: searchParams.page || 1,
        limit: searchParams.limit || 20,
        include_photos: true,
        include_thumbnails: true,
        sort_by: searchParams.sortBy || 'created_at',
        sort_order: searchParams.sortOrder || 'desc'
      };

      const response = await axios.get(
        `${API_URL}/issues/search`,
        { 
          headers: getAuthHeader(),
          params,
          timeout: 15000
        }
      );

      return {
        issues: response.data.issues || [],
        pagination: response.data.pagination || {},
        facets: response.data.facets || {},
        suggestions: response.data.suggestions || []
      };
    } catch (error) {
      console.error('Error searching issues:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Generate issue report with photos
   * @param {Object} reportParams - Report parameters
   * @returns {Promise<Object>} Report generation response
   */
  generateIssueReportWithPhotos: async (reportParams = {}) => {
    try {
      const params = {
        format: reportParams.format || 'pdf',
        include_photos: reportParams.includePhotos || true,
        photo_quality: reportParams.photoQuality || 'medium',
        tenant_id: reportParams.tenantId || '',
        date_from: reportParams.dateFrom || '',
        date_to: reportParams.dateTo || '',
        category: reportParams.category || '',
        status: reportParams.status || ''
      };

      const response = await axios.post(
        `${API_URL}/issues/reports/generate`,
        params,
        { 
          headers: getAuthHeader(),
          timeout: 60000
        }
      );

      return {
        success: true,
        reportId: response.data.report_id,
        downloadUrl: response.data.download_url,
        message: response.data.message || 'Report generation started'
      };
    } catch (error) {
      console.error('Error generating issue report:', error);
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

export default enhancedIssueService;
