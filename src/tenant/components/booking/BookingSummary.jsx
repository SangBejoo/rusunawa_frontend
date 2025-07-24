import React from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  Divider,
  Button,
  HStack,
  useColorModeValue
} from '@chakra-ui/react';
import { FaCalendarAlt, FaBed, FaMoneyBillWave, FaUser } from 'react-icons/fa';
import { formatDate, formatDateRange, calculateDurationDays } from '../../components/helpers/dateFormatter';
import { formatCurrency } from '../../components/helpers/typeConverters';

// Status badge for bookings
const BookingStatusBadge = ({ status }) => {
  let colorScheme;
  switch(status?.toLowerCase()) {
    case 'approved':
      colorScheme = 'green';
      break;
    case 'pending':
      colorScheme = 'yellow';
      break;
    case 'rejected':
      colorScheme = 'red';
      break;
    case 'cancelled':
      colorScheme = 'gray';
      break;
    case 'completed':
      colorScheme = 'blue';
      break;
    default:
      colorScheme = 'gray';
  }

  return (
    <Badge colorScheme={colorScheme} px={2} py={1} borderRadius="md">
      {status}
    </Badge>
  );
};

const BookingSummary = ({ booking, showActions = true, onCancel, onPay, isLoading }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('white', 'gray.700');

  if (!booking) return null;

  const startDate = booking.check_in_date || booking.start_date;
  const endDate = booking.check_out_date || booking.end_date;
  const duration = calculateDurationDays(startDate, endDate);
  
  // Check if booking can be cancelled (only pending bookings)
  const canCancel = booking.status?.toLowerCase() === 'pending';
  
  // Check if booking needs payment (approved but not paid)
  const needsPayment = booking.status?.toLowerCase() === 'approved' && 
                      (!booking.invoice || booking.invoice.status?.toLowerCase() !== 'paid');

  return (
    <Box 
      borderWidth="1px" 
      borderColor={borderColor}
      borderRadius="lg" 
      p={4}
      bg={bgColor}
      boxShadow="sm"
    >
      <Flex justify="space-between" align="center" mb={3}>
        <Text fontWeight="bold" fontSize="lg">Booking #{booking.booking_id}</Text>
        <BookingStatusBadge status={booking.status} />
      </Flex>

      <Divider mb={3} />

      <Box mb={4}>
        <HStack spacing={2} mb={2}>
          <FaCalendarAlt />
          <Text fontWeight="medium">Stay Period:</Text>
        </HStack>
        <Text pl={6}>{formatDateRange(startDate, endDate)} ({duration} days)</Text>
      </Box>

      <Box mb={4}>
        <HStack spacing={2} mb={2}>
          <FaBed />
          <Text fontWeight="medium">Room:</Text>
        </HStack>
        <Text pl={6}>{booking.room?.name || 'Room information unavailable'}</Text>
      </Box>

      <Box mb={4}>
        <HStack spacing={2} mb={2}>
          <FaUser />
          <Text fontWeight="medium">Tenant:</Text>
        </HStack>
        <Text pl={6}>{booking.tenant?.name || 'Tenant information unavailable'}</Text>
      </Box>

      <Box mb={4}>
        <HStack spacing={2} mb={2}>
          <FaMoneyBillWave />
          <Text fontWeight="medium">Total Amount:</Text>
        </HStack>
        <Text pl={6} fontWeight="bold" fontSize="lg">
          {formatCurrency(booking.total_amount)}
        </Text>
      </Box>

      {showActions && (
        <Flex mt={4} justify="flex-end" gap={3}>
          {canCancel && (
            <Button 
              colorScheme="red" 
              variant="outline" 
              onClick={onCancel}
              isLoading={isLoading}
            >
              Cancel Booking
            </Button>
          )}
          
          {needsPayment && (
            <Button 
              colorScheme="brand" 
              onClick={onPay}
              isLoading={isLoading}
            >
              Pay Now
            </Button>
          )}
        </Flex>
      )}
    </Box>
  );
};

export default BookingSummary;
