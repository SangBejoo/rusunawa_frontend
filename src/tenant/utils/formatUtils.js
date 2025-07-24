/**
 * Utility functions for formatting values
 */

/**
 * Format a number as Indonesian Rupiah currency
 * @param {number} amount - The amount to format
 * @param {Object} options - Formatting options
 * @param {boolean} options.withSymbol - Whether to include the Rp symbol (default: true)
 * @param {boolean} options.withSpacing - Whether to include space after symbol (default: true)
 * @param {number} options.decimalPlaces - Number of decimal places (default: 0)
 * @returns {string} The formatted currency string
 */
export const formatCurrency = (amount, options = {}) => {
  // Default options
  const defaults = {
    withSymbol: true,
    withSpacing: true,
    decimalPlaces: 0
  };
  
  // Merge with provided options
  const opts = { ...defaults, ...options };
  
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return opts.withSymbol ? `Rp ${opts.withSpacing ? ' ' : ''}0` : '0';
  }
  
  // Format using Intl.NumberFormat for locale-aware formatting
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: opts.decimalPlaces,
    maximumFractionDigits: opts.decimalPlaces
  }).format(amount);
  
  return opts.withSymbol 
    ? `Rp${opts.withSpacing ? ' ' : ''}${formatted}` 
    : formatted;
};

/**
 * Format a date string into a human-readable format
 * @param {string|Date} date - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} The formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    
    // Default options
    const defaults = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    // Merge with provided options
    const opts = { ...defaults, ...options };
    
    return new Intl.DateTimeFormat('id-ID', opts).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format a date in a display-friendly format (e.g., "15 January 2023")
 * @param {string|Date} date - The date to format
 * @returns {string} The formatted date string
 */
export const formatDisplayDate = (date) => {
  return formatDate(date);
};

/**
 * Format a date with time
 * @param {string|Date} date - The date to format
 * @returns {string} The formatted date and time string
 */
export const formatDateTime = (date) => {
  return formatDate(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format a file size to human-readable format
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

/**
 * Format phone number to Indonesian format
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  let digits = phoneNumber.replace(/\D/g, '');
  
  // Handle Indonesian format (+62) or 0
  if (digits.startsWith('62')) {
    digits = `+${digits}`;
  } else if (digits.startsWith('0')) {
    digits = `+62${digits.substring(1)}`;
  }
  
  return digits;
};

/**
 * Add ellipsis to text that exceeds specified length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text with ellipsis if needed
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text || '';
  return `${text.substring(0, maxLength)}...`;
};

export default {
  formatCurrency,
  formatDate,
  formatDisplayDate,
  formatDateTime,
  formatFileSize,
  formatPhoneNumber,
  truncateText
};
