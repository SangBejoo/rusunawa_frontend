import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'rusunawa-skripsi-v1-production.up.railway.app';
const API_VERSION = process.env.REACT_APP_VERSION || 'v1';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/${API_VERSION}`,
  timeout: 600000, // 10 minutes for reasoning models
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('🔧 API Client baseURL:', api.defaults.baseURL);

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Only use admin token (no tenant token fallback)
    const token = localStorage.getItem('adminToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('� Using admin token for API request');
    } else {
      console.log('⚠️ No admin token found for API request');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Only redirect to login on 401 if we're not already on a login/auth page
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.includes('/login') || currentPath.includes('/register');
    
    if (error.response?.status === 401 && !isAuthPage) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    
    // Format error for consistent handling
    const formattedError = {
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status,
      data: error.response?.data
    };
    
    return Promise.reject(formattedError);
  }
);

export { api };
export default api;
