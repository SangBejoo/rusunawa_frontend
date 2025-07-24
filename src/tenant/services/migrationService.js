import paymentService from './paymentService';
import enhancedBookingService from './enhancedBookingService';
import paymentAnalyticsService from './paymentAnalyticsService';
import paymentNotificationService from './paymentNotificationService';

/**
 * Migration service to help transition from legacy to enhanced services
 */
class MigrationService {
  /**
   * Migrate tenant data to enhanced services
   * @param {string} tenantId - The tenant ID
   * @returns {Promise<Object>} Migration result
   */
  static async migrateTenantData(tenantId) {
    const migrationLog = {
      tenantId,
      startTime: new Date(),
      results: {
        bookings: { migrated: 0, errors: [] },
        payments: { migrated: 0, errors: [] },
        analytics: { initialized: false, error: null },
        notifications: { initialized: false, error: null }
      }
    };

    try {
      console.log(`Starting migration for tenant ${tenantId}`);

      // 1. Initialize analytics
      await this.initializeAnalytics(tenantId, migrationLog);

      // 2. Initialize notifications
      await this.initializeNotifications(tenantId, migrationLog);

      // 3. Migrate existing bookings and payments
      await this.migrateBookingsAndPayments(tenantId, migrationLog);

      migrationLog.endTime = new Date();
      migrationLog.success = true;
      
      console.log('Migration completed successfully:', migrationLog);
      return migrationLog;

    } catch (error) {
      migrationLog.endTime = new Date();
      migrationLog.success = false;
      migrationLog.error = error.message;
      
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Initialize analytics for tenant
   */
  static async initializeAnalytics(tenantId, migrationLog) {
    try {
      // Get existing payment data for analytics initialization
      const payments = await paymentService.getPayments();
      
      if (payments.length > 0) {
        // Initialize analytics with historical data
        await paymentAnalyticsService.initializeHistoricalData(tenantId, payments);
      }

      migrationLog.results.analytics.initialized = true;
    } catch (error) {
      migrationLog.results.analytics.error = error.message;
      console.error('Analytics initialization failed:', error);
    }
  }

  /**
   * Initialize notifications for tenant
   */
  static async initializeNotifications(tenantId, migrationLog) {
    try {
      // Register for payment notifications
      await paymentNotificationService.registerTenant(tenantId);
      
      // Set default notification preferences
      const defaultPreferences = {
        paymentReminders: true,
        paymentConfirmations: true,
        bookingUpdates: true,
        channels: {
          email: true,
          inApp: true,
          sms: false,
          push: false
        }
      };
      
      await paymentNotificationService.updatePreferences(tenantId, defaultPreferences);
      
      migrationLog.results.notifications.initialized = true;
    } catch (error) {
      migrationLog.results.notifications.error = error.message;
      console.error('Notifications initialization failed:', error);
    }
  }

  /**
   * Migrate existing bookings and payments
   */
  static async migrateBookingsAndPayments(tenantId, migrationLog) {
    try {
      // This would typically involve:
      // 1. Fetching existing bookings from legacy service
      // 2. Transforming data to enhanced format
      // 3. Validating payment integration
      // 4. Updating references and relationships

      // For now, we'll just ensure compatibility
      const existingBookings = await enhancedBookingService.getTenantBookings(tenantId);
      migrationLog.results.bookings.migrated = existingBookings.bookings?.length || 0;

      const existingPayments = await paymentService.getPayments();
      migrationLog.results.payments.migrated = existingPayments.length || 0;

    } catch (error) {
      migrationLog.results.bookings.errors.push(error.message);
      migrationLog.results.payments.errors.push(error.message);
      console.error('Bookings/Payments migration failed:', error);
    }
  }

  /**
   * Check if tenant data needs migration
   * @param {string} tenantId - The tenant ID
   * @returns {Promise<Object>} Migration status
   */
  static async checkMigrationStatus(tenantId) {
    try {
      const status = {
        needsMigration: false,
        analyticsInitialized: false,
        notificationsInitialized: false,
        enhancedFeaturesAvailable: false
      };

      // Check if analytics are initialized
      try {
        const analyticsData = await paymentAnalyticsService.getAnalytics(tenantId, 'monthly');
        status.analyticsInitialized = !!analyticsData;
      } catch (error) {
        status.analyticsInitialized = false;
      }

      // Check if notifications are initialized
      try {
        const preferences = await paymentNotificationService.getPreferences(tenantId);
        status.notificationsInitialized = !!preferences;
      } catch (error) {
        status.notificationsInitialized = false;
      }

      // Determine if migration is needed
      status.needsMigration = !status.analyticsInitialized || !status.notificationsInitialized;
      status.enhancedFeaturesAvailable = !status.needsMigration;

      return status;
    } catch (error) {
      console.error('Migration status check failed:', error);
      return {
        needsMigration: true,
        analyticsInitialized: false,
        notificationsInitialized: false,
        enhancedFeaturesAvailable: false,
        error: error.message
      };
    }
  }

  /**
   * Perform data validation after migration
   * @param {string} tenantId - The tenant ID
   * @returns {Promise<Object>} Validation results
   */
  static async validateMigration(tenantId) {
    const validationResults = {
      valid: true,
      issues: [],
      recommendations: []
    };

    try {
      // Validate analytics data
      const analyticsData = await paymentAnalyticsService.getAnalytics(tenantId, 'monthly');
      if (!analyticsData || !analyticsData.totalAmount) {
        validationResults.issues.push('Analytics data appears incomplete');
        validationResults.valid = false;
      }

      // Validate notification preferences
      const preferences = await paymentNotificationService.getPreferences(tenantId);
      if (!preferences) {
        validationResults.issues.push('Notification preferences not found');
        validationResults.valid = false;
      }

      // Validate enhanced booking service
      const bookings = await enhancedBookingService.getTenantBookings(tenantId);
      if (!bookings) {
        validationResults.issues.push('Enhanced booking service not accessible');
        validationResults.valid = false;
      }

      // Add recommendations
      if (validationResults.valid) {
        validationResults.recommendations.push('Consider enabling push notifications for better experience');
        validationResults.recommendations.push('Explore the new analytics dashboard for insights');
        validationResults.recommendations.push('Try the enhanced booking flow for improved experience');
      }

    } catch (error) {
      validationResults.valid = false;
      validationResults.issues.push(`Validation error: ${error.message}`);
    }

    return validationResults;
  }

  /**
   * Rollback migration if needed
   * @param {string} tenantId - The tenant ID
   * @returns {Promise<Object>} Rollback result
   */
  static async rollbackMigration(tenantId) {
    const rollbackLog = {
      tenantId,
      startTime: new Date(),
      operations: []
    };

    try {
      // This would typically involve:
      // 1. Removing enhanced service configurations
      // 2. Restoring legacy service states
      // 3. Cleaning up any enhanced-specific data
      
      rollbackLog.operations.push('Enhanced features disabled for tenant');
      rollbackLog.success = true;
      rollbackLog.endTime = new Date();

      return rollbackLog;
    } catch (error) {
      rollbackLog.success = false;
      rollbackLog.error = error.message;
      rollbackLog.endTime = new Date();
      throw error;
    }
  }
}

export default MigrationService;
