/**
 * API utility functions for better error handling and data manipulation
 */

/**
 * Validates that an ID is a valid number or string representation of a number
 * @param {number|string} id - The ID to validate
 * @returns {number|null} - The validated ID as a number or null if invalid
 */
export const validateId = (id) => {
  if (id === undefined || id === null) return null;
  
  // If it's already a number, make sure it's positive
  if (typeof id === 'number') {
    return id > 0 ? id : null;
  }
  
  // If it's a string, try to convert it
  if (typeof id === 'string') {
    const numId = parseInt(id, 10);
    if (!isNaN(numId) && numId > 0) {
      return numId;
    }
  }
  
  return null;
};

/**
 * Safely parse ID from URL params, with fallback value if invalid
 * @param {string|number} paramId - The ID from URL parameters 
 * @param {number} fallback - Fallback value if ID is invalid
 * @returns {number} - Validated ID or fallback value
 */
export const safeParamId = (paramId, fallback = 0) => {
  const validId = validateId(paramId);
  return validId !== null ? validId : fallback;
};

/**
 * Handle API errors in a consistent way
 * @param {Error} error - The error object caught in catch block
 * @param {string} defaultMessage - Default message to use if no specific error message is available
 * @returns {Object} Standardized error object
 */
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  if (error.response?.data) {
    // API returned error data
    return {
      message: error.response.data.message || error.response.data.error || defaultMessage,
      status: error.response.status,
      data: error.response.data
    };
  } else if (error.message) {
    // Error has a message property
    return {
      message: error.message,
      status: error.status || 500
    };
  } else {
    // Default error
    return {
      message: defaultMessage,
      status: 500
    };
  }
};

/**
 * Extract pagination data from API responses
 * @param {Object} response - API response object
 * @returns {Object} Pagination data
 */
export const extractPagination = (response) => {
  return {
    totalCount: response.totalCount || 0,
    page: response.page || 1,
    limit: response.limit || 10,
    totalPages: response.totalPages || Math.ceil((response.totalCount || 0) / (response.limit || 10))
  };
};

/**
 * Format a file size in bytes to a human-readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Convert a file to base64 encoding for API submission
 * @param {File} file - The file to convert
 * @returns {Promise<string>} Base64-encoded string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove data:image/jpeg;base64, prefix from the base64 string
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default {
  validateId,
  handleApiError,
  extractPagination,
  formatFileSize,
  fileToBase64
};
