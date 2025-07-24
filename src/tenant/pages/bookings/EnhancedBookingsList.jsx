import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Badge,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  useColorModeValue,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  SimpleGrid,
  Progress,
  Tooltip,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Tag,
  TagLabel,
  TagCloseButton,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  useBreakpointValue,
  useToast,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel
} from '@chakra-ui/react';
import {
  FaCalendarAlt,
  FaMoneyBillWave,
  FaEye,
  FaSearch,
  FaFilter,
  FaSortAmountDown,
  FaSortAmountUp,
  FaCheckCircle,
  FaClock,
  FaCheck,
  FaTimes,
  FaKey,
  FaSignOutAlt,
  FaDownload,
  FaHistory,
  FaEllipsisV,
  FaPlus,
  FaHotel,
  FaChartLine,
  FaReceipt,
  FaChevronDown
} from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import bookingService from '../../services/bookingService';
import { formatCurrency } from '../../utils/formatUtils';
import { formatDate } from '../../utils/dateUtils';
import { useTenantAuth } from '../../context/tenantAuthContext';

const EnhancedBookingsList = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  // Auth context
  const { user, tenant } = useTenantAuth();
  
  // State management
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    searchQuery: '',
    paymentStatus: ''
  });
  const [activeFilters, setActiveFilters] = useState([]);
  
  // Responsive settings
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // Colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const highlightColor = useColorModeValue('gray.50', 'gray.600');
  
  // Helper functions
  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  // Fetch bookings from API
  const fetchBookings = async () => {
    if (!tenant?.tenantId) {
      console.log('No tenant ID available');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching bookings for tenant:', tenant.tenantId);
      
      // Call the service with proper parameters
      const response = await bookingService.getTenantBookings(tenant.tenantId);
      console.log('Bookings response:', response);
      
      if (response?.bookings) {
        // Map the bookings to ensure proper field names
        const mappedBookings = response.bookings.map(booking => ({
          ...booking,
          // Map ID fields consistently
          booking_id: booking.bookingId || booking.booking_id,
          bookingId: booking.bookingId || booking.booking_id,
          tenant_id: booking.tenantId || booking.tenant_id,
          room_id: booking.roomId || booking.room_id,
          // Map date fields with fallbacks
          check_in: booking.checkInDate || booking.check_in,
          check_out: booking.checkOutDate || booking.check_out,
          start_date: booking.checkInDate || booking.start_date,
          end_date: booking.checkOutDate || booking.end_date,
          checkInDate: booking.checkInDate || booking.check_in,
          checkOutDate: booking.checkOutDate || booking.check_out,
          created_at: booking.createdAt || booking.created_at,
          updated_at: booking.updatedAt || booking.updated_at,
          // Map amount fields
          total_amount: booking.totalAmount || booking.total_amount,
          totalAmount: booking.totalAmount || booking.total_amount,
          amount: booking.totalAmount || booking.amount,
          // Map status fields
          payment_status: booking.paymentStatus || booking.payment_status || 'pending',
          paymentStatus: booking.paymentStatus || booking.payment_status || 'pending'
        }));
        
        setBookings(mappedBookings);
      } else {
        console.warn('No bookings data in response');
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError(error?.message || 'Gagal memuat booking. Silakan coba lagi nanti.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch bookings when component mounts or tenant changes
  useEffect(() => {
    fetchBookings();
  }, [tenant?.tenantId]); // Use tenantId instead of tenant.id
  
  // Handle booking action
  const handleBookingAction = async (bookingId, action) => {
    try {
      switch (action) {
        case 'pay':
          navigate(`/tenant/bookings/${bookingId}/payment`);
          break;
          
        case 'cancel':
          const confirmed = window.confirm('Apakah Anda yakin ingin membatalkan booking ini?');
          if (confirmed) {
            await bookingService.cancelBooking(bookingId);
            toast({
              title: 'Booking Cancelled',
              description: 'Your booking has been cancelled successfully.',
              status: 'success',
              duration: 3000,
              isClosable: true,
            });
            fetchBookings();
          }
          break;
          
        case 'checkin':
          navigate(`/tenant/bookings/${bookingId}/check-in`);
          break;
          
        case 'checkout':
          navigate(`/tenant/bookings/${bookingId}/check-out`);
          break;
          
        case 'view':
          navigate(`/tenant/bookings/${bookingId}`);
          break;
          
        case 'download_receipt':
          // Download receipt logic here
          toast({
            title: 'Receipt Downloaded',
            description: 'Payment receipt has been downloaded.',
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
          break;
          
        default:
          console.warn(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error(`Error handling booking action ${action}:`, error);
      toast({
        title: 'Action Failed',
        description: error.message || 'Failed to perform action.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    const searchQuery = e.target.elements.search.value;
    
    setFilters(prev => ({ ...prev, searchQuery }));
    
    if (searchQuery) {
      setActiveFilters(prev => [
        ...prev.filter(f => f.key !== 'search'),
        { key: 'search', value: searchQuery, label: `Search: ${searchQuery}` }
      ]);
    } else {
      setActiveFilters(prev => prev.filter(f => f.key !== 'search'));
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (filterType, value, label) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    
    if (value) {
      setActiveFilters(prev => [
        ...prev.filter(f => f.key !== filterType),
        { key: filterType, value, label }
      ]);
    } else {
      setActiveFilters(prev => prev.filter(f => f.key !== filterType));
    }
  };
  
  // Handle removing filter
  const handleRemoveFilter = (filterKey) => {
    setFilters(prev => ({ ...prev, [filterKey]: '' }));
    setActiveFilters(prev => prev.filter(f => f.key !== filterKey));
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      searchQuery: '',
      paymentStatus: ''
    });
    setActiveFilters([]);
  };
  
  // Get status colors
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'yellow';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'cancelled': return 'red';
      case 'checked_in': return 'blue';
      case 'completed': return 'purple';
      default: return 'gray';
    }
  };
  
  // Get payment status colors
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'green';
      case 'payment_pending': return 'yellow';
      case 'payment_required': return 'orange';
      case 'payment_failed': return 'red';
      default: return 'gray';
    }
  };
  
  // Format status text
  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  // Calculate payment progress with invoice consideration
  const calculatePaymentProgress = (booking) => {
    // If we have invoice data, use that
    if (booking.invoice && booking.invoice.status === 'paid') {
      return 100;
    }
    
    // Check if booking has completed payments
    if (booking.payments && booking.payments.length > 0) {
      const totalPaid = booking.payments
        .filter(p => p.status === 'verified' || p.status === 'success' || p.status === 'settlement')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      const totalAmount = booking.total_amount || booking.totalAmount || booking.amount || 0;
      
      // Debug logging for problematic bookings
      if (isNaN(totalAmount) || isNaN(totalPaid)) {
        console.warn('Payment progress calculation error:', {
          bookingId: booking.id,
          totalAmount,
          totalPaid,
          booking: booking
        });
      }
      
      if (totalAmount > 0 && !isNaN(totalAmount) && !isNaN(totalPaid)) {
        const progress = Math.min((totalPaid / totalAmount) * 100, 100);
        return isNaN(progress) ? 0 : progress;
      }
    }
    
    // Fallback to basic status check
    const paymentStatus = booking.payment_status || booking.paymentStatus;
    if (paymentStatus === 'paid' || paymentStatus === 'completed') {
      return 100;
    }
    
    return 0;
  };

  // Enhanced status info that considers payment status
  const getStatusInfo = (status, paymentStatus = null, paymentProgress = 0) => {
    // If payment is completed, show as paid regardless of booking status
    if (paymentProgress >= 100 || paymentStatus === 'paid') {
      return {
        text: 'Lunas',
        color: 'green',
        icon: FaCheckCircle
      };
    }
    
    switch (status?.toLowerCase()) {
      case 'pending':
        return {
          text: 'Pending Payment',
          color: 'yellow',
          icon: FaClock
        };
      case 'approved':
        return {
          text: paymentProgress > 0 ? 'Payment Processing' : 'Approved',
          color: paymentProgress > 0 ? 'blue' : 'green',
          icon: paymentProgress > 0 ? FaClock : FaCheck
        };
      case 'checked_in':
        return {
          text: 'Checked In',
          color: 'blue',
          icon: FaKey
        };
      case 'completed':
        return {
          text: 'Completed',
          color: 'green',
          icon: FaCheckCircle
        };
      case 'cancelled':
        return {
          text: 'Cancelled',
          color: 'red',
          icon: FaTimes
        };
      case 'rejected':
        return {
          text: 'Rejected',
          color: 'red',
          icon: FaTimes
        };
      default:
        return {
          text: status || 'Unknown',
          color: 'gray',
          icon: FaClock
        };
    }
  };

  // Render booking row
  const renderBookingRow = (booking) => {
    const paymentProgress = calculatePaymentProgress(booking);
    const paymentStatus = booking.payment_status || booking.paymentStatus;
    const statusInfo = getStatusInfo(booking.status, paymentStatus, paymentProgress);
    const isOverdue = booking.status === 'pending' && new Date(booking.check_in || booking.start_date) < new Date();

    return (
      <Tr key={booking.bookingId} 
          _hover={{ 
            bg: 'gray.100',
            transition: 'background-color 0.2s'
          }}
          cursor="pointer"
          onClick={() => handleBookingAction(booking.bookingId, 'view')}
      >
        <Td>
          <HStack>
            <Badge colorScheme={getStatusColor(booking.status)} borderRadius="full">
              {formatStatus(booking.status)}
            </Badge>
            <Text fontSize="sm" color="gray.500">
              #{booking.bookingId}
            </Text>
          </HStack>
        </Td>
        
        <Td>
          <Text fontSize="sm">
            {booking.room?.name || `Room #${booking.roomId}`}
          </Text>
        </Td>
        
        <Td>
          <HStack spacing={2}>
            <Icon as={FaCalendarAlt} color="brand.500" />
            <Text fontSize="sm">
              {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
            </Text>
          </HStack>
        </Td>
        
        <Td isNumeric>
          <Text fontWeight="bold" color="brand.500">
            {formatCurrency(booking.totalAmount || 0)}
          </Text>
        </Td>
        
        <Td isNumeric>
          <Text fontWeight="medium" color="green.600">
            {formatCurrency(booking.paymentAmount)}
          </Text>
        </Td>
          <Td>
          {/* Progress bar for payment */}
          <Box>
            <Flex justify="space-between" mb={1}>
              <Text fontSize="xs" color="gray.500">Payment Progress</Text>
              <Text fontSize="xs" color="gray.500">
                {(() => {
                  const progress = calculatePaymentProgress(booking);
                  return isNaN(progress) ? '0' : Math.round(progress);
                })()}%
              </Text>
            </Flex>
            <Progress 
              value={(() => {
                const progress = calculatePaymentProgress(booking);
                return isNaN(progress) ? 0 : progress;
              })()} 
              colorScheme="green" 
              size="sm" 
              borderRadius="full"
            />
          </Box>
        </Td>
        
        <Td>
          <HStack spacing={2}>
            <IconButton
              aria-label="View Booking"
              icon={<FaEye />}
              size="sm"
              colorScheme="blue"
              variant="outline"
              onClick={() => handleBookingAction(booking.bookingId, 'view')}
            />
            
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="More Actions"
                icon={<FaEllipsisV />}
                size="sm"
                variant="outline"
                colorScheme="gray"
              />
              <MenuList>
                <MenuItem 
                  onClick={() => handleBookingAction(booking.bookingId, 'pay')}
                >
                  Pay Now
                </MenuItem>
                <MenuItem 
                  onClick={() => handleBookingAction(booking.bookingId, 'checkin')}
                  isDisabled={booking.status !== 'approved'}
                >
                  Room Access
                </MenuItem>
                <MenuItem 
                  onClick={() => handleBookingAction(booking.bookingId, 'checkout')}
                  isDisabled={booking.status !== 'checked_in'}
                >
                  Check Out
                </MenuItem>
                <MenuDivider />
                <MenuItem 
                  onClick={() => handleBookingAction(booking.bookingId, 'cancel')}
                  color="red.500"
                >
                  Cancel Booking
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Td>
      </Tr>
    );
  };
  
  // Render bookings table
  const renderBookingsTable = (bookingsToRender) => {
    if (!bookingsToRender || bookingsToRender.length === 0) {
      return (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          No bookings found matching your criteria.
        </Alert>
      );
    }

    return (
      <TableContainer borderRadius="md" overflow="hidden">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Status</Th>
              <Th>Room</Th>
              <Th>Dates</Th>
              <Th isNumeric>Total Amount</Th>
              <Th isNumeric>Paid Amount</Th>
              <Th>Payment Progress</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {bookingsToRender.map(renderBookingRow)}
          </Tbody>
        </Table>
      </TableContainer>
    );
  };
  
  // Filter bookings by status
  const filterBookingsByStatus = (status) => {
    if (status === 'all') return bookings;
    return bookings.filter(b => b.status === status);
  };
  
  // Render booking card for mobile view
  const renderBookingCard = (booking) => {
    const paymentProgress = calculatePaymentProgress(booking);
    const paymentStatus = booking.payment_status || booking.paymentStatus;
    const statusInfo = getStatusInfo(booking.status, paymentStatus, paymentProgress);
    const isOverdue = booking.status === 'pending' && new Date(booking.check_in || booking.start_date) < new Date();

    return (
      <Card
        key={booking.bookingId || booking.booking_id}
        bg={cardBg}
        borderWidth="1px"
        borderColor={isOverdue ? 'red.300' : borderColor}
        borderRadius="lg"
        overflow="hidden"
        transition="all 0.2s"
        _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
      >
        <CardHeader bg={highlightColor} py={3}>
          <HStack justify="space-between" align="center">
            <HStack spacing={3}>
              <Text fontWeight="bold" fontSize="lg">
                #{booking.bookingId || booking.booking_id}
              </Text>
              <Text fontWeight="medium">
                {booking.room?.name || 'Room'}
              </Text>
            </HStack>
            <HStack spacing={2}>
              <Badge
                colorScheme={statusInfo.color}
                display="flex"
                alignItems="center"
                px={2}
                py={1}
                borderRadius="md"
                fontSize="xs"
              >
                <Icon as={statusInfo.icon} mr={1} boxSize={3} />
                {statusInfo.text}
              </Badge>
              <Badge colorScheme="gray" fontSize="xs">
                {paymentProgress >= 100 ? 'paid' : (booking.paymentStatus || booking.payment_status || 'pending')}
              </Badge>
            </HStack>
          </HStack>
        </CardHeader>

        <CardBody p={4}>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <HStack>
                <Icon as={FaCalendarAlt} color="brand.500" />
                <Text fontSize="sm">
                  {formatDateRange(
                    booking.checkInDate || booking.check_in || booking.start_date,
                    booking.checkOutDate || booking.check_out || booking.end_date
                  )}
                </Text>
              </HStack>
              <Text fontSize="sm" color="gray.500">
                {calculateDuration(
                  booking.checkInDate || booking.check_in || booking.start_date,
                  booking.checkOutDate || booking.check_out || booking.end_date
                )} days
              </Text>
            </HStack>

            <HStack justify="space-between">
              <HStack>
                <Icon as={FaMoneyBillWave} color="green.500" />
                <Text fontSize="sm">Total Amount</Text>
              </HStack>
              <Text fontWeight="bold" color="brand.500">
                {formatCurrency(booking.totalAmount || booking.total_amount || booking.amount || 0)}
              </Text>
            </HStack>

            {/* Payment Progress */}            <Box>
              <HStack justify="space-between" mb={1}>
                <Text fontSize="xs" color="gray.600">Payment Progress</Text>
                <Text fontSize="xs" color="gray.600">
                  {isNaN(paymentProgress) ? '0' : Math.round(paymentProgress)}%
                </Text>
              </HStack>
              <Progress
                value={isNaN(paymentProgress) ? 0 : paymentProgress}
                colorScheme={paymentProgress === 100 ? 'green' : 'blue'}
                size="sm"
                borderRadius="full"
              />
            </Box>
          </VStack>
        </CardBody>

        <CardFooter pt={0}>
          <HStack spacing={2} width="100%">
            <Button
              flex="1"
              size="sm"
              variant="outline"
              leftIcon={<FaEye />}
              onClick={() => handleViewBooking(booking)}
            >
              View
            </Button>
            
            {/* Remove all Pay button logic - only keep booking status actions */}
            {booking.status === 'approved' && (
              <Button
                flex="1"
                size="sm"
                colorScheme="green"
                leftIcon={<FaKey />}
                onClick={() => navigate(`/tenant/bookings/${booking.bookingId || booking.booking_id}/check-in`)}
              >
                Room Access
              </Button>
            )}
            
            {booking.status === 'checked_in' && (
              <Button
                flex="1"
                size="sm"
                colorScheme="blue"
                leftIcon={<FaSignOutAlt />}
                onClick={() => navigate(`/tenant/bookings/${booking.bookingId || booking.booking_id}/check-out`)}
              >
                Check Out
              </Button>
            )}

            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FaEllipsisV />}
                size="sm"
                variant="ghost"
                aria-label="More options"
              />
              <MenuList>
                <MenuItem
                  icon={<FaEye />}
                  onClick={() => handleViewBooking(booking)}
                >
                  View Details
                </MenuItem>
                {/* Completely remove Pay Now menu item */}
                <MenuItem
                  icon={<FaDownload />}
                  onClick={() => handleDownloadBooking(booking)}
                >
                  Download Confirmation
                </MenuItem>
                <MenuDivider />
                <MenuItem
                  icon={<FaHistory />}
                  onClick={() => navigate(`/tenant/payments/history?booking=${booking.bookingId || booking.booking_id}`)}
                >
                  Payment History
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </CardFooter>
      </Card>
    );
  };
  
  // Handle booking view
  const handleViewBooking = (booking) => {
    navigate(`/tenant/bookings/${booking.bookingId || booking.booking_id}`);
  };

  // Handle booking download
  const handleDownloadBooking = (booking) => {
    console.log('Download booking confirmation for:', booking.bookingId || booking.booking_id);
    // Implement download logic here
  };
  
  return (
    <TenantLayout>
      <Container maxW="container.xl" py={8}>
        {/* Header */}
        <VStack spacing={6} align="stretch">
          <HStack justify="space-between" align="flex-start">
            <Box>
              <Heading as="h1" size="xl" mb={2} display="flex" alignItems="center">
                <Icon as={FaHotel} mr={3} color="brand.500" />
                My Bookings
              </Heading>
              <Text color="gray.500">
                Manage your bookings with integrated payment tracking
              </Text>
            </Box>
            
            <VStack spacing={2}>
              <Button
                leftIcon={<FaChartLine />}
                variant="solid"
                colorScheme="brand"
                size="sm"
                onClick={() => navigate('/tenant/analytics')}
              >
                View Analytics
              </Button>
              
              <Button
                leftIcon={<FaReceipt />}
                variant="outline"
                size="sm"
                onClick={() => navigate('/tenant/notifications')}
              >
                Notifications
              </Button>
            </VStack>
          </HStack>
          
          {/* Filters and Search */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="md">
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack spacing={4} wrap="wrap">
                  <form onSubmit={handleSearch} style={{ flex: 1, minWidth: '200px' }}>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <FaSearch color="gray.300" />
                      </InputLeftElement>
                      <Input 
                        name="search"
                        placeholder="Search bookings..." 
                        defaultValue={filters.searchQuery}
                      />
                    </InputGroup>
                  </form>
                  
                  <Menu>
                    <MenuButton as={Button} rightIcon={<FaChevronDown />} variant="outline">
                      <HStack>
                        <FaFilter />
                        <Text>Filters</Text>
                      </HStack>
                    </MenuButton>
                    <MenuList>
                      <MenuItem 
                        onClick={() => handleFilterChange('paymentStatus', 'payment_required', 'Payment Required')}
                      >
                        Payment Required
                      </MenuItem>
                      <MenuItem 
                        onClick={() => handleFilterChange('paymentStatus', 'paid', 'Paid')}
                      >
                        Fully Paid
                      </MenuItem>
                      <MenuItem 
                        onClick={() => handleFilterChange('paymentStatus', 'payment_pending', 'Payment Pending')}
                      >
                        Payment Pending
                      </MenuItem>
                      <MenuDivider />
                      <MenuItem onClick={handleClearFilters}>
                        Clear All Filters
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </HStack>
                
                {/* Active Filters */}
                {activeFilters.length > 0 && (
                  <Flex wrap="wrap" gap={2}>
                    {activeFilters.map((filter) => (
                      <Tag
                        key={filter.key}
                        size="md"
                        borderRadius="full"
                        variant="subtle"
                        colorScheme="blue"
                      >
                        <TagLabel>{filter.label}</TagLabel>
                        <TagCloseButton onClick={() => handleRemoveFilter(filter.key)} />
                      </Tag>
                    ))}
                  </Flex>
                )}
              </VStack>
            </CardBody>
          </Card>
          
          {/* Error Display */}
          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}
          
          {/* Booking Status Tabs */}
          <Tabs 
            variant="soft-rounded" 
            colorScheme="brand"
            onChange={(index) => {
              const statuses = ['all', 'pending', 'approved', 'checked_in', 'completed', 'cancelled'];
              setActiveTab(statuses[index]);
            }}
          >
            <TabList overflowX="auto" py={2}>
              <Tab>All</Tab>
              <Tab>Pending</Tab>
              <Tab>Approved</Tab>
              <Tab>Checked In</Tab>
              <Tab>Completed</Tab>
              <Tab>Cancelled</Tab>
            </TabList>
            
            <TabPanels>
              {/* All Bookings */}
              <TabPanel px={0}>
                {loading ? (
                  <Flex justify="center" py={10}>
                    <Spinner size="xl" color="brand.500" thickness="4px" />
                  </Flex>
                ) : (
                  renderBookingsTable(filterBookingsByStatus('all'))
                )}
              </TabPanel>
              
              {/* Status-specific tabs */}
              {['pending', 'approved', 'checked_in', 'completed', 'cancelled'].map(status => (
                <TabPanel key={status} px={0}>
                  {loading ? (
                    <Flex justify="center" py={10}>
                      <Spinner size="xl" color="brand.500" thickness="4px" />
                    </Flex>
                  ) : (
                    renderBookingsTable(filterBookingsByStatus(status))
                  )}
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>
    </TenantLayout>
  );
};

export default EnhancedBookingsList;
