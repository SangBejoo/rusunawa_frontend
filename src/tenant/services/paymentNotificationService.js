import axios from 'axios';
import { API_URL, getAuthHeader, formatAPIError } from '../utils/apiConfig';

// Notification types
const NOTIFICATION_TYPES = {
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_PENDING: 'payment_pending',
  PAYMENT_EXPIRED: 'payment_expired',
  INVOICE_CREATED: 'invoice_created',
  INVOICE_DUE: 'invoice_due',
  INVOICE_OVERDUE: 'invoice_overdue',
  VERIFICATION_REQUIRED: 'verification_required',
  VERIFICATION_COMPLETE: 'verification_complete',
  SYSTEM_MAINTENANCE: 'system_maintenance',
  SECURITY_ALERT: 'security_alert'
};

// Notification priorities
const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Delivery channels
const DELIVERY_CHANNELS = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  WEBHOOK: 'webhook'
};

class PaymentNotificationService {
  constructor() {
    this.subscribers = new Map();
    this.notificationQueue = [];
    this.preferences = this.loadPreferences();
    this.isInitialized = false;
  }

  /**
   * Initialize notification service
   */
  async initialize() {
    try {
      await this.loadUserPreferences();
      await this.registerServiceWorker();
      this.startNotificationProcessor();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  /**
   * Load user notification preferences
   */
  async loadUserPreferences() {
    try {
      const response = await axios.get(
        `${API_URL}/notifications/preferences`,
        { headers: getAuthHeader() }
      );

      this.preferences = {
        ...this.getDefaultPreferences(),
        ...response.data.preferences
      };

      this.savePreferences();
    } catch (error) {
      console.warn('Failed to load notification preferences:', error);
      this.preferences = this.getDefaultPreferences();
    }
  }

  /**
   * Get default notification preferences
   */
  getDefaultPreferences() {
    return {
      [NOTIFICATION_TYPES.PAYMENT_SUCCESS]: {
        enabled: true,
        channels: [DELIVERY_CHANNELS.IN_APP, DELIVERY_CHANNELS.EMAIL],
        priority: NOTIFICATION_PRIORITY.MEDIUM
      },
      [NOTIFICATION_TYPES.PAYMENT_FAILED]: {
        enabled: true,
        channels: [DELIVERY_CHANNELS.IN_APP, DELIVERY_CHANNELS.EMAIL],
        priority: NOTIFICATION_PRIORITY.HIGH
      },
      [NOTIFICATION_TYPES.PAYMENT_PENDING]: {
        enabled: true,
        channels: [DELIVERY_CHANNELS.IN_APP],
        priority: NOTIFICATION_PRIORITY.MEDIUM
      },
      [NOTIFICATION_TYPES.PAYMENT_EXPIRED]: {
        enabled: true,
        channels: [DELIVERY_CHANNELS.IN_APP, DELIVERY_CHANNELS.EMAIL],
        priority: NOTIFICATION_PRIORITY.HIGH
      },
      [NOTIFICATION_TYPES.INVOICE_CREATED]: {
        enabled: true,
        channels: [DELIVERY_CHANNELS.IN_APP, DELIVERY_CHANNELS.EMAIL],
        priority: NOTIFICATION_PRIORITY.MEDIUM
      },
      [NOTIFICATION_TYPES.INVOICE_DUE]: {
        enabled: true,
        channels: [DELIVERY_CHANNELS.IN_APP, DELIVERY_CHANNELS.EMAIL],
        priority: NOTIFICATION_PRIORITY.HIGH
      },
      [NOTIFICATION_TYPES.INVOICE_OVERDUE]: {
        enabled: true,
        channels: [DELIVERY_CHANNELS.IN_APP, DELIVERY_CHANNELS.EMAIL, DELIVERY_CHANNELS.SMS],
        priority: NOTIFICATION_PRIORITY.URGENT
      },
      [NOTIFICATION_TYPES.VERIFICATION_REQUIRED]: {
        enabled: true,
        channels: [DELIVERY_CHANNELS.IN_APP, DELIVERY_CHANNELS.EMAIL],
        priority: NOTIFICATION_PRIORITY.HIGH
      },
      [NOTIFICATION_TYPES.VERIFICATION_COMPLETE]: {
        enabled: true,
        channels: [DELIVERY_CHANNELS.IN_APP],
        priority: NOTIFICATION_PRIORITY.MEDIUM
      },
      [NOTIFICATION_TYPES.SYSTEM_MAINTENANCE]: {
        enabled: true,
        channels: [DELIVERY_CHANNELS.IN_APP],
        priority: NOTIFICATION_PRIORITY.MEDIUM
      },
      [NOTIFICATION_TYPES.SECURITY_ALERT]: {
        enabled: true,
        channels: [DELIVERY_CHANNELS.IN_APP, DELIVERY_CHANNELS.EMAIL, DELIVERY_CHANNELS.SMS],
        priority: NOTIFICATION_PRIORITY.URGENT
      }
    };
  }

  /**
   * Load preferences from localStorage
   */
  loadPreferences() {
    try {
      const stored = localStorage.getItem('paymentNotificationPreferences');
      return stored ? JSON.parse(stored) : this.getDefaultPreferences();
    } catch (error) {
      return this.getDefaultPreferences();
    }
  }

  /**
   * Save preferences to localStorage
   */
  savePreferences() {
    try {
      localStorage.setItem('paymentNotificationPreferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('Failed to save notification preferences:', error);
    }
  }

  /**
   * Register service worker for push notifications
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');
      
      // Request notification permission
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    } catch (error) {
      console.warn('Service Worker registration failed:', error);
    }
  }

  /**
   * Send notification
   * @param {Object} notification - Notification data
   */
  async sendNotification(notification) {
    const {
      type,
      title,
      message,
      data = {},
      priority = NOTIFICATION_PRIORITY.MEDIUM,
      channels = [DELIVERY_CHANNELS.IN_APP],
      immediate = false
    } = notification;

    // Check if notification type is enabled
    const typePrefs = this.preferences[type];
    if (!typePrefs || !typePrefs.enabled) {
      return;
    }

    const notificationData = {
      id: Date.now() + Math.random(),
      type,
      title,
      message,
      data,
      priority: priority || typePrefs.priority,
      channels: channels.length ? channels : typePrefs.channels,
      timestamp: new Date().toISOString(),
      read: false,
      delivered: false
    };

    if (immediate) {
      await this.deliverNotification(notificationData);
    } else {
      this.queueNotification(notificationData);
    }

    return notificationData.id;
  }

  /**
   * Queue notification for processing
   * @param {Object} notification - Notification data
   */
  queueNotification(notification) {
    this.notificationQueue.push(notification);
    this.processNotificationQueue();
  }

  /**
   * Process notification queue
   */
  async processNotificationQueue() {
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      try {
        await this.deliverNotification(notification);
      } catch (error) {
        console.error('Failed to deliver notification:', error);
        // Re-queue if delivery failed
        if (notification.retryCount < 3) {
          notification.retryCount = (notification.retryCount || 0) + 1;
          setTimeout(() => {
            this.notificationQueue.push(notification);
          }, 5000 * notification.retryCount);
        }
      }
    }
  }

  /**
   * Deliver notification through specified channels
   * @param {Object} notification - Notification data
   */
  async deliverNotification(notification) {
    const deliveryPromises = notification.channels.map(channel => {
      switch (channel) {
        case DELIVERY_CHANNELS.IN_APP:
          return this.deliverInAppNotification(notification);
        case DELIVERY_CHANNELS.EMAIL:
          return this.deliverEmailNotification(notification);
        case DELIVERY_CHANNELS.SMS:
          return this.deliverSMSNotification(notification);
        case DELIVERY_CHANNELS.PUSH:
          return this.deliverPushNotification(notification);
        case DELIVERY_CHANNELS.WEBHOOK:
          return this.deliverWebhookNotification(notification);
        default:
          return Promise.resolve();
      }
    });

    await Promise.allSettled(deliveryPromises);
    notification.delivered = true;
    this.notifySubscribers('notification_delivered', notification);
  }

  /**
   * Deliver in-app notification
   * @param {Object} notification - Notification data
   */
  async deliverInAppNotification(notification) {
    // Store in local storage for persistence
    const stored = this.getStoredNotifications();
    stored.push(notification);
    this.saveStoredNotifications(stored);

    // Notify subscribers
    this.notifySubscribers('new_notification', notification);

    // Show browser notification if supported and permitted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.type,
        data: notification.data
      });
    }
  }

  /**
   * Deliver email notification
   * @param {Object} notification - Notification data
   */
  async deliverEmailNotification(notification) {
    try {
      await axios.post(
        `${API_URL}/notifications/email`,
        {
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          priority: notification.priority
        },
        { headers: getAuthHeader() }
      );
    } catch (error) {
      console.error('Failed to send email notification:', error);
      throw error;
    }
  }

  /**
   * Deliver SMS notification
   * @param {Object} notification - Notification data
   */
  async deliverSMSNotification(notification) {
    try {
      await axios.post(
        `${API_URL}/notifications/sms`,
        {
          type: notification.type,
          message: notification.message,
          data: notification.data,
          priority: notification.priority
        },
        { headers: getAuthHeader() }
      );
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
      throw error;
    }
  }

  /**
   * Deliver push notification
   * @param {Object} notification - Notification data
   */
  async deliverPushNotification(notification) {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.type,
        data: notification.data,
        actions: this.getNotificationActions(notification.type)
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
      throw error;
    }
  }

  /**
   * Deliver webhook notification
   * @param {Object} notification - Notification data
   */
  async deliverWebhookNotification(notification) {
    try {
      await axios.post(
        `${API_URL}/notifications/webhook`,
        {
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          timestamp: notification.timestamp
        },
        { headers: getAuthHeader() }
      );
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
      throw error;
    }
  }

  /**
   * Get notification actions based on type
   * @param {string} type - Notification type
   */
  getNotificationActions(type) {
    switch (type) {
      case NOTIFICATION_TYPES.PAYMENT_FAILED:
        return [
          { action: 'retry', title: 'Retry Payment' },
          { action: 'view', title: 'View Details' }
        ];
      case NOTIFICATION_TYPES.INVOICE_DUE:
        return [
          { action: 'pay', title: 'Pay Now' },
          { action: 'view', title: 'View Invoice' }
        ];
      case NOTIFICATION_TYPES.VERIFICATION_REQUIRED:
        return [
          { action: 'verify', title: 'Verify Now' },
          { action: 'later', title: 'Remind Later' }
        ];
      default:
        return [
          { action: 'view', title: 'View' }
        ];
    }
  }

  /**
   * Subscribe to notification events
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Notify subscribers of an event
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  notifySubscribers(event, data) {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Subscriber callback error:', error);
        }
      });
    }
  }

  /**
   * Get stored notifications
   */
  getStoredNotifications() {
    try {
      const stored = localStorage.getItem('paymentNotifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Save notifications to localStorage
   * @param {Array} notifications - Notifications to save
   */
  saveStoredNotifications(notifications) {
    try {
      // Keep only last 100 notifications
      const limited = notifications.slice(-100);
      localStorage.setItem('paymentNotifications', JSON.stringify(limited));
    } catch (error) {
      console.warn('Failed to save notifications:', error);
    }
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications() {
    return this.getStoredNotifications().filter(n => !n.read);
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   */
  markAsRead(notificationId) {
    const notifications = this.getStoredNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveStoredNotifications(notifications);
      this.notifySubscribers('notification_read', notification);
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    const notifications = this.getStoredNotifications();
    notifications.forEach(n => n.read = true);
    this.saveStoredNotifications(notifications);
    this.notifySubscribers('all_notifications_read', {});
  }

  /**
   * Clear old notifications
   * @param {number} daysOld - Age in days
   */
  clearOldNotifications(daysOld = 30) {
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const notifications = this.getStoredNotifications();
    const filtered = notifications.filter(n => 
      new Date(n.timestamp).getTime() > cutoff
    );
    this.saveStoredNotifications(filtered);
  }

  /**
   * Update notification preferences
   * @param {Object} newPreferences - New preferences
   */
  async updatePreferences(newPreferences) {
    try {
      await axios.put(
        `${API_URL}/notifications/preferences`,
        { preferences: newPreferences },
        { headers: getAuthHeader() }
      );

      this.preferences = { ...this.preferences, ...newPreferences };
      this.savePreferences();
      
      return { success: true };
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw formatAPIError(error);
    }
  }

  /**
   * Get notification statistics
   */
  getNotificationStats() {
    const notifications = this.getStoredNotifications();
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;

    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      today: notifications.filter(n => 
        now - new Date(n.timestamp).getTime() < oneDay
      ).length,
      thisWeek: notifications.filter(n => 
        now - new Date(n.timestamp).getTime() < oneWeek
      ).length,
      byType: notifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {}),
      byPriority: notifications.reduce((acc, n) => {
        acc[n.priority] = (acc[n.priority] || 0) + 1;
        return acc;
      }, {})
    };
  }

  /**
   * Start notification processor
   */
  startNotificationProcessor() {
    setInterval(() => {
      this.processNotificationQueue();
      this.clearOldNotifications();
    }, 10000); // Process every 10 seconds
  }

  /**
   * Send payment-specific notifications
   */
  async sendPaymentSuccessNotification(paymentData) {
    return this.sendNotification({
      type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
      title: 'Payment Successful',
      message: `Your payment of ${paymentData.amount} has been processed successfully.`,
      data: paymentData,
      priority: NOTIFICATION_PRIORITY.MEDIUM
    });
  }

  async sendPaymentFailedNotification(paymentData, reason) {
    return this.sendNotification({
      type: NOTIFICATION_TYPES.PAYMENT_FAILED,
      title: 'Payment Failed',
      message: `Your payment of ${paymentData.amount} failed. ${reason}`,
      data: { ...paymentData, reason },
      priority: NOTIFICATION_PRIORITY.HIGH
    });
  }

  async sendInvoiceDueNotification(invoiceData) {
    return this.sendNotification({
      type: NOTIFICATION_TYPES.INVOICE_DUE,
      title: 'Invoice Due Soon',
      message: `Invoice ${invoiceData.invoiceNumber} is due on ${invoiceData.dueDate}.`,
      data: invoiceData,
      priority: NOTIFICATION_PRIORITY.HIGH
    });
  }

  async sendPaymentExpiredNotification(paymentData) {
    return this.sendNotification({
      type: NOTIFICATION_TYPES.PAYMENT_EXPIRED,
      title: 'Payment Link Expired',
      message: 'Your payment link has expired. Please generate a new one.',
      data: paymentData,
      priority: NOTIFICATION_PRIORITY.HIGH
    });
  }
}

// Create singleton instance
const paymentNotificationService = new PaymentNotificationService();

// Export service instance and types
export default paymentNotificationService;
export { NOTIFICATION_TYPES, NOTIFICATION_PRIORITY, DELIVERY_CHANNELS };
