/**
 * Utility functions for room operations
 */

/**
 * Get formatted room price with appropriate label
 * @param {Object} room - The room object
 * @returns {string} Formatted price string
 */
export const getFormattedRoomPrice = (room) => {
  if (!room) return '';
  
  const isMeetingRoom = room.classification?.name === 'ruang_rapat';
  const isDaily = room.rentalType?.name === 'harian';
  
  const formattedPrice = new Intl.NumberFormat('id-ID').format(room.rate);
  
  // Different display format based on room type
  if (isMeetingRoom) {
    return `Rp ${formattedPrice}/${isDaily ? 'hari' : 'bulan'}`;
  } else {
    return `Rp ${formattedPrice}/${isDaily ? 'hari' : 'bulan'}/orang`;
  }
};

/**
 * Get room capacity display text
 * @param {Object} room - The room object
 * @returns {string} Capacity display text
 */
export const getRoomCapacityText = (room) => {
  if (!room) return '';
  
  const isMeetingRoom = room.classification?.name === 'ruang_rapat';
  
  if (isMeetingRoom) {
    return 'Kapasitas tidak dibatasi';
  } else {
    return `${room.capacity || 4} orang`;
  }
};

/**
 * Get room type display text
 * @param {string} classificationType - Room classification name
 * @returns {Object} Display info including label and color
 */
export const getRoomTypeDisplay = (classificationType) => {
  switch (classificationType) {
    case 'perempuan':
      return { label: 'Kamar Mahasiswi', color: 'pink' };
    case 'laki_laki':
      return { label: 'Kamar Mahasiswa', color: 'blue' };
    case 'ruang_rapat':
      return { label: 'Ruang Rapat', color: 'purple' };
    case 'VIP':
      return { label: 'Kamar Non-Mahasiswa', color: 'green' };
    default:
      return { label: classificationType, color: 'gray' };
  }
};

/**
 * Calculate room occupancy from occupants array
 * @param {Object} room - The room object with occupants array
 * @returns {Object} Occupancy information
 */
export const calculateRoomOccupancy = (room) => {
  if (!room || !room.occupants) {
    return {
      capacity: room?.capacity || 4,
      occupied_slots: 0,
      available_slots: room?.capacity || 4,
      occupancy_percentage: 0,
      is_fully_booked: false,
      status: 'available'
    };
  }
  
  const capacity = room.capacity || 4;
  const currentDate = new Date();
  
  // Filter for currently active bookings and approved status
  const activeOccupants = room.occupants.filter(occupant => {
    const checkIn = new Date(occupant.checkIn);
    const checkOut = new Date(occupant.checkOut);
    const isCurrentlyActive = checkIn <= currentDate && currentDate <= checkOut;
    const isApproved = occupant.status === 'approved' || occupant.status === 'checked_in';
    
    return isCurrentlyActive && isApproved;
  });
  
  // Count unique tenants (in case same tenant has multiple overlapping bookings)
  const uniqueTenantIds = new Set(activeOccupants.map(occ => occ.tenantId));
  const occupied_slots = uniqueTenantIds.size;
  
  const available_slots = Math.max(0, capacity - occupied_slots);
  const occupancy_percentage = capacity > 0 ? (occupied_slots / capacity) * 100 : 0;
  const is_fully_booked = occupied_slots >= capacity;

  let status = 'available';
  if (is_fully_booked) {
    status = 'fully_booked';
  } else if (occupied_slots > 0) {
    status = 'partially_occupied';
  }
  
  return {
    capacity,
    occupied_slots,
    available_slots,
    occupancy_percentage: Math.round(occupancy_percentage),
    is_fully_booked,
    status,
    active_occupants: activeOccupants
  };
};

/**
 * Check if room is available for booking
 * @param {Object} room - The room object
 * @returns {boolean} Whether room has available slots
 */
export const isRoomAvailableForBooking = (room) => {
  const occupancy = calculateRoomOccupancy(room);
  return !occupancy.is_fully_booked;
};

/**
 * Get occupancy status badge info
 * @param {Object} room - The room object
 * @returns {Object} Badge configuration
 */
