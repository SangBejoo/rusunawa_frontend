import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Input,
  Select,
  Card,
  CardBody,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  useColorModeValue,
  IconButton,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Image,
  Divider
} from '@chakra-ui/react';
import {
  FaSearch,
  FaDownload,
  FaEye,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaFileInvoice,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaReceipt,
  FaHistory,
  FaSync,
  FaPlus
} from 'react-icons/fa';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import TenantLayout from '../../components/layout/TenantLayout';
import paymentService from '../../services/paymentService';
import invoiceService from '../../services/invoiceService';
import { formatCurrency } from '../../components/helpers/typeConverters';
import { formatDate, formatDateTime } from '../../components/helpers/dateFormatter';
import { useTenantAuth } from '../../context/tenantAuthContext';

const PaymentHistory = () => {
  const [paymentData, setPaymentData] = useState({ 
    payments: [], 
    invoices: [],
    stats: {
      totalPaid: 0,
      pendingAmount: 0,
      totalTransactions: 0,
      averageAmount: 0
    }
  });
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { tenant } = useTenantAuth();
  const navigate = useNavigate();
  const toast = useToast();
    // Colors for UI
  const boxBgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  
  // Filter options
  const dateFilters = [
    { value: 'all', label: 'All Time' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 3 Months' },
    { value: '1y', label: 'Last Year' }
  ];
  
  // Fetch data from services
  useEffect(() => {
    const fetchData = async () => {
      if (!tenant?.tenantId) {
        console.log('No tenant ID available');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('Fetching payment history for tenant:', tenant.tenantId);

        // Fetch payments using the correct endpoint
        const paymentsResponse = await paymentService.getTenantPayments(tenant.tenantId);
        console.log('Payments response:', paymentsResponse);

        // Fetch invoices using the correct endpoint  
        const invoicesResponse = await paymentService.getTenantInvoices(tenant.tenantId);
        console.log('Invoices response:', invoicesResponse);

        // Process the data and map field names correctly
        const rawPayments = paymentsResponse.payments || [];
        const rawInvoices = invoicesResponse.invoices || [];
        
        // Map payments to consistent field structure
        const payments = rawPayments.map(payment => ({
          ...payment,
          // Map ID fields
          payment_id: payment.paymentId || payment.payment_id,
          invoice_id: payment.invoiceId || payment.invoice_id,
          booking_id: payment.bookingId || payment.booking_id,
          tenant_id: payment.tenantId || payment.tenant_id,
          transaction_id: payment.transactionId || payment.transaction_id,
          // Map status and method fields
          payment_method: payment.paymentMethod || payment.payment_method || 'Bank Transfer',
          payment_channel: payment.paymentChannel || payment.payment_channel || 'unknown',
          // Map date fields
          created_at: payment.createdAt || payment.created_at,
          updated_at: payment.updatedAt || payment.updated_at,
          paid_at: payment.paidAt || payment.paid_at,
          // Keep amount as is (it's correct in the response)
          amount: payment.amount || 0
        }));
        
        // Map invoices to consistent field structure
        const invoices = rawInvoices.map(invoice => ({
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

        // Calculate statistics using the correct amount field and status
        const stats = {
          totalPaid: payments
            .filter(p => p.status === 'verified' || p.status === 'success')
            .reduce((sum, p) => sum + (p.amount || 0), 0),
          pendingAmount: payments
            .filter(p => p.status === 'pending' || p.status === 'waiting_approval')
            .reduce((sum, p) => sum + (p.amount || 0), 0),
          totalTransactions: payments.length,
          averageAmount: payments.length > 0 
            ? payments.reduce((sum, p) => sum + (p.amount || 0), 0) / payments.length 
            : 0
        };

        setPaymentData({
          payments,
          invoices,
          stats
        });

      } catch (error) {
        console.error('Error fetching payment history:', error);
        setError(error.message || 'Failed to load payment history');
        
        // Set empty data on error
        setPaymentData({
          payments: [],
          invoices: [],
          stats: {
            totalPaid: 0,
            pendingAmount: 0,
            totalTransactions: 0,
            averageAmount: 0
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenant?.tenantId]);
  
  useEffect(() => {
    filterPayments();
  }, [paymentData.payments, searchTerm, statusFilter, dateFilter]);
  
  const fetchPaymentHistory = async () => {
    if (!tenant?.tenantId) return;
    
    setLoading(true);
    try {
      // Fetch payments using tenant-specific endpoint
      const paymentsResponse = await paymentService.getTenantPayments(tenant.tenantId);
      // Fetch invoices using tenant-specific endpoint
      const invoicesResponse = await paymentService.getTenantInvoices(tenant.tenantId);
      
      const payments = paymentsResponse.payments || [];
      const invoices = invoicesResponse.invoices || [];
      
      // Calculate stats
      const stats = calculateStats(payments, invoices);
      
      setPaymentData({
        payments,
        invoices,
        stats
      });
    } catch (err) {
      console.error('Failed to fetch payment history:', err);
      setError('Failed to load payment history. Please try again later.');
      toast({
        title: 'Error',
        description: 'Failed to load payment history',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const calculateStats = (payments, invoices) => {
    const totalPaid = payments
      .filter(p => p.status === 'success' || p.status === 'verified')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const pendingAmount = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const totalTransactions = payments.length;
    const averageAmount = totalTransactions > 0 ? totalPaid / totalTransactions : 0;
    
    return {
      totalPaid,
      pendingAmount,
      totalTransactions,
      averageAmount
    };
  };
  
  // Filter payments
  const filterPayments = () => {
    let filtered = [...paymentData.payments];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        (payment.payment_id || payment.paymentId)?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.invoice_id || payment.invoiceId)?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.transaction_id || payment.transactionId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }
    
    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const daysAgo = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      }[dateFilter];
      
      if (daysAgo) {
        const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        filtered = filtered.filter(payment => 
          new Date(payment.created_at || payment.createdAt) >= cutoffDate
        );
      }
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
    
    setFilteredPayments(filtered);
  };
  
  // Get appropriate badge color for payment status
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'verified':
      case 'success':
      case 'paid':
        return 'green';
      case 'pending':
      case 'waiting_approval':
        return 'yellow';
      case 'failed':
      case 'rejected':
        return 'red';
      case 'expired':
      case 'cancelled':
        return 'gray';
      default:
        return 'blue';
    }
  };
  
  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'verified':
      case 'success':
      case 'paid':
        return FaCheckCircle;
      case 'pending':
      case 'waiting_approval':
        return FaClock;
      case 'failed':
      case 'rejected':
        return FaTimesCircle;
      case 'expired':
      case 'cancelled':
        return FaExclamationTriangle;
      default:
        return FaClock;
    }
  };
  
  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    onOpen();
  };
  
  const handleDownloadReceipt = async (paymentId) => {
    try {
      toast({
        title: 'Downloading receipt...',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
      
      // TODO: Implement actual download functionality
      console.log('Downloading receipt for payment:', paymentId);
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Could not download receipt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <TenantLayout>
        <Container maxW="container.xl" py={8}>
          <Flex justify="center" align="center" minH="400px">
            <VStack spacing={4}>
              <Spinner size="xl" color="brand.500" />
              <Text>Loading payment history...</Text>
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
            <VStack align="start" spacing={2}>
              <Text fontWeight="bold">Error Loading Payment History</Text>
              <Text>{error}</Text>
            </VStack>
          </Alert>
          <Button mt={4} onClick={fetchPaymentHistory} leftIcon={<FaSync />}>
            Retry
          </Button>
        </Container>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Container maxW="container.xl" py={8}>
        {/* Header */}
        <VStack spacing={6} align="stretch">
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <Heading size="lg">
              <HStack>
                <Icon as={FaHistory} />
                <Text>Payment History</Text>
              </HStack>
            </Heading>
            <HStack spacing={3}>
              <Button
                leftIcon={<FaSync />}
                variant="outline"
                onClick={fetchPaymentHistory}
                isLoading={loading}
              >
                Refresh
              </Button>
              <Button
                as={RouterLink}
                to="/tenant/bookings"
                leftIcon={<FaPlus />}
                colorScheme="brand"
              >
                New Booking
              </Button>
            </HStack>
          </Flex>

          {/* Statistics Cards */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            <Stat
              bg={cardBg}
              p={4}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow="sm"
            >
              <StatLabel>
                <HStack>
                  <Icon as={FaMoneyBillWave} color="green.500" />
                  <Text>Total Paid</Text>
                </HStack>
              </StatLabel>
              <StatNumber color="green.500">
                {formatCurrency(paymentData.stats.totalPaid)}
              </StatNumber>
              <StatHelpText>Successfully completed</StatHelpText>
            </Stat>

            <Stat
              bg={cardBg}
              p={4}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow="sm"
            >
              <StatLabel>
                <HStack>
                  <Icon as={FaClock} color="yellow.500" />
                  <Text>Pending Amount</Text>
                </HStack>
              </StatLabel>
              <StatNumber color="yellow.500">
                {formatCurrency(paymentData.stats.pendingAmount)}
              </StatNumber>
              <StatHelpText>Awaiting confirmation</StatHelpText>
            </Stat>

            <Stat
              bg={cardBg}
              p={4}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow="sm"
            >
              <StatLabel>
                <HStack>
                  <Icon as={FaFileInvoice} color="blue.500" />
                  <Text>Total Transactions</Text>
                </HStack>
              </StatLabel>
              <StatNumber color="blue.500">
                {paymentData.stats.totalTransactions}
              </StatNumber>
              <StatHelpText>All time</StatHelpText>
            </Stat>

            <Stat
              bg={cardBg}
              p={4}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow="sm"
            >
              <StatLabel>
                <HStack>
                  <Icon as={FaCalendarAlt} color="purple.500" />
                  <Text>Average Amount</Text>
                </HStack>
              </StatLabel>
              <StatNumber color="purple.500">
                {formatCurrency(paymentData.stats.averageAmount)}
              </StatNumber>
              <StatHelpText>Per transaction</StatHelpText>
            </Stat>
          </SimpleGrid>

          {/* Filters */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <VStack spacing={4}>
                <Flex
                  direction={{ base: 'column', md: 'row' }}
                  gap={4}
                  width="100%"
                  align={{ base: 'stretch', md: 'center' }}
                >
                  <InputGroup maxW={{ md: '300px' }}>
                    <InputLeftElement>
                      <Icon as={FaSearch} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search payments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>

                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    maxW={{ md: '200px' }}
                  >
                    <option value="all">All Status</option>
                    <option value="success">Success</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="expired">Expired</option>
                  </Select>

                  <Select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    maxW={{ md: '200px' }}
                  >
                    {dateFilters.map(filter => (
                      <option key={filter.value} value={filter.value}>
                        {filter.label}
                      </option>
                    ))}
                  </Select>
                </Flex>

                <Text fontSize="sm" color="gray.500">
                  Showing {filteredPayments.length} of {paymentData.payments.length} payments
                </Text>
              </VStack>
            </CardBody>
          </Card>

          {/* Payment List */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardBody p={0}>
              {filteredPayments.length === 0 ? (
                <VStack py={12} spacing={4}>
                  <Icon as={FaFileInvoice} boxSize="48px" color="gray.400" />
                  <Text fontSize="lg" fontWeight="medium" color="gray.500">
                    No payments found
                  </Text>
                  <Text color="gray.400" textAlign="center">
                    {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'No payment history available yet'}
                  </Text>
                </VStack>
              ) : (
                <TableContainer>
                  <Table variant="simple">
                    <Thead bg={tableHeaderBg}>
                      <Tr>
                        <Th>Payment ID</Th>
                        <Th>Amount</Th>
                        <Th>Method</Th>
                        <Th>Status</Th>
                        <Th>Date</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredPayments.map((payment) => (
                        <Tr key={payment.payment_id || payment.paymentId} _hover={{ bg: hoverBg }}>
                          <Td>
                            <VStack align="start" spacing={1}>
                              <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
                                {payment.payment_id || payment.paymentId}
                              </Text>
                              {(payment.invoice_id || payment.invoiceId) && (
                                <Text fontSize="xs" color="gray.500">
                                  Invoice: {payment.invoice_id || payment.invoiceId}
                                </Text>
                              )}
                            </VStack>
                          </Td>
                          <Td>
                            <Text fontWeight="semibold">
                              {formatCurrency(payment.amount)}
                            </Text>
                          </Td>
                          <Td>
                            <Badge variant="subtle" colorScheme="blue">
                              {payment.payment_method || payment.paymentMethod || 'Bank Transfer'}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={getStatusColor(payment.status)}
                              variant="subtle"
                              display="flex"
                              alignItems="center"
                              gap={1}
                              width="fit-content"
                            >
                              <Icon as={getStatusIcon(payment.status)} boxSize="3" />
                              {payment.status}
                            </Badge>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm">
                                {formatDate(payment.created_at || payment.createdAt)}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {formatDateTime(payment.created_at || payment.createdAt).split(' ')[1]}
                              </Text>
                            </VStack>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <Tooltip label="View Details">
                                <IconButton
                                  icon={<FaEye />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewPayment(payment)}
                                />
                              </Tooltip>
                              {(payment.status === 'verified' || payment.status === 'success') && (
                                <Tooltip label="Download Receipt">
                                  <IconButton
                                    icon={<FaDownload />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="green"
                                    onClick={() => handleDownloadReceipt(payment.payment_id || payment.paymentId)}
                                  />
                                </Tooltip>
                              )}
                              {(payment.invoice_id || payment.invoiceId) && (
                                <Tooltip label="View Invoice">
                                  <IconButton
                                    as={RouterLink}
                                    to={`/tenant/invoices/${payment.invoice_id || payment.invoiceId}`}
                                    icon={<FaReceipt />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="blue"
                                  />
                                </Tooltip>
                              )}
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              )}
            </CardBody>
          </Card>

          {/* Active Invoices */}
          {paymentData.invoices.length > 0 && (
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
              <CardBody>
                <Heading size="md" mb={4}>
                  <HStack>
                    <Icon as={FaFileInvoice} />
                    <Text>Pending Invoices</Text>
                  </HStack>
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {paymentData.invoices
                    .filter(invoice => invoice.status !== 'paid')
                    .slice(0, 6)
                    .map((invoice) => (
                      <Card
                        key={invoice.invoice_id || invoice.invoiceId}
                        size="sm"
                        variant="outline"
                        cursor="pointer"
                        _hover={{ borderColor: 'brand.500', shadow: 'md' }}
                        onClick={() => navigate(`/tenant/invoices/${invoice.invoice_id || invoice.invoiceId}`)}
                      >
                        <CardBody>
                          <VStack align="start" spacing={2}>
                            <HStack justify="space-between" width="100%">
                              <Text fontWeight="semibold" fontSize="sm">
                                #{invoice.invoice_no || invoice.invoiceNo}
                              </Text>
                              <Badge
                                colorScheme={invoice.status === 'paid' ? 'green' : 'yellow'}
                                size="sm"
                              >
                                {invoice.status}
                              </Badge>
                            </HStack>
                            <Text fontWeight="bold" color="brand.500">
                              {formatCurrency(invoice.amount)}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              Due: {formatDate(invoice.due_date)}
                            </Text>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                </SimpleGrid>
                {paymentData.invoices.filter(inv => inv.status !== 'paid').length > 6 && (
                  <Button
                    as={RouterLink}
                    to="/tenant/invoices"
                    variant="link"
                    size="sm"
                    mt={4}
                    rightIcon={<FaEye />}
                  >
                    View All Invoices
                  </Button>
                )}
              </CardBody>
            </Card>
          )}
        </VStack>

        {/* Payment Detail Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Payment Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {selectedPayment && (
                <VStack spacing={4} align="stretch">
                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Payment ID</Text>
                      <Text fontWeight="medium" fontFamily="mono">
                        {selectedPayment.payment_id || selectedPayment.paymentId}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Status</Text>
                      <Badge
                        colorScheme={getStatusColor(selectedPayment.status)}
                        display="flex"
                        alignItems="center"
                        gap={1}
                        width="fit-content"
                      >
                        <Icon as={getStatusIcon(selectedPayment.status)} boxSize="3" />
                        {selectedPayment.status}
                      </Badge>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Amount</Text>
                      <Text fontWeight="bold" fontSize="lg">
                        {formatCurrency(selectedPayment.amount)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Method</Text>
                      <Text fontWeight="medium">
                        {selectedPayment.payment_method || selectedPayment.paymentMethod || 'Bank Transfer'}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Transaction ID</Text>
                      <Text fontFamily="mono" fontSize="sm">
                        {selectedPayment.transaction_id || selectedPayment.transactionId || 'N/A'}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Channel</Text>
                      <Text fontWeight="medium">
                        {selectedPayment.payment_channel || selectedPayment.paymentChannel || 'N/A'}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Created</Text>
                      <Text>{formatDateTime(selectedPayment.created_at || selectedPayment.createdAt)}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Updated</Text>
                      <Text>{formatDateTime(selectedPayment.updated_at || selectedPayment.updatedAt)}</Text>
                    </Box>
                  </SimpleGrid>

                  {selectedPayment.notes && (
                    <>
                      <Divider />
                      <Box>
                        <Text fontSize="sm" color="gray.500" mb={2}>Notes</Text>
                        <Text>{selectedPayment.notes}</Text>
                      </Box>
                    </>
                  )}                  {selectedPayment.paymentProof && (
                    <>
                      <Divider />
                      <Box>
                        <Text fontSize="sm" color="gray.500" mb={2}>Payment Proof</Text>
                        {selectedPayment.paymentProof.imageContent ? (
                          <Image
                            src={`data:${selectedPayment.paymentProof.fileType || 'image/png'};base64,${selectedPayment.paymentProof.imageContent}`}
                            alt="Payment proof"
                            maxH="300px"
                            objectFit="contain"
                            borderRadius="md"
                            border="1px solid"
                            borderColor={borderColor}
                          />
                        ) : selectedPayment.paymentProof.fileUrl ? (
                          <Image
                            src={selectedPayment.paymentProof.fileUrl}
                            alt="Payment proof"
                            maxH="300px"
                            objectFit="contain"
                            borderRadius="md"
                            border="1px solid"
                            borderColor={borderColor}
                          />
                        ) : (
                          <Text color="gray.500" fontStyle="italic">
                            Payment proof file: {selectedPayment.paymentProof.fileName || 'Unknown file'}
                          </Text>
                        )}
                      </Box>
                    </>
                  )}

                  <Divider />
                  <HStack justify="flex-end" spacing={3}>
                    {(selectedPayment.status === 'verified' || selectedPayment.status === 'success') && (
                      <Button
                        leftIcon={<FaDownload />}
                        colorScheme="green"
                        variant="outline"
                        onClick={() => handleDownloadReceipt(selectedPayment.payment_id || selectedPayment.paymentId)}
                      >
                        Download Receipt
                      </Button>
                    )}
                    {(selectedPayment.invoice_id || selectedPayment.invoiceId) && (
                      <Button
                        as={RouterLink}
                        to={`/tenant/invoices/${selectedPayment.invoice_id || selectedPayment.invoiceId}`}
                        leftIcon={<FaReceipt />}
                        colorScheme="blue"
                        variant="outline"
                        onClick={onClose}
                      >
                        View Invoice
                      </Button>
                    )}
                  </HStack>
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </TenantLayout>
  );
};

export default PaymentHistory;
