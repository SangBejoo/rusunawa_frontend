import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Badge,
  Divider,
  Select,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
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
  useBreakpointValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Image
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  FaFileInvoice, 
  FaCheck, 
  FaTimesCircle, 
  FaClock, 
  FaCalendarAlt, 
  FaDownload, 
  FaMoneyBillWave, 
  FaEye,
  FaSearch,
  FaFilter,
  FaSortAmountDown,
  FaSortAmountUp,
  FaExclamationTriangle,
  FaCreditCard,
  FaFileDownload,
  FaChevronDown,
  FaTimes,
  FaArrowLeft,
  FaExternalLinkAlt,
  FaPrint,
  FaUpload,
  FaHistory
} from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import paymentService from '../../services/paymentService';
import { formatDate } from '../../utils/dateUtils';
import { useTenantAuth } from '../../context/tenantAuthContext';

const InvoiceHistory = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { tenant } = useTenantAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // State management
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('issued_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [activeFilters, setActiveFilters] = useState([]);
  
  // Statistics
  const [stats, setStats] = useState({
    totalInvoices: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueCount: 0
  });

  // Responsive
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // Colors
  const bg = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  const statBg = useColorModeValue('gray.50', 'gray.700');

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'partially_paid', label: 'Partially Paid' },
    { value: 'waiting_approval', label: 'Waiting Approval' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 3 Months' },
    { value: '1y', label: 'Last Year' }
  ];

  // Fetch data on component mount
  useEffect(() => {
    if (tenant?.id) {
      fetchInvoices();
    }
  }, [tenant?.id]);

  // Apply filters whenever filter states change
  useEffect(() => {
    applyFilters();
  }, [invoices, searchTerm, statusFilter, dateFilter, sortBy, sortDirection]);

  // Fetch invoices from API
  const fetchInvoices = async () => {
    if (!tenant?.tenantId) {
      console.log('No tenant ID available');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching invoices for tenant:', tenant.tenantId);
      
      // Use the tenant-specific invoices endpoint
      const response = await paymentService.getTenantInvoices(tenant.tenantId);
      console.log('Invoices response:', response);
      
      if (response?.invoices) {
        // Map invoices to ensure proper field names
        const mappedInvoices = response.invoices.map(invoice => ({
          ...invoice,
          // Use totalAmount if amount is 0 or missing
          amount: invoice.amount || invoice.totalAmount || 0,
          // Map date fields
          issued_at: invoice.createdAt || invoice.issued_at,
          due_date: invoice.dueDate || invoice.due_date,
          paid_at: invoice.paidAt || invoice.paid_at,
          // Map ID fields
          invoice_id: invoice.invoiceId || invoice.invoice_id,
          invoice_no: invoice.invoiceNo || invoice.invoice_no,
          booking_id: invoice.bookingId || invoice.booking_id,
          tenant_id: invoice.tenantId || invoice.tenant_id
        }));
        
        setInvoices(mappedInvoices);
        calculateStats(mappedInvoices);
      } else {
        console.warn('No invoices data in response');
        setInvoices([]);
        setStats({ totalInvoices: 0, paidAmount: 0, pendingAmount: 0, overdueCount: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      setError('Failed to load invoices. Please try again later.');
      setInvoices([]);
      setStats({ totalInvoices: 0, paidAmount: 0, pendingAmount: 0, overdueCount: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (invoiceList) => {
    const now = new Date();
    
    const totalInvoices = invoiceList.length;
    const paidAmount = invoiceList
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);
    
    const pendingAmount = invoiceList
      .filter(inv => ['unpaid', 'partially_paid', 'pending'].includes(inv.status))
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);
    
    const overdueCount = invoiceList
      .filter(inv => (inv.status === 'unpaid' || inv.status === 'pending') && new Date(inv.due_date) < now)
      .length;

    setStats({
      totalInvoices,
      paidAmount,
      pendingAmount,
      overdueCount
    });
  };

  // Apply filters and sorting
  const applyFilters = () => {
    let filtered = [...invoices];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoice_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.booking?.room?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'overdue') {
        filtered = filtered.filter(invoice => 
          invoice.status === 'unpaid' && new Date(invoice.due_date) < new Date()
        );
      } else {
        filtered = filtered.filter(invoice => invoice.status === statusFilter);
      }
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate;

      switch (dateFilter) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        filtered = filtered.filter(invoice => 
          new Date(invoice.issued_at) >= startDate
        );
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'issued_at':
          aValue = new Date(a.issued_at);
          bValue = new Date(b.issued_at);
          break;
        case 'due_date':
          aValue = new Date(a.due_date);
          bValue = new Date(b.due_date);
          break;
        case 'amount':
          aValue = a.amount || 0;
          bValue = b.amount || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.invoice_no;
          bValue = b.invoice_no;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredInvoices(filtered);
    updateActiveFilters();
  };

  // Update active filters display
  const updateActiveFilters = () => {
    const filters = [];
    
    if (searchTerm) {
      filters.push({
        key: 'search',
        label: `Search: ${searchTerm}`,
        value: searchTerm
      });
    }
    
    if (statusFilter !== 'all') {
      filters.push({
        key: 'status',
        label: `Status: ${statusOptions.find(opt => opt.value === statusFilter)?.label}`,
        value: statusFilter
      });
    }
    
    if (dateFilter !== 'all') {
      filters.push({
        key: 'date',
        label: `Date: ${dateOptions.find(opt => opt.value === dateFilter)?.label}`,
        value: dateFilter
      });
    }
    
    setActiveFilters(filters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    setSortBy('issued_at');
    setSortDirection('desc');
    setActiveFilters([]);
  };

  // Remove specific filter
  const removeFilter = (filterKey) => {
    switch (filterKey) {
      case 'search':
        setSearchTerm('');
        break;
      case 'status':
        setStatusFilter('all');
        break;
      case 'date':
        setDateFilter('all');
        break;
    }
  };

  // Handle invoice actions
  const handleViewInvoice = (invoice) => {
    navigate(`/tenant/invoices/${invoice.invoice_id}`);
  };

  const handlePayInvoice = (invoice) => {
    navigate(`/tenant/payments/process/${invoice.invoice_id}`);
  };

  const handleDownloadInvoice = async (invoice) => {
    try {
      toast({
        title: 'Downloading invoice...',
        status: 'info',
        duration: 2000,
      });
      
      // Implementation for invoice download using invoiceService
      await invoiceService.downloadInvoice(invoice.invoice_id);
      
      toast({
        title: 'Invoice downloaded successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: 'Download failed',
        description: 'Unable to download invoice. Please try again.',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const openInvoiceDetails = (invoice) => {
    setSelectedInvoice(invoice);
    onOpen();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Get status badge color and icon
  const getStatusInfo = (status, dueDate) => {
    const isOverdue = status === 'unpaid' && new Date(dueDate) < new Date();
    
    if (isOverdue) {
      return { color: 'red', icon: FaExclamationTriangle, text: 'Overdue' };
    }

    switch (status?.toLowerCase()) {
      case 'paid':
        return { color: 'green', icon: FaCheck, text: 'Paid' };
      case 'unpaid':
        return { color: 'yellow', icon: FaClock, text: 'Unpaid' };
      case 'partially_paid':
        return { color: 'orange', icon: FaClock, text: 'Partially Paid' };
      case 'waiting_approval':
        return { color: 'blue', icon: FaClock, text: 'Waiting Approval' };
      case 'cancelled':
        return { color: 'gray', icon: FaTimes, text: 'Cancelled' };
      default:
        return { color: 'gray', icon: FaClock, text: status };
    }
  };

  // Render status badge
  const renderStatusBadge = (status, dueDate) => {
    const statusInfo = getStatusInfo(status, dueDate);
    
    return (
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
    );
  };

  // Render mobile card view
  const renderMobileView = () => (
    <VStack spacing={4} align="stretch">
      {filteredInvoices.map((invoice) => {
        const statusInfo = getStatusInfo(invoice.status, invoice.due_date);
        const isOverdue = statusInfo.text === 'Overdue';
        
        return (
          <Card
            key={invoice.invoice_id}
            bg={cardBg}
            borderWidth="1px"
            borderColor={isOverdue ? 'red.300' : borderColor}
            borderRadius="lg"
            overflow="hidden"
            transition="all 0.2s"
            _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
            onClick={() => openInvoiceDetails(invoice)}
            cursor="pointer"
          >
            <CardBody p={4}>
              <Flex justify="space-between" align="flex-start" mb={3}>
                <VStack align="flex-start" spacing={1}>
                  <Text fontWeight="bold" fontSize="lg">
                    #{invoice.invoice_no || invoice.invoiceNo}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {formatDate(invoice.issued_at)}
                  </Text>
                </VStack>
                {renderStatusBadge(invoice.status, invoice.due_date)}
              </Flex>

              <Divider my={3} />

              <VStack align="stretch" spacing={2}>
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.500">Amount</Text>
                  <Text fontWeight="bold" color="brand.500">
                    {formatCurrency(invoice.amount)}
                  </Text>
                </Flex>
                
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.500">Due Date</Text>
                  <Text 
                    fontWeight="medium"
                    color={isOverdue ? 'red.500' : 'inherit'}
                  >
                    {formatDate(invoice.due_date)}
                  </Text>
                </Flex>

                {invoice.booking?.room && (
                  <Flex justify="space-between">
                    <Text fontSize="sm" color="gray.500">Room</Text>
                    <Text fontWeight="medium">
                      {invoice.booking.room.name}
                    </Text>
                  </Flex>
                )}
              </VStack>

              <Divider my={3} />

              <HStack spacing={2} justify="flex-end">
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<FaEye />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewInvoice(invoice);
                  }}
                >
                  View
                </Button>
                
                {invoice.status === 'unpaid' && (
                  <Button
                    size="sm"
                    colorScheme="brand"
                    leftIcon={<FaCreditCard />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePayInvoice(invoice);
                    }}
                  >
                    Pay
                  </Button>
                )}
                
                {invoice.status === 'paid' && (
                  <IconButton
                    size="sm"
                    variant="outline"
                    icon={<FaDownload />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadInvoice(invoice);
                    }}
                    aria-label="Download"
                  />
                )}
              </HStack>
            </CardBody>
          </Card>
        );
      })}
    </VStack>
  );

  // Render desktop table view
  const renderDesktopView = () => (
    <TableContainer>
      <Table variant="simple">
        <Thead bg={useColorModeValue('gray.50', 'gray.600')}>
          <Tr>
            <Th>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={sortBy === 'invoice_no' && (sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
                onClick={() => {
                  setSortBy('invoice_no');
                  setSortDirection(sortBy === 'invoice_no' && sortDirection === 'asc' ? 'desc' : 'asc');
                }}
              >
                Invoice #
              </Button>
            </Th>
            <Th>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={sortBy === 'issued_at' && (sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
                onClick={() => {
                  setSortBy('issued_at');
                  setSortDirection(sortBy === 'issued_at' && sortDirection === 'asc' ? 'desc' : 'asc');
                }}
              >
                Date Issued
              </Button>
            </Th>
            <Th>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={sortBy === 'due_date' && (sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
                onClick={() => {
                  setSortBy('due_date');
                  setSortDirection(sortBy === 'due_date' && sortDirection === 'asc' ? 'desc' : 'asc');
                }}
              >
                Due Date
              </Button>
            </Th>
            <Th>Room/Booking</Th>
            <Th>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={sortBy === 'amount' && (sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
                onClick={() => {
                  setSortBy('amount');
                  setSortDirection(sortBy === 'amount' && sortDirection === 'asc' ? 'desc' : 'asc');
                }}
              >
                Amount
              </Button>
            </Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredInvoices.map((invoice) => {
            const isOverdue = invoice.status === 'unpaid' && new Date(invoice.due_date) < new Date();
            
            return (              <Tr
                key={invoice.invoice_id}
                _hover={{ bg: hoverBg }}
                bg={isOverdue ? useColorModeValue('red.50', 'red.900') : 'inherit'}
              >
                <Td>
                  <VStack align="flex-start" spacing={1}>
                    <Text fontWeight="bold">#{invoice.invoice_no}</Text>
                    <Text fontSize="xs" color="gray.500">
                      ID: {invoice.invoice_id}
                    </Text>
                  </VStack>
                </Td>
                <Td>{formatDate(invoice.issued_at)}</Td>
                <Td>
                  <Text color={isOverdue ? 'red.500' : 'inherit'}>
                    {formatDate(invoice.due_date)}
                  </Text>
                  {isOverdue && (
                    <Text fontSize="xs" color="red.500" fontWeight="bold">
                      OVERDUE
                    </Text>
                  )}
                </Td>
                <Td>
                  {invoice.booking?.room ? (
                    <VStack align="flex-start" spacing={1}>
                      <Text fontWeight="medium">{invoice.booking.room.name}</Text>
                      <Text fontSize="xs" color="gray.500">
                        Booking #{invoice.booking.booking_id}
                      </Text>
                    </VStack>
                  ) : (
                    <Text color="gray.500">-</Text>
                  )}
                </Td>
                <Td>
                  <Text fontWeight="bold" color="brand.500">
                    {formatCurrency(invoice.amount)}
                  </Text>
                </Td>
                <Td>{renderStatusBadge(invoice.status, invoice.due_date)}</Td>
                <Td>
                  <HStack spacing={1}>
                    <Tooltip label="View Details">
                      <IconButton
                        size="sm"
                        variant="ghost"
                        icon={<FaEye />}
                        onClick={() => handleViewInvoice(invoice)}
                        aria-label="View details"
                      />
                    </Tooltip>
                    
                    {invoice.status === 'unpaid' && (
                      <Tooltip label="Pay Now">
                        <IconButton
                          size="sm"
                          colorScheme="brand"
                          variant="ghost"
                          icon={<FaCreditCard />}
                          onClick={() => handlePayInvoice(invoice)}
                          aria-label="Pay invoice"
                        />
                      </Tooltip>
                    )}
                    
                    {invoice.status === 'paid' && (
                      <Tooltip label="Download Receipt">
                        <IconButton
                          size="sm"
                          variant="ghost"
                          icon={<FaDownload />}
                          onClick={() => handleDownloadInvoice(invoice)}
                          aria-label="Download receipt"
                        />
                      </Tooltip>
                    )}
                    
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        size="sm"
                        variant="ghost"
                        icon={<FaChevronDown />}
                        aria-label="More actions"
                      />
                      <MenuList>
                        <MenuItem
                          icon={<FaEye />}
                          onClick={() => openInvoiceDetails(invoice)}
                        >
                          View Details
                        </MenuItem>
                        {invoice.payment_link_url && (
                          <MenuItem
                            icon={<FaExternalLinkAlt />}
                            onClick={() => window.open(invoice.payment_link_url, '_blank')}
                          >
                            Open Payment Link
                          </MenuItem>
                        )}
                        <MenuItem
                          icon={<FaPrint />}
                          onClick={() => handleDownloadInvoice(invoice)}
                        >
                          Print Invoice
                        </MenuItem>
                        <MenuDivider />
                        <MenuItem
                          icon={<FaHistory />}
                          onClick={() => navigate(`/tenant/payments/history?invoice=${invoice.invoice_id}`)}
                        >
                          Payment History
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </HStack>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );  if (loading) {
    return (
      <TenantLayout>
        <Container maxW="container.xl" py={8}>
          <Flex justify="center" align="center" minH="400px">
            <VStack spacing={4}>
              <Spinner size="xl" color="brand.500" thickness="4px" />
              <Text>Loading invoices...</Text>
            </VStack>
          </Flex>
        </Container>
      </TenantLayout>
    );
  }

  if (error) {
    return (
      <TenantLayout>
        <Container maxW="container.xl" py={8}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Error Loading Invoices</Text>
              <Text>{error}</Text>
            </Box>
          </Alert>
          <Button mt={4} onClick={fetchInvoices}>
            Try Again
          </Button>
        </Container>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Container maxW="container.xl" py={8}>
        {/* Header */}
        <Flex 
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'flex-start', md: 'center' }}
          mb={8}
        >
          <Box>
            <Heading as="h1" size="xl" mb={2} display="flex" alignItems="center">
              <Icon as={FaFileInvoice} mr={3} color="brand.500" />
              Invoice History
            </Heading>
            <Text color="gray.500">
              Manage your invoices and payment history
            </Text>
          </Box>
          
          <Button
            leftIcon={<FaArrowLeft />}
            variant="outline"
            onClick={() => navigate('/tenant/dashboard')}
            mt={{ base: 4, md: 0 }}
          >
            Back to Dashboard
          </Button>
        </Flex>

        {/* Statistics Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
          <Card bg={statBg} borderRadius="lg">
            <CardBody>
              <Stat>
                <StatLabel>Total Invoices</StatLabel>
                <StatNumber>{stats.totalInvoices}</StatNumber>
                <StatHelpText>All time</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={statBg} borderRadius="lg">
            <CardBody>
              <Stat>
                <StatLabel>Paid Amount</StatLabel>
                <StatNumber color="green.500">
                  {formatCurrency(stats.paidAmount)}
                </StatNumber>
                <StatHelpText>Successfully paid</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={statBg} borderRadius="lg">
            <CardBody>
              <Stat>
                <StatLabel>Pending Amount</StatLabel>
                <StatNumber color="orange.500">
                  {formatCurrency(stats.pendingAmount)}
                </StatNumber>
                <StatHelpText>Awaiting payment</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={statBg} borderRadius="lg">
            <CardBody>
              <Stat>
                <StatLabel>Overdue</StatLabel>
                <StatNumber color="red.500">{stats.overdueCount}</StatNumber>
                <StatHelpText>
                  {stats.overdueCount > 0 ? 'Requires attention' : 'All up to date'}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filters and Search */}
        <Card bg={bg} borderWidth="1px" borderColor={borderColor} mb={6}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              {/* Search and Primary Filters */}
              <Flex 
                direction={{ base: 'column', md: 'row' }}
                gap={4}
                align="flex-end"
              >
                <Box flex="1">
                  <Text fontSize="sm" fontWeight="medium" mb={2}>Search</Text>
                  <InputGroup>
                    <InputLeftElement>
                      <FaSearch color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search by invoice number, ID, or notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Box>
                
                <Box minW="150px">
                  <Text fontSize="sm" fontWeight="medium" mb={2}>Status</Text>
                  <Select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Box>
                
                <Box minW="150px">
                  <Text fontSize="sm" fontWeight="medium" mb={2}>Date Range</Text>
                  <Select 
                    value={dateFilter} 
                    onChange={(e) => setDateFilter(e.target.value)}
                  >
                    {dateOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Box>
                
                <Button
                  colorScheme="red"
                  variant="outline"
                  leftIcon={<FaTimes />}
                  onClick={clearAllFilters}
                  isDisabled={activeFilters.length === 0}
                >
                  Clear All
                </Button>
              </Flex>

              {/* Active Filters Display */}
              {activeFilters.length > 0 && (
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>Active Filters:</Text>
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
                        <TagCloseButton onClick={() => removeFilter(filter.key)} />
                      </Tag>
                    ))}
                  </Flex>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Results Summary */}
        <Box mb={6}>
          <Text color="gray.600">
            Showing {filteredInvoices.length} of {invoices.length} invoices
            {activeFilters.length > 0 && (
              <Text as="span" ml={2} fontSize="sm">
                (filtered)
              </Text>
            )}
          </Text>
        </Box>

        {/* Invoice List */}
        <Card bg={bg} borderWidth="1px" borderColor={borderColor}>
          <CardBody p={0}>
            {filteredInvoices.length === 0 ? (
              <VStack py={16} spacing={4}>
                <Icon as={FaFileInvoice} boxSize="48px" color="gray.400" />
                <Text fontSize="lg" fontWeight="medium" color="gray.500">
                  No invoices found
                </Text>
                <Text color="gray.400" textAlign="center">
                  {activeFilters.length > 0
                    ? 'Try adjusting your filters to see more results'
                    : 'You don\'t have any invoices yet'}
                </Text>
                {activeFilters.length > 0 && (
                  <Button onClick={clearAllFilters} size="sm">
                    Clear Filters
                  </Button>
                )}
              </VStack>
            ) : (
              <Box p={6}>
                {isMobile ? renderMobileView() : renderDesktopView()}
              </Box>
            )}
          </CardBody>
        </Card>

        {/* Invoice Details Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack>
                <Icon as={FaFileInvoice} color="brand.500" />
                <Text>Invoice Details</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedInvoice && (
                <VStack spacing={6} align="stretch">
                  {/* Invoice Header */}
                  <Flex justify="space-between" align="flex-start">
                    <VStack align="flex-start" spacing={1}>
                      <Text fontSize="xl" fontWeight="bold">
                        #{selectedInvoice.invoice_no || selectedInvoice.invoiceNo}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        ID: {selectedInvoice.invoice_id || selectedInvoice.invoiceId}
                      </Text>
                    </VStack>
                    {renderStatusBadge(selectedInvoice.status, selectedInvoice.due_date)}
                  </Flex>

                  <Divider />

                  {/* Invoice Details Grid */}
                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={1}>Issue Date</Text>
                      <Text fontWeight="medium">{formatDate(selectedInvoice.issued_at)}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={1}>Due Date</Text>
                      <Text 
                        fontWeight="medium"
                        color={selectedInvoice.status === 'unpaid' && new Date(selectedInvoice.due_date) < new Date() ? 'red.500' : 'inherit'}
                      >
                        {formatDate(selectedInvoice.due_date)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={1}>Amount</Text>
                      <Text fontWeight="bold" fontSize="lg" color="brand.500">
                        {formatCurrency(selectedInvoice.amount)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={1}>Payment Method</Text>
                      <Text fontWeight="medium">
                        {selectedInvoice.payment_method || 'Bank Transfer'}
                      </Text>
                    </Box>
                  </SimpleGrid>

                  {/* Booking Details */}
                  {selectedInvoice.booking && (
                    <>
                      <Divider />
                      <Box>
                        <Text fontSize="lg" fontWeight="bold" mb={3}>
                          Booking Details
                        </Text>
                        <SimpleGrid columns={2} spacing={4}>
                          <Box>
                            <Text fontSize="sm" color="gray.500" mb={1}>Room</Text>
                            <Text fontWeight="medium">
                              {selectedInvoice.booking.room?.name || 'Unknown Room'}
                            </Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.500" mb={1}>Booking ID</Text>
                            <Text fontWeight="medium">
                              #{selectedInvoice.booking.booking_id}
                            </Text>
                          </Box>
                          {selectedInvoice.booking.check_in && (
                            <Box>
                              <Text fontSize="sm" color="gray.500" mb={1}>Check-in</Text>
                              <Text fontWeight="medium">
                                {formatDate(selectedInvoice.booking.check_in)}
                              </Text>
                            </Box>
                          )}
                          {selectedInvoice.booking.check_out && (
                            <Box>
                              <Text fontSize="sm" color="gray.500" mb={1}>Check-out</Text>
                              <Text fontWeight="medium">
                                {formatDate(selectedInvoice.booking.check_out)}
                              </Text>
                            </Box>
                          )}
                        </SimpleGrid>
                      </Box>
                    </>
                  )}

                  {/* Payment Receipt */}
                  {selectedInvoice.status === 'paid' && selectedInvoice.receipt_url && (
                    <>
                      <Divider />
                      <Box>
                        <Text fontSize="lg" fontWeight="bold" mb={3}>
                          Payment Receipt
                        </Text>
                        <Image
                          src={selectedInvoice.receipt_url}
                          alt="Payment Receipt"
                          borderRadius="md"
                          maxH="300px"
                          mx="auto"
                        />
                      </Box>
                    </>
                  )}

                  {/* Notes */}
                  {selectedInvoice.notes && (
                    <>
                      <Divider />
                      <Box>
                        <Text fontSize="lg" fontWeight="bold" mb={3}>Notes</Text>
                        <Box
                          p={3}
                          bg={useColorModeValue('gray.50', 'gray.600')}
                          borderRadius="md"
                        >
                          <Text>{selectedInvoice.notes}</Text>
                        </Box>
                      </Box>
                    </>
                  )}
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <HStack spacing={3}>
                <Button variant="ghost" onClick={onClose}>
                  Close
                </Button>
                {selectedInvoice && (
                  <>
                    {selectedInvoice.status === 'unpaid' && (
                      <Button
                        colorScheme="brand"
                        leftIcon={<FaCreditCard />}
                        onClick={() => {
                          onClose();
                          handlePayInvoice(selectedInvoice);
                        }}
                      >
                        Pay Now
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      leftIcon={<FaEye />}
                      onClick={() => {
                        onClose();
                        handleViewInvoice(selectedInvoice);
                      }}
                    >
                      View Full Details
                    </Button>
                  </>
                )}
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </TenantLayout>
  );
};

export default InvoiceHistory;
