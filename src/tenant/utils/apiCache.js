/**
 * API Response Cache Utility
 * Helps prevent duplicate API calls and improves performance
 */

class APICache {
  constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  // Generate cache key from URL and parameters
  generateKey(url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${url}?${JSON.stringify(sortedParams)}`;
  }

  // Get cached data if valid
  get(url, params = {}) {
    const key = this.generateKey(url, params);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    const now = Date.now();
    if (now > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  // Set cache data
  set(url, params = {}, data, ttl = this.defaultTTL) {
    const key = this.generateKey(url, params);
    const expiry = Date.now() + ttl;
    
    this.cache.set(key, {
      data,
      expiry,
      timestamp: Date.now()
    });
  }

  // Clear specific cache entry
  delete(url, params = {}) {
    const key = this.generateKey(url, params);
    this.cache.delete(key);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    const validEntries = Array.from(this.cache.values())
      .filter(entry => now <= entry.expiry);
    
    return {
      totalEntries: this.cache.size,
      validEntries: validEntries.length,
      expiredEntries: this.cache.size - validEntries.length
    };
  }

  // Clean expired entries
  cleanExpired() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
    return expiredKeys.length;
  }
}

// Create singleton instances for different data types
export const apiCache = new APICache(5 * 60 * 1000); // 5 minutes
export const roomCache = new APICache(10 * 60 * 1000); // 10 minutes for room data
export const paymentCache = new APICache(2 * 60 * 1000); // 2 minutes for payment data
export const tenantCache = new APICache(15 * 60 * 1000); // 15 minutes for tenant data

// Auto-cleanup expired entries every 5 minutes
setInterval(() => {
  apiCache.cleanExpired();
  roomCache.cleanExpired();
  paymentCache.cleanExpired();
  tenantCache.cleanExpired();
}, 5 * 60 * 1000);

export default APICache;
