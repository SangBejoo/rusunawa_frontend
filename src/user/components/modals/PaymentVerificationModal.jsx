import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  FormControl,
  FormLabel,
  Textarea,
  Select,
  Badge,
  Divider,
  Image,
  Box,
  useToast,
  Alert,
  AlertIcon,
  Center,
  Spinner,
  Card,
  CardBody,
  Grid,
  GridItem,
  RadioGroup,
  Radio,
  useColorModeValue
} from '@chakra-ui/react';
import { FiCheck, FiX, FiClock, FiUser, FiCreditCard } from 'react-icons/fi';
import paymentService from '../../services/paymentService';
import { useAuth } from '../../context/authContext';
import { canUserVerifyPayments, isRegularAdmin } from '../../utils/roleUtils';

const PaymentVerificationModal = ({ isOpen, onClose, payment, onPaymentUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [verificationDecision, setVerificationDecision] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [proofLoading, setProofLoading] = useState(false);

  const { user } = useAuth();
  const canVerify = canUserVerifyPayments(user);
  const isAdmin = isRegularAdmin(user);

  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    if (isOpen && payment) {
      fetchPaymentProof();
      // Reset form
      setVerificationDecision('');
      setVerificationNotes('');
    }
  }, [isOpen, payment]);
  const fetchPaymentProof = async () => {
    if (!payment?.id) return;
    
    try {
      setProofLoading(true);
      
      // Check if payment proof is already embedded in payment object
      if (payment.paymentProof) {
        setPaymentProof({
          proof_url: payment.paymentProof.base64Content ? 
            `data:${payment.paymentProof.fileType || 'image/jpeg'};base64,${payment.paymentProof.base64Content}` : 
            null,
          proof_notes: payment.paymentProof.notes || '',
          file_name: payment.paymentProof.fileName || '',
          file_type: payment.paymentProof.fileType || '',
          uploaded_at: payment.paymentProof.uploadedAt,
        });
      } else {
        // Fallback: fetch proof details from API
        const response = await paymentService.getPaymentProofDetails(payment.id);
        setPaymentProof(response);
      }
    } catch (error) {
      console.error('Failed to fetch payment proof:', error);
      setPaymentProof(null);
    } finally {
      setProofLoading(false);
    }
  };  const handleVerifyPayment = async () => {
    if (!verificationDecision) {
      toast({
        title: 'Warning',
        description: 'Please select a verification decision',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      
      const verificationData = {
        approved: verificationDecision === 'approve',
        verifier_id: 1, // Replace with actual admin ID from auth context
        verification_notes: verificationNotes || (verificationDecision === 'approve' ? 'Payment approved' : 'Payment rejected')
      };

      const response = await paymentService.verifyManualPayment(payment.id, verificationData);
      
      console.log('🔍 Payment Modal Debug: Backend response:', response);
      
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
      
      // Check if backend silently rejected/failed instead of approving (permission issue)
      if (response && response.payment && verificationDecision === 'approve') {
        const paymentStatus = response.payment.status;
        
        if (paymentStatus === 'failed' || paymentStatus === 'rejected') {
          console.log('🔍 Payment Modal Debug: Backend silently failed payment instead of approving - permission issue detected');
          
          // Check if the message mentions wakil_direktorat (indicating permission issue)
          const statusMessage = response.status?.message || '';
          if (statusMessage.toLowerCase().includes('wakil_direktorat')) {
            toast({
              title: 'Access Denied',
              description: 'Only Wakil Direktorat can verify payments. Your request was automatically rejected.',
              status: 'warning',
              duration: 6000,
              isClosable: true,
              position: 'top',
            });
            onPaymentUpdated();
            onClose();
            return;
          }
        }
      }
      
      // Success case
      toast({
        title: 'Success',
        description: `Payment ${verificationDecision === 'approve' ? 'approved' : 'rejected'} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onPaymentUpdated();
      onClose();
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'completed': return 'blue';
      case 'verified': return 'green';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  if (!payment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Verify Payment</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Info banner for admin users */}
            {isAdmin && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Limited Access</Text>
                  <Text fontSize="sm">
                    You can view payment details but cannot approve or reject payments. Only Wakil Direktorat and Super Admin users can verify payments.
                  </Text>
                </Box>
              </Alert>
            )}

            {/* Payment Information */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" color="gray.500">Tenant</Text>
                      <HStack>
                        <FiUser />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="semibold">{payment.tenant_name}</Text>
                          <Text fontSize="sm" color="gray.500">Room {payment.room_number}</Text>
                        </VStack>
                      </HStack>
                    </VStack>
                  </GridItem>

                  <GridItem>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" color="gray.500">Amount</Text>
                      <Text fontSize="xl" fontWeight="bold" color="green.600">
                        {formatCurrency(payment.amount)}
                      </Text>
                    </VStack>
                  </GridItem>

                  <GridItem>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" color="gray.500">Payment Method</Text>
                      <Text fontWeight="medium">{payment.payment_method}</Text>
                    </VStack>
                  </GridItem>

                  <GridItem>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" color="gray.500">Payment Date</Text>
                      <HStack>
                        <FiClock />
                        <Text>{formatDate(payment.payment_date)}</Text>
                      </HStack>
                    </VStack>
                  </GridItem>

                  <GridItem>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" color="gray.500">Status</Text>
                      <Badge colorScheme={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </VStack>
                  </GridItem>

                  <GridItem>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" color="gray.500">Type</Text>
                      <Text fontWeight="medium">{payment.payment_type}</Text>
                    </VStack>
                  </GridItem>
                </Grid>
              </CardBody>
            </Card>

            {/* Payment Proof */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <Text fontSize="lg" fontWeight="semibold" mb={4}>Payment Proof</Text>
                
                {proofLoading ? (
                  <Center py={8}>
                    <Spinner size="lg" />
                  </Center>
                ) : paymentProof?.proof_url ? (
                  <Box>
                    <Image
                      src={paymentProof.proof_url}
                      alt="Payment Proof"
                      maxH="400px"
                      objectFit="contain"
                      border="1px"
                      borderColor={borderColor}
                      borderRadius="md"
                    />
                    {paymentProof.proof_notes && (
                      <Box mt={3} p={3} bg="gray.50" borderRadius="md">
                        <Text fontSize="sm" color="gray.600">
                          <strong>Notes:</strong> {paymentProof.proof_notes}
                        </Text>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Alert status="warning">
                    <AlertIcon />
                    No payment proof uploaded
                  </Alert>
                )}
              </CardBody>
            </Card>

            {/* Verification Form */}
            {canVerify && (
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Text fontSize="lg" fontWeight="semibold" mb={4}>Verification Decision</Text>
                  
                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel>Decision</FormLabel>
                      <RadioGroup value={verificationDecision} onChange={setVerificationDecision}>
                        <VStack align="start" spacing={3}>
                          <Radio value="approve" colorScheme="green">
                            <HStack>
                              <FiCheck color="green" />
                              <Text>Approve Payment</Text>
                            </HStack>
                          </Radio>
                          <Radio value="reject" colorScheme="red">
                            <HStack>
                              <FiX color="red" />
                              <Text>Reject Payment</Text>
                            </HStack>
                          </Radio>
                        </VStack>
                      </RadioGroup>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Verification Notes</FormLabel>
                      <Textarea
                        value={verificationNotes}
                        onChange={(e) => setVerificationNotes(e.target.value)}
                        placeholder="Add any notes about your verification decision..."
                        rows={4}
                      />
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            {canVerify && (
              <Button
                colorScheme={verificationDecision === 'approve' ? 'green' : 'red'}
                onClick={handleVerifyPayment}
                isLoading={loading}
                isDisabled={!verificationDecision}
                leftIcon={verificationDecision === 'approve' ? <FiCheck /> : <FiX />}
              >
                {verificationDecision === 'approve' ? 'Approve Payment' : 'Reject Payment'}
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PaymentVerificationModal;
