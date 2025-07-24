import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  useColorModeValue,
  Icon,
  Heading,
  Flex,
  Tooltip,
  Progress,
  SimpleGrid,
  Alert,
  AlertIcon,
  Spinner
} from '@chakra-ui/react';
import { 
  FaCalendarAlt, 
  FaHome, 
  FaUser, 
  FaMoneyBillWave, 
  FaFileInvoice, 
  FaClock, 
  FaCheckCircle,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaPhone,
  FaIdCard
} from 'react-icons/fa';

/**
 * Enhanced Payment Summary Component with comprehensive display
 * 
 * @param {Object} props Component props
 * @param {Object} props.booking Booking object with payment details
 * @param {Object} props.invoice Invoice object with payment details
 * @param {boolean} props.showProgress Show payment progress indicator
 * @param {boolean} props.showBookingDetails Show detailed booking information
 * @param {boolean} props.isLoading Show loading state
 * @param {string} props.size Component size variant (sm, md, lg)
 * @returns {JSX.Element} The enhanced payment summary component
 */
const PaymentSummary = ({ 
  booking, 
  invoice, 
  showProgress = false, 
  showBookingDetails = true,
  isLoading = false,
  size = 'md'
}) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const highlightBg = useColorModeValue('brand.50', 'brand.900');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  
  // Determine which data to use
  const data = invoice || booking;
  
  // Handle loading state
  if (isLoading) {
    return (
      <Box 
        p={getSizePadding(size)} 
        borderWidth="1px" 
        borderRadius="lg" 
        bg={bg}
        borderColor={borderColor}
        boxShadow="md"
      >
        <VStack spacing={4} align="center">
          <Spinner size="lg" color="brand.500" />
          <Text color="gray.500">Loading payment information...</Text>
        </VStack>
      </Box>
    );
  }
  
  // Handle null or undefined data
  if (!data) {
    return (
      <Box 
        p={getSizePadding(size)} 
        borderWidth="1px" 
        borderRadius="lg" 
        bg={bg}
        borderColor={borderColor}
        boxShadow="md"
      >
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          No payment information available
        </Alert>
      </Box>
    );
  }
  // Format currency with better formatting
  const formatCurrency = (amount) => {
    if (!amount) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date with better localization
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format date range
  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    const start = new Date(startDate).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    const end = new Date(endDate).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end}`;
  };

  // Get status color with more variations
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'success':
      case 'completed':
      case 'verified':
        return 'green';
      case 'partially_paid':
      case 'pending':
      case 'waiting_approval':
        return 'yellow';
      case 'overdue':
      case 'unpaid':
      case 'failed':
      case 'rejected':
        return 'red';
      case 'processing':
      case 'in_progress':
        return 'blue';
      case 'cancelled':
        return 'gray';
      default:
        return 'gray';
    }
  };

  // Get status display text
  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'Paid';
      case 'success': return 'Success';
      case 'completed': return 'Completed';
      case 'verified': return 'Verified';
      case 'partially_paid': return 'Partially Paid';
      case 'pending': return 'Pending';
      case 'waiting_approval': return 'Waiting Approval';
      case 'overdue': return 'Overdue';
      case 'unpaid': return 'Unpaid';
      case 'failed': return 'Failed';
      case 'rejected': return 'Rejected';
      case 'processing': return 'Processing';
      case 'in_progress': return 'In Progress';
      case 'cancelled': return 'Cancelled';
      default: return status || 'Unknown';
    }
  };

  // Get priority badge
  const getPriorityInfo = (status, dueDate) => {
    if (!dueDate) return null;
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (status?.toLowerCase() === 'paid' || status?.toLowerCase() === 'completed') {
      return null;
    }
    
    if (diffDays < 0) {
      return { color: 'red', text: `Overdue by ${Math.abs(diffDays)} days`, icon: FaExclamationTriangle };
    } else if (diffDays <= 3) {
      return { color: 'orange', text: `Due in ${diffDays} days`, icon: FaClock };
    } else if (diffDays <= 7) {
      return { color: 'yellow', text: `Due in ${diffDays} days`, icon: FaClock };
    }
    return null;
  };

  // Get size-based padding
  function getSizePadding(size) {
    switch (size) {
      case 'sm': return 4;
      case 'lg': return 8;
      case 'md':
      default: return 6;
    }
  }

  // Get size-based heading
  function getSizeHeading(size) {
    switch (size) {
      case 'sm': return 'sm';
      case 'lg': return 'lg';
      case 'md':
      default: return 'md';
    }
  }
  // Extract details with enhanced information
  const isInvoice = !!invoice;
  const title = isInvoice ? 'Invoice Summary' : 'Booking Summary';
  const identifier = isInvoice 
    ? `#${data.invoice_no || data.invoiceNumber || data.id}` 
    : `Booking #${data.booking_id || data.bookingId || data.id}`;
  const amount = data.total_amount || data.totalAmount || data.amount || 0;
  const status = data.status;
  const dueDate = isInvoice ? (data.due_date || data.dueDate) : (data.check_out || data.checkOutDate);
  const issueDate = isInvoice ? (data.created_at || data.issueDate) : (data.created_at || data.createdAt);
  const priorityInfo = getPriorityInfo(status, dueDate);

  // Enhanced booking/invoice details
  const roomInfo = data.room || booking?.room;
  const tenantInfo = data.tenant || booking?.tenant;

  return (
    <Box 
      p={getSizePadding(size)}
      borderWidth="1px" 
      borderRadius="lg" 
      bg={bg}
      borderColor={borderColor}
      boxShadow="md"
      position="relative"
      overflow="hidden"
    >
      {/* Priority Alert Strip */}
      {priorityInfo && (
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          height="4px"
          bg={`${priorityInfo.color}.500`}
        />
      )}

      <VStack spacing={4} align="stretch">
        {/* Header with enhanced information */}
        <Flex justify="space-between" align="flex-start" wrap="wrap" gap={2}>
          <VStack align="start" spacing={1} flex="1">
            <Heading size={getSizeHeading(size)} color={textColor}>
              {title}
            </Heading>
            <Text fontSize="sm" color="gray.500">
              {identifier}
            </Text>
            {issueDate && (
              <Text fontSize="xs" color="gray.400">
                Created: {formatDate(issueDate)}
              </Text>
            )}
          </VStack>
          
          <VStack align="end" spacing={2}>
            <Badge 
              colorScheme={getStatusColor(status)} 
              fontSize="sm" 
              px={3} 
              py={1}
              borderRadius="full"
            >
              {getStatusText(status)}
            </Badge>
            
            {priorityInfo && (
              <Tooltip label={priorityInfo.text} hasArrow>
                <Badge 
                  colorScheme={priorityInfo.color} 
                  fontSize="xs" 
                  px={2} 
                  py={1}
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <Icon as={priorityInfo.icon} boxSize={3} />
                  {priorityInfo.text}
                </Badge>
              </Tooltip>
            )}
          </VStack>
        </Flex>

        {/* Payment Progress Bar */}
        {showProgress && (
          <Box>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" fontWeight="medium">Payment Progress</Text>
              <Text fontSize="sm" color="gray.500">
                {status === 'paid' || status === 'completed' ? '100%' : 
                 status === 'partially_paid' ? '50%' : '0%'}
              </Text>
            </HStack>
            <Progress 
              value={
                status === 'paid' || status === 'completed' ? 100 : 
                status === 'partially_paid' ? 50 : 
                status === 'pending' || status === 'processing' ? 25 : 0
              }
              size="sm"
              colorScheme={getStatusColor(status)}
              borderRadius="full"
            />
          </Box>
        )}

        <Divider />

        {/* Main Information */}
        <VStack spacing={4} align="stretch">
          {/* Amount - Featured prominently */}
          <Box bg={highlightBg} p={4} borderRadius="md" textAlign="center">
            <HStack justify="center" mb={2}>
              <Icon as={FaMoneyBillWave} color="brand.500" boxSize={5} />
              <Text fontWeight="medium" color="brand.600">
                {isInvoice ? 'Invoice Amount' : 'Booking Total'}
              </Text>
            </HStack>
            <Text fontWeight="bold" fontSize="2xl" color="brand.600">
              {formatCurrency(amount)}
            </Text>
          </Box>

          {/* Key Dates in Grid */}
          <SimpleGrid columns={2} spacing={4}>
            {issueDate && (
              <Box>
                <HStack mb={1}>
                  <Icon as={FaCalendarAlt} color="blue.500" boxSize={4} />
                  <Text fontSize="sm" fontWeight="medium">
                    {isInvoice ? 'Issue Date' : 'Created'}
                  </Text>
                </HStack>
                <Text fontSize="sm">{formatDate(issueDate)}</Text>
              </Box>
            )}

            {dueDate && (
              <Box>
                <HStack mb={1}>
                  <Icon as={FaClock} color="orange.500" boxSize={4} />
                  <Text fontSize="sm" fontWeight="medium">
                    {isInvoice ? 'Due Date' : 'Check Out'}
                  </Text>
                </HStack>
                <Text fontSize="sm">{formatDate(dueDate)}</Text>
              </Box>
            )}
          </SimpleGrid>

          {/* Booking Details */}
          {showBookingDetails && (roomInfo || tenantInfo || (booking && (booking.check_in || booking.startDate))) && (
            <>
              <Divider />
              <Box>
                <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={3}>
                  {isInvoice ? 'Related Booking' : 'Booking Details'}
                </Text>
                
                <VStack spacing={3} align="stretch">
                  {/* Room Information */}
                  {roomInfo && (
                    <HStack>
                      <Icon as={FaHome} color="purple.500" boxSize={4} />
                      <VStack align="start" spacing={0} flex="1">
                        <Text fontSize="sm" fontWeight="medium">
                          {roomInfo.name || roomInfo.room_name || 'Room'}
                        </Text>
                        {roomInfo.room_type && (
                          <Text fontSize="xs" color="gray.500">
                            {roomInfo.room_type}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  )}

                  {/* Date Range for Booking */}
                  {booking && (booking.check_in || booking.startDate) && (
                    <HStack>
                      <Icon as={FaCalendarAlt} color="green.500" boxSize={4} />
                      <Text fontSize="sm">
                        {formatDateRange(
                          booking.check_in || booking.startDate,
                          booking.check_out || booking.endDate
                        )}
                      </Text>
                    </HStack>
                  )}

                  {/* Tenant Information */}
                  {tenantInfo && (
                    <HStack>
                      <Icon as={FaUser} color="teal.500" boxSize={4} />
                      <VStack align="start" spacing={0} flex="1">
                        <Text fontSize="sm" fontWeight="medium">
                          {tenantInfo.name || tenantInfo.full_name || 'Tenant'}
                        </Text>
                        {tenantInfo.email && (
                          <Text fontSize="xs" color="gray.500">
                            {tenantInfo.email}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  )}
                </VStack>
              </Box>
            </>
          )}

          {/* Invoice specific information */}
          {isInvoice && (
            <>
              {data.description && (
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>Description:</Text>
                  <Text fontSize="sm" color="gray.600" bg="gray.50" p={2} borderRadius="md">
                    {data.description}
                  </Text>
                </Box>
              )}
              
              {data.items && data.items.length > 0 && (
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>Invoice Items:</Text>
                  <VStack spacing={2} align="stretch">
                    {data.items.map((item, index) => (
                      <HStack key={index} justify="space-between" fontSize="sm" p={2} bg="gray.50" borderRadius="md">
                        <Text>{item.description || item.name}</Text>
                        <Text fontWeight="medium">{formatCurrency(item.amount || item.total)}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              )}
            </>
          )}
        </VStack>
      </VStack>
    </Box>
  );
};export default PaymentSummary;
