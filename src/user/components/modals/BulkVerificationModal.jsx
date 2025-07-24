import React, { useState } from 'react';
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
  RadioGroup,
  Radio,
  Badge,
  Alert,
  AlertIcon,
  useToast,
  useColorModeValue
} from '@chakra-ui/react';
import { FiCheck, FiX, FiUsers } from 'react-icons/fi';
import paymentService from '../../services/paymentService';

const BulkVerificationModal = ({ isOpen, onClose, paymentIds, onPaymentUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [verificationDecision, setVerificationDecision] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');

  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');

  const handleBulkVerification = async () => {
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
        verification_notes: verificationNotes || (verificationDecision === 'approve' ? 'Bulk approval' : 'Bulk rejection')
      };

      // Process each payment individually
      const results = await Promise.allSettled(
        paymentIds.map(paymentId => 
          paymentService.verifyManualPayment(paymentId, verificationData)
        )
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      if (successful > 0) {
        toast({
          title: 'Success',
          description: `${successful} payment(s) ${verificationDecision === 'approve' ? 'approved' : 'rejected'} successfully${failed > 0 ? `, ${failed} failed` : ''}`,
          status: successful === paymentIds.length ? 'success' : 'warning',
          duration: 3000,
          isClosable: true,
        });
      }

      if (failed === paymentIds.length) {
        toast({
          title: 'Error',
          description: 'Failed to verify all payments',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }

      onPaymentUpdated();
      onClose();
      
      // Reset form
      setVerificationDecision('');
      setVerificationNotes('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify payments',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setVerificationDecision('');
    setVerificationNotes('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <FiUsers />
            <Text>Bulk Payment Verification</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            <Alert status="info">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontWeight="semibold">
                  You are about to verify {paymentIds.length} payment(s)
                </Text>
                <Text fontSize="sm">
                  This action will apply the same verification decision to all selected payments.
                </Text>
              </VStack>
            </Alert>

            <FormControl isRequired>
              <FormLabel>Verification Decision</FormLabel>
              <RadioGroup value={verificationDecision} onChange={setVerificationDecision}>
                <VStack align="start" spacing={3}>
                  <Radio value="approve" colorScheme="green">
                    <HStack>
                      <FiCheck color="green" />
                      <Text>Approve All Payments</Text>
                      <Badge colorScheme="green" ml={2}>
                        {paymentIds.length} payments
                      </Badge>
                    </HStack>
                  </Radio>
                  <Radio value="reject" colorScheme="red">
                    <HStack>
                      <FiX color="red" />
                      <Text>Reject All Payments</Text>
                      <Badge colorScheme="red" ml={2}>
                        {paymentIds.length} payments
                      </Badge>
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
                placeholder="Add notes for this bulk verification (optional)..."
                rows={4}
              />
            </FormControl>

            {verificationDecision === 'reject' && (
              <Alert status="warning">
                <AlertIcon />
                <Text fontSize="sm">
                  Rejecting payments will require manual review and possible re-submission from tenants.
                </Text>
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              colorScheme={verificationDecision === 'approve' ? 'green' : 'red'}
              onClick={handleBulkVerification}
              isLoading={loading}
              isDisabled={!verificationDecision}
              leftIcon={verificationDecision === 'approve' ? <FiCheck /> : <FiX />}
            >
              {verificationDecision === 'approve' 
                ? `Approve ${paymentIds.length} Payment(s)` 
                : `Reject ${paymentIds.length} Payment(s)`
              }
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BulkVerificationModal;
