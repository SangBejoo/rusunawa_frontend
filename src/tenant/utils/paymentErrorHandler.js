// Error categories for different handling strategies
const ERROR_CATEGORIES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  PAYMENT: 'payment',
  SERVER: 'server',
  CLIENT: 'client'
};

// Error severity levels
const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Payment-specific error codes
const PAYMENT_ERROR_CODES = {
  MIDTRANS_TIMEOUT: 'MIDTRANS_TIMEOUT',
  PAYMENT_EXPIRED: 'PAYMENT_EXPIRED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INVALID_CARD: 'INVALID_CARD',
  PAYMENT_DECLINED: 'PAYMENT_DECLINED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DUPLICATE_PAYMENT: 'DUPLICATE_PAYMENT',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  CURRENCY_NOT_SUPPORTED: 'CURRENCY_NOT_SUPPORTED'
};

class PaymentErrorHandler {
  constructor() {
    this.errorQueue = [];
    this.retryAttempts = new Map();
    this.errorMetrics = {
      total: 0,
      byCategory: {},
      bySeverity: {},
      resolved: 0,
      pending: 0
    };
  }

  /**
   * Enhanced error categorization
   * @param {Error|Object} error - The error object
   * @returns {Object} Categorized error information
   */
  categorizeError(error) {
    const errorInfo = {
      originalError: error,
      category: ERROR_CATEGORIES.CLIENT,
      severity: ERROR_SEVERITY.LOW,
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      userMessage: 'Something went wrong. Please try again.',
      isRetryable: false,
      suggestedActions: [],
      context: {},
      timestamp: new Date().toISOString()
    };

    // Handle network errors
    if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
      errorInfo.category = ERROR_CATEGORIES.NETWORK;
      errorInfo.severity = ERROR_SEVERITY.MEDIUM;
      errorInfo.code = 'NETWORK_ERROR';
      errorInfo.message = 'Network connection error';
      errorInfo.userMessage = 'Please check your internet connection and try again.';
      errorInfo.isRetryable = true;
      errorInfo.suggestedActions = [
        'Check your internet connection',
        'Try refreshing the page',
        'Contact support if the problem persists'
      ];
    }

