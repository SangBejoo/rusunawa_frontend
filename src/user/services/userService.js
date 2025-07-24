import api from '../utils/apiClient';

const userService = {
  /**
   * Create new user using auth/register endpoint
   * @param {Object} userData - User data to create
   * @returns {Promise<Object>} The created user data
   */
  createUser: async (userData) => {
    try {
      // Validate required fields on frontend
      if (!userData.name && !userData.fullName) {
        throw new Error('Name is required');
      }
      if (!userData.email) {
        throw new Error('Email is required');
      }
      if (!userData.password) {
        throw new Error('Password is required');
      }
      
      // Transform the data to match the backend API format
      const requestData = {
        email: userData.email.trim(),
        name: (userData.name || userData.fullName).trim(),  // Handle both name and fullName
        password: userData.password,
        role: userData.role || (userData.roleId === 1 || userData.roleId === '1' ? 'admin' : 
              userData.roleId === 3 || userData.roleId === '3' ? 'super_admin' : 
              userData.roleId === 4 || userData.roleId === '4' ? 'wakil_direktorat' : 'admin')  // Correct role mapping
      };
      
      console.log('🔍 Original form data:', userData);
      console.log('🔍 Transformed request data:', requestData);
      
      const response = await api.post('/auth/register', requestData);
      return response.data;
    } catch (error) {
      console.error('Failed to create user:', error);
      console.error('📋 Full error details:', error.response?.data);
      throw new Error(error.message || 'Failed to create user');
    }
  },

  /**
   * Get user by ID
   * @param {number} userId - The user ID
   * @returns {Promise<Object>} The user data
   */
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user:', error);
      throw new Error(error.message || 'Failed to fetch user details');
    }
  },

  /**
   * Get multiple users by IDs
   * @param {Array<number>} userIds - Array of user IDs
   * @returns {Promise<Object>} Map of user ID to user data
   */
  getUsersByIds: async (userIds) => {
    try {
      // Remove duplicates and invalid IDs
      const uniqueIds = [...new Set(userIds)].filter(id => id && id > 0);
      
      if (uniqueIds.length === 0) {
        return {};
      }

      // Fetch all users in parallel
      const userPromises = uniqueIds.map(id => 
        userService.getUserById(id).catch(error => {
          console.warn(`Failed to fetch user ${id}:`, error);
          return null;
        })
      );

      const userResponses = await Promise.all(userPromises);
      
      // Create a map of userId -> user data
      const userMap = {};
      uniqueIds.forEach((id, index) => {
        const response = userResponses[index];
        if (response && response.user) {
          userMap[id] = response.user;
        }
      });

      return userMap;
    } catch (error) {
      console.error('Failed to get users:', error);
      return {};
    }
  },

  /**
   * Get current user profile
   * @returns {Promise<Object>} The current user data
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw new Error(error.message || 'Failed to fetch user profile');
    }
  },

  /**
   * Update user profile
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} The updated user data
   */
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/users/profile', userData);
      return response.data;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  },

  /**
   * Get all users (admin only)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} List of users
   */
  getUsers: async (params = {}) => {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to get users:', error);
      throw new Error(error.message || 'Failed to fetch users');
    }
  },



  /**
   * Update user (admin only)
   * @param {number} userId - User ID to update
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} The updated user data
   */
  updateUser: async (userId, userData) => {
    try {
      // Transform frontend data to backend API format
      const requestData = {
        user_id: parseInt(userId),
        email: userData.email?.trim(),
        name: (userData.name || userData.fullName)?.trim(),
        role: userData.role || (userData.roleId === 1 || userData.roleId === '1' ? 'admin' : 
              userData.roleId === 3 || userData.roleId === '3' ? 'super_admin' : 
              userData.roleId === 4 || userData.roleId === '4' ? 'wakil_direktorat' : 'admin')
      };

      // Only include password if provided (optional for updates)
      if (userData.password && userData.password.trim()) {
        requestData.password = userData.password.trim();
      }

      console.log('🔍 Original update data:', userData);
      console.log('🔍 Transformed update request:', requestData);

      const response = await api.put(`/users/${userId}`, requestData);
      return response.data;
    } catch (error) {
      console.error('Failed to update user:', error);
      console.error('📋 Full error details:', error.response?.data);
      throw new Error(error.message || 'Failed to update user');
    }
  },

  /**
   * Delete user (admin only)
   * @param {number} userId - User ID to delete
   * @returns {Promise<Object>} Success response
   */
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw new Error(error.message || 'Failed to delete user');
    }
  },

  /**
   * Get available roles
   * @returns {Promise<Object>} List of roles
   */
  getRoles: async () => {
    try {
      const response = await api.get('/roles');
      return response.data;
    } catch (error) {
      console.error('Failed to get roles:', error);
      throw new Error(error.message || 'Failed to fetch roles');
    }
  }
};

export default userService;
