/**
 * API configuration file
 * Contains the base URL and other API-related settings
 */

// API base URL - configurable per environment
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://qtd9x9cp-8001.asse.devtunnels.ms/api';

// Default headers for API requests
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Default timeout for API requests (in milliseconds)
export const API_TIMEOUT = 30000;

// API endpoints for different resources
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/v1/auth/login',
    REGISTER: '/v1/auth/register',
    FORGOT_PASSWORD: '/v1/auth/forgot-password',
    RESET_PASSWORD: '/v1/auth/reset-password',
    VERIFY_TOKEN: '/v1/auth/verify-token'
  },
  USERS: '/v1/users',
  TENANTS: '/v1/tenants',
  ROOMS: '/v1/rooms',
  BOOKINGS: '/v1/bookings',
  PAYMENTS: '/v1/payments',
  DOCUMENTS: '/v1/documents',
  ISSUES: '/v1/issues',
  ANALYTICS: '/v1/analytics'
};
