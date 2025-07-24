/**
 * Utility functions for form validation
 */

// Validate booking date range
export const validateBookingDates = (startDate, endDate) => {
  const errors = {};

  if (!startDate) {
    errors.startDate = 'Check-in date is required';
  }

  if (!endDate) {
    errors.endDate = 'Check-out date is required';
  }

  if (startDate && endDate) {
    // Make sure endDate is after startDate
    if (new Date(startDate) >= new Date(endDate)) {
      errors.endDate = 'Check-out date must be after check-in date';
    }

    // Check that startDate is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (new Date(startDate) < today) {
      errors.startDate = 'Check-in date cannot be in the past';
    }
  }

  return errors;
};

// Validate required fields
export const validateRequired = (values, fields) => {
  const errors = {};

  fields.forEach(field => {
    if (!values[field]) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
    }
  });

  return errors;
};
