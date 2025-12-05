import api from '../utils/apiClient';

class AIAnalyticsService {
  // Base URL for AI analytics endpoints
  baseURL = '/ai-analytics'; // This will be combined with the api client's /v1 base
  
  // Active request controllers for cancellation
  activeRequests = new Map();
  
  // Service status cache to prevent unnecessary API calls
  serviceStatusCache = {
    status: null,
    timestamp: null,
    checkInProgress: false,
    cacheValidityMs: 30000 // Cache for 30 seconds
  };
  /**
   * Create request with timeout and cancellation support
   * @param {string} endpoint - API endpoint
   * @param {number} timeout - Timeout in milliseconds (default: 10 minutes for reasoning models)
   * @returns {Promise<Object>} API response with cancellation support
   */
  async createRequest(endpoint, timeout = 600000) { // 10 minutes default for reasoning models
    const requestId = `${endpoint}-${Date.now()}`;
    const controller = new AbortController();
    
    // Store controller for potential cancellation
    this.activeRequests.set(requestId, controller);
    
    try {
      console.log(`🤖 AIAnalyticsService: Starting request to ${endpoint}...`);
      
      const response = await api.get(`${this.baseURL}${endpoint}`, {
        signal: controller.signal,
        timeout: timeout
      });
      
      // Cleanup
      this.activeRequests.delete(requestId);
      
      if (response.status === 200 && response.data) {
        console.log(`✅ AI analysis received from ${endpoint}:`, response.data);
        return {
          success: true,
          data: response.data,
          timestamp: new Date().toISOString(),
          requestId
        };
      }
      
      throw new Error('Invalid response from AI analytics service');
    } catch (error) {
      // Cleanup
      this.activeRequests.delete(requestId);
      
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        console.log(`⏹️ Request to ${endpoint} was cancelled`);
        return {
          success: false,
          error: 'Request was cancelled',
          cancelled: true,
          timestamp: new Date().toISOString()
        };
      }
        if (error.code === 'ECONNABORTED' || error.name === 'TimeoutError') {
        console.error(`⏰ Request to ${endpoint} timed out`);
        return {
          success: false,
          error: 'Request timed out. The AI model is taking longer than expected.',
          timeout: true,
          timestamp: new Date().toISOString()
        };
      }
      
      // Handle HTTP 429 - Rate Limit/Too Many Requests
      if (error.response?.status === 429) {
        console.error(`🚫 Rate limit exceeded for ${endpoint}`);
        const retryAfter = error.response.headers['retry-after'] || '300'; // Default 5 minutes
        return {
          success: false,
          error: `API request failed with status 429: Model AI telah mencapai batas penggunaan (rate limit). Mohon tunggu ${Math.ceil(retryAfter/60)} menit atau coba lagi besok.`,
          rateLimited: true,
          retryAfter: parseInt(retryAfter),
          timestamp: new Date().toISOString()
        };
      }
      
      // Handle HTTP 503 - Service Unavailable (often used for quota exhausted)
      if (error.response?.status === 503) {
        console.error(`📊 Service unavailable for ${endpoint} - likely quota exhausted`);
        return {
          success: false,
          error: 'API request failed with status 503: Kuota AI analytics sudah habis untuk hari ini. Silakan coba lagi besok.',
          quotaExhausted: true,
          timestamp: new Date().toISOString()
        };
      }
      
      // Handle HTTP 402 - Payment Required (quota/billing issues)
      if (error.response?.status === 402) {
        console.error(`💳 Payment required for ${endpoint} - billing/quota issue`);
        return {
          success: false,
          error: 'API request failed with status 402: Kuota atau billing bermasalah. Hubungi administrator untuk upgrade.',
          billingIssue: true,
          timestamp: new Date().toISOString()
        };
      }
      
      console.error(`❌ Error with request to ${endpoint}:`, error);
      
      // Enhanced error message with status code if available
      let errorMessage = error.response?.data?.message || error.message || `Failed to get AI analysis from ${endpoint}`;
      
      if (error.response?.status) {
        errorMessage = `API request failed with status ${error.response.status}: ${errorMessage}`;
      }
      
      return {
        success: false,
        error: errorMessage,
        statusCode: error.response?.status,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Cancel active request
   * @param {string} requestId - Request ID to cancel
   */
  cancelRequest(requestId) {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
      console.log(`🛑 Cancelled request: ${requestId}`);
    }
  }

  /**
   * Cancel all active requests
   */
  cancelAllRequests() {
    for (const [requestId, controller] of this.activeRequests) {
      controller.abort();
      console.log(`🛑 Cancelled request: ${requestId}`);
    }
    this.activeRequests.clear();
  }  /**
   * Check service status and availability with caching to prevent quota waste
   * @returns {Promise<Object>} Service status
   */
  async checkServiceStatus() {
    const now = Date.now();
    const cache = this.serviceStatusCache;
    
    // Return cached result if still valid
    if (cache.status && cache.timestamp && (now - cache.timestamp) < cache.cacheValidityMs) {
      console.log('� Using cached service status (preventing quota waste):', cache.status);
      return cache.status;
    }
    
    // Prevent concurrent checks
    if (cache.checkInProgress) {
      console.log('🔄 Service status check already in progress, waiting...');
      // Wait for ongoing check to complete
      let attempts = 0;
      while (cache.checkInProgress && attempts < 50) { // Max 5 seconds wait
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      return cache.status || { success: false, available: false, message: 'Check failed' };
    }
    
    cache.checkInProgress = true;
    
    try {
      console.log('🔍 Making actual API call to check service status...');
      console.log('🌐 Health check endpoint: rusunawa-skripsi-v1-production.up.railway.app/v1/health');
      
      // Use the dedicated health endpoint that doesn't trigger any business logic
      const response = await api.get('/health', {
        timeout: 8000, // 8 seconds for health check
        validateStatus: function (status) {
          return status === 200; // Only accept 200 as healthy
        }
      });
      
      console.log('✅ Service health check response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        available: true
      });
      
      // Validate the expected health response format
      const isHealthy = response.data?.status === 'OK' && response.data?.message;
      
      const result = {
        success: true,
        available: isHealthy,
        status: isHealthy ? 'online' : 'degraded',
        message: response.data?.message || 'Service is available',
        httpStatus: response.status,
        timestamp: new Date().toISOString(),
        endpoint: '/v1/health',
        cached: false
      };
      
      // Cache the successful result
      cache.status = result;
      cache.timestamp = now;
      
      return result;
    } catch (error) {
      console.warn('⚠️ Service health check failed:', {
        message: error.message,
        status: error.response?.status,
        code: error.code,
        endpoint: '/v1/health'
      });
      
      let result;
      
      // If it's a network error, service is definitely offline
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || 
          error.code === 'ECONNABORTED' || error.name === 'TimeoutError' ||
          (!error.response?.status || error.response?.status >= 500)) {
        result = {
          success: false,
          available: false,
          status: 'offline',
          message: 'Service is offline or unreachable',
          error: error.message,
          code: error.code,
          timestamp: new Date().toISOString(),
          endpoint: '/v1/health',
          cached: false
        };
      } else if (error.response?.status === 404) {
        // Health endpoint not found
        result = {
          success: false,
          available: false,
          status: 'no-health-endpoint',
          message: 'Health endpoint not found. Service might not be configured properly.',
          error: error.message,
          httpStatus: error.response?.status,
          timestamp: new Date().toISOString(),
          endpoint: '/v1/health',
          cached: false
        };
      } else {
        // Other errors
        result = {
          success: false,
          available: false,
          status: 'error',
          message: 'Service health check failed',
          error: error.message,
          httpStatus: error.response?.status,
          timestamp: new Date().toISOString(),
          endpoint: '/v1/health',
          cached: false
        };
      }
      
      // Cache the error result (to prevent repeated failed calls)
      cache.status = result;
      cache.timestamp = now;
      
      return result;
    } finally {
      cache.checkInProgress = false;
    }
  }

