import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  // Helper function to save auth data
  const saveAuthData = (userData, token) => {
    try {
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(userData));
      console.log('💾 Auth data saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save auth data to localStorage:', error);
    }
  };
  // Helper function to clear auth data
  const clearAuthData = () => {
    try {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      // Also clean up any tenant tokens to avoid conflicts
      localStorage.removeItem('token');
      localStorage.removeItem('tenant_token');
      localStorage.removeItem('tenant');
      console.log('🗑️ Auth data cleared from localStorage');    } catch (error) {
      console.error('❌ Failed to clear auth data from localStorage:', error);
    }
  };

  // Check if user is logged in on app start
  useEffect(() => {
    const initAuth = async () => {      try {
        console.log('🔄 Starting auth initialization...');
        
        // Check for admin token only (no tenant token fallback)
        let token = localStorage.getItem('adminToken');
        let savedUser = localStorage.getItem('adminUser');
        
        console.log('� Admin token from localStorage:', token ? '✅ EXISTS' : '❌ NOT FOUND');
        console.log('👤 Admin user from localStorage:', savedUser ? '✅ EXISTS' : '❌ NOT FOUND');
        
        if (token) {
          // Try to use saved user data first (faster)
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);              console.log('⚡ Using cached user data:', parsedUser);
              setUser(parsedUser);
              setIsAuthenticated(true);
              setIsLoading(false);
                // Verify token in background
              console.log('🔄 About to verify token, length:', token?.length);
              console.log('🔄 Token (first 50 chars):', token?.substring(0, 50) + '...');              authService.verifyToken(token)
                .then((userData) => {
                  console.log('🔄 Background token verification successful');
                  if (JSON.stringify(userData) !== JSON.stringify(parsedUser)) {
                    console.log('📝 Updating user data with fresh data');
                    setUser(userData);
                    saveAuthData(userData, token);
                  }
                })
                .catch((error) => {
                  console.error('❌ Background token verification failed:', error);
                  clearAuthData();
                  setUser(null);
                  setIsAuthenticated(false);
                });
              
              return; // Exit early, we have valid cached data
            } catch (parseError) {
              console.error('❌ Failed to parse saved user data:', parseError);
              localStorage.removeItem('adminUser');
            }
          }
          
          // Fallback to token verification
          console.log('�🔍 Verifying token...');
          const userData = await authService.verifyToken(token);
          console.log('✅ Token verification successful:', userData);
          
          setUser(userData);
          setIsAuthenticated(true);
          saveAuthData(userData, token);
          console.log('🎉 Auth state updated - user logged in');
        } else {
          console.log('⚠️ No token found, user not authenticated');
          clearAuthData();
        }
      } catch (error) {
        console.error('❌ Token verification failed:', error);
        console.log('🗑️ Removing invalid auth data');
        clearAuthData();
        
        // Reset auth state
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        console.log('🏁 Auth initialization complete, setting loading to false');
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const response = await authService.login(email, password);
        if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        saveAuthData(response.user, response.token);
        
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${response.user.name}!`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        return { success: true };
      }
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid credentials',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setIsLoading(true);
      const response = await authService.forgotPassword(email);
      
      if (response.success) {
        toast({
          title: 'Reset Email Sent',
          description: 'If the email exists, a reset link has been sent with a 6-digit code.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        return { success: true };
      }
    } catch (error) {
      toast({
        title: 'Request Failed',
        description: error.message || 'Failed to send reset email',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      setIsLoading(true);
      const response = await authService.resetPassword(token, newPassword);
      
      if (response.success) {
        toast({
          title: 'Password Reset Successful',
          description: 'Your password has been reset successfully. Please login with your new password.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        return { success: true };
      }
    } catch (error) {
      toast({
        title: 'Reset Failed',
        description: error.message || 'Failed to reset password',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    clearAuthData();
    
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    forgotPassword,
    resetPassword,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
