import axios from 'axios';
import { API_URL, getAuthHeader, formatAPIError } from '../utils/apiConfig';
import tenantAuthService from './tenantAuthService';

// Payment analytics cache
const cache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for real-time analytics

// Helper function to get cached data
const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

// Helper function to set cached data
const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Clear specific cache entries
const clearCache = (pattern) => {
  for (const [key] of cache) {
    if (pattern.test(key)) {
      cache.delete(key);
    }
  }
};

const paymentAnalyticsService = {
  /**
   * Get comprehensive payment analytics for tenant
   * @param {Object} options - Analytics options
   * @param {string} options.period - Time period (last7days, last30days, last90days, lastyear)
   * @param {string} options.startDate - Custom start date (YYYY-MM-DD)
   * @param {string} options.endDate - Custom end date (YYYY-MM-DD)
   * @param {boolean} options.includeComparisons - Include period-over-period comparisons
   * @returns {Promise<Object>} Payment analytics data
   */
  getPaymentAnalytics: async (options = {}) => {
    try {
      const cacheKey = `analytics_${JSON.stringify(options)}`;
      const cached = getCachedData(cacheKey);
      if (cached) return cached;

      const {
        period = 'last30days',
        startDate,
        endDate,
        includeComparisons = true
      } = options;

      const params = {
        period,
        include_comparisons: includeComparisons
      };

      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await axios.get(
        `${API_URL}/payments/analytics`,
        { 
          headers: getAuthHeader(),
          params,
          timeout: 15000
        }
      );

      const analyticsData = {
        overview: response.data.overview || {},
        trends: response.data.trends || [],
        paymentMethods: response.data.payment_methods || [],
        statusBreakdown: response.data.status_breakdown || {},
        monthlyTrends: response.data.monthly_trends || [],
        averagePaymentTime: response.data.average_payment_time || {},
        peakPaymentTimes: response.data.peak_payment_times || [],
        failureAnalysis: response.data.failure_analysis || {},
        comparisons: response.data.comparisons || {},
        projections: response.data.projections || {},
        insights: response.data.insights || []
      };

      setCachedData(cacheKey, analyticsData);
      return analyticsData;
    } catch (error) {
      console.error('Error fetching payment analytics:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Get payment success rate analytics
   * @param {Object} options - Options for success rate calculation
   * @returns {Promise<Object>} Success rate data
   */
  getSuccessRateAnalytics: async (options = {}) => {
    try {
      const cacheKey = `success_rate_${JSON.stringify(options)}`;
      const cached = getCachedData(cacheKey);
      if (cached) return cached;

      const response = await axios.get(
        `${API_URL}/payments/success-rate`,
        { 
          headers: getAuthHeader(),
          params: options,
          timeout: 10000
        }
      );

      const successRateData = {
        overall: response.data.overall || 0,
        byMethod: response.data.by_method || {},
        byTimeOfDay: response.data.by_time_of_day || [],
        byDayOfWeek: response.data.by_day_of_week || [],
        trends: response.data.trends || [],
        factors: response.data.factors || []
      };

      setCachedData(cacheKey, successRateData);
      return successRateData;
    } catch (error) {
      console.error('Error fetching success rate analytics:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Get payment method performance comparison
   * @param {Object} options - Comparison options
   * @returns {Promise<Object>} Payment method comparison data
   */
  getPaymentMethodComparison: async (options = {}) => {
    try {
      const cacheKey = `method_comparison_${JSON.stringify(options)}`;
      const cached = getCachedData(cacheKey);
      if (cached) return cached;

      const response = await axios.get(
        `${API_URL}/payments/methods/comparison`,
        { 
          headers: getAuthHeader(),
          params: options,
          timeout: 10000
        }
      );

      const comparisonData = {
        methods: response.data.methods || [],
        successRates: response.data.success_rates || {},
        averageTimes: response.data.average_times || {},
        popularityTrends: response.data.popularity_trends || [],
        userPreferences: response.data.user_preferences || {},
        recommendations: response.data.recommendations || []
      };

      setCachedData(cacheKey, comparisonData);
      return comparisonData;
    } catch (error) {
      console.error('Error fetching payment method comparison:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Get invoice analytics
   * @param {Object} options - Invoice analytics options
   * @returns {Promise<Object>} Invoice analytics data
   */
  getInvoiceAnalytics: async (options = {}) => {
    try {
      const cacheKey = `invoice_analytics_${JSON.stringify(options)}`;
      const cached = getCachedData(cacheKey);
      if (cached) return cached;

      const response = await axios.get(
        `${API_URL}/analytics/invoices`,
        { 
          headers: getAuthHeader(),
          params: options,
          timeout: 12000
        }
      );

      const invoiceData = {
        overview: response.data.overview || {},
        statusDistribution: response.data.status_distribution || {},
        overdueAnalysis: response.data.overdue_analysis || {},
        paymentPatterns: response.data.payment_patterns || [],
        dueDate: response.data.due_date_analysis || {},
        amountDistribution: response.data.amount_distribution || [],
        seasonality: response.data.seasonality || [],
        collectionEfficiency: response.data.collection_efficiency || {}
      };

      setCachedData(cacheKey, invoiceData);
      return invoiceData;
    } catch (error) {
      console.error('Error fetching invoice analytics:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Get predictive analytics for payments
   * @param {Object} options - Prediction options
   * @returns {Promise<Object>} Predictive analytics data
   */
  getPredictiveAnalytics: async (options = {}) => {
    try {
      const cacheKey = `predictive_analytics_${JSON.stringify(options)}`;
      const cached = getCachedData(cacheKey);
      if (cached) return cached;

      const response = await axios.get(
        `${API_URL}/payments/predictive-analytics`,
        { 
          headers: getAuthHeader(),
          params: options,
          timeout: 15000
        }
      );

      const predictiveData = {
        cashFlowForecast: response.data.cash_flow_forecast || [],
        paymentRiskScores: response.data.payment_risk_scores || {},
        seasonalPatterns: response.data.seasonal_patterns || [],
        recommendedActions: response.data.recommended_actions || [],
        optimizationSuggestions: response.data.optimization_suggestions || [],
        marketTrends: response.data.market_trends || []
      };

      setCachedData(cacheKey, predictiveData);
      return predictiveData;
    } catch (error) {
      console.error('Error fetching predictive analytics:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Get real-time payment metrics
   * @returns {Promise<Object>} Real-time metrics
   */
  getRealTimeMetrics: async () => {
    try {
      // Don't cache real-time metrics
      const response = await axios.get(
        `${API_URL}/payments/real-time-metrics`,
        { 
          headers: getAuthHeader(),
          timeout: 5000
        }
      );

      return {
        activePayments: response.data.active_payments || 0,
        recentTransactions: response.data.recent_transactions || [],
        currentHourStats: response.data.current_hour_stats || {},
        systemHealth: response.data.system_health || {},
        alerts: response.data.alerts || [],
        performance: response.data.performance || {}
      };
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Export analytics data
   * @param {Object} options - Export options
   * @param {string} options.format - Export format (pdf, excel, csv)
   * @param {string} options.reportType - Type of report
   * @param {Object} options.dateRange - Date range for export
   * @returns {Promise<Blob>} Exported data blob
   */
  exportAnalytics: async (options = {}) => {
    try {
      const {
        format = 'pdf',
        reportType = 'comprehensive',
        dateRange = {}
      } = options;

      const params = {
        format,
        report_type: reportType,
        ...dateRange
      };

      const response = await axios.get(
        `${API_URL}/payments/analytics/export`,
        { 
          headers: getAuthHeader(),
          params,
          responseType: 'blob',
          timeout: 30000
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Generate custom analytics report
   * @param {Object} reportConfig - Custom report configuration
   * @returns {Promise<Object>} Generated report data
   */
  generateCustomReport: async (reportConfig) => {
    try {
      const response = await axios.post(
        `${API_URL}/payments/analytics/custom-report`,
        reportConfig,
        { 
          headers: getAuthHeader(),
          timeout: 20000
        }
      );

      return {
        reportId: response.data.report_id,
        data: response.data.data || {},
        metadata: response.data.metadata || {},
        downloadUrl: response.data.download_url
      };
    } catch (error) {
      console.error('Error generating custom report:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Get payment anomaly detection results
   * @param {Object} options - Anomaly detection options
   * @returns {Promise<Object>} Anomaly detection results
   */
  getAnomalyDetection: async (options = {}) => {
    try {
      const cacheKey = `anomaly_detection_${JSON.stringify(options)}`;
      const cached = getCachedData(cacheKey);
      if (cached) return cached;

      const response = await axios.get(
        `${API_URL}/payments/anomaly-detection`,
        { 
          headers: getAuthHeader(),
          params: options,
          timeout: 12000
        }
      );

      const anomalyData = {
        anomalies: response.data.anomalies || [],
        patterns: response.data.patterns || [],
        severity: response.data.severity || {},
        recommendations: response.data.recommendations || [],
        trends: response.data.trends || [],
        alerts: response.data.alerts || []
      };

      setCachedData(cacheKey, anomalyData);
      return anomalyData;
    } catch (error) {
      console.error('Error fetching anomaly detection:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Set up payment analytics alerts
   * @param {Object} alertConfig - Alert configuration
   * @returns {Promise<Object>} Alert setup response
   */
  setupAnalyticsAlerts: async (alertConfig) => {
    try {
      const response = await axios.post(
        `${API_URL}/payments/analytics/alerts`,
        alertConfig,
        { 
          headers: getAuthHeader(),
          timeout: 10000
        }
      );

      // Clear alerts cache
      clearCache(/^alerts_/);

      return {
        success: true,
        alertId: response.data.alert_id,
        message: 'Analytics alerts configured successfully'
      };
    } catch (error) {
      console.error('Error setting up analytics alerts:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Get payment benchmarks
   * @param {Object} options - Benchmark options
   * @returns {Promise<Object>} Benchmark data
   */
  getBenchmarks: async (options = {}) => {
    try {
      const cacheKey = `benchmarks_${JSON.stringify(options)}`;
      const cached = getCachedData(cacheKey);
      if (cached) return cached;

      const response = await axios.get(
        `${API_URL}/payments/benchmarks`,
        { 
          headers: getAuthHeader(),
          params: options,
          timeout: 10000
        }
      );

      const benchmarkData = {
        industryAverages: response.data.industry_averages || {},
        yourPerformance: response.data.your_performance || {},
        rankings: response.data.rankings || {},
        improvements: response.data.improvements || [],
        competitiveAnalysis: response.data.competitive_analysis || {}
      };

      setCachedData(cacheKey, benchmarkData);
      return benchmarkData;
    } catch (error) {
      console.error('Error fetching benchmarks:', error);
      throw formatAPIError(error);
    }
  },

  /**
   * Clear analytics cache
   * @param {string} pattern - Cache pattern to clear (optional)
   */
  clearCache: (pattern = null) => {
    if (pattern) {
      clearCache(new RegExp(pattern));
    } else {
      cache.clear();
    }
  },

  /**
   * Get cache statistics for debugging
   * @returns {Object} Cache statistics
   */
  getCacheStats: () => {
    return {
      size: cache.size,
      keys: Array.from(cache.keys()),
      memoryUsage: JSON.stringify(Array.from(cache.entries())).length
    };
  }
};

export default paymentAnalyticsService;
