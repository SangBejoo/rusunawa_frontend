/**
 * Configuration utility to centralize environment variables and defaults
 */

// API configuration
export const API_CONFIG = {
  // Provide multiple fallbacks to ensure we always have a base URL
  BASE_URL: process.env.REACT_APP_API_URL || window.REACT_APP_API_URL || 'rusunawa-skripsi-v1-production.up.railway.app',
  TIMEOUT: 15000,
  VERSION: 'v1'
};

// Authentication configuration
export const AUTH_CONFIG = {
  TOKEN_KEY: 'adminToken',
  TENANT_TOKEN_KEY: 'tenantToken',
  REFRESH_TOKEN_KEY: 'refreshToken'
};

// Application configuration
export const APP_CONFIG = {
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  APP_NAME: 'Rusunawa Management System'
};

/**
 * Get configuration or provide fallback
 * @param {string} key - Configuration key path (e.g. 'API_CONFIG.BASE_URL')
 * @param {*} fallback - Fallback value if key is not found
 * @returns {*} Configuration value or fallback
 */
export function getConfig(key, fallback = null) {
  try {
    const parts = key.split('.');
    let value = { API_CONFIG, AUTH_CONFIG, APP_CONFIG };
    
    for (const part of parts) {
      value = value[part];
      if (value === undefined) return fallback;
    }
    
    return value;
  } catch (err) {
    console.warn(`Failed to get config for key: ${key}`, err);
    return fallback;
  }
}

export default {
  API: API_CONFIG,
  AUTH: AUTH_CONFIG,
  APP: APP_CONFIG,
  getConfig
};
