import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  Flex,
  VStack,
  HStack,
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Divider,
  Icon,
  Image,
  Textarea,
  FormControl,
  FormLabel,
  FormErrorMessage,
  RadioGroup,
  Radio,
  Stack,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Center,
  useToast,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure
} from '@chakra-ui/react';
import {
  FaCalendarAlt,
  FaCamera,
  FaCheck,
  FaSignOutAlt,
  FaArrowLeft,
  FaExclamationTriangle,
  FaStar,
  FaRegStar,
  FaHome
} from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import bookingService from '../../services/bookingService';
import { formatCurrency } from '../../components/helpers/typeConverters';
import { formatDate, formatDateRange } from '../../components/helpers/dateFormatter';

const CheckOutPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const imageInputRef = useRef(null);
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  
  // Form state
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [roomImage, setRoomImage] = useState(null);
  const [roomImagePreview, setRoomImagePreview] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  // Modal state
  const confirmModal = useDisclosure();
  const successModal = useDisclosure();
  
  // Colors
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Fetch booking data
  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        setLoading(true);
        const response = await bookingService.getBooking(bookingId);
        
        if (!response || !response.booking) {
          throw new Error('Booking not found');
        }
        
        // Check if booking is eligible for check-out
        if (response.booking.status !== 'checked_in') {
          throw new Error('This booking is not currently checked in');
        }
        
        setBooking(response.booking);
      } catch (error) {
        console.error('Error fetching booking details:', error);
        setError(error.message || 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookingData();
  }, [bookingId]);
  
  // Handle room image upload
  const handleRoomImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Clear previous error
      setFormErrors(prev => ({ ...prev, roomImage: undefined }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setRoomImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Set the file for upload
      setRoomImage(file);
    }
  };
  
  // Handle check-out
  const handleCheckOut = async () => {
    // Validate the form
    const errors = {};
    
    if (!roomImage) {
      errors.roomImage = 'Please take or upload a room condition photo';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Close confirmation modal and open checkout process
    confirmModal.onClose();
    
    try {
      setCheckingOut(true);
      
      // Create form data for uploading room image
      const formData = new FormData();
      formData.append('room_image', roomImage);
      formData.append('notes', notes);
      formData.append('rating', rating);
      
      // Call the check-out API
      const response = await bookingService.checkOut(bookingId, formData);
      
      if (response && response.success) {
        // Show success modal
        setFeedbackSubmitted(true);
        successModal.onOpen();
      } else {
        throw new Error(response.message || 'Failed to check out');
      }
    } catch (error) {
      console.error('Error during check-out:', error);
      toast({
        title: 'Check-Out Failed',
        description: error.message || 'Failed to complete check-out. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCheckingOut(false);
    }
  };
  
  // Navigate home
  const goHome = () => {
    navigate('/tenant');
  };
  
  // View booking details
  const viewBooking = () => {
    navigate(`/tenant/bookings/${bookingId}`);
  };

  if (loading) {
    return (
      <TenantLayout>
        <Container maxW="container.lg" py={8}>
          <Flex justify="center" align="center" minH="60vh">
            <Spinner size="xl" color="brand.500" thickness="4px" />
          </Flex>
        </Container>
      </TenantLayout>
    );
  }
  
  if (error || !booking) {
    return (
      <TenantLayout>
        <Container maxW="container.lg" py={8}>
          <Button 
            as={RouterLink} 
            to="/tenant/bookings" 
            leftIcon={<FaArrowLeft />} 
            mb={6}
          >
            Back to Bookings
          </Button>
          
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error || 'Booking not found'}
          </Alert>
        </Container>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Container maxW="container.lg" py={8}>
        <Flex justify="space-between" align="center" mb={8}>
          <Button 
            leftIcon={<FaArrowLeft />} 
            variant="ghost" 
            onClick={() => navigate(`/tenant/bookings/${bookingId}`)}
          >
            Back to Booking
          </Button>
          
          <Badge 
            colorScheme="red" 
            py={2} 
            px={4} 
            borderRadius="full" 
            fontSize="md"
          >
            Check-Out Process
          </Badge>
        </Flex>
        
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Booking Summary */}
          <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
            <CardHeader>
              <Heading size="md">Booking Summary</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                <Box>
                  <Text fontWeight="bold">Room</Text>
                  <Text>{booking.room?.name || 'Room'}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold">Booking Period</Text>
                  <Text>{formatDateRange(booking.check_in, booking.check_out)}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold">Amount Paid</Text>
                  <Text>{formatCurrency(booking.total_amount)}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold">Today's Date</Text>
                  <Text>{formatDate(new Date())}</Text>
                </Box>
              </SimpleGrid>
              
              <Alert status="info" mt={4} borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Check-Out Process</AlertTitle>
                  <AlertDescription>
                    Please complete the following steps to check out from your room.
                  </AlertDescription>
                </Box>
              </Alert>
            </CardBody>
          </Card>
          
          {/* Room Condition */}
          <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
            <CardHeader>
              <Heading size="md" display="flex" alignItems="center">
                <Icon as={FaCamera} mr={3} color="brand.500" />
                Room Condition
              </Heading>
            </CardHeader>
            <CardBody>
              <Text mb={4}>
                Please take a photo of the room's current condition before checking out.
                This helps document the room state upon your departure.
              </Text>
              
              <FormControl isInvalid={formErrors.roomImage} mb={6}>
                <FormLabel>Upload Room Condition Photo</FormLabel>
                
                <input
                  type="file"
                  accept="image/*"
                  ref={imageInputRef}
                  onChange={handleRoomImageChange}
                  style={{ display: 'none' }}
                />
                
                {roomImagePreview ? (
                  <Box mb={4}>
                    <Image
                      src={roomImagePreview}
                      alt="Room condition"
                      maxH="300px"
                      mx="auto"
                      borderRadius="md"
                    />
                    <Button
                      mt={2}
                      onClick={() => imageInputRef.current.click()}
                      leftIcon={<FaCamera />}
                      size="sm"
                      variant="outline"
                    >
                      Change Photo
                    </Button>
                  </Box>
                ) : (
                  <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    h="200px"
                    borderWidth="2px"
                    borderStyle="dashed"
                    borderColor={formErrors.roomImage ? "red.500" : "gray.200"}
                    borderRadius="md"
                    cursor="pointer"
                    onClick={() => imageInputRef.current.click()}
                    transition="all 0.2s"
                    _hover={{ bg: "gray.50" }}
                  >
                    <Icon as={FaCamera} boxSize={10} color="gray.400" mb={4} />
                    <Text fontWeight="medium" mb={1}>Upload Room Photo</Text>
                    <Text fontSize="sm" color="gray.500">
                      Click to take a photo or upload from your device
                    </Text>
                  </Flex>
                )}
                
                {formErrors.roomImage && (
                  <FormErrorMessage>{formErrors.roomImage}</FormErrorMessage>
                )}
              </FormControl>
            </CardBody>
          </Card>
          
          {/* Feedback and Notes */}
          <Card bg={bgColor} borderColor={borderColor} borderWidth="1px" gridColumn={{ base: "auto", lg: "span 2" }}>
            <CardHeader>
              <Heading size="md">Feedback & Notes</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl>
                  <FormLabel>Notes about Room Condition (Optional)</FormLabel>
                  <Textarea
                    placeholder="Please note any damages, issues, or special conditions here..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Rate Your Experience</FormLabel>
                  <Flex align="center" mb={2}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Icon
                        key={value}
                        as={value <= rating ? FaStar : FaRegStar}
                        color={value <= rating ? "yellow.400" : "gray.300"}
                        boxSize={8}
                        cursor="pointer"
                        onClick={() => setRating(value)}
                      />
                    ))}
                  </Flex>
                  <Text fontSize="sm" color="gray.500">
                    Your feedback helps us improve our services.
                  </Text>
                </FormControl>
              </SimpleGrid>
            </CardBody>
            <CardFooter>
              <Button
                colorScheme="red"
                leftIcon={<FaSignOutAlt />}
                size="lg"
                width="full"
                onClick={confirmModal.onOpen}
                isDisabled={!roomImage}
              >
                Complete Check-Out
              </Button>
            </CardFooter>
          </Card>
        </SimpleGrid>
        
        {/* Confirmation Modal */}
        <Modal isOpen={confirmModal.isOpen} onClose={confirmModal.onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Confirm Check-Out</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Alert status="warning" borderRadius="md" mb={4}>
                <AlertIcon />
                <Box>
                  <AlertTitle>Are you sure?</AlertTitle>
                  <AlertDescription>
                    This will complete your check-out process. Please ensure you have removed all personal belongings from the room.
                  </AlertDescription>
                </Box>
              </Alert>
              
              <Text>
                Booking ID: #{booking.booking_id}<br />
                Room: {booking.room?.name}<br />
                Check-Out Date: {formatDate(new Date())}
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button mr={3} onClick={confirmModal.onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleCheckOut}
                isLoading={checkingOut}
                loadingText="Processing..."
                leftIcon={<FaSignOutAlt />}
              >
                Confirm Check-Out
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        
        {/* Success Modal */}
        <Modal isOpen={successModal.isOpen} onClose={successModal.onClose} closeOnOverlayClick={false}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Check-Out Complete</ModalHeader>
            <ModalBody>
              <Center flexDirection="column" py={6}>
                <Icon as={FaCheck} boxSize={16} color="green.500" mb={4} />
                <Heading size="lg" textAlign="center" mb={2}>
                  Check-Out Successful!
                </Heading>
                <Text textAlign="center" mb={6}>
                  You have successfully checked out from your room.{' '}
                  {feedbackSubmitted && 'Thank you for your feedback!'}
                </Text>
                <VStack spacing={4} width="100%">
                  <Button 
                    leftIcon={<FaHome />} 
                    colorScheme="brand" 
                    onClick={goHome}
                    width="100%"
                  >
                    Go to Homepage
                  </Button>
                  <Button
                    leftIcon={<FaCalendarAlt />}
                    variant="outline"
                    onClick={viewBooking}
                    width="100%"
                  >
                    View Booking Details
                  </Button>
                </VStack>
              </Center>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </TenantLayout>
  );
};

export default CheckOutPage;
