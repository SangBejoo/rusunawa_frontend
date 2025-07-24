import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Heading,
  Text,
  Badge,
  Link,
  Alert,
  AlertIcon,
  Spinner,
  Flex,
  useColorModeValue,
  Stack,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { format } from 'date-fns';

/**
 * TenantBookings component to display bookings made by a tenant
 * @param {Object} props Component props
 * @param {Array} props.bookings List of tenant bookings
 * @param {boolean} props.isLoading Whether bookings are loading
 * @param {number} props.tenantId The tenant ID
 */
const TenantBookings = ({ bookings = [], isLoading = false, tenantId }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  
  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'green';
      case 'pending': return 'yellow';
      case 'rejected': return 'red';
      case 'cancelled': return 'orange';
      case 'completed': return 'blue';
      default: return 'gray';
    }
  };
  
  // Format date into readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return `Rp ${amount.toLocaleString()}`;
  };
  
  if (isLoading) {
    return (
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" bg={bgColor} textAlign="center">
        <Spinner size="xl" my={8} color="blue.500" />
        <Text>Loading bookings...</Text>
      </Box>
    );
  }
  
  if (!bookings || bookings.length === 0) {
    return (
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" bg={bgColor}>
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          This tenant has no bookings yet.
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" bg={bgColor}>
      <Stack spacing={5}>
        <Flex justify="space-between" align="center">
          <Heading size="md">Booking History</Heading>
          <Button 
            as={RouterLink}
            to={`/admin/bookings/new?tenantId=${tenantId}`}
            colorScheme="blue"
            size="sm"
          >
            Create New Booking
          </Button>
        </Flex>
        
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Room</Th>
                <Th>Check-in</Th>
                <Th>Check-out</Th>
                <Th isNumeric>Amount</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {bookings.map((booking) => (
                <Tr key={booking.bookingId || booking.id}>
                  <Td>#{booking.bookingId || booking.id}</Td>
                  <Td>
                    <Link 
                      as={RouterLink} 
                      to={`/admin/rooms/${booking.roomId || booking.room?.roomId}`}
                      color="blue.500"
                      fontWeight="medium"
                    >
                      {booking.room?.name || `Room ${booking.roomId || booking.room?.roomId}`}
                    </Link>
                  </Td>
                  <Td>{formatDate(booking.checkInDate)}</Td>
                  <Td>{formatDate(booking.checkOutDate)}</Td>
                  <Td isNumeric>{formatCurrency(booking.totalAmount)}</Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </Td>
                  <Td>{formatDate(booking.createdAt)}</Td>
                  <Td>
                    <Button 
                      as={RouterLink}
                      to={`/admin/bookings/${booking.bookingId || booking.id}`}
                      size="xs"
                      colorScheme="blue"
                    >
                      Details
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
        
        <Box textAlign="right">
          <Text fontSize="sm" color="gray.500">
            Total bookings: {bookings.length}
          </Text>
        </Box>
      </Stack>
    </Box>
  );
};

export default TenantBookings;
