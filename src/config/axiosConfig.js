import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

// Create an axios instance for the app
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000 // 10 second timeout
});

// Add a request interceptor to attach auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      // Check if this is not the login or token verification endpoint
      const isAuthEndpoint = 
        error.config.url.includes('/auth/login') || 
        error.config.url.includes('/auth/verify-token');
      
      if (!isAuthEndpoint) {
        console.log('Session expired, logging out');
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('tenant');
        
        // Redirect to login page
        window.location.href = '/tenant/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