export const getOccupancyBadgeInfo = (room) => {
  const occupancy = calculateRoomOccupancy(room);
  
  if (room.classification?.name === 'ruang_rapat') {
    return null; // Meeting rooms don't show occupancy
  }
  
  if (occupancy.is_fully_booked) {
    return {
      text: 'Fully Booked',
      colorScheme: 'red'
    };
  } else if (occupancy.occupied_slots > 0) {
    return {
      text: `${occupancy.available_slots} slots available`,
      colorScheme: 'orange'
    };
  } else {
    return {
      text: 'Available',
      colorScheme: 'green'
    };
  }
};

/**
 * Check if room is available for the specified date range
 * @param {Object} room - The room object
 * @param {Date} startDate - Check-in date
 * @param {Date} endDate - Check-out date
 * @param {Array} availability - Room availability data
 * @returns {boolean} True if room is available
 */
export const isRoomAvailable = (room, startDate, endDate, availability = []) => {
  if (!room || !startDate || !endDate) return false;
  
  // If no availability data is provided, assume room is available
  if (!availability || availability.length === 0) return true;
  
  // Format dates for consistent comparison
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Handle two different data formats:
  // 1. Array of date objects with isAvailable property
  // 2. Array of unavailable dates from the new API response
  
  // If using the new format (array of unavailable dates)
  if (availability[0] && 'date' in availability[0]) {
    // Check each date in the range
    const current = new Date(start);
    while (current <= end) {
      const dateString = current.toISOString().split('T')[0];
      
      // Find if this date is marked as unavailable
      const dateAvailability = availability.find(a => 
        a.date.split('T')[0] === dateString
      );
      
      // If date exists in availability and is marked as not available
      if (dateAvailability && !dateAvailability.isAvailable) {
        return false;
      }
      
      // Move to next day
      current.setDate(current.getDate() + 1);
    }
  } 
  // If using the unavailable_dates array directly
  else {
    for (const unavailableDate of availability) {
      const unavailableDateObj = new Date(unavailableDate);
      
      // Check if this unavailable date is within our requested range
      if (unavailableDateObj >= start && unavailableDateObj <= end) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Validates and formats date selection based on room rental type
 * @param {Object} room - The room object
 * @param {Date|string} startDate - Check-in date
 * @param {Date|string} endDate - Check-out date
 * @returns {Object} Validation result with formatted dates and error message if any
 */
export const validateDateSelectionByRentalType = (room, startDate, endDate) => {
  if (!room || !startDate || !endDate) {
    return { isValid: false, error: 'Missing required parameters' };
  }
  
  // Ensure we have Date objects
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  
  // Basic date validation
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, error: 'Invalid date values' };
  }
  
  // Check if end date is after start date
  if (end <= start) {
    return { isValid: false, error: 'Check-out date must be after check-in date' };
  }
  
  const isDaily = room.rentalType?.name === 'harian';
  const startDateFormatted = start.toISOString().split('T')[0];
  let endDateFormatted;
  
  if (isDaily) {
    // For daily rental, keep the selected end date as is
    endDateFormatted = end.toISOString().split('T')[0];
  } else {
    // For monthly rental, enforce full month periods
    // First, set end date to be exactly one or more months from start date
    const monthsToAdd = Math.ceil((end - start) / (30 * 24 * 60 * 60 * 1000));
    const adjustedEnd = new Date(start);
    adjustedEnd.setMonth(adjustedEnd.getMonth() + monthsToAdd);
    
    // Set the day to the same day of month as the start date to ensure full months
    adjustedEnd.setDate(start.getDate());
    
    // If original day is beyond the days in the target month, use last day of month
    const lastDayOfMonth = new Date(adjustedEnd.getFullYear(), adjustedEnd.getMonth() + 1, 0).getDate();
    if (start.getDate() > lastDayOfMonth) {
      adjustedEnd.setDate(lastDayOfMonth);
    }
    
    endDateFormatted = adjustedEnd.toISOString().split('T')[0];
  }
  
  return {
    isValid: true,
    startDate: startDateFormatted,
    endDate: endDateFormatted,
    formattedStartDate: start,
    formattedEndDate: isDaily ? end : new Date(endDateFormatted)
  };
};

export default {
  getFormattedRoomPrice,
  getRoomCapacityText,
  getRoomTypeDisplay,
  calculateRoomOccupancy,
  isRoomAvailableForBooking,
  getOccupancyBadgeInfo,
  isRoomAvailable,
  validateDateSelectionByRentalType
};
