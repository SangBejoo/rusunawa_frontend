/**
 * Environment variables access utility
 */

export const API_URL = process.env.REACT_APP_API_URL || 'rusunawa-skripsi-v1-production.up.railway.app';
export const APP_VERSION = process.env.REACT_APP_VERSION || 'v1';
export const APP_ENV = process.env.REACT_APP_ENV || 'development';

// Construct API paths with version
export const getApiPath = (path) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_URL}/v1/${cleanPath}`;
};

export default {
  API_URL,
  APP_VERSION,
  APP_ENV,
  getApiPath,
};
