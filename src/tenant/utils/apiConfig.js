// Base API URL from environment or default - Updated to match backend port
export const API_URL = process.env.REACT_APP_API_URL || 'https://qtd9x9cp-8001.asse.devtunnels.ms/v1';
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://qtd9x9cp-8001.asse.devtunnels.ms';

/**
 * Get authentication header with JWT token
 * @returns {Object} Headers object with Authorization
 */
export const getAuthHeader = () => {
  const token = localStorage.getItem('tenant_token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  };
};

/**
 * Format API errors for consistent display
 * @param {Object} error - Error object from API request
 * @returns {Object} Formatted error object
 */
export const formatAPIError = (error) => {
  // Check if error response exists
  if (error.response) {
    // Server responded with a status code outside the 2xx range
    const { data, status } = error.response;
    
    // If the error has a message field, return it
    if (data && data.message) {
      return {
        message: data.message,
        status: status
      };
    }
    
    // Generic error based on status
    return {
      message: getErrorMessageByStatus(status),
      status: status
    };
  } else if (error.request) {
    // The request was made but no response was received
    return {
      message: 'No response from server. Please check your connection.',
      status: null
    };
  } else {
    // Something happened in setting up the request
    return {
      message: error.message || 'An unexpected error occurred.',
      status: null
    };
  }
};

/**
 * Get generic error message based on HTTP status code
 * @param {number} status - HTTP status code
 * @returns {string} Generic error message
 */
const getErrorMessageByStatus = (status) => {
  switch (status) {
    case 400:
      return 'Bad request. Please check your input.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return `Error ${status}. Please try again later.`;
  }
};

/**
 * Handle 401 unauthorized responses
 * @param {Object} error - Error object from API request
 */
export const handleUnauthorized = (error) => {
  if (error.response && error.response.status === 401) {
    // Clear token and redirect to login
    localStorage.removeItem('tenant_token');
    localStorage.removeItem('tenant_user');
    
    // If not on login page, redirect to login
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/tenant/login';
    }
  }
  
  return error;
};

/**
 * Create config object for API requests
 * @param {Object} customConfig - Custom configuration options
 * @returns {Object} Config object with headers and other settings
 */
export const createConfig = (customConfig = {}) => {
  return {
    headers: {
      ...getAuthHeader(),
      ...customConfig.headers
    },
    ...customConfig
  };
};