    // Handle timeout errors
    else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      errorInfo.category = ERROR_CATEGORIES.NETWORK;
      errorInfo.severity = ERROR_SEVERITY.MEDIUM;
      errorInfo.code = 'REQUEST_TIMEOUT';
      errorInfo.message = 'Request timeout';
      errorInfo.userMessage = 'The request is taking longer than expected. Please try again.';
      errorInfo.isRetryable = true;
      errorInfo.suggestedActions = [
        'Wait a moment and try again',
        'Check your internet connection',
        'Try using a different payment method'
      ];
    }

    // Handle authentication errors
    else if (error?.response?.status === 401) {
      errorInfo.category = ERROR_CATEGORIES.AUTHENTICATION;
      errorInfo.severity = ERROR_SEVERITY.HIGH;
      errorInfo.code = 'AUTHENTICATION_FAILED';
      errorInfo.message = 'Authentication failed';
      errorInfo.userMessage = 'Your session has expired. Please log in again.';
      errorInfo.isRetryable = false;
      errorInfo.suggestedActions = [
        'Log in again',
        'Check your credentials',
        'Clear browser cache and cookies'
      ];
    }

    // Handle authorization errors
    else if (error?.response?.status === 403) {
      errorInfo.category = ERROR_CATEGORIES.AUTHORIZATION;
      errorInfo.severity = ERROR_SEVERITY.HIGH;
      errorInfo.code = 'AUTHORIZATION_FAILED';
      errorInfo.message = 'Access denied';
      errorInfo.userMessage = 'You don\'t have permission to perform this action.';
      errorInfo.isRetryable = false;
      errorInfo.suggestedActions = [
        'Contact support for assistance',
        'Verify your account status',
        'Check if your account has the required permissions'
      ];
    }

    // Handle validation errors
    else if (error?.response?.status === 400) {
      errorInfo.category = ERROR_CATEGORIES.VALIDATION;
      errorInfo.severity = ERROR_SEVERITY.MEDIUM;
      errorInfo.code = 'VALIDATION_ERROR';
      errorInfo.message = error?.response?.data?.message || 'Validation error';
      errorInfo.userMessage = this.formatValidationMessage(error?.response?.data);
      errorInfo.isRetryable = true;
      errorInfo.suggestedActions = [
        'Check the entered information',
        'Ensure all required fields are filled',
        'Verify the format of entered data'
      ];
    }

    // Handle server errors
    else if (error?.response?.status >= 500) {
      errorInfo.category = ERROR_CATEGORIES.SERVER;
      errorInfo.severity = ERROR_SEVERITY.HIGH;
      errorInfo.code = 'SERVER_ERROR';
      errorInfo.message = 'Server error';
      errorInfo.userMessage = 'Our servers are experiencing issues. Please try again later.';
      errorInfo.isRetryable = true;
      errorInfo.suggestedActions = [
        'Wait a few minutes and try again',
        'Use a different payment method',
        'Contact support if the problem persists'
      ];
    }

    // Handle payment-specific errors
    else if (error?.response?.data?.error_code) {
      this.handlePaymentSpecificError(error.response.data, errorInfo);
    }

    // Handle Midtrans-specific errors
    else if (error?.midtrans_error) {
      this.handleMidtransError(error, errorInfo);
    }

    return errorInfo;
  }

  /**
   * Handle payment-specific errors
   * @param {Object} errorData - Error data from API
   * @param {Object} errorInfo - Error info object to update
   */
  handlePaymentSpecificError(errorData, errorInfo) {
    errorInfo.category = ERROR_CATEGORIES.PAYMENT;
    
    switch (errorData.error_code) {
      case PAYMENT_ERROR_CODES.MIDTRANS_TIMEOUT:
        errorInfo.severity = ERROR_SEVERITY.MEDIUM;
        errorInfo.code = 'MIDTRANS_TIMEOUT';
        errorInfo.userMessage = 'Payment processing timed out. Please try again.';
        errorInfo.isRetryable = true;
        errorInfo.suggestedActions = [
          'Try the payment again',
          'Use a different payment method',
          'Contact your bank if the problem persists'
        ];
        break;

      case PAYMENT_ERROR_CODES.PAYMENT_EXPIRED:
        errorInfo.severity = ERROR_SEVERITY.MEDIUM;
        errorInfo.code = 'PAYMENT_EXPIRED';
        errorInfo.userMessage = 'This payment link has expired. Please generate a new one.';
        errorInfo.isRetryable = false;
        errorInfo.suggestedActions = [
          'Generate a new payment link',
          'Check the payment deadline',
          'Contact support for assistance'
        ];
        break;

      case PAYMENT_ERROR_CODES.INSUFFICIENT_BALANCE:
        errorInfo.severity = ERROR_SEVERITY.MEDIUM;
        errorInfo.code = 'INSUFFICIENT_BALANCE';
        errorInfo.userMessage = 'Insufficient balance. Please check your account or use a different payment method.';
        errorInfo.isRetryable = true;
        errorInfo.suggestedActions = [
          'Check your account balance',
          'Use a different payment method',
          'Top up your account balance'
        ];
        break;

      case PAYMENT_ERROR_CODES.PAYMENT_DECLINED:
        errorInfo.severity = ERROR_SEVERITY.MEDIUM;
        errorInfo.code = 'PAYMENT_DECLINED';
        errorInfo.userMessage = 'Payment was declined by your bank. Please try a different card or contact your bank.';
        errorInfo.isRetryable = true;
        errorInfo.suggestedActions = [
          'Try a different card',
          'Contact your bank',
          'Use a different payment method'
        ];
        break;

      default:
        errorInfo.severity = ERROR_SEVERITY.MEDIUM;
        errorInfo.code = errorData.error_code;
        errorInfo.userMessage = errorData.message || 'Payment processing failed. Please try again.';
        errorInfo.isRetryable = true;
    }
  }

  /**
   * Handle Midtrans-specific errors
   * @param {Object} error - Midtrans error object
   * @param {Object} errorInfo - Error info object to update
   */
  handleMidtransError(error, errorInfo) {
    errorInfo.category = ERROR_CATEGORIES.PAYMENT;
    errorInfo.severity = ERROR_SEVERITY.MEDIUM;
    
    const midtransCode = error.midtrans_error.status_code;
    
    switch (midtransCode) {
      case '200':
        // Success but might have issues
        errorInfo.severity = ERROR_SEVERITY.LOW;
        errorInfo.userMessage = 'Payment processed but verification needed.';
        break;
      case '201':
        errorInfo.userMessage = 'Payment is pending. Please complete the payment in the Midtrans window.';
        break;
      case '202':
        errorInfo.userMessage = 'Payment was declined. Please try a different payment method.';
        break;
      case '400':
        errorInfo.userMessage = 'Invalid payment information. Please check your details and try again.';
        break;
      case '404':
        errorInfo.userMessage = 'Payment session not found. Please start a new payment.';
        break;
      default:
        errorInfo.userMessage = 'Payment processing encountered an issue. Please try again.';
    }
  }

  /**
   * Format validation error messages
   * @param {Object} errorData - Validation error data
   * @returns {string} Formatted user message
   */
  formatValidationMessage(errorData) {
    if (!errorData) return 'Please check your input and try again.';
    
    if (errorData.errors && Array.isArray(errorData.errors)) {
      return `Please correct the following: ${errorData.errors.join(', ')}`;
    }
    
    if (errorData.message) {
      return errorData.message;
    }
    
    return 'Please check your input and try again.';
  }
  /**
   * Handle error with comprehensive strategy
   * @param {Error|Object} error - The error object
   * @param {Object} options - Handling options
   * @returns {Object} Error handling result
   */
  handleError(error, options = {}) {
    const {
      showToast = true,
      logToConsole = true,
      trackMetrics = true,
      context = {},
      onRetry = null,
      customMessage = null,
      toastFunction = null
    } = options;

    const errorInfo = this.categorizeError(error);
    errorInfo.context = { ...errorInfo.context, ...context };

    // Track error metrics
    if (trackMetrics) {
      this.trackErrorMetrics(errorInfo);
    }

    // Log to console in development
    if (logToConsole && process.env.NODE_ENV === 'development') {
      console.group('🔴 Payment Error Details');
      console.error('Original Error:', error);
      console.log('Categorized Error:', errorInfo);
      console.log('Context:', context);
      console.groupEnd();
    }

    // Show user notification
    if (showToast) {
      this.showErrorToast(errorInfo, customMessage, onRetry, toastFunction);
    }

    // Add to error queue for potential retry
    if (errorInfo.isRetryable) {
      this.addToRetryQueue(errorInfo, onRetry);
    }

    return {
      errorInfo,
      handled: true,
      retryable: errorInfo.isRetryable,
      userMessage: customMessage || errorInfo.userMessage
    };
  }
  /**
   * Show error toast notification
   * @param {Object} errorInfo - Categorized error information
   * @param {string} customMessage - Custom user message
   * @param {Function} onRetry - Retry function
   * @param {Function} toastFunction - Toast function from useToast hook
   */
  showErrorToast(errorInfo, customMessage = null, onRetry = null, toastFunction = null) {
    const message = customMessage || errorInfo.userMessage;
    
    const toastOptions = {
      title: this.getToastTitle(errorInfo.category, errorInfo.severity),
      description: message,
      status: this.getToastStatus(errorInfo.severity),
      duration: this.getToastDuration(errorInfo.severity),
      isClosable: true,
      position: 'top-right'
    };

    // Add retry action if applicable
    if (errorInfo.isRetryable && onRetry) {
      toastOptions.action = {
        label: 'Retry',
        onClick: onRetry
      };
    }

    if (typeof toastFunction === 'function') {
      toastFunction(toastOptions);
    } else {
      // Fallback to console error
      console.error('Toast Error:', message);
    }
  }

  /**
   * Get toast title based on error category and severity
   * @param {string} category - Error category
   * @param {string} severity - Error severity
   * @returns {string} Toast title
   */
  getToastTitle(category, severity) {
    if (severity === ERROR_SEVERITY.CRITICAL) return 'Critical Error';
    if (severity === ERROR_SEVERITY.HIGH) return 'Error';
    if (category === ERROR_CATEGORIES.PAYMENT) return 'Payment Issue';
    if (category === ERROR_CATEGORIES.NETWORK) return 'Connection Issue';
    if (category === ERROR_CATEGORIES.VALIDATION) return 'Input Error';
    return 'Warning';
  }

  /**
   * Get toast status based on severity
   * @param {string} severity - Error severity
   * @returns {string} Toast status
   */
  getToastStatus(severity) {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
      case ERROR_SEVERITY.HIGH:
        return 'error';
      case ERROR_SEVERITY.MEDIUM:
        return 'warning';
      default:
        return 'info';
    }
  }

  /**
   * Get toast duration based on severity
   * @param {string} severity - Error severity
   * @returns {number} Duration in milliseconds
   */
  getToastDuration(severity) {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        return null; // Stay until manually closed
      case ERROR_SEVERITY.HIGH:
        return 8000;
      case ERROR_SEVERITY.MEDIUM:
        return 6000;
      default:
        return 4000;
    }
  }

  /**
   * Track error metrics
   * @param {Object} errorInfo - Error information
   */
  trackErrorMetrics(errorInfo) {
    this.errorMetrics.total++;
    
    // Track by category
    if (!this.errorMetrics.byCategory[errorInfo.category]) {
      this.errorMetrics.byCategory[errorInfo.category] = 0;
    }
    this.errorMetrics.byCategory[errorInfo.category]++;
    
    // Track by severity
    if (!this.errorMetrics.bySeverity[errorInfo.severity]) {
      this.errorMetrics.bySeverity[errorInfo.severity] = 0;
    }
    this.errorMetrics.bySeverity[errorInfo.severity]++;

    // Update pending count
    if (errorInfo.isRetryable) {
      this.errorMetrics.pending++;
    }
  }

  /**
   * Add error to retry queue
   * @param {Object} errorInfo - Error information
   * @param {Function} retryFunction - Function to retry
   */
  addToRetryQueue(errorInfo, retryFunction) {
    if (!retryFunction) return;

    const retryItem = {
      id: Date.now() + Math.random(),
      errorInfo,
      retryFunction,
      attempts: 0,
      maxAttempts: this.getMaxRetryAttempts(errorInfo.category),
      nextRetryAt: Date.now() + this.getRetryDelay(0),
      createdAt: Date.now()
    };

    this.errorQueue.push(retryItem);
  }

  /**
   * Get maximum retry attempts based on error category
   * @param {string} category - Error category
   * @returns {number} Maximum retry attempts
   */
  getMaxRetryAttempts(category) {
    switch (category) {
      case ERROR_CATEGORIES.NETWORK:
        return 3;
      case ERROR_CATEGORIES.PAYMENT:
        return 2;
      case ERROR_CATEGORIES.SERVER:
        return 3;
      default:
        return 1;
    }
  }

  /**
   * Get retry delay with exponential backoff
   * @param {number} attempt - Attempt number
   * @returns {number} Delay in milliseconds
   */
  getRetryDelay(attempt) {
    return Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
  }

  /**
   * Process retry queue
   */
  processRetryQueue() {
    const now = Date.now();
    
    this.errorQueue = this.errorQueue.filter(item => {
      if (item.attempts >= item.maxAttempts) {
        this.errorMetrics.pending--;
        return false; // Remove from queue
      }
      
      if (now >= item.nextRetryAt) {
        item.attempts++;
        item.nextRetryAt = now + this.getRetryDelay(item.attempts);
        
        try {
          item.retryFunction();
          this.errorMetrics.pending--;
          this.errorMetrics.resolved++;
          return false; // Remove from queue on success
        } catch (retryError) {
          console.warn('Retry failed:', retryError);
          return item.attempts < item.maxAttempts; // Keep if more attempts available
        }
      }
      
      return true; // Keep in queue
    });
  }

  /**
   * Get error metrics for monitoring
   * @returns {Object} Error metrics
   */
  getErrorMetrics() {
    return {
      ...this.errorMetrics,
      queueSize: this.errorQueue.length,
      averageResolutionTime: this.calculateAverageResolutionTime()
    };
  }

  /**
   * Calculate average resolution time
   * @returns {number} Average resolution time in milliseconds
   */
  calculateAverageResolutionTime() {
    // This would typically be calculated from stored resolution times
    // For now, return a placeholder
    return 0;
  }

  /**
   * Clear error metrics
   */
  clearMetrics() {
    this.errorMetrics = {
      total: 0,
      byCategory: {},
      bySeverity: {},
      resolved: 0,
      pending: 0
    };
    this.errorQueue = [];
  }

  /**
   * Start retry queue processor
   */
  startRetryProcessor() {
    setInterval(() => {
      this.processRetryQueue();
    }, 5000); // Process every 5 seconds
  }
}

// Create singleton instance
const paymentErrorHandler = new PaymentErrorHandler();

// Start retry processor
paymentErrorHandler.startRetryProcessor();

// Export convenience functions
export const handlePaymentError = (error, options = {}) => {
  return paymentErrorHandler.handleError(error, options);
};

export const getErrorMetrics = () => {
  return paymentErrorHandler.getErrorMetrics();
};

export const clearErrorMetrics = () => {
  paymentErrorHandler.clearMetrics();
};

export const ERROR_TYPES = {
  CATEGORIES: ERROR_CATEGORIES,
  SEVERITY: ERROR_SEVERITY,
  PAYMENT_CODES: PAYMENT_ERROR_CODES
};

export default paymentErrorHandler;
