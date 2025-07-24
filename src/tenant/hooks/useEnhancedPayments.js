import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import paymentService from '../services/paymentService';
import paymentAnalyticsService from '../services/paymentAnalyticsService';
import paymentNotificationService from '../services/paymentNotificationService';
import { handlePaymentError } from '../utils/paymentErrorHandler';

/**
 * Enhanced hook for payment management with analytics and notifications
 * @param {Object} options - Hook configuration options
 * @returns {Object} Payment management state and functions
 */
export const useEnhancedPayments = (options = {}) => {
  const {
    autoRefresh = false,
    refreshInterval = 30000,
    enableAnalytics = true,
    enableNotifications = true,
    cacheEnabled = true
  } = options;

  const [payments, setPayments] = useState([]);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const toast = useToast();
  const refreshIntervalRef = useRef(null);
  const notificationUnsubscribeRef = useRef(null);

  // Initialize payment notifications
  useEffect(() => {
    if (enableNotifications) {
      initializeNotifications();
    }
    
    return () => {
      if (notificationUnsubscribeRef.current) {
        notificationUnsubscribeRef.current();
      }
    };
  }, [enableNotifications]);

  // Auto-refresh payments
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        refreshPayments();
      }, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);

  // Initialize notifications
  const initializeNotifications = useCallback(async () => {
    try {
      await paymentNotificationService.initialize();
      
      // Subscribe to payment notifications
      notificationUnsubscribeRef.current = paymentNotificationService.subscribe(
        'new_notification',
        (notification) => {
          if (notification.type.startsWith('payment_') || notification.type.startsWith('invoice_')) {
            refreshPayments();
          }
        }
      );
    } catch (error) {
      console.warn('Failed to initialize payment notifications:', error);
    }
  }, []);

  // Load payments with enhanced error handling
  const loadPayments = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await paymentService.getPayments(params);
      setPayments(response.payments || []);
      setLastUpdated(new Date());

      // Load analytics if enabled
      if (enableAnalytics) {
        try {
          const analyticsData = await paymentAnalyticsService.getPaymentAnalytics();
          setAnalytics(analyticsData);
        } catch (analyticsError) {
          console.warn('Failed to load payment analytics:', analyticsError);
        }
      }

    } catch (error) {
      const handledError = handlePaymentError(error, {
        context: { action: 'loadPayments' },
        customMessage: 'Failed to load payments. Please try again.'
      });
      setError(handledError.userMessage);
    } finally {
      setLoading(false);
    }
  }, [enableAnalytics]);

  // Refresh payments
  const refreshPayments = useCallback(async () => {
    if (!processing) {
      await loadPayments();
    }
  }, [loadPayments, processing]);

  // Create payment with enhanced tracking
  const createPayment = useCallback(async (paymentData) => {
    try {
      setProcessing(true);
      setError(null);

      const response = await paymentService.generateInvoiceWithMidtrans(paymentData);
      
      // Update local state
      if (response.invoice) {
        setCurrentPayment(response);
        await refreshPayments();
      }

      // Send notification
      if (enableNotifications) {
        await paymentNotificationService.sendNotification({
          type: 'invoice_created',
          title: 'Invoice Created',
          message: `Invoice ${response.invoice?.invoice_no} has been created successfully.`,
          data: response,
          immediate: true
        });
      }

      toast({
        title: 'Payment Created',
        description: 'Your payment has been created successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      return response;
    } catch (error) {
      const handledError = handlePaymentError(error, {
        context: { action: 'createPayment', paymentData },
        customMessage: 'Failed to create payment. Please try again.'
      });
      
      setError(handledError.userMessage);
      throw error;
    } finally {
      setProcessing(false);
    }
  }, [refreshPayments, enableNotifications, toast]);

  // Process Midtrans payment
  const processMidtransPayment = useCallback(async (invoiceData) => {
    try {
      setProcessing(true);
      setError(null);

      const response = await paymentService.generateInvoiceWithMidtrans(invoiceData);
      
      if (response.midtransToken && response.midtransRedirectUrl) {
        setCurrentPayment(response);
        return response;
      } else {
        throw new Error('Failed to generate Midtrans payment link');
      }
    } catch (error) {
      const handledError = handlePaymentError(error, {
        context: { action: 'processMidtransPayment', invoiceData },
        customMessage: 'Failed to process Midtrans payment. Please try again.'
      });
      
      setError(handledError.userMessage);
      throw error;
    } finally {
      setProcessing(false);
    }
  }, []);

  // Check payment status with notifications
  const checkPaymentStatus = useCallback(async (transactionId) => {
    try {
      const response = await paymentService.checkMidtransPaymentStatus(transactionId);
      
      if (response.payment) {
        const status = response.payment.status?.toLowerCase();
        
        // Send appropriate notification
        if (enableNotifications) {
          if (status === 'success' || status === 'settlement' || status === 'capture') {
            await paymentNotificationService.sendPaymentSuccessNotification({
              transactionId,
              amount: response.payment.amount,
              ...response.payment
            });
          } else if (status === 'failed' || status === 'deny' || status === 'cancel') {
            await paymentNotificationService.sendPaymentFailedNotification({
              transactionId,
              amount: response.payment.amount,
              ...response.payment
            }, response.payment.status_message || 'Payment processing failed');
          }
        }

        await refreshPayments();
      }

      return response;
    } catch (error) {
      const handledError = handlePaymentError(error, {
        context: { action: 'checkPaymentStatus', transactionId },
        showToast: false // Don't show toast for status checks
      });
      
      console.warn('Payment status check failed:', handledError.userMessage);
      return null;
    }
  }, [refreshPayments, enableNotifications]);

  // Upload payment proof
  const uploadPaymentProof = useCallback(async (paymentId, proofData) => {
    try {
      setProcessing(true);
      setError(null);

      const response = await paymentService.uploadPaymentProof(paymentId, proofData);
      
      // Send notification
      if (enableNotifications) {
        await paymentNotificationService.sendNotification({
          type: 'verification_required',
          title: 'Payment Proof Uploaded',
          message: 'Your payment proof has been uploaded and is awaiting verification.',
          data: { paymentId, ...response },
          immediate: true
        });
      }

      await refreshPayments();

      toast({
        title: 'Payment Proof Uploaded',
        description: 'Your payment proof has been uploaded successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      return response;
    } catch (error) {
      const handledError = handlePaymentError(error, {
        context: { action: 'uploadPaymentProof', paymentId },
        customMessage: 'Failed to upload payment proof. Please try again.'
      });
      
      setError(handledError.userMessage);
      throw error;
    } finally {
      setProcessing(false);
    }
  }, [refreshPayments, enableNotifications, toast]);

  // Add missing getPayment function to fetch payment details by ID
  const getPayment = useCallback(async (paymentId) => {
    try {
      const response = await paymentService.getPayment(paymentId);
      return response.payment;
    } catch (error) {
      handlePaymentError(error, {
        context: { action: 'getPayment', paymentId },
        customMessage: 'Failed to load payment details.'
      });
      return null;
    }
  }, []);

  // Download payment receipt
  const downloadReceipt = useCallback(async (paymentId) => {
    try {
      setProcessing(true);
      const blob = await paymentService.downloadReceipt(paymentId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Receipt Downloaded',
        description: 'Payment receipt has been downloaded successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      handlePaymentError(error, {
        context: { action: 'downloadReceipt', paymentId },
        customMessage: 'Failed to download receipt. Please try again.'
      });
    } finally {
      setProcessing(false);
    }
  }, [toast]);

  // Get payment statistics
  const getPaymentStats = useCallback(async () => {
    try {
      if (!enableAnalytics) return null;
      
      const stats = await paymentAnalyticsService.getPaymentAnalytics({
        period: 'last30days'
      });
      
      return stats;
    } catch (error) {
      console.warn('Failed to load payment statistics:', error);
      return null;
    }
  }, [enableAnalytics]);

  // Initial load
  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  return {
    // State
    payments,
    currentPayment,
    analytics,
    loading,
    processing,
    error,
    lastUpdated,

    // Functions
    loadPayments,
    refreshPayments,
    createPayment,
    processMidtransPayment,
    checkPaymentStatus,
    uploadPaymentProof,
    getPayment,
    downloadReceipt,
    getPaymentStats,

    // Utilities
    clearError: () => setError(null),
    setCurrentPayment
  };
};

/**
 * Hook for payment analytics management
 * @param {Object} options - Analytics options
 * @returns {Object} Analytics state and functions
 */
export const usePaymentAnalytics = (options = {}) => {
  const {
    period = 'last30days',
    autoRefresh = false,
    refreshInterval = 60000
  } = options;

  const [analytics, setAnalytics] = useState(null);
  const [successRate, setSuccessRate] = useState(null);
  const [methodComparison, setMethodComparison] = useState(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshIntervalRef = useRef(null);

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [analyticsData, successRateData, methodCompData, realTimeData] = await Promise.all([
        paymentAnalyticsService.getPaymentAnalytics({ period }),
        paymentAnalyticsService.getSuccessRateAnalytics({ period }),
        paymentAnalyticsService.getPaymentMethodComparison({ period }),
        paymentAnalyticsService.getRealTimeMetrics()
      ]);

      setAnalytics(analyticsData);
      setSuccessRate(successRateData);
      setMethodComparison(methodCompData);
      setRealTimeMetrics(realTimeData);
    } catch (error) {
      const handledError = handlePaymentError(error, {
        context: { action: 'loadAnalytics' },
        customMessage: 'Failed to load analytics data.'
      });
      setError(handledError.userMessage);
    } finally {
      setLoading(false);
    }
  }, [period]);

  // Export analytics
  const exportAnalytics = useCallback(async (format = 'pdf') => {
    try {
      const blob = await paymentAnalyticsService.exportAnalytics({
        format,
        reportType: 'comprehensive',
        dateRange: { period }
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${period}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return true;
    } catch (error) {
      handlePaymentError(error, {
        context: { action: 'exportAnalytics' },
        customMessage: 'Failed to export analytics.'
      });
      return false;
    }
  }, [period]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(loadAnalytics, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, loadAnalytics]);

  // Initial load
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);
  return {
    analytics,
    successRate,
    methodComparison,
    realTimeMetrics,
    loading,
    error,
    loadAnalytics,
    refreshAnalytics: loadAnalytics, // Alias for consistency
    exportAnalytics,
    clearError: () => setError(null)
  };
};

/**
 * Hook for payment notifications management
 * @param {Object} options - Notification options
 * @returns {Object} Notification state and functions
 */
export const usePaymentNotifications = (options = {}) => {
  const {
    autoMarkRead = false,
    maxNotifications = 50
  } = options;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState({});
  const [loading, setLoading] = useState(true);

  const unsubscribeRef = useRef(null);

  // Load notifications
  const loadNotifications = useCallback(() => {
    const stored = paymentNotificationService.getStoredNotifications();
    const limited = stored.slice(-maxNotifications);
    setNotifications(limited);
    setUnreadCount(limited.filter(n => !n.read).length);
  }, [maxNotifications]);

  // Initialize notifications
  useEffect(() => {
    const initialize = async () => {
      try {
        await paymentNotificationService.initialize();
        loadNotifications();
        
        // Subscribe to new notifications
        unsubscribeRef.current = paymentNotificationService.subscribe(
          'new_notification',
          (notification) => {
            loadNotifications();
          }
        );

        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
        setLoading(false);
      }
    };

    initialize();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [loadNotifications]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    paymentNotificationService.markAsRead(notificationId);
    loadNotifications();
  }, [loadNotifications]);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    paymentNotificationService.markAllAsRead();
    loadNotifications();
  }, [loadNotifications]);

  // Clear notifications
  const clearNotifications = useCallback((daysOld = 30) => {
    paymentNotificationService.clearOldNotifications(daysOld);
    loadNotifications();
  }, [loadNotifications]);

  // Update preferences
  const updatePreferences = useCallback(async (newPreferences) => {
    try {
      await paymentNotificationService.updatePreferences(newPreferences);
      setPreferences(newPreferences);
      return true;
    } catch (error) {
      handlePaymentError(error, {
        context: { action: 'updateNotificationPreferences' },
        customMessage: 'Failed to update notification preferences.'
      });
      return false;
    }
  }, []);

  // Get notification stats
  const getStats = useCallback(() => {
    return paymentNotificationService.getNotificationStats();
  }, []);

  // Auto-mark as read when viewed
  useEffect(() => {
    if (autoMarkRead && notifications.length > 0) {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      unreadIds.forEach(id => markAsRead(id));
    }
  }, [notifications, autoMarkRead, markAsRead]);

  return {
    notifications,
    unreadCount,
    preferences,
    loading,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    updatePreferences,
    getStats,
    refresh: loadNotifications
  };
};

