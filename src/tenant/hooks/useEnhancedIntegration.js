import { useEffect, useState } from 'react';
import { useTenantAuth } from '../context/tenantAuthContext';
import { useEnhancedPayments } from './useEnhancedPayments';
import MigrationService from '../services/migrationService';
import paymentNotificationService from '../services/paymentNotificationService';

/**
 * Comprehensive integration hook for enhanced services
 * This hook manages the integration between all enhanced services
 */
export const useEnhancedIntegration = (options = {}) => {
  const { tenant } = useTenantAuth();
  const [integrationStatus, setIntegrationStatus] = useState({
    isInitialized: false,
    migrationComplete: false,
    servicesOnline: false,
    error: null
  });

  const {
    paymentStats,
    recentPayments,
    notifications,
    isProcessing: paymentsProcessing,
    error: paymentsError
  } = useEnhancedPayments({
    tenantId: tenant?.id,
    autoRefresh: options.autoRefresh ?? true,
    refreshInterval: options.refreshInterval ?? 30000
  });

  // Initialize enhanced services
  useEffect(() => {
    const initializeServices = async () => {
      if (!tenant?.id) return;

      try {
        setIntegrationStatus(prev => ({ ...prev, error: null }));

        // Check migration status
        const migrationStatus = await MigrationService.checkMigrationStatus(tenant.id);
        
        if (migrationStatus.needsMigration) {
          console.log('Migration needed, starting automatic migration...');
          await MigrationService.migrateTenantData(tenant.id);
        }

        // Validate services are working
        const validation = await MigrationService.validateMigration(tenant.id);
        
        setIntegrationStatus({
          isInitialized: true,
          migrationComplete: !migrationStatus.needsMigration,
          servicesOnline: validation.valid,
          error: validation.valid ? null : validation.issues.join(', ')
        });

        // Initialize notification listeners
        if (options.enableNotifications !== false) {
          await initializeNotificationListeners();
        }

      } catch (error) {
        console.error('Enhanced services initialization failed:', error);
        setIntegrationStatus(prev => ({
          ...prev,
          error: error.message,
          servicesOnline: false
        }));
      }
    };

    initializeServices();
  }, [tenant?.id, options.enableNotifications]);

  // Initialize notification listeners
  const initializeNotificationListeners = async () => {
    try {
      // Register for real-time payment updates
      paymentNotificationService.onPaymentStatusUpdate((data) => {
        console.log('Payment status updated:', data);
        // This would trigger UI updates
      });

      // Register for booking notifications
      paymentNotificationService.onBookingUpdate((data) => {
        console.log('Booking updated:', data);
        // This would trigger UI updates
      });

    } catch (error) {
      console.error('Notification listeners initialization failed:', error);
    }
  };

  // Service health check
  const checkServiceHealth = async () => {
    try {
      const status = await MigrationService.checkMigrationStatus(tenant?.id);
      setIntegrationStatus(prev => ({
        ...prev,
        servicesOnline: status.enhancedFeaturesAvailable,
        error: status.error || null
      }));
      return status;
    } catch (error) {
      setIntegrationStatus(prev => ({
        ...prev,
        servicesOnline: false,
        error: error.message
      }));
      throw error;
    }
  };

  // Force re-initialization
  const reinitialize = async () => {
    setIntegrationStatus({
      isInitialized: false,
      migrationComplete: false,
      servicesOnline: false,
      error: null
    });

    // Trigger re-initialization
    if (tenant?.id) {
      await MigrationService.migrateTenantData(tenant.id);
      await checkServiceHealth();
    }
  };

  return {
    // Integration status
    integrationStatus,
    
    // Payment data from enhanced payments hook
    paymentStats,
    recentPayments,
    notifications,
    
    // Processing states
    isProcessing: paymentsProcessing,
    
    // Errors
    error: integrationStatus.error || paymentsError,
    
    // Service management
    checkServiceHealth,
    reinitialize,
    
    // Computed states
    isReady: integrationStatus.isInitialized && integrationStatus.servicesOnline,
    needsAttention: !!integrationStatus.error || !integrationStatus.servicesOnline
  };
};

/**
 * Hook for component-level service integration
 */
export const useServiceIntegration = (serviceName, dependencies = []) => {
  const { tenant } = useTenantAuth();
  const [serviceStatus, setServiceStatus] = useState({
    isOnline: false,
    lastCheck: null,
    error: null
  });

  useEffect(() => {
    const checkService = async () => {
      if (!tenant?.id) return;

      try {
        // This would check specific service health
        // For now, we'll assume services are online if no errors
        setServiceStatus({
          isOnline: true,
          lastCheck: new Date(),
          error: null
        });
      } catch (error) {
        setServiceStatus({
          isOnline: false,
          lastCheck: new Date(),
          error: error.message
        });
      }
    };

    checkService();
  }, [tenant?.id, ...dependencies]);

  return serviceStatus;
};

/**
 * Hook for feature flag management
 */
export const useEnhancedFeatures = () => {
  const { tenant } = useTenantAuth();
  const [features, setFeatures] = useState({
    enhancedBooking: false,
    paymentAnalytics: false,
    realTimeNotifications: false,
    advancedDashboard: false
  });

  useEffect(() => {
    // This would typically fetch feature flags from backend
    // For now, enable all features for authenticated users
    if (tenant?.id) {
      setFeatures({
        enhancedBooking: true,
        paymentAnalytics: true,
        realTimeNotifications: true,
        advancedDashboard: true
      });
    }
  }, [tenant?.id]);

  const isFeatureEnabled = (featureName) => {
    return features[featureName] || false;
  };

  return {
    features,
    isFeatureEnabled
  };
};

export default useEnhancedIntegration;
