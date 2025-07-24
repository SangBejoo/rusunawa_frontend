import api from '../utils/apiClient';

const tenantService = {
  /**
   * Get all tenants with pagination and filters
   */
  getTenants: async (params = {}) => {
    try {
      const response = await api.get('/tenants', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch tenants');
    }
  },

  /**
   * Get tenant by ID
   */
  getTenantById: async (tenantId) => {
    try {
      const response = await api.get(`/tenants/${tenantId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch tenant details');
    }
  },

  /**
   * Update tenant
   */
  updateTenant: async (tenantId, tenantData) => {
    try {
      const response = await api.put(`/tenants/${tenantId}`, tenantData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update tenant');
    }
  },

  /**
   * Delete tenant
   */
  deleteTenant: async (tenantId) => {
    try {
      const response = await api.delete(`/tenants/${tenantId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to delete tenant');
    }
  },

  /**
   * Get tenants by type
   */
  getTenantsByType: async (tenantType, params = {}) => {
    try {
      const response = await api.get(`/tenants/by-type/${tenantType}`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch tenants by type');
    }
  },

  /**
   * Update tenant location
   */
  updateTenantLocation: async (tenantId, locationData) => {
    try {
      const response = await api.put(`/tenants/${tenantId}/location`, locationData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update tenant location');
    }
  },

  /**
   * Get tenant payment history
   */
  getTenantPaymentHistory: async (tenantId, params = {}) => {
    try {
      const response = await api.get(`/tenants/${tenantId}/payments`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch tenant payment history');
    }
  },

  /**
   * Get tenant bookings
   */
  getTenantBookings: async (tenantId, params = {}) => {
    try {
      const response = await api.get(`/tenants/${tenantId}/bookings`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch tenant bookings');
    }
  },

  /**
   * Get tenant documents
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
   * Validate student information
   */
  validateStudentInfo: async (tenantId, studentData) => {
    try {
      const response = await api.post(`/tenants/${tenantId}/validate-student`, studentData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to validate student information');
    }
  },

  /**
   * Get waiting list
   */
  getWaitingList: async (params = {}) => {
    try {
      const response = await api.get('/waiting-list', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch waiting list');
    }
  },

  /**
   * Remove from waiting list
   */
  removeFromWaitingList: async (waitingId) => {
    try {
      const response = await api.delete(`/waiting-list/${waitingId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to remove from waiting list');
    }
  },

  /**
   * Update tenant NIM
   */
  updateTenantNIM: async (tenantId, nimData) => {
    try {
      const response = await api.put(`/tenants/${tenantId}/nim`, nimData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update tenant NIM');
    }
  },

  /**
   * Recalculate tenant distance
   */
  recalculateDistance: async (tenantId) => {
    try {
      const response = await api.post(`/tenants/${tenantId}/recalculate-distance`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to recalculate distance');
    }
  },

  /**
   * Get tenant invoices
   */
  getTenantInvoices: async (tenantId, params = {}) => {
    try {
      const response = await api.get(`/tenants/${tenantId}/invoices`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch tenant invoices');
    }
  },

  /**
   * Get tenant types
   */
  getTenantTypes: async () => {
    try {
      const response = await api.get('/tenant-types');
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch tenant types');
    }
  }
};

export default tenantService;