  /**
   * Clear service status cache (useful for manual refresh)
   */
  clearServiceStatusCache() {
    console.log('🔄 Clearing service status cache');
    this.serviceStatusCache.status = null;
    this.serviceStatusCache.timestamp = null;
    this.serviceStatusCache.checkInProgress = false;
  }

  /**
   * Generate overall metrics analysis using AI
   * @returns {Promise<Object>} AI analytics response
   */
  async getOverallAnalysis() {
    const result = await this.createRequest('/business-insights', 900000); // 15 minutes for comprehensive business analysis
    if (result.success) {
      result.data = this.transformBusinessInsights(result.data);
    }
    return result;
  }

  /**
   * Generate performance analysis using AI
   * @returns {Promise<Object>} AI analytics response
   */
  async getPerformanceAnalysis() {
    const result = await this.createRequest('/performance-analysis', 480000); // 8 minutes for performance
    if (result.success) {
      result.data = this.transformPerformanceAnalysis(result.data);
    }
    return result;
  }

  /**
   * Generate revenue patterns analysis using AI
   * @returns {Promise<Object>} AI analytics response
   */
  async getRevenueAnalysis() {
    const result = await this.createRequest('/revenue-analysis', 720000); // 12 minutes for revenue analysis
    if (result.success) {
      result.data = this.transformRevenueAnalysis(result.data);
    }
    return result;
  }  /**
   * Generate occupancy analysis using AI
   * @returns {Promise<Object>} AI analytics response
   */
  async getOccupancyAnalysis() {
    const result = await this.createRequest('/occupancy-analysis', 360000); // 6 minutes for occupancy
    if (result.success) {
      result.data = this.transformOccupancyAnalysis(result.data);
    }
    return result;
  }  /**
   * Generate trend analysis using AI
   * @returns {Promise<Object>} AI analytics response
   */
  async getTrendAnalysis() {
    const result = await this.createRequest('/trend-analysis', 480000); // 8 minutes for trends
    if (result.success) {
      result.data = this.transformTrendAnalysis(result.data);
    }
    return result;
  }

