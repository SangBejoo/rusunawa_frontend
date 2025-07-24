import api from '../utils/apiClient';

/**
 * Analytics Service
 * Handles all analytics-related API calls with proper error handling and data formatting
 */
const analyticsService = {
  /**
   * Get overall system metrics
   * @returns {Promise<Object>} Overall metrics including revenue, bookings, rooms
   */
  getOverallMetrics: async () => {
    try {
      const response = await api.get('/analytics/metrics');
      return {
        success: true,
        data: response.data,
        metrics: {
          totalRevenue: response.data.totalRevenue || 0,
          totalBookings: response.data.totalBookings || 0,
          totalRooms: response.data.totalRooms || 0,
          activeBookings: response.data.activeBookings || 0,
          availableRooms: response.data.availableRooms || 0,
          pendingPayments: response.data.pendingPayments || 0,
          verifiedPayments: response.data.verifiedPayments || 0
        }
      };
    } catch (error) {
      console.error('Get overall metrics error:', error);
      return {
        success: false,
        error: error.response?.data?.status?.message || error.message || 'Failed to fetch overall metrics',
        metrics: null
      };
    }
  },

  /**
   * Get daily analytics for a specific date
   * @param {string} date - Date in YYYY-MM-DD format (optional, defaults to today)
   * @returns {Promise<Object>} Daily analytics data
   */
  getDailyAnalytics: async (date = null) => {
    try {
      const params = date ? { date } : {};
      const response = await api.get('/analytics/daily', { params });
      
      // Map API response fields to expected format
      return {
        success: true,
        data: response.data,
        analytics: {
          date: date || new Date().toISOString().split('T')[0],
          dailyRevenue: response.data.dailyRevenue || 0,
          dailyBookings: response.data.dailyBookings || 0,
          dailyPayments: response.data.dailyPayments || 0,
          totalRooms: response.data.totalRooms || 0,
          activeBookings: response.data.activeBookings || 0,
          availableRooms: response.data.availableRooms || 0,
          pendingPayments: response.data.pendingPayments || 0,
          verifiedPayments: response.data.verifiedPayments || 0
        }
      };
    } catch (error) {
      console.error('Get daily analytics error:', error);
      return {
        success: false,
        error: error.response?.data?.status?.message || error.message || 'Failed to fetch daily analytics',
        analytics: null
      };
    }
  },

  /**
   * Get monthly analytics for a specific month
   * @param {number} year - Year (optional, defaults to current year)
   * @param {number} month - Month 1-12 (optional, defaults to current month)
   * @returns {Promise<Object>} Monthly analytics data
   */
  getMonthlyAnalytics: async (year = null, month = null) => {
    try {
      const params = {};
      if (year) params.year = year;
      if (month) params.month = month;
      
      const response = await api.get('/analytics/monthly', { params });
      return {
        success: true,
        data: response.data,
        analytics: {
          year: response.data.year || new Date().getFullYear(),
          month: response.data.month || new Date().getMonth() + 1,
          monthlyRevenue: response.data.monthlyRevenue || 0,
          monthlyBookings: response.data.monthlyBookings || 0,
          monthlyPayments: response.data.monthlyPayments || 0
        }
      };
    } catch (error) {
      console.error('Get monthly analytics error:', error);
      return {
        success: false,
        error: error.response?.data?.status?.message || error.message || 'Failed to fetch monthly analytics',
        analytics: null
      };
    }
  },

  /**
   * Get revenue breakdown by payment method
   * @param {string} startDate - Start date in YYYY-MM-DD format (optional)
   * @param {string} endDate - End date in YYYY-MM-DD format (optional)
   * @returns {Promise<Object>} Revenue by payment method data
   */
  getRevenueByMethod: async (startDate = null, endDate = null) => {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get('/analytics/revenue-by-method', { params });
      
      // Transform the revenue data to match component expectations
      const transformedRevenue = (response.data.revenue || []).map(item => ({
        name: item.paymentMethod || 'Unknown',
        value: item.amount || 0,
        count: item.count || 0,
        paymentMethod: item.paymentMethod || 'Unknown',
        amount: item.amount || 0
      }));
      
      return {
        success: true,
        data: response.data,
        revenue: transformedRevenue
      };
    } catch (error) {
      console.error('Get revenue by method error:', error);
      return {
        success: false,
        error: error.response?.data?.status?.message || error.message || 'Failed to fetch revenue by method',
        revenue: []
      };
    }
  },

  /**
   * Get comprehensive analytics dashboard data
   * Combines multiple analytics endpoints for dashboard display
   * @returns {Promise<Object>} Complete analytics dashboard data
   */
  getDashboardAnalytics: async () => {
    try {
      console.log('Fetching comprehensive dashboard analytics...');
      
      // Fetch all analytics data in parallel, including invoices for accurate calculation
      const [overallMetrics, dailyAnalytics, monthlyAnalytics, revenueByMethod, invoicesData] = await Promise.all([
        analyticsService.getOverallMetrics(),
        analyticsService.getDailyAnalytics(),
        analyticsService.getMonthlyAnalytics(),
        analyticsService.getRevenueByMethod(),
        analyticsService.getInvoicesData()
      ]);

      console.log('Analytics data fetched:', {
        overall: overallMetrics.success,
        daily: dailyAnalytics.success,
        monthly: monthlyAnalytics.success,
        revenue: revenueByMethod.success,
        invoices: invoicesData.success,
        overallData: overallMetrics.success ? overallMetrics.metrics : null,
        monthlyData: monthlyAnalytics.success ? monthlyAnalytics.analytics : null,
        dailyData: dailyAnalytics.success ? dailyAnalytics.analytics : null,
        invoicesCount: invoicesData.success ? invoicesData.invoices.length : 0
      });

      // Calculate accurate monthly revenue from invoices if available
      let enhancedMonthlyAnalytics = monthlyAnalytics.success ? monthlyAnalytics.analytics : {
        monthlyRevenue: 0,
        monthlyBookings: 0,
        monthlyPayments: 0
      };

      if (invoicesData.success && invoicesData.invoices.length > 0) {
        const currentDate = new Date();
        const calculatedMonthly = analyticsService.calculateMonthlyRevenueFromInvoices(
          invoicesData.invoices,
          currentDate.getFullYear(),
          currentDate.getMonth() + 1
        );
        
        console.log('Calculated vs API monthly revenue:', {
          apiRevenue: enhancedMonthlyAnalytics.monthlyRevenue,
          calculatedRevenue: calculatedMonthly.monthlyRevenue,
          paidInvoicesThisMonth: calculatedMonthly.paidInvoices,
          unpaidInvoicesThisMonth: calculatedMonthly.unpaidInvoices,
          totalInvoicesProcessed: invoicesData.invoices.length,
          using: calculatedMonthly.monthlyRevenue > enhancedMonthlyAnalytics.monthlyRevenue ? 'calculated (invoices)' : 'api',
          month: `${calculatedMonthly.year}-${calculatedMonthly.month.toString().padStart(2, '0')}`
        });
        
        // Use calculated revenue if it's higher than API (API might be wrong)
        if (calculatedMonthly.monthlyRevenue > enhancedMonthlyAnalytics.monthlyRevenue) {
          enhancedMonthlyAnalytics = {
            ...enhancedMonthlyAnalytics,
            monthlyRevenue: calculatedMonthly.monthlyRevenue,
            monthlyPayments: calculatedMonthly.monthlyPayments,
            isCalculatedFromInvoices: true
          };
        }
      }

      // Check if critical data failed
      if (!overallMetrics.success) {
        console.warn('Overall metrics failed, using fallback data');
      }

      // Try to get accurate room occupancy from dashboard service if analytics seems wrong
      let enhancedOverallMetrics = overallMetrics.success ? overallMetrics.metrics : {
        totalRevenue: 0,
        totalBookings: 0,
        totalRooms: 0,
        activeBookings: 0,
        availableRooms: 0,
        pendingPayments: 0,
        verifiedPayments: 0
      };

      // If all rooms are showing as available but we have revenue/bookings, 
      // the API might be wrong - get real room data
      if (enhancedOverallMetrics.availableRooms === enhancedOverallMetrics.totalRooms && 
          enhancedOverallMetrics.totalRooms > 0 && 
          (enhancedOverallMetrics.totalRevenue > 0 || enhancedOverallMetrics.activeBookings > 0)) {
        
        console.log('Analytics API shows all rooms available but has revenue/bookings - checking real room data');
        
        try {
          // Import dashboard service dynamically to avoid circular dependency
          const dashboardService = (await import('./dashboardService')).default;
          const realRoomData = await dashboardService.getDashboardData();
          
          if (realRoomData.totalRooms > 0) {
            console.log('Using real room occupancy data from dashboard service');
            enhancedOverallMetrics = {
              ...enhancedOverallMetrics,
              totalRooms: realRoomData.totalRooms,
              availableRooms: realRoomData.availableRooms,
              // Keep other metrics from analytics API
            };
          }
        } catch (error) {
          console.warn('Failed to get real room data, using analytics API data:', error);
        }
      }

      // Calculate additional derived metrics
      const currentDate = new Date();
      const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const lastMonthAnalytics = await analyticsService.getMonthlyAnalytics(
        lastMonth.getFullYear(), 
        lastMonth.getMonth() + 1
      );

      // Calculate month-over-month growth
      const currentRevenue = enhancedMonthlyAnalytics.monthlyRevenue;
      const lastRevenue = lastMonthAnalytics.success ? lastMonthAnalytics.analytics.monthlyRevenue : 0;
      const monthlyGrowth = lastRevenue > 0 
        ? ((currentRevenue - lastRevenue) / lastRevenue * 100).toFixed(1)
        : 0;

      const currentBookings = enhancedMonthlyAnalytics.monthlyBookings;
      const lastBookings = lastMonthAnalytics.success ? lastMonthAnalytics.analytics.monthlyBookings : 0;
      const bookingsGrowth = lastBookings > 0 
        ? ((currentBookings - lastBookings) / lastBookings * 100).toFixed(1)
        : 0;

      return {
        success: true,
        overall: enhancedOverallMetrics,
        daily: dailyAnalytics.success ? dailyAnalytics.analytics : {
          dailyRevenue: 0,
          dailyBookings: 0,
          dailyPayments: 0
        },
        monthly: enhancedMonthlyAnalytics,
        revenueByMethod: revenueByMethod.success ? revenueByMethod.revenue : [],
        trends: {
          monthlyGrowth: parseFloat(monthlyGrowth),
          bookingsGrowth: parseFloat(bookingsGrowth),
          dailyAverage: currentRevenue > 0 
            ? currentRevenue / new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
            : 0
        },
        errors: {
          overallError: !overallMetrics.success ? overallMetrics.error : null,
          dailyError: !dailyAnalytics.success ? dailyAnalytics.error : null,
          monthlyError: !monthlyAnalytics.success ? monthlyAnalytics.error : null,
          revenueError: !revenueByMethod.success ? revenueByMethod.error : null
        }
      };
    } catch (error) {
      console.error('Get dashboard analytics error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch dashboard analytics',
        overall: {
          totalRevenue: 0,
          totalBookings: 0,
          totalRooms: 0,
          activeBookings: 0,
          availableRooms: 0,
          pendingPayments: 0,
          verifiedPayments: 0
        },
        daily: null,
        monthly: null,
        revenueByMethod: [],
        trends: null,
        errors: {
          overallError: error.message || 'Failed to fetch dashboard analytics'
        }
      };
    }
  },

  /**
   * Get analytics for a specific date range (simplified version)
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise<Object>} Analytics data for the date range
   */
  getDateRangeAnalytics: async (startDate, endDate) => {
    try {
      // Get revenue by method for the date range
      const revenueData = await analyticsService.getRevenueByMethod(startDate, endDate);
      
      if (!revenueData.success) {
        throw new Error(revenueData.error);
      }

      return {
        success: true,
        dateRange: { startDate, endDate },
        revenue: revenueData.revenue,
        summary: {
          totalRevenue: revenueData.revenue.reduce((sum, method) => sum + (method.amount || 0), 0),
          totalTransactions: revenueData.revenue.reduce((sum, method) => sum + (method.count || 0), 0),
          paymentMethods: revenueData.revenue.length
        }
      };
    } catch (error) {
      console.error('Get date range analytics error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch date range analytics',
        dateRange: { startDate, endDate },
        revenue: [],
        summary: null
      };
    }
  },

  /**
   * Get analytics for multiple months for trend analysis
   * @param {number} monthsBack - Number of months back to fetch (default: 6)
   * @returns {Promise<Object>} Multi-month trend data
   */
  getMonthlyTrends: async (monthsBack = 6) => {
    try {
      const currentDate = new Date();
      const monthlyData = [];

      // Fetch data for each month
      for (let i = monthsBack - 1; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        try {
          const monthAnalytics = await analyticsService.getMonthlyAnalytics(
            date.getFullYear(), 
            date.getMonth() + 1
          );
          
          if (monthAnalytics.success) {
            monthlyData.push({
              year: date.getFullYear(),
              month: date.getMonth() + 1,
              monthName: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
              ...monthAnalytics.analytics
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch analytics for ${date.getFullYear()}-${date.getMonth() + 1}:`, error);
        }
      }

      return {
        success: true,
        trends: monthlyData,
        summary: {
          averageMonthlyRevenue: monthlyData.length > 0 
            ? monthlyData.reduce((sum, month) => sum + (month.monthlyRevenue || 0), 0) / monthlyData.length 
            : 0,
          averageMonthlyBookings: monthlyData.length > 0 
            ? monthlyData.reduce((sum, month) => sum + (month.monthlyBookings || 0), 0) / monthlyData.length 
            : 0,
          totalRevenue: monthlyData.reduce((sum, month) => sum + (month.monthlyRevenue || 0), 0),
          totalBookings: monthlyData.reduce((sum, month) => sum + (month.monthlyBookings || 0), 0)
        }
      };
    } catch (error) {
      console.error('Get monthly trends error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch monthly trends',
        trends: [],
        summary: null
      };
    }
  },

  /**
   * Export analytics data in various formats
   * @param {string} type - Export type ('csv', 'excel', 'pdf')
   * @param {Object} params - Export parameters
   * @returns {Promise<Object>} Export result with download URL or blob
   */
  exportAnalytics: async (type = 'csv', params = {}) => {
    try {
      console.log(`Exporting analytics data as ${type}...`);
      
      // Get comprehensive analytics data
      const dashboardData = await analyticsService.getDashboardAnalytics();
      
      if (!dashboardData.success) {
        throw new Error('Failed to fetch analytics data for export');
      }

      // Prepare export data with enhanced metrics
      const exportData = {
        exportDate: new Date().toISOString(),
        period: params.period || 'current',
        overall: dashboardData.overall,
        daily: dashboardData.daily,
        monthly: dashboardData.monthly,
        revenueByMethod: dashboardData.revenueByMethod,
        trends: dashboardData.trends,
        // Add calculated metrics for better export
        calculatedMetrics: {
          occupancyRate: dashboardData.overall.totalRooms > 0 
            ? ((dashboardData.overall.totalRooms - dashboardData.overall.availableRooms) / dashboardData.overall.totalRooms * 100).toFixed(1)
            : 0,
          revenuePerRoom: dashboardData.overall.totalRooms > 0 
            ? (dashboardData.overall.totalRevenue / dashboardData.overall.totalRooms).toFixed(0)
            : 0,
          averageBookingValue: dashboardData.overall.totalBookings > 0 
            ? (dashboardData.overall.totalRevenue / dashboardData.overall.totalBookings).toFixed(0)
            : 0
        }
      };

      switch (type.toLowerCase()) {
        case 'csv':
          return analyticsService.exportToCSV(exportData, params);
        case 'excel':
          return analyticsService.exportToExcel(exportData, params);
        case 'pdf':
          return analyticsService.exportToPDF(exportData, params);
        default:
          throw new Error(`Unsupported export type: ${type}`);
      }
    } catch (error) {
      console.error('Export analytics error:', error);
      return {
        success: false,
        error: error.message || 'Failed to export analytics data'
      };
    }
  },

  /**
   * Export analytics to CSV format
   * @param {Object} data - Analytics data to export
   * @param {Object} params - Export parameters
   * @returns {Promise<Object>} CSV export result
   */
  exportToCSV: async (data, params = {}) => {
    try {
      // Create CSV content
      const csvRows = [];
      
      // Header
      csvRows.push('Analytics Report');
      csvRows.push(`Generated on: ${new Date(data.exportDate).toLocaleString('id-ID')}`);
      csvRows.push('');
      
      // Overall Metrics
      csvRows.push('Overall Metrics');
      csvRows.push('Metric,Value');
      csvRows.push(`Total Revenue,${data.overall.totalRevenue}`);
      csvRows.push(`Total Bookings,${data.overall.totalBookings}`);
      csvRows.push(`Total Rooms,${data.overall.totalRooms}`);
      csvRows.push(`Active Bookings,${data.overall.activeBookings}`);
      csvRows.push(`Available Rooms,${data.overall.availableRooms}`);
      csvRows.push(`Pending Payments,${data.overall.pendingPayments}`);
      csvRows.push(`Verified Payments,${data.overall.verifiedPayments}`);
      csvRows.push('');
      
      // Monthly Data
      if (data.monthly) {
        csvRows.push('Monthly Performance');
        csvRows.push('Metric,Value');
        csvRows.push(`Year,${data.monthly.year}`);
        csvRows.push(`Month,${data.monthly.month}`);
        csvRows.push(`Monthly Revenue,${data.monthly.monthlyRevenue}`);
        csvRows.push(`Monthly Bookings,${data.monthly.monthlyBookings}`);
        csvRows.push(`Monthly Payments,${data.monthly.monthlyPayments}`);
        csvRows.push('');
      }
      
      // Daily Data
      if (data.daily) {
        csvRows.push('Daily Performance');
        csvRows.push('Metric,Value');
        csvRows.push(`Daily Revenue,${data.daily.dailyRevenue}`);
        csvRows.push(`Daily Bookings,${data.daily.dailyBookings}`);
        csvRows.push(`Daily Payments,${data.daily.dailyPayments}`);
        csvRows.push('');
      }
      
      // Revenue by Method
      if (data.revenueByMethod && data.revenueByMethod.length > 0) {
        csvRows.push('Revenue by Payment Method');
        csvRows.push('Payment Method,Amount,Transaction Count');
        data.revenueByMethod.forEach(method => {
          csvRows.push(`${method.paymentMethod},${method.amount},${method.count}`);
        });
        csvRows.push('');
      }
      
      // Trends
      if (data.trends) {
        csvRows.push('Trends Analysis');
        csvRows.push('Metric,Value');
        csvRows.push(`Monthly Growth,${data.trends.monthlyGrowth}%`);
        csvRows.push(`Bookings Growth,${data.trends.bookingsGrowth}%`);
        csvRows.push(`Daily Average Revenue,${data.trends.dailyAverage}`);
      }
      
      // Create CSV blob
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Create download URL
      const url = window.URL.createObjectURL(blob);
      const fileName = `analytics_report_${new Date().toISOString().split('T')[0]}.csv`;
      
      return {
        success: true,
        blob,
        url,
        fileName,
        contentType: 'text/csv'
      };
    } catch (error) {
      console.error('CSV export error:', error);
      return {
        success: false,
        error: error.message || 'Failed to export CSV'
      };
    }
  },

  /**
   * Export analytics to Excel format (simplified CSV with .xlsx extension)
   * @param {Object} data - Analytics data to export
   * @param {Object} params - Export parameters
   * @returns {Promise<Object>} Excel export result
   */
  exportToExcel: async (data, params = {}) => {
    try {
      // For now, use CSV format with xlsx extension
      // In a real implementation, you'd use a library like xlsx or exceljs
      const csvResult = await analyticsService.exportToCSV(data, params);
      
      if (!csvResult.success) {
        throw new Error(csvResult.error);
      }
      
      const fileName = `analytics_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      return {
        ...csvResult,
        fileName,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    } catch (error) {
      console.error('Excel export error:', error);
      return {
        success: false,
        error: error.message || 'Failed to export Excel'
      };
    }
  },

  /**
   * Export analytics to PDF format
   * @param {Object} data - Analytics data to export
   * @param {Object} params - Export parameters
   * @returns {Promise<Object>} PDF export result
   */
  exportToPDF: async (data, params = {}) => {
    try {
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 30px; }
            .section h2 { color: #2D3748; border-bottom: 2px solid #E2E8F0; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #E2E8F0; padding: 8px; text-align: left; }
            th { background-color: #F7FAFC; font-weight: bold; }
            .metric-value { font-weight: bold; color: #2B6CB0; }
            .currency { color: #38A169; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Analytics Report</h1>
            <p>Generated on: ${new Date(data.exportDate).toLocaleString('id-ID')}</p>
          </div>
          
          <div class="section">
            <h2>Overall Metrics</h2>
            <table>
              <tr><th>Metric</th><th>Value</th></tr>
              <tr><td>Total Revenue</td><td class="metric-value currency">Rp ${data.overall.totalRevenue.toLocaleString('id-ID')}</td></tr>
              <tr><td>Total Bookings</td><td class="metric-value">${data.overall.totalBookings}</td></tr>
              <tr><td>Total Rooms</td><td class="metric-value">${data.overall.totalRooms}</td></tr>
              <tr><td>Active Bookings</td><td class="metric-value">${data.overall.activeBookings}</td></tr>
              <tr><td>Available Rooms</td><td class="metric-value">${data.overall.availableRooms}</td></tr>
              <tr><td>Pending Payments</td><td class="metric-value">${data.overall.pendingPayments}</td></tr>
              <tr><td>Verified Payments</td><td class="metric-value">${data.overall.verifiedPayments}</td></tr>
            </table>
          </div>
          
          ${data.monthly ? `
          <div class="section">
            <h2>Monthly Performance (${data.monthly.month}/${data.monthly.year})</h2>
            <table>
              <tr><th>Metric</th><th>Value</th></tr>
              <tr><td>Monthly Revenue</td><td class="metric-value currency">Rp ${data.monthly.monthlyRevenue.toLocaleString('id-ID')}</td></tr>
              <tr><td>Monthly Bookings</td><td class="metric-value">${data.monthly.monthlyBookings}</td></tr>
              <tr><td>Monthly Payments</td><td class="metric-value">${data.monthly.monthlyPayments}</td></tr>
            </table>
          </div>
          ` : ''}
          
          ${data.daily ? `
          <div class="section">
            <h2>Daily Performance</h2>
            <table>
              <tr><th>Metric</th><th>Value</th></tr>
              <tr><td>Daily Revenue</td><td class="metric-value currency">Rp ${data.daily.dailyRevenue.toLocaleString('id-ID')}</td></tr>
              <tr><td>Daily Bookings</td><td class="metric-value">${data.daily.dailyBookings}</td></tr>
              <tr><td>Daily Payments</td><td class="metric-value">${data.daily.dailyPayments}</td></tr>
            </table>
          </div>
          ` : ''}
          
          ${data.revenueByMethod && data.revenueByMethod.length > 0 ? `
          <div class="section">
            <h2>Revenue by Payment Method</h2>
            <table>
              <tr><th>Payment Method</th><th>Amount</th><th>Transactions</th></tr>
              ${data.revenueByMethod.map(method => `
                <tr>
                  <td>${method.paymentMethod}</td>
                  <td class="currency">Rp ${method.amount.toLocaleString('id-ID')}</td>
                  <td>${method.count}</td>
                </tr>
              `).join('')}
            </table>
          </div>
          ` : ''}
          
          ${data.trends ? `
          <div class="section">
            <h2>Trends Analysis</h2>
            <table>
              <tr><th>Metric</th><th>Value</th></tr>
              <tr><td>Monthly Growth</td><td class="metric-value">${data.trends.monthlyGrowth}%</td></tr>
              <tr><td>Bookings Growth</td><td class="metric-value">${data.trends.bookingsGrowth}%</td></tr>
              <tr><td>Daily Average Revenue</td><td class="metric-value currency">Rp ${data.trends.dailyAverage.toLocaleString('id-ID')}</td></tr>
            </table>
          </div>
          ` : ''}
        </body>
        </html>
      `;
      
      // Create HTML blob (browser will handle PDF conversion via print)
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const fileName = `analytics_report_${new Date().toISOString().split('T')[0]}.html`;
      
      return {
        success: true,
        blob,
        url,
        fileName,
        contentType: 'text/html',
        htmlContent // Include HTML content for PDF conversion
      };
    } catch (error) {
      console.error('PDF export error:', error);
      return {
        success: false,
        error: error.message || 'Failed to export PDF'
      };
    }
  },

  /**
   * Export comprehensive analytics report with all formats
   * @param {Object} params - Export parameters
   * @returns {Promise<Object>} Comprehensive export result
   */
  exportComprehensive: async (params = {}) => {
    try {
      console.log('Creating comprehensive analytics export...');
      
      // Get comprehensive analytics data
      const dashboardData = await analyticsService.getDashboardAnalytics();
      
      if (!dashboardData.success) {
        throw new Error('Failed to fetch analytics data for comprehensive export');
      }

      // Get additional trend data
      const monthlyTrends = await analyticsService.getMonthlyTrends(6);
      
      // Prepare comprehensive export data
      const exportData = {
        exportDate: new Date().toISOString(),
        period: params.period || 'comprehensive',
        overall: dashboardData.overall,
        daily: dashboardData.daily,
        monthly: dashboardData.monthly,
        revenueByMethod: dashboardData.revenueByMethod,
        trends: dashboardData.trends,
        monthlyTrends: monthlyTrends.success ? monthlyTrends.trends : []
      };

      // Create comprehensive CSV with all data
      const csvRows = [];
      
      // Header
      csvRows.push('COMPREHENSIVE ANALYTICS REPORT');
      csvRows.push(`Generated on: ${new Date(exportData.exportDate).toLocaleString('id-ID')}`);
      csvRows.push(`Report Period: ${exportData.period}`);
      csvRows.push('=====================================');
      csvRows.push('');
      
      // Executive Summary
      csvRows.push('EXECUTIVE SUMMARY');
      csvRows.push('================');
      const occupancyRate = exportData.overall.totalRooms > 0 
        ? ((exportData.overall.totalRooms - exportData.overall.availableRooms) / exportData.overall.totalRooms * 100).toFixed(1)
        : 0;
      csvRows.push(`Overall Performance Score: ${((exportData.trends?.monthlyGrowth || 0) + (exportData.trends?.bookingsGrowth || 0) + parseFloat(occupancyRate)) / 3}%`);
      csvRows.push(`Room Occupancy Rate: ${occupancyRate}%`);
      csvRows.push(`Monthly Growth Rate: ${exportData.trends?.monthlyGrowth || 0}%`);
      csvRows.push(`Bookings Growth Rate: ${exportData.trends?.bookingsGrowth || 0}%`);
      csvRows.push('');
      
      // Detailed Overall Metrics
      csvRows.push('OVERALL METRICS');
      csvRows.push('===============');
      csvRows.push('Metric,Value,Description');
      csvRows.push(`Total Revenue,${exportData.overall.totalRevenue},Total revenue from all verified payments`);
      csvRows.push(`Total Bookings,${exportData.overall.totalBookings},Total number of bookings in the system`);
      csvRows.push(`Total Rooms,${exportData.overall.totalRooms},Total rooms available in the system`);
      csvRows.push(`Active Bookings,${exportData.overall.activeBookings},Currently active bookings`);
      csvRows.push(`Available Rooms,${exportData.overall.availableRooms},Rooms currently available for booking`);
      csvRows.push(`Pending Payments,${exportData.overall.pendingPayments},Payments awaiting verification`);
      csvRows.push(`Verified Payments,${exportData.overall.verifiedPayments},Successfully verified payments`);
      csvRows.push('');
      
      // Monthly Performance Details
      if (exportData.monthly) {
        csvRows.push('MONTHLY PERFORMANCE');
        csvRows.push('==================');
        csvRows.push(`Analysis Period: ${exportData.monthly.month}/${exportData.monthly.year}`);
        csvRows.push('Metric,Value,Growth Rate');
        csvRows.push(`Monthly Revenue,${exportData.monthly.monthlyRevenue},${exportData.trends?.monthlyGrowth || 0}%`);
        csvRows.push(`Monthly Bookings,${exportData.monthly.monthlyBookings},${exportData.trends?.bookingsGrowth || 0}%`);
        csvRows.push(`Monthly Payments,${exportData.monthly.monthlyPayments},N/A`);
        csvRows.push('');
      }
      
      // Daily Performance Details
      if (exportData.daily) {
        csvRows.push('DAILY PERFORMANCE');
        csvRows.push('================');
        csvRows.push(`Analysis Date: ${exportData.daily.date || 'Today'}`);
        csvRows.push('Metric,Value,Percentage of Monthly Target');
        const dailyToMonthlyRevenue = exportData.monthly?.monthlyRevenue > 0 
          ? ((exportData.daily.dailyRevenue / exportData.monthly.monthlyRevenue) * 100).toFixed(1)
          : 0;
        const dailyToMonthlyBookings = exportData.monthly?.monthlyBookings > 0 
          ? ((exportData.daily.dailyBookings / exportData.monthly.monthlyBookings) * 100).toFixed(1)
          : 0;
        csvRows.push(`Daily Revenue,${exportData.daily.dailyRevenue},${dailyToMonthlyRevenue}%`);
        csvRows.push(`Daily Bookings,${exportData.daily.dailyBookings},${dailyToMonthlyBookings}%`);
        csvRows.push(`Daily Payments,${exportData.daily.dailyPayments},N/A`);
        csvRows.push('');
      }
      
      // Revenue Analysis by Payment Method
      if (exportData.revenueByMethod && exportData.revenueByMethod.length > 0) {
        csvRows.push('REVENUE ANALYSIS BY PAYMENT METHOD');
        csvRows.push('=================================');
        const totalRevenue = exportData.revenueByMethod.reduce((sum, method) => sum + method.amount, 0);
        csvRows.push('Payment Method,Amount,Transactions,Percentage,Average per Transaction');
        exportData.revenueByMethod.forEach(method => {
          const percentage = totalRevenue > 0 ? ((method.amount / totalRevenue) * 100).toFixed(1) : 0;
          const average = method.count > 0 ? (method.amount / method.count).toFixed(0) : 0;
          csvRows.push(`${method.paymentMethod},${method.amount},${method.count},${percentage}%,${average}`);
        });
        csvRows.push(`TOTAL,${totalRevenue},${exportData.revenueByMethod.reduce((sum, method) => sum + method.count, 0)},100.0%,${totalRevenue > 0 ? (totalRevenue / exportData.revenueByMethod.reduce((sum, method) => sum + method.count, 0)).toFixed(0) : 0}`);
        csvRows.push('');
      }
      
      // Monthly Trends Analysis
      if (exportData.monthlyTrends && exportData.monthlyTrends.length > 0) {
        csvRows.push('MONTHLY TRENDS ANALYSIS (LAST 6 MONTHS)');
        csvRows.push('======================================');
        csvRows.push('Month,Revenue,Bookings,Payments,Revenue Growth,Booking Growth');
        
        exportData.monthlyTrends.forEach((month, index) => {
          const prevMonth = index > 0 ? exportData.monthlyTrends[index - 1] : null;
          const revenueGrowth = prevMonth && prevMonth.monthlyRevenue > 0 
            ? (((month.monthlyRevenue - prevMonth.monthlyRevenue) / prevMonth.monthlyRevenue) * 100).toFixed(1)
            : '0.0';
          const bookingGrowth = prevMonth && prevMonth.monthlyBookings > 0 
            ? (((month.monthlyBookings - prevMonth.monthlyBookings) / prevMonth.monthlyBookings) * 100).toFixed(1)
            : '0.0';
          
          csvRows.push(`${month.monthName},${month.monthlyRevenue},${month.monthlyBookings},${month.monthlyPayments},${revenueGrowth}%,${bookingGrowth}%`);
        });
        csvRows.push('');
      }
      
      // Key Performance Indicators
      csvRows.push('KEY PERFORMANCE INDICATORS');
      csvRows.push('==========================');
      csvRows.push('KPI,Value,Status,Target,Achievement');
      
      // Revenue per available room
      const revenuePerRoom = exportData.overall.totalRooms > 0 
        ? (exportData.overall.totalRevenue / exportData.overall.totalRooms).toFixed(0)
        : 0;
      
      // Booking conversion rate (active bookings vs total rooms)
      const bookingRate = exportData.overall.totalRooms > 0 
        ? ((exportData.overall.activeBookings / exportData.overall.totalRooms) * 100).toFixed(1)
        : 0;
      
      // Payment verification rate
      const verificationRate = (exportData.overall.pendingPayments + exportData.overall.verifiedPayments) > 0 
        ? ((exportData.overall.verifiedPayments / (exportData.overall.pendingPayments + exportData.overall.verifiedPayments)) * 100).toFixed(1)
        : 0;
      
      csvRows.push(`Revenue per Room,Rp ${revenuePerRoom},${revenuePerRoom > 150000 ? 'Good' : 'Needs Improvement'},Rp 150000,${revenuePerRoom > 150000 ? '✓' : '✗'}`);
      csvRows.push(`Occupancy Rate,${occupancyRate}%,${occupancyRate > 80 ? 'Excellent' : occupancyRate > 60 ? 'Good' : 'Needs Improvement'},80%,${occupancyRate > 80 ? '✓' : '✗'}`);
      csvRows.push(`Booking Rate,${bookingRate}%,${bookingRate > 70 ? 'Good' : 'Needs Improvement'},70%,${bookingRate > 70 ? '✓' : '✗'}`);
      csvRows.push(`Payment Verification Rate,${verificationRate}%,${verificationRate > 95 ? 'Excellent' : verificationRate > 85 ? 'Good' : 'Needs Improvement'},95%,${verificationRate > 95 ? '✓' : '✗'}`);
      csvRows.push(`Monthly Growth Rate,${exportData.trends?.monthlyGrowth || 0}%,${(exportData.trends?.monthlyGrowth || 0) > 5 ? 'Good' : 'Stable'},5%,${(exportData.trends?.monthlyGrowth || 0) > 5 ? '✓' : '○'}`);
      csvRows.push('');
      
      // Recommendations
      csvRows.push('RECOMMENDATIONS');
      csvRows.push('===============');
      
      const recommendations = [];
      
      if (occupancyRate < 60) {
        recommendations.push('Increase marketing efforts to improve room occupancy rate');
      }
      if (verificationRate < 90) {
        recommendations.push('Streamline payment verification process to reduce pending payments');
      }
      if ((exportData.trends?.monthlyGrowth || 0) < 0) {
        recommendations.push('Analyze market trends and adjust pricing strategy to reverse negative growth');
      }
      if (revenuePerRoom < 150000) {
        recommendations.push('Consider room rate optimization to increase revenue per room');
      }
      if (exportData.overall.availableRooms > exportData.overall.totalRooms * 0.5) {
        recommendations.push('High room availability suggests need for better demand generation');
      }
      
      if (recommendations.length === 0) {
        recommendations.push('Performance is within target ranges - continue current strategies');
        recommendations.push('Monitor trends closely for early indicators of changes');
      }
      
      recommendations.forEach((rec, index) => {
        csvRows.push(`${index + 1}. ${rec}`);
      });
      csvRows.push('');
      
      // Footer
      csvRows.push('=====================================');
      csvRows.push('Report generated by Rusunawa Analytics System');
      csvRows.push(`Data as of: ${new Date().toLocaleString('id-ID')}`);
      csvRows.push('For questions about this report, contact the administration team');
      
      // Create comprehensive CSV
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const fileName = `comprehensive_analytics_report_${new Date().toISOString().split('T')[0]}.csv`;
      
      return {
        success: true,
        blob,
        url,
        fileName,
        contentType: 'text/csv',
        recordCount: csvRows.length,
        dataPoints: {
          overallMetrics: 7,
          monthlyTrends: exportData.monthlyTrends.length,
          paymentMethods: exportData.revenueByMethod.length,
          kpis: 5,
          recommendations: recommendations.length
        }
      };
    } catch (error) {
      console.error('Comprehensive export error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create comprehensive export'
      };
    }
  },

  /**
   * Get invoices data for accurate revenue calculation
   * @returns {Promise<Object>} Invoices data
   */
  getInvoicesData: async () => {
    try {
      const response = await api.get('/invoices');
      return {
        success: true,
        data: response.data,
        invoices: response.data.invoices || []
      };
    } catch (error) {
      console.error('Get invoices data error:', error);
      return {
        success: false,
        error: error.response?.data?.status?.message || error.message || 'Failed to fetch invoices',
        invoices: []
      };
    }
  },

  /**
   * Calculate accurate monthly revenue from invoices
   * @param {Array} invoices - Array of invoice objects
   * @param {number} year - Target year
   * @param {number} month - Target month (1-12)
   * @returns {Object} Calculated monthly revenue data
   */
  calculateMonthlyRevenueFromInvoices: (invoices, year = null, month = null) => {
    const targetYear = year || new Date().getFullYear();
    const targetMonth = month || (new Date().getMonth() + 1);
    
    console.log(`Calculating monthly revenue for ${targetYear}-${targetMonth} from ${invoices.length} invoices`);
    
    let monthlyRevenue = 0;
    let monthlyPayments = 0;
    let paidInvoices = 0;
    let unpaidInvoices = 0;
    
    invoices.forEach(invoice => {
      const createdDate = new Date(invoice.createdAt);
      const paidDate = invoice.paidAt ? new Date(invoice.paidAt) : null;
      
      // Check if invoice was created in the target month
      if (createdDate.getFullYear() === targetYear && 
          (createdDate.getMonth() + 1) === targetMonth) {
        
        // Count all invoices created in the month
        monthlyPayments++;
        
        // Only count revenue from paid invoices
        if (invoice.status === 'paid' && paidDate) {
          monthlyRevenue += invoice.amount || invoice.totalAmount || 0;
          paidInvoices++;
          console.log(`Paid invoice ${invoice.invoiceId}: Rp ${invoice.amount} on ${paidDate.toISOString()}`);
        } else {
          unpaidInvoices++;
          console.log(`Unpaid invoice ${invoice.invoiceId}: Rp ${invoice.amount} (status: ${invoice.status})`);
        }
      }
    });
    
    console.log(`Monthly calculation result: Rp ${monthlyRevenue} from ${paidInvoices} paid invoices, ${unpaidInvoices} unpaid`);
    
    return {
      monthlyRevenue,
      monthlyPayments,
      paidInvoices,
      unpaidInvoices,
      year: targetYear,
      month: targetMonth
    };
  },

  /**
   * Get detailed revenue report from invoices
   * @param {number} year - Target year
   * @param {number} month - Target month (1-12)
   * @returns {Promise<Object>} Detailed revenue report
   */
  getDetailedRevenueReport: async (year = null, month = null) => {
    try {
      // Get invoices data
      const invoicesData = await analyticsService.getInvoicesData();
      
      if (!invoicesData.success) {
        throw new Error(invoicesData.error);
      }

      // Calculate monthly revenue from invoices
      const monthlyRevenue = analyticsService.calculateMonthlyRevenueFromInvoices(invoicesData.invoices, year, month);
      
      return {
        success: true,
        data: monthlyRevenue,
        report: {
          year: monthlyRevenue.year,
          month: monthlyRevenue.month,
          totalRevenue: monthlyRevenue.monthlyRevenue,
          totalInvoices: monthlyRevenue.monthlyPayments,
          paidInvoices: monthlyRevenue.paidInvoices,
          unpaidInvoices: monthlyRevenue.unpaidInvoices
        }
      };
    } catch (error) {
      console.error('Get detailed revenue report error:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate detailed revenue report',
        report: null
      };
    }
  }
};

export default analyticsService;
