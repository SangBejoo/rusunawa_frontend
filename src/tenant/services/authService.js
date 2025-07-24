import axios from 'axios';
import { API_URL } from '../utils/apiConfig';

const authService = {
  // Login method
  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/tenant/auth/login`, {
        email,
        password
      });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Register method
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/tenant/auth/register`, userData);
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },
  
  // Verify token method
  verifyToken: async (token) => {
    try {
      const response = await axios.post(`${API_URL}/tenant/auth/verify-token`, { token });
      return response.data;
    } catch (error) {
      console.error('Token verification error:', error);
      throw error;
    }
  },
  
  // Forgot password method
  forgotPassword: async (email) => {
    try {
      const response = await axios.post(`${API_URL}/tenant/auth/forgot-password`, { email });
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },
  
  // Reset password method
  resetPassword: async (token, newPassword) => {
    try {
      const response = await axios.post(`${API_URL}/tenant/auth/reset-password`, {
        token,
        new_password: newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },
  
  // Verify email method
  verifyEmail: async (token) => {
    try {
      const response = await axios.post(`${API_URL}/tenant/auth/verify-email`, { token });
      return response.data;
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  },
  
  // Resend verification email method
  resendVerificationEmail: async (email) => {
    try {
      const response = await axios.post(`${API_URL}/tenant/auth/resend-verification`, { email });
      return response.data;
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  }
};

export default authService;
