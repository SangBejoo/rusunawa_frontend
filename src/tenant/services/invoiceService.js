import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import tenantAuthService from './tenantAuthService';

// Update API URL to match the correct backend endpoint
const API_URL = `${API_BASE_URL || 'rusunawa-skripsi-v1-production.up.railway.app'}/v1`;

/**
 * Service for handling invoice-related operations
 */
const invoiceService = {
  /**
   * Get an invoice by ID
   * @param {number} invoiceId - The invoice ID
   * @returns {Promise<Object>} The invoice data
   */
  getInvoice: async (invoiceId) => {
    try {
      // Add authorization header if logged in
      const token = tenantAuthService.getToken();
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.get(`${API_URL}/invoices/${invoiceId}`, config);
      return response.data;
    } catch (error) {
      console.error(`Error fetching invoice ${invoiceId}:`, error);
      throw error.response?.data || { message: 'Failed to fetch invoice details' };
    }
  },

  /**
   * Get invoices for the current tenant
   * @param {Object} params - Query parameters for filtering
   * @returns {Promise<Object>} The tenant's invoices
   */
  getTenantInvoices: async (params = {}) => {
    try {
      const token = tenantAuthService.getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Get current tenant
      const currentTenant = tenantAuthService.getCurrentTenant();
      if (!currentTenant || !currentTenant.tenantId) {
        throw new Error('No authenticated tenant found');
      }
      
      console.log(`Fetching invoices for tenant ${currentTenant.tenantId}...`);
      
      const response = await axios.get(
        `${API_URL}/tenants/${currentTenant.tenantId}/invoices`, 
        { ...config, params }
      );
      
      console.log('Tenant invoices response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching tenant invoices:', error);
      throw error.response?.data || { message: 'Failed to fetch invoices' };
    }
  },
  /**
   * Get tenant invoice by ID with includes
   * @param {number} tenantId - The tenant ID
   * @param {number} invoiceId - The invoice ID
   * @param {Object} options - Include options
   * @returns {Promise<Object>} The invoice data
   */
  getTenantInvoiceById: async (tenantId, invoiceId, options = {}) => {
    try {
      const token = tenantAuthService.getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const queryParams = new URLSearchParams();
      if (options.includePayments) queryParams.append('include_payments', options.includePayments);
      if (options.includeItems) queryParams.append('include_items', options.includeItems);
      if (options.includeProofMetadata) queryParams.append('include_proof_metadata', options.includeProofMetadata);
      
      const queryString = queryParams.toString();
      const url = `${API_URL}/tenants/${tenantId}/invoices/${invoiceId}${queryString ? `?${queryString}` : ''}`;
      
      console.log('Fetching tenant invoice:', url);
      
      const response = await axios.get(url, config);
      console.log('Tenant invoice response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching tenant invoice ${invoiceId}:`, error);
      throw error.response?.data || { message: 'Failed to fetch invoice details' };
    }
  },
  /**
   * Get detailed invoice information for a tenant
   * @param {number} tenantId - The tenant ID
   * @param {number} invoiceId - The invoice ID
   * @param {Object} options - Include options
   * @returns {Promise<Object>} The detailed invoice data
   */
  getInvoiceDetails: async (tenantId, invoiceId, options = {}) => {
    try {
      const token = tenantAuthService.getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const queryParams = new URLSearchParams();
      if (options.includePayments !== false) queryParams.append('include_payments', 'true');
      if (options.includeItems !== false) queryParams.append('include_items', 'true');
      if (options.includeProofMetadata !== false) queryParams.append('include_proof_metadata', 'true');
      
      const queryString = queryParams.toString();
      const url = `${API_URL}/tenants/${tenantId}/invoices/${invoiceId}${queryString ? `?${queryString}` : ''}`;
      
      console.log('Fetching invoice details:', url);
      
      const response = await axios.get(url, config);
      console.log('Invoice details response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching invoice details for tenant ${tenantId}, invoice ${invoiceId}:`, error);
      throw error.response?.data || { message: 'Failed to fetch invoice details' };
    }
  },
  generateInvoiceWithMidtrans: async (invoiceData) => {
    try {
      const token = tenantAuthService.getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.post(
        `${API_URL}/invoices/generate`, 
        invoiceData,
        config
      );
        return response.data;
    } catch (error) {
      console.error('Error generating invoice with Midtrans:', error);
      throw error.response?.data || { message: 'Failed to generate invoice with Midtrans' };
    }
  },

  /**
   * Update an invoice's status
   * @param {number} invoiceId - The invoice ID
   * @param {string} status - The new status
   * @param {string} midtransPaymentId - Optional Midtrans payment ID
   * @returns {Promise<Object>} The update response
   */
  updateInvoiceStatus: async (invoiceId, status, midtransPaymentId = null) => {
    try {
      // Add authorization header
      const token = tenantAuthService.getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const paidAt = status === 'paid' ? new Date().toISOString() : null;
      const payload = { status, midtransPaymentId, paidAt };
      
      const response = await axios.put(
        `${API_URL}/${invoiceId}/status`, 
        payload, 
        config
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error updating status for invoice ${invoiceId}:`, error);
      throw error.response?.data || { message: 'Failed to update invoice status' };
    }
  },

  /**
   * Upload a payment receipt for an invoice
   * @param {number} invoiceId - The invoice ID
   * @param {Object} receiptData - The receipt data including file content
   * @returns {Promise<Object>} The upload response
   */
  uploadReceipt: async (invoiceId, receiptData) => {
    try {
      // Add authorization header
      const token = tenantAuthService.getToken();
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      };
      
      // For JSON-formatted request:
      const response = await axios.post(
        `${API_URL}/${invoiceId}/receipt`,
        receiptData,
        config
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error uploading receipt for invoice ${invoiceId}:`, error);
      throw error.response?.data || { message: 'Failed to upload receipt' };
    }
  }
};

export default invoiceService;
