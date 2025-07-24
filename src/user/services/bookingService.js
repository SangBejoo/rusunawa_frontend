import api from '../utils/apiClient';

/**
 * Booking Service
 * Handles all booking-related API operations
 */
const bookingService = {
  // ===================================================================
  // CORE BOOKING OPERATIONS
  // ===================================================================

  /**
   * Get all bookings with pagination and filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Bookings response
   */
  getBookings: async (params = {}) => {
    try {
      const response = await api.get('/bookings', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch bookings');
    }
  },

  /**
   * Get all bookings for admin (alias for getBookings)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Bookings response
   */
  getAllBookings: async (params = {}) => {
    return bookingService.getBookings(params);
  },

  /**
   * Get booking by ID
   * @param {number} bookingId - Booking ID
   * @returns {Promise<Object>} Booking details
   */
  getBookingById: async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch booking details');
    }
  },

  /**
   * Get booking details with extended information (alias for getBookingById)
   * @param {number} bookingId - Booking ID
   * @returns {Promise<Object>} Extended booking details
   */
  getBookingDetails: async (bookingId) => {
    return bookingService.getBookingById(bookingId);
  },

  /**
   * Create new booking
   * @param {Object} bookingData - Booking data
   * @returns {Promise<Object>} Created booking
   */
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to create booking');
    }
  },

  /**
   * Update booking
   * @param {number} bookingId - Booking ID
   * @param {Object} bookingData - Updated booking data
   * @returns {Promise<Object>} Updated booking
   */
  updateBooking: async (bookingId, bookingData) => {
    try {
      const response = await api.put(`/bookings/${bookingId}`, bookingData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update booking');
    }
  },

  // ===================================================================
  // BOOKING STATUS MANAGEMENT
  // ===================================================================

  /**
   * Update booking status
   * @param {number} bookingId - Booking ID
   * @param {Object} statusData - Status update data
   * @returns {Promise<Object>} Updated booking
   */
  updateBookingStatus: async (bookingId, statusData) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/status`, statusData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update booking status');
    }
  },
  /**
   * Approve booking
   * @param {number} bookingId - Booking ID
   * @param {number} approverId - Approver user ID
   * @param {string} comments - Approval comments (optional)
   * @returns {Promise<Object>} Approval response
   */  approveBooking: async (bookingId, approverId, comments = '') => {
    try {
      const response = await api.post(`/bookings/${bookingId}/approve`, {
        approverId: approverId,
        approved: true,
        comments: comments
      });
      
      // Always return the response data, even if it contains an error status
      return response.data;
    } catch (error) {
      // Only throw if it's a network error or other HTTP error
      if (error.response && error.response.data) {
        // Return the error response from the backend
        return error.response.data;
      }
      throw new Error(error.message || 'Failed to approve booking');
    }
  },
  /**
   * Reject booking
   * @param {number} bookingId - Booking ID
   * @param {number} approverId - Approver user ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Rejection response
   */
  rejectBooking: async (bookingId, approverId, reason) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/approve`, {
        approverId: approverId,
        approved: false,
        comments: reason
      });
      // Always return the response data, even if it contains an error status
      return response.data;
    } catch (error) {
      // Only throw if it's a network error or other HTTP error
      if (error.response && error.response.data) {
        // Return the error response from the backend
        return error.response.data;
      }
      throw new Error(error.message || 'Failed to reject booking');
    }
  },

  /**
   * Cancel booking
   * @param {number} bookingId - Booking ID
   * @param {Object} cancellationData - Cancellation data
   * @returns {Promise<Object>} Cancellation response
   */
  cancelBooking: async (bookingId, cancellationData) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/cancel`, cancellationData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to cancel booking');
    }
  },

  // ===================================================================
  // BOOKING QUERIES & FILTERS
  // ===================================================================

  /**
   * Get pending bookings
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Pending bookings
   */
  getPendingBookings: async (params = {}) => {
    try {
      const response = await api.get('/bookings/pending', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch pending bookings');
    }
  },

  /**
   * Get booking calendar data
   * @param {Object} params - Calendar parameters
   * @returns {Promise<Object>} Calendar data
   */
  getBookingCalendar: async (params = {}) => {
    try {
      const response = await api.get('/bookings/calendar', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch booking calendar');
    }
  },

  // ===================================================================
  // BOOKING STATISTICS & ANALYTICS
  // ===================================================================
  /**
   * Get booking statistics for dashboard
   * @returns {Promise<Object>} Booking statistics
   */
  getBookingStats: async () => {
    try {
      console.log('📊 Getting booking statistics from bookings data...');
      
      // Get booking data and calculate statistics directly
      const bookingResponse = await api.get('/bookings');
      const bookings = bookingResponse.data.bookings || [];
      
      const stats = bookings.reduce((acc, booking) => {
        acc.total++;
        switch (booking.status?.toLowerCase()) {
          case 'pending': 
          case 'pending_approval':
            acc.pending++; 
            break;
          case 'approved': 
          case 'active':
            acc.approved++; 
            break;
          case 'rejected': 
          case 'cancelled':
            acc.rejected++; 
            break;
          default: 
            // Handle unknown statuses
            console.warn('Unknown booking status:', booking.status);
            break;
        }
        return acc;
      }, { total: 0, pending: 0, approved: 0, rejected: 0, active: 0 });
      
      // Calculate active bookings (approved and currently ongoing)
      stats.active = bookings.filter(booking => 
        booking.status?.toLowerCase() === 'approved' || 
        booking.status?.toLowerCase() === 'active'
      ).length;
      
      console.log('📊 Calculated booking statistics:', stats);
      
      return { 
        success: true,
        data: stats 
      };
    } catch (error) {
      console.error('❌ Failed to get booking statistics:', error);
      
      // Return fallback data with error indication
      return {
        success: false,
        error: error.message,
        data: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          active: 0
        }
      };
    }
  },

  // ===================================================================
  // PAYMENT INTEGRATION
  // ===================================================================

  /**
   * Get booking payment status
   * @param {number} bookingId - Booking ID
   * @returns {Promise<Object>} Payment status
   */
  getBookingPaymentStatus: async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}/payment-status`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch booking payment status');
    }
  },

  /**
   * Generate booking invoice
   * @param {number} bookingId - Booking ID
   * @returns {Promise<Object>} Invoice data
   */
  generateBookingInvoice: async (bookingId) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/invoice`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to generate booking invoice');
    }
  },

  // ===================================================================
  // BOOKING ATTACHMENTS & DOCUMENTS
  // ===================================================================

  /**
   * Get booking documents
   * @param {number} bookingId - Booking ID
   * @returns {Promise<Object>} Documents data
   */
  getBookingDocuments: async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}/documents`);
      return response.data || { data: [] };
    } catch (error) {
      console.warn('Booking documents not available:', error.message);
      return { data: [] };
    }
  },

  /**
   * Get booking payments
   * @param {number} bookingId - Booking ID
   * @returns {Promise<Object>} Payments data
   */
  getBookingPayments: async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}/payments`);
      return response.data || { data: [] };
    } catch (error) {
      console.warn('Booking payments not available:', error.message);
      return { data: [] };
    }
  },

  /**
   * Get booking comments
   * @param {number} bookingId - Booking ID
   * @returns {Promise<Object>} Comments data
   */
  getBookingComments: async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}/comments`);
      return response.data || { data: [] };
    } catch (error) {
      console.warn('Booking comments not available:', error.message);
      return { data: [] };
    }
  },

  /**
   * Add booking comment
   * @param {number} bookingId - Booking ID
   * @param {Object} commentData - Comment data
   * @returns {Promise<Object>} Created comment
   */
  addBookingComment: async (bookingId, commentData) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/comments`, commentData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to add booking comment');
    }
  },

  // ===================================================================
  // EXPORT & REPORTING
  // ===================================================================

  /**
   * Export bookings data
   * @param {Object} params - Export parameters
   * @returns {Promise<Blob>} Export file blob
   */
  exportBookings: async (params = {}) => {
    try {
      const response = await api.get('/bookings/export', { 
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to export bookings');
    }
  }
};

export default bookingService;
