import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Box,
  Text,
  Divider,
  Alert,
  AlertIcon,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepDescription,
  StepSeparator,
  Badge,
  Progress,
  useToast,
  useColorModeValue,
  Flex,
  Icon,
  SimpleGrid,
  Card,
  CardBody,
  Checkbox,
  Select,
  FormControl,
  FormLabel,
  Textarea
} from '@chakra-ui/react';
import {
  FaCalendarAlt,
  FaMoneyBillWave,
  FaUser,
  FaBed,
  FaCheckCircle,
  FaCreditCard,
  FaClock,
  FaExclamationTriangle
} from 'react-icons/fa';
import enhancedBookingService from '../../services/enhancedBookingService';
import paymentService from '../../services/paymentService';
import { useEnhancedPayments, usePaymentNotifications } from '../../hooks/useEnhancedPayments';
import { formatCurrency } from '../helpers/typeConverters';
import { formatDate } from '../helpers/dateFormatter';

const EnhancedBookingModal = ({ 
  isOpen, 
  onClose, 
  room, 
  checkInDate, 
  checkOutDate, 
  rentalType 
}) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { notifications } = usePaymentNotifications();
  
  // Enhanced payment hooks
  const {
    createBookingWithPayment,
    getPaymentMethods,
    generateInvoice,
    isLoading,
    error: paymentError
  } = useEnhancedPayments();
  
  // Modal state
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentPreferences, setPaymentPreferences] = useState({
    autoProcess: true,
    notifyOnStatus: true,
    preferredMethod: null
  });
  const [bookingNotes, setBookingNotes] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  // Colors
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const stepperBg = useColorModeValue('gray.50', 'gray.800');
  
  // Steps configuration
  const steps = [
    { title: 'Review Booking', description: 'Confirm booking details' },
    { title: 'Payment Method', description: 'Choose payment option' },
    { title: 'Confirmation', description: 'Complete booking process' }
  ];
  
  // Calculate booking details
  const calculateBookingDetails = () => {
    if (!room || !checkInDate || !checkOutDate) return null;
    
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const duration = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    const baseRate = room.rate || 0;
    const subtotal = baseRate * duration;
    const serviceFee = subtotal * 0.05; // 5% service fee
    const total = subtotal + serviceFee;
    
    return {
      duration,
      baseRate,
      subtotal,
      serviceFee,
      total,
      checkIn,
      checkOut
    };
  };
  
  const bookingDetails = calculateBookingDetails();
  
  // Fetch payment methods when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethods();
    }
  }, [isOpen]);
  
  const fetchPaymentMethods = async () => {
    try {
      const response = await getPaymentMethods();
      const methods = response.methods || [];
      setPaymentMethods(methods);
      
      // Set default payment method
      if (methods.length > 0) {
        const defaultMethod = methods.find(m => m.enabled) || methods[0];
        setSelectedPaymentMethod(defaultMethod.methodId?.toString());
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment methods',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleBookingSubmit = async () => {
    if (!agreeToTerms) {
      toast({
        title: 'Terms Required',
        description: 'Please agree to the terms and conditions',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (!selectedPaymentMethod) {
      toast({
        title: 'Payment Method Required',
        description: 'Please select a payment method',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const bookingPayload = {
        roomId: room.id,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        rentalTypeId: rentalType?.id,
        totalAmount: bookingDetails.total,
        notes: bookingNotes,
        roomName: room.name
      };
      
      const paymentOptions = {
        methodId: parseInt(selectedPaymentMethod),
        autoProcess: paymentPreferences.autoProcess,
        notifyOnStatus: paymentPreferences.notifyOnStatus
      };
      
      console.log('Creating booking with payment:', { bookingPayload, paymentOptions });
      
      const response = await createBookingWithPayment(bookingPayload, paymentOptions);
      
      if (response.booking) {
        setBookingData(response);
        setCurrentStep(2); // Move to confirmation step
        
        toast({
          title: 'Booking Created!',
          description: 'Your booking has been successfully created.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: 'Booking Failed',
        description: error.message || 'There was an error creating your booking. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePaymentRedirect = () => {
    if (bookingData?.booking?.bookingId) {
      if (bookingData.invoice?.invoiceId) {
        // If we have an invoice, go to payment selection
        navigate(`/tenant/invoices/${bookingData.invoice.invoiceId}/payment`);
      } else {
        // Otherwise, go to booking-based payment selection
        navigate(`/tenant/bookings/${bookingData.booking.bookingId}/payment`);
      }
    }
    onClose();
  };
  
  const handleClose = () => {
    setCurrentStep(0);
    setBookingData(null);
    setSelectedPaymentMethod('');
    setBookingNotes('');
    setAgreeToTerms(false);
    onClose();
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderBookingReview();
      case 1:
        return renderPaymentMethodSelection();
      case 2:
        return renderConfirmation();
      default:
        return null;
    }
  };
  
  const renderBookingReview = () => (
    <VStack spacing={4} align="stretch">
      <Card variant="outline" borderColor={borderColor}>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontSize="xl" fontWeight="bold">{room?.name}</Text>
              <Badge colorScheme="brand" fontSize="sm">
                {rentalType?.name === 'harian' ? 'Daily' : 'Monthly'} Rental
              </Badge>
            </Flex>
            
            <SimpleGrid columns={2} spacing={4}>
              <Box>
                <HStack spacing={2}>
                  <Icon as={FaCalendarAlt} color="brand.500" />
                  <Text fontWeight="medium">Check-in</Text>
                </HStack>
                <Text color="gray.600">{formatDate(checkInDate)}</Text>
              </Box>
              
              <Box>
                <HStack spacing={2}>
                  <Icon as={FaCalendarAlt} color="brand.500" />
                  <Text fontWeight="medium">Check-out</Text>
                </HStack>
                <Text color="gray.600">{formatDate(checkOutDate)}</Text>
              </Box>
              
              <Box>
                <HStack spacing={2}>
                  <Icon as={FaClock} color="brand.500" />
                  <Text fontWeight="medium">Duration</Text>
                </HStack>
                <Text color="gray.600">{bookingDetails?.duration} days</Text>
              </Box>
              
              <Box>
                <HStack spacing={2}>
                  <Icon as={FaUser} color="brand.500" />
                  <Text fontWeight="medium">Capacity</Text>
                </HStack>
                <Text color="gray.600">{room?.capacity || 1} person(s)</Text>
              </Box>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>
      
      {/* Price Breakdown */}
      <Card variant="outline" borderColor={borderColor}>
        <CardBody>
          <VStack spacing={3} align="stretch">
            <Text fontWeight="bold">Price Breakdown</Text>
            
            <Flex justify="space-between">
              <Text>Base rate ({bookingDetails?.duration} days)</Text>
              <Text>{formatCurrency(bookingDetails?.subtotal || 0)}</Text>
            </Flex>
            
            <Flex justify="space-between">
              <Text>Service fee</Text>
              <Text>{formatCurrency(bookingDetails?.serviceFee || 0)}</Text>
            </Flex>
            
            <Divider />
            
            <Flex justify="space-between" fontWeight="bold" fontSize="lg">
              <Text>Total</Text>
              <Text color="brand.500">{formatCurrency(bookingDetails?.total || 0)}</Text>
            </Flex>
          </VStack>
        </CardBody>
      </Card>
      
      {/* Booking Notes */}
      <FormControl>
        <FormLabel>Additional Notes (Optional)</FormLabel>
        <Textarea
          placeholder="Any special requests or notes about your booking..."
          value={bookingNotes}
          onChange={(e) => setBookingNotes(e.target.value)}
          rows={3}
        />
      </FormControl>
    </VStack>
  );
  
  const renderPaymentMethodSelection = () => (
    <VStack spacing={4} align="stretch">
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Choose Your Payment Method</Text>
          <Text fontSize="sm">
            You can complete payment now or receive an invoice to pay later.
          </Text>
        </Box>
      </Alert>
      
      <FormControl isRequired>
        <FormLabel>Payment Method</FormLabel>
        <Select
          value={selectedPaymentMethod}
          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
          placeholder="Select payment method"
        >
          {paymentMethods.map(method => (
            <option key={method.methodId} value={method.methodId}>
              {method.name} - {method.description}
            </option>
          ))}
        </Select>
      </FormControl>
      
      {/* Payment Preferences */}
      <Card variant="outline" borderColor={borderColor}>
        <CardBody>
          <Text fontWeight="bold" mb={3}>Payment Preferences</Text>
          <VStack spacing={3} align="stretch">
            <Checkbox
              isChecked={paymentPreferences.autoProcess}
              onChange={(e) => setPaymentPreferences(prev => ({
                ...prev,
                autoProcess: e.target.checked
              }))}
            >
              Auto-process payment when possible
            </Checkbox>
            
            <Checkbox
              isChecked={paymentPreferences.notifyOnStatus}
              onChange={(e) => setPaymentPreferences(prev => ({
                ...prev,
                notifyOnStatus: e.target.checked
              }))}
            >
              Send notifications on payment status changes
            </Checkbox>
          </VStack>
        </CardBody>
      </Card>
      
      {/* Terms and Conditions */}
      <Checkbox
        isChecked={agreeToTerms}
        onChange={(e) => setAgreeToTerms(e.target.checked)}
        colorScheme="brand"
      >
        I agree to the terms and conditions and privacy policy
      </Checkbox>
    </VStack>
  );
  
  const renderConfirmation = () => {
    if (!bookingData) return null;
      return (
      <VStack spacing={4} align="stretch">
        <Flex direction="column" align="center" py={6}>
          <Icon as={FaCheckCircle} boxSize="64px" color="green.500" mb={4} />
          <Text fontSize="2xl" fontWeight="bold" color="green.500" mb={2}>
            Booking Confirmed!
          </Text>          
          <Text color="gray.600" textAlign="center">
            Your booking has been successfully created and is ready for payment.
          </Text>
        </Flex>
        
        <Card variant="outline" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <Text fontWeight="bold">Booking Details</Text>
              
              <SimpleGrid columns={2} spacing={3}>
                <Box>
                  <Text fontSize="sm" color="gray.500">Booking ID</Text>
                  <Text fontWeight="medium">#{bookingData.booking.bookingId}</Text>
                </Box>
                
                <Box>
                  <Text fontSize="sm" color="gray.500">Status</Text>
                  <Badge colorScheme="yellow">Pending Payment</Badge>
                </Box>
                
                <Box>
                  <Text fontSize="sm" color="gray.500">Room</Text>
                  <Text fontWeight="medium">{room?.name}</Text>
                </Box>
                
                <Box>
                  <Text fontSize="sm" color="gray.500">Amount</Text>
                  <Text fontWeight="medium" color="brand.500">
                    {formatCurrency(bookingDetails?.total || 0)}
                  </Text>
                </Box>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>
        
        {bookingData.invoice && (
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Invoice Generated</Text>
              <Text fontSize="sm">
                Invoice #{bookingData.invoice.invoiceId} has been created. 
                Click "Proceed to Payment" to complete your booking.
              </Text>
            </Box>
          </Alert>
        )}
        
        {/* Recent notifications */}
        {notifications.length > 0 && (
          <Card variant="outline" borderColor={borderColor}>
            <CardBody>
              <Text fontWeight="bold" mb={2}>Recent Updates</Text>
              <VStack spacing={2} align="stretch">
                {notifications.slice(0, 3).map((notification, index) => (
                  <Flex key={index} align="center" justify="space-between">
                    <Text fontSize="sm">{notification.message}</Text>
                    <Text fontSize="xs" color="gray.500">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </Text>
                  </Flex>
                ))}
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    );
  };
  
  const renderFooter = () => {
    switch (currentStep) {
      case 0:
        return (
          <HStack spacing={3}>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="brand" 
              onClick={handleNextStep}
              isDisabled={!bookingDetails}
            >
              Continue
            </Button>
          </HStack>
        );
        
      case 1:
        return (
          <HStack spacing={3}>
            <Button variant="outline" onClick={handlePrevStep}>
              Back
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleBookingSubmit}
              isLoading={isSubmitting}
              loadingText="Creating Booking..."
              isDisabled={!selectedPaymentMethod || !agreeToTerms}
            >
              Create Booking
            </Button>
          </HStack>
        );
        
      case 2:
        return (
          <HStack spacing={3}>
            <Button variant="outline" onClick={handleClose}>
              View Bookings
            </Button>
            <Button
              colorScheme="brand"
              onClick={handlePaymentRedirect}
              leftIcon={<FaCreditCard />}
            >
              Proceed to Payment
            </Button>
          </HStack>
        );
        
      default:
        return null;
    }
  };
  
  if (!room || !checkInDate || !checkOutDate || !bookingDetails) {
    return null;
  }
  
  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent maxW="600px">
        <ModalHeader>
          <VStack spacing={3} align="stretch">
            <Text>Confirm Your Booking</Text>
            
            {/* Stepper */}
            <Box bg={stepperBg} p={4} borderRadius="md">
              <Stepper index={currentStep} orientation="horizontal" gap="0">
                {steps.map((step, index) => (
                  <Step key={index}>
                    <StepIndicator>
                      <StepStatus
                        complete={<StepIcon />}
                        incomplete={<StepNumber />}
                        active={<StepNumber />}
                      />
                    </StepIndicator>
                    
                    <Box flexShrink="0">
                      <StepTitle>{step.title}</StepTitle>
                      <StepDescription>{step.description}</StepDescription>
                    </Box>
                    
                    <StepSeparator />
                  </Step>
                ))}
              </Stepper>
            </Box>
            
            {/* Progress bar */}
            <Progress 
              value={(currentStep + 1) / steps.length * 100} 
              colorScheme="brand" 
              size="sm" 
              borderRadius="md"
            />
          </VStack>
        </ModalHeader>
        
        <ModalCloseButton />
        
        <ModalBody>
          {paymentError && (
            <Alert status="error" mb={4} borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Payment System Error</Text>
                <Text fontSize="sm">{paymentError}</Text>
              </Box>
            </Alert>
          )}
          
          {renderStepContent()}
        </ModalBody>
        
        <ModalFooter>
          {renderFooter()}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EnhancedBookingModal;
