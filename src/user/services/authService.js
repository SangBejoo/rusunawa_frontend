import api from '../utils/apiClient';

const authService = {
  /**
   * Login user
   */  login: async (email, password) => {
    try {      console.log('🔐 AuthService: Attempting login with baseURL:', api.defaults.baseURL);
      const response = await api.post('/auth/login', {
        email,
        password
      });
      
      console.log('✅ AuthService: Login successful');
      
      // Normalize user data for frontend compatibility
      const user = response.data.user;
      const normalizedUser = {
        ...user,
        id: user.userId, // Map userId to id for compatibility
        name: user.fullName, // Map fullName to name for compatibility
        role: user.role?.name || user.role // Extract role name from role object
      };
      
      return {
        success: true,
        user: normalizedUser,
        token: response.data.token
      };
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  },

  /**
   * Register new user
   */
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      return {
        success: true,
        user: response.data.user
      };
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  },  /**
   * Verify token (admin only)
   */  verifyToken: async (token) => {
    try {
      console.log('🔍 AuthService: Verifying admin token...');
      console.log('🔑 AuthService: Token being verified (first 50 chars):', token?.substring(0, 50) + '...');
      console.log('🔑 AuthService: Token length:', token?.length);
      
      // Verify as admin token only
      const response = await api.post('/auth/verify-token', {
        token
      });
      
      console.log('📥 AuthService: Verification response:', response.data);
      
      // Check if verification was successful and user data exists
      if (!response.data.valid || !response.data.user) {
        console.error('❌ AuthService: Token verification failed - invalid token or no user data');
        throw new Error('Token verification failed');
      }
      
      // Normalize user data for frontend compatibility
      const user = response.data.user;
      const normalizedUser = {
        ...user,
        id: user.user_id || user.userId || user.id, // Handle snake_case and camelCase
        name: user.full_name || user.fullName || user.name, // Handle different naming conventions
        role: user.role?.name || user.role // Extract role name from role object
      };
      
      console.log('✅ AuthService: Normalized user data:', normalizedUser);
      return normalizedUser;
    } catch (error) {
      console.error('❌ AuthService: Token verification failed:', error);
      console.error('❌ AuthService: Error response:', error.response?.data);
      throw new Error('Token verification failed');
    }
  },

  /**
   * Forgot password
   */
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', {
        email
      });
      
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to send reset email');
    }
  },

  /**
   * Reset password
   */
  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        new_password: newPassword
      });
      
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to reset password');
    }
  }
};

export default authService;
