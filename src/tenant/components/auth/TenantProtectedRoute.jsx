import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Spinner, Text } from '@chakra-ui/react';
import { useTenantAuth } from '../../context/tenantAuthContext';

const TenantProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useTenantAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh" flexDirection="column">
        <Spinner size="xl" color="brand.500" />
        <Text mt={4}>Loading authentication...</Text>
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    // Redirect to login but save the location they were trying to access
    return <Navigate to="/tenant/login" state={{ from: location }} replace />;
  }
  
  return children;
};

export default TenantProtectedRoute;
