// Smart Booking Status Management System
// File: /web/src/utils/bookingStatusManager.js

import { differenceInDays, isAfter, isBefore, addDays } from 'date-fns';

/**
 * Smart Booking Status Manager
 * Handles automatic status transitions based on multiple triggers
 */
export class BookingStatusManager {
  constructor(config = {}) {
    this.config = {
      gracePeriodDays: 3, // Days after checkout before marking overdue
      reminderDays: 7,    // Days before checkout to send reminder
      autoCompleteAfterDays: 30, // Auto-complete after this many days overdue
      ...config
    };
  }

  /**
   * Calculate what the booking status SHOULD be based on current conditions
   * @param {Object} booking - Booking object
   * @param {Object} invoice - Associated invoice object
   * @param {Date} currentDate - Current date (for testing purposes)
   * @returns {Object} - { status, reason, actions }
   */
  calculateBookingStatus(booking, invoice, currentDate = new Date()) {
    const checkInDate = new Date(booking.check_in_date || booking.checkInDate);
    const checkOutDate = new Date(booking.check_out_date || booking.checkOutDate);
    
    // Validation
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return {
        status: booking.status,
        reason: 'Invalid dates',
        actions: ['fix_dates'],
        error: true
      };
    }

    // Current booking status
    const currentStatus = booking.status?.toLowerCase();
    
    // Calculate time relationships
    const daysUntilCheckIn = differenceInDays(checkInDate, currentDate);
    const daysUntilCheckOut = differenceInDays(checkOutDate, currentDate);
    const daysPastCheckOut = differenceInDays(currentDate, checkOutDate);
    
    // Invoice status check
    const invoicePaid = invoice?.status === 'paid' || invoice?.status === 'completed';
    const invoiceOverdue = invoice?.due_date && isAfter(currentDate, new Date(invoice.due_date));

    // DECISION TREE FOR STATUS CALCULATION

    // 1. PENDING/APPROVED STATUS
    if (['pending', 'approved'].includes(currentStatus)) {
      if (!invoicePaid) {
        if (invoiceOverdue) {
          return {
            status: 'payment_overdue',
            reason: 'Invoice payment is overdue',
            actions: ['send_payment_reminder', 'consider_cancellation'],
            priority: 'high'
          };
        }
        return {
          status: currentStatus,
          reason: 'Awaiting payment',
          actions: ['monitor_payment'],
          priority: 'normal'
        };
      }
      
      if (daysUntilCheckIn <= 0) {
        return {
          status: 'active',
          reason: 'Check-in date reached and invoice paid',
          actions: ['activate_access', 'send_welcome_message'],
          priority: 'normal'
        };
      }
      
      return {
        status: 'approved',
        reason: 'Payment received, waiting for check-in date',
        actions: ['send_checkin_instructions'],
        priority: 'low'
      };
    }

    // 2. ACTIVE STATUS
    if (currentStatus === 'active') {
      // Check if should send checkout reminder
      if (daysUntilCheckOut <= this.config.reminderDays && daysUntilCheckOut > 0) {
        return {
          status: 'active',
          reason: 'Active booking, checkout reminder needed',
          actions: ['send_checkout_reminder'],
          priority: 'normal',
          metadata: { daysUntilCheckOut }
        };
      }
      
      // Check if past checkout date
      if (daysPastCheckOut > 0) {
        if (daysPastCheckOut <= this.config.gracePeriodDays) {
          return {
            status: 'checkout_pending',
            reason: `Checkout date passed ${daysPastCheckOut} day(s) ago, within grace period`,
            actions: ['send_overdue_notice', 'attempt_contact'],
            priority: 'medium',
            metadata: { daysPastCheckOut }
          };
        } else if (daysPastCheckOut <= this.config.autoCompleteAfterDays) {
          return {
            status: 'overdue',
            reason: `Checkout overdue by ${daysPastCheckOut} day(s)`,
            actions: ['admin_intervention_required', 'consider_penalties'],
            priority: 'high',
            metadata: { daysPastCheckOut }
          };
        } else {
          return {
            status: 'auto_completed',
            reason: `Auto-completed after ${daysPastCheckOut} days overdue`,
            actions: ['finalize_billing', 'release_room', 'archive_booking'],
            priority: 'high',
            metadata: { daysPastCheckOut }
          };
        }
      }
      
      return {
        status: 'active',
        reason: 'Active booking within normal period',
        actions: [],
        priority: 'low'
      };
    }

