import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';
import tenantAuthService from './tenantAuthService';
import { validateId } from '../utils/apiUtils';
import { apiCache } from '../utils/apiCache';

const API_URL = `${API_BASE_URL}/v1/bookings`;

/**
 * Service for handling booking-related operations
 */
const bookingService = {
  /**
   * Create a new booking
   * @param {Object} bookingData - The booking data
   * @returns {Promise<Object>} The booking creation response
   */  createBooking: async (bookingData) => {
    try {
      // Add authorization header if logged in
      const token = tenantAuthService.getToken();
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      };
        // Ensure date format matches API expectations (ISO string)
      const processedBookingData = {
        tenantId: parseInt(bookingData.tenantId),
        roomId: parseInt(bookingData.roomId),
        checkInDate: new Date(bookingData.checkInDate).toISOString(),
        checkOutDate: new Date(bookingData.checkOutDate).toISOString()
      };
        // Add optional fields if they exist
      if (bookingData.rentalTypeId) {
        processedBookingData.rentalTypeId = parseInt(bookingData.rentalTypeId);
      }
      if (bookingData.totalAmount) {
        processedBookingData.totalAmount = parseFloat(bookingData.totalAmount);
      }
      
      const response = await axios.post(API_URL, processedBookingData, config);
        
        // Handle different response formats
      if (response.data) {
        // Check if the response status indicates an error
        if (response.data.status && response.data.status.status === "error") {
          throw new Error(response.data.status.message || 'Booking failed');
        }
        
        // If the response has a booking object directly
        if (response.data.booking) {
          return response.data;
        }
        
        // If the response has status success
        if (response.data.status && response.data.status.status === "success") {
          // Try to extract booking ID if available
          if (response.data.bookingId) {
            return {
              booking: {
                bookingId: response.data.bookingId,
                ...processedBookingData
              },
              status: response.data.status
            };
          }
          
          // If no booking object but status is success, try to fetch the booking
          try {
            console.log("Attempting to fetch booking after creation...");
            const bookingsResponse = await axios.get(
              `${API_BASE_URL}/v1/tenants/${bookingData.tenantId}/bookings`, 
              { ...config, params: { page: 1, limit: 1 } }
            );
            
            if (bookingsResponse.data?.bookings?.length > 0) {
              const latestBooking = bookingsResponse.data.bookings[0];
              return {
                booking: latestBooking,
                status: response.data.status
              };
            }
          } catch (fetchError) {
            // Ignore fetch errors
          }
        }
        
        // Return the response as-is if it doesn't match expected format
        return response.data;
      }
      
      throw new Error("No response data received");
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating booking:', error.message);
      }
      
      // Throw the actual error response for better debugging
      throw error.response?.data || { 
        message: error.message || 'Failed to create booking',
        details: error.toString()
      };
    }
  },

  /**
   * Get a specific booking by ID
   * @param {number|string} bookingId - The booking ID
   * @returns {Promise<Object>} The booking data
   */
  getBooking: async (bookingId) => {
    // Validate the booking ID first
    const validBookingId = validateId(bookingId);
    if (validBookingId === null) {
      throw new Error(`Invalid booking ID: ${bookingId}`);
    }
    
    try {
      // Add authorization header if logged in
      const token = tenantAuthService.getToken();
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      console.log(`Fetching booking with ID: ${validBookingId}`);
      const response = await axios.get(`${API_URL}/${validBookingId}`, config);
      return response.data;
    } catch (error) {
      console.error(`Error fetching booking ${validBookingId}:`, error);
      throw error.response?.data || { message: 'Failed to fetch booking details' };
    }
  },

  /**
   * Get bookings for a specific tenant
   * @param {number} tenantId - The tenant ID
   * @param {Object} params - Query parameters (optional)
   * @returns {Promise<Object>} The tenant's bookings
   */
  getTenantBookings: async (tenantId, params = {}) => {
    try {
      // Check cache first
      const cacheKey = `tenant-bookings-${tenantId}`;
      const cached = apiCache.get(cacheKey, params);
      if (cached) {
        return cached;
      }

      const token = tenantAuthService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const config = {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      // Add params to config if they exist and are not empty
      if (params && Object.keys(params).length > 0) {
        config.params = params;
      }
      
      // Fix the URL construction - use the correct endpoint
      const response = await axios.get(
        `${API_BASE_URL}/v1/tenants/${tenantId}/bookings`, 
        config
      );
      
      // Map the response to ensure consistent field names
      if (response.data && response.data.bookings) {
        const mappedBookings = response.data.bookings.map(booking => ({
          ...booking,
          // Ensure consistent field mapping
          booking_id: booking.bookingId,
          room_id: booking.roomId,
          tenant_id: booking.tenantId,
          check_in: booking.checkInDate,
          check_out: booking.checkOutDate,
          start_date: booking.checkInDate,
          end_date: booking.checkOutDate,
          total_amount: booking.totalAmount,
          amount: booking.totalAmount,
          payment_status: booking.paymentStatus || 'pending'
        }));
        
        const result = {
          ...response.data,
          bookings: mappedBookings
        };

        // Cache the result
        apiCache.set(cacheKey, params, result, 2 * 60 * 1000); // 2 minutes cache
        return result;
      }
      
      return response.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching tenant bookings:', error.message);
      }
      throw error.response?.data || { message: 'Failed to fetch tenant bookings' };
    }
  },

  /**
   * Update a booking's status
   * @param {number} bookingId - The booking ID
   * @param {string} status - The new status
   * @returns {Promise<Object>} The update response
   */
  updateBookingStatus: async (bookingId, status) => {
    try {
      // Add authorization header
      const token = tenantAuthService.getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.put(
        `${API_URL}/${bookingId}/status`, 
        { status }, 
        config
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error updating status for booking ${bookingId}:`, error);
      throw error.response?.data || { message: 'Failed to update booking status' };
    }
  },

  /**
   * Cancel a booking
   * @param {number} bookingId - The booking ID
   * @returns {Promise<Object>} The cancellation response
   */
  cancelBooking: async (bookingId) => {
    try {
      // Canceling a booking is just updating its status to 'cancelled'
      return await bookingService.updateBookingStatus(bookingId, 'cancelled');
    } catch (error) {
      console.error(`Error cancelling booking ${bookingId}:`, error);
      throw error.response?.data || { message: 'Failed to cancel booking' };
    }
  },

  /**
   * Check in for a booking
   * @param {number} bookingId - The booking ID
   * @param {FormData} checkInData - The check-in data including room image
   * @returns {Promise<Object>} The check-in response
   */
  checkIn: async (bookingId, checkInData) => {
    try {
      // Add authorization header
      const token = tenantAuthService.getToken();
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'  // Important for file upload
        } 
      };
      
      const response = await axios.post(
        `${API_URL}/${bookingId}/check-in`, 
        checkInData, 
        config
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error checking in for booking ${bookingId}:`, error);
      throw error.response?.data || { message: 'Failed to check in' };
    }
  },

  /**
   * Check out for a booking
   * @param {number} bookingId - The booking ID
   * @param {FormData} checkOutData - The check-out data including room image and feedback
   * @returns {Promise<Object>} The check-out response
   */
  checkOut: async (bookingId, checkOutData) => {
    try {
      // Add authorization header
      const token = tenantAuthService.getToken();
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'  // Important for file upload
        } 
      };
      
      const response = await axios.post(
        `${API_URL}/${bookingId}/check-out`, 
        checkOutData, 
        config
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error checking out for booking ${bookingId}:`, error);
      throw error.response?.data || { message: 'Failed to check out' };
    }
  },

  /**
   * Submit feedback for a booking
   * @param {number} bookingId - The booking ID
   * @param {Object} feedbackData - The feedback data
   * @param {number} feedbackData.rating - Rating (1-5)
   * @param {string} feedbackData.comments - Comments
   * @returns {Promise<Object>} The feedback submission response
   */
  submitFeedback: async (bookingId, feedbackData) => {
    try {
      // Add authorization header
      const token = tenantAuthService.getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.post(
        `${API_URL}/${bookingId}/feedback`, 
        feedbackData, 
        config
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error submitting feedback for booking ${bookingId}:`, error);
      throw error.response?.data || { message: 'Failed to submit feedback' };
    }
  },

  /**
   * Get dynamic rate for specific tenant, room, and rental type
   * @param {number} tenantId - The tenant ID
   * @param {number} roomId - The room ID
   * @param {number} rentalTypeId - The rental type ID (1=harian, 2=bulanan)
   * @returns {Promise<Object>} The dynamic rate response
   */
  getDynamicRate: async (tenantId, roomId, rentalTypeId) => {
    try {
      // Check cache first
      const cacheKey = `dynamic-rate-${tenantId}-${roomId}-${rentalTypeId}`;
      const cached = apiCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const token = tenantAuthService.getToken();
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      };

      const requestData = {
        tenant_id: parseInt(tenantId),
        room_id: parseInt(roomId),
        rental_type_id: parseInt(rentalTypeId)
      };

      const response = await axios.post(`${API_BASE_URL}/v1/rooms/dynamic-rate`, requestData, config);
      
      if (response.data) {
        // Cache for 5 minutes
        apiCache.set(cacheKey, {}, response.data, 5 * 60 * 1000);
        return response.data;
      }
      
      throw new Error("No dynamic rate data received");
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting dynamic rate:', error.message);
      }
      throw error.response?.data || { 
        message: error.message || 'Failed to get dynamic rate',
        details: error.toString()
      };
    }
  },

  /**
   * Get all available rates for tenant (showing different room types and rental periods)
   * @param {number} tenantId - The tenant ID
   * @returns {Promise<Object>} The available rates response
   */
  getAvailableRates: async (tenantId) => {
    try {
      const token = tenantAuthService.getToken();
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      };

      const requestData = {
        tenant_id: parseInt(tenantId)
      };

      console.log("Getting available rates for tenant:", tenantId);
      const response = await axios.post(`${API_BASE_URL}/v1/rooms/available-rates`, requestData, config);
      
      if (response.data) {
        return response.data;
      }
      
      throw new Error("No available rates data received");
    } catch (error) {
      console.error('Error getting available rates:', error);
      throw error.response?.data || { 
        message: error.message || 'Failed to get available rates',
        details: error.toString()
      };
    }
  },

  /**
   * Calculate booking cost with detailed breakdown
   * @param {number} tenantId - The tenant ID
   * @param {number} roomId - The room ID
   * @param {number} rentalTypeId - The rental type ID
   * @param {string} checkInDate - Check-in date (YYYY-MM-DD format)
   * @param {string} checkOutDate - Check-out date (YYYY-MM-DD format)
   * @returns {Promise<Object>} The booking cost calculation
   */
  calculateBookingCost: async (tenantId, roomId, rentalTypeId, checkInDate, checkOutDate) => {
    try {
      const token = tenantAuthService.getToken();
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      };

      const requestData = {
        tenant_id: parseInt(tenantId),
        room_id: parseInt(roomId),
        rental_type_id: parseInt(rentalTypeId),
        check_in_date: checkInDate, // Keep as YYYY-MM-DD format
        check_out_date: checkOutDate
      };

      console.log("Calculating booking cost with data:", requestData);
      const response = await axios.post(`${API_BASE_URL}/v1/bookings/calculate-cost`, requestData, config);
      
      console.log("Booking cost response:", response.data);
      
      if (response.data) {
        return response.data;
      }
      
      throw new Error("No booking cost data received");
    } catch (error) {
      console.error('Error calculating booking cost:', error);
      throw error.response?.data || { 
        message: error.message || 'Failed to calculate booking cost',
        details: error.toString()
      };
    }
  },

  /**
   * Check room availability based on capacity and existing bookings
   * @param {number} roomId - The room ID
   * @param {string} checkInDate - Check-in date (YYYY-MM-DD format)
   * @param {string} checkOutDate - Check-out date (YYYY-MM-DD format)
   * @returns {Promise<Object>} The room availability data
   */
  checkRoomAvailability: async (roomId, checkInDate, checkOutDate) => {
    try {
      const token = tenantAuthService.getToken();
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      console.log("Checking room availability for room:", roomId, "dates:", checkInDate, "to", checkOutDate);
      
      // First, get room details to know the capacity
      const roomResponse = await axios.get(`${API_BASE_URL}/v1/rooms/${roomId}`, config);
      const room = roomResponse.data.room;
      
      if (!room) {
        throw new Error("Room not found");
      }

      // Then, get bookings for this room in the date range to check occupancy
      const bookingsResponse = await axios.get(`${API_BASE_URL}/v1/rooms/${roomId}/bookings`, {
        ...config,
        params: {
          start_date: new Date(checkInDate).toISOString(),
          end_date: new Date(checkOutDate).toISOString(),
          status: 'confirmed,checked_in' // Only count active bookings
        }
      });

      // Calculate availability based on capacity
      const activeBookings = bookingsResponse.data.bookings || [];
      const occupiedSlots = activeBookings.length;
      const availableSlots = room.capacity - occupiedSlots;
      const isAvailable = availableSlots > 0;

      const availabilityData = {
        available: isAvailable,
        room_capacity: room.capacity,
        occupied_slots: occupiedSlots,
        available_capacity: availableSlots,
        total_bookings: activeBookings.length,
        room_id: roomId,
        check_in_date: checkInDate,
        check_out_date: checkOutDate
      };

      console.log("Room availability calculated:", availabilityData);
      return availabilityData;

    } catch (error) {
      console.error('Error checking room availability:', error);
      
      // If the backend endpoint doesn't exist or fails, 
      // fallback to assuming the room is available with full capacity
      if (error.response?.status === 404 || error.response?.status === 501) {
        console.warn("Availability endpoint not found, assuming room is available");
        
        try {
          // Just get room details and assume it's available
          const roomResponse = await axios.get(`${API_BASE_URL}/v1/rooms/${roomId}`, {
            headers: { Authorization: `Bearer ${tenantAuthService.getToken()}` }
          });
          const room = roomResponse.data.room;
          
          return {
            available: true,
            room_capacity: room.capacity || 4,
            occupied_slots: 0,
            available_capacity: room.capacity || 4,
            total_bookings: 0,
            room_id: roomId,
            check_in_date: checkInDate,
            check_out_date: checkOutDate,
            fallback: true
          };
        } catch (roomError) {
          console.error('Error getting room details for fallback:', roomError);
        }
      }
      
      throw error.response?.data || { 
        message: error.message || 'Failed to check room availability',
        details: error.toString()  
      };
    }
  },

  /**
   * Check if tenant has any active booking that hasn't ended yet
   * @param {number} tenantId - The tenant ID
   * @returns {Promise<Object>} Object with hasActiveBooking boolean and activeBooking data if exists
   */
  checkTenantActiveBooking: async (tenantId) => {
    try {
      const token = tenantAuthService.getToken();
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      console.log(`Checking for any active bookings for tenant ${tenantId}`);
      
      // Get all bookings for this tenant
      const response = await axios.get(
        `${API_BASE_URL}/v1/tenants/${tenantId}/bookings`, 
        config
      );

      if (response.data && response.data.bookings) {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Start of today
        
        // Find any active booking where check-out date hasn't passed
        const activeBooking = response.data.bookings.find(booking => {
          const checkOutDate = new Date(booking.checkOutDate || booking.check_out || booking.end_date);
          checkOutDate.setHours(23, 59, 59, 999); // End of checkout day
          
          return (
            checkOutDate >= currentDate &&
            (booking.status === 'confirmed' || booking.status === 'checked_in' || booking.paymentStatus === 'paid')
          );
        });

        return {
          hasActiveBooking: !!activeBooking,
          activeBooking: activeBooking || null,
          checkOutDate: activeBooking ? 
            (activeBooking.checkOutDate || activeBooking.check_out || activeBooking.end_date) : 
            null,
          roomName: activeBooking ? 
            (activeBooking.room?.name || activeBooking.roomName || `Room ${activeBooking.roomId || activeBooking.room_id}`) : 
            null
        };
      }

      return {
        hasActiveBooking: false,
        activeBooking: null,
        checkOutDate: null,
        roomName: null
      };

    } catch (err) {
      console.error('Error checking tenant active booking:', err);
      throw new Error(err.response?.data?.message || 'Failed to check existing bookings');
    }
  },
};

export default bookingService;