  /**
   * Generate strategic recommendations using AI
   * @returns {Promise<Object>} AI analytics response
   */
  async getRecommendations() {
    const result = await this.createRequest('/recommendations', 600000); // 10 minutes for recommendations
    if (result.success) {
      result.data = this.transformRecommendations(result.data);
    }
    return result;
  }  /**
   * Transform business insights from AI response
   */
  transformBusinessInsights(data) {
    return {
      // Preserve all original fields from business insights API
      ...data,
      summary: data.overallPerformance || data.keyMetricsSummary || 'Analisis bisnis selesai',
      key_insights: [
        data.revenueInsight,
        data.occupancyInsight, 
        data.paymentInsight
      ].filter(insight => insight && insight.trim() !== '' && insight !== '**Anomali Data Operasional**'),
      recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
      details: {
        overallPerformance: data.overallPerformance,
        revenueInsight: data.revenueInsight,
        occupancyInsight: data.occupancyInsight,
        paymentInsight: data.paymentInsight,
        keyMetricsSummary: data.keyMetricsSummary
      },
      type: 'business',
      status: data.status,
      metadata: {
        generated_at: new Date().toISOString(),
        model_used: 'DeepSeek R1 (Reasoning Model)',
        confidence: 0.85,
        response_status: data.status?.status || 'unknown'
      }
    };
  }

