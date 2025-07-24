import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Button,
  VStack,
  HStack,
  Text,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Card,
  CardBody,
  CardHeader,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  Grid,
  GridItem,
  Radio,
  RadioGroup,
  Stack,
  Icon,
  Divider,
  Image,
  Flex,
  Progress,
  Badge,
  Spinner,
  Switch,
  Center
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaExclamationTriangle,
  FaTools,
  FaHome,
  FaWater,
  FaBolt,
  FaSnowflake,
  FaBroom,
  FaUpload,
  FaImage,
  FaTimes,
  FaCamera,
  FaBed,
  FaInfoCircle,
  FaCheckCircle
} from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import { useTenantAuth } from '../../context/tenantAuthContext';
import axios from 'axios';
import { API_URL, getAuthHeader } from '../../utils/apiConfig';
import issueService from '../../services/issueService';
import bookingService from '../../services/bookingService';
import MultiImageUpload from '../../../shared/components/MultiImageUpload';

const ReportIssuePage = () => {
  const { tenant } = useTenantAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Booking-related state
  const [activeBookings, setActiveBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [allowWithoutBooking, setAllowWithoutBooking] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    contactPhone: ''
    // Note: priority is no longer set by tenant - will be determined by admin
  });
  
  // Multi-image state
  const [selectedImages, setSelectedImages] = useState([]);

  // Form validation
  const [errors, setErrors] = useState({});

  const categories = [
    { value: 'electrical', label: 'Electrical', icon: FaBolt, color: 'yellow' },
    { value: 'plumbing', label: 'Plumbing', icon: FaWater, color: 'blue' },
    { value: 'hvac', label: 'Air Conditioning/Heating', icon: FaSnowflake, color: 'cyan' },
    { value: 'cleaning', label: 'Cleaning', icon: FaBroom, color: 'green' },
    { value: 'maintenance', label: 'General Maintenance', icon: FaTools, color: 'orange' },
    { value: 'furniture', label: 'Furniture', icon: FaHome, color: 'purple' },
    { value: 'other', label: 'Other', icon: FaExclamationTriangle, color: 'gray' }
  ];
  
  // Note: Priority is now determined by admin, not tenant

  // Load tenant's active bookings on component mount
  useEffect(() => {
    loadActiveBookings();
  }, [tenant]);

  const loadActiveBookings = async () => {
    if (!tenant?.tenantId && !tenant?.id) {
      setLoadingBookings(false);
      return;
    }

    try {
      setLoadingBookings(true);
      const tenantId = tenant?.tenantId || tenant?.id;
      
      // Get tenant's bookings
      const response = await bookingService.getTenantBookings(tenantId);
      
      if (response?.bookings) {        // Filter for active bookings (checked-in, confirmed, or approved bookings within date range)
        const now = new Date();
        const activeBookings = response.bookings.filter(booking => {
          const checkIn = new Date(booking.checkInDate || booking.check_in);
          const checkOut = new Date(booking.checkOutDate || booking.check_out);
          
          // Consider a booking active if:
          // 1. It's checked-in status, OR
          // 2. It's confirmed and current date is within the booking period, OR
          // 3. It's approved and check-in date is today or in the near future (within 7 days)
          return (
            (booking.status === 'checked_in') ||
            (booking.status === 'confirmed' && now >= checkIn && now <= checkOut) ||
            (booking.status === 'approved' && checkIn <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) // Within 7 days
          );
        });        console.log('Active bookings found:', activeBookings);
        console.log('Raw bookings response:', response.bookings);
        console.log('Booking structure sample:', activeBookings[0]);
        console.log('Current date for filtering:', now);
        console.log('Booking status filtering results:', response.bookings.map(b => ({
          id: b.bookingId,
          status: b.status,
          checkIn: b.checkInDate,
          checkOut: b.checkOutDate,
          isActive: (
            (b.status === 'checked_in') ||
            (b.status === 'confirmed' && now >= new Date(b.checkInDate) && now <= new Date(b.checkOutDate)) ||
            (b.status === 'approved' && new Date(b.checkInDate) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000))
          )
        })));
        setActiveBookings(activeBookings);
        
        // Auto-select the first active booking if available
        if (activeBookings.length > 0) {
          const primaryBooking = activeBookings[0];
          setSelectedBooking(primaryBooking);
          
          // Auto-fill location if available
          if (primaryBooking.roomNumber || primaryBooking.room_number) {
            setFormData(prev => ({
              ...prev,
              location: `Room ${primaryBooking.roomNumber || primaryBooking.room_number}${
                primaryBooking.buildingName ? ` - ${primaryBooking.buildingName}` : ''
              }`
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading active bookings:', error);
      // Don't show error toast, just log it - tenant can still report issues
    } finally {
      setLoadingBookings(false);
    }
  };
  const handleBookingSelection = (booking) => {
    console.log('🔄 Booking selection changed:', {
      selectedBooking: booking,
      bookingId: booking?.bookingId,
      booking_id: booking?.booking_id,
      id: booking?.id
    });
    setSelectedBooking(booking);
    
    // Auto-fill location based on selected booking
    if (booking) {
      setFormData(prev => ({
        ...prev,
        location: `Room ${booking.roomNumber || booking.room_number}${
          booking.buildingName ? ` - ${booking.buildingName}` : ''
        }`
      }));
    } else {
      // Clear location if no booking selected
      setFormData(prev => ({
        ...prev,
        location: ''
      }));
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImagesChange = (images) => {
    setSelectedImages(images);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if tenant has active bookings - this is now a requirement
    if (!activeBookings || activeBookings.length === 0) {
      toast({
        title: 'No Active Booking',
        description: 'You must have an active room booking to report maintenance issues.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    if (!validateForm()) {
      toast({
        title: 'Please fix the errors in the form',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Check if tenant data is available
    if (!tenant || (!tenant.tenantId && !tenant.id)) {
      toast({
        title: 'Authentication Error',
        description: 'Unable to get tenant information. Please try logging in again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Log tenant object for debugging
      console.log('Tenant object structure:', tenant);
      console.log('Tenant ID:', tenant?.tenantId || tenant?.id);      // Prepare issue data according to API specification
      const issueData = {
        tenantId: tenant?.tenantId || tenant?.id || 0,
        reportedByUserId: tenant?.userId || tenant?.id || 0,
        // Include booking ID - now required since we enforce active bookings
        bookingId: selectedBooking ? (
          selectedBooking.bookingId || 
          selectedBooking.booking_id || 
          selectedBooking.id ||
          null
        ) : (
          // If no booking selected but active bookings exist, use the first one
          activeBookings[0]?.bookingId || 
          activeBookings[0]?.booking_id || 
          activeBookings[0]?.id ||
          null
        ),
        // Combine title and description with location info
        description: `${formData.title}\n\n${formData.description}\n\nLocation: ${formData.location}${formData.contactPhone ? `\nContact: ${formData.contactPhone}` : ''}`,
        category: formData.category || 'general',
        // Note: Priority will be set by admin, not included in tenant submission
        estimatedResolutionHours: 0 // Default estimation
      };      // Enhanced debugging for booking linkage
      console.log('=== ISSUE SUBMISSION DEBUG ===');
      console.log('Selected booking object:', selectedBooking);
      console.log('Selected booking fields check:', {
        bookingId: selectedBooking?.bookingId,
        booking_id: selectedBooking?.booking_id,
        id: selectedBooking?.id,
        fullObject: selectedBooking
      });
      console.log('Extracted booking ID:', issueData.bookingId);
      console.log('Final issue data:', issueData);
      console.log('Active bookings state:', activeBookings);
      console.log('===============================');

      // Prepare attachments if images are selected
      if (selectedImages.length > 0) {
        const initialAttachments = [];
        
        selectedImages.forEach((image, index) => {
          initialAttachments.push({
            fileName: image.fileName,
            fileType: image.fileType,
            content: image.base64, // base64 content without data:image prefix
            attachmentType: 'evidence', // Default type for initial report
            contextDescription: image.contextDescription || `Initial report evidence ${index + 1}`,
            isPrimary: image.isPrimary || index === 0 // First image is primary by default
          });
        });
        
        issueData.initialAttachments = initialAttachments;
      }

      // Make API request using the updated issueService
      console.log('Sending issue data:', issueData);
      console.log('Selected images count:', selectedImages.length);
      
      const response = await issueService.reportIssue(issueData);        toast({
        title: 'Issue Reported Successfully',
        description: `Your maintenance request "${formData.title}" has been submitted with ${selectedImages.length} image${selectedImages.length !== 1 ? 's' : ''}. Issue ID: ${response.issue?.issueId || 'Unknown'}${selectedBooking ? ` (Linked to Booking #${selectedBooking.bookingId || selectedBooking.booking_id})` : ''}. We will respond within 24 hours.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        location: '',
        contactPhone: ''
        // Note: No priority field as it's determined by admin
      });
      setSelectedImages([]);

      // Navigate back to issues page
      setTimeout(() => {
        navigate('/tenant/issues');
      }, 2000);
    } catch (error) {
      console.error('Error submitting issue:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('API Response Error:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      toast({
        title: 'Error Submitting Issue',
        description: error.response?.data?.message || 'Failed to submit your issue. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TenantLayout>
      <Container maxW="container.lg" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <HStack mb={4}>
              <Button
                leftIcon={<FaArrowLeft />}
                variant="ghost"
                onClick={() => navigate('/tenant/issues')}
              >
                Back to Issues
              </Button>
            </HStack>
            
            <Heading size="xl" mb={2}>
              Report Maintenance Issue
            </Heading>
            <Text color="gray.600">
              Please provide detailed information about the issue you're experiencing.
              This helps us resolve it faster.
            </Text>
          </Box>          {/* Information Alert */}
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="medium">Response Time</Text>
              <Text fontSize="sm">
                Emergency issues (water leaks, electrical hazards) will be addressed within 2 hours.
                Other issues typically take 24-48 hours to resolve.
              </Text>
            </Box>
          </Alert>

          {/* Booking Selection Section */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader>
              <HStack spacing={3}>
                <Icon as={FaBed} color="blue.500" />
                <VStack align="start" spacing={1}>
                  <Heading size="md">Link to Current Booking</Heading>
                  <Text fontSize="sm" color="gray.600">
                    This helps us identify the specific room and context for your issue
                  </Text>
                </VStack>
              </HStack>
            </CardHeader>
            <CardBody>
              {loadingBookings ? (
                <Center py={6}>
                  <VStack spacing={3}>
                    <Spinner />
                    <Text fontSize="sm" color="gray.600">Loading your active bookings...</Text>
                  </VStack>
                </Center>
              ) : activeBookings.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  <Alert status="success" borderRadius="md">
                    <FaCheckCircle />
                    <Box ml={2}>
                      <Text fontWeight="medium">Active Booking Found!</Text>
                      <Text fontSize="sm">
                        We'll automatically link this issue to your current booking for faster resolution.
                      </Text>
                    </Box>
                  </Alert>

                  <FormControl>
                    <FormLabel>Select Booking (Optional)</FormLabel>
                    <VStack spacing={3} align="stretch">
                      {activeBookings.map((booking) => (
                        <Box
                          key={booking.bookingId || booking.booking_id}
                          p={4}
                          borderWidth="1px"
                          borderColor={
                            selectedBooking?.bookingId === booking.bookingId ||
                            selectedBooking?.booking_id === booking.booking_id
                              ? 'blue.500'
                              : borderColor
                          }
                          borderRadius="md"
                          cursor="pointer"
                          onClick={() => handleBookingSelection(booking)}
                          _hover={{ borderColor: 'blue.300' }}
                          bg={
                            selectedBooking?.bookingId === booking.bookingId ||
                            selectedBooking?.booking_id === booking.booking_id
                              ? 'blue.50'
                              : 'transparent'
                          }
                        >
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <HStack spacing={2}>
                                <Badge colorScheme="blue" variant="outline">
                                  Booking #{booking.bookingId || booking.booking_id}
                                </Badge>
                                <Badge 
                                  colorScheme={booking.status === 'checked_in' ? 'green' : 'yellow'}
                                  variant="solid"
                                >
                                  {booking.status === 'checked_in' ? 'Checked In' : 'Confirmed'}
                                </Badge>
                              </HStack>
                              <Text fontWeight="medium">
                                Room {booking.roomNumber || booking.room_number}
                                {booking.buildingName && ` - ${booking.buildingName}`}
                              </Text>
                              <Text fontSize="sm" color="gray.600">
                                {new Date(booking.checkInDate || booking.check_in).toLocaleDateString()} - {' '}
                                {new Date(booking.checkOutDate || booking.check_out).toLocaleDateString()}
                              </Text>
                            </VStack>
                            {(selectedBooking?.bookingId === booking.bookingId ||
                              selectedBooking?.booking_id === booking.booking_id) && (
                              <Icon as={FaCheckCircle} color="blue.500" />
                            )}
                          </HStack>
                        </Box>
                      ))}
                      
                      <Box
                        p={4}
                        borderWidth="1px"
                        borderColor={!selectedBooking ? 'blue.500' : borderColor}
                        borderRadius="md"
                        cursor="pointer"
                        onClick={() => handleBookingSelection(null)}
                        _hover={{ borderColor: 'blue.300' }}
                        bg={!selectedBooking ? 'blue.50' : 'transparent'}
                      >
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="medium">Report without booking link</Text>
                            <Text fontSize="sm" color="gray.600">
                              For general issues or when the problem isn't related to your current booking
                            </Text>
                          </VStack>
                          {!selectedBooking && (
                            <Icon as={FaCheckCircle} color="blue.500" />
                          )}
                        </HStack>
                      </Box>
                    </VStack>
                  </FormControl>
                </VStack>
              ) : (
                <VStack spacing={4} align="stretch">
                  <Alert status="warning" borderRadius="md">
                    <FaInfoCircle />
                    <Box ml={2}>
                      <Text fontWeight="medium">No Active Booking Found</Text>
                      <Text fontSize="sm">
                        You must have an active booking to report maintenance issues. 
                        Please make a room booking first before reporting any issues.
                      </Text>
                    </Box>
                  </Alert>
                  
                  <Box p={4} bg="red.50" borderRadius="md" borderWidth="1px" borderColor="red.200">
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="medium" color="red.700">❌ Issue reporting is only available for tenants with active bookings</Text>
                      <VStack align="start" spacing={1} pl={4}>
                        <Text fontSize="sm" color="red.600">• You need to have a confirmed or active room booking</Text>
                        <Text fontSize="sm" color="red.600">• Issues must be related to your occupied or reserved room</Text>
                        <Text fontSize="sm" color="red.600">• This ensures we can provide proper and timely assistance</Text>
                      </VStack>
                      <Button 
                        colorScheme="blue" 
                        size="sm" 
                        mt={2}
                        onClick={() => navigate('/tenant/rooms')}
                      >
                        Browse Available Rooms
                      </Button>
                    </VStack>
                  </Box>
                </VStack>
              )}
            </CardBody>
          </Card>

          {/* Main Form - Only show if user has active bookings */}
          {!loadingBookings && activeBookings.length > 0 ? (
            <form onSubmit={handleSubmit}>
              <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
                {/* Left Column - Form Fields */}
                <GridItem>
                  <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                    <CardHeader>
                      <Heading size="md">Issue Details</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        {/* Title */}
                        <FormControl isRequired isInvalid={errors.title}>
                          <FormLabel>Issue Title</FormLabel>
                          <Input
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="Brief description of the issue"
                          />
                          {errors.title && (
                            <Text color="red.500" fontSize="sm">{errors.title}</Text>
                          )}
                        </FormControl>

                        {/* Description */}
                        <FormControl isRequired isInvalid={errors.description}>
                          <FormLabel>Detailed Description</FormLabel>
                          <Textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Please describe the issue in detail. Include when it started, what you've tried, etc."
                            rows={4}
                          />
                          {errors.description && (
                            <Text color="red.500" fontSize="sm">{errors.description}</Text>
                          )}
                        </FormControl>

                        {/* Location */}
                        <FormControl isRequired isInvalid={errors.location}>
                          <FormLabel>Location</FormLabel>
                          <Input
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            placeholder="e.g., Room 101, Bathroom, Kitchen"
                          />
                          {errors.location && (
                            <Text color="red.500" fontSize="sm">{errors.location}</Text>
                          )}
                        </FormControl>

                        {/* Contact Phone */}
                        <FormControl>
                          <FormLabel>Contact Phone (Optional)</FormLabel>
                          <Input
                            name="contactPhone"
                            value={formData.contactPhone}
                            onChange={handleInputChange}
                            placeholder="Alternative contact number"
                          />
                        </FormControl>
                          {/* Multi-Image Upload */}
                        <FormControl>
                          <FormLabel>Upload Evidence Images</FormLabel>
                          <MultiImageUpload
                            images={selectedImages}
                            onImagesChange={handleImagesChange}
                            maxImages={5}                            title="Upload Evidence Images"
                            description="Drag and drop images here, or click to select files"
                            contextDescription="Issue evidence photo"
                            required={false}
                            showPreview={true}
                            allowReorder={true}
                          />
                          <Text fontSize="xs" color="gray.500" mt={2}>
                            Upload up to 5 images to help us understand the issue better. The first image will be used as the primary evidence.
                          </Text>
                        </FormControl>
                      </VStack>
                    </CardBody>
                  </Card>
                </GridItem>

                {/* Right Column - Category and Priority */}
                <GridItem>
                  <VStack spacing={6} align="stretch">
                    {/* Category Selection */}
                    <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                      <CardHeader>
                        <Heading size="md">Category</Heading>
                      </CardHeader>
                      <CardBody>
                        <FormControl isRequired isInvalid={errors.category}>
                          <VStack spacing={3} align="stretch">
                            {categories.map((cat) => (
                              <Box
                                key={cat.value}
                                p={3}
                                borderWidth="1px"
                                borderRadius="md"
                                borderColor={formData.category === cat.value ? `${cat.color}.300` : borderColor}
                                bg={formData.category === cat.value ? `${cat.color}.50` : 'transparent'}
                                cursor="pointer"
                                onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                                _hover={{ borderColor: `${cat.color}.300` }}
                              >
                                <HStack>
                                  <Icon as={cat.icon} color={`${cat.color}.500`} />
                                  <Text fontWeight="medium">{cat.label}</Text>
                                </HStack>
                              </Box>
                            ))}
                          </VStack>
                          {errors.category && (
                            <Text color="red.500" fontSize="sm" mt={2}>{errors.category}</Text>
                          )}
                        </FormControl>
                      </CardBody>
                    </Card>

                    {/* Admin Priority Notice */}
                    <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                      <CardHeader>
                        <Heading size="md">Priority Assignment</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={3} align="center" textAlign="center">
                          <Icon as={FaExclamationTriangle} color="blue.500" boxSize={8} />
                          <Text fontWeight="medium" color="blue.600">
                            Priority Determined by Admin
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            The priority level (High, Medium, Low) for your issue will be determined by our admin team based on urgency and impact assessment. You will be notified once the priority is assigned.
                          </Text>
                        </VStack>
                      </CardBody>
                    </Card>

                    {/* Submit Button with Progress */}
                    <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                      <CardBody>
                        <VStack spacing={4}>
                          {isSubmitting && (
                            <Box w="100%">
                              <Text fontSize="sm" mb={2}>
                                Uploading... {uploadProgress}%
                              </Text>
                              <Progress value={uploadProgress} colorScheme="blue" />
                            </Box>
                          )}
                          <Button
                            type="submit"
                            colorScheme="blue"
                            size="lg"
                            width="100%"
                            isLoading={isSubmitting}
                            loadingText="Submitting..."
                            leftIcon={<FaUpload />}
                          >
                            Submit Issue Report
                          </Button>
                        </VStack>
                      </CardBody>
                    </Card>
                  </VStack>
                </GridItem>
              </Grid>
            </form>
          ) : !loadingBookings && activeBookings.length === 0 ? (
            <Card bg={cardBg} borderWidth="1px" borderColor="red.200">
              <CardBody>
                <VStack spacing={4} py={8}>
                  <Icon as={FaExclamationTriangle} boxSize={12} color="red.500" />
                  <Heading size="lg" color="red.700">No Active Booking Required</Heading>
                  <Text textAlign="center" color="red.600" maxW="md">
                    You need to have an active room booking to submit maintenance issues. 
                    This ensures we can provide proper assistance and respond to your specific room.
                  </Text>
                  <VStack spacing={2} mt={4}>
                    <Button 
                      colorScheme="blue" 
                      size="lg"
                      onClick={() => navigate('/tenant/rooms')}
                    >
                      Browse Available Rooms
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate('/tenant/bookings')}
                    >
                      View My Bookings
                    </Button>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          ) : null}
        </VStack>
      </Container>
    </TenantLayout>
  );
};

export default ReportIssuePage;
