// API Configuration for User (Admin) side
export const API_URL = process.env.REACT_APP_API_URL || 'rusunawa-skripsi-v1-production.up.railway.app/v1';
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'rusunawa-skripsi-v1-production.up.railway.app';
export const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'wss://qtd9x9cp-8001.asse.devtunnels.ms';

// Default axios config
export const getApiConfig = (token) => ({
  headers: {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
});
