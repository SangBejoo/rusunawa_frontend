import api from '../utils/apiClient';

const documentService = {
  // Get all documents with filtering and pagination
  getAllDocuments: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.documentType) queryParams.append('document_type', params.documentType);
      if (params.tenantId) queryParams.append('tenant_id', params.tenantId);      if (params.sortBy) queryParams.append('sort_by', params.sortBy);
      if (params.sortOrder) queryParams.append('sort_order', params.sortOrder);
      if (params.dateFrom) queryParams.append('date_from', params.dateFrom);
      if (params.dateTo) queryParams.append('date_to', params.dateTo);

      const response = await api.get(`/documents/all?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  // Review document (approve/reject)
  reviewDocument: async (documentId, reviewData) => {
    try {
      const payload = {
        reviewerId: reviewData.reviewerId,
        approved: reviewData.approved,
        notes: reviewData.notes || '',
        reviewedAt: new Date().toISOString()
      };

      const response = await api.post(`/documents/${documentId}/review`, payload);
      return response.data;
    } catch (error) {
      console.error('Error reviewing document:', error);
      throw error;
    }
  },

  // Get document image
  getDocumentImage: async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}/image`);
      return response.data;
    } catch (error) {
      console.error('Error fetching document image:', error);
      throw error;
    }
  },
  /**
   * Get tenant documents
   * @param {number} tenantId - Tenant ID
   * @param {Object} params - Query parameters
   * @returns {Promise} - List of tenant documents
   */
  getTenantDocuments: async (tenantId, params = {}) => {
    try {
      const response = await api.get(`/tenants/${tenantId}/documents`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch tenant documents');
    }
  },

  /**
   * Get tenant documents with content (base64 images)
   * @param {number} tenantId - Tenant ID
   * @param {Object} params - Query parameters
   * @returns {Promise} - List of tenant documents with content
   */
  getTenantDocumentsWithContent: async (tenantId, params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.documentType) queryParams.append('document_type', params.documentType);

      const response = await api.get(`/tenants/${tenantId}/documents?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tenant documents with content:', error);
      throw error;
    }
  },

  // Get tenant details
  getTenantDetails: async (tenantId) => {
    try {
      const response = await api.get(`/tenants/${tenantId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tenant details:', error);
      throw error;
    }
  },

  /**
   * Get document by ID
   * @param {number} documentId - Document ID
   * @returns {Promise} - Document details
   */
  getDocumentById: async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch document details');
    }
  },

  /**
   * Upload document
   * @param {number} tenantId - Tenant ID
   * @param {Object} documentData - Document metadata
   * @param {File} file - Document file
   * @returns {Promise} - Uploaded document data
   */
  uploadDocument: async (tenantId, documentData, file) => {
    try {
      const formData = new FormData();
      
      // Add document metadata
      Object.keys(documentData).forEach(key => {
        formData.append(key, documentData[key]);
      });
      
      // Add file
      formData.append('file', file);
      
      const response = await api.post(`/tenants/${tenantId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to upload document');
    }
  },
  /**
   * Approve document
   * @param {number} documentId - Document ID
   * @param {number} approverId - Approver user ID
   * @param {string} comment - Approval comment
   * @returns {Promise} - Approval response
   */
  approveDocument: async (documentId, approverId, comment = '') => {
    try {
      const response = await api.post(`/documents/${documentId}/approve`, { 
        approverId,
        approved: true,
        comment 
      });
      // Always return the response data, even if it contains an error status
      return response.data;
    } catch (error) {
      // Only throw if it's a network error or other HTTP error
      if (error.response && error.response.data) {
        // Return the error response from the backend
        return error.response.data;
      }
      throw new Error(error.message || 'Failed to approve document');
    }
  },

  /**
   * Reject document
   * @param {number} documentId - Document ID
   * @param {Object} rejectData - Rejection data with reason and notes
   * @returns {Promise} - Rejection response
   */
  rejectDocument: async (documentId, rejectData) => {
    try {
      const response = await api.post(`/documents/${documentId}/reject`, rejectData);
      // Always return the response data, even if it contains an error status
      return response.data;
    } catch (error) {
      // Only throw if it's a network error or other HTTP error
      if (error.response && error.response.data) {
        // Return the error response from the backend
        return error.response.data;
      }
      throw new Error(error.message || 'Failed to reject document');
    }
  },

  /**
   * Verify document (alias for approve document for compatibility)
   * @param {number} documentId - Document ID
   * @param {Object} verifyData - Verification data with notes
   * @returns {Promise} - Verification response
   */
  verifyDocument: async (documentId, verifyData) => {
    try {
      const response = await api.post(`/documents/${documentId}/verify`, verifyData);
      // Always return the response data, even if it contains an error status
      return response.data;
    } catch (error) {
      // Only throw if it's a network error or other HTTP error
      if (error.response && error.response.data) {
        // Return the error response from the backend
        return error.response.data;
      }
      throw new Error(error.message || 'Failed to verify document');
    }
  },

  /**
   * Download document
   * @param {number} documentId - Document ID
   * @returns {Promise} - Binary document data
   */
  downloadDocument: async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to download document');
    }
  },

  /**
   * Get document types
   * @returns {Promise} - List of document types
   */
  getDocumentTypes: async () => {
    try {
      const response = await api.get(`/document-types`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch document types');
    }
  },
  /**
   * Get pending documents
   * @param {Object} params - Query parameters
   * @returns {Promise} - List of pending documents
   */
  getPendingDocuments: async (params = {}) => {
    try {
      const response = await api.get('/documents/pending', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch pending documents');
    }
  },

  /**
   * Get documents by status
   * @param {string} status - Document status
   * @param {Object} params - Query parameters
   * @returns {Promise} - List of documents
   */
  getDocumentsByStatus: async (status, params = {}) => {
    try {
      const response = await api.get(`/documents/by-status/${status}`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch documents by status');
    }
  },

  /**
   * Batch approve documents
   * @param {Array} documentIds - Array of document IDs
   * @param {string} comment - Approval comment
   * @returns {Promise} - Batch approval response
   */
  batchApproveDocuments: async (documentIds, comment = '') => {
    try {
      const response = await api.post('/documents/batch-approve', {
        document_ids: documentIds,
        comment
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to batch approve documents');
    }
  },

  /**
   * Get document verification status
   * @param {number} documentId - Document ID
   * @returns {Promise} - Verification status
   */
  getDocumentVerification: async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}/verify`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch document verification');
    }
  }
};

export default documentService;
