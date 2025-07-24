import React, { useState } from 'react';
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
  Text,
  Divider,
  useToast,
  Box,
  Checkbox,
  Alert,
  AlertIcon,
  Flex
} from '@chakra-ui/react';
import { FaCalendarAlt, FaMoneyBillWave } from 'react-icons/fa';
import { format } from 'date-fns';
import { formatCurrency } from '../../components/helpers/typeConverters';
import { useTenantAuth } from '../../context/tenantAuthContext';
import bookingService from '../../services/bookingService';

const BookingModal = ({ isOpen, onClose, room, startDate, endDate, totalPrice }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { tenant } = useTenantAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const isMonthly = room?.rentalType?.name === 'bulanan';
  
  // Format dates for display
  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'EEEE, d MMMM yyyy');
  };
  
  // Calculate duration of stay
  const calculateDuration = () => {
    if (!startDate || !endDate) return '0 days';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return isMonthly 
      ? `${Math.ceil(diffDays / 30)} month${Math.ceil(diffDays / 30) !== 1 ? 's' : ''}`
      : `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };
  
  // Handle booking creation
  const handleCreateBooking = async () => {
    if (!agreedToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions to continue.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get tenant ID from the auth context
      if (!tenant || !tenant.tenantId) {
        throw new Error("Unable to get tenant information. Please log in again.");
      }
      
      const bookingData = {
        tenantId: tenant.tenantId,
        roomId: room.roomId,
        checkInDate: startDate,
        checkOutDate: endDate,
        totalAmount: totalPrice,
      };
      
      console.log("Submitting booking data:", bookingData);
      
      const response = await bookingService.createBooking(bookingData);
      
      // Log the complete response for debugging
      console.log("Booking creation response:", response);
      
      // Check for success status first - some APIs return success status without the expected object structure
      if (response && response.status && response.status.status === 'success') {
        toast({
          title: "Booking Created!",
          description: "Your booking has been successfully created.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        
        // Navigate based on what we have in the response
        if (response.booking && response.booking.bookingId) {
          // If we have a valid booking ID, go to payment selection
          navigate(`/tenant/bookings/${response.booking.bookingId}/payment`);
        } else {
          // Otherwise go to the bookings list
          navigate(`/tenant/bookings`);
        }
        return;
      }
      
      // Fallback to the old way of checking for booking object
      if (!response || !response.booking) {
        toast({
          title: "Booking Status Unknown",
          description: "The booking may have been created but we couldn't get the details. Please check your bookings list.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        navigate('/tenant/bookings');
        return;
      }
      
      // If we reach here, we have a booking object but not sure if it has an ID
      const bookingId = response.booking.bookingId || 'latest';
      
      toast({
        title: "Booking Created!",
        description: "Your booking has been successfully created.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
        // Navigate to payment method selection page with the booking ID
      navigate(`/tenant/bookings/${bookingId}/payment-method`);
      
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "There was an error creating your booking. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Confirm Your Booking</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
              <Text fontSize="xl" fontWeight="bold" mb={2}>{room?.name}</Text>
              <Text>
                {room?.capacity || 1} person{room?.capacity !== 1 ? 's' : ''} · {room?.rentalType?.name === 'harian' ? 'Daily' : 'Monthly'} rental
              </Text>
            </Box>
            
            <Box>
              <HStack>
                <FaCalendarAlt />
                <Text fontWeight="bold">Stay Details</Text>
              </HStack>
              <Divider my={2} />
              <HStack justify="space-between">
                <Text>Check-in</Text>
                <Text fontWeight="medium">{formatDisplayDate(startDate)}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text>Check-out</Text>
                <Text fontWeight="medium">{formatDisplayDate(endDate)}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text>Duration</Text>
                <Text fontWeight="medium">{calculateDuration()}</Text>
              </HStack>
            </Box>
            
            <Box>
              <HStack>
                <FaMoneyBillWave />
                <Text fontWeight="bold">Price Details</Text>
              </HStack>
              <Divider my={2} />
              <HStack justify="space-between">
                <Text>Room Rate</Text>
                <Text>{formatCurrency(room?.rate || 0)} / {isMonthly ? 'month' : 'night'}</Text>
              </HStack>
              {!isMonthly && (
                <HStack justify="space-between">
                  <Text>Duration</Text>
                  <Text>× {calculateDuration()}</Text>
                </HStack>
              )}
              <HStack justify="space-between" fontWeight="bold" mt={2}>
                <Text>Total Price</Text>
                <Text>{formatCurrency(totalPrice)}</Text>
              </HStack>
            </Box>
            
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box fontSize="sm">
                <Text fontWeight="medium">Payment is due after booking confirmation.</Text>
                <Text>You'll be able to select your payment method after booking is confirmed.</Text>
              </Box>
            </Alert>
            
            <Checkbox 
              isChecked={agreedToTerms} 
              onChange={() => setAgreedToTerms(!agreedToTerms)}
              colorScheme="brand"
            >
              I agree to the terms and conditions
            </Checkbox>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose} isDisabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            colorScheme="brand" 
            onClick={handleCreateBooking}
            isLoading={isSubmitting}
            isDisabled={!agreedToTerms}
            loadingText="Creating..."
          >
            Confirm Booking
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BookingModal;
