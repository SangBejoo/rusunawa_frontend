import axios from 'axios';
import { API_URL, getAuthHeader } from '../utils/apiConfig';
import authService from './authService';
import tenantAuthService from './tenantAuthService';
import { paymentCache } from '../utils/apiCache';

// Create a function to get config with auth headers
const getConfig = () => {
  try {
    // Try tenant auth first, fallback to regular auth
    const tenantToken = tenantAuthService.getToken();
    const regularToken = authService.getToken();
    const token = tenantToken || regularToken;
    
    return {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    return {
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};

/**
 * Service for handling payment-related operations
 */
const paymentService = {
  /**
   * Generate an invoice with payment link for a booking
   * @param {number} bookingId - The booking ID
   * @param {number} methodId - The payment method ID (1=Midtrans, 2=Manual)
   * @returns {Promise<Object>} The invoice and payment link data
   */
  generateInvoice: async (bookingId, methodId) => {
    try {
      // Add authorization header
      const token = authService.getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Log the request for debugging
      console.log(`Generating invoice for booking ${bookingId} with payment method ${methodId}`);
      
      const response = await axios.post(
        `${API_URL}/bookings/${bookingId}/invoice`,
        { method_id: methodId },
        config
      );
      
      // Log the response for debugging
      console.log("Generate invoice response:", response.data);
      
      // Format the response to standardize the fields
      return {
        invoice: response.data.invoice,
        paymentLink: response.data.paymentLink,
        payment_url: response.data.paymentUrl,
        invoice_id: response.data.invoice?.invoiceId,
        status: response.data.status
      };
    } catch (error) {
      console.error(`Error generating invoice for booking ${bookingId}:`, error);
      throw error.response?.data || { message: 'Failed to generate invoice' };
    }
  },

  /**
   * Generate invoice with Midtrans integration (NEW API)
   * @param {Object} invoiceData - Invoice generation data
   * @returns {Promise<Object>} The invoice and payment token
   */
  generateInvoiceWithMidtrans: async (invoiceData) => {
    try {
      const config = getConfig();
      console.log('Generating invoice with Midtrans:', invoiceData);
      
      const response = await axios.post(
        `${API_URL}/invoices/generate`,
        invoiceData,
        config
      );
      
      console.log('Generate invoice response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error generating invoice with Midtrans:', error);
      throw error.response?.data || { message: 'Failed to generate invoice with Midtrans' };
    }
  },
  /**
   * Get available payment methods
   * @returns {Promise<Object>} The payment methods
   */
  getPaymentMethods: async () => {
    try {
      // Use the correct endpoint for payment methods
      const config = getConfig();
      console.log('Fetching payment methods...');
      
      const response = await axios.get(`${API_URL}/payment-methods`, config);
      console.log('Payment methods response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      
      // Return mock data as fallback if endpoint doesn't exist yet
      const mockPaymentMethods = {
        methods: [
          {
            methodId: 1,
            name: 'midtrans',
            description: 'Online Payment (Credit Card, Bank Transfer, E-Wallet)',
            enabled: true
          },
          {
            methodId: 2,
            name: 'manual',
            description: 'Manual Transfer with Receipt Upload',
            enabled: true
          }
        ]
      };
      
      console.warn('Using mock payment methods data');
      return mockPaymentMethods;
    }
  },

  /**
   * Upload a payment receipt for an invoice
   * @param {number} invoiceId - The invoice ID
   * @param {Object} receiptData - The receipt data
   * @returns {Promise<Object>} The upload response
   */
  uploadPaymentReceipt: async (invoiceId, receiptData) => {
    try {
      // Add authorization header
      const token = authService.getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.post(
        `${API_URL}/invoices/${invoiceId}/receipt`,
        receiptData,
        config
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error uploading receipt for invoice ${invoiceId}:`, error);
      throw error.response?.data || { message: 'Failed to upload payment receipt' };
    }
  },

  /**
   * Get payment receipt image
   * @param {number} paymentId - The payment ID
   * @returns {Promise<Object>} The receipt image data
   */
  getPaymentReceiptImage: async (paymentId) => {
    try {
      // Add authorization header
      const token = authService.getToken();
      const config = { 
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer'  // Important for image data
      };
      
      const response = await axios.get(
        `${API_URL}/payments/${paymentId}/receipt-image`,
        config
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching receipt image for payment ${paymentId}:`, error);
      throw error.response?.data || { message: 'Failed to fetch payment receipt image' };
    }
  },

  /**
   * Get payment link by room
   * @param {number} roomId - The room ID
   * @returns {Promise<Object>} The payment link data
   */
  getPaymentLinkByRoom: async (roomId) => {
    try {
      const response = await axios.get(`${API_URL}/rooms/${roomId}/payment-link`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching payment link for room ${roomId}:`, error);
      throw error.response?.data || { message: 'Failed to fetch payment link' };
    }
  },

  /**
   * Check Midtrans payment status
   * @param {string} transactionId - The Midtrans transaction ID
   * @returns {Promise<Object>} The payment status data
   */
  checkMidtransPaymentStatus: async (transactionId) => {
    try {
      // Add authorization header if authenticated
      const token = authService.getToken();
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      console.log(`Checking payment status for transaction ID: ${transactionId}`);
      
      const response = await axios.get(
        `${API_URL}/payments/midtrans/${transactionId}/status`,
        config
      );
      
      console.log("Payment status check response:", response.data);
      return response.data;
    } catch (error) {
      console.error(`Error checking Midtrans payment status for transaction ${transactionId}:`, error);
      throw error.response?.data || { message: 'Failed to check payment status' };
    }
  },

  /**
   * Handle Midtrans payment callback
   * @param {Object} callbackData - The callback data from Midtrans
   * @returns {Promise<Object>} The update response
   */
  handlePaymentCallback: async (callbackData) => {
    try {
      // Add authorization header if authenticated
      const token = authService.getToken();
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.post(
        `${API_URL}/payments/midtrans/callback`,
        callbackData,
        config
      );
      
      return response.data;
    } catch (error) {
      console.error('Error handling payment callback:', error);
      throw error.response?.data || { message: 'Failed to process payment callback' };
    }
  },
  /**
   * Create manual payment
   * @param {Object} paymentData - Manual payment data
   * @returns {Promise<Object>} The payment response
   */
  createManualPayment: async (paymentData) => {
    try {
      const config = getConfig();
      
      const response = await axios.post(
        `${API_URL}/payments/manual`,
        paymentData,
        config
      );
      
      return response.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Manual payment error:', error.response?.data || error.message);
      }
      throw error.response?.data || { message: 'Failed to create manual payment' };
    }
  },

  /**
   * Verify manual payment
   * @param {number} paymentId - The payment ID
   * @param {Object} verificationData - Verification data
   * @returns {Promise<Object>} The verification response
   */
  verifyPayment: async (paymentId, verificationData) => {
    try {
      const config = getConfig();
      console.log(`Verifying payment ${paymentId}:`, verificationData);
      
      const response = await axios.post(
        `${API_URL}/payments/${paymentId}/verify`,
        verificationData,
        config
      );
      
      console.log('Payment verification response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error verifying payment ${paymentId}:`, error);
      throw error.response?.data || { message: 'Failed to verify payment' };
    }
  },

  /**
   * Get payment by ID
   * @param {number} paymentId - The payment ID
   * @param {Object} options - Include options for proof metadata
   * @returns {Promise<Object>} Payment data
   */
  getPayment: async (paymentId, options = {}) => {
    try {
      const config = getConfig();
      
      // Add query parameters for including proof metadata and image content
      const queryParams = new URLSearchParams();
      queryParams.append('include_proof_metadata', 'true');
      queryParams.append('include_image_content', 'true');
      
      if (options.includeImageContent !== false) {
        queryParams.append('include_image_content', 'true');
      }
      
      const url = `${API_URL}/payments/${paymentId}?${queryParams.toString()}`;
      
      const response = await axios.get(url, config);
      return response.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error fetching payment ${paymentId}:`, error.message);
      }
      throw error.response?.data || { message: 'Failed to fetch payment details' };
    }
  },
  
  /**
   * Get all payments
   * @returns {Promise<Object>} List of payments
   */
  getPayments: async () => {
    try {
      const config = getConfig();
      const response = await axios.get(`${API_URL}/payments`, config);
      return response.data;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error.response?.data || { message: 'Failed to fetch payments' };
    }
  },

  /**
   * Get invoices
   * @returns {Promise<Object>} List of invoices
   */
  getInvoices: async () => {
    try {
      const config = getConfig();
      const response = await axios.get(`${API_URL}/invoices`, config);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error.response?.data || { message: 'Failed to fetch invoices' };
    }
  },

  /**
   * Get booking payments
   * @param {number} bookingId - The booking ID
   * @returns {Promise<Object>} Payments data
   */
  getBookingPayments: async (bookingId) => {
    try {
      const token = authService.getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.get(`${API_URL}/bookings/${bookingId}/payments`, config);
      return response.data;
    } catch (error) {
      console.error(`Error fetching payments for booking ${bookingId}:`, error);
      throw error.response?.data || { message: 'Failed to fetch booking payments' };
    }
  },
  
  /**
   * Get Midtrans payment link
   * @param {Object} data - Object containing tenant_type and rental_type
   * @returns {Promise<Object>} Payment link data
   */
  getMidtransPaymentLink: async (data) => {
    try {
      const token = authService.getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.post(`${API_URL}/payments/midtrans/link`, data, config);
      return response.data;
    } catch (error) {
      console.error('Error fetching Midtrans payment link:', error);
      throw error.response?.data || { message: 'Failed to fetch payment link' };
    }
  },
  
  /**
   * Upload payment proof
   * @param {number} paymentId - The payment ID
   * @param {FormData} formData - Form data with the receipt file
   * @returns {Promise<Object>} Upload response
   */
  uploadPaymentProof: async (paymentId, formData) => {
    try {
      const token = authService.getToken();
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        } 
      };
      
      const response = await axios.post(
        `${API_URL}/payments/${paymentId}/proof`,
        formData,
        config
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error uploading payment proof for payment ${paymentId}:`, error);
      throw error.response?.data || { message: 'Failed to upload payment proof' };
    }
  },
  
  /**
   * Get tenant invoice history
   * @param {number} tenantId - The tenant ID
   * @returns {Promise<Object>} The invoice history
   */
  getTenantInvoices: async (tenantId) => {
    try {
      const response = await axios.get(`${API_URL}/tenants/${tenantId}/invoices`, getConfig());
      return response.data;
    } catch (error) {
      console.error('Error fetching tenant invoices:', error);
      throw error.response?.data || { message: 'Failed to fetch tenant invoices' };
    }
  },

  /**
   * Get tenant payment history
   * @param {number} tenantId - The tenant ID
   * @returns {Promise<Object>} The payment history
   */
  getTenantPayments: async (tenantId) => {
    try {
      const response = await axios.get(`${API_URL}/tenants/${tenantId}/payments`, getConfig());
      return response.data;
    } catch (error) {
      console.error('Error fetching tenant payments:', error);
      throw error.response?.data || { message: 'Failed to fetch tenant payments' };
    }
  },

  /**
   * Get payment status for a booking
   * @param {number} bookingId - The booking ID
   * @returns {Promise<Object>} The payment status
   */
  getBookingPaymentStatus: async (bookingId) => {
    try {
      const response = await axios.get(`${API_URL}/bookings/${bookingId}/payment-status`, getConfig());
      return response.data;
    } catch (error) {
      console.error('Error fetching booking payment status:', error);
      throw error.response?.data || { message: 'Failed to fetch booking payment status' };
    }
  },
  
  /**
   * Handle Midtrans callback (for frontend testing)
   * @param {Object} callbackData - The callback data from Midtrans
   * @returns {Promise<Object>} The update response
   */
  handleMidtransCallback: async (callbackData) => {
    try {
      const config = getConfig();
      
      const response = await axios.post(
        `${API_URL}/payments/midtrans-callback`,
        callbackData,
        config
      );
        return response.data;
    } catch (error) {
      console.error('Error handling Midtrans callback:', error);
      throw error.response?.data || { message: 'Failed to process Midtrans callback' };
    }
  },

  /**
   * Download payment receipt
   * @param {number} paymentId - The payment ID
   * @returns {Promise<Blob>} The receipt file
   */
  downloadReceipt: async (paymentId) => {
    try {
      const config = {
        ...getConfig(),
        responseType: 'blob'
      };
        const response = await axios.get(
        `${API_URL}/payments/${paymentId}/receipt`,
        config
      );
      
      return response.data;
    } catch (error) {
      console.error('Error downloading receipt:', error);
      throw error.response?.data || { message: 'Failed to download receipt' };
    }
  },

  /**
   * Download invoice as PDF
   * @param {number} invoiceId - The invoice ID
   * @returns {Promise<Blob>} The invoice PDF
   */
  downloadInvoicePDF: async (invoiceId) => {
    try {
      const config = {
        ...getConfig(),
        responseType: 'blob'
      };
        const response = await axios.get(
        `${API_URL}/invoices/${invoiceId}/pdf`,
        config
      );
      
      return response.data;
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      throw error.response?.data || { message: 'Failed to download invoice PDF' };
    }
  },

  /**
   * Get payment statistics for tenant dashboard
   * @returns {Promise<Object>} Payment statistics
   */
  getPaymentStatistics: async () => {
    try {
      const config = getConfig();
        const response = await axios.get(
        `${API_URL}/payments/statistics`,
        config
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching payment statistics:', error);
      throw error.response?.data || { message: 'Failed to fetch payment statistics' };
    }
  },

  /**
   * Get pending payments for the authenticated tenant
   * @returns {Promise<Object>} List of pending payments
   */
  getPendingPayments: async () => {
    try {
      const config = getConfig();
        const response = await axios.get(
        `${API_URL}/payments/pending`,
        config
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      throw error.response?.data || { message: 'Failed to fetch pending payments' };
    }
  },

  /**
   * Get overdue invoices for the authenticated tenant
   * @returns {Promise<Object>} List of overdue invoices
   */
  getOverdueInvoices: async () => {
    try {
      const config = getConfig();
        const response = await axios.get(
        `${API_URL}/invoices/overdue`,
        config
      );
        return response.data;
    } catch (error) {
      console.error('Error fetching overdue invoices:', error);
      throw error.response?.data || { message: 'Failed to fetch overdue invoices' };
    }
  },

  /**
   * Generate Snap token for Midtrans payment
   * @param {number} bookingId - The booking ID (optional)
   * @param {number} invoiceId - The invoice ID (optional)
   * @returns {Promise<Object>} The Snap token response
   */
  generateSnapToken: async (bookingId, invoiceId) => {
    try {
      const config = getConfig();
      const endpoint = `${API_URL}/payments/snap-token`;
      
      const requestData = {};
      if (bookingId) requestData.booking_id = bookingId;
      if (invoiceId) requestData.invoice_id = invoiceId;
      
      console.log('Generating Snap token with data:', requestData);
      
      const response = await axios.post(endpoint, requestData, config);
      
      console.log('Snap token response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error generating Snap token:', error);
      throw error.response?.data || { message: 'Failed to generate Snap token' };
    }
  },

  /**
   * Get tenant payments with proof details
   * @param {number} tenantId - The tenant ID
   * @param {Object} params - Filter parameters
   * @returns {Promise<Object>} Enhanced payment list with proof details
   */
  getTenantPaymentsWithProof: async (tenantId, params = {}) => {
    try {
      // Check cache first for non-real-time data
      const cacheKey = `tenant-payments-proof-${tenantId}`;
      const cached = paymentCache.get(cacheKey, params);
      if (cached && !params.forceRefresh) {
        return cached;
      }
      
      const config = getConfig();
      const queryParams = new URLSearchParams();
      
      // Add filter parameters
      if (params.status) queryParams.append('status', params.status);
      if (params.paymentMethod) queryParams.append('payment_method', params.paymentMethod);
      if (params.paymentChannel) queryParams.append('payment_channel', params.paymentChannel);
      if (params.dateFrom) queryParams.append('date_from', params.dateFrom);
      if (params.dateTo) queryParams.append('date_to', params.dateTo);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.sortBy) queryParams.append('sort_by', params.sortBy);
      if (params.sortOrder) queryParams.append('sort_order', params.sortOrder);
      if (params.includeProofMetadata) queryParams.append('include_proof_metadata', params.includeProofMetadata);
      if (params.includeInvoiceDetails) queryParams.append('include_invoice_details', params.includeInvoiceDetails);
      
      const queryString = queryParams.toString();
      const url = `${API_URL}/tenants/${tenantId}/payments/with-proof${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get tenant payments with proof');
      }
      
      // Cache for 1 minute
      paymentCache.set(cacheKey, params, data, 60 * 1000);
      
      return data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting tenant payments with proof:', error.message);
      }
      throw error;
    }
  },

  /**
   * Get tenant invoice by ID with optional includes
   * @param {number} tenantId - The tenant ID
   * @param {number} invoiceId - The invoice ID
   * @param {Object} options - Include options
   * @returns {Promise<Object>} Invoice details
   */
  getTenantInvoiceById: async (tenantId, invoiceId, options = {}) => {
    try {
      console.log('Getting tenant invoice:', { tenantId, invoiceId, options });
      
      const config = getConfig();
      const queryParams = new URLSearchParams();
      
      if (options.includePayments) queryParams.append('include_payments', options.includePayments);
      if (options.includeItems) queryParams.append('include_items', options.includeItems);
      if (options.includeProofMetadata) queryParams.append('include_proof_metadata', options.includeProofMetadata);
      
      const queryString = queryParams.toString();
      const url = `${API_URL}/tenants/${tenantId}/invoices/${invoiceId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, config);
      const data = await response.json();
      
      console.log('Tenant invoice response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get tenant invoice');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting tenant invoice:', error);
      throw error;
    }
  },
  /**
   * Get payment proof metadata
   * @param {number} paymentId - The payment ID
   * @returns {Promise<Object>} Payment proof metadata
   */
  getPaymentProofMetadata: async (paymentId) => {
    try {
      console.log('Getting payment proof metadata for payment:', paymentId);
      
      const config = getConfig();
      const response = await fetch(`${API_URL}/payments/${paymentId}/proof/metadata`, config);
      const data = await response.json();
      
      console.log('Payment proof metadata response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get payment proof metadata');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting payment proof metadata:', error);
      throw error;
    }
  },  /**
   * Check if there are pending manual payments for an invoice
   * Uses both invoice payments array and tenant payments endpoint as fallback
   * @param {number} invoiceId - The invoice ID
   * @param {number} tenantId - The tenant ID
   * @returns {Promise<Object>} Check result with pending payment info
   */
  checkPendingManualPayments: async (invoiceId, tenantId) => {
    try {
      if (!tenantId) {
        // Try to get tenant ID from localStorage
        const tenantData = JSON.parse(localStorage.getItem('tenant') || '{}');
        tenantId = tenantData.tenantId || tenantData.tenant_id || tenantData.id;
      }
        if (!tenantId) {
        console.warn('No tenant ID available for pending payment check');
        return {
          hasPendingPayments: false,
          pendingPayments: [],
          total: 0
        };
      }
      
      console.log(`Checking pending manual payments for invoice ${invoiceId}, tenant ${tenantId}`);
      
      // Strategy 1: First try to get invoice details (which should include payments array)
      try {
        const invoicesResponse = await paymentService.getTenantInvoices(tenantId);
        
        if (invoicesResponse && invoicesResponse.invoices) {
          const targetInvoice = invoicesResponse.invoices.find(inv => 
            inv.invoiceId === invoiceId || inv.invoice_id === invoiceId
          );
            if (targetInvoice && targetInvoice.payments && targetInvoice.payments.length > 0) {
            // Check payments in the invoice using exact API field names
            const pendingPayments = targetInvoice.payments.filter(payment => {
              const isPending = payment.status === 'pending';
              const isManual = payment.paymentMethod === 'manual';
              
              return isPending && isManual;
            });
            
            if (pendingPayments.length > 0) {
              console.log('Found pending payments in invoice:', pendingPayments);
              return {
                hasPendingPayments: true,
                pendingPayments: pendingPayments,
                total: pendingPayments.length
              };
            }
          }
        }
      } catch (invoiceError) {
        console.warn('Could not check invoice payments, falling back to tenant payments:', invoiceError);
      }
      
      // Strategy 2: Fallback to tenant payments endpoint
      try {
        const response = await paymentService.getTenantPayments(tenantId);
          if (response && response.payments) {
          // Filter for pending manual payments for this invoice
          // Using exact field names from actual API response
          const pendingPayments = response.payments.filter(payment => {
            const matchesInvoice = payment.invoiceId === invoiceId;
            const isPending = payment.status === 'pending';
            const isManual = payment.paymentMethod === 'manual';
            
            console.log(`Checking payment ${payment.paymentId}: invoice=${payment.invoiceId}, status=${payment.status}, method=${payment.paymentMethod}`);
            console.log(`Matches: invoice=${matchesInvoice}, pending=${isPending}, manual=${isManual}`);
            
            return matchesInvoice && isPending && isManual;
          });
          
          const result = {
            hasPendingPayments: pendingPayments.length > 0,
            pendingPayments: pendingPayments,
            total: pendingPayments.length
          };
          
          console.log('Pending payments check result from tenant payments:', result);
          return result;
        }
      } catch (paymentsError) {
        console.warn('Could not check tenant payments:', paymentsError);
      }
      
      // No pending payments found
      return {
        hasPendingPayments: false,
        pendingPayments: [],
        total: 0
      };
    } catch (error) {
      console.error(`Error checking pending payments for invoice ${invoiceId}:`, error);
      // Don't throw error - return false to allow payment flow to continue
      console.warn('Allowing payment flow to continue due to API error');
      return {
        hasPendingPayments: false,
        pendingPayments: [],
        total: 0,
        error: error.message
      };
    }
  },

  /**
   * Get payment proof details for display
   * @param {number} paymentId - The payment ID
   * @returns {Promise<Object>} Payment proof details
   */
  getPaymentProofDetails: async (paymentId) => {
    try {
      const config = getConfig();
      console.log(`Getting payment proof details for payment ${paymentId}`);
      
      const response = await axios.get(
        `${API_URL}/payments/${paymentId}/proof/details`,
        config
      );
      
      console.log('Payment proof details response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error getting payment proof details for payment ${paymentId}:`, error);
      throw error.response?.data || { message: 'Failed to get payment proof details' };
    }
  },

  /**
   * Get payment proof image as base64
   * @param {number} paymentId - The payment ID
   * @param {Object} options - Format options (format, encoding)
   * @returns {Promise<Object>} Payment proof image data
   */
  getPaymentProofImage: async (paymentId, options = {}) => {
    try {
      const config = getConfig();
      const params = new URLSearchParams();
      
      if (options.format) params.append('format', options.format);
      if (options.encoding) params.append('encoding', options.encoding);
      
      console.log(`Getting payment proof image for payment ${paymentId}`);
      
      const response = await axios.get(
        `${API_URL}/payments/${paymentId}/proof/image?${params.toString()}`,
        config
      );
      
      console.log('Payment proof image response received');
      return response.data;
    } catch (error) {
      console.error(`Error getting payment proof image for payment ${paymentId}:`, error);
      throw error.response?.data || { message: 'Failed to get payment proof image' };
    }
  },

  /**
   * Create payment for booking with dynamic rate calculation
   * @param {number} bookingId - The booking ID
   * @param {number} paymentMethodId - The payment method ID
   * @param {Object} paymentData - Additional payment data
   * @returns {Promise<Object>} The payment creation response
   */
  createDynamicPayment: async (bookingId, paymentMethodId, paymentData = {}) => {
    try {
      const config = getConfig();
      
      const requestData = {
        booking_id: parseInt(bookingId),
        payment_method_id: parseInt(paymentMethodId),
        ...paymentData
      };

      console.log('Creating dynamic payment with data:', requestData);
      const response = await axios.post(`${API_URL}/bookings/${bookingId}/payments`, requestData, config);
      
      if (response.data) {
        return response.data;
      }
      
      throw new Error("No payment data received");
    } catch (error) {
      console.error('Error creating dynamic payment:', error);
      throw error.response?.data || { 
        message: error.message || 'Failed to create payment',
        details: error.toString()
      };
    }
  },

  /**
   * Get invoice with dynamic rate breakdown
   * @param {number} invoiceId - The invoice ID
   * @returns {Promise<Object>} The invoice with rate breakdown
   */
  getInvoiceWithBreakdown: async (invoiceId) => {
    try {
      const config = getConfig();
      
      console.log(`Getting invoice breakdown for invoice ${invoiceId}`);
      const response = await axios.get(`${API_URL}/invoices/${invoiceId}/breakdown`, config);
      
      if (response.data) {
        return response.data;
      }
      
      throw new Error("No invoice breakdown data received");
    } catch (error) {
      console.error('Error getting invoice breakdown:', error);
      throw error.response?.data || { 
        message: error.message || 'Failed to get invoice breakdown',
        details: error.toString()
      };
    }
  },

  /**
   * Process Midtrans payment with dynamic amount
   * @param {number} invoiceId - The invoice ID
   * @param {Object} customerDetails - Customer information
   * @returns {Promise<Object>} The Midtrans payment response
   */
  processMidtransPayment: async (invoiceId, customerDetails) => {
    try {
      const config = getConfig();
      
      const requestData = {
        invoice_id: parseInt(invoiceId),
        customer_details: customerDetails
      };

      console.log('Processing Midtrans payment with data:', requestData);
      const response = await axios.post(`${API_URL}/payments/midtrans/create`, requestData, config);
      
      if (response.data) {
        return response.data;
      }
      
      throw new Error("No Midtrans payment data received");
    } catch (error) {
      console.error('Error processing Midtrans payment:', error);
      throw error.response?.data || { 
        message: error.message || 'Failed to process Midtrans payment',
        details: error.toString()
      };
    }
  },

  /**
   * Upload manual payment proof
   * @param {number} invoiceId - The invoice ID
   * @param {File} proofFile - The payment proof file
   * @param {Object} paymentData - Additional payment information
   * @returns {Promise<Object>} The manual payment response
   */
  uploadManualPaymentProof: async (invoiceId, proofFile, paymentData) => {
    try {
      const token = tenantAuthService.getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const formData = new FormData();
      formData.append('invoice_id', invoiceId);
      formData.append('payment_proof', proofFile);
      formData.append('bank_name', paymentData.bankName || '');
      formData.append('account_name', paymentData.accountName || '');
      formData.append('transfer_date', paymentData.transferDate || '');
      formData.append('amount', paymentData.amount || '');
      formData.append('notes', paymentData.notes || '');

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      console.log('Uploading manual payment proof for invoice:', invoiceId);
      const response = await axios.post(`${API_URL}/payments/manual/upload`, formData, config);
      
      if (response.data) {
        return response.data;
      }
      
      throw new Error("No manual payment response received");
    } catch (error) {
      console.error('Error uploading manual payment proof:', error);
      throw error.response?.data || { 
        message: error.message || 'Failed to upload payment proof',
        details: error.toString()
      };
    }
  },

};

export default paymentService;
