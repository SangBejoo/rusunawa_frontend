/**
 * Validates booking data before submission
 * @param {Object} bookingData - The booking data to validate
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
export const validateBooking = (bookingData) => {
  const errors = {};

  // Check tenant_id
  if (!bookingData.tenant_id) {
    errors.tenant_id = "Tenant ID is required";
  }

  // Check room_id
  if (!bookingData.room_id) {
    errors.room_id = "Room ID is required";
  } else {
    // Ensure room_id is a proper integer
    bookingData.room_id = parseInt(bookingData.room_id);
    if (isNaN(bookingData.room_id) || bookingData.room_id <= 0) {
      errors.room_id = "Invalid room ID format";
    }
  }

  // Check start_date
  if (!bookingData.start_date) {
    errors.start_date = "Check-in date is required";
  } else {
    try {
      // Make sure it's a valid date
      const startDate = new Date(bookingData.start_date);
      if (isNaN(startDate.getTime())) {
        errors.start_date = "Invalid check-in date format";
      }
    } catch (e) {
      errors.start_date = "Invalid check-in date";
    }
  }

  // Check end_date
  if (!bookingData.end_date) {
    errors.end_date = "Check-out date is required";
  } else {
    try {
      // Make sure it's a valid date
      const endDate = new Date(bookingData.end_date);
      if (isNaN(endDate.getTime())) {
        errors.end_date = "Invalid check-out date format";
      }
    } catch (e) {
      errors.end_date = "Invalid check-out date";
    }
  }

  // Validate date logic if both dates are valid
  if (!errors.start_date && !errors.end_date) {
    const start = new Date(bookingData.start_date);
    const end = new Date(bookingData.end_date);
    
    if (start >= end) {
      errors.end_date = "Check-out date must be after check-in date";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors: errors
  };
};
