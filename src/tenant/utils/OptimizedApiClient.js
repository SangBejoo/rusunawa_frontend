import axios from 'axios';
import { apiCache } from './apiCache';
import { serviceLogger } from './logger';

/**
 * Optimized API client with caching, deduplication, and performance monitoring
 */
class OptimizedApiClient {
  constructor(baseURL, defaultCacheTTL = 5 * 60 * 1000) {
    this.baseURL = baseURL;
    this.defaultCacheTTL = defaultCacheTTL;
    this.pendingRequests = new Map();
    
    // Create axios instance
    this.client = axios.create({
      baseURL,
      timeout: 30000,
    });

    // Request interceptor for auth and logging
    this.client.interceptors.request.use(
      (config) => {
        serviceLogger.apiCall(config.method?.toUpperCase() || 'GET', config.url, config.data);
        return config;
      },
      (error) => {
        serviceLogger.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        serviceLogger.apiResponse(
          response.config.method?.toUpperCase() || 'GET',
          response.config.url,
          response.status,
          'success'
        );
        return response;
      },
      (error) => {
        serviceLogger.error('API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  // Generate unique key for request deduplication
  generateRequestKey(method, url, params, data) {
    return `${method}:${url}:${JSON.stringify(params || {})}:${JSON.stringify(data || {})}`;
  }

  // GET request with caching
  async get(url, options = {}) {
    const {
      cache = true,
      cacheTTL = this.defaultCacheTTL,
      forceRefresh = false,
      ...axiosConfig
    } = options;

    // Check cache first
    if (cache && !forceRefresh) {
      const cached = apiCache.get(url, axiosConfig.params);
      if (cached) {
        serviceLogger.debug('Cache hit for:', url);
        return { data: cached };
      }
    }

    // Check for pending request
    const requestKey = this.generateRequestKey('GET', url, axiosConfig.params);
    if (this.pendingRequests.has(requestKey)) {
      serviceLogger.debug('Returning pending request for:', url);
      return this.pendingRequests.get(requestKey);
    }

    // Create new request
    const requestPromise = this.client.get(url, axiosConfig)
      .then(response => {
        // Cache successful responses
        if (cache && response.status === 200) {
          apiCache.set(url, axiosConfig.params, response.data, cacheTTL);
        }
        return response;
      })
      .finally(() => {
        // Remove from pending requests
        this.pendingRequests.delete(requestKey);
      });

    // Store pending request
    this.pendingRequests.set(requestKey, requestPromise);

    return requestPromise;
  }

  // POST request (no caching, but with deduplication)
  async post(url, data, options = {}) {
    const { deduplicate = false, ...axiosConfig } = options;

    if (deduplicate) {
      const requestKey = this.generateRequestKey('POST', url, axiosConfig.params, data);
      if (this.pendingRequests.has(requestKey)) {
        serviceLogger.debug('Returning pending POST request for:', url);
        return this.pendingRequests.get(requestKey);
      }

      const requestPromise = this.client.post(url, data, axiosConfig)
        .finally(() => {
          this.pendingRequests.delete(requestKey);
        });

      this.pendingRequests.set(requestKey, requestPromise);
      return requestPromise;
    }

    return this.client.post(url, data, axiosConfig);
  }

  // PUT request
  async put(url, data, options = {}) {
    const { ...axiosConfig } = options;
    return this.client.put(url, data, axiosConfig);
  }

  // PATCH request
  async patch(url, data, options = {}) {
    const { ...axiosConfig } = options;
    return this.client.patch(url, data, axiosConfig);
  }

  // DELETE request
  async delete(url, options = {}) {
    const { ...axiosConfig } = options;
    
    // Clear cache for this URL
    apiCache.delete(url, axiosConfig.params);
    
    return this.client.delete(url, axiosConfig);
  }

  // Clear cache for specific pattern
  clearCache(urlPattern) {
    // This would need to be implemented based on cache structure
    apiCache.clear();
  }

  // Get performance statistics
  getStats() {
    return {
      cache: apiCache.getStats(),
      pendingRequests: this.pendingRequests.size
    };
  }
}

export default OptimizedApiClient;
