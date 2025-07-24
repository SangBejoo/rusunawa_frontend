// Smart Booking Status Hook
// File: /web/src/hooks/useBookingStatus.js

import { useState, useEffect, useCallback } from 'react';
import { BookingStatusManager, bookingStatusService } from '../utils/bookingStatusManager';

/**
 * Custom hook for managing booking status with automatic updates
 * @param {Object} options - Configuration options
 */
export const useBookingStatus = (options = {}) => {
  const {
    autoUpdate = true,
    updateInterval = 60000, // 1 minute
    enableNotifications = true
  } = options;

  const [statusManager] = useState(() => new BookingStatusManager());
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [errors, setErrors] = useState([]);

  /**
   * Calculate status for a single booking
   */
  const calculateStatus = useCallback((booking, invoice) => {
    try {
      return statusManager.calculateBookingStatus(booking, invoice);
    } catch (error) {
      console.error('Error calculating booking status:', error);
      return {
        status: booking.status,
        reason: 'Calculation error',
        error: true
      };
    }
  }, [statusManager]);

  /**
   * Update booking status in database
   */
  const updateBookingStatus = useCallback(async (bookingId, invoiceId) => {
    setIsProcessing(true);
    setErrors([]);

    try {
      const result = await bookingStatusService.updateBookingStatus(bookingId, invoiceId);
      setLastUpdate(new Date());
      return result;
    } catch (error) {
      setErrors(prev => [...prev, error.message]);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Process multiple bookings
   */
  const batchUpdateBookings = useCallback(async (bookings) => {
    setIsProcessing(true);
    setErrors([]);

    try {
      const results = await statusManager.batchProcessBookings(
        bookings,
        bookingStatusService.updateBookingInDatabase
      );
      setLastUpdate(new Date());
      return results;
    } catch (error) {
      setErrors(prev => [...prev, error.message]);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [statusManager]);

  /**
   * Get bookings that need attention
   */
  const getBookingsNeedingAttention = useCallback((bookings) => {
    return statusManager.getBookingsNeedingAttention(bookings);
  }, [statusManager]);

  /**
   * Check if booking access should be granted based on invoice
   */
  const checkBookingAccess = useCallback((booking, invoice) => {
    const statusResult = calculateStatus(booking, invoice);
    
    // Define access-granting statuses
    const accessStatuses = ['approved', 'active', 'checkout_pending'];
    
    return {
      hasAccess: accessStatuses.includes(statusResult.status) && 
                 (invoice?.status === 'paid' || invoice?.status === 'completed'),
      status: statusResult.status,
      reason: statusResult.reason,
      restrictions: statusResult.actions || []
    };
  }, [calculateStatus]);

  /**
   * Automatic status update effect
   */
  useEffect(() => {
    if (!autoUpdate) return;

    const interval = setInterval(async () => {
      try {
        await bookingStatusService.runPeriodicStatusCheck();
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Auto update failed:', error);
        setErrors(prev => [...prev, error.message]);
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [autoUpdate, updateInterval]);

  return {
    // Status calculation
    calculateStatus,
    
    // Access control
    checkBookingAccess,
    
    // Database updates
    updateBookingStatus,
    batchUpdateBookings,
    
    // Analysis
    getBookingsNeedingAttention,
    
    // State
    isProcessing,
    lastUpdate,
    errors,
    
    // Clear errors
    clearErrors: () => setErrors([])
  };
};

/**
 * Hook specifically for room access control
 * Replaces the functionality of RoomAccessPage
 */
export const useRoomAccess = (bookingId, invoiceId) => {
  const [booking, setBooking] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessResult, setAccessResult] = useState(null);
  
  const { checkBookingAccess, calculateStatus } = useBookingStatus();

  // Fetch booking and invoice data
  useEffect(() => {
    const fetchData = async () => {
      if (!bookingId || !invoiceId) return;

      setLoading(true);
      try {
        const [bookingResponse, invoiceResponse] = await Promise.all([
          fetch(`/api/v1/bookings/${bookingId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }),
          fetch(`/api/v1/invoices/${invoiceId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
        ]);

        const bookingData = await bookingResponse.json();
        const invoiceData = await invoiceResponse.json();

        setBooking(bookingData.booking || bookingData);
        setInvoice(invoiceData.invoice || invoiceData);
      } catch (error) {
        console.error('Error fetching room access data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId, invoiceId]);

  // Calculate access permissions
  useEffect(() => {
    if (booking && invoice) {
      const access = checkBookingAccess(booking, invoice);
      const status = calculateStatus(booking, invoice);
      
      setAccessResult({
        ...access,
        statusDetails: status,
        booking,
        invoice
      });
    }
  }, [booking, invoice, checkBookingAccess, calculateStatus]);

  return {
    booking,
    invoice,
    loading,
    accessResult,
    hasAccess: accessResult?.hasAccess || false,
    accessReason: accessResult?.reason || 'Checking access...',
    restrictions: accessResult?.restrictions || [],
    statusDetails: accessResult?.statusDetails || null
  };
};

/**
 * Dashboard hook for admin overview
 */
export const useBookingDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    needsAttention: [],
    statusCounts: {},
    recentUpdates: []
  });
  const [loading, setLoading] = useState(true);
  
  const { getBookingsNeedingAttention } = useBookingStatus();

  const refreshDashboard = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all bookings with invoices
      const response = await fetch('/api/v1/bookings?include=invoice', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      const bookings = data.bookings || data;

      // Analyze bookings
      const needsAttention = getBookingsNeedingAttention(
        bookings.map(b => ({ booking: b, invoice: b.invoice }))
      );

      // Count statuses
      const statusCounts = bookings.reduce((acc, booking) => {
        const status = booking.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      setDashboardData({
        needsAttention,
        statusCounts,
        recentUpdates: needsAttention.slice(0, 10)
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [getBookingsNeedingAttention]);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  return {
    ...dashboardData,
    loading,
    refreshDashboard
  };
};

export default useBookingStatus;