  /**
   * Transform performance analysis from API response
   */
  transformPerformanceAnalysis(data) {
    return {
      // Preserve all original fields from performance analysis API
      ...data,
      summary: data.performanceSummary || 'Analisis performa selesai',
      key_insights: data.insights || [],
      recommendations: [], // Performance analysis doesn't have direct recommendations
      metrics: data.metrics || [],
      performance: {
        growth_analysis: data.growthAnalysis,
        efficiency_metrics: data.efficiencyMetrics,
        metrics: data.metrics
      },
      details: {
        performanceSummary: data.performanceSummary,
        growthAnalysis: data.growthAnalysis,
        efficiencyMetrics: data.efficiencyMetrics,
        insights: data.insights,
        metrics: data.metrics
      },
      type: 'performance',
      status: data.status,
      metadata: {
        generated_at: new Date().toISOString(),
        model_used: 'DeepSeek R1',
        confidence: 0.83,
        response_status: data.status?.status || 'unknown'
      }
    };
  }

  /**
   * Transform revenue analysis from API response
   */
  transformRevenueAnalysis(data) {
    return {
      // Preserve all original fields from revenue analysis API
      ...data,
      summary: data.revenueSummary || 'Analisis revenue selesai',
      key_insights: data.insights ? data.insights.map(insight => insight.description) : [],
      recommendations: data.recommendations || [],
      details: {
        revenueSummary: data.revenueSummary,
        paymentMethodAnalysis: data.paymentMethodAnalysis,
        revenueTrends: data.revenueTrends,
        insights: data.insights
      },
      type: 'revenue',
      status: data.status,
      metadata: {
        generated_at: new Date().toISOString(),
        model_used: 'DeepSeek R1',
        confidence: 0.82,
        response_status: data.status?.status || 'unknown'
      }
    };
  }

  /**
   * Transform occupancy analysis from API response
   */
  transformOccupancyAnalysis(data) {
    return {
      // Preserve all original fields from occupancy analysis API
      ...data,
      summary: data.occupancySummary || 'Analisis hunian selesai',
      key_insights: [
        data.utilizationAnalysis,
        data.capacityInsights
      ].filter(Boolean),
      recommendations: data.optimizationSuggestions || [],
      metrics: data.metrics || [],
      details: {
        occupancySummary: data.occupancySummary,
        utilizationAnalysis: data.utilizationAnalysis,
        capacityInsights: data.capacityInsights,
        metrics: data.metrics
      },
      type: 'occupancy',
      status: data.status,
      metadata: {
        generated_at: new Date().toISOString(),
        model_used: 'DeepSeek R1',
        confidence: 0.80,
        response_status: data.status?.status || 'unknown'
      }
    };
  }

  /**
   * Transform trend analysis from API response
   */
  transformTrendAnalysis(data) {
    return {
      // Preserve all original fields from trend analysis API
      ...data,
      summary: data.trendSummary || 'Analisis tren selesai',
      key_insights: data.strategicInsights || [],
      recommendations: [], // Trend analysis doesn't have direct recommendations
      trends: data.trendData || [],
      details: {
        trendSummary: data.trendSummary,
        seasonalPatterns: data.seasonalPatterns,
        forecastPrediction: data.forecastPrediction,
        strategicInsights: data.strategicInsights,
        trendData: data.trendData
      },
      type: 'trends',
      status: data.status,
      metadata: {
        generated_at: new Date().toISOString(),
        model_used: 'DeepSeek R1',
        confidence: 0.78,
        response_status: data.status?.status || 'unknown'
      }
    };
  }

