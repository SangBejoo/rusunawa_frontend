import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Spinner, Center, Alert, AlertIcon, VStack, Text } from '@chakra-ui/react';
import { useAuth } from '../../context/authContext';

const ProtectedRoute = ({ children, requiredRole, allowedRoles, requiresApprovalPermission = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <Center h="100vh">
        <Alert status="error" maxW="md">
          <AlertIcon />
          <VStack align="start" spacing={2}>
            <Text fontWeight="bold">Access Denied</Text>
            <Text>Your role ({user?.role}) does not have permission to access this page.</Text>
            <Text>Required role: {requiredRole}</Text>
          </VStack>
        </Alert>
      </Center>
    );
  }

  // Check if user role is in allowed roles list
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <Center h="100vh">
        <Alert status="error" maxW="md">
          <AlertIcon />
          <VStack align="start" spacing={2}>
            <Text fontWeight="bold">Access Denied</Text>
            <Text>Your role ({user?.role}) does not have permission to access this page.</Text>
            <Text>Allowed roles: {allowedRoles.join(', ')}</Text>
          </VStack>
        </Alert>
      </Center>
    );
  }

  // Check approval permission for specific pages
  if (requiresApprovalPermission && user?.role !== 'wakil_direktorat' && user?.role !== 'super_admin') {
    return (
      <Center h="100vh">
        <Alert status="warning" maxW="md">
          <AlertIcon />
          <VStack align="start" spacing={2}>
            <Text fontWeight="bold">Approval Access Required</Text>
            <Text>Your role ({user?.role}) can view this page but cannot perform approval actions.</Text>
            <Text>Only wakil_direktorat can approve bookings, payments, and documents.</Text>
          </VStack>
        </Alert>
      </Center>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
