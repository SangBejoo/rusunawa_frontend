import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/apiConfig';

// Use the correct tenant auth endpoint
const AUTH_URL = `${API_BASE_URL}/v1/tenant/auth`;

/**
 * Service for handling tenant authentication operations
 */
const tenantAuthService = {
  /**
   * Login a tenant with email and password
   * @param {Object} credentials - The login credentials
   * @param {string} credentials.email - The tenant's email
   * @param {string} credentials.password - The tenant's password
   * @returns {Promise<Object>} The login response with tenant data and token
   */
  login: async (credentials) => {
    try {
      // Ensure we're sending a properly formatted object exactly matching API expectations
      const loginData = {
        email: credentials.email || "",
        password: credentials.password || ""
      };
      
      // Debug log without showing password content
      console.log("Sending login request for email:", loginData.email);
      
      // Set proper content type header to ensure correct parsing on server side
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.post(`${AUTH_URL}/login`, loginData, config);
      
      // Store token in local storage - using the tenant_token key for consistency
      if (response.data?.token) {
        localStorage.setItem('tenant_token', response.data.token); 
        localStorage.setItem('token', response.data.token); // For backwards compatibility
        localStorage.setItem('tenant', JSON.stringify(response.data.tenant));
        // DO NOT REMOVE 'email_verified' here. Let the context handle it.
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle verification error with more details
      if (error.response?.status === 401 && 
          error.response.data?.message?.includes('not verified')) {
        
        // If recently verified but still getting this error, it might be a sync issue
        const recentlyVerified = localStorage.getItem('email_verified') === 'true';
        if (recentlyVerified) {
          localStorage.removeItem('email_verified'); // Clear the flag
          
          // Try again once with a slight delay for server sync
          try {
            console.log("Recent verification detected - retrying login after delay");
            await new Promise(resolve => setTimeout(resolve, 1500));
            const retryResponse = await axios.post(`${AUTH_URL}/login`, credentials);
            
            if (retryResponse.data?.token) {
              localStorage.setItem('token', retryResponse.data.token);
              localStorage.setItem('tenant', JSON.stringify(retryResponse.data.tenant));
            }
            
            return retryResponse.data;
          } catch (retryError) {
            console.error('Retry login error:', retryError);
            throw retryError.response?.data || { 
              message: 'Email not verified, please check your email for verification link' 
            };
          }
        }
      }
      
      throw error.response?.data || { message: 'Authentication failed' };
    }
  },

  /**
   * Register a new tenant
   * @param {Object} tenantData - The tenant registration data
   * @returns {Promise<Object>} The registration response
   */
  register: async (tenantData) => {
    try {
      // Create a clean copy of the data for submission
      const dataToSubmit = { ...tenantData };
      
      // Ensure location data is properly formatted as numbers
      if (dataToSubmit.homeLatitude !== undefined) {
        dataToSubmit.homeLatitude = dataToSubmit.homeLatitude === null ? 
          null : Number(dataToSubmit.homeLatitude);
      }
      
      if (dataToSubmit.homeLongitude !== undefined) {
        dataToSubmit.homeLongitude = dataToSubmit.homeLongitude === null ? 
          null : Number(dataToSubmit.homeLongitude);
      }
      
      // Log the final data being sent (for debugging)
      console.log("Final registration payload:", dataToSubmit);
      
      const response = await axios.post(`${AUTH_URL}/register`, dataToSubmit);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  /**
   * Verify tenant's authentication token
   * @param {Object} data - The verification data
   * @param {string} data.token - The authentication token
   * @returns {Promise<Object>} The verification response
   */
  verifyToken: async (data) => {
    try {
      // Add retry logic for better reliability
      const maxRetries = 2;
      let retries = 0;
      let lastError;
      
      // Log the exact URL being used for debugging
      console.log("Verifying token at:", `${AUTH_URL}/verify-token`);
      
      while (retries <= maxRetries) {
        try {
          const response = await axios.post(`${AUTH_URL}/verify-token`, data, {
            timeout: 5000 // 5 second timeout
          });
          return response.data;
        } catch (error) {
          lastError = error;
          retries++;
          if (retries <= maxRetries) {
            // Wait before retrying (exponential backoff)
            await new Promise(r => setTimeout(r, 1000 * retries));
            console.log(`Retrying token verification (attempt ${retries})`);
          }
        }
      }
      
      // If we've exhausted retries, throw the last error
      console.error('Token verification failed after retries:', lastError);
      throw lastError;
    } catch (error) {
      console.error('Token verification error:', error);
      
      // For network errors, return a special response that allows offline functionality
      if (error.code === 'ERR_NETWORK') {
        console.warn('Network error during token verification, allowing offline mode');
        return { 
          valid: true, 
          status: { status: 'warning', message: 'Using cached credentials due to connectivity issues' },
          offline: true
        };
      }
      
      throw error.response?.data || { message: 'Token verification failed' };
    }
  },

  /**
   * Request a password reset
   * @param {Object} data - The password reset request data
   * @param {string} data.email - The email for password reset
   * @returns {Promise<Object>} The password reset response
   */
  forgotPassword: async (data) => {
    try {
      const response = await axios.post(`${AUTH_URL}/forgot-password`, data);
      return response.data;
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error.response?.data || { message: 'Password reset request failed' };
    }
  },

  /**
   * Reset tenant's password with a token
   * @param {Object} data - The password reset data
   * @param {string} data.token - The reset token
   * @param {string} data.new_password - The new password
   * @returns {Promise<Object>} The password reset response
   */
  resetPassword: async (data) => {
    try {
      const response = await axios.post(`${AUTH_URL}/reset-password`, data);
      return response.data;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error.response?.data || { message: 'Password reset failed' };
    }
  },
  /**
   * Verify tenant email with verification token
   * @param {Object} data - The verification data
   * @param {string} data.token - The verification token
   * @returns {Promise<Object>} The verification response
   */
  verifyEmail: async (data) => {
    try {
      console.log("Attempting to verify email with token:", data.token);
      
      // Log the complete URL for debugging
      const verifyEndpoint = `${AUTH_URL}/verify-email`;
      console.log("Sending verification request to:", verifyEndpoint);
      
      // Make the API call
      const response = await axios.post(verifyEndpoint, data, {
        timeout: 10000
      });
      
      console.log("Verification successful:", response.data);
      
      // Store verification status in localStorage
      localStorage.setItem('email_verified', 'true');
      
      return response.data;
    } catch (error) {
      console.error('Email verification error:', error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        
        // Check if the error is because the email is already verified
        if (error.response.status === 500 && 
            error.response.data?.message?.includes('already verified')) {
          console.log("Email is already verified - setting verified status");
          localStorage.setItem('email_verified', 'true');
          return { 
            status: 'success', 
            message: 'Email is already verified',
            alreadyVerified: true
          };
        }
        
        return { status: 'error', message: error.response.data.message || 'Verification failed' };
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        return { status: 'error', message: 'No response from server. Please try again.' };
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', error.message);
        return { status: 'error', message: 'Request failed. Please try again.' };
      }
    }
  },

  /**
   * Resend verification email
   * @param {Object} data - The resend verification data
   * @param {string} data.email - The email to resend verification to
   * @returns {Promise<Object>} The response
   */
  resendVerification: async (data) => {
    try {
      console.log("Resending verification email to:", data.email);
      const response = await axios.post(`${AUTH_URL}/resend-verification`, data);
      console.log("Resend successful:", response.data);
      return response.data;
    } catch (error) {
      console.error('Resend verification error:', error);
      
      if (error.response) {
        return { status: 'error', message: error.response.data.message || 'Failed to resend verification' };
      }
      throw error;
    }
  },

  /**
   * Logout the current tenant
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tenant');
  },

  /**
   * Get the current authenticated tenant
   * @returns {Object|null} The current tenant or null if not authenticated
   */
  getCurrentTenant: () => {
    const tenant = localStorage.getItem('tenant');
    return tenant ? JSON.parse(tenant) : null;
  },

  /**
   * Get the authentication token
   * @returns {string|null} The authentication token or null if not authenticated
   */
  getToken: () => {
    return localStorage.getItem('token');  // Use 'token' instead of 'tenant-token'
  },

  /**
   * Check if a tenant is authenticated
   * @returns {boolean} True if authenticated, false otherwise
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');  // Use 'token' instead of 'tenant-token'
  },

  /**
   * Check if a NIM is already registered (client-side check using existing data)
   * @param {string} nim - The NIM to check
   * @returns {Promise<Object>} Availability status
   */
  checkNIMAvailability: async (nim) => {
    try {
      // Since the API endpoint doesn't exist, we'll use the existing tenant list endpoint
      const response = await axios.get(`${API_BASE_URL}/v1/tenants`);
      
      if (response.data && response.data.tenants) {
        const existingNIMs = response.data.tenants
          .filter(tenant => tenant.nim) // Only check tenants that have NIM
          .map(tenant => tenant.nim.toLowerCase()); // Convert to lowercase for comparison
        
        const isAvailable = !existingNIMs.includes(nim.toLowerCase());
        
        return {
          available: isAvailable,
          message: isAvailable ? 'NIM available' : 'NIM already registered'
        };
      }
      
      // If no data, assume available
      return { available: true, message: 'Unable to verify, assuming available' };
    } catch (error) {
      console.error('Error checking NIM availability:', error);
      // If there's an error, assume it's available to not block registration
      return {
        available: true,
        message: 'Unable to check availability, proceeding with registration'
      };
    }
  },

  /**
   * Check if an email is already registered (client-side check using existing data)
   * @param {string} email - The email to check
   * @returns {Promise<Object>} Availability status
   */
  checkEmailAvailability: async (email) => {
    try {
      // Since the API endpoint doesn't exist, we'll use the existing tenant list endpoint
      const response = await axios.get(`${API_BASE_URL}/v1/tenants`);
      
      if (response.data && response.data.tenants) {
        const existingEmails = response.data.tenants
          .filter(tenant => tenant.user && tenant.user.email) // Only check tenants that have email
          .map(tenant => tenant.user.email.toLowerCase()); // Convert to lowercase for comparison
        
        const isAvailable = !existingEmails.includes(email.toLowerCase());
        
        return {
          available: isAvailable,
          message: isAvailable ? 'Email available' : 'Email already registered'
        };
      }
      
      // If no data, assume available
      return { available: true, message: 'Unable to verify, assuming available' };
    } catch (error) {
      console.error('Error checking email availability:', error);
      // If there's an error, assume it's available to not block registration
      return {
        available: true,
        message: 'Unable to check availability, proceeding with registration'
      };
    }
  },

  /**
   * Check if a tenant's email is verified directly from the server
   * @param {number} tenantId - The tenant ID to check
   * @returns {Promise<Object>} Verification status
   */
  checkEmailVerification: async (tenantId) => {
    try {
      // Add authorization header if logged in
      const token = tenantAuthService.getToken();
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.get(
        `${API_BASE_URL}/tenants/${tenantId}/verification-status`,
        config
      );
      
      // If the status is verified, update localStorage
      if (response.data && response.data.isVerified) {
        localStorage.setItem('email_verified', 'true');
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error checking verification status:`, error);
      // If the API endpoint doesn't exist, fallback to checking localStorage
      return { isVerified: localStorage.getItem('email_verified') === 'true' };
    }
  },
};

export default tenantAuthService;
