/**
 * Date formatting utilities
 */

/**
 * Format a date in ISO format to user-friendly display format
 * @param {string} isoDate - Date in ISO format
 * @param {string} locale - Locale for formatting (default: 'id-ID')
 * @returns {string} Formatted date
 */
export const formatDate = (isoDate, locale = 'id-ID') => {
  if (!isoDate) return 'N/A';
  
  try {
    const date = new Date(isoDate);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Format: DD Month YYYY
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Error';
  }
};

/**
 * Format a date in ISO format to date and time
 * @param {string} isoDate - Date in ISO format
 * @param {string} locale - Locale for formatting (default: 'id-ID')
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (isoDate, locale = 'id-ID') => {
  if (!isoDate) return 'N/A';
  
  try {
    const date = new Date(isoDate);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Format: DD Month YYYY, HH:MM
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date and time:', error);
    return 'Error';
  }
};

/**
 * Format a date range for display
 * @param {string} startDate - Start date in ISO format
 * @param {string} endDate - End date in ISO format
 * @param {string} locale - Locale for formatting (default: 'id-ID')
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate, locale = 'id-ID') => {
  if (!startDate || !endDate) return 'Date range not available';
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Invalid date range';
    }
    
    // If both dates are in the same month and year
    if (
      start.getMonth() === end.getMonth() && 
      start.getFullYear() === end.getFullYear()
    ) {
      return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}`;
    }
    
    // If dates are in different months but same year
    if (start.getFullYear() === end.getFullYear()) {
      return `${start.getDate()} ${start.toLocaleDateString(locale, { month: 'long' })} - ${end.getDate()} ${end.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}`;
    }
    
    // If dates are in different years
    return `${formatDate(startDate, locale)} - ${formatDate(endDate, locale)}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return 'Error';
  }
};

/**
 * Get relative time from now (e.g., "2 days ago", "in 3 hours")
 * @param {string} isoDate - Date in ISO format
 * @param {string} locale - Locale for formatting (default: 'id-ID')
 * @returns {string} Relative time string
 */
export const getRelativeTime = (isoDate, locale = 'id-ID') => {
  if (!isoDate) return 'N/A';
  
  try {
    const date = new Date(isoDate);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffMs = date - now;
    const diffSecs = Math.round(diffMs / 1000);
    const diffMins = Math.round(diffSecs / 60);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);
    
    // Past
    if (diffMs < 0) {
      if (Math.abs(diffSecs) < 60) return 'just now';
      if (Math.abs(diffMins) < 60) return `${Math.abs(diffMins)} minutes ago`;
      if (Math.abs(diffHours) < 24) return `${Math.abs(diffHours)} hours ago`;
      if (Math.abs(diffDays) < 30) return `${Math.abs(diffDays)} days ago`;
      return formatDate(date, locale);
    }
    
    // Future
    if (diffSecs < 60) return 'in a moment';
    if (diffMins < 60) return `in ${diffMins} minutes`;
    if (diffHours < 24) return `in ${diffHours} hours`;
    if (diffDays < 30) return `in ${diffDays} days`;
    return formatDate(date, locale);
    
  } catch (error) {
    console.error('Error calculating relative time:', error);
    return 'Error';
  }
};

export default {
  formatDate,
  formatDateTime,
  formatDateRange,
  getRelativeTime
};
