import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Checkbox,
  Divider,
  Flex,
  useToast,
  useColorModeValue,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  FormControl,
  FormErrorMessage,
  Accordion,
  Icon,
  SimpleGrid,
  Image
} from '@chakra-ui/react';
import { FaQrcode, FaCheckCircle, FaArrowLeft, FaKey, FaClipboardCheck, FaList, FaUserClock } from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import bookingService from '../../services/bookingService';
import { formatDate, formatDateRange } from '../../components/helpers/dateFormatter';

const CheckInPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [roomImagePreview, setRoomImagePreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
    useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const response = await bookingService.getBooking(bookingId);
        if (!response?.booking) {
          throw new Error('Booking not found');
        }
        
        setBooking(response.booking);
        setError(null);
        
        // Check if booking access is available
        if (response.booking.status === 'cancelled' || response.booking.status === 'rejected') {
          setError(`This booking has been ${response.booking.status}. Please contact support if you need assistance.`);
        } else if (response.booking.status === 'pending') {
          setError('Your booking is still pending approval. You will receive access information once approved.');
        } else if (response.booking.payment_status !== 'paid') {
          setError('Payment is required before accessing room details. Please complete your payment first.');
        }
        
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError(err.message || 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBooking();
  }, [bookingId]);
    const handleSubmit = async () => {
    if (!acceptedTerms) {
      toast({
        title: 'Agreement Required',
        description: 'Please read and accept the terms to continue',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // For now, just show success message and navigate to booking details
    toast({
      title: 'Room Access Confirmed',
      description: 'You have confirmed your room access. Please save the information below.',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
    
    // Navigate to booking details page where they can see full booking info
    navigate(`/tenant/bookings/${bookingId}`);
  };
  
  // Handle navigation between steps
  const nextStep = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const prevStep = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  if (loading) {
    return (
      <TenantLayout>
        <Container maxW="container.md" py={8} textAlign="center">
          <Spinner size="xl" color="brand.500" />
          <Text mt={4}>Loading booking information...</Text>
        </Container>
      </TenantLayout>
    );
  }
  
  if (error || !booking) {
    return (
      <TenantLayout>
        <Container maxW="container.md" py={8}>
          <Alert status="error" borderRadius="md" mb={4}>
            <AlertIcon />
            {error}
          </Alert>
          <Button 
            leftIcon={<FaArrowLeft />} 
            colorScheme="brand" 
            variant="outline"
            onClick={() => navigate('/tenant/bookings')}
          >
            Return to Bookings
          </Button>
        </Container>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Container maxW="container.lg" py={8}>
        <Button
          leftIcon={<FaArrowLeft />}
          colorScheme="brand"
          variant="outline"
          mb={6}
          onClick={() => navigate(`/tenant/bookings/${bookingId}`)}
        >
          Back to Booking
        </Button>
        
        {/* Step 1: Room Inspection */}
        {activeStep === 0 && (
          <Card bg={bgColor} borderColor={borderColor} borderWidth="1px" mb={6}>
            <CardHeader>
              <Heading size="md" display="flex" alignItems="center">
                <Icon as={FaKey} mr={3} color="brand.500" />
                Room Inspection
              </Heading>
            </CardHeader>
            <CardBody>
              <Text mb={4}>
                Please inspect your room and confirm that everything is in order before proceeding with the check-in:
              </Text>
              
              <VStack spacing={4} align="stretch">
                <HStack>
                  <FaKey />
                  <Text fontWeight="bold">Room:</Text>
                  <Text>{booking.room?.name}</Text>
                </HStack>
                
                <HStack>
                  <FaClipboardCheck />
                  <Text fontWeight="bold">Check-In Date:</Text>
                  <Text>{formatDate(booking.check_in_date)}</Text>
                </HStack>
                
                <Box>
                  <Text fontWeight="medium" mb={2}>Room Condition Photo</Text>
                  <Image
                    src={roomImagePreview}
                    alt="Room condition"
                    maxH="200px"
                    borderRadius="md"
                  />
                </Box>
                
                {notes && (
                  <Box>
                    <Text fontWeight="medium" mb={2}>Your Notes</Text>
                    <Text>{notes}</Text>
                  </Box>
                )}
              </VStack>
            </CardBody>
            <CardFooter justifyContent="space-between">
              <Button
                colorScheme="brand"
                onClick={nextStep}
                rightIcon={<FaCheckCircle />}
              >
                Confirm Room Inspection
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {/* Step 2: Terms & Policies */}
        {activeStep === 1 && (
          <Card bg={bgColor} borderColor={borderColor} borderWidth="1px" mb={6}>
            <CardHeader>
              <Heading size="md" display="flex" alignItems="center">
                <Icon as={FaList} mr={3} color="brand.500" />
                Terms & Policies
              </Heading>
            </CardHeader>
            <CardBody>
              <Text mb={4}>
                Please review and accept our resident terms and policies before completing check-in:
              </Text>
              
              <Accordion allowToggle defaultIndex={[0]} mb={6}>
                <Accordion.Item border="none">
                  <Accordion.Button>
                    <Box flex="1" textAlign="left">
                      <Text fontWeight="medium">1. House Rules</Text>
                    </Box>
                    <Accordion.Icon />
                  </Accordion.Button>
                  <Accordion.Panel pb={4}>
                    <Text color="gray.600" fontSize="sm">
                      - No smoking in the room or common areas{'\n'}
                      - No pets allowed{'\n'}
                      - Quiet hours from 10 PM to 7 AM{'\n'}
                      - Dispose of trash properly{'\n'}
                      - Report any damages or maintenance issues immediately
                    </Text>
                  </Accordion.Panel>
                </Accordion.Item>
                
                <Accordion.Item border="none">
                  <Accordion.Button>
                    <Box flex="1" textAlign="left">
                      <Text fontWeight="medium">2. Liability Waiver</Text>
                    </Box>
                    <Accordion.Icon />
                  </Accordion.Button>
                  <Accordion.Panel pb={4}>
                    <Text color="gray.600" fontSize="sm">
                      - The management is not responsible for any loss or damage to your personal belongings.{'\n'}
                      - You agree to indemnify and hold harmless the management from any claims arising from your use of the facilities.
                    </Text>
                  </Accordion.Panel>
                </Accordion.Item>
                
                <Accordion.Item border="none">
                  <Accordion.Button>
                    <Box flex="1" textAlign="left">
                      <Text fontWeight="medium">3. Termination of Stay</Text>
                    </Box>
                    <Accordion.Icon />
                  </Accordion.Button>
                  <Accordion.Panel pb={4}>
                    <Text color="gray.600" fontSize="sm">
                      - The management reserves the right to terminate your stay without refund if you violate any house rules or policies.
                    </Text>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
              
              <FormControl isInvalid={formErrors.acceptedTerms}>
                <Checkbox
                  colorScheme="brand"
                  isChecked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    
                    // Clear error when checkbox is checked
                    if (e.target.checked) {
                      setFormErrors(prev => ({ ...prev, acceptedTerms: undefined }));
                    }
                  }}
                >
                  I have read and agree to abide by all Rusunawa policies and terms of stay
                </Checkbox>
                {formErrors.acceptedTerms && (
                  <FormErrorMessage>{formErrors.acceptedTerms}</FormErrorMessage>
                )}
              </FormControl>
            </CardBody>
            <CardFooter justifyContent="space-between">
              <Button
                onClick={prevStep}
              >
                Back: Room Inspection
              </Button>
              <Button
                colorScheme="brand"
                onClick={nextStep}
                isDisabled={!acceptedTerms}
              >
                Next: Complete Check-In
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {/* Step 3: Complete Check-In */}
        {activeStep === 2 && (
          <Card bg={bgColor} borderColor={borderColor} borderWidth="1px" mb={6}>
            <CardHeader>
              <Heading size="md" display="flex" alignItems="center">
                <Icon as={FaKey} mr={3} color="brand.500" />
                Complete Check-In
              </Heading>
            </CardHeader>
            <CardBody>
              <Alert status="info" borderRadius="md" mb={6}>
                <AlertIcon />
                <Box>
                  <AlertTitle>Ready to Complete Check-In</AlertTitle>
                  <AlertDescription>
                    Please review your information before finalizing your check-in.
                  </AlertDescription>
                </Box>
              </Alert>
              
              <VStack spacing={6} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Text color="gray.500" fontSize="sm">Room</Text>
                    <Text fontWeight="medium">{booking.room?.name}</Text>
                  </Box>
                  <Box>
                    <Text color="gray.500" fontSize="sm">Booking Period</Text>
                    <Text fontWeight="medium">{formatDateRange(booking.check_in, booking.check_out)}</Text>
                  </Box>
                  <Box>
                    <Text color="gray.500" fontSize="sm">Guest Name</Text>
                    <Text fontWeight="medium">{booking.tenant?.name || 'Guest'}</Text>
                  </Box>
                  <Box>
                    <Text color="gray.500" fontSize="sm">Check-In Date</Text>
                    <Text fontWeight="medium">{formatDate(new Date())}</Text>
                  </Box>
                </SimpleGrid>
                
                <Divider />
                
                <Box>
                  <Text fontWeight="medium" mb={2}>Room Condition Photo</Text>
                  <Image
                    src={roomImagePreview}
                    alt="Room condition"
                    maxH="200px"
                    borderRadius="md"
                  />
                </Box>
                
                {notes && (
                  <Box>
                    <Text fontWeight="medium" mb={2}>Your Notes</Text>
                    <Text>{notes}</Text>
                  </Box>
                )}
                
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Terms Accepted</AlertTitle>
                    <AlertDescription>
                      You have read and agreed to all Rusunawa policies and terms of stay.
                    </AlertDescription>
                  </Box>
                </Alert>
              </VStack>
            </CardBody>
            <CardFooter justifyContent="space-between">
              <Button
                onClick={prevStep}
              >
                Back: Terms & Policies
              </Button>
              <Button
                colorScheme="brand"
                onClick={handleSubmit}
                isLoading={checkingIn}
                loadingText="Completing Check-In..."
                leftIcon={<FaUserClock />}
              >
                Complete Check-In
              </Button>
            </CardFooter>
          </Card>
        )}
      </Container>
    </TenantLayout>
  );
};

export default CheckInPage;
