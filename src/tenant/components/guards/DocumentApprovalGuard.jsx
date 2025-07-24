import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Card,
  CardBody,
  Icon,
  HStack,
  Progress,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  FaFileAlt, 
  FaCloudUploadAlt, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle,
  FaExclamationTriangle 
} from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import TenantLayout from '../components/layout/TenantLayout';
import { useTenantAuth } from '../context/tenantAuthContext';
import { useDocumentApproval } from '../hooks/useDocumentApproval';

/**
 * Document Approval Guard Component
 * Blocks access to booking routes until documents are uploaded and approved
 */
const DocumentApprovalGuard = ({ children, requiresApproval = true }) => {
  const { isAuthenticated } = useTenantAuth();
  const location = useLocation();
  const {
    isLoading,
    canAccessBooking,
    needsDocumentUpload,
    needsApproval,
    hasOnlyRejectedDocuments,
    documents,
    approvedDocuments,
    pendingDocuments,
    rejectedDocuments,
    error
  } = useDocumentApproval();

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/tenant/login" replace />;
  }

  // If loading, show loading state
  if (isLoading) {
    return (
      <TenantLayout>
        <Container maxW="4xl" py={8}>
          <VStack spacing={6}>
            <Progress size="lg" isIndeterminate colorScheme="brand" width="100%" />
            <Text color={textColor}>Checking document approval status...</Text>
          </VStack>
        </Container>
      </TenantLayout>
    );
  }

  // If there's an error, show error state but allow access (fail-safe)
  if (error) {
    console.warn('Document approval check failed, allowing access:', error);
    return children;
  }

  // If document approval is required and user can't access booking
  if (requiresApproval && !canAccessBooking) {
    const getStatusMessage = () => {
      if (needsDocumentUpload) {
        return {
          title: "Documents Required",
          description: "You need to upload your identification documents before you can book rooms.",
          icon: FaCloudUploadAlt,
          status: "warning",
          actionText: "Upload Documents",
          actionLink: "/tenant/documents/upload"
        };
      }
      
      if (hasOnlyRejectedDocuments) {
        return {
          title: "Documents Rejected",
          description: "Your documents have been rejected. Please upload new documents for review.",
          icon: FaTimesCircle,
          status: "error",
          actionText: "Upload New Documents",
          actionLink: "/tenant/documents/upload"
        };
      }
      
      if (needsApproval) {
        return {
          title: "Awaiting Document Approval",
          description: "Your documents are being reviewed. You'll be able to book rooms once they're approved.",
          icon: FaClock,
          status: "info",
          actionText: "View Documents",
          actionLink: "/tenant/documents"
        };
      }

      return {
        title: "Access Restricted",
        description: "Please ensure your documents are uploaded and approved.",
        icon: FaExclamationTriangle,
        status: "warning",
        actionText: "Check Documents",
        actionLink: "/tenant/documents"
      };
    };

    const statusInfo = getStatusMessage();

    return (
      <TenantLayout>
        <Container maxW="4xl" py={8}>
          <VStack spacing={6} align="center">
            {/* Main Alert */}
            <Alert
              status={statusInfo.status}
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              height="200px"
              borderRadius="lg"
            >
              <Icon as={statusInfo.icon} boxSize="40px" mr={0} />
              <AlertTitle mt={4} mb={1} fontSize="lg">
                {statusInfo.title}
              </AlertTitle>
              <AlertDescription maxWidth="sm" fontSize="md">
                {statusInfo.description}
              </AlertDescription>
            </Alert>

            {/* Document Status Summary */}
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" width="100%" maxW="md">
              <CardBody>
                <VStack spacing={4}>
                  <Heading size="md" textAlign="center">Document Status</Heading>
                  
                  <VStack spacing={3} width="100%">
                    {/* Total Documents */}
                    <HStack justify="space-between" width="100%">
                      <HStack>
                        <Icon as={FaFileAlt} color="gray.500" />
                        <Text>Total Documents:</Text>
                      </HStack>
                      <Badge variant="outline" colorScheme="gray">
                        {documents.length}
                      </Badge>
                    </HStack>

                    {/* Approved Documents */}
                    <HStack justify="space-between" width="100%">
                      <HStack>
                        <Icon as={FaCheckCircle} color="green.500" />
                        <Text>Approved:</Text>
                      </HStack>
                      <Badge colorScheme="green">
                        {approvedDocuments?.length || 0}
                      </Badge>
                    </HStack>

                    {/* Pending Documents */}
                    <HStack justify="space-between" width="100%">
                      <HStack>
                        <Icon as={FaClock} color="yellow.500" />
                        <Text>Pending Review:</Text>
                      </HStack>
                      <Badge colorScheme="yellow">
                        {pendingDocuments?.length || 0}
                      </Badge>
                    </HStack>

                    {/* Rejected Documents */}
                    <HStack justify="space-between" width="100%">
                      <HStack>
                        <Icon as={FaTimesCircle} color="red.500" />
                        <Text>Rejected:</Text>
                      </HStack>
                      <Badge colorScheme="red">
                        {rejectedDocuments?.length || 0}
                      </Badge>
                    </HStack>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Action Buttons */}
            <VStack spacing={3}>
              <Button
                as={RouterLink}
                to={statusInfo.actionLink}
                colorScheme="brand"
                size="lg"
                leftIcon={<Icon as={statusInfo.icon} />}
              >
                {statusInfo.actionText}
              </Button>
              
              <Button
                as={RouterLink}
                to="/tenant/dashboard"
                variant="outline"
                size="md"
              >
                Return to Dashboard
              </Button>
            </VStack>

            {/* Additional Info */}
            <Text fontSize="sm" color={textColor} textAlign="center" maxW="md">
              Note: You need at least one approved document to access booking features. 
              Approval typically takes 1-2 business days.
            </Text>
          </VStack>
        </Container>
      </TenantLayout>
    );
  }

  // If approval is not required or user has approved documents, render children
  return children;
};

export default DocumentApprovalGuard;
