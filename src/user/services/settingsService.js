// import api from '../utils/apiClient';

// MOCK SETTINGS SERVICE
// Note: Backend settings APIs are not implemented yet
// This provides mock data for demo/development purposes
const settingsService = {
  /**
   * Get user profile information
   * MOCK: Returns dummy data since backend API not implemented
   */
  getProfile: async () => {
    try {
      // TEMPORARILY MOCK DATA - Backend API not available
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
      
      return {
        success: true,
        data: {
          name: 'Admin User',
          email: 'admin@rusunawa.com',
          phone: '+62812345678',
          role: 'admin',
          avatar: null
        }
      };
      
      // This would be the real implementation when backend is ready:
      // const response = await api.get('/settings/profile');
      // return response.data;
    } catch (error) {
      throw new Error('Profile settings API not implemented in backend yet');
    }
  },
  /**
   * Update user profile
   * MOCK: Simulates success since backend API not implemented
   */
  updateProfile: async (profileData) => {
    try {
      // TEMPORARILY MOCK SUCCESS - Backend API not available
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      console.log('MOCK: Would update profile with:', profileData);
      
      return {
        success: true,
        message: 'Profile updated successfully (MOCK)',
        data: profileData
      };
      
      // This would be the real implementation:
      // const response = await api.put('/settings/profile', profileData);
      // return response.data;
    } catch (error) {
      throw new Error('Profile update API not implemented in backend yet');
    }
  },

  /**
   * Change password
   * MOCK: Simulates success since backend API not implemented
   */
  changePassword: async (passwordData) => {
    try {
      // TEMPORARILY MOCK SUCCESS - Backend API not available
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('MOCK: Would change password');
      
      // Basic validation
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (passwordData.newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      
      return {
        success: true,
        message: 'Password changed successfully (MOCK)'
      };
      
      // This would be the real implementation:
      // const response = await api.put('/settings/password', passwordData);
      // return response.data;
    } catch (error) {
      throw new Error(error.message || 'Password change API not implemented in backend yet');
    }
  },

  /**
   * Get email notification settings
   * MOCK: Returns dummy data since backend API not implemented
   */
  getEmailSettings: async () => {
    try {
      // TEMPORARILY MOCK DATA - Backend API not available
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        data: {
          sendBookingConfirmations: true,
          sendPaymentReminders: true,
          sendMarketingEmails: false,
          sendSystemAlerts: true,
          sendMaintenanceNotices: true
        }
      };
      
      // This would be the real implementation:
      // const response = await api.get('/settings/notifications/email');
      // return response.data;
    } catch (error) {
      throw new Error('Email settings API not implemented in backend yet');
    }
  },
  /**
   * Update email notification settings
   * MOCK: Simulates success since backend API not implemented
   */
  updateEmailSettings: async (emailSettings) => {
    try {
      // TEMPORARILY MOCK SUCCESS - Backend API not available
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('MOCK: Would update email settings with:', emailSettings);
      
      return {
        success: true,
        message: 'Email settings updated successfully (MOCK)',
        data: emailSettings
      };
      
      // This would be the real implementation:
      // const response = await api.put('/settings/notifications/email', emailSettings);
      // return response.data;
    } catch (error) {
      throw new Error('Email settings API not implemented in backend yet');
    }
  },

  /**
   * Get system settings (admin only)
   * MOCK: Returns dummy data since backend API not implemented
   */
  getSystemSettings: async () => {
    try {
      // TEMPORARILY MOCK DATA - Backend API not available
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        data: {
          maintenanceMode: false,
          autoApproveBookings: false,
          defaultPaymentDueDays: 7,
          systemName: 'Rusunawa Management System',
          version: '1.0.0',
          timezone: 'Asia/Jakarta'
        }
      };
      
      // This would be the real implementation:
      // const response = await api.get('/settings/system');
      // return response.data;
    } catch (error) {
      throw new Error('System settings API not implemented in backend yet');
    }
  },
  /**
   * Update system settings (admin only)
   * MOCK: Simulates success since backend API not implemented
   */
  updateSystemSettings: async (systemSettings) => {
    try {
      // TEMPORARILY MOCK SUCCESS - Backend API not available
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('MOCK: Would update system settings with:', systemSettings);
      
      return {
        success: true,
        message: 'System settings updated successfully (MOCK)',
        data: systemSettings
      };
      
      // This would be the real implementation:
      // const response = await api.put('/settings/system', systemSettings);
      // return response.data;
    } catch (error) {
      throw new Error('System settings API not implemented in backend yet');
    }
  },

  /**
   * Get security settings
   * MOCK: Returns dummy data since backend API not implemented
   */
  getSecuritySettings: async () => {
    try {
      // TEMPORARILY MOCK DATA - Backend API not available
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        data: {
          twoFactorEnabled: false,
          sessionTimeout: 60,
          passwordMinLength: 8,
          maxLoginAttempts: 5,
          accountLockoutDuration: 30,
          requirePasswordChange: false
        }
      };
      
      // This would be the real implementation:
      // const response = await api.get('/settings/security');
      // return response.data;
    } catch (error) {
      throw new Error('Security settings API not implemented in backend yet');
    }
  },
  /**
   * Update security settings
   * MOCK: Simulates success since backend API not implemented
   */
  updateSecuritySettings: async (securitySettings) => {
    try {
      // TEMPORARILY MOCK SUCCESS - Backend API not available
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('MOCK: Would update security settings with:', securitySettings);
      
      return {
        success: true,
        message: 'Security settings updated successfully (MOCK)',
        data: securitySettings
      };
      
      // This would be the real implementation:
      // const response = await api.put('/settings/security', securitySettings);
      // return response.data;
    } catch (error) {
      throw new Error('Security settings API not implemented in backend yet');
    }
  },

  /**
   * Mock functions for other settings that aren't implemented yet
   */
  getAppConfig: async () => {
    return { success: true, data: { theme: 'default', language: 'en' } };
  },

  updateAppConfig: async (config) => {
    console.log('MOCK: Would update app config with:', config);
    return { success: true, message: 'App config updated (MOCK)' };
  },

  getBackupSettings: async () => {
    return { success: true, data: { autoBackup: true, frequency: 'daily' } };
  },

  createBackup: async () => {
    console.log('MOCK: Would create backup');
    return { success: true, message: 'Backup created successfully (MOCK)' };
  },

  enableTwoFactor: async () => {
    console.log('MOCK: Would enable 2FA');
    return { success: true, message: '2FA enabled (MOCK)' };
  },
  disableTwoFactor: async () => {    console.log('MOCK: Would disable 2FA');
    return { success: true, message: '2FA disabled (MOCK)' };
  }
};

export default settingsService;
