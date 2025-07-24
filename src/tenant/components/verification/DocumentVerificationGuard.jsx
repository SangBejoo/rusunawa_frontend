import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Text,
  Badge,
  Progress,
  Divider,
  Card,
  CardBody,
  useColorModeValue,
  Skeleton,
  Icon
} from '@chakra-ui/react';
import { FaUpload, FaCheckCircle, FaClock, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useDocumentVerification } from '../../hooks/useDocumentVerification';

/**
 * Document Verification Guard Component
 * Prevents access to booking if documents are not approved
 * Shows verification status and guides user through the process
 */
const DocumentVerificationGuard = ({ children, showFullStatus = false }) => {
  const navigate = useNavigate();
  const { verificationStatus, loading, documents, refreshDocuments, isStudent, tenant } = useDocumentVerification();
  
  // Colors - must be declared at the top level
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const grayBg = useColorModeValue('gray.50', 'gray.800');

  // If still loading, show skeleton
  if (loading) {
    return (
      <Box p={6}>
        <VStack spacing={4}>
          <Skeleton height="60px" width="100%" />
          <Skeleton height="40px" width="80%" />
          <Skeleton height="20px" width="60%" />
        </VStack>
      </Box>
    );
  }

  // If user can book, render children (booking component)
  if (verificationStatus.canBook) {
    return children;
  }

  // Otherwise, show verification status and guide user
  const getStatusIcon = () => {
    switch (verificationStatus.statusType) {
      case 'success':
        return <Icon as={FaCheckCircle} color="green.500" />;
      case 'warning':
        return <Icon as={FaClock} color="yellow.500" />;
      case 'error':
      default:
        return <Icon as={FaExclamationTriangle} color="red.500" />;
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus.statusType) {
      case 'success':
        return 'green';
      case 'warning':
        return 'yellow';
      case 'error':
      default:
        return 'red';
    }
  };

  const getProgressColor = () => {
    if (verificationStatus.hasRejected) return 'red';
    if (verificationStatus.hasPending) return 'yellow';
    if (verificationStatus.allApproved) return 'green';
    return 'gray';
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Main Alert */}
        <Alert 
          status={verificationStatus.statusType} 
          borderRadius="md"
          flexDirection="column"
          alignItems="center"
          textAlign="center"
          py={8}
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Document Verification Required
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {verificationStatus.message}
          </AlertDescription>
          
          {/* Show user type badge */}
          <Badge 
            mt={3}
            colorScheme={isStudent ? 'blue' : 'purple'} 
            px={3} 
            py={1}
          >
            {isStudent ? 'Student (Mahasiswa)' : 'Non-Student'}
          </Badge>
        </Alert>

        {/* Document Requirements Card */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold" textAlign="center">
                {isStudent ? 'Required Documents for Students' : 'Required Documents'}
              </Text>
              
              {/* Show missing documents details */}
              {verificationStatus.missingDocuments && verificationStatus.missingDocuments.length > 0 && (
                <Box>
                  <VStack spacing={2} align="start">
                    {verificationStatus.missingDocuments.map((doc) => (
                      <HStack key={doc.id} w="full" justify="space-between">
                        <Text fontSize="sm">{doc.label}</Text>
                        <Badge 
                          size="sm" 
                          colorScheme={
                            doc.status === 'missing' ? 'red' : 
                            doc.status === 'pending' ? 'yellow' : 
                            doc.status === 'rejected' ? 'red' : 'gray'
                          }
                        >
                          {doc.status === 'missing' ? 'Not Uploaded' : 
                           doc.status === 'pending' ? 'Pending Review' : 
                           doc.status === 'rejected' ? 'Rejected' : doc.status}
                        </Badge>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              )}

              {/* Progress Bar */}
              <Box>
                <HStack justifyContent="space-between" mb={2}>
                  <Text fontSize="sm" color="gray.600">
                    Required Documents Progress
                  </Text>
                  <Text fontSize="sm" fontWeight="bold">
                    {(verificationStatus.requiredCount || 0) - (verificationStatus.missingDocuments?.length || 0)}/
                    {verificationStatus.requiredCount || (isStudent ? 3 : 1)}
                  </Text>
                </HStack>
                <Progress 
                  value={((verificationStatus.requiredCount || 0) - (verificationStatus.missingDocuments?.length || 0)) / (verificationStatus.requiredCount || 1) * 100}
                  colorScheme={getProgressColor()}
                  size="lg"
                  borderRadius="md"
                />
              </Box>

              {/* Document Status Breakdown */}
              {verificationStatus.hasDocuments && (
                <HStack spacing={4} justify="center" flexWrap="wrap">
                  {verificationStatus.approvedCount > 0 && (
                    <Badge colorScheme="green" variant="subtle">
                      {verificationStatus.approvedCount} Approved
                    </Badge>
                  )}
                  {verificationStatus.pendingCount > 0 && (
                    <Badge colorScheme="yellow" variant="subtle">
                      {verificationStatus.pendingCount} Pending
                    </Badge>
                  )}
                  {verificationStatus.rejectedCount > 0 && (
                    <Badge colorScheme="red" variant="subtle">
                      {verificationStatus.rejectedCount} Rejected
                    </Badge>
                  )}
                </HStack>
              )}

              <Divider />

              {/* Action Buttons */}
              <VStack spacing={3}>
                {verificationStatus.missingDocuments?.some(doc => doc.status === 'missing') ? (
                  <Button
                    leftIcon={<FaUpload />}
                    colorScheme="brand"
                    size="lg"
                    onClick={() => navigate('/tenant/documents/upload')}
                    width="100%"
                  >
                    Upload Missing Documents
                  </Button>
                ) : verificationStatus.missingDocuments?.some(doc => doc.status === 'rejected') ? (
                  <Button
                    leftIcon={<FaUpload />}
                    colorScheme="red"
                    size="lg"
                    onClick={() => navigate('/tenant/documents/upload')}
                    width="100%"
                  >
                    Re-upload Rejected Documents
                  </Button>
                ) : !verificationStatus.hasDocuments ? (
                  <Button
                    leftIcon={<FaUpload />}
                    colorScheme="brand"
                    size="lg"
                    onClick={() => navigate('/tenant/documents/upload')}
                    width="100%"
                  >
                    Upload Your First Document
                  </Button>
                ) : (
                  <HStack spacing={3} width="100%">
                    <Button
                      leftIcon={<FaUpload />}
                      colorScheme="brand"
                      variant="outline"
                      onClick={() => navigate('/tenant/documents/upload')}
                      flex={1}
                    >
                      Upload More Documents
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/tenant/documents')}
                      flex={1}
                    >
                      View All Documents
                    </Button>
                  </HStack>
                )}

                {/* Show special note for students about agreement form */}
                {isStudent && verificationStatus.missingDocuments?.some(doc => doc.id === 2) && (
                  <Alert status="info" size="sm" borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="sm">
                      Don't forget to download, fill, and upload the agreement form (Surat Perjanjian)!
                    </Text>
                  </Alert>
                )}

                {/* Refresh Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshDocuments}
                  colorScheme="gray"
                >
                  Refresh Status
                </Button>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Additional Information */}
        <Box p={4} bg={grayBg} borderRadius="md">
          <VStack spacing={2} align="stretch">
            <Text fontWeight="bold" fontSize="sm">Why do I need document verification?</Text>
            <Text fontSize="sm" color="gray.600">
              Document verification ensures the security and compliance of our booking system. 
              You need at least one approved document (like KTP/ID card) to book rooms.
            </Text>
            
            <Text fontSize="sm" color="gray.600" mt={2}>
              <strong>What happens next?</strong>
              <br />
              1. Upload your documents (KTP, Student ID, etc.)
              <br />
              2. Wait for admin approval (usually within 24 hours)
              <br />
              3. Start booking rooms once approved!
            </Text>
          </VStack>
        </Box>

        {/* Optional: Show full status if requested */}
        {showFullStatus && (
          <Box fontSize="sm" color="gray.500">
            <Text>Debug Info:</Text>
            <Text>Documents: {verificationStatus.totalCount}</Text>
            <Text>Can Book: {verificationStatus.canBook ? 'Yes' : 'No'}</Text>
            <Text>Status: {verificationStatus.statusType}</Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default DocumentVerificationGuard;
