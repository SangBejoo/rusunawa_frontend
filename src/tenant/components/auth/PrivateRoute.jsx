import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTenantAuth } from '../../context/tenantAuthContext';
import { Flex, Spinner, Text } from '@chakra-ui/react';

/**
 * PrivateRoute component that redirects unauthenticated users to login
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @returns {React.ReactNode} Protected route component
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useTenantAuth();
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

  // Redirect to login if not authenticated, preserving the intended destination
  if (!isAuthenticated) {
    return <Navigate to="/tenant/login" state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return children;
};

export default PrivateRoute;
