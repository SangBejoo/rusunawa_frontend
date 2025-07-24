import api from '../utils/apiClient';

/**
 * Payment Service
 * Handles all payment-related API operations
 */
const paymentService = {
  // ===================================================================
  // PAYMENT LISTING & RETRIEVAL
  // ===================================================================

  /**
   * Get all payments with pagination and filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Payments response
   */
  getPayments: async (params = {}) => {
    try {
      console.log('PaymentService: Making request with params:', params);
      
      // Clean up params - remove undefined/null values
      const cleanParams = Object.keys(params).reduce((acc, key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          acc[key] = params[key];
        }
        return acc;
      }, {});
      
      console.log('PaymentService: Clean params:', cleanParams);
      
      const response = await api.get('/payments', { params: cleanParams });
      console.log('PaymentService: API response:', response);
      
      return response.data;
    } catch (error) {
      console.error('PaymentService: Error details:', error.response?.data || error);
      throw new Error(error.response?.data?.status?.message || error.message || 'Failed to fetch payments');
    }
  },

  /**
   * Get payment by ID with extended details
   * @param {number} paymentId - Payment ID
   * @returns {Promise<Object>} Payment details with booking and tenant info
   */
  getPaymentById: async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}`);
      
      // If we have booking ID, fetch booking details for additional context
      if (response.data.payment?.bookingId) {
        try {
          const bookingResponse = await api.get(`/bookings/${response.data.payment.bookingId}`);
          response.data.payment.booking = bookingResponse.data.booking;
        } catch (bookingError) {
          console.warn('Could not fetch booking details:', bookingError.message);
        }
      }
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.status?.message || error.message || 'Failed to fetch payment details');
    }
  },

  /**
   * Get payments by tenant
   * @param {number} tenantId - Tenant ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Tenant's payments
   */
  getPaymentsByTenant: async (tenantId, params = {}) => {
    try {
      const response = await api.get(`/tenants/${tenantId}/payments`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch tenant payments');
    }
  },

  /**
   * Get payments by booking
   * @param {number} bookingId - Booking ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Booking's payments
   */
  getPaymentsByBooking: async (bookingId, params = {}) => {
    try {
      const response = await api.get(`/bookings/${bookingId}/payments`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch booking payments');
    }
  },
  // ===================================================================
  // PAYMENT MANAGEMENT
  // ===================================================================

  /**
   * Verify payment (admin) - Unified endpoint for both approve and reject
   * @param {number} paymentId - Payment ID
   * @param {Object} verificationData - Verification data
   * @param {number} verificationData.verifierId - Admin user ID who is verifying
   * @param {boolean} verificationData.approved - Whether payment is approved or rejected
   * @param {string} verificationData.verificationNotes - Verification notes
   * @param {string} verificationData.verifiedAt - Verification timestamp (ISO format)
   * @returns {Promise<Object>} Verification result
   */
  verifyPayment: async (paymentId, verificationData = {}) => {
    try {
      // Ensure all required fields are present
      const payload = {
        verifierId: verificationData.verifierId || 1,
        approved: Boolean(verificationData.approved),
        verificationNotes: verificationData.verificationNotes || '',
        verifiedAt: verificationData.verifiedAt || new Date().toISOString()
      };
      
      console.log('Sending verification payload:', payload);
      
      const response = await api.post(`/payments/${paymentId}/verify`, payload);
      // Always return the response data, even if it contains an error status
      return response.data;
    } catch (error) {
      console.error('Payment verification error:', error.response?.data || error);
      // Only throw if it's a network error or other HTTP error
      if (error.response && error.response.data) {
        // Return the error response from the backend
        return error.response.data;
      }
      throw new Error(error.response?.data?.status?.message || error.message || 'Failed to verify payment');
    }
  },

  /**
   * Reject payment (admin) - Now uses the unified verify endpoint
   * @param {number} paymentId - Payment ID
   * @param {Object} rejectionData - Rejection data with reason
   * @returns {Promise<Object>} Rejection result
   */
  rejectPayment: async (paymentId, rejectionData) => {
    try {
      return await paymentService.verifyPayment(paymentId, {
        verifierId: rejectionData.verifierId || 1,
        approved: false,
        verificationNotes: rejectionData.reason || rejectionData.verificationNotes || '',
        verifiedAt: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(error.message || 'Failed to reject payment');
    }
  },

  /**
   * Create manual payment record
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Created payment
   */
  createManualPayment: async (paymentData) => {
    try {
      const response = await api.post('/payments/manual', paymentData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to create manual payment');
    }
  },

  /**
   * Upload payment proof
   * @param {number} paymentId - Payment ID
   * @param {File} proofFile - Proof document file
   * @returns {Promise<Object>} Upload result
   */
  uploadPaymentProof: async (paymentId, proofFile) => {
    try {
      const formData = new FormData();
      formData.append('proof', proofFile);
      
      const response = await api.post(`/payments/${paymentId}/proof`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to upload payment proof');
    }
  },

  // ===================================================================
  // INVOICES & REPORTING
  // ===================================================================

  /**
   * Get all invoices
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Invoices response
   */
  getInvoices: async (params = {}) => {
    try {
      const response = await api.get('/invoices', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch invoices');
    }
  },

  /**
   * Get invoice by ID
   * @param {number} invoiceId - Invoice ID
   * @returns {Promise<Object>} Invoice details
   */
  getInvoiceById: async (invoiceId) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch invoice details');
    }
  },

  /**
   * Generate payment report
   * @param {Object} reportParams - Report parameters
   * @returns {Promise<Blob>} Report file
   */
  generatePaymentReport: async (reportParams = {}) => {
    try {
      const response = await api.get('/reports/payments', { 
        params: reportParams,
        responseType: 'blob' 
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to generate payment report');
    }
  },

  /**
   * Get payment statistics
   * @returns {Promise<Object>} Payment statistics
   */
  getPaymentStatistics: async () => {
    try {
      // Since statistics endpoint is not available, we'll calculate from payments data
      const response = await api.get('/payments');
      const payments = response.data?.payments || [];
      
      // Calculate statistics from payments data
      const stats = payments.reduce((acc, payment) => {
        const amount = payment.amount || 0;
        
        acc.total_count++;
        acc.total_amount += amount;
        
        switch (payment.status?.toLowerCase()) {
          case 'verified':
            acc.verified_count++;
            acc.verified_amount += amount;
            break;
          case 'pending':
            acc.pending_count++;
            acc.pending_amount += amount;
            break;
          case 'rejected':
            acc.rejected_count++;
            acc.rejected_amount += amount;
            break;
          default:
            break;
        }
        
        return acc;
      }, {
        total_amount: 0,
        verified_amount: 0,
        pending_amount: 0,
        rejected_amount: 0,
        total_count: 0,
        verified_count: 0,
        pending_count: 0,
        rejected_count: 0
      });
      
      console.log('Calculated payment statistics:', stats);
      return stats;
    } catch (error) {
      console.error('Failed to fetch payment statistics:', error);
      // Return default stats structure if API fails
      return {
        total_amount: 0,
        verified_amount: 0,
        pending_amount: 0,
        rejected_amount: 0,
        total_count: 0,
        verified_count: 0,
        pending_count: 0,
        rejected_count: 0
      };
    }
  },

  /**
   * Verify manual payment (alias for verifyPayment for compatibility)
   * @param {number} paymentId - Payment ID
   * @param {Object} verificationData - Verification data
   * @returns {Promise<Object>} Verification result
   */
  verifyManualPayment: async (paymentId, verificationData) => {
    return paymentService.verifyPayment(paymentId, verificationData);
  },
};

export default paymentService;
