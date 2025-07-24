import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';
import tenantAuthService from './tenantAuthService';

/**
 * Service for handling document-related operations
 */
const documentService = {
  /**
   * Get tenant documents
   * @returns {Promise<Object>} The documents response
   */
  getTenantDocuments: async () => {
    try {
      const token = tenantAuthService.getToken();
      const tenant = tenantAuthService.getCurrentTenant();
      
      if (!token || !tenant?.tenantId) {
        throw new Error('No authenticated tenant found');
      }

      const config = { 
        headers: { Authorization: `Bearer ${token}` }
      };

      // Use the correct tenant-specific endpoint
      const response = await axios.get(`${API_BASE_URL}/v1/tenants/${tenant.tenantId}/documents`, config);
      return response.data;
    } catch (error) {
      console.error('Error fetching tenant documents:', error);
      
      // Return empty result for 404 errors (no documents yet)
      if (error.response?.status === 404) {
        return { documents: [] };
      }
      
      throw error.response?.data || { message: 'Failed to fetch documents' };
    }
  },
  /**
   * Upload a new document
   * @param {Object} documentData - The document data object
   * @returns {Promise<Object} The upload response
   */
  uploadDocument: async (documentData) => {
    try {
      const token = tenantAuthService.getToken();
      const tenant = tenantAuthService.getCurrentTenant();
      
      if (!token || !tenant?.tenantId) {
        throw new Error('No authenticated tenant found');
      }

      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      // Use the correct tenant-specific upload endpoint
      const response = await axios.post(`${API_BASE_URL}/v1/tenants/${tenant.tenantId}/documents`, documentData, config);
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error.response?.data || { message: 'Failed to upload document' };
    }
  },  /**
   * Delete a document
   * @param {number} documentId - The document ID
   * @returns {Promise<Object>} The delete response
   */
  deleteDocument: async (documentId) => {
    try {
      const token = tenantAuthService.getToken();
      const tenant = tenantAuthService.getCurrentTenant();
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      if (!tenant?.tenantId) {
        throw new Error('No tenant information found');
      }

      const config = { 
        headers: { Authorization: `Bearer ${token}` },
        params: { tenantId: tenant.tenantId } // Add tenantId as query parameter
      };

      console.log(`Attempting to delete document ${documentId} for tenant ${tenant.tenantId}`);
      console.log('Request URL:', `${API_BASE_URL}/v1/documents/${documentId}?tenantId=${tenant.tenantId}`);
      
      const response = await axios.delete(`${API_BASE_URL}/v1/documents/${documentId}`, config);
      
      console.log('Delete response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error deleting document:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      throw error.response?.data || { message: 'Failed to delete document' };
    }
  },

  /**
   * Download a document
   * @param {number} documentId - The document ID
   * @returns {Promise<Blob>} The document file
   */
  downloadDocument: async (documentId) => {
    try {
      const token = tenantAuthService.getToken();
      const tenant = tenantAuthService.getCurrentTenant();
      
      if (!token || !tenant?.tenantId) {
        throw new Error('No authenticated tenant found');
      }

      const config = { 
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      };

      const response = await axios.get(`${API_BASE_URL}/v1/tenants/${tenant.tenantId}/documents/${documentId}/download`, config);
      return response.data;
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error.response?.data || { message: 'Failed to download document' };
    }
  },

  /**
   * Get document image URL
   * @param {number} documentId - The document ID
   * @param {Object} options - URL options (size, quality, format)
   * @returns {string} The image URL
   */
  getDocumentImageUrl: (documentId, options = {}) => {
    const token = tenantAuthService.getToken();
    const tenant = tenantAuthService.getCurrentTenant();
    
    if (!token || !tenant?.tenantId) {
      return '';
    }

    const params = new URLSearchParams();
    if (options.size) params.append('size', options.size);
    if (options.quality) params.append('quality', options.quality);
    if (options.format) params.append('format', options.format);
    
    const queryString = params.toString();
    return `${API_BASE_URL}/v1/tenants/${tenant.tenantId}/documents/${documentId}/image${queryString ? `?${queryString}` : ''}`;
  },

  /**
   * Get document thumbnail URL
   * @param {number} documentId - The document ID
   * @param {Object} options - Thumbnail options (size, format)
   * @returns {string} The thumbnail URL
   */
  getDocumentThumbnailUrl: (documentId, options = {}) => {
    const token = tenantAuthService.getToken();
    const tenant = tenantAuthService.getCurrentTenant();
    
    if (!token || !tenant?.tenantId) {
      return '';
    }

    const params = new URLSearchParams();
    if (options.size) params.append('size', options.size);
    if (options.format) params.append('format', options.format);
    
    const queryString = params.toString();
    return `${API_BASE_URL}/v1/tenants/${tenant.tenantId}/documents/${documentId}/thumbnail${queryString ? `?${queryString}` : ''}`;
  },

  /**
   * Get document details with content
   * @param {number} documentId - The document ID
   * @returns {Promise<Object>} The document details
   */
  getDocumentById: async (documentId) => {
    try {
      const token = tenantAuthService.getToken();
      const tenant = tenantAuthService.getCurrentTenant();
      
      if (!token || !tenant?.tenantId) {
        throw new Error('No authenticated tenant found');
      }

      const config = { 
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.get(`${API_BASE_URL}/v1/tenants/${tenant.tenantId}/documents/${documentId}`, config);
      return response.data;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error.response?.data || { message: 'Failed to fetch document' };
    }
  },

  /**
   * Get document view URL for display
   * @param {number} documentId - The document ID
   * @returns {string} The view URL
   */
  getDocumentViewUrl: (documentId) => {
    const token = tenantAuthService.getToken();
    const tenant = tenantAuthService.getCurrentTenant();
    
    if (!token || !tenant?.tenantId) {
      return '';
    }

    return `${API_BASE_URL}/v1/tenants/${tenant.tenantId}/documents/${documentId}/view`;
  },

  /**
   * Convert base64 content to blob URL
   * @param {string} base64Content - The base64 content
   * @param {string} mimeType - The MIME type
   * @returns {string} The blob URL
   */
  createBlobUrl: (base64Content, mimeType) => {
    try {
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error creating blob URL:', error);
      return '';
    }
  },

  /**
   * Check if tenant can book rooms (all documents approved)
   * @returns {Promise<Object>} The verification status
   */
  checkBookingEligibility: async () => {
    try {
      const token = tenantAuthService.getToken();
      const tenant = tenantAuthService.getCurrentTenant();
      
      if (!token || !tenant?.tenantId) {
        throw new Error('No authenticated tenant found');
      }

      const documentsResponse = await documentService.getTenantDocuments();
      const documents = documentsResponse.documents || [];
      
      const approvedDocuments = documents.filter(doc => doc.status === 'approved');
      const pendingDocuments = documents.filter(doc => doc.status === 'pending');
      const rejectedDocuments = documents.filter(doc => doc.status === 'rejected');
      
      const canBook = documents.length > 0 && approvedDocuments.length === documents.length;
      
      return {
        canBook,
        hasDocuments: documents.length > 0,
        totalDocuments: documents.length,
        approvedDocuments: approvedDocuments.length,
        pendingDocuments: pendingDocuments.length,
        rejectedDocuments: rejectedDocuments.length,
        documents,
        message: canBook 
          ? 'All documents verified. You can book rooms!' 
          : !documents.length 
            ? 'No documents uploaded. Please upload at least one document.'
            : rejectedDocuments.length > 0
              ? 'Some documents are rejected. Please re-upload.'
              : 'Documents pending approval. Please wait.'
      };
    } catch (error) {
      console.error('Error checking booking eligibility:', error);
      return {
        canBook: false,
        hasDocuments: false,
        totalDocuments: 0,
        approvedDocuments: 0,
        pendingDocuments: 0,
        rejectedDocuments: 0,
        documents: [],
        message: 'Unable to verify document status',
        error: error.message
      };
    }
  },
};

export default documentService;
