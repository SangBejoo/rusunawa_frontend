import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTenantAuth } from '../../context/tenantAuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * AuthenticationWrapper - Handles authentication state during route transitions
 * This prevents redirects during page refresh and preserves user's current location
 */
const AuthenticationWrapper = ({ children }) => {
  const { isLoading } = useTenantAuth();
  const location = useLocation();

  // Store current location when authenticated to preserve it on refresh
  useEffect(() => {
    // Don't store auth-related routes
    const authRoutes = ['/tenant/login', '/tenant/register', '/tenant/forgot-password', '/tenant/reset-password', '/tenant/verification-prompt', '/tenant/email-verification'];
    
    if (!authRoutes.includes(location.pathname)) {
      sessionStorage.setItem('tenant_last_location', location.pathname + location.search);
    }
  }, [location]);

  // Show loading screen during authentication check
  if (isLoading) {
    return <LoadingSpinner message="Initializing application..." />;
  }

  return children;
};

export default AuthenticationWrapper;
