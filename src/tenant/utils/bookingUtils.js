/**
 * Synchronize booking data with related invoice data
 * @param {Object} booking - Booking data
 * @param {Object} invoice - Related invoice data
 * @returns {Object} Updated booking with synchronized payment status
 */
export const syncBookingWithInvoice = (booking, invoice) => {
  if (!booking || !invoice) return booking;
  
  // Update payment status based on invoice
  const updatedBooking = {
    ...booking,
    payment_status: invoice.status === 'paid' ? 'paid' : booking.payment_status,
    invoice_id: invoice.invoiceId || invoice.invoice_id,
    invoice: invoice
  };
  
  return updatedBooking;
};

/**
 * Get the effective payment status considering both booking and invoice
 * @param {Object} booking - Booking data
 * @param {Object} invoice - Related invoice data
 * @returns {string} Effective payment status
 */
export const getEffectivePaymentStatus = (booking, invoice) => {
  // Invoice status takes precedence
  if (invoice?.status === 'paid') {
    return 'paid';
  }
  
  // Check booking payments
  if (booking?.payments && booking.payments.length > 0) {
    const hasSuccessfulPayment = booking.payments.some(p => 
      p.status === 'verified' || p.status === 'success' || p.status === 'settlement'
    );
    
    if (hasSuccessfulPayment) {
      return 'paid';
    }
  }
  
  // Fallback to booking payment status
  return booking?.payment_status || booking?.paymentStatus || 'pending';
};
