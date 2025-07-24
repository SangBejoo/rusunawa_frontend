import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTenantAuth } from '../../context/tenantAuthContext';
import { Box, Spinner, Center } from '@chakra-ui/react';

/**
 * A wrapper component that protects routes from unauthenticated users
 * It will redirect to login if not authenticated, or show the children if authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useTenantAuth();
  
  // Show loading spinner while checking authentication status
  if (isLoading) {
    return (
      <Box minH="100vh">
        <Center h="100vh">
          <Spinner size="xl" color="brand.500" thickness="4px" />
        </Center>
      </Box>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/tenant/login" replace />;
  }
  
  // Show the children if authenticated
  return children;
};

export default ProtectedRoute;
