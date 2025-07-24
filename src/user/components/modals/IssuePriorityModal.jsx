import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Select,
  Textarea,
  VStack,
  HStack,
  Text,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Icon,
  useToast,
  useColorModeValue,
  Divider,
  Grid,
  GridItem,
  Card,
  CardBody,
  Progress,
} from '@chakra-ui/react';
import { 
  FaExclamationTriangle, 
  FaExclamationCircle, 
  FaInfo, 
  FaArrowDown,
  FaClock,
  FaUser,
  FaCalendarAlt,
  FaTags
} from 'react-icons/fa';
import issueService from '../../services/issueService';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Biasa' },
  { value: 'medium', label: 'Segera' },
  { value: 'high', label: 'Mendesak' }
];

const IssuePriorityModal = ({ isOpen, onClose, issue, onUpdated }) => {
  const [selectedPriority, setSelectedPriority] = useState(issue?.priority || '');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Reset form when issue changes
  useEffect(() => {
    if (issue) {
      setSelectedPriority(issue.priority || '');
      setReason('');
    }
  }, [issue]);

  const selectedPriorityOption = PRIORITY_OPTIONS.find(p => p.value === selectedPriority);

  const handleSubmit = async () => {
    if (!selectedPriority) {
      toast({
        title: 'Please select a priority level',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: 'Please provide a reason for this priority assignment',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Updating priority for issue:', issue.issueId || issue.id);
      console.log('Priority data:', {
        priority: selectedPriority,
        reason: reason.trim(),
        updatedBy: 1
      });
      
      const response = await issueService.updateIssuePriority(issue.issueId || issue.id, {
        priority: selectedPriority,
        reason: reason.trim(),
        updatedBy: 1 // TODO: Get from auth context
      });

      console.log('Priority update response:', response);

      toast({
        title: 'Priority Updated Successfully',
        description: `Issue priority has been set to ${selectedPriorityOption?.label}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Clear form and call onUpdated callback
      setSelectedPriority('');
      setReason('');
      
      if (onUpdated) {
        await onUpdated();
      }
      
      onClose();
    } catch (error) {
      console.error('Error updating priority:', error);
      toast({
        title: 'Failed to Update Priority',
        description: error.message || 'An error occurred while updating the priority',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedPriority(issue?.priority || '');
      setReason('');
      onClose();
    }
  };

  const getCurrentPriorityBadge = () => {
    if (!issue?.priority) {
      return (
        <Badge variant="outline" colorScheme="gray" px={3} py={1}>
          NO PRIORITY ASSIGNED
        </Badge>
      );
    }

    const currentOption = PRIORITY_OPTIONS.find(p => p.value === issue.priority);
    return (
      <Badge colorScheme={currentOption?.color || 'gray'} variant="solid" px={3} py={1}>
        {currentOption?.label.toUpperCase() || issue.priority.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" closeOnOverlayClick={!isSubmitting}>
      <ModalOverlay />
      <ModalContent bg={bgColor} maxH="90vh" overflowY="auto">
        <ModalHeader>
          <HStack spacing={3}>
            <Icon as={FaTags} color="blue.500" />
            <Text>Assign Issue Priority</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton isDisabled={isSubmitting} />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Current Issue Info */}
            <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <Text fontWeight="bold" fontSize="lg">
                      Issue #{issue?.issueId || issue?.id}
                    </Text>
                    {getCurrentPriorityBadge()}
                  </HStack>
                  
                  <Text fontSize="sm" color="gray.600">
                    {issue?.description || issue?.title}
                  </Text>

                  <Grid templateColumns="repeat(2, 1fr)" gap={4} fontSize="sm">
                    <GridItem>
                      <HStack>
                        <Icon as={FaUser} color="gray.500" />
                        <Text>Reporter: {issue?.reporter_name || 'Unknown'}</Text>
                      </HStack>
                    </GridItem>
                    <GridItem>
                      <HStack>
                        <Icon as={FaCalendarAlt} color="gray.500" />
                        <Text>
                          Reported: {issue?.reportedAt ? 
                            new Date(issue.reportedAt).toLocaleDateString() : 
                            'Unknown date'
                          }
                        </Text>
                      </HStack>
                    </GridItem>
                  </Grid>
                </VStack>
              </CardBody>
            </Card>

            {/* Priority Selection */}
            <FormControl isRequired>
              <FormLabel>Select Priority Level</FormLabel>
              <Select
                placeholder="Choose priority level..."
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                isDisabled={isSubmitting}
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </Select>
            </FormControl>

            {/* Priority Details removed as requested */}

            {/* Reason for Priority Assignment */}
            <FormControl isRequired>
              <FormLabel>Reason for Priority Assignment</FormLabel>
              <Textarea
                placeholder="Provide a clear reason for this priority level assignment..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                isDisabled={isSubmitting}
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                This information will be visible to the tenant and maintenance team
              </Text>
            </FormControl>

            {/* Priority Change Notice */}
            {issue?.priority && issue.priority !== selectedPriority && selectedPriority && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle fontSize="sm">Priority Change Notice</AlertTitle>
                  <AlertDescription fontSize="xs">
                    Priority will change from{' '}
                    <strong>{PRIORITY_OPTIONS.find(p => p.value === issue.priority)?.label}</strong>
                    {' '}to{' '}
                    <strong>{selectedPriorityOption?.label}</strong>.
                    The tenant and maintenance team will be notified of this change.
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            {/* Progress bar during submission */}
            {isSubmitting && (
              <Box>
                <Text fontSize="sm" mb={2}>Updating priority...</Text>
                <Progress size="sm" isIndeterminate colorScheme="blue" />
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button 
              variant="ghost" 
              onClick={handleClose}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleSubmit}
              isLoading={isSubmitting}
              loadingText="Updating..."
              isDisabled={!selectedPriority || !reason.trim()}
            >
              Assign Priority
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default IssuePriorityModal;
