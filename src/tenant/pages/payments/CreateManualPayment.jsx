import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTenantAuth } from '../../context/tenantAuthContext';
import { API_URL } from '../../utils/apiConfig';
import axios from 'axios';
import paymentService from '../../services/paymentService';

const CreateManualPayment = () => {
  const { bookingId, invoiceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { tenant, token } = useTenantAuth();
  
  const [bookingData, setBookingData] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [pendingPayment, setPendingPayment] = useState(null);
  const [preventSubmission, setPreventSubmission] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);  const [formData, setFormData] = useState({
    bookingId: parseInt(bookingId) || 0,
    tenantId: tenant?.tenantId || 0,
    invoiceId: parseInt(invoiceId) || 0,
    amount: 0,
    paymentChannel: 'bank_transfer',
    notes: '',
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    transferDate: new Date().toISOString().slice(0, 19) + 'Z',
    fileName: '',
    fileType: '',
    imageContent: '',
    contentEncoding: 'base64'
  });

  // API configuration
  const apiConfig = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  useEffect(() => {
    // Auto-populate tenant ID
    if (tenant?.tenantId) {
      setFormData(prev => ({
        ...prev,
        tenantId: tenant.tenantId
      }));
    }
  }, [tenant]);

  useEffect(() => {
    if (bookingId || invoiceId) {
      fetchData();
    }
  }, [bookingId, invoiceId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch booking data if available
      if (bookingId) {
        const bookingResponse = await axios.get(
          `${API_URL}/bookings/${bookingId}`,
          apiConfig
        );
        setBookingData(bookingResponse.data.booking);
        
        if (bookingResponse.data.booking?.invoice) {
          setInvoiceData(bookingResponse.data.booking.invoice);
          setFormData(prev => ({
            ...prev,
            invoiceId: bookingResponse.data.booking.invoice.invoiceId,
            amount: bookingResponse.data.booking.invoice.totalAmount
          }));
        }
      }
      
      // Fetch invoice data if available and not from booking
      if (invoiceId && !bookingId) {
        const invoiceResponse = await axios.get(
          `${API_URL}/invoices/${invoiceId}`,
          apiConfig
        );
        setInvoiceData(invoiceResponse.data.invoice);
        
        if (invoiceResponse.data.invoice?.booking) {
          setBookingData(invoiceResponse.data.invoice.booking);
          setFormData(prev => ({
            ...prev,
            bookingId: invoiceResponse.data.invoice.booking.bookingId,
            amount: invoiceResponse.data.invoice.totalAmount
          }));
        }
      }

      // Check for pending manual payments for this invoice
      await checkPendingPayments();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  const checkPendingPayments = async () => {
    try {
      const currentInvoiceId = invoiceId || invoiceData?.invoiceId;
      if (!currentInvoiceId) return;

      // Get tenant ID from localStorage
      const tenantData = JSON.parse(localStorage.getItem('tenant') || '{}');
      const tenantId = tenantData.tenantId || tenantData.tenant_id || tenantData.id;

      const response = await paymentService.checkPendingManualPayments(currentInvoiceId, tenantId);
      
      if (response.hasPendingPayments && response.pendingPayments?.length > 0) {
        const pendingPayment = response.pendingPayments[0]; // Get the first pending payment
        setPendingPayment(pendingPayment);
        setPreventSubmission(true);
        
        // Show warning through UI state instead of toast
        console.warn('Pending payment found - preventing new submission');
      }
    } catch (error) {
      console.error('Error checking pending payments:', error);
      // Don't prevent submission if we can't check - API endpoint might not exist yet
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          image: 'Please select a valid image file (JPEG, PNG, WebP, or GIF)'
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          image: 'Image size must be less than 5MB'
        }));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const result = event.target.result;
          // Ensure we have the base64 data
          if (result && result.includes(',')) {
            const base64Content = result.split(',')[1];            setFormData(prev => ({
              ...prev,
              fileName: file.name,
              fileType: file.type,
              imageContent: base64Content,
              contentEncoding: 'base64'
            }));
            setImagePreview(result);
            
            // Clear any image errors
            if (errors.image) {
              setErrors(prev => ({
                ...prev,
                image: ''
              }));
            }
          } else {
            throw new Error('Failed to process image');
          }
        } catch (error) {
          console.error('Error processing image:', error);
          setErrors(prev => ({
            ...prev,
            image: 'Failed to process the selected image'
          }));
        }
      };
      
      reader.onerror = () => {
        setErrors(prev => ({
          ...prev,
          image: 'Failed to read the selected file'
        }));
      };
      
      reader.readAsDataURL(file);
    }
  };
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.tenantId || formData.tenantId <= 0) {
      newErrors.tenantId = 'Tenant ID is required';
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount is required and must be greater than 0';
    }
    if (formData.amount > 1000000000) { // 1 billion IDR limit
      newErrors.amount = 'Amount cannot exceed 1 billion IDR';
    }
    if (!formData.paymentChannel) {
      newErrors.paymentChannel = 'Payment channel is required';
    }
    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    }
    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
    }
    if (!formData.transferDate) {
      newErrors.transferDate = 'Transfer date is required';
    } else {
      // Validate transfer date is not in the future
      const transferDate = new Date(formData.transferDate);
      const now = new Date();
      if (transferDate > now) {
        newErrors.transferDate = 'Transfer date cannot be in the future';
      }
    }
    if (!formData.imageContent) {
      newErrors.image = 'Payment proof image is required';
    }

    // Ensure at least one of booking or invoice ID is provided
    if (!formData.bookingId && !formData.invoiceId) {
      newErrors.reference = 'Either booking ID or invoice ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstError = Object.keys(errors)[0];
      const errorElement = document.getElementById(firstError);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Check for pending payments
    if (preventSubmission) {
      setErrors(prev => ({
        ...prev,
        submit: 'You have a pending payment that needs to be resolved before submitting a new one'
      }));
      
      // Scroll to error message
      setTimeout(() => {
        const errorElement = document.querySelector('[data-error="submit"]');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      return;
    }

    setSubmitting(true);
    try {
      console.log('Submitting manual payment with data:', formData);
      
      const response = await axios.post(
        `${API_URL}/payments/manual`,
        formData,
        apiConfig
      );
      
      console.log('Manual payment response:', response.data);
      
      if (response.data.status?.status === 'success') {
        // Navigate to payment success page or payment detail
        navigate(`/tenant/payments/${response.data.payment.paymentId}`, {
          state: { 
            message: response.data.status.message || 'Manual payment submitted successfully and is pending verification',
            type: 'success',
            paymentData: response.data.payment
          }
        });
      } else {
        throw new Error(response.data.status?.message || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Error creating manual payment:', error);
      
      let errorMessage = 'Failed to create payment';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrors({ 
        submit: errorMessage
      });
      
      // Scroll to error message
      setTimeout(() => {
        const errorElement = document.querySelector('[data-error="submit"]');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  useEffect(() => {
    // Check for pending payments on component mount
    const checkPendingPayments = async () => {
      if (tenant?.tenantId) {
        try {
          const response = await paymentService.getPendingPayments(tenant.tenantId, token);
          if (response.data && response.data.length > 0) {
            setPendingPayment(response.data[0]);
            setPreventSubmission(true);
          }
        } catch (error) {
          console.error('Error fetching pending payments:', error);
        }
      }
    };

    checkPendingPayments();
  }, [tenant, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Manual Payment</h1>
              <p className="text-gray-600 mt-2">Submit your payment proof for verification</p>
            </div>
            <button 
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Pending Payment Warning */}
          {pendingPayment && (
            <div className="lg:col-span-3 mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600">⚠️</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-900 mb-2">
                      Payment Already Pending Verification
                    </h3>
                    <p className="text-yellow-800 mb-4">
                      You have already submitted a manual payment for this invoice that is currently pending verification. 
                      You cannot submit another payment until the current one is processed.
                    </p>
                    <div className="bg-white rounded border p-4 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong className="text-gray-900">Payment ID:</strong>
                          <span className="text-gray-700 ml-2">#{pendingPayment.id}</span>
                        </div>
                        <div>
                          <strong className="text-gray-900">Amount:</strong>
                          <span className="text-gray-700 ml-2">{formatCurrency(pendingPayment.amount)}</span>
                        </div>
                        <div>
                          <strong className="text-gray-900">Submitted:</strong>
                          <span className="text-gray-700 ml-2">{formatDate(pendingPayment.createdAt)}</span>
                        </div>
                        <div>
                          <strong className="text-gray-900">Status:</strong>
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs ml-2">
                            PENDING VERIFICATION
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => navigate('/tenant/payments/history')}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                      >
                        View Payment History
                      </button>
                      <button
                        onClick={() => navigate('/tenant/contact')}
                        className="px-4 py-2 border border-yellow-600 text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors text-sm"
                      >
                        Contact Support
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Left Side - Booking & Invoice Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Booking Information */}
            {bookingData && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                    <span className="text-blue-600 text-xs">🏢</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Booking Details</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Room</label>
                    <p className="font-medium text-gray-900">{bookingData.room?.name}</p>
                    <p className="text-sm text-gray-500">
                      {bookingData.room?.classification?.name} • {bookingData.room?.rentalType?.name}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Period</label>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span>📅</span>
                      <span>
                        {formatDate(bookingData.checkInDate)} - {formatDate(bookingData.checkOutDate)}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="flex gap-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        bookingData.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {bookingData.status}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        bookingData.paymentStatus === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {bookingData.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Invoice Information */}
            {invoiceData && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                    <span className="text-green-600 text-xs">💳</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Invoice Details</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Invoice Number</label>
                    <p className="font-medium text-gray-900">{invoiceData.invoiceNo}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Amount</label>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(invoiceData.totalAmount)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Due Date</label>
                    <p className="text-sm text-gray-700">{formatDate(invoiceData.dueDate)}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                      invoiceData.status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {invoiceData.status}
                    </span>
                  </div>                </div>
              </div>
            )}

            {/* Bank Transfer Instructions */}
            <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                  <span className="text-blue-600 text-xs">🏦</span>
                </div>
                <h3 className="text-lg font-semibold text-blue-900">Bank Transfer Instructions</h3>
              </div>
              
              <div className="space-y-3 text-sm text-blue-800">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <div className="font-medium">Bank BNI</div>
                    <div>Account: <strong>0123456789</strong></div>
                    <div>Name: <strong>Rusunawa PNJ</strong></div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="font-medium">Bank Mandiri</div>
                    <div>Account: <strong>9876543210</strong></div>
                    <div>Name: <strong>Rusunawa PNJ</strong></div>
                  </div>
                </div>
                <div className="text-xs text-blue-600 space-y-1">
                  <div>• Transfer the exact amount as shown in your invoice</div>
                  <div>• Include your invoice/booking number in the transfer description</div>
                  <div>• Keep your transfer receipt for upload</div>
                  <div>• Payment verification may take 1-2 business days</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">                {/* Amount */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount (IDR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">Rp</span>
                    <input
                      id="amount"
                      type="number"
                      min="1000"
                      max="1000000000"
                      step="1000"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                      placeholder="Enter payment amount"
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.amount ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {formData.amount > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      Amount: {formatCurrency(formData.amount)}
                    </p>
                  )}
                  {errors.amount && (
                    <p className="text-sm text-red-500 mt-1">{errors.amount}</p>
                  )}
                </div>

                {/* Payment Channel */}
                <div>
                  <label htmlFor="paymentChannel" className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Channel *
                  </label>                  <select
                    id="paymentChannel"
                    value={formData.paymentChannel}
                    onChange={(e) => handleInputChange('paymentChannel', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.paymentChannel ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="atm_transfer">ATM Transfer</option>
                    <option value="internet_banking">Internet Banking</option>
                    <option value="mobile_banking">Mobile Banking</option>
                    <option value="cash">Cash</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.paymentChannel && (
                    <p className="text-sm text-red-500 mt-1">{errors.paymentChannel}</p>
                  )}
                </div>

                <hr className="border-gray-200" />

                {/* Bank Details */}                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Bank Name *
                    </label>
                    <select
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => handleInputChange('bankName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.bankName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select your bank</option>
                      <option value="BCA">Bank BCA</option>
                      <option value="BNI">Bank BNI</option>
                      <option value="BRI">Bank BRI</option>
                      <option value="Mandiri">Bank Mandiri</option>
                      <option value="CIMB Niaga">CIMB Niaga</option>
                      <option value="Danamon">Bank Danamon</option>
                      <option value="BTN">Bank BTN</option>
                      <option value="Permata">Bank Permata</option>
                      <option value="BNI Syariah">BNI Syariah</option>
                      <option value="BSI">Bank Syariah Indonesia</option>
                      <option value="Other">Other Bank</option>
                    </select>
                    {formData.bankName === 'Other' && (
                      <input
                        type="text"
                        placeholder="Enter bank name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onChange={(e) => handleInputChange('bankName', e.target.value)}
                      />
                    )}
                    {errors.bankName && (
                      <p className="text-sm text-red-500 mt-1">{errors.bankName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number *
                    </label>
                    <input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                      placeholder="Enter account number"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.accountNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.accountNumber && (
                      <p className="text-sm text-red-500 mt-1">{errors.accountNumber}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-700 mb-2">
                      Account Holder Name *
                    </label>
                    <input
                      id="accountHolderName"
                      value={formData.accountHolderName}
                      onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                      placeholder="Enter account holder name"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.accountHolderName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.accountHolderName && (
                      <p className="text-sm text-red-500 mt-1">{errors.accountHolderName}</p>
                    )}
                  </div>                  <div>
                    <label htmlFor="transferDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Transfer Date *
                    </label>
                    <input
                      id="transferDate"
                      type="datetime-local"
                      value={formData.transferDate.slice(0, 16)}
                      onChange={(e) => handleInputChange('transferDate', e.target.value + ':00Z')}
                      max={new Date().toISOString().slice(0, 16)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.transferDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.transferDate && (
                      <p className="text-sm text-red-500 mt-1">{errors.transferDate}</p>
                    )}
                  </div>
                </div>

                <hr className="border-gray-200" />

                {/* Upload Payment Proof */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Proof *
                  </label>
                  <div className="mt-2">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        id="paymentProof"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      
                      {imagePreview ? (
                        <div className="space-y-4">
                          <img
                            src={imagePreview}
                            alt="Payment proof preview"
                            className="mx-auto max-w-full h-48 object-cover rounded-lg border"
                          />
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-green-600 text-sm">🖼️</span>
                            <span className="text-sm text-green-600 font-medium">
                              {formData.fileName}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => document.getElementById('paymentProof').click()}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Change Image
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-4xl text-gray-400">📁</div>
                          <div>
                            <button
                              type="button"
                              onClick={() => document.getElementById('paymentProof').click()}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Upload Payment Proof
                            </button>
                          </div>                          <p className="text-sm text-gray-500">
                            PNG, JPG, JPEG, WebP or GIF up to 5MB
                          </p>
                        </div>
                      )}
                    </div>
                    {errors.image && (
                      <p className="text-sm text-red-500 mt-1">{errors.image}</p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Add any additional notes about this payment"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>                {/* Error Alert */}
                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-error="submit">
                    <div className="flex items-start">
                      <div className="text-red-400 mr-3 mt-0.5">⚠️</div>
                      <div>
                        <h4 className="text-red-800 font-medium mb-1">Submission Error</h4>
                        <p className="text-red-700 text-sm">{errors.submit}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reference Error */}
                {errors.reference && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 text-sm">{errors.reference}</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>                  <button
                    type="submit"
                    disabled={submitting || preventSubmission || !formData.imageContent || Object.keys(errors).length > 0}
                    className={`px-6 py-2 rounded-lg transition-colors min-w-32 flex items-center justify-center ${
                      preventSubmission 
                        ? 'bg-gray-400 text-white cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                    title={preventSubmission ? 'Cannot submit new payment while another is pending' : ''}
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : preventSubmission ? (
                      'Payment Pending Verification'
                    ) : (
                      'Submit Payment'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateManualPayment;
