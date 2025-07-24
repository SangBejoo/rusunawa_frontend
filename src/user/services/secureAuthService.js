import api from '../utils/apiClient';

const secureAuthService = {
  /**
   * Login user with cookie-based authentication
   */
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });
      
      // Backend sets httpOnly cookie automatically
      // Response should only contain user data, no token
      const user = response.data.user;
      const normalizedUser = {
        ...user,
        id: user.user_id || user.userId || user.id,
        name: user.full_name || user.fullName || user.name,
        role: user.role?.name || user.role
      };
      
      return {
        success: true,
        user: normalizedUser,
        // No token returned - it's in httpOnly cookie
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
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
      throw new Error(error.response?.data?.message || error.message || 'Registration failed');
    }
  },

  /**
   * Get current user info (replaces token verification)
   */
  getCurrentUser: async () => {
    try {
      console.log('🔍 SecureAuthService: Getting current user...');
      
      // Cookie is automatically included in the request
      const response = await api.get('/auth/me');
      
      const user = response.data.user;
      const normalizedUser = {
        ...user,
        id: user.user_id || user.userId || user.id,
        name: user.full_name || user.fullName || user.name,
        role: user.role?.name || user.role
      };
      
      console.log('✅ SecureAuthService: Current user retrieved:', normalizedUser);
      return normalizedUser;
    } catch (error) {
      console.error('❌ SecureAuthService: Failed to get current user:', error);
      throw new Error('Authentication failed');
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
      return { success: true };
    } catch (error) {
      // Even if logout fails, we should clear local state
      console.warn('Logout request failed, but continuing with local cleanup');
      return { success: true };
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
      throw new Error(error.response?.data?.message || error.message || 'Failed to send reset email');
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
      throw new Error(error.response?.data?.message || error.message || 'Failed to reset password');
    }
  }
};

export default secureAuthService;
