import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTenantAuth } from '../../context/tenantAuthContext';
import { Flex, Spinner, Text } from '@chakra-ui/react';

/**
 * VerifiedRoute component that requires both authentication AND email verification
 * Redirects to verification prompt if email is not verified
 */
const VerifiedRoute = ({ children }) => {
  const { isAuthenticated, loading, tenant, isEmailVerified } = useTenantAuth();
  const location = useLocation();

  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <Flex 
        height="100vh"
        width="100%"
        justifyContent="center"
        alignItems="center"
        flexDirection="column"
      >
        <Spinner size="xl" color="brand.500" thickness="4px" />
        <Text mt={4} fontSize="lg">Loading...</Text>
      </Flex>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/tenant/login" state={{ from: location }} replace />;
  }

  // Get verification status from multiple sources
  const isVerified = 
    // From context state
    isEmailVerified === true || 
    // From tenant object
    tenant?.isVerified === true || 
    // From localStorage as a fallback - do NOT cause re-renders with this!
    localStorage.getItem('email_verified') === 'true';

  // Redirect to verification prompt if not verified
  if (!isVerified) {
    return <Navigate to="/tenant/verification-prompt" state={{ from: location }} replace />;
  }

  // User is authenticated and verified, show the protected content
  return children;
};

export default VerifiedRoute;
