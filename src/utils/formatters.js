/**
 * Formatter utility functions
 */

// Format date string to human readable format
export const formatDate = (dateValue, options = {}) => {
  if (!dateValue) return '';
  
  try {
    const date = new Date(dateValue);
    
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Formats a number as currency in IDR.
 * @param {number} amount - The amount to format.
 * @returns {string} The formatted currency string.
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'Rp 0';
  }
  return `Rp ${Number(amount).toLocaleString('id-ID')}`;
};

// Format date range for display
export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  
  return `${start} - ${end}`;
};

// Calculate duration between two dates in days
export const calculateDurationDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    
    const differenceMs = Math.abs(end - start);
    return Math.ceil(differenceMs / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('Error calculating duration:', error);
    return 0;
  }
};

// Get color scheme for status badges
export const getStatusColor = (status) => {
  if (!status) return 'gray';
  
  switch (status.toLowerCase()) {
    case 'pending':
    case 'waiting_approval':
      return 'yellow';
    case 'approved':
    case 'success':
    case 'paid':
    case 'completed':
      return 'green';
    case 'rejected':
    case 'failed':
    case 'cancelled':
      return 'red';
    case 'checked_in':
      return 'blue';
    case 'expired':
      return 'orange';
    default:
      return 'gray';
  }
};

/**
 * Calculates the total price for a booking.
 * @param {string} startDate - The check-in date.
 * @param {string} endDate - The check-out date.
 * @param {number} dailyRate - The daily rate for the room.
 * @param {number} monthlyRate - The monthly rate for the room.
 * @param {string} rentalType - The rental type ('harian' or 'bulanan').
 * @returns {number} The total calculated price.
 */
export const calculateTotalPrice = (startDate, endDate, dailyRate, monthlyRate, rentalType) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return 0;

  if (rentalType === 'bulanan' && monthlyRate) {
    // For simplicity, if it's monthly, just use the monthly rate.
    // A more complex calculation might consider partial months.
    // Calculate number of months (approximate)
    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months -= start.getMonth();
    months += end.getMonth();
    if (end.getDate() < start.getDate()) {
        months--;
    }
    return (months <= 0 ? 1 : months) * monthlyRate;
  }
  
  // Default to daily calculation
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays * (dailyRate || 0);
};


/**
 * Gets a display string for room classification.
 * @param {object} classification - The classification object { name: string }.
 * @returns {string} The display name or 'N/A'.
 */
export const getClassificationDisplay = (classification) => {
  return classification?.name ? classification.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A';
};


/**
 * Generates a display text for room capacity.
 * @param {number} capacity - The room capacity.
 * @returns {string} Display text like "Up to X guests".
 */
export const getRoomCapacityText = (capacity) => {
  if (capacity && capacity > 0) {
    return `Up to ${capacity} guest${capacity > 1 ? 's' : ''}`;
  }
  return 'Capacity not specified';
};

/**
 * Formats the room price for display.
 * @param {object} room - The room object containing rate and rentalType.
 * @returns {string} Formatted price string like "Rp 100.000 / night" or "Rp 1.000.000 / month".
 */
export const getFormattedRoomPrice = (room) => {
  if (!room || typeof room.rate === 'undefined' || !room.rentalType || !room.rentalType.name) {
    return 'Price not available';
  }
  const price = formatCurrency(room.rate);
  const perUnit = room.rentalType.name.toLowerCase() === 'harian' ? 'night' : 'month';
  return `${price} / ${perUnit}`;
};

export default {
  formatDate,
  formatCurrency,
  formatDateRange,
  calculateDurationDays,
  getStatusColor
};