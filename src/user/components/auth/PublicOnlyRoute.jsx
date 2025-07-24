import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Flex, Spinner, Text } from '@chakra-ui/react';
import { useAuth } from '../../context/AuthContext';

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // Get the intended destination if coming from another page
  const from = location.state?.from?.pathname || '/admin/dashboard';

  if (loading) {
    return (
      <Flex 
        height="100vh"
        width="100%"
        justifyContent="center"
        alignItems="center"
        flexDirection="column"
      >
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text mt={4} fontSize="lg">Loading...</Text>
      </Flex>
    );
  }

  if (isAuthenticated) {
    // Redirect to dashboard if already logged in
    return <Navigate to={from} replace />;
  }

  return children;
};

export default PublicOnlyRoute;
