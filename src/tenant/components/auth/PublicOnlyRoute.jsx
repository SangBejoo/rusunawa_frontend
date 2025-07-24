import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTenantAuth } from '../../context/tenantAuthContext';
import { Flex, Spinner, Text } from '@chakra-ui/react';

/**
 * PublicOnlyRoute component that redirects authenticated users to dashboard
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if not authenticated
 * @returns {React.ReactNode} Public-only route component
 */
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useTenantAuth();
  const location = useLocation();
  
  // Get the intended destination from state, or default to dashboard
  const from = location.state?.from?.pathname || '/tenant/dashboard';

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

  // Redirect to dashboard or intended destination if already authenticated
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  // Render children if not authenticated
  return children;
};

export default PublicOnlyRoute;
