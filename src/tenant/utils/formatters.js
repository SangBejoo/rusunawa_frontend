/**
 * Utility functions for formatting data
 */

/**
 * Format currency value with thousand separators
 * @param {number} amount - The amount to format
 * @returns {string} Formatted amount
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date to locale date string
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

/**
 * Format date to compact format (DD/MM/YYYY)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatCompactDate = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj)) return '';
  
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dateObj);
};

/**
 * Format date and time
 * @param {string|Date} datetime - Date and time to format
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Calculate days between two dates
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {number} Number of days
 */
export const calculateDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  // Calculate the time difference in milliseconds
  const timeDiff = end.getTime() - start.getTime();
  
  // Convert milliseconds to days
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

/**
 * Format a file size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format a phone number
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format Indonesian phone numbers
  if (cleaned.startsWith('62') || cleaned.startsWith('0')) {
    // Convert to +62 format if it starts with 0
    const standardized = cleaned.startsWith('0') ? `62${cleaned.substring(1)}` : cleaned;
    
    // Format with spaces for readability
    if (standardized.length <= 5) {
      return `+${standardized}`;
    } else if (standardized.length <= 9) {
      return `+${standardized.substring(0, 2)} ${standardized.substring(2)}`;
    } else {
      return `+${standardized.substring(0, 2)} ${standardized.substring(2, 6)} ${standardized.substring(6)}`;
    }
  }
  
  // Return as is if it doesn't match Indonesian format
  return phoneNumber;
};

/**
 * Format time ago
 * @param {string|Date} dateString - Date to calculate time ago
 * @returns {string} Formatted time ago
 */
export const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'Just now';
};