  /**
   * Transform recommendations from API response
   */
  transformRecommendations(data) {
    const recommendations = data.recommendations || [];
    return {
      // Preserve all original fields from recommendations API
      ...data,
      summary: data.executiveSummary || 'Rekomendasi AI telah dihasilkan',
      key_insights: [], // Recommendations endpoint doesn't have separate insights
      recommendations: recommendations.map(rec => {
        if (typeof rec === 'string') return rec;
        return rec.title || rec.description || rec;
      }),
      details: {
        executiveSummary: data.executiveSummary,
        recommendations: data.recommendations,
        riskAssessment: data.riskAssessment,
        opportunityAnalysis: data.opportunityAnalysis
      },
      structured_recommendations: recommendations.filter(rec => typeof rec === 'object'),
      type: 'recommendations',
      status: data.status,
      metadata: {
        generated_at: new Date().toISOString(),
        model_used: 'DeepSeek R1',
        confidence: 0.85,
        response_status: data.status?.status || 'unknown'
      }
    };
  }
  /**
   * Generate multiple analysis types
   * @param {Array<string>} types - Array of analysis types to generate
   * @returns {Promise<Object>} Combined AI analytics response
   */
  async getMultipleAnalysis(types = ['business', 'performance', 'revenue', 'occupancy']) {
    try {
      console.log('🤖 AIAnalyticsService: Requesting multiple AI analyses...', types);
      
      const promises = types.map(type => {
        switch (type) {
          case 'business':
            return this.getOverallAnalysis();
          case 'performance':
            return this.getPerformanceAnalysis();
          case 'revenue':
            return this.getRevenueAnalysis();
          case 'occupancy':
            return this.getOccupancyAnalysis();
          case 'trends':
            return this.getTrendAnalysis();
          case 'recommendations':
            return this.getRecommendations();
          default:
            return Promise.resolve({ success: false, error: `Unknown type: ${type}` });
        }
      });
      
      const results = await Promise.allSettled(promises);
      
      // Combine successful results
      const successfulResults = results
        .filter(result => result.status === 'fulfilled' && result.value.success)
        .map(result => result.value.data);
      
      const failedResults = results
        .filter(result => result.status === 'rejected' || !result.value.success)
        .map(result => result.reason || result.value.error);
      
      if (successfulResults.length === 0) {
        return {
          success: false,
          error: 'All analysis requests failed',
          details: failedResults,
          timestamp: new Date().toISOString()
        };
      }
      
      // Merge all successful results
      const combinedData = this.mergeAnalysisResults(successfulResults, types);
      
      return {
        success: true,
        data: combinedData,
        partial: failedResults.length > 0,
        failed_types: failedResults,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error getting multiple AI analyses:', error);
      return {
        success: false,
        error: error.message || 'Failed to get multiple AI analyses',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Merge multiple analysis results into a comprehensive report
   * @param {Array<Object>} results - Array of analysis results
   * @param {Array<string>} types - Array of analysis types
   * @returns {Object} Merged analysis data
   */
  mergeAnalysisResults(results, types) {
    const combined = {
      summary: '',
      key_insights: [],
      recommendations: [],
      trends: [],
      performance: null,
      details: {},
      type: 'comprehensive',
      metadata: {
        generated_at: new Date().toISOString(),
        model_used: 'DeepSeek AI',
        analysis_types: types,
        confidence: 0.85
      }
    };

    // Collect all insights and recommendations
    results.forEach(result => {
      if (result.summary) {
        combined.summary += (combined.summary ? '\n\n' : '') + result.summary;
      }
      
      if (result.key_insights && Array.isArray(result.key_insights)) {
        combined.key_insights.push(...result.key_insights);
      }
      
      if (result.recommendations && Array.isArray(result.recommendations)) {
        combined.recommendations.push(...result.recommendations);
      }
      
      if (result.trends && Array.isArray(result.trends)) {
        combined.trends.push(...result.trends);
      }
      
      if (result.performance) {
        combined.performance = result.performance;
      }
      
      if (result.details) {
        combined.details[result.type || 'unknown'] = result.details;
      }
    });

    // Remove duplicates and empty entries
    combined.key_insights = [...new Set(combined.key_insights.filter(insight => insight && insight.trim()))];
    combined.recommendations = [...new Set(combined.recommendations.filter(rec => rec && rec.trim()))];
    
    return combined;
  }
}

// Export singleton instance
export default new AIAnalyticsService();
