import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Button, Container, Heading, Text, VStack, HStack, Divider,
  FormControl, FormLabel, FormErrorMessage, SimpleGrid,
  Image, Badge, Card, CardBody, CardHeader, CardFooter,
  Spinner, Alert, AlertIcon, AlertTitle, AlertDescription,
  useSteps, Step, StepIcon, StepIndicator, StepNumber, StepStatus,
  StepTitle, StepDescription, Stepper, Flex, useToast,
  Input, Icon, Radio, RadioGroup, Stack, Select, Grid
} from '@chakra-ui/react';
import { 
  FaInfo, FaCalendarAlt, FaFileInvoice, FaCheck, FaBed, FaWifi, 
  FaSnowflake, FaTv, FaBath, FaCoffee, FaParking, FaDumbbell,
  FaSwimmingPool, FaUtensils, FaTshirt, FaHome, FaCouch, FaLightbulb,
  FaMoneyBillWave, FaClock, FaMapMarkerAlt, FaUsers, FaTag
} from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import DocumentVerificationGuard from '../../components/verification/DocumentVerificationGuard';
import { useTenantAuth } from '../../context/tenantAuthContext';
import roomService from '../../services/roomService';
import bookingService from '../../services/bookingService';
import { isRoomAvailable, validateDateSelectionByRentalType } from '../../utils/roomUtils';
import tenantAuthService from '../../services/tenantAuthService';

const steps = [
  { title: 'Room Details', description: 'Check room information', icon: FaInfo },
  { title: 'Select Dates', description: 'Choose your stay period', icon: FaCalendarAlt },
  { title: 'Review & Pay', description: 'Confirm your booking', icon: FaFileInvoice },
  { title: 'Confirmation', description: 'Booking complete', icon: FaCheck }
];