    // 3. OVERDUE/CHECKOUT_PENDING STATUS
    if (['overdue', 'checkout_pending'].includes(currentStatus)) {
      if (daysPastCheckOut > this.config.autoCompleteAfterDays) {
        return {
          status: 'auto_completed',
          reason: `Auto-completed after extended overdue period`,
          actions: ['finalize_billing', 'release_room', 'archive_booking'],
          priority: 'high'
        };
      }
      
      return {
        status: currentStatus,
        reason: 'Awaiting admin intervention or tenant action',
        actions: ['admin_review_needed'],
        priority: 'high'
      };
    }

    // 4. COMPLETED/CANCELLED STATUS
    if (['completed', 'cancelled', 'auto_completed'].includes(currentStatus)) {
      return {
        status: currentStatus,
        reason: 'Booking is finalized',
        actions: [],
        priority: 'low'
      };
    }

    // DEFAULT FALLBACK
    return {
      status: currentStatus,
      reason: 'Status maintained',
      actions: [],
      priority: 'low'
    };
  }

  /**
   * Process status update based on calculation
   * @param {Object} booking - Current booking
   * @param {Object} invoice - Associated invoice
   * @param {Function} updateCallback - Function to call with updates
   */
  async processStatusUpdate(booking, invoice, updateCallback) {
    const statusResult = this.calculateBookingStatus(booking, invoice);
    
    // Only update if status actually changed
    if (statusResult.status !== booking.status) {
      const updateData = {
        bookingId: booking.booking_id || booking.id,
        newStatus: statusResult.status,
        previousStatus: booking.status,
        reason: statusResult.reason,
        timestamp: new Date().toISOString(),
        actions: statusResult.actions
      };
      
      try {
        await updateCallback(updateData);
        return { success: true, ...statusResult };
      } catch (error) {
        return { 
          success: false, 
          error: error.message, 
          ...statusResult 
        };
      }
    }
    
    return { success: true, noChange: true, ...statusResult };
  }

  /**
   * Batch process multiple bookings
   * @param {Array} bookings - Array of bookings with invoices
   * @param {Function} updateCallback - Update function
   */
  async batchProcessBookings(bookings, updateCallback) {
    const results = [];
    
    for (const { booking, invoice } of bookings) {
      try {
        const result = await this.processStatusUpdate(booking, invoice, updateCallback);
        results.push({
          bookingId: booking.booking_id || booking.id,
          ...result
        });
      } catch (error) {
        results.push({
          bookingId: booking.booking_id || booking.id,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Get bookings that need attention
   * @param {Array} bookings - Array of bookings with invoices
   */
  getBookingsNeedingAttention(bookings) {
    return bookings
      .map(({ booking, invoice }) => ({
        booking,
        invoice,
        statusResult: this.calculateBookingStatus(booking, invoice)
      }))
      .filter(({ statusResult }) => 
        statusResult.priority === 'high' || 
        statusResult.actions.length > 0
      )
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, normal: 1, low: 0 };
        return priorityOrder[b.statusResult.priority] - priorityOrder[a.statusResult.priority];
      });
  }
}

// Usage Example and API Integration
export const bookingStatusService = {
  manager: new BookingStatusManager(),

  // Initialize with custom config
  configure(config) {
    this.manager = new BookingStatusManager(config);
  },

  // Update single booking status
  async updateBookingStatus(bookingId, invoiceId) {
    try {
      // Fetch booking and invoice data
      const [bookingResponse, invoiceResponse] = await Promise.all([
        fetch(`/api/v1/bookings/${bookingId}`),
        fetch(`/api/v1/invoices/${invoiceId}`)
      ]);

      const booking = await bookingResponse.json();
      const invoice = await invoiceResponse.json();

      // Process status update
      return await this.manager.processStatusUpdate(
        booking.booking || booking,
        invoice.invoice || invoice,
        this.updateBookingInDatabase
      );
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  },

  // Database update function
  async updateBookingInDatabase(updateData) {
    const response = await fetch(`/api/v1/bookings/${updateData.bookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        status: updateData.newStatus,
        reason: updateData.reason,
        metadata: updateData
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update booking status: ${response.statusText}`);
    }

    return response.json();
  },

  // Run periodic status checks (to be called by cron job or scheduler)
  async runPeriodicStatusCheck() {
    try {
      // Fetch all active bookings
      const response = await fetch('/api/v1/bookings?status=active,approved,overdue,checkout_pending');
      const bookings = await response.json();

      // Process each booking
      const results = await this.manager.batchProcessBookings(
        bookings.bookings || bookings,
        this.updateBookingInDatabase
      );

      console.log('Periodic status check completed:', results);
      return results;
    } catch (error) {
      console.error('Periodic status check failed:', error);
      throw error;
    }
  }
};

export default BookingStatusManager;