/**
 * Hook for real-time payment status tracking
 * @param {string} transactionId - Transaction ID to track
 * @param {Object} options - Tracking options
 * @returns {Object} Status tracking state and functions
 */
export const usePaymentStatusTracking = (transactionId, options = {}) => {
  const {
    pollInterval = 5000,
    maxAttempts = 60, // 5 minutes
    onStatusChange = null,
    enableNotifications = true
  } = options;

  const [status, setStatus] = useState('pending');
  const [attempts, setAttempts] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  const intervalRef = useRef(null);
  const toast = useToast();

  // Check payment status
  const checkStatus = useCallback(async () => {
    if (!transactionId || attempts >= maxAttempts) {
      return false;
    }

    try {
      const response = await paymentService.checkMidtransPaymentStatus(transactionId);
      
      if (response?.payment) {
        const newStatus = response.payment.status?.toLowerCase();
        setPaymentData(response.payment);
        setLastChecked(new Date());
        setAttempts(prev => prev + 1);

        if (newStatus !== status) {
          setStatus(newStatus);
          
          // Trigger callback
          if (onStatusChange) {
            onStatusChange(newStatus, response.payment);
          }

          // Send notification
          if (enableNotifications) {
            if (newStatus === 'success' || newStatus === 'settlement' || newStatus === 'capture') {
              await paymentNotificationService.sendPaymentSuccessNotification(response.payment);
              
              toast({
                title: 'Payment Successful',
                description: 'Your payment has been processed successfully.',
                status: 'success',
                duration: 5000,
                isClosable: true,
              });
              
              return true; // Stop tracking
            } else if (newStatus === 'failed' || newStatus === 'deny' || newStatus === 'cancel') {
              await paymentNotificationService.sendPaymentFailedNotification(
                response.payment,
                response.payment.status_message || 'Payment processing failed'
              );
              
              return true; // Stop tracking
            }
          }
        }
      }

      return false; // Continue tracking
    } catch (error) {
      console.warn('Payment status check failed:', error);
      setAttempts(prev => prev + 1);
      return false;
    }
  }, [transactionId, attempts, maxAttempts, status, onStatusChange, enableNotifications, toast]);

  // Start tracking
  const startTracking = useCallback(() => {
    if (isTracking || !transactionId) return;

    setIsTracking(true);
    setAttempts(0);
    
    const track = async () => {
      const shouldStop = await checkStatus();
      
      if (shouldStop || attempts >= maxAttempts) {
        setIsTracking(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    // Initial check
    track();

    // Set up polling
    intervalRef.current = setInterval(track, pollInterval);
  }, [transactionId, isTracking, checkStatus, attempts, maxAttempts, pollInterval]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Manual status check
  const manualCheck = useCallback(async () => {
    if (!transactionId) return null;
    
    const response = await checkStatus();
    return response;
  }, [transactionId, checkStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    status,
    isTracking,
    attempts,
    lastChecked,
    paymentData,
    startTracking,
    stopTracking,
    manualCheck,
    maxAttemptsReached: attempts >= maxAttempts
  };
};
