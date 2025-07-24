import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';
import tenantAuthService from './tenantAuthService';
import paymentService from './paymentService';
import paymentNotificationService from './paymentNotificationService';
import paymentAnalyticsService from './paymentAnalyticsService';
import { validateId } from '../utils/apiUtils';

const API_URL = `${API_BASE_URL}/v1/bookings`;

/**
 * Enhanced booking service with integrated payment system capabilities
 */
const enhancedBookingService = {
  /**
   * Create a new booking with payment integration
   * @param {Object} bookingData - The booking data
   * @param {Object} paymentOptions - Payment method and preferences
   * @returns {Promise<Object>} The booking creation response with payment details
   */
  createBookingWithPayment: async (bookingData, paymentOptions = {}) => {
    try {
      const token = tenantAuthService.getToken();
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Format dates properly
      if (bookingData.checkInDate && !(bookingData.checkInDate instanceof Date)) {
        bookingData.checkInDate = new Date(bookingData.checkInDate).toISOString();
      }
      
      if (bookingData.checkOutDate && !(bookingData.checkOutDate instanceof Date)) {
        bookingData.checkOutDate = new Date(bookingData.checkOutDate).toISOString();
      }
      
      console.log("Creating booking with payment integration:", bookingData);
      
      // Step 1: Create the booking
      const bookingResponse = await axios.post(API_URL, bookingData, config);
      console.log("Booking creation response:", bookingResponse.data);
      
      let booking = bookingResponse.data.booking;
      let bookingId = booking?.bookingId || bookingResponse.data.bookingId;
      
      // Handle legacy response format
      if (!booking && bookingId) {
        booking = {
          bookingId,
          ...bookingData,
          status: 'pending'
        };
      }
      
      if (!bookingId) {
        throw new Error('Failed to create booking - no booking ID returned');
      }
      
      // Step 2: Generate invoice and payment options
      let invoiceData = null;
      let paymentMethods = null;
      
      try {
        // Get available payment methods
        const methodsResponse = await paymentService.getPaymentMethods();
        paymentMethods = methodsResponse.methods || [];
        
        // Generate invoice with default payment method if specified
        if (paymentOptions.methodId) {
          const invoiceResponse = await paymentService.generateInvoice(
            bookingId, 
            paymentOptions.methodId
          );
          invoiceData = invoiceResponse.invoice;
        }
        
        console.log("Payment integration completed:", { invoiceData, paymentMethods });
      } catch (paymentError) {
        console.warn("Payment integration failed, booking created:", paymentError);
        // Continue without payment integration
      }
      
      // Step 3: Send booking confirmation notification
      try {
        await paymentNotificationService.sendBookingConfirmation({
          bookingId,
          tenantId: bookingData.tenantId,
          roomName: bookingData.roomName || 'Room',
          checkInDate: bookingData.checkInDate,
          checkOutDate: bookingData.checkOutDate,
          totalAmount: bookingData.totalAmount
        });
      } catch (notificationError) {
        console.warn("Failed to send booking confirmation:", notificationError);
      }
      
      // Step 4: Track booking analytics
      try {
        await paymentAnalyticsService.trackBookingCreated({
          bookingId,
          amount: bookingData.totalAmount,
          paymentMethod: paymentOptions.methodId ? 'selected' : 'pending',
          timestamp: new Date().toISOString()
        });
      } catch (analyticsError) {
        console.warn("Failed to track booking analytics:", analyticsError);
      }
      
      return {
        booking,
        invoice: invoiceData,
        paymentMethods,
        status: bookingResponse.data.status || { status: 'success', message: 'Booking created successfully' }
      };
    } catch (error) {
      console.error('Error creating booking with payment:', error);
      
      // Track failed booking attempt
      try {
        await paymentAnalyticsService.trackBookingFailed({
          error: error.message,
          timestamp: new Date().toISOString()
        });
      } catch (analyticsError) {
        console.warn("Failed to track booking failure:", analyticsError);
      }
      
      throw error.response?.data || error;
    }
  },

  /**
   * Get booking with payment status
   * @param {number} bookingId - The booking ID
   * @returns {Promise<Object>} Booking with payment information
   */
  getBookingWithPaymentStatus: async (bookingId) => {
    try {
      const token = tenantAuthService.getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Get booking details
      const bookingResponse = await axios.get(`${API_URL}/${bookingId}`, config);
      const booking = bookingResponse.data.booking;
      
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      // Get payment information
      let payments = [];
      let invoice = null;
      
      try {
        const paymentsResponse = await paymentService.getBookingPayments(bookingId);
        payments = paymentsResponse.payments || [];
        
        // Get invoice if it exists
        if (booking.invoiceId) {
          const invoiceService = await import('./invoiceService');
          const invoiceResponse = await invoiceService.default.getInvoice(booking.invoiceId);
          invoice = invoiceResponse.invoice;
        }
      } catch (paymentError) {
        console.warn("Failed to fetch payment information:", paymentError);
      }
      
      return {
        booking,
        payments,
        invoice,
        paymentStatus: this.determinePaymentStatus(booking, payments),
        nextActions: this.getNextActions(booking, payments)
      };
    } catch (error) {
      console.error(`Error fetching booking ${bookingId} with payment status:`, error);
      throw error.response?.data || error;
    }
  },

  /**
   * Update booking status with payment integration
   * @param {number} bookingId - The booking ID
   * @param {string} status - New booking status
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Update response
   */
  updateBookingStatusWithPayment: async (bookingId, status, options = {}) => {
    try {
      const token = tenantAuthService.getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Update booking status
      const response = await axios.patch(
        `${API_URL}/${bookingId}/status`,
        { status, ...options },
        config
      );
      
      // Handle payment-related status changes
      if (['approved', 'cancelled', 'completed'].includes(status)) {
        try {
          // Send status change notification
          await paymentNotificationService.sendBookingStatusUpdate({
            bookingId,
            status,
            ...options
          });
          
          // Track status change
          await paymentAnalyticsService.trackBookingStatusChange({
            bookingId,
            status,
            timestamp: new Date().toISOString()
          });
        } catch (integrationError) {
          console.warn("Payment system integration error:", integrationError);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error updating booking ${bookingId} status:`, error);
      throw error.response?.data || error;
    }
  },

  /**
   * Cancel booking with payment handling
   * @param {number} bookingId - The booking ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancellation response
   */
  cancelBookingWithPayment: async (bookingId, reason = '') => {
    try {
      // Get booking details first
      const bookingDetails = await this.getBookingWithPaymentStatus(bookingId);
      
      // Cancel the booking
      const response = await this.updateBookingStatusWithPayment(bookingId, 'cancelled', { reason });
      
      // Handle payment refunds if applicable
      if (bookingDetails.payments.length > 0) {
        const successfulPayments = bookingDetails.payments.filter(p => p.status === 'success');
        
        for (const payment of successfulPayments) {
          try {
            // Initiate refund process
            await paymentService.initiateRefund(payment.paymentId, {
              reason,
              amount: payment.amount
            });
            
            // Send refund notification
            await paymentNotificationService.sendRefundNotification({
              paymentId: payment.paymentId,
              amount: payment.amount,
              reason
            });
          } catch (refundError) {
            console.warn(`Failed to process refund for payment ${payment.paymentId}:`, refundError);
          }
        }
      }
      
      return response;
    } catch (error) {
      console.error(`Error cancelling booking ${bookingId}:`, error);
      throw error.response?.data || error;
    }
  },  /**
   * Get bookings with payment analytics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Bookings with analytics
   */
  getBookingsWithAnalytics: async (filters = {}) => {
    try {
      const token = tenantAuthService.getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Get current tenant to filter bookings
      const currentTenant = tenantAuthService.getCurrentTenant();
      if (!currentTenant || !currentTenant.tenantId) {
        throw new Error('No authenticated tenant found');
      }
      
      console.log('Fetching bookings for tenant:', currentTenant.tenantId);
      
      // Use the correct endpoint for tenant bookings
      const tenantBookingsURL = `${API_BASE_URL}/v1/tenants/${currentTenant.tenantId}/bookings`;
      
      // Get bookings using the tenant-specific endpoint
      const response = await axios.get(tenantBookingsURL, { ...config, params: filters });
      const bookings = response.data.bookings || [];
      
      console.log(`Fetched ${bookings.length} bookings for tenant ${currentTenant.tenantId}`);
      
      // Enhance with payment status for each booking
      const enhancedBookings = await Promise.all(
        bookings.map(async (booking) => {
          try {
            const paymentStatus = await this.getBookingPaymentSummary(booking.bookingId);
            return {
              ...booking,
              // Ensure proper field mapping
              booking_id: booking.bookingId,
              room_id: booking.roomId,
              tenant_id: booking.tenantId,
              check_in: booking.checkInDate,
              check_out: booking.checkOutDate,
              total_amount: booking.totalAmount,
              paymentStatus: paymentStatus.status,
              paymentAmount: paymentStatus.totalPaid,
              nextActions: this.getNextActions(booking, paymentStatus.payments)
            };
          } catch (error) {
            console.warn(`Failed to get payment status for booking ${booking.bookingId}:`, error);
            return {
              ...booking,
              booking_id: booking.bookingId,
              room_id: booking.roomId,
              tenant_id: booking.tenantId,
              check_in: booking.checkInDate,
              check_out: booking.checkOutDate,
              total_amount: booking.totalAmount,
              paymentStatus: 'unknown',
              paymentAmount: 0,
              nextActions: []
            };
          }
        })
      );
      
      // Get analytics summary
      let analyticsSummary = null;
      try {
        const analyticsFilters = { ...filters, tenant_id: currentTenant.tenantId };
        analyticsSummary = await paymentAnalyticsService.getBookingAnalytics(analyticsFilters);
      } catch (analyticsError) {
        console.warn("Failed to fetch booking analytics:", analyticsError);
      }
      
      return {
        bookings: enhancedBookings,
        analytics: analyticsSummary,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error fetching bookings with analytics:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get booking payment summary
   * @param {number} bookingId - The booking ID
   * @returns {Promise<Object>} Payment summary
   */
  getBookingPaymentSummary: async (bookingId) => {
    try {
      const paymentsResponse = await paymentService.getBookingPayments(bookingId);
      const payments = paymentsResponse.payments || [];
      
      const totalPaid = payments
        .filter(p => p.status === 'success')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      const pendingAmount = payments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      let status = 'unpaid';
      if (totalPaid > 0 && pendingAmount === 0) status = 'paid';
      else if (totalPaid > 0 || pendingAmount > 0) status = 'partial';
      else if (payments.some(p => p.status === 'pending')) status = 'pending';
      
      return {
        status,
        totalPaid,
        pendingAmount,
        payments
      };
    } catch (error) {
      console.error(`Error fetching payment summary for booking ${bookingId}:`, error);
      return {
        status: 'unknown',
        totalPaid: 0,
        pendingAmount: 0,
        payments: []
      };
    }
  },
  /**
   * Determine payment status from booking and payments
   * @param {Object} booking - Booking data
   * @param {Array} payments - Payment array
   * @returns {string} Payment status
   */
  determinePaymentStatus: (booking, payments) => {
    if (!payments || payments.length === 0) {
      return booking.status === 'pending' ? 'payment_required' : 'no_payment';
    }
    
    // Check for verified/successful payments (Midtrans verified payments)
    const hasVerifiedPayment = payments.some(p => 
      p.status === 'success' || p.status === 'verified' || p.status === 'settlement' || p.status === 'capture'
    );
    const hasPendingPayment = payments.some(p => p.status === 'pending');
    
    if (hasVerifiedPayment) return 'paid';
    if (hasPendingPayment) return 'payment_pending';
    return 'payment_failed';
  },

  /**
   * Get next actions for booking based on status
   * @param {Object} booking - Booking data
   * @param {Array} payments - Payment array
   * @returns {Array} Array of next action objects
   */
  getNextActions: (booking, payments = []) => {
    const actions = [];
    
    // Check if payment is completed (verified/successful)
    const hasCompletedPayment = payments.some(p => 
      p.status === 'success' || p.status === 'verified' || p.status === 'settlement' || p.status === 'capture'
    );
    
    switch (booking.status) {
      case 'pending':
        if (!hasCompletedPayment) {
          actions.push({
            type: 'payment',
            label: 'Make Payment',
            action: 'pay',
            priority: 'high'
          });
        }
        actions.push({
          type: 'cancel',
          label: 'Cancel Booking',
          action: 'cancel',
          priority: 'low'
        });
        break;
        
      case 'approved':
        if (hasCompletedPayment) {
          actions.push({
            type: 'checkin',
            label: 'Check In',
            action: 'checkin',
            priority: 'high'
          });
        } else {
          actions.push({
            type: 'payment',
            label: 'Complete Payment',
            action: 'pay',
            priority: 'high'
          });
        }
        break;
        
      case 'checked_in':
        actions.push({
          type: 'checkout',
          label: 'Check Out',
          action: 'checkout',
          priority: 'medium'
        });
        break;
        
      case 'completed':
        actions.push({
          type: 'review',
          label: 'Leave Review',
          action: 'review',
          priority: 'low'
        });
        if (payments.some(p => p.status === 'success')) {
          actions.push({
            type: 'receipt',
            label: 'Download Receipt',
            action: 'download_receipt',
            priority: 'low'
          });
        }
        break;
    }
    
    return actions;
  }
};

export default enhancedBookingService;