const BookRoom = () => {
  // Function to get appropriate icon for amenities
  const getAmenityIcon = (amenityName) => {
    const name = amenityName?.toLowerCase() || '';
    
    if (name.includes('bed') || name.includes('kasur') || name.includes('tempat tidur')) return FaBed;
    if (name.includes('wifi') || name.includes('internet')) return FaWifi;
    if (name.includes('ac') || name.includes('air') || name.includes('conditioning')) return FaSnowflake;
    if (name.includes('tv') || name.includes('television')) return FaTv;
    if (name.includes('bath') || name.includes('kamar mandi') || name.includes('shower')) return FaBath;
    if (name.includes('coffee') || name.includes('kopi') || name.includes('kitchen')) return FaCoffee;
    if (name.includes('parking') || name.includes('parkir')) return FaParking;
    if (name.includes('gym') || name.includes('fitness')) return FaDumbbell;
    if (name.includes('pool') || name.includes('kolam')) return FaSwimmingPool;
    if (name.includes('dining') || name.includes('makan') || name.includes('restaurant')) return FaUtensils;
    if (name.includes('laundry') || name.includes('cuci')) return FaTshirt;
    if (name.includes('living') || name.includes('ruang') || name.includes('room')) return FaCouch;
    if (name.includes('lamp') || name.includes('light') || name.includes('lampu')) return FaLightbulb;
    
    // Default icon
    return FaHome;
  };

  const { roomId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { tenant } = useTenantAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomAvailability, setRoomAvailability] = useState([]);  const [bookingDates, setBookingDates] = useState({
    startDate: '',
    endDate: ''
  });
    // Add state for monthly rental logic
  const [monthsToRent, setMonthsToRent] = useState(1); // Default to 1 month
  const [selectedRentalType, setSelectedRentalType] = useState(null); // Store rental type object
  const [availableRentalTypes, setAvailableRentalTypes] = useState([]);
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });
  // State untuk existing bookings
  const [existingBookings, setExistingBookings] = useState([]);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [activeBookingInfo, setActiveBookingInfo] = useState(null);
  // Fetch room details when component loads
  useEffect(() => {
    const fetchRoomDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch room details
        const roomResponse = await roomService.getRoom(roomId);
        setRoom(roomResponse.room);
        
        // Check for any existing active booking by this tenant
        if (tenant?.tenantId) {
          try {
            const activeBookingCheck = await bookingService.checkTenantActiveBooking(tenant.tenantId);
            if (activeBookingCheck.hasActiveBooking) {
              setActiveBookingInfo(activeBookingCheck);
              const checkOutDate = new Date(activeBookingCheck.checkOutDate);
              const formattedDate = checkOutDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
              setError(`You have an active booking in ${activeBookingCheck.roomName || 'another room'} until ${formattedDate}. Complete your current booking before making a new one.`);
            }
          } catch (bookingCheckErr) {
            console.warn('Could not check for active bookings:', bookingCheckErr);
          }
        }
          // Fetch available rental types
        try {
          const rentalTypesResponse = await roomService.getRentalTypes();
          setAvailableRentalTypes(rentalTypesResponse.rentalTypes || []);
          
          // Set default rental type based on room's rental type
          if (roomResponse.room && rentalTypesResponse.rentalTypes) {
            const roomRentalTypeId = roomResponse.room.rentalType?.rentalTypeId || roomResponse.room.rental_type_id;
            
            // Find matching rental type from available types
            const matchingRentalType = rentalTypesResponse.rentalTypes.find(rt => 
              rt.rentalTypeId === roomRentalTypeId
            );
            
            if (matchingRentalType) {
              setSelectedRentalType(matchingRentalType);
            } else {
              // Default to first available rental type
              setSelectedRentalType(rentalTypesResponse.rentalTypes[0]);
            }
          }
        } catch (err) {
          console.warn('Could not fetch rental types:', err);
          // Set default rental types based on database structure
          const defaultRentalTypes = [
            { rentalTypeId: 1, name: 'harian' },
            { rentalTypeId: 2, name: 'bulanan' }
          ];
          setAvailableRentalTypes(defaultRentalTypes);
          setSelectedRentalType(defaultRentalTypes[0]);
        }
        
        // Get query parameters for dates if available
        const params = new URLSearchParams(window.location.search);
        const startParam = params.get('startDate');
        const endParam = params.get('endDate');
        
        if (startParam && endParam) {
          setBookingDates({
            startDate: startParam,
            endDate: endParam
          });
          
          // Calculate price based on dates
          if (roomResponse.room) {
            calculateTotalPrice(
              roomResponse.room, 
              new Date(startParam), 
              new Date(endParam)
            );
          }
          
          // Fetch room availability for the date range
          const availabilityResponse = await roomService.getRoomAvailability(
            roomId,
            startParam,
            endParam
          );
          
          setRoomAvailability(availabilityResponse.availability || []);
        }
      } catch (err) {
        console.error("Error fetching room details:", err);
        setError(err.message || "Failed to load room details");
        
        toast({
          title: "Error",
          description: err.message || "Failed to load room details",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoomDetails();
  }, [roomId, toast]);  // Calculate amount when dates, rental type, or months change
  useEffect(() => {
    if (room && bookingDates.startDate && bookingDates.endDate) {
      calculateAmount();
    }
  }, [room, bookingDates, selectedRentalType, monthsToRent]);

  const calculateTotalPrice = (room, startDate, endDate) => {
    if (!room || !startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calculate number of days
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    // For monthly rentals, convert to months (assuming 30 days per month for simplicity)
    const isMonthly = room.rental_type?.name === 'bulanan';
    const multiplier = isMonthly ? Math.ceil(daysDiff / 30) : daysDiff;
    
    return room.rate * multiplier;
  };  const calculateAmount = () => {
    if (!room || !bookingDates.startDate || !bookingDates.endDate || !selectedRentalType) return;
    
    const startDate = new Date(bookingDates.startDate);
    const endDate = new Date(bookingDates.endDate);
    
    // Calculate the amount based on rental type
    let amount = 0;
    let duration = 0;
    
    // Check if it's daily (harian) or monthly (bulanan) based on rental type ID
    const isDaily = selectedRentalType.rentalTypeId === 1 || 
                   selectedRentalType.name.toLowerCase().includes('harian') ||
                   selectedRentalType.name.toLowerCase().includes('daily');
    
    if (isDaily) {
      // Calculate days difference
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      duration = diffDays;
      amount = room.rate * diffDays;
    } else {
      // For monthly rentals, use the monthsToRent directly
      duration = monthsToRent;
      amount = room.rate * monthsToRent;
    }
    
    console.log(`Rental type: ${selectedRentalType.name} (ID: ${selectedRentalType.rentalTypeId}), Duration: ${duration}, Amount: ${amount}`);
    setCalculatedAmount(amount);
  };const handleRentalTypeChange = (newRentalType) => {
    setSelectedRentalType(newRentalType);
    
    // Reset dates when changing rental type
    setBookingDates({
      startDate: '',
      endDate: ''
    });
    
    // Reset months to 1 for monthly rentals
    setMonthsToRent(1);
    
    setCalculatedAmount(0);
  };const handleDateChange = (name, date) => {
    setBookingDates(prev => {
      const newDates = {
        ...prev,
        [name]: date
      };
      
      // Auto-calculate end date for monthly rentals
      if (name === 'startDate' && selectedRentalType && date) {
        const isMonthly = selectedRentalType.rentalTypeId === 2 || 
                         selectedRentalType.name.toLowerCase().includes('bulanan') ||
                         selectedRentalType.name.toLowerCase().includes('monthly');
        
        if (isMonthly) {
          // Calculate end date based on start date + number of months
          const startDate = new Date(date);
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + monthsToRent);
          
          newDates.endDate = endDate.toISOString().split('T')[0];
        }
      }
      
      return newDates;
    });
  };

  // New function to handle months change for monthly rentals
  const handleMonthsChange = (months) => {
    setMonthsToRent(months);
    
    // Recalculate end date if start date is already set
    if (bookingDates.startDate && selectedRentalType) {
      const isMonthly = selectedRentalType.rentalTypeId === 2 || 
                       selectedRentalType.name.toLowerCase().includes('bulanan') ||
                       selectedRentalType.name.toLowerCase().includes('monthly');
      
      if (isMonthly) {
        const startDate = new Date(bookingDates.startDate);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + months);
        
        setBookingDates(prev => ({
          ...prev,
          endDate: endDate.toISOString().split('T')[0]
        }));
      }
    }
  };

  const isDateAvailable = (date) => {
    // If no availability data, assume available
    if (!roomAvailability || roomAvailability.length === 0) return true;
    
    const dateToCheck = new Date(date);
    const foundDate = roomAvailability.find(a => 
      new Date(a.date).toDateString() === dateToCheck.toDateString()
    );
    
    return foundDate ? foundDate.isAvailable : true;
  };
  const validateDates = () => {
    if (!bookingDates.startDate || !bookingDates.endDate) {
      return "Both start and end dates are required";
    }
    
    const startDate = new Date(bookingDates.startDate);
    const endDate = new Date(bookingDates.endDate);
    
    if (startDate >= endDate) {
      return "End date must be after start date";
    }
      // Special validation for monthly rentals
    if (selectedRentalType) {
      const isMonthly = selectedRentalType.rentalTypeId === 2 || 
                       selectedRentalType.name.toLowerCase().includes('bulanan') ||
                       selectedRentalType.name.toLowerCase().includes('monthly');
      
      if (isMonthly) {
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 30) {
          return "Monthly rental requires minimum 30 days duration";
        }
      }
    }
    
    // Check if the selected dates are available
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      if (!isDateAvailable(currentDate)) {
        return `The date ${currentDate.toLocaleDateString()} is not available`;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return null;
  };
  // Check existing bookings when dates change
  useEffect(() => {
    const checkConflicts = async () => {
      if (tenant?.tenantId && bookingDates.startDate && bookingDates.endDate) {
        try {
          const bookingsResponse = await bookingService.getTenantBookings(tenant.tenantId);
          const bookings = bookingsResponse.bookings || [];
          
          const startDate = new Date(bookingDates.startDate);
          const endDate = new Date(bookingDates.endDate);
          
          const conflictingBookings = bookings.filter(booking => {
            if (booking.status === 'cancelled' || booking.status === 'completed') {
              return false;
            }
            
            // Handle different field names for dates
            const bookingStart = new Date(booking.checkInDate || booking.check_in || booking.start_date);
            const bookingEnd = new Date(booking.checkOutDate || booking.check_out || booking.end_date);
            
            return (startDate < bookingEnd && endDate > bookingStart);
          });
          
          setExistingBookings(conflictingBookings);
          setShowConflictWarning(conflictingBookings.length > 0);
        } catch (error) {
          console.warn("Could not check existing bookings:", error);
          setShowConflictWarning(false);
        }
      } else {
        setShowConflictWarning(false);
      }
    };
    
    checkConflicts();
  }, [tenant?.tenantId, bookingDates.startDate, bookingDates.endDate]);

  // Check if tenant has existing active bookings that might conflict
  const checkExistingBookings = async () => {
    try {
      if (!tenant?.tenantId) return false;
      
      const bookingsResponse = await bookingService.getTenantBookings(tenant.tenantId);
      const existingBookingsList = bookingsResponse.bookings || [];
      
      // Check for overlapping bookings
      const startDate = new Date(bookingDates.startDate);
      const endDate = new Date(bookingDates.endDate);
      
      const hasConflict = existingBookingsList.some(booking => {
        // Skip cancelled or completed bookings
        if (booking.status === 'cancelled' || booking.status === 'completed') {
          return false;
        }
        
        // Handle different field names for dates
        const bookingStart = new Date(booking.checkInDate || booking.check_in || booking.start_date);
        const bookingEnd = new Date(booking.checkOutDate || booking.check_out || booking.end_date);
        
        // Check for date overlap
        return (startDate < bookingEnd && endDate > bookingStart);
      });
      
      return hasConflict;
    } catch (error) {
      console.warn("Could not check existing bookings:", error);
      return false; // Continue with booking attempt
    }
  };

  const handleNextStep = () => {
    if (activeStep === 1) {
      const dateError = validateDates();
      if (dateError) {
        toast({
          title: "Date Selection Error",
          description: dateError,
          status: "error",
          duration: 3000,
          isClosable: true
        });
        return;
      }
    }
    
    setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrevStep = () => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  const checkRoomAvailability = () => {
    if (!room || !bookingDates.startDate || !bookingDates.endDate) return false;
    
    const isAvailable = isRoomAvailable(
      room, 
      new Date(bookingDates.startDate), 
      new Date(bookingDates.endDate), 
      roomAvailability
    );
    
    if (!isAvailable) {
      setError("The room is not available for the selected dates.");
    }
    
    return isAvailable;
  };

  const handleSubmitBooking = async () => {
    if (!tenant) {
      toast({
        title: "Authentication Required",
        description: "Please login to book a room",
        status: "warning",
        duration: 3000,
        isClosable: true
      });
      navigate('/tenant/login');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Final validation
      const dateError = validateDates();
      if (dateError) {
        toast({
          title: "Validation Error",
          description: dateError,
          status: "error",
          duration: 5000,
          isClosable: true
        });
        return;
      }

      // Check for any active booking by this tenant first
      const activeBookingCheck = await bookingService.checkTenantActiveBooking(tenant.tenantId);

      if (activeBookingCheck.hasActiveBooking) {
        const checkOutDate = new Date(activeBookingCheck.checkOutDate);
        const formattedDate = checkOutDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        const errorMessage = `You have an active booking in ${activeBookingCheck.roomName || 'another room'} that must be completed first. You can make a new booking after your current booking ends on ${formattedDate}.`;
        
        toast({
          title: "Booking Not Allowed",
          description: errorMessage,
          status: "warning",
          duration: 8000,
          isClosable: true,
          action: (
            <Button 
              size="sm" 
              onClick={() => navigate('/tenant/bookings')}
              colorScheme="orange"
              variant="outline"
            >
              View My Bookings
            </Button>
          )
        });
        return;
      }

      // Check for existing bookings that might conflict
      const hasBookingConflict = await checkExistingBookings();
      if (hasBookingConflict) {
        toast({
          title: "Booking Conflict",
          description: "You already have an active booking that overlaps with these dates. Please check your existing bookings or choose different dates.",
          status: "warning",
          duration: 8000,
          isClosable: true,
          action: (
            <Button 
              size="sm" 
              onClick={() => navigate('/tenant/bookings')}
              colorScheme="orange"
              variant="outline"
            >
              View My Bookings
            </Button>
          )
        });
        return;
      }

      // Check room availability before submitting
      if (!checkRoomAvailability()) {
        toast({
          title: "Room Unavailable",
          description: "This room is not available for the selected dates.",
          status: "error",
          duration: 5000,
          isClosable: true
        });
        return;
      }

      const bookingData = {
        tenantId: tenant.tenantId,
        roomId: parseInt(roomId),
        checkInDate: new Date(bookingDates.startDate).toISOString(),
        checkOutDate: new Date(bookingDates.endDate).toISOString(),
        rentalTypeId: selectedRentalType.rentalTypeId,
        totalAmount: calculatedAmount
      };
      
      console.log("Submitting booking with data:", bookingData);
      
      const response = await bookingService.createBooking(bookingData);
      
      console.log("Booking response received:", response);
      
      // Check if booking was actually created
      if (response && (response.booking || response.bookingId || response.status)) {
        toast({
          title: "Booking Created Successfully",
          description: "Your room booking has been submitted and will be processed shortly",
          status: "success",
          duration: 3000,
          isClosable: true
        });
        
        setActiveStep(3); // Move to confirmation step
      } else {
        // If response doesn't contain expected data, show warning but still proceed
        console.warn("Unexpected response format:", response);
        toast({
          title: "Booking Submitted",
          description: "Your booking has been submitted. Please check your bookings page for status.",
          status: "info",
          duration: 5000,
          isClosable: true
        });
        
        setActiveStep(3);
      }
    } catch (err) {
      console.error("Error creating booking:", err);
      
      // Handle specific error cases with user-friendly messages
      let errorTitle = "Booking Failed";
      let errorMessage = "Could not complete your booking. Please try again later.";
      let errorStatus = "error";
      
      if (err.message) {
        const message = err.message.toLowerCase();
        
        if (message.includes("already has a booking") || message.includes("tenant already has a booking")) {
          errorTitle = "Booking Conflict";
          errorMessage = "You already have an active booking for this period. Please check your existing bookings or choose different dates.";
          errorStatus = "warning";
        } else if (message.includes("room not available") || message.includes("not available")) {
          errorTitle = "Room Unavailable";
          errorMessage = "This room is not available for the selected dates. Please choose different dates.";
          errorStatus = "warning";
        } else if (message.includes("authentication") || message.includes("unauthorized")) {
          errorTitle = "Authentication Required";
          errorMessage = "Please login again to continue.";
          errorStatus = "warning";
        } else {
          errorMessage = err.message;
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        status: errorStatus,
        duration: 8000,
        isClosable: true,
        action: errorTitle === "Booking Conflict" ? (
          <Button 
            size="sm" 
            onClick={() => navigate('/tenant/bookings')}
            colorScheme="orange"
            variant="outline"
          >
            View My Bookings
          </Button>
        ) : undefined
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <TenantLayout>
        <Container maxW="container.lg" py={8}>
          <Flex justify="center" align="center" height="300px">
            <Spinner size="xl" />
          </Flex>
        </Container>
      </TenantLayout>
    );
  }

  if (error && !room) {
    return (
      <TenantLayout>
        <Container maxW="container.lg" py={8}>
          <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" p={5}>
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">Room Not Found</AlertTitle>
            <AlertDescription maxWidth="sm">{error}</AlertDescription>
            <Button mt={4} onClick={() => navigate('/tenant/rooms')} colorScheme="brand">
              Browse Other Rooms
            </Button>
          </Alert>
        </Container>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <DocumentVerificationGuard>
        <Container maxW="container.lg" py={8}>
          <Stepper index={activeStep} mb={8}>
            {steps.map((step, index) => (
              <Step key={index}>
                <StepIndicator>
                  <StepStatus complete={<StepIcon />} incomplete={<StepNumber />} active={<StepNumber />} />
                </StepIndicator>
                <Box flexShrink='0'>
                  <StepTitle>{step.title}</StepTitle>
                  <StepDescription>{step.description}</StepDescription>
                </Box>
              </Step>
            ))}
          </Stepper>        {activeStep === 0 && room && (
          <Card>
            <CardHeader>
              <VStack align="start" spacing={3}>
                <Heading as="h2" size="lg" display="flex" alignItems="center">
                  <Icon as={FaHome} mr={3} color="brand.500" />
                  {room.name}
                </Heading>
                <HStack spacing={3}>
                  <Badge colorScheme="blue" variant="subtle" px={3} py={1}>
                    <Icon as={FaUsers} mr={1} />
                    {room.classification?.name || room.classification}
                  </Badge>
                  <Badge colorScheme="green" variant="subtle" px={3} py={1}>
                    <Icon as={FaTag} mr={1} />
                    {room.rentalType?.name || room.rentalType}
                  </Badge>
                </HStack>
              </VStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <Text fontSize="md" color="gray.600">{room.description}</Text>
                
                <Divider />
                
                <Box>
                  <Heading as="h3" size="md" mb={4} display="flex" alignItems="center">
                    <Icon as={FaMoneyBillWave} mr={2} color="green.500" />
                    Price
                  </Heading>
                  <Card variant="outline" bg="green.50" borderColor="green.200">
                    <CardBody>
                      <Text fontSize="2xl" fontWeight="bold" color="green.700" textAlign="center">
                        Rp {room.rate?.toLocaleString()}
                        <Text as="span" fontSize="lg" fontWeight="normal" color="green.600">
                          {' '}/ {room.rentalType === 'harian' || room.rental_type === 'harian' ? 'day' : 'month'}
                        </Text>
                      </Text>
                    </CardBody>
                  </Card>
                </Box>
                
                <Divider />
                
                <Box>
                  <Heading as="h3" size="md" mb={4} display="flex" alignItems="center">
                    <Icon as={FaCouch} mr={2} color="blue.500" />
                    Amenities
                  </Heading>
                  {room.amenities && room.amenities.length > 0 ? (
                    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                      {room.amenities.map((amenity, index) => {
                        const AmenityIcon = getAmenityIcon(amenity.feature?.name);
                        return (
                          <Card key={index} variant="outline" size="sm">
                            <CardBody>
                              <HStack spacing={3}>
                                <Icon as={AmenityIcon} color="brand.500" boxSize={5} />
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="semibold">
                                    {amenity.feature?.name || 'Amenity'}
                                  </Text>
                                  <Text fontSize="sm" color="gray.600">
                                    Quantity: {amenity.quantity}x
                                  </Text>
                                </VStack>
                              </HStack>
                            </CardBody>
                          </Card>
                        );
                      })}
                    </Grid>
                  ) : (
                    <Card variant="outline">
                      <CardBody textAlign="center" py={8}>
                        <Icon as={FaHome} boxSize={8} color="gray.400" mb={2} />
                        <Text color="gray.500">No amenities information available</Text>
                      </CardBody>
                    </Card>
                  )}
                </Box>
              </VStack>
            </CardBody>
            <CardFooter>
              <Button colorScheme="brand" size="lg" onClick={handleNextStep} width="full">
                <Icon as={FaCalendarAlt} mr={2} />
                Select Dates
              </Button>
            </CardFooter>
          </Card>
        )}

        {activeStep === 1 && (
          <Card>
            <CardHeader>
              <Heading as="h2" size="md">Select Your Stay Period</Heading>            </CardHeader>
            <CardBody>              {/* Rental Type Selection */}
              <FormControl mb={6}>
                <FormLabel>Rental Type</FormLabel>
                {availableRentalTypes.length > 1 ? (
                  <RadioGroup 
                    value={selectedRentalType?.rentalTypeId?.toString()} 
                    onChange={(value) => {
                      const selectedType = availableRentalTypes.find(rt => 
                        rt.rentalTypeId.toString() === value
                      );
                      handleRentalTypeChange(selectedType);
                    }}
                  >
                    <Stack direction="row" spacing={4}>
                      {availableRentalTypes.map((rentalType) => (
                        <Radio key={rentalType.rentalTypeId} value={rentalType.rentalTypeId.toString()}>
                          {rentalType.name === 'harian' ? 'Harian (Per Hari)' : 
                           rentalType.name === 'bulanan' ? 'Bulanan (Per Bulan)' : 
                           rentalType.name}
                        </Radio>
                      ))}
                    </Stack>
                  </RadioGroup>
                ) : (
                  <Text fontWeight="bold">
                    {selectedRentalType?.name === 'harian' ? 'Harian (Per Hari)' : 
                     selectedRentalType?.name === 'bulanan' ? 'Bulanan (Per Bulan)' : 
                     selectedRentalType?.name || 'Loading...'}
                  </Text>
                )}
                <Text fontSize="sm" color="gray.600" mt={2}>
                  {selectedRentalType?.name === 'harian' 
                    ? 'Cocok untuk tinggal sementara (beberapa hari)' 
                    : selectedRentalType?.name === 'bulanan'
                    ? 'Cocok untuk tinggal jangka panjang (minimal 1 bulan)'
                    : 'Pilih jenis sewa yang sesuai dengan kebutuhan Anda'}
                </Text>
              </FormControl>              {/* Date Selection - Different for Monthly vs Daily */}
              {selectedRentalType?.name === 'bulanan' ? (
                // Monthly Rental Interface
                <VStack spacing={6} align="stretch">
                  <FormControl isRequired>
                    <FormLabel>Start Date*</FormLabel>
                    <Input
                      type="date"
                      name="startDate"
                      value={bookingDates.startDate}
                      onChange={(e) => handleDateChange('startDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      Tanggal mulai sewa (tanggal masuk ke kamar)
                    </Text>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Number of Months*</FormLabel>
                    <Select
                      value={monthsToRent}
                      onChange={(e) => handleMonthsChange(parseInt(e.target.value))}
                      placeholder="Select duration"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <option key={month} value={month}>
                          {month} {month === 1 ? 'Month' : 'Months'} 
                          {room?.rate && ` - ${new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0
                          }).format(room.rate * month)}`}
                        </option>
                      ))}
                    </Select>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      Berapa lama Anda ingin menyewa kamar ini?
                    </Text>
                  </FormControl>

                  <FormControl>
                    <FormLabel>End Date (Calculated)</FormLabel>
                    <Input
                      type="date"
                      name="endDate"
                      value={bookingDates.endDate}
                      readOnly
                      bg="gray.50"
                      cursor="not-allowed"
                    />
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      Tanggal berakhir sewa (otomatis dihitung: {monthsToRent} bulan dari tanggal mulai)
                    </Text>
                  </FormControl>

                  {/* Summary for Monthly Rental */}
                  {bookingDates.startDate && (
                    <Box p={4} bg="blue.50" borderRadius="md" borderLeft="4px solid" borderColor="blue.500">
                      <VStack align="start" spacing={2}>
                        <Text fontWeight="bold" color="blue.700">Rental Summary</Text>
                        <Text fontSize="sm">
                          <Text as="span" fontWeight="medium">Duration:</Text> {monthsToRent} {monthsToRent === 1 ? 'Month' : 'Months'}
                        </Text>
                        <Text fontSize="sm">
                          <Text as="span" fontWeight="medium">From:</Text> {new Date(bookingDates.startDate).toLocaleDateString('id-ID')}
                        </Text>
                        {bookingDates.endDate && (
                          <Text fontSize="sm">
                            <Text as="span" fontWeight="medium">Until:</Text> {new Date(bookingDates.endDate).toLocaleDateString('id-ID')}
                          </Text>
                        )}
                        <Text fontSize="sm" fontWeight="bold" color="blue.700">
                          Total: {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0
                          }).format(calculatedAmount)}
                        </Text>
                      </VStack>
                    </Box>
                  )}
                </VStack>
              ) : (
                // Daily Rental Interface (existing)
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <FormControl isRequired>
                    <FormLabel>Check-in Date*</FormLabel>
                    <Input
                      type="date"
                      name="startDate"
                      value={bookingDates.startDate}
                      onChange={(e) => handleDateChange('startDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      Tanggal check-in ke kamar
                    </Text>
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Check-out Date*</FormLabel>
                    <Input
                      type="date"
                      name="endDate"
                      value={bookingDates.endDate}
                      onChange={(e) => handleDateChange('endDate', e.target.value)}
                      min={bookingDates.startDate || new Date().toISOString().split('T')[0]}
                    />
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      Tanggal check-out dari kamar
                    </Text>
                  </FormControl>
                </SimpleGrid>
              )}
                {roomAvailability.length === 0 && (
                <Alert status="warning" mt={4}>
                  <AlertIcon />
                  Availability data couldn't be loaded. Some dates may not be available.
                </Alert>
              )}

              {showConflictWarning && existingBookings.length > 0 && (
                <Alert status="error" mt={4}>
                  <AlertIcon />
                  <VStack align="start" spacing={2} width="100%">
                    <Text fontWeight="bold">
                      You have conflicting bookings for these dates:
                    </Text>
                    {existingBookings.map((booking, index) => (
                      <Box key={index} fontSize="sm">
                        <Text>
                          <strong>Room:</strong> {booking.room?.name || `Room ${booking.roomId || booking.room_id}`}
                        </Text>
                        <Text>
                          <strong>Period:</strong> {new Date(booking.checkInDate || booking.check_in).toLocaleDateString()} - {new Date(booking.checkOutDate || booking.check_out).toLocaleDateString()}
                        </Text>
                        <Text>
                          <strong>Status:</strong> {booking.status}
                        </Text>
                      </Box>
                    ))}
                    <Button 
                      size="sm" 
                      colorScheme="red" 
                      variant="outline"
                      onClick={() => navigate('/tenant/bookings')}
                    >
                      View All My Bookings
                    </Button>
                  </VStack>
                </Alert>
              )}{calculatedAmount > 0 && (
                <Box mt={6} p={4} borderWidth={1} borderRadius="md">
                  <Heading as="h3" size="md" mb={2}>Price Summary</Heading>
                  <VStack align="stretch" spacing={2}>                    <HStack justify="space-between">
                      <Text>Rental Type:</Text>
                      <Text fontWeight="bold">
                        {selectedRentalType?.name === 'harian' ? 'Harian' : 
                         selectedRentalType?.name === 'bulanan' ? 'Bulanan' : 
                         selectedRentalType?.name}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Rate:</Text>
                      <Text>
                        Rp {room.rate?.toLocaleString()} 
                        /{selectedRentalType?.name === 'harian' ? 'day' : 'month'}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Duration:</Text>
                      <Text>
                        {(() => {
                          if (!bookingDates.startDate || !bookingDates.endDate) return '-';
                          const startDate = new Date(bookingDates.startDate);
                          const endDate = new Date(bookingDates.endDate);
                          const diffTime = Math.abs(endDate - startDate);
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          
                          if (selectedRentalType?.name === 'harian') {
                            return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
                          } else {
                            const diffMonths = Math.max(1, Math.ceil(diffDays / 30));
                            return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
                          }
                        })()}
                      </Text>
                    </HStack>
                    <Divider />
                    <HStack justify="space-between">
                      <Text fontWeight="bold" fontSize="lg">Total:</Text>
                      <Text fontWeight="bold" fontSize="lg" color="brand.500">
                        Rp {calculatedAmount.toLocaleString()}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              )}
            </CardBody>
            <CardFooter>
              <HStack spacing={4}>
                <Button onClick={handlePrevStep}>Back</Button>                <Button 
                  colorScheme="brand" 
                  onClick={handleNextStep}
                  isDisabled={!bookingDates.startDate || !bookingDates.endDate || calculatedAmount <= 0 || showConflictWarning}
                >
                  {showConflictWarning ? 'Resolve Conflicts First' : 'Continue'}
                </Button>
              </HStack>
            </CardFooter>
          </Card>
        )}        {activeStep === 2 && (
          <Card>
            <CardHeader>
              <Heading as="h2" size="md" display="flex" alignItems="center">
                <Icon as={FaFileInvoice} mr={3} color="brand.500" />
                Review Booking
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                
                <Card variant="outline" bg="blue.50" borderColor="blue.200">
                  <CardHeader pb={2}>
                    <Heading as="h3" size="sm" display="flex" alignItems="center" color="blue.700">
                      <Icon as={FaHome} mr={2} />
                      Room Details
                    </Heading>
                  </CardHeader>
                  <CardBody pt={0}>
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="bold" fontSize="lg">{room.name}</Text>
                      <HStack>
                        <Badge colorScheme="blue" variant="subtle">
                          <Icon as={FaUsers} mr={1} />
                          {room.classification?.name || room.classification}
                        </Badge>
                        <Badge colorScheme="green" variant="subtle">
                          <Icon as={FaTag} mr={1} />
                          {selectedRentalType?.name === 'harian' ? 'Daily Rental' : 
                           selectedRentalType?.name === 'bulanan' ? 'Monthly Rental' : 
                           `${selectedRentalType?.name} Rental`}
                        </Badge>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
                
                <Card variant="outline" bg="orange.50" borderColor="orange.200">
                  <CardHeader pb={2}>
                    <Heading as="h3" size="sm" display="flex" alignItems="center" color="orange.700">
                      <Icon as={FaCalendarAlt} mr={2} />
                      Stay Period
                    </Heading>
                  </CardHeader>
                  <CardBody pt={0}>
                    <VStack align="start" spacing={2}>
                      <HStack>
                        <Icon as={FaMapMarkerAlt} color="green.500" />
                        <Text fontWeight="semibold">
                          {selectedRentalType?.name === 'harian' ? 'Check-in' : 'Start'}: 
                        </Text>
                        <Text>{new Date(bookingDates.startDate).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric'
                        })}</Text>
                      </HStack>
                      <HStack>
                        <Icon as={FaMapMarkerAlt} color="red.500" />
                        <Text fontWeight="semibold">
                          {selectedRentalType?.name === 'harian' ? 'Check-out' : 'End'}: 
                        </Text>
                        <Text>{new Date(bookingDates.endDate).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric'
                        })}</Text>
                      </HStack>
                      <HStack>
                        <Icon as={FaClock} color="blue.500" />
                        <Text fontWeight="semibold">Duration:</Text>
                        <Text>{(() => {
                          const startDate = new Date(bookingDates.startDate);
                          const endDate = new Date(bookingDates.endDate);
                          const diffTime = Math.abs(endDate - startDate);
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          
                          if (selectedRentalType?.name === 'harian') {
                            return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
                          } else {
                            const diffMonths = Math.max(1, Math.ceil(diffDays / 30));
                            return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
                          }
                        })()}</Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
                
                <Card variant="outline" bg="green.50" borderColor="green.200">
                  <CardHeader pb={2}>
                    <Heading as="h3" size="sm" display="flex" alignItems="center" color="green.700">
                      <Icon as={FaMoneyBillWave} mr={2} />
                      Payment Details
                    </Heading>
                  </CardHeader>
                  <CardBody pt={0}>
                    <HStack justify="space-between" align="center">
                      <Text fontSize="lg" fontWeight="semibold">Total Amount:</Text>
                      <Text fontWeight="bold" fontSize="2xl" color="green.600">
                        Rp {calculatedAmount.toLocaleString('id-ID')}
                      </Text>
                    </HStack>
                  </CardBody>
                </Card>

                {!tenant && (
                  <Alert status="warning" borderRadius="md">
                    <AlertIcon />
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold">Authentication Required</Text>
                      <Text>You need to be logged in to complete your booking.</Text>
                    </VStack>
                  </Alert>
                )}
              </VStack>
            </CardBody>
            <CardFooter>
              <HStack spacing={4} width="full">
                <Button onClick={handlePrevStep} variant="outline" size="lg" flex={1}>
                  <Icon as={FaCalendarAlt} mr={2} />
                  Back
                </Button>
                <Button 
                  colorScheme="brand" 
                  onClick={handleSubmitBooking}
                  isLoading={isSubmitting}
                  loadingText="Processing..."
                  isDisabled={!tenant || showConflictWarning || activeBookingInfo}
                  size="lg"
                  flex={2}
                >
                  <Icon as={FaCheck} mr={2} />
                  {activeBookingInfo ? 'Complete Current Booking First' : 
                   showConflictWarning ? 'Resolve Conflicts First' : 
                   'Complete Booking'}
                </Button>
              </HStack>
            </CardFooter>
          </Card>
        )}

        {activeStep === 3 && (
          <Card>
            <CardHeader>
              <Heading as="h2" size="md" textAlign="center" color="green.500">
                Booking Confirmed!
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={6}>
                <Box textAlign="center">
                  <Icon as={FaCheck} w={12} h={12} color="green.500" mb={4} />
                  <Text fontSize="lg">
                    Your booking has been successfully submitted.
                  </Text>
                  <Text mt={2}>
                    You will receive a confirmation email shortly with all the details.
                  </Text>
                </Box>
                
                <Box width="100%">
                  <Divider my={4} />
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box>
                      <Text fontWeight="bold">Room:</Text>
                      <Text>{room.name}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Stay Period:</Text>
                      <Text>
                        {new Date(bookingDates.startDate).toLocaleDateString()} to {new Date(bookingDates.endDate).toLocaleDateString()}
                      </Text>
                    </Box>
                  </SimpleGrid>
                  <Divider my={4} />
                  <Box>
                    <Text fontWeight="bold">Total Amount:</Text>
                    <Text fontSize="lg">Rp {calculatedAmount.toLocaleString()}</Text>
                  </Box>
                </Box>
              </VStack>
            </CardBody>
            <CardFooter>
              <HStack spacing={4} width="100%" justify="center">
                <Button onClick={() => navigate('/tenant/bookings')}>
                  View My Bookings
                </Button>
                <Button colorScheme="brand" onClick={() => navigate('/tenant/rooms')}>
                  Browse More Rooms
                </Button>
              </HStack>
            </CardFooter>
          </Card>
        )}
      </Container>
      </DocumentVerificationGuard>
    </TenantLayout>
  );
};

export default BookRoom;
