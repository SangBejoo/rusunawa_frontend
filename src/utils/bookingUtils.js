/**
 * Utility functions for working with booking data
 */

// Safely format a date to ISO string
export const safeFormatDate = (date) => {
  if (!date) return null;
  
  try {
    // Handle various date formats
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date:', date);
      return null;
    }
    
    return dateObj.toISOString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
};

// Create booking request payload with safety measures for dates
export const createBookingPayload = (tenantId, roomId, startDate, endDate) => {
  // Validate inputs
  if (!tenantId) throw new Error('Tenant ID is required');
  if (!roomId) throw new Error('Room ID is required');
  if (!startDate) throw new Error('Start date is required');
  if (!endDate) throw new Error('End date is required');

  // Convert tenant ID to number if it's a string
  const numericTenantId = typeof tenantId === 'string' ? parseInt(tenantId, 10) : tenantId;
  
  // Convert room ID to number if it's a string
  const numericRoomId = typeof roomId === 'string' ? parseInt(roomId, 10) : roomId;

  // Format dates as ISO strings if they're Date objects
  const formattedStartDate = startDate instanceof Date ? 
    startDate.toISOString() : 
    new Date(startDate).toISOString();

  const formattedEndDate = endDate instanceof Date ? 
    endDate.toISOString() : 
    new Date(endDate).toISOString();

  // Return the formatted payload
  return {
    tenant_id: numericTenantId,
    room_id: numericRoomId,
    check_in_date: formattedStartDate,
    check_out_date: formattedEndDate
  };
};

// Check if a booking ID is valid
export const isValidBookingId = (bookingId) => {
  if (!bookingId) {
    console.warn(`isValidBookingId: Failed - bookingId is falsy:`, bookingId);
    return false;
  }
  if (bookingId === 'undefined') {
    console.warn(`isValidBookingId: Failed - bookingId is string "undefined":`, bookingId);
    return false;
  }
  if (bookingId === 'null') {
    console.warn(`isValidBookingId: Failed - bookingId is string "null":`, bookingId);
    return false;
  }
  
  const numId = parseInt(bookingId, 10);
  if (isNaN(numId)) {
    console.warn(`isValidBookingId: Failed - bookingId "${bookingId}" is NaN after parseInt.`);
    return false;
  }
  if (numId <= 0) {
    console.warn(`isValidBookingId: Failed - bookingId ${numId} is not a positive integer.`);
    return false;
  }
  
  return true;
};

// Get booking detail URL safely
export const getBookingDetailUrl = (bookingId, prefixWithTenant = true) => {
  if (!isValidBookingId(bookingId)) {
    console.error('Invalid booking ID for URL generation:', bookingId);
    return prefixWithTenant ? '/tenant/bookings' : '/bookings';
  }
  
  return `${prefixWithTenant ? '/tenant' : ''}/bookings/${bookingId}`;
};

// Validate date range for booking
export const validateDateRange = (startDateStr, endDateStr) => {
  const errors = {};
  
  if (!startDateStr) {
    errors.startDate = 'Start date is required';
    return errors;
  }

  if (!endDateStr) {
    errors.endDate = 'End date is required';
    return errors;
  }
  
  // Parse dates
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  
  // Check for invalid dates
  if (isNaN(startDate.getTime())) {
    errors.startDate = 'Invalid start date';
  }
  
  if (isNaN(endDate.getTime())) {
    errors.endDate = 'Invalid end date';
  }
  
  // If both dates are valid, check date range logic
  if (!errors.startDate && !errors.endDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    // Start date can't be in the past
    if (startDate < today) {
      errors.startDate = 'Start date cannot be in the past';
    }
    
    // End date can't be before start date
    if (endDate <= startDate) {
      errors.endDate = 'End date must be after start date';
    }
  }
  
  return errors;
};

// Calculate booking price
export const calculateBookingPrice = (room, startDate, endDate) => {
  if (!room || !room.rate || !startDate || !endDate) {
    return 0;
  }

  // Parse dates if they're strings
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  // Validate dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0;
  }
  
  // Calculate duration based on rental type
  if (room.rental_type === 'harian' || room.rentalType === 'harian') {
    // Daily rate: count days
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, daysDiff) * parseFloat(room.rate);
  } else {
    // Monthly rate: count months
    const startMonth = start.getMonth() + start.getFullYear() * 12;
    const endMonth = end.getMonth() + end.getFullYear() * 12;
    const monthsDiff = endMonth - startMonth;
    return Math.max(1, monthsDiff || 1) * parseFloat(room.rate);
  }
};

/**
 * Format booking response data for consistent usage in the app
 * @param {Object} booking - Booking data from API
 * @returns {Object} Formatted booking data
 */
export const formatBookingResponse = (booking) => {
  if (!booking) return null;
  
  // Make a copy of the booking object to prevent mutations
  const formatted = { ...booking };
  
  // Parse dates if they're strings
  if (typeof formatted.check_in === 'string') {
    formatted.check_in_date = new Date(formatted.check_in);
  }
  
  if (typeof formatted.check_out === 'string') {
    formatted.check_out_date = new Date(formatted.check_out);
  }
  
  if (typeof formatted.created_at === 'string') {
    formatted.created_at_date = new Date(formatted.created_at);
  }
  
  // Ensure nested objects are available
  if (!formatted.tenant) {
    formatted.tenant = {};
  }
  
  if (!formatted.room) {
    formatted.room = {};
  }
  
  if (!formatted.invoice) {
    formatted.invoice = {};
  }
  
  return formatted;
};

export default {
  calculateBookingPrice,
  createBookingPayload,
  getBookingDetailUrl,
  isValidBookingId,
  safeFormatDate,
  validateDateRange,
  formatBookingResponse
};
