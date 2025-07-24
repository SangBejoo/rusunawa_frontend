import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FaRegClipboard,
  FaCheck,
  FaRegClock,
  FaMoneyBillWave,
  FaKey,
  FaSignOutAlt,
  FaTimesCircle,
} from 'react-icons/fa';
import { formatDate } from '../../utils/dateUtils';

/**
 * BookingTimeline component shows the booking journey status
 */
const BookingTimeline = ({ booking }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const activeColor = useColorModeValue('brand.500', 'brand.300');
  const completedColor = useColorModeValue('green.500', 'green.300');
  const pendingColor = useColorModeValue('yellow.500', 'yellow.300');
  const canceledColor = useColorModeValue('red.500', 'red.300');
  const lineBg = useColorModeValue('gray.200', 'gray.600');
  
  // Get current booking status
  const status = booking?.status || 'pending';
  const isCancelled = status === 'cancelled' || status === 'rejected';
  
  // Define timeline steps with their status based on booking status
  const steps = [
    {
      id: 'booking',
      title: 'Booking Created',
      description: `on ${formatDate(booking?.createdAt)}`,
      icon: FaRegClipboard,
      status: 'completed',  // Always completed if we have a booking
    },
    {
      id: 'approval',
      title: 'Booking Approved',
      description: booking?.approvedAt ? `on ${formatDate(booking.approvedAt)}` : 'Awaiting approval',
      icon: FaCheck,
      status: ['approved', 'checked_in', 'checked_out', 'completed'].includes(status) 
        ? 'completed' 
        : isCancelled 
          ? 'canceled' 
          : 'waiting',
    },
    {
      id: 'payment',
      title: 'Payment',
      description: booking?.invoice?.paidAt ? `on ${formatDate(booking.invoice.paidAt)}` : 'Payment required',
      icon: FaMoneyBillWave,
      status: booking?.invoice?.status === 'paid' ? 'completed' : 'waiting',
    },
    {
      id: 'checkin',
      title: 'Check-in',
      description: booking?.checkedInAt ? `on ${formatDate(booking.checkedInAt)}` : `Scheduled on ${formatDate(booking?.startDate || booking?.checkIn)}`,
      icon: FaKey,
      status: ['checked_in', 'checked_out', 'completed'].includes(status) ? 'completed' : 'waiting',
    },
    {
      id: 'checkout',
      title: 'Check-out',
      description: booking?.checkedOutAt ? `on ${formatDate(booking.checkedOutAt)}` : `Scheduled on ${formatDate(booking?.endDate || booking?.checkOut)}`, 
      icon: FaSignOutAlt,
      status: ['checked_out', 'completed'].includes(status) ? 'completed' : 'waiting',
    },
  ];
  
  // Get color for status
  const getStatusColor = (stepStatus) => {
    switch (stepStatus) {
      case 'completed':
        return completedColor;
      case 'active':
        return activeColor;
      case 'waiting':
        return pendingColor;
      case 'canceled':
        return canceledColor;
      default:
        return textColor;
    }
  };

  return (
    <Box 
      p={6} 
      bg={bgColor} 
      borderRadius="lg" 
      borderWidth="1px" 
      borderColor={borderColor} 
      boxShadow="sm"
    >
      <Text fontWeight="bold" fontSize="lg" mb={4}>
        Booking Timeline
      </Text>
      <VStack spacing={0} align="stretch" position="relative">
        {/* Vertical connecting line */}
        <Box
          position="absolute"
          left="14px"
          top="24px"
          bottom="24px"
          width="2px"
          bg={lineBg}
          zIndex={0}
        />
        
        {/* Steps */}
        {steps.map((step, index) => (
          <Box key={step.id}>
            <HStack spacing={4} position="relative" py={3}>
              <Box
                borderRadius="full"
                bg={getStatusColor(step.status)}
                color="white"
                p={2}
                zIndex={1}
              >
                {step.status === 'canceled' ? (
                  <Icon as={FaTimesCircle} boxSize={5} />
                ) : (
                  <Icon as={step.icon} boxSize={5} />
                )}
              </Box>
              
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="md">
                  {step.title}
                </Text>
                <Text fontSize="sm" color={textColor}>
                  {step.description}
                </Text>
              </VStack>
            </HStack>
            
            {/* Add divider between steps (except the last one) */}
            {index < steps.length - 1 && (
              <Divider ml="30px" borderColor={borderColor} opacity={0.5} />
            )}
          </Box>
        ))}
        
        {/* Cancelled status overlay */}
        {isCancelled && (
          <Box
            position="absolute"
            top="0"
            right="0"
            bottom="0"
            left="0"
            bg="rgba(255,255,255,0.7)"
            borderRadius="lg"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex={2}
          >
            <Box bg="red.500" color="white" px={4} py={2} borderRadius="md">
              <Text fontWeight="bold">
                Booking {status === 'cancelled' ? 'Cancelled' : 'Rejected'}
              </Text>
            </Box>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default BookingTimeline;
