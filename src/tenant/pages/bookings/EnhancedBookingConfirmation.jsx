import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTenantAuth } from '../../context/tenantAuthContext';
import bookingService from '../../services/bookingService';
import paymentService from '../../services/paymentService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';

const EnhancedBookingConfirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useTenantAuth();
  
  // States
  const [booking, setBooking] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState('');
  
  // Check if this is a new booking from location state
  const isNewBooking = location.state?.newBooking || false;
  const costCalculation = location.state?.costCalculation;

  useEffect(() => {
    loadBookingData();
    loadPaymentMethods();
  }, [bookingId]);

  const loadBookingData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get booking details
      const bookingData = await bookingService.getBookingDetails(bookingId);
      setBooking(bookingData.booking);

      // Get invoice if exists
      if (bookingData.booking?.invoiceId) {
        try {
          const invoiceData = await paymentService.getInvoiceWithBreakdown(bookingData.booking.invoiceId);
          setInvoice(invoiceData.invoice);
        } catch (invoiceError) {
          console.log('No invoice found yet:', invoiceError);
        }
      }

    } catch (err) {
      setError('Failed to load booking information');
      console.error('Error loading booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const methodsData = await paymentService.getPaymentMethods();
      setPaymentMethods(methodsData.methods || []);
      
      // Set default payment method
      if (methodsData.methods?.length > 0) {
        setSelectedPaymentMethod(methodsData.methods[0].methodId);
      }
    } catch (err) {
      console.error('Error loading payment methods:', err);
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }

    try {
      setProcessingPayment(true);
      setError('');

      // Generate invoice
      const invoiceResponse = await paymentService.generateInvoice(
        bookingId, 
        selectedPaymentMethod
      );

      if (invoiceResponse.invoice) {
        setInvoice(invoiceResponse.invoice);
        
        // Navigate to payment process based on method
        const paymentMethod = paymentMethods.find(m => m.methodId === selectedPaymentMethod);
        
        if (paymentMethod?.name.toLowerCase().includes('midtrans')) {
          navigate(`/tenant/bookings/${bookingId}/midtrans-payment`, {
            state: { invoice: invoiceResponse.invoice }
          });
        } else {
          navigate(`/tenant/bookings/${bookingId}/manual-payment`, {
            state: { invoice: invoiceResponse.invoice }
          });
        }
      }

    } catch (err) {
      setError(err.message || 'Failed to create invoice');
      console.error('Error creating invoice:', err);
    } finally {
      setProcessingPayment(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'completed': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getRentalTypeLabel = (rentalTypeId) => {
    return rentalTypeId === 1 ? 'Daily' : 'Monthly';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner message="Loading booking details..." />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert type="error" message="Booking not found" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/tenant/bookings')}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Bookings
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isNewBooking ? 'Booking Created Successfully!' : 'Booking Details'}
              </h1>
              <p className="text-gray-600 mt-2">Booking ID: #{booking.bookingId}</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </div>
          </div>
        </div>

        {isNewBooking && (
          <Alert 
            type="success" 
            message="Your booking has been created successfully! Please proceed with payment to confirm your booking." 
            className="mb-6"
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Information */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Booking Information</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">{booking.room?.name}</h3>
                  <p className="text-gray-600">{booking.room?.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Check-in:</span>
                    <p className="text-gray-600">{formatDate(booking.checkInDate)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Check-out:</span>
                    <p className="text-gray-600">{formatDate(booking.checkOutDate)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Room Classification:</span>
                    <p className="text-gray-600 capitalize">{booking.room?.classification?.name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Rental Type:</span>
                    <p className="text-gray-600">{getRentalTypeLabel(booking.rentalTypeId)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Capacity:</span>
                    <p className="text-gray-600">{booking.room?.capacity} people</p>
                  </div>
                  <div>
                    <span className="font-medium">Booked Date:</span>
                    <p className="text-gray-600">{formatDate(booking.createdAt)}</p>
                  </div>
                </div>

                {/* Rate Breakdown */}
                {(costCalculation || invoice?.breakdown) && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Rate Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      {costCalculation ? (
                        <>
                          <div className="flex justify-between">
                            <span>Tenant Type:</span>
                            <span className="font-medium capitalize">{costCalculation.tenant_type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Room Classification:</span>
                            <span className="font-medium capitalize">{costCalculation.classification}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Base Rate:</span>
                            <span>{formatCurrency(costCalculation.base_rate)}/{getRentalTypeLabel(booking.rentalTypeId).toLowerCase()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Duration:</span>
                            <span>{costCalculation.duration_count} {getRentalTypeLabel(booking.rentalTypeId).toLowerCase()}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span>Base Rate:</span>
                            <span>{formatCurrency(invoice.breakdown.base_rate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Duration:</span>
                            <span>{invoice.breakdown.duration_count} {getRentalTypeLabel(booking.rentalTypeId).toLowerCase()}</span>
                          </div>
                        </>
                      )}
                      <hr className="my-2" />
                      <div className="flex justify-between font-bold">
                        <span>Total Amount:</span>
                        <span className="text-green-600">
                          {formatCurrency(costCalculation?.total_amount || booking.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Payment Information</h2>
            </CardHeader>
            <CardContent>
              {!invoice ? (
                <div className="space-y-6">
                  <div className="text-center py-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <div className="text-yellow-600 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-yellow-800 mb-2">Payment Required</h3>
                      <p className="text-yellow-700 mb-4">
                        Please select a payment method to generate your invoice and complete the booking.
                      </p>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Payment Method
                    </label>
                    <div className="space-y-3">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.methodId}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedPaymentMethod === method.methodId
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedPaymentMethod(method.methodId)}
                        >
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={method.methodId}
                              checked={selectedPaymentMethod === method.methodId}
                              onChange={() => setSelectedPaymentMethod(method.methodId)}
                              className="mr-3"
                            />
                            <div>
                              <h4 className="font-medium">{method.name}</h4>
                              <p className="text-sm text-gray-600">{method.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Create Invoice Button */}
                  <button
                    onClick={handleCreateInvoice}
                    disabled={!selectedPaymentMethod || processingPayment}
                    className={`w-full py-3 px-4 rounded-lg font-medium ${
                      !selectedPaymentMethod || processingPayment
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {processingPayment ? 'Creating Invoice...' : 'Proceed to Payment'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center py-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="text-green-600 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-green-800 mb-2">Invoice Generated</h3>
                      <p className="text-green-700">
                        Invoice #{invoice.invoiceId} has been created for your booking.
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Invoice Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Invoice ID:</span>
                        <span>#{invoice.invoiceId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Due Date:</span>
                        <span>{formatDate(invoice.dueDate)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Amount:</span>
                        <span className="text-green-600">{formatCurrency(invoice.amount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => navigate(`/tenant/invoices/${invoice.invoiceId}`)}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      View Invoice
                    </button>
                    <button
                      onClick={() => navigate(`/tenant/invoices/${invoice.invoiceId}/payment-method`)}
                      className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <Alert type="error" message={error} className="mt-4" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBookingConfirmation;
