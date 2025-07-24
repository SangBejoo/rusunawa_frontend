/**
 * Utility functions to convert between frontend and backend data types
 */

// Convert API timestamp strings to JavaScript Date objects
export const toDate = (timestamp) => {
  if (!timestamp) return null;
  
  try {
    // If it's already a Date object, return it
    if (timestamp instanceof Date) return timestamp;
    
    // Handle string timestamps
    if (typeof timestamp === 'string') {
      return new Date(timestamp);
    }
    
    // Handle proto timestamp objects with seconds and nanos
    if (timestamp.seconds) {
      const seconds = typeof timestamp.seconds === 'string' 
        ? parseInt(timestamp.seconds) 
        : timestamp.seconds;
      
      const nanos = timestamp.nanos || 0;
      return new Date((seconds * 1000) + (nanos / 1000000));
    }
    
    return null;
  } catch (error) {
    console.error('Error converting timestamp to Date:', error);
    return null;
  }
};

// Convert JavaScript Date objects to ISO strings for API requests
export const toISOString = (date) => {
  if (!date) return null;
  
  try {
    // If it's already a string, validate it's an ISO format
    if (typeof date === 'string') {
      // Simple validation of ISO format
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(date)) {
        return date;
      }
      // If not ISO format, try to convert it
      return new Date(date).toISOString();
    }
    
    // If it's a Date object, convert to ISO string
    if (date instanceof Date) {
      return date.toISOString();
    }
    
    return null;
  } catch (error) {
    console.error('Error converting date to ISO string:', error);
    return null;
  }
};

// Ensure a value is a number
export const toNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined) return defaultValue;
  
  if (typeof value === 'number') return value;
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  
  return defaultValue;
};

// Ensure a value is an integer
export const toInteger = (value, defaultValue = 0) => {
  if (value === null || value === undefined) return defaultValue;
  
  if (typeof value === 'number') return Math.floor(value);
  
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  
  return defaultValue;
};

/**
 * Type converter utilities for consistently formatting data
 */

/**
 * Format a number as currency in IDR
 * @param {number} amount - The amount to format
 * @param {string} locale - The locale to use for formatting (default: 'id-ID')
 * @param {string} currency - The currency code (default: 'IDR')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, locale = 'id-ID', currency = 'IDR') => {
  if (amount === null || amount === undefined) return 'Rp 0';
  
  try {
    // Format the number using Intl.NumberFormat
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    return formatter.format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `Rp ${amount}`;
  }
};

/**
 * Format a number with thousand separators
 * @param {number} number - The number to format
 * @param {string} locale - The locale to use for formatting (default: 'id-ID')
 * @returns {string} Formatted number string
 */
export const formatNumber = (number, locale = 'id-ID') => {
  if (number === null || number === undefined) return '0';
  
  try {
    // Format the number using Intl.NumberFormat
    const formatter = new Intl.NumberFormat(locale);
    return formatter.format(number);
  } catch (error) {
    console.error('Error formatting number:', error);
    return `${number}`;
  }
};

/**
 * Capitalize the first letter of each word in a string
 * @param {string} str - The string to capitalize
 * @returns {string} Capitalized string
 */
export const capitalizeEachWord = (str) => {
  if (!str) return '';
  
  return str.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
};

/**
 * Format a booking status code to a display-friendly string
 * @param {string} status - The booking status code
 * @returns {string} Formatted status string
 */
export const formatBookingStatus = (status) => {
  if (!status) return 'Unknown';
  
  const statusMap = {
    'pending': 'Pending',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'cancelled': 'Cancelled',
    'checked_in': 'Checked In',
    'checked_out': 'Checked Out',
    'completed': 'Completed'
  };
  
  return statusMap[status.toLowerCase()] || capitalizeEachWord(status);
};

/**
 * Format a payment status code to a display-friendly string
 * @param {string} status - The payment status code
 * @returns {string} Formatted status string
 */
export const formatPaymentStatus = (status) => {
  if (!status) return 'Unknown';
  
  const statusMap = {
    'pending': 'Pending',
    'paid': 'Paid',
    'failed': 'Failed',
    'refunded': 'Refunded',
    'waiting_approval': 'Waiting Approval'
  };
  
  return statusMap[status.toLowerCase()] || capitalizeEachWord(status);
};

/**
 * Format a room classification code to a display-friendly string
 * @param {string} classification - The room classification code
 * @returns {string} Formatted classification string
 */
export const formatRoomClassification = (classification) => {
  if (!classification) return 'Unknown';
  
  const classificationMap = {
    'perempuan': 'Female Students',
    'laki_laki': 'Male Students',
    'VIP': 'VIP Room',
    'ruang_rapat': 'Meeting Room'
  };
  
  return classificationMap[classification] || capitalizeEachWord(classification);
};

/**
 * Format a rental type code to a display-friendly string
 * @param {string} rentalType - The rental type code
 * @returns {string} Formatted rental type string
 */
export const formatRentalType = (rentalType) => {
  if (!rentalType) return 'Unknown';
  
  const rentalTypeMap = {
    'harian': 'Daily',
    'bulanan': 'Monthly'
  };
  
  return rentalTypeMap[rentalType.toLowerCase()] || capitalizeEachWord(rentalType);
};

/**
 * Get a color scheme based on booking status
 * @param {string} status - The booking status
 * @returns {string} Color scheme name
 */
export const getStatusColor = (status) => {
  if (!status) return 'gray';
  
  const colorMap = {
    'pending': 'yellow',
    'approved': 'green',
    'rejected': 'red',
    'cancelled': 'gray',
    'checked_in': 'teal',
    'checked_out': 'blue',
    'completed': 'purple',
    'paid': 'green',
    'failed': 'red',
    'refunded': 'orange',
    'waiting_approval': 'orange'
  };
  
  return colorMap[status.toLowerCase()] || 'gray';
};

/**
 * Status display mapping
 */
export const statusDisplayMap = {
  'pending': {
    text: 'Pending',
    color: 'yellow',
    icon: 'FaClock'
  },
  'approved': {
    text: 'Approved',
    color: 'green',
    icon: 'FaCheckCircle'
  },
  'rejected': {
    text: 'Rejected',
    color: 'red',
    icon: 'FaTimesCircle'
  },
  'cancelled': {
    text: 'Cancelled',
    color: 'gray',
    icon: 'FaTimesCircle'
  },
  'checked_in': {
    text: 'Checked In',
    color: 'teal',
    icon: 'FaUserClock'
  },
  'checked_out': {
    text: 'Checked Out',
    color: 'blue',
    icon: 'FaSignOutAlt'
  },
  'completed': {
    text: 'Completed',
    color: 'purple',
    icon: 'FaCheck'
  },
  'paid': {
    text: 'Paid',
    color: 'green',
    icon: 'FaCheck'
  },
  'failed': {
    text: 'Failed',
    color: 'red',
    icon: 'FaTimes'
  },
  'refunded': {
    text: 'Refunded',
    color: 'orange',
    icon: 'FaUndo'
  },
  'waiting_approval': {
    text: 'Waiting Approval',
    color: 'orange',
    icon: 'FaClock'
  }
};

export default {
  formatCurrency,
  formatNumber,
  capitalizeEachWord,
  formatBookingStatus,
  formatPaymentStatus,
  formatRoomClassification,
  formatRentalType,
  getStatusColor,
  toDate,
  toISOString,
  toInteger,
  toNumber,
  statusDisplayMap
};
