import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Stack,
  Select,
  HStack,
  Badge,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Icon,
  Flex,
  useColorModeValue,
  useBreakpointValue,
  InputGroup,
  InputLeftElement,
  Input,
  Menu,
  MenuButton,
  MenuList,
  VStack,
  Tag,
  TagLabel,
  TagCloseButton
} from '@chakra-ui/react';
import { FaCalendar, FaCheckCircle, FaTimesCircle, FaSpinner, FaHotel, FaCalendarAlt, FaSearch, FaChevronDown, FaFilter } from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import bookingService from '../../services/bookingService';
import tenantAuthService from '../../services/tenantAuthService';
import { formatDate } from '../../components/helpers/dateFormatter';
import { formatCurrency } from '../../components/helpers/typeConverters';

const BookingsList = () => {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    searchQuery: ''
  });
  const [activeFilters, setActiveFilters] = useState([]);

  // Responsive settings
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const highlightColor = useColorModeValue('brand.50', 'brand.900');

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  // Fetch bookings data
  const fetchBookings = async () => {
    try {
      setLoading(true);

      // Get current tenant ID from auth context
      const currentTenant = tenantAuthService.getCurrentTenant();
      if (!currentTenant?.tenantId) {
        throw new Error('No authenticated tenant found');
      }

      // Build query parameters
      const params = {};

      // Filter by status based on active tab
      if (activeTab !== 'all') {
        params.status = activeTab;
      }

      // Add other filters if they exist
      if (activeFilters.find(f => f.key === 'date')) {
        params.start_date = filters.startDate;
        params.end_date = filters.endDate;
      }

      if (activeFilters.find(f => f.key === 'search')) {
        params.search = filters.searchQuery;
      }

      const response = await bookingService.getTenantBookings(currentTenant.tenantId, params);
      
      if (!response || !response.bookings) {
        throw new Error('Failed to fetch bookings');
      }
      
      setBookings(response.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError(error.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (index) => {
    const tabValues = ['all', 'pending', 'approved', 'checked_in', 'completed', 'cancelled', 'rejected'];
    setActiveTab(tabValues[index]);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    const searchQuery = e.target.elements.search.value;
    
    // Update filters
    setFilters(prev => ({ ...prev, searchQuery }));
    
    // Update active filters
    if (searchQuery) {
      setActiveFilters(prev => [
        ...prev.filter(f => f.key !== 'search'),
        { key: 'search', value: searchQuery, label: `Search: ${searchQuery}` }
      ]);
    } else {
      setActiveFilters(prev => prev.filter(f => f.key !== 'search'));
    }
    
    fetchBookings();
  };

  // Handle date filter
  const handleApplyDateFilter = () => {
    if (filters.startDate && filters.endDate) {
      setActiveFilters(prev => [
        ...prev.filter(f => f.key !== 'date'),
        { 
          key: 'date', 
          value: `${filters.startDate} to ${filters.endDate}`, 
          label: `Date: ${formatDate(filters.startDate)} to ${formatDate(filters.endDate)}` 
        }
      ]);
      
      fetchBookings();
    }
  };

  // Remove a filter
  const handleRemoveFilter = (key) => {
    setActiveFilters(activeFilters.filter(f => f.key !== key));
    
    if (key === 'date') {
      setFilters(prev => ({ ...prev, startDate: '', endDate: '' }));
    } else if (key === 'search') {
      setFilters(prev => ({ ...prev, searchQuery: '' }));
    }
    
    // Re-fetch bookings without this filter
    setTimeout(fetchBookings, 0);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      searchQuery: ''
    });
    setActiveFilters([]);
    
    // Re-fetch bookings without filters
    setTimeout(fetchBookings, 0);
  };

  // Get status color based on booking status
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'yellow';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'cancelled': return 'red';
      case 'completed': return 'blue';
      default: return 'gray';
    }
  };
  
  // Format booking status for display
  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    const formatted = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    return formatted;
  };

  // Colors for cards
  const cardHeaderBg = useColorModeValue('gray.50', 'gray.700');

  // Render bookings list
  const renderBookings = (bookings) => {
    if (!bookings || bookings.length === 0) {
      return (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          No bookings found.
        </Alert>
      );
    }

    return (
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {bookings.map((booking) => (
          <Card 
            key={booking.bookingId} 
            variant="outline" 
            borderColor={borderColor}
            _hover={{ 
              shadow: 'md', 
              transform: 'translateY(-2px)',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <CardHeader bg={cardHeaderBg} pb={3}>
              <HStack justifyContent="space-between">
                <Heading size="sm">Booking #{booking.bookingId}</Heading>
                <Badge colorScheme={getStatusColor(booking.status)}>
                  {formatStatus(booking.status)}
                </Badge>
              </HStack>
            </CardHeader>
            
            <CardBody>
              <Stack spacing={3}>
                <HStack>
                  <Icon as={FaHotel} />
                  <Text fontWeight="medium">{booking.room?.name || `Room #${booking.roomId}`}</Text>
                </HStack>
                
                <HStack>
                  <Icon as={FaCalendar} />
                  <Text>{formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}</Text>
                </HStack>
                
                <Text fontWeight="bold">
                  {formatCurrency(booking.totalAmount)}
                </Text>
              </Stack>
            </CardBody>
            
            <CardFooter pt={0}>
              <Button
                as={RouterLink}
                to={`/tenant/bookings/${booking.bookingId}`}
                colorScheme="brand"
                variant="outline"
                width="100%"
              >
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </SimpleGrid>
    );
  };

  return (
    <TenantLayout>
      <Container maxW="container.xl" py={8}>
        <Heading as="h1" size="xl" mb={2} display="flex" alignItems="center">
          <Icon as={FaCalendarAlt} mr={3} color="brand.500" />
          My Bookings
        </Heading>
        <Text color="gray.500" mb={6}>
          Manage all your room bookings
        </Text>
        
        {/* Filters and Search Section */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="md" mb={6}>
          <CardBody>
            <Stack spacing={4} direction={{ base: 'column', md: 'row' }}>
              <form onSubmit={handleSearch} style={{ width: '100%' }}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <FaSearch color="gray.300" />
                  </InputLeftElement>
                  <Input 
                    name="search"
                    placeholder="Search bookings..." 
                    defaultValue={filters.searchQuery}
                  />
                  <Button type="submit" ml={2} colorScheme="brand">
                    Search
                  </Button>
                </InputGroup>
              </form>
              
              <Menu>
                <MenuButton as={Button} rightIcon={<FaChevronDown />} leftIcon={<FaFilter />}>
                  Date Filter
                </MenuButton>
                <MenuList p={4} minW="320px">
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Text mb={2} fontWeight="medium">Date Range</Text>
                      <HStack spacing={2}>
                        <Box>
                          <Text fontSize="sm">From</Text>
                          <Input 
                            type="date" 
                            size="sm" 
                            value={filters.startDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                          />
                        </Box>
                        <Box>
                          <Text fontSize="sm">To</Text>
                          <Input 
                            type="date" 
                            size="sm" 
                            value={filters.endDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                          />
                        </Box>
                      </HStack>
                    </Box>
                    <Button colorScheme="brand" size="sm" onClick={handleApplyDateFilter}>
                      Apply Date Filter
                    </Button>
                  </VStack>
                </MenuList>
              </Menu>
              
              {activeFilters.length > 0 && (
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
            </Stack>
            
            {/* Active Filters Tags */}
            {activeFilters.length > 0 && (
              <Flex wrap="wrap" gap={2} mt={4}>
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
          </CardBody>
        </Card>

        {/* Booking Status Tabs */}
        <Tabs 
          mb={6} 
          onChange={handleTabChange} 
          variant="soft-rounded" 
          colorScheme="brand"
          isLazy
        >
          <TabList overflowX="auto" py={2} css={{
            scrollbarWidth: 'none',
            '::-webkit-scrollbar': { display: 'none' },
            whiteSpace: 'nowrap'
          }}>
            <Tab>All</Tab>
            <Tab>Pending</Tab>
            <Tab>Approved</Tab>
            <Tab>Checked In</Tab>
            <Tab>Completed</Tab>
            <Tab>Cancelled</Tab>
            <Tab>Rejected</Tab>
          </TabList>
          
          <TabPanels>
            {/* All Bookings */}
            <TabPanel px={0}>
              {loading ? (
                <Flex justify="center" py={10}>
                  <Spinner size="xl" color="brand.500" thickness="4px" />
                </Flex>
              ) : error ? (
                <Alert status="error" mb={6} borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              ) : (
                renderBookings(bookings)
              )}
            </TabPanel>
            
            {/* Pending Bookings */}
            <TabPanel px={0}>
              {loading ? (
                <Flex justify="center" py={10}>
                  <Spinner size="xl" color="brand.500" thickness="4px" />
                </Flex>
              ) : error ? (
                <Alert status="error" mb={6} borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              ) : (
                renderBookings(bookings.filter(b => b.status === 'pending'))
              )}
            </TabPanel>
            
            {/* Approved Bookings */}
            <TabPanel px={0}>
              {loading ? (
                <Flex justify="center" py={10}>
                  <Spinner size="xl" color="brand.500" thickness="4px" />
                </Flex>
              ) : error ? (
                <Alert status="error" mb={6} borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              ) : (
                renderBookings(bookings.filter(b => b.status === 'approved'))
              )}
            </TabPanel>
            
            {/* Checked In Bookings */}
            <TabPanel px={0}>
              {loading ? (
                <Flex justify="center" py={10}>
                  <Spinner size="xl" color="brand.500" thickness="4px" />
                </Flex>
              ) : error ? (
                <Alert status="error" mb={6} borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              ) : (
                renderBookings(bookings.filter(b => b.status === 'checked_in'))
              )}
            </TabPanel>
            
            {/* Completed Bookings */}
            <TabPanel px={0}>
              {loading ? (
                <Flex justify="center" py={10}>
                  <Spinner size="xl" color="brand.500" thickness="4px" />
                </Flex>
              ) : error ? (
                <Alert status="error" mb={6} borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              ) : (
                renderBookings(bookings.filter(b => b.status === 'completed'))
              )}
            </TabPanel>
            
            {/* Cancelled Bookings */}
            <TabPanel px={0}>
              {loading ? (
                <Flex justify="center" py={10}>
                  <Spinner size="xl" color="brand.500" thickness="4px" />
                </Flex>
              ) : error ? (
                <Alert status="error" mb={6} borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              ) : (
                renderBookings(bookings.filter(b => b.status === 'cancelled'))
              )}
            </TabPanel>
            
            {/* Rejected Bookings */}
            <TabPanel px={0}>
              {loading ? (
                <Flex justify="center" py={10}>
                  <Spinner size="xl" color="brand.500" thickness="4px" />
                </Flex>
              ) : error ? (
                <Alert status="error" mb={6} borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              ) : (
                renderBookings(bookings.filter(b => b.status === 'rejected'))
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </TenantLayout>
  );
};

export default BookingsList;
