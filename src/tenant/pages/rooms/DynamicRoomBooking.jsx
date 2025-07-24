import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Grid,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  Alert,
  AlertIcon,
  Spinner,
  Badge,
  Divider,
  Input,
  FormControl,
  FormLabel,
  SimpleGrid,
  useToast,
  Center
} from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { useTenantAuth } from '../../context/tenantAuthContext';
import bookingService from '../../services/bookingService';
import roomService from '../../services/roomService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import TenantLayout from '../../components/layout/TenantLayout';
import DocumentVerificationGuard from '../../components/verification/DocumentVerificationGuard';

const DynamicRoomBooking = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { tenant } = useTenantAuth();
  const toast = useToast();
  
  // States
  const [room, setRoom] = useState(null);
  const [dynamicRates, setDynamicRates] = useState({ daily: 0, monthly: 0 });
  const [selectedRentalType, setSelectedRentalType] = useState(2); // Default to monthly
  const [selectedMonths, setSelectedMonths] = useState(1); // Number of months for monthly rental
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [costCalculation, setCostCalculation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [availability, setAvailability] = useState(null);
  const [genderMismatch, setGenderMismatch] = useState(false);
  const [activeBookingInfo, setActiveBookingInfo] = useState(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [roomId, tenant?.tenantId]);

  // Auto-calculate cost when dates or rental type changes
  useEffect(() => {
    if (checkInDate && checkOutDate && selectedRentalType && tenant?.tenantId) {
      calculateBookingCost();
    }
  }, [checkInDate, checkOutDate, selectedRentalType, tenant?.tenantId]);

  // Auto-adjust check-out date when rental type or months change
  useEffect(() => {
    if (checkInDate && selectedRentalType) {
      const checkIn = new Date(checkInDate);
      
      if (selectedRentalType === 2) {
        // Monthly rental - set check-out based on selected months
        checkIn.setMonth(checkIn.getMonth() + selectedMonths);
        setCheckOutDate(checkIn.toISOString().split('T')[0]);
      } else if (selectedRentalType === 1) {
        // Daily rental - if current check-out is too far, adjust to a week
        const currentCheckOut = new Date(checkOutDate);
        const daysDiff = Math.ceil((currentCheckOut - checkIn) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 30) {
          // If more than 30 days, reduce to 7 days for daily rental
          checkIn.setDate(checkIn.getDate() + 7);
          setCheckOutDate(checkIn.toISOString().split('T')[0]);
        }
      }
    }
  }, [selectedRentalType, selectedMonths, checkInDate]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load room details
      const roomData = await roomService.getRoom(roomId);
      setRoom(roomData.room);

      // Set default rental type based on room classification
      if (roomData.room.classification?.name === 'ruang_rapat') {
        setSelectedRentalType(1); // Force daily for meeting rooms
      }

      // Check gender compatibility
      if (tenant && roomData.room) {
        const roomGender = roomData.room.classification?.name;
        const tenantGender = tenant.gender;
        
        // Check if tenant gender matches room gender
        if (roomGender === 'perempuan' && tenantGender !== 'P') {
          setGenderMismatch(true);
          setError('This room is for female tenants only');
        } else if (roomGender === 'laki_laki' && tenantGender !== 'L') {
          setGenderMismatch(true);
          setError('This room is for male tenants only');
        }
        // VIP and ruang_rapat rooms can be booked by any gender
      }

      // Load dynamic rates for this tenant type
      if (tenant?.tenantId && !genderMismatch) {
        await loadDynamicRates(roomData.room);
        
        // Check for any existing active booking
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

      // Set default dates
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      setCheckInDate(today.toISOString().split('T')[0]);
      setCheckOutDate(nextMonth.toISOString().split('T')[0]);

    } catch (err) {
      setError('Failed to load room information');
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDynamicRates = async (roomData) => {
    try {
      console.log('Loading dynamic rates for tenant:', tenant.tenantId, 'room:', roomId);
      
      // Get daily rate
      const dailyRateResponse = await bookingService.getDynamicRate(
        tenant.tenantId,
        roomId,
        1 // Daily rental type
      );
      
      console.log('Daily rate response:', dailyRateResponse);
      
      // Get monthly rate (only if not ruang_rapat)
      let monthlyRate = 0;
      if (roomData?.classification?.name !== 'ruang_rapat') {
        const monthlyRateResponse = await bookingService.getDynamicRate(
          tenant.tenantId,
          roomId,
          2 // Monthly rental type
        );
        console.log('Monthly rate response:', monthlyRateResponse);
        monthlyRate = monthlyRateResponse?.rate || 0;
      }

      setDynamicRates({
        daily: dailyRateResponse?.rate || 0,
        monthly: monthlyRate
      });

    } catch (err) {
      console.error('Error loading dynamic rates:', err);
      setError('Failed to load pricing information');
    }
  };

  const calculateBookingCost = async () => {
    if (!tenant?.tenantId || !roomId || !selectedRentalType) return;

    try {
      setCalculating(true);
      setError('');

      console.log('Calculating cost with params:', {
        tenantId: tenant.tenantId,
        roomId: roomId,
        rentalTypeId: selectedRentalType,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate
      });

      // Check for any existing active booking by this tenant first
      const activeBookingCheck = await bookingService.checkTenantActiveBooking(tenant.tenantId);

      if (activeBookingCheck.hasActiveBooking) {
        const checkOutDate = new Date(activeBookingCheck.checkOutDate);
        const formattedDate = checkOutDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        setError(`You have an active booking in ${activeBookingCheck.roomName || 'another room'} that must be completed first. You can make a new booking after your current booking ends on ${formattedDate}.`);
        setAvailability({ available: false, reason: 'Active booking exists' });
        setCostCalculation(null);
        return;
      }

      // Check availability
      const availabilityData = await bookingService.checkRoomAvailability(
        roomId, 
        checkInDate, 
        checkOutDate
      );
      setAvailability(availabilityData);

      // Calculate cost
      const costData = await bookingService.calculateBookingCost(
        tenant.tenantId,
        roomId,
        selectedRentalType,
        checkInDate,
        checkOutDate
      );
      
      console.log('Cost calculation response:', costData);
      
      // Handle different response structures
      const breakdown = costData.breakdown || costData;
      setCostCalculation(breakdown);

    } catch (err) {
      setError(err.message || 'Failed to calculate booking cost');
      console.error('Error calculating cost:', err);
    } finally {
      setCalculating(false);
    }
  };

  const handleBooking = async () => {
    if (!costCalculation || !availability?.available) return;

    try {
      setBooking(true);
      setError('');

      // Final check for any existing active booking before creating new booking
      const activeBookingCheck = await bookingService.checkTenantActiveBooking(tenant.tenantId);

      if (activeBookingCheck.hasActiveBooking) {
        const checkOutDate = new Date(activeBookingCheck.checkOutDate);
        const formattedDate = checkOutDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        const errorMessage = `You have an active booking in ${activeBookingCheck.roomName || 'another room'} that must be completed first. You can make a new booking after your current booking ends on ${formattedDate}.`;
        setError(errorMessage);
        toast({
          title: 'Booking Not Allowed',
          description: errorMessage,
          status: 'warning',
          duration: 8000,
          isClosable: true,
        });
        return;
      }

      const bookingData = {
        tenantId: tenant.tenantId,
        roomId: parseInt(roomId),
        rentalTypeId: selectedRentalType,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        totalAmount: costCalculation.total_amount || costCalculation.subtotal
      };

      const response = await bookingService.createBooking(bookingData);
      
      if (response.booking) {
        // Navigate to booking confirmation page
        navigate(`/tenant/bookings/${response.booking.bookingId}`, {
          state: { 
            newBooking: true,
            costCalculation: costCalculation
          }
        });
      }

    } catch (err) {
      setError(err.message || 'Failed to create booking');
      console.error('Error creating booking:', err);
      toast({
        title: 'Booking Failed',
        description: err.message || 'Failed to create booking',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setBooking(false);
    }
  };

  const getRentalTypeLabel = (typeId) => {
    return typeId === 1 ? 'Daily' : 'Monthly';
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMinCheckOutDate = () => {
    if (!checkInDate) return getMinDate();
    const checkIn = new Date(checkInDate);
    
    // For monthly rentals, set minimum check-out to next month
    if (selectedRentalType === 2) {
      checkIn.setMonth(checkIn.getMonth() + 1);
    } else {
      // For daily rentals, set minimum to next day
      checkIn.setDate(checkIn.getDate() + 1);
    }
    
    return checkIn.toISOString().split('T')[0];
  };

  // Helper function to calculate duration display
  const getDurationDisplay = () => {
    if (!checkInDate || !checkOutDate) return '';
    
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    if (selectedRentalType === 2) {
      // Monthly calculation
      const months = (checkOut.getFullYear() - checkIn.getFullYear()) * 12 + 
                    (checkOut.getMonth() - checkIn.getMonth());
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      // Daily calculation
      const diffTime = Math.abs(checkOut - checkIn);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
  };

  // Helper function to get classification display name
  const getClassificationDisplayName = (classificationName) => {
    const classificationMap = {
      'perempuan': 'Female Room',
      'laki_laki': 'Male Room', 
      'VIP': 'VIP Room',
      'ruang_rapat': 'Meeting Room'
    };
    return classificationMap[classificationName] || classificationName;
  };

  if (loading) {
    return (
      <TenantLayout>
        <Container maxW="4xl" py={8}>
          <Center>
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" />
              <Text>Loading room details...</Text>
            </VStack>
          </Center>
        </Container>
      </TenantLayout>
    );
  }

  if (!room) {
    return (
      <TenantLayout>
        <Container maxW="4xl" py={8}>
          <Alert status="error">
            <AlertIcon />
            Room not found
          </Alert>
        </Container>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <DocumentVerificationGuard>
        <Container maxW="6xl" py={8}>
          <VStack spacing={8} align="stretch">
            {/* Header */}
            <Box>
              <Button
                leftIcon={<ChevronLeftIcon />}
                variant="ghost"
                colorScheme="blue"
                onClick={() => navigate(-1)}
                mb={4}
              >
                Back to Room Details
              </Button>
              <Heading size="xl" color="gray.900" mb={2}>Book Room</Heading>
              <Text color="gray.600">Complete your booking for {room.name}</Text>
            </Box>

        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={8}>
          {/* Room Info Card */}
          <Card>
            <CardHeader>
              <Heading size="md">Room Information</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Heading size="sm" mb={1}>{room.name}</Heading>
                  <Text color="gray.600" fontSize="sm">{room.description}</Text>
                </Box>
                
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm">Classification:</Text>
                    <Text color="gray.600" fontSize="sm" textTransform="capitalize">
                      {getClassificationDisplayName(room.classification?.name)}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm">Capacity:</Text>
                    <Text color="gray.600" fontSize="sm">{room.capacity} people</Text>
                  </Box>
                </SimpleGrid>

                {/* Dynamic Rates Display */}
                <Box mt={6}>
                  <Heading size="sm" mb={3}>Your Pricing:</Heading>
                  
                  {/* Debug Information */}
                  {process.env.NODE_ENV === 'development' && (
                    <Box mb={3} p={2} bg="yellow.50" borderRadius="md" fontSize="xs" color="gray.600">
                      <Text>Debug: Tenant Type: {tenant?.tenantType?.name || 'N/A'}</Text>
                      <Text>Debug: Tenant Gender: {tenant?.gender || 'N/A'}</Text>
                      <Text>Debug: Room Classification: {room.classification?.name || 'N/A'}</Text>
                      <Text>Debug: Dynamic Rates: Daily={dynamicRates.daily || 0}, Monthly={dynamicRates.monthly || 0}</Text>
                    </Box>
                  )}
                  
                  {genderMismatch ? (
                    <Alert status="error">
                      <AlertIcon />
                      <Text fontSize="sm">
                        This room is not available for your gender classification.
                      </Text>
                    </Alert>
                  ) : (
                    <VStack spacing={3} align="stretch">
                      {/* Daily Rate */}
                      <Box 
                        p={4} 
                        borderRadius="md" 
                        border="2px" 
                        borderColor={selectedRentalType === 1 ? "blue.500" : "gray.200"}
                        bg={selectedRentalType === 1 ? "blue.50" : "white"}
                      >
                        <HStack justify="space-between">
                          <Text fontWeight="semibold">Daily Rate</Text>
                          <Text fontSize="lg" fontWeight="bold" color="green.600">
                            {dynamicRates.daily ? formatCurrency(dynamicRates.daily) : 'Loading...'}
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color="gray.500">
                          {tenant?.tenantType?.name === 'mahasiswa' ? 'Student' : 'Non-Student'} - {getClassificationDisplayName(room.classification?.name)}
                          {room.classification?.name === 'ruang_rapat' ? '' : ' (per person)'}
                        </Text>
                      </Box>

                      {/* Monthly Rate - Only if not ruang_rapat */}
                      {room.classification?.name !== 'ruang_rapat' && (
                        <Box 
                          p={4} 
                          borderRadius="md" 
                          border="2px" 
                          borderColor={selectedRentalType === 2 ? "blue.500" : "gray.200"}
                          bg={selectedRentalType === 2 ? "blue.50" : "white"}
                        >
                          <HStack justify="space-between">
                            <Text fontWeight="semibold">Monthly Rate</Text>
                            <Text fontSize="lg" fontWeight="bold" color="green.600">
                              {dynamicRates.monthly ? formatCurrency(dynamicRates.monthly) : 'Loading...'}
                            </Text>
                          </HStack>
                          <Text fontSize="xs" color="gray.500">
                            {tenant?.tenantType?.name === 'mahasiswa' ? 'Student' : 'Non-Student'} - {getClassificationDisplayName(room.classification?.name)}
                            {' (per person)'}
                          </Text>
                        </Box>
                      )}

                      {/* Note for ruang_rapat */}
                      {room.classification?.name === 'ruang_rapat' && (
                        <Alert status="warning">
                          <AlertIcon />
                          <Text fontSize="sm">
                            Meeting rooms are only available for daily rental.
                          </Text>
                        </Alert>
                      )}
                    </VStack>
                  )}
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Booking Form Card */}
          <Card>
            <CardHeader>
              <Heading size="md">Booking Details</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                {/* Rental Type Selection */}
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold">Rental Period</FormLabel>
                  <SimpleGrid columns={2} spacing={2}>
                    <Button
                      onClick={() => setSelectedRentalType(1)}
                      isDisabled={genderMismatch}
                      variant={selectedRentalType === 1 ? "solid" : "outline"}
                      colorScheme={selectedRentalType === 1 ? "blue" : "gray"}
                      size="md"
                    >
                      Daily
                    </Button>
                    <Button
                      onClick={() => setSelectedRentalType(2)}
                      isDisabled={genderMismatch || room.classification?.name === 'ruang_rapat'}
                      variant={selectedRentalType === 2 ? "solid" : "outline"}
                      colorScheme={selectedRentalType === 2 ? "blue" : "gray"}
                      size="md"
                    >
                      <VStack spacing={0}>
                        <Text>Monthly</Text>
                        {room.classification?.name === 'ruang_rapat' && (
                          <Text fontSize="xs" color="gray.500">Not available</Text>
                        )}
                      </VStack>
                    </Button>
                  </SimpleGrid>
                </FormControl>

                {/* Month Selection for Monthly Rental */}
                {selectedRentalType === 2 && (
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">Number of Months</FormLabel>
                    <SimpleGrid columns={6} spacing={2}>
                      {[1, 2, 3, 4, 5, 6].map((month) => (
                        <Button
                          key={month}
                          onClick={() => setSelectedMonths(month)}
                          variant={selectedMonths === month ? "solid" : "outline"}
                          colorScheme={selectedMonths === month ? "blue" : "gray"}
                          size="sm"
                        >
                          {month}
                        </Button>
                      ))}
                    </SimpleGrid>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Check-out date will be automatically calculated
                    </Text>
                  </FormControl>
                )}

                {/* Date Selection */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">Check-in Date</FormLabel>
                    <Input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      min={getMinDate()}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">Check-out Date</FormLabel>
                    <Input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      min={getMinCheckOutDate()}
                    />
                  </FormControl>
                </SimpleGrid>

                {/* Availability Status */}
                {availability && (
                  <Alert status={availability.available ? "success" : "error"}>
                    <AlertIcon />
                    <Text fontWeight="semibold">
                      {availability.available 
                        ? `Available (${availability.available_capacity}/${room.capacity} slots)`
                        : 'Not Available'
                      }
                    </Text>
                  </Alert>
                )}

                {/* Cost Calculation */}
                {calculating && (
                  <Center py={4}>
                    <VStack spacing={2}>
                      <Spinner color="blue.500" />
                      <Text fontSize="sm">Calculating cost...</Text>
                    </VStack>
                  </Center>
                )}

                {costCalculation && !calculating && (
                  <Box bg="gray.50" p={4} borderRadius="md">
                    <Heading size="sm" color="gray.900" mb={3}>Booking Summary</Heading>
                    <VStack spacing={2} align="stretch">
                      <HStack justify="space-between">
                        <Text fontSize="sm">Period:</Text>
                        <Text fontSize="sm">{formatDate(checkInDate)} - {formatDate(checkOutDate)}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Duration:</Text>
                        <Text fontSize="sm">
                          {costCalculation.total_days ? `${costCalculation.total_days} day${costCalculation.total_days > 1 ? 's' : ''}` :
                           costCalculation.total_months ? `${costCalculation.total_months} month${costCalculation.total_months > 1 ? 's' : ''}` :
                           getDurationDisplay()}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">
                          Rate per {selectedRentalType === 1 ? 'day' : 'month'}:
                        </Text>
                        <Text fontSize="sm">
                          {formatCurrency(
                            selectedRentalType === 1 ? 
                            (costCalculation.daily_rate || dynamicRates.daily) : 
                            (costCalculation.monthly_rate || dynamicRates.monthly)
                          )}
                        </Text>
                      </HStack>
                      {costCalculation.subtotal && costCalculation.subtotal !== costCalculation.total_amount && (
                        <HStack justify="space-between">
                          <Text fontSize="sm">Subtotal:</Text>
                          <Text fontSize="sm">{formatCurrency(costCalculation.subtotal)}</Text>
                        </HStack>
                      )}
                      <Divider />
                      <HStack justify="space-between">
                        <Text fontWeight="bold" fontSize="lg">Total Amount:</Text>
                        <Text fontWeight="bold" fontSize="lg" color="green.600">
                          {formatCurrency(costCalculation.total_amount || costCalculation.subtotal)}
                        </Text>
                      </HStack>
                      {costCalculation.calculation_method && (
                        <Text fontSize="xs" color="gray.500" textAlign="center">
                          Calculated using {costCalculation.calculation_method} rate
                        </Text>
                      )}
                    </VStack>
                  </Box>
                )}

                {/* Active Booking Warning */}
                {activeBookingInfo && (
                  <Alert status="warning" variant="left-accent" bg="orange.50" borderColor="orange.200">
                    <AlertIcon color="orange.500" />
                    <VStack align="start" spacing={2} flex={1}>
                      <Text fontWeight="semibold" color="orange.800">
                        You have an active booking that must be completed first
                      </Text>
                      <Text fontSize="sm" color="orange.700">
                        Room: {activeBookingInfo.roomName || 'Unknown Room'} | 
                        Check-out: {new Date(activeBookingInfo.checkOutDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                      <Button
                        size="sm"
                        colorScheme="orange"
                        variant="outline"
                        onClick={() => navigate('/tenant/bookings')}
                        mt={2}
                      >
                        View My Bookings
                      </Button>
                    </VStack>
                  </Alert>
                )}

                {/* Error Message */}
                {error && !activeBookingInfo && (
                  <Alert status="error">
                    <AlertIcon />
                    {error}
                  </Alert>
                )}

                {/* Booking Button */}
                <Button
                  onClick={handleBooking}
                  isLoading={booking}
                  loadingText="Creating Booking..."
                  isDisabled={
                    booking || 
                    calculating || 
                    genderMismatch ||
                    activeBookingInfo ||
                    !costCalculation || 
                    !availability?.available || 
                    !checkInDate || 
                    !checkOutDate
                  }
                  colorScheme="blue"
                  size="lg"
                  w="full"
                >
                  {activeBookingInfo
                    ? 'Complete Current Booking First'
                    : genderMismatch 
                    ? 'Room Not Available for Your Gender' 
                    : 'Book Now'
                  }
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </Grid>
      </VStack>
    </Container>
      </DocumentVerificationGuard>
    </TenantLayout>
  );
};

export default DynamicRoomBooking;
