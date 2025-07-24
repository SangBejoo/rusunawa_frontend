import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import secureAuthService from '../services/secureAuthService';

const SecureAuthContext = createContext();

export const useSecureAuth = () => {
  const context = useContext(SecureAuthContext);
  if (!context) {
    throw new Error('useSecureAuth must be used within a SecureAuthProvider');
  }
  return context;
};

export const SecureAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  // Check authentication status on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔄 SecureAuth: Checking authentication status...');
        
        // Try to get current user info (cookie is automatically included)
        const userData = await secureAuthService.getCurrentUser();
        
        console.log('✅ SecureAuth: User authenticated:', userData);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.log('❌ SecureAuth: Not authenticated');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
        console.log('🏁 SecureAuth: Authentication check complete');
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      console.log('🔐 SecureAuth: Logging in...');
      
      const result = await secureAuthService.login(email, password);
      
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        
        console.log('✅ SecureAuth: Login successful');
        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        return { success: true };
      }
    } catch (error) {
      console.error('❌ SecureAuth: Login failed:', error);
      toast({
        title: 'Login Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      const result = await secureAuthService.register(userData);
      
      toast({
        title: 'Registration Successful',
        description: 'Please login with your credentials',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      return result;
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 SecureAuth: Logging out...');
      
      await secureAuthService.logout();
      
      // Clear local state
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('✅ SecureAuth: Logout successful');
      toast({
        title: 'Logged Out',
        description: 'You have been logged out successfully',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('❌ SecureAuth: Logout error:', error);
      // Still clear local state even if logout request failed
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <SecureAuthContext.Provider value={value}>
      {children}
    </SecureAuthContext.Provider>
  );
};

export default SecureAuthContext;
