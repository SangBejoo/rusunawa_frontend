import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
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
  Select,
  InputGroup,
  Input,
  InputLeftElement,
  Stack,
  HStack,
  VStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Divider,
  Tag,
  TagLabel,
  TagCloseButton,
  Tooltip,
  useBreakpointValue
} from '@chakra-ui/react';
import { 
  FaFileInvoice, 
  FaSearch, 
  FaFilter, 
  FaSortAmountDown, 
  FaSortAmountUp,
  FaEye,
  FaCreditCard,
  FaCheck,
  FaTimes,
  FaClock,
  FaMoneyBill,
  FaReceipt,
  FaChevronDown,
  FaCalendarAlt
} from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import paymentService from '../../services/paymentService';
import { formatCurrency, getStatusColor } from '../../components/helpers/typeConverters';
import { formatDate } from '../../components/helpers/dateFormatter';
import { useTenantAuth } from '../../context/tenantAuthContext';

const InvoicesList = () => {
  const { tenant } = useTenantAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    searchQuery: ''
  });
  const [activeFilters, setActiveFilters] = useState([]);
  const [sortBy, setSortBy] = useState('issued_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // Responsive settings
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // Colors
  const bg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  
  // Fetch invoices data
  useEffect(() => {
    fetchInvoices();
  }, []);
  
  // Fetch invoices with filters
  const fetchInvoices = async () => {
    if (!tenant?.tenantId) {
      console.log('No tenant ID available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Build query parameters based on active filters
      const params = {};
      
      if (activeFilters.find(f => f.key === 'status')) {
        params.status = filters.status;
      }
      
      if (activeFilters.find(f => f.key === 'date')) {
        params.start_date = filters.startDate;
        params.end_date = filters.endDate;
      }
      
      if (activeFilters.find(f => f.key === 'search')) {
        params.search = filters.searchQuery;
      }
      
      // Add sorting parameters
      params.sort_by = sortBy;
      params.sort_direction = sortDirection;
      
      const response = await paymentService.getTenantInvoices(tenant.tenantId);
      
      if (!response || !response.invoices) {
        throw new Error('Failed to fetch invoices');
      }
      
      // Map the invoices to ensure proper field names
      const mappedInvoices = response.invoices.map(invoice => ({
        ...invoice,
        // Use totalAmount if amount is 0 or missing
        amount: invoice.amount || invoice.totalAmount || 0,
        // Map date fields
        issued_at: invoice.createdAt || invoice.issued_at,
        due_date: invoice.dueDate || invoice.due_date,
        // Map ID fields
        invoice_id: invoice.invoiceId || invoice.invoice_id,
        invoice_no: invoice.invoiceNo || invoice.invoice_no,
        booking_id: invoice.bookingId || invoice.booking_id,
        tenant_id: invoice.tenantId || invoice.tenant_id
      }));
      
      setInvoices(mappedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError(error.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };
  
  // Apply filters
  const handleApplyFilters = () => {
    const newFilters = [];
    
    if (filters.status) {
      newFilters.push({
        key: 'status',
        value: filters.status,
        label: `Status: ${filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}`
      });
    }
    
    if (filters.startDate && filters.endDate) {
      newFilters.push({
        key: 'date',
        value: `${filters.startDate} to ${filters.endDate}`,
        label: `Date: ${formatDate(filters.startDate)} to ${formatDate(filters.endDate)}`
      });
    }
    
    if (filters.searchQuery) {
      newFilters.push({
        key: 'search',
        value: filters.searchQuery,
        label: `Search: ${filters.searchQuery}`
      });
    }
    
    setActiveFilters(newFilters);
    fetchInvoices();
  };
  
  // Remove a filter
  const handleRemoveFilter = (key) => {
    setActiveFilters(activeFilters.filter(f => f.key !== key));
    
    if (key === 'status') {
      setFilters(prev => ({ ...prev, status: '' }));
    } else if (key === 'date') {
      setFilters(prev => ({ ...prev, startDate: '', endDate: '' }));
    } else if (key === 'search') {
      setFilters(prev => ({ ...prev, searchQuery: '' }));
    }
    
    // Re-fetch invoices without this filter
    setTimeout(fetchInvoices, 0);
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
    setSortBy('issued_at');
    setSortDirection('desc');
    
    // Re-fetch invoices without filters
    setTimeout(fetchInvoices, 0);
  };
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    
    const searchQuery = e.target.elements.search?.value || '';
    setFilters(prev => ({ ...prev, searchQuery }));
    
    if (searchQuery) {
      setActiveFilters(prev => [
        ...prev.filter(f => f.key !== 'search'),
        { key: 'search', value: searchQuery, label: `Search: ${searchQuery}` }
      ]);
    } else {
      setActiveFilters(prev => prev.filter(f => f.key !== 'search'));
    }
    
    fetchInvoices();
  };
  
  // Toggle sort direction
  const handleToggleSort = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    fetchInvoices();
  };
  
  // Change sort field
  const handleChangeSort = (field) => {
    setSortBy(field);
    fetchInvoices();
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    const color = getStatusColor(status);
    let icon;
    
    switch (status?.toLowerCase()) {
      case 'paid':
        icon = FaCheck;
        break;
      case 'pending':
        icon = FaClock;
        break;
      case 'failed':
        icon = FaTimes;
        break;
      case 'waiting_approval':
        icon = FaReceipt;
        break;
      default:
        icon = FaClock;
    }
    
    return (
      <Badge 
        colorScheme={color} 
        display="flex"
        alignItems="center"
        px={2}
        py={1}
        borderRadius="md"
      >
        <Icon as={icon} mr={1} boxSize={3} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };
  
  // Render mobile view
  const renderMobileView = () => {
    return (
      <VStack spacing={4} align="stretch" w="100%">
        {invoices.length > 0 ? (
          invoices.map(invoice => (
            <Card 
              key={invoice.invoice_id || invoice.invoiceId} 
              bg={bg}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="md"
              transition="all 0.2s"
              _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
            >
              <CardBody>
                <Flex justify="space-between" align="flex-start" mb={3}>
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">Invoice #{invoice.invoice_no || invoice.invoiceNo}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {formatDate(invoice.issued_at || invoice.createdAt)}
                    </Text>
                  </VStack>
                  {getStatusBadge(invoice.status)}
                </Flex>
                
                <Divider my={3} />
                
                <HStack justify="space-between" mb={3}>
                  <Text>Amount</Text>
                  <Text fontWeight="bold" color="brand.500">
                    {formatCurrency(invoice.amount || invoice.totalAmount || 0)}
                  </Text>
                </HStack>
                
                <Flex justify="flex-end" gap={2} mt={4}>
                  <Button 
                    size="sm" 
                    colorScheme="blue" 
                    variant="outline" 
                    leftIcon={<FaEye />}
                    as={RouterLink}
                    to={`/tenant/invoices/${invoice.invoice_id || invoice.invoiceId}`}
                  >
                    View
                  </Button>
                  
                  {(invoice.status?.toLowerCase() === 'pending' || invoice.status?.toLowerCase() === 'unpaid') && (
                    <Button 
                      size="sm" 
                      colorScheme="brand" 
                      leftIcon={<FaCreditCard />}
                      as={RouterLink}
                      to={`/tenant/invoices/${invoice.invoice_id || invoice.invoiceId}`}
                    >
                      Pay
                    </Button>
                  )}
                </Flex>
              </CardBody>
            </Card>
          ))
        ) : (
          <Flex direction="column" align="center" justify="center" py={10}>
            <Icon as={FaFileInvoice} boxSize={12} color="gray.400" mb={4} />
            <Heading size="md" mb={2}>No Invoices Found</Heading>
            <Text align="center" color="gray.500">
              You don't have any invoices matching your criteria.
            </Text>
            {activeFilters.length > 0 && (
              <Button mt={4} onClick={handleClearFilters} size="sm">
                Clear Filters
              </Button>
            )}
          </Flex>
        )}
      </VStack>
    );
  };
  
  // Render desktop view
  const renderDesktopView = () => {
    return (
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Invoice #</Th>
              <Th>
                <Button 
                  variant="ghost" 
                  size="xs" 
                  rightIcon={sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
                  onClick={() => {
                    setSortBy('issued_at');
                    handleToggleSort();
                  }}
                  isActive={sortBy === 'issued_at'}
                >
                  Date
                </Button>
              </Th>
              <Th>Booking</Th>
              <Th>
                <Button 
                  variant="ghost" 
                  size="xs" 
                  rightIcon={sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
                  onClick={() => {
                    setSortBy('amount');
                    handleToggleSort();
                  }}
                  isActive={sortBy === 'amount'}
                >
                  Amount
                </Button>
              </Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {invoices.length > 0 ? (
              invoices.map(invoice => (
                <Tr 
                  key={invoice.invoice_id || invoice.invoiceId}
                  _hover={{ bg: hoverBg }}
                  transition="background-color 0.2s"
                >
                  <Td fontWeight="medium">#{invoice.invoice_no || invoice.invoiceNo}</Td>
                  <Td>{formatDate(invoice.issued_at || invoice.createdAt)}</Td>
                  <Td>
                    {invoice.items && invoice.items.length > 0 ? (
                      <Text noOfLines={1}>
                        {invoice.items[0].description || 'Room Booking'}
                      </Text>
                    ) : invoice.booking ? (
                      <Text noOfLines={1}>
                        {invoice.booking.room?.name || 'Room Booking'}
                      </Text>
                    ) : (
                      <Text color="gray.500">Room Booking</Text>
                    )}
                  </Td>
                  <Td fontWeight="medium" color="brand.500">
                    {formatCurrency(invoice.amount || invoice.totalAmount || 0)}
                  </Td>
                  <Td>{getStatusBadge(invoice.status)}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <Tooltip label="View Invoice Details">
                        <IconButton
                          as={RouterLink}
                          to={`/tenant/invoices/${invoice.invoice_id || invoice.invoiceId}`}
                          icon={<FaEye />}
                          size="sm"
                          aria-label="View invoice"
                          variant="ghost"
                        />
                      </Tooltip>
                      
                      {(invoice.status?.toLowerCase() === 'pending' || invoice.status?.toLowerCase() === 'unpaid') && (
                        <Tooltip label="Pay Invoice">
                          <IconButton
                            as={RouterLink}
                            to={`/tenant/invoices/${invoice.invoice_id || invoice.invoiceId}`}
                            icon={<FaMoneyBill />}
                            size="sm"
                            aria-label="Pay invoice"
                            colorScheme="brand"
                          />
                        </Tooltip>
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={6}>
                  <Flex direction="column" align="center" justify="center" py={10}>
                    <Icon as={FaFileInvoice} boxSize={12} color="gray.400" mb={4} />
                    <Heading size="md" mb={2}>No Invoices Found</Heading>
                    <Text align="center" color="gray.500">
                      You don't have any invoices matching your criteria.
                    </Text>
                    {activeFilters.length > 0 && (
                      <Button mt={4} onClick={handleClearFilters} size="sm">
                        Clear Filters
                      </Button>
                    )}
                  </Flex>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <TenantLayout>
      <Container maxW="container.xl" py={8}>
        <Heading as="h1" size="xl" mb={2} display="flex" alignItems="center">
          <Icon as={FaFileInvoice} mr={3} color="brand.500" />
          My Invoices
        </Heading>
        <Text color="gray.500" mb={6}>
          Manage and pay your invoices
        </Text>
        
        {/* Filters and Search Section */}
        <Card bg={bg} borderWidth="1px" borderColor={borderColor} borderRadius="md" mb={6}>
          <CardBody>
            <Stack spacing={4} direction={{ base: 'column', md: 'row' }}>
              <form onSubmit={handleSearch} style={{ width: '100%' }}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <FaSearch color="gray.300" />
                  </InputLeftElement>
                  <Input 
                    name="search"
                    placeholder="Search invoices..." 
                    defaultValue={filters.searchQuery}
                  />
                  <Button type="submit" ml={2} colorScheme="brand">
                    Search
                  </Button>
                </InputGroup>
              </form>
              
              <Select 
                placeholder="Filter by status"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                width={{ base: '100%', md: '200px' }}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="waiting_approval">Waiting Approval</option>
                <option value="failed">Failed</option>
              </Select>
              
              <Button 
                leftIcon={<FaCalendarAlt />} 
                onClick={handleApplyFilters}
                colorScheme="blue"
              >
                Apply Filters
              </Button>
              
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
        
        {/* Error Message */}
        {error && (
          <Alert status="error" mb={6} borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        {/* Loading Spinner */}
        {loading ? (
          <Flex justify="center" py={10}>
            <Spinner size="xl" color="brand.500" thickness="4px" />
          </Flex>
        ) : (
          /* Invoice List - Responsive for Mobile/Desktop */
          isMobile ? renderMobileView() : renderDesktopView()
        )}
      </Container>
    </TenantLayout>
  );
};

export default InvoicesList;
