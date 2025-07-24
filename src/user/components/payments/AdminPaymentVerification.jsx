import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Button,
  Image,
  Badge,
  Alert,
  AlertIcon,
  Textarea,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Stack,
  useToast,
  useColorModeValue,
  Spinner,
  Divider,
  SimpleGrid,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  IconButton
} from '@chakra-ui/react';
import { FaCheck, FaTimes, FaEye, FaDownload, FaExpand, FaUser, FaCalendar, FaBank } from 'react-icons/fa';
import { paymentService } from '../../services/paymentService';

const AdminPaymentVerification = ({ 
  payment, 
  onVerificationComplete, 
  onClose 
}) => {
  // State management
  const [loading, setLoading] = useState(false);
  const [verificationDecision, setVerificationDecision] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [proofImageUrl, setProofImageUrl] = useState(null);
  const [proofLoading, setProofLoading] = useState(false);

  // UI hooks
  const toast = useToast();
  const { isOpen, onOpen, onClose: closeModal } = useDisclosure();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Load payment proof data
  useEffect(() => {
    if (payment?.id) {
      fetchPaymentProof();
    }
  }, [payment]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fetch payment proof
  const fetchPaymentProof = async () => {
    try {
      setProofLoading(true);
      const response = await paymentService.getPaymentProofDetails(payment.id);
      setPaymentProof(response);
      
      // Get image URL if available
      if (response.hasImage) {
        const imageResponse = await paymentService.getPaymentProofImage(payment.id, {
          format: 'jpeg',
          encoding: 'base64'
        });
        setProofImageUrl(`data:${imageResponse.fileType};base64,${imageResponse.imageContent}`);
      }
    } catch (error) {
      console.error('Failed to fetch payment proof:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment proof',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setProofLoading(false);
    }
  };

  // Download payment proof
  const handleDownload = async () => {
    try {
      const imageData = await paymentService.getPaymentProofImage(payment.id, {
        format: 'original',
        encoding: 'binary'
      });

      const blob = new Blob([imageData.imageContent], { type: imageData.fileType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment_proof_${payment.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Payment proof downloaded successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download payment proof',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  // Handle verification
  const handleVerification = async () => {
    if (!verificationDecision) {
      toast({
        title: 'Please select a decision',
        description: 'Choose whether to approve or reject this payment',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      const verificationData = {
        approved: verificationDecision === 'approve',
        verifier_id: 1, // Replace with actual admin ID from auth context
        verification_notes: verificationNotes || (verificationDecision === 'approve' ? 'Payment approved' : 'Payment rejected')
      };

      const response = await paymentService.verifyManualPayment(payment.id, verificationData);

      // Check if the backend returned an error status
      if (response && response.status === 'error') {
        const errorMessage = response.message || 'Unknown error occurred';
        
        // Check if it's a permission-denied error
        if (errorMessage.toLowerCase().includes('permission denied') || 
            errorMessage.toLowerCase().includes('insufficient privileges') ||
            errorMessage.toLowerCase().includes('only wakil_direktorat can')) {
          
          toast({
            title: 'Access Denied',
            description: 'Only Wakil Direktorat can verify payments. Please contact an authorized user.',
            status: 'warning',
            duration: 6000,
            isClosable: true,
            position: 'top',
          });
        } else {
          // Other types of errors
          toast({
            title: 'Verification Failed',
            description: errorMessage,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
        return;
      }

      toast({
        title: 'Success',
        description: `Payment ${verificationDecision === 'approve' ? 'approved' : 'rejected'} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      if (onVerificationComplete) {
        onVerificationComplete(payment.id, verificationDecision === 'approve');
      }

    } catch (error) {
      // Network or other critical errors
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify payment - please try again',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'yellow';
      case 'verified': return 'green';
      case 'failed': case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Payment Details Header */}
      <Card bg={cardBg} borderColor={borderColor}>
        <CardHeader>
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Heading size="lg">Payment Verification</Heading>
              <Text color="gray.500">Payment ID: #{payment?.id}</Text>
            </VStack>
            <Badge colorScheme={getStatusColor(payment?.status)} fontSize="md" p={2}>
              {payment?.status?.toUpperCase()}
            </Badge>
          </HStack>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {/* Payment Information */}
            <VStack align="start" spacing={4}>
              <Box>
                <Text fontWeight="bold" fontSize="lg" color="blue.500">
                  {formatCurrency(payment?.amount)}
                </Text>
                <Text fontSize="sm" color="gray.500">Payment Amount</Text>
              </Box>
              
              <HStack spacing={3}>
                <Icon as={FaUser} color="gray.500" />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="medium">{payment?.tenantName}</Text>
                  <Text fontSize="sm" color="gray.500">Tenant</Text>
                </VStack>
              </HStack>

              <HStack spacing={3}>
                <Icon as={FaCalendar} color="gray.500" />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="medium">{formatDate(payment?.createdAt)}</Text>
                  <Text fontSize="sm" color="gray.500">Payment Date</Text>
                </VStack>
              </HStack>

              <HStack spacing={3}>
                <Icon as={FaBank} color="gray.500" />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="medium">{payment?.paymentChannel || 'Bank Transfer'}</Text>
                  <Text fontSize="sm" color="gray.500">Payment Method</Text>
                </VStack>
              </HStack>
            </VStack>

            {/* Proof Information */}
            <VStack align="start" spacing={4}>
              {paymentProof && (
                <>
                  <Text fontWeight="bold">Bank Transfer Details:</Text>
                  {paymentProof.bankName && (
                    <Text><strong>Bank:</strong> {paymentProof.bankName}</Text>
                  )}
                  {paymentProof.accountNumber && (
                    <Text><strong>Account:</strong> {paymentProof.accountNumber}</Text>
                  )}
                  {paymentProof.accountHolderName && (
                    <Text><strong>Account Holder:</strong> {paymentProof.accountHolderName}</Text>
                  )}
                  {paymentProof.transferDate && (
                    <Text><strong>Transfer Date:</strong> {formatDate(paymentProof.transferDate)}</Text>
                  )}
                  {paymentProof.notes && (
                    <Box>
                      <Text fontWeight="bold">Notes:</Text>
                      <Text fontSize="sm" p={2} bg="gray.50" borderRadius="md">
                        {paymentProof.notes}
                      </Text>
                    </Box>
                  )}
                </>
              )}
            </VStack>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Payment Proof Image */}
      <Card bg={cardBg} borderColor={borderColor}>
        <CardHeader>
          <HStack justify="space-between">
            <Heading size="md">Payment Proof</Heading>
            <HStack spacing={2}>
              {proofImageUrl && (
                <>
                  <IconButton
                    icon={<FaExpand />}
                    aria-label="View full size"
                    size="sm"
                    onClick={onOpen}
                  />
                  <IconButton
                    icon={<FaDownload />}
                    aria-label="Download proof"
                    size="sm"
                    onClick={handleDownload}
                  />
                </>
              )}
            </HStack>
          </HStack>
        </CardHeader>
        <CardBody>
          {proofLoading ? (
            <Box textAlign="center" py={8}>
              <Spinner size="lg" />
              <Text mt={4}>Loading payment proof...</Text>
            </Box>
          ) : proofImageUrl ? (
            <Box>
              <Image
                src={proofImageUrl}
                alt="Payment Proof"
                maxH="400px"
                objectFit="contain"
                border="1px"
                borderColor={borderColor}
                borderRadius="md"
                w="100%"
                cursor="pointer"
                onClick={onOpen}
              />
              <Text fontSize="sm" color="gray.500" mt={2} textAlign="center">
                Click image to view full size
              </Text>
            </Box>
          ) : (
            <Alert status="info">
              <AlertIcon />
              No payment proof available
            </Alert>
          )}
        </CardBody>
      </Card>

      {/* Verification Form */}
      {payment?.status === 'pending' && (
        <Card bg={cardBg} borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Verification Decision</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Decision</FormLabel>
                <RadioGroup value={verificationDecision} onChange={setVerificationDecision}>
                  <Stack direction="row" spacing={4}>
                    <Radio value="approve" colorScheme="green">
                      <HStack spacing={2}>
                        <Icon as={FaCheck} color="green.500" />
                        <Text>Approve Payment</Text>
                      </HStack>
                    </Radio>
                    <Radio value="reject" colorScheme="red">
                      <HStack spacing={2}>
                        <Icon as={FaTimes} color="red.500" />
                        <Text>Reject Payment</Text>
                      </HStack>
                    </Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Verification Notes</FormLabel>
                <Textarea
                  placeholder="Add notes about your verification decision (optional)"
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  rows={3}
                />
              </FormControl>

              <Divider />

              <HStack spacing={4} justify="flex-end">
                <Button
                  variant="outline"
                  onClick={onClose}
                  isDisabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme={verificationDecision === 'approve' ? 'green' : 'red'}
                  leftIcon={verificationDecision === 'approve' ? <FaCheck /> : <FaTimes />}
                  onClick={handleVerification}
                  isLoading={loading}
                  loadingText="Processing..."
                  isDisabled={!verificationDecision}
                >
                  {verificationDecision === 'approve' ? 'Approve Payment' : 'Reject Payment'}
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Full Size Image Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Payment Proof - Full Size</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {proofImageUrl && (
              <Image
                src={proofImageUrl}
                alt="Payment proof full size"
                w="100%"
                objectFit="contain"
                borderRadius="md"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default AdminPaymentVerification;
