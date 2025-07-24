import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Grid,
  Heading,
  Text,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Avatar,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Skeleton,
  Alert,
  AlertIcon,
  useDisclosure,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Image,
  FormControl,
  FormLabel,
  Textarea,
  Divider,
  Tooltip,
  Icon,
  Tag,
  TagLeftIcon,
  TagLabel,
  Center,
  Spinner
} from '@chakra-ui/react';
import {
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiDownload,
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiCreditCard,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiFileText,
  FiAlertCircle,
  FiThumbsUp,
  FiThumbsDown,
  FiPrinter,
  FiBarChart2,
  FiLock,
  FiUnlock
} from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import paymentService from '../../services/paymentService';
import { useAuth } from '../../context/authContext';
import { canUserVerifyPayments, getPermissionDeniedMessage, isRegularAdmin } from '../../utils/roleUtils';

const PaymentManagement = () => {
  // ===================================================================
  // AUTH CONTEXT & ROLE-BASED ACCESS
  // ===================================================================
  const { user } = useAuth();
  const canVerify = canUserVerifyPayments(user);
  const isAdmin = isRegularAdmin(user);
  
  // ===================================================================
  // STATE MANAGEMENT
  // ===================================================================
  const [payments, setPayments] = useState([]);
  const [allPayments, setAllPayments] = useState([]); // For stats calculation
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [stats, setStats] = useState({
    total_amount: 0,
    verified_amount: 0,
    pending_amount: 0,
    rejected_amount: 0,
    total_count: 0,
    verified_count: 0,
    pending_count: 0,
    rejected_count: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentMethod: '',
    dateRange: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });  const [verificationReason, setVerificationReason] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [detailedPayment, setDetailedPayment] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Modal controls
  const detailsModal = useDisclosure();
  const verifyModal = useDisclosure();
  const rejectModal = useDisclosure();
    const toast = useToast();

  // ===================================================================
  // COMPUTED VALUES
  // ===================================================================  // Filter payments based on current filters
  const filteredPayments = useMemo(() => {
    if (!payments || payments.length === 0) return [];
    
    return payments.filter(payment => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableFields = [
          payment.paymentId,
          payment.transactionId,
          payment.tenantId,
          payment.bookingId,
          payment.paymentMethod,
          payment.paymentChannel
        ].map(field => (field || '').toString().toLowerCase());
        
        if (!searchableFields.some(field => field.includes(searchTerm))) {
          return false;
        }
      }
      
      // Status filter
      if (filters.status && payment.status !== filters.status) {
        return false;
      }
      
      // Payment method filter  
      if (filters.paymentMethod && payment.paymentMethod !== filters.paymentMethod) {
        return false;
      }
      
      // Date range filter (basic implementation)
      if (filters.dateRange) {
        const paymentDate = new Date(payment.createdAt);
        const today = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            if (paymentDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (paymentDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (paymentDate < monthAgo) return false;
            break;
        }
      }
      
      return true;
    });
  }, [payments, filters]);

  // ===================================================================
  // DATA FETCHING
  // ===================================================================
  useEffect(() => {
    fetchAllPayments(); // Fetch all payments for stats
  }, [filters.dateRange]); // Refresh when date range changes (time-based analysis)

  useEffect(() => {
    fetchPayments(); // Fetch filtered payments for display
  }, [filters, pagination.page]);

  // Calculate stats from ALL payments (not filtered)
  useEffect(() => {
    if (allPayments.length > 0) {
      const calculatedStats = allPayments.reduce((acc, payment) => {
        const amount = payment.amount || 0;
        
        acc.total_count++;
        acc.total_amount += amount;
        
        switch (payment.status?.toLowerCase()) {
          case 'verified':
            acc.verified_count++;
            acc.verified_amount += amount;
            break;
          case 'pending':
            acc.pending_count++;
            acc.pending_amount += amount;
            break;
          case 'rejected': // legacy, just in case
          case 'failed': // treat failed as rejected
            acc.rejected_count++;
            acc.rejected_amount += amount;
            break;
          default:
            break;
        }
        
        return acc;
      }, {
        total_amount: 0,
        verified_amount: 0,
        pending_amount: 0,
        rejected_amount: 0,
        total_count: 0,
        verified_count: 0,
        pending_count: 0,
        rejected_count: 0
      });
      
      setStats(calculatedStats);
    } else {
      // Reset stats when no payments
      setStats({
        total_amount: 0,
        verified_amount: 0,
        pending_amount: 0,
        rejected_amount: 0,
        total_count: 0,
        verified_count: 0,
        pending_count: 0,
        rejected_count: 0
      });
    }
  }, [allPayments]);

  const fetchAllPayments = async () => {
    try {
      // For all payments (stats), apply only date filtering if present
      const params = {};
      
      // Apply date range to all payments if selected (for time-based analysis)
      if (filters.dateRange) {
        const dateRanges = calculateDateRange(filters.dateRange);
        if (dateRanges.startDate) params.start_date = dateRanges.startDate;
        if (dateRanges.endDate) params.end_date = dateRanges.endDate;
      }
      
      console.log('Fetching all payments for stats with params:', params);
      const response = await paymentService.getPayments(params);
      console.log('All payments for stats:', response);
      
      // Check for API error response
      if (response.status && response.status.status === 'error') {
        throw new Error(response.status.message || 'Failed to fetch all payments');
      }
      
      // Extract all payments for stats calculation
      const allPaymentsList = response?.payments || [];
      setAllPayments(allPaymentsList);
      
    } catch (err) {
      console.error('Error fetching all payments:', err);
      // Don't set error state here as it might affect the main display
      setAllPayments([]);
    }
  };

  // Helper function to calculate date ranges
  const calculateDateRange = (range) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case 'today':
        return {
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          startDate: yesterday.toISOString().split('T')[0],
          endDate: yesterday.toISOString().split('T')[0]
        };
      case '7days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return {
          startDate: sevenDaysAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      case '30days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return {
          startDate: thirtyDaysAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      case '90days':
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        return {
          startDate: ninetyDaysAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      default:
        return { startDate: null, endDate: null };
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      // Build parameters for filtered payments
      const params = {};
      
      // Only add parameters if they have values
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.paymentMethod) params.payment_method = filters.paymentMethod;
      
      // Handle date range with actual dates instead of string
      if (filters.dateRange) {
        const dateRanges = calculateDateRange(filters.dateRange);
        if (dateRanges.startDate) params.start_date = dateRanges.startDate;
        if (dateRanges.endDate) params.end_date = dateRanges.endDate;
      }
      
      // Pagination and sorting
      if (pagination.page > 1) params.page = pagination.page;
      if (pagination.limit !== 10) params.limit = pagination.limit;
      if (filters.sortBy !== 'createdAt') params.sort_by = filters.sortBy;
      if (filters.sortOrder !== 'desc') params.sort_order = filters.sortOrder;
      
      console.log('Sending payment request with params:', params);
      
      const response = await paymentService.getPayments(params);
      console.log('Payments API response:', response);
      
      // Check for API error response
      if (response.status && response.status.status === 'error') {
        throw new Error(response.status.message || 'Failed to fetch payments');
      }
      
      // Extract payments array properly
      const paymentsList = response?.payments || [];
      setPayments(paymentsList);
      
      setPagination(prev => ({
        ...prev,
        total: response.totalCount || 0
      }));
      
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching payments:', err);
      // Set empty payments array on error
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };
  const fetchPaymentDetails = async (paymentId) => {
    setLoadingDetails(true);
    try {
      const response = await paymentService.getPaymentById(paymentId);
      setDetailedPayment(response.payment);
      setSelectedPayment(response.payment);
      detailsModal.onOpen();
    } catch (err) {
      console.error('Error fetching payment details:', err);
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================
  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    fetchPaymentDetails(payment.paymentId);
  };  const handleVerifyPayment = async (approved = true) => {
    // Check if user has permission to verify
    if (!canVerify) {
      toast({
        title: 'Access Denied',
        description: getPermissionDeniedMessage('verify payments'),
        status: 'warning',
        duration: 6000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    if (!approved && !verificationReason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide verification notes for rejection.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setProcessingAction(true);
    try {
      const verificationData = {
        verifierId: user?.userId || 1,
        approved: approved,
        verificationNotes: verificationReason.trim(),
        verifiedAt: new Date().toISOString()
      };

      console.log('🔍 Payment Debug: Submitting verification:', verificationData);

      const response = await paymentService.verifyPayment(selectedPayment.paymentId, verificationData);
      
      console.log('🔍 Payment Debug: Backend response:', response);
      
      // Check if the backend returned an error status
      if (response && response.status === 'error') {
        const errorMessage = response.message || 'Unknown error occurred';
        
        // Check if it's a permission-denied error
        if (errorMessage.toLowerCase().includes('permission denied') || 
            errorMessage.toLowerCase().includes('insufficient privileges') ||
            errorMessage.toLowerCase().includes('only wakil_direktorat can')) {
          
          toast({
            title: 'Access Denied',
            description: 'Only Wakil Direktorat can verify payments. Please contact an authorized user.',
            status: 'warning',
            duration: 6000,
            isClosable: true,
            position: 'top',
          });
        } else {
          // Other types of errors
          toast({
            title: 'Verification Failed',
            description: errorMessage,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
        return;
      }
      
      // Check if backend silently rejected/failed instead of approving (permission issue)
      if (response && response.payment && approved) {
        const paymentStatus = response.payment.status;
        
        if (paymentStatus === 'failed' || paymentStatus === 'rejected') {
          console.log('🔍 Payment Debug: Backend silently failed payment instead of approving - permission issue detected');
          
          // Check if the message mentions wakil_direktorat (indicating permission issue)
          const statusMessage = response.status?.message || '';
          if (statusMessage.toLowerCase().includes('wakil_direktorat')) {
            toast({
              title: 'Access Denied',
              description: 'Only Wakil Direktorat can verify payments. Your request was automatically rejected.',
              status: 'warning',
              duration: 6000,
              isClosable: true,
              position: 'top',
            });
            await fetchPayments();
            await fetchAllPayments(); // Also refresh stats
            verifyModal.onClose();
            detailsModal.onClose();
            setVerificationReason('');
            setSelectedPayment(null);
            return;
          }
        }
      }
      
      // Success case
      toast({
        title: approved ? 'Payment Approved' : 'Payment Rejected',
        description: `Payment has been successfully ${approved ? 'approved' : 'rejected'}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Refresh data
      await fetchPayments();
      await fetchAllPayments(); // Also refresh stats
      
      // Close modals and reset
      verifyModal.onClose();
      detailsModal.onClose();
      setVerificationReason('');
      setSelectedPayment(null);
    } catch (err) {
      // Network or other critical errors
      console.error('Verification error:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to process payment verification - please try again',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for rejection.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setProcessingAction(true);
    try {
      await paymentService.rejectPayment(selectedPayment.paymentId, {
        verifierId: user?.userId || 1,
        reason: rejectionReason.trim()
      });
      
      toast({
        title: 'Payment Rejected',
        description: 'Payment has been rejected.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
      // Refresh data
      await fetchPayments();
      await fetchAllPayments(); // Also refresh stats
      
      // Close modal and reset
      rejectModal.onClose();
      setRejectionReason('');
      setSelectedPayment(null);
    } catch (err) {
      console.error('Rejection error:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to reject payment',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessingAction(false);
    }
  };
  const handleExportData = async () => {
    try {
      // Generate CSV export from current filtered data
      const csvData = generateCSVFromPayments(filteredPayments);
      
      // Create a download link and trigger download
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `payments-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Successful',
        description: `${filteredPayments.length} payment records exported to CSV`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Export error:', err);
      toast({
        title: 'Error',
        description: 'Failed to export payment data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  // Generate CSV from payments data
  const generateCSVFromPayments = (payments) => {
    const headers = [
      'Payment ID',
      'Transaction ID',
      'Date',
      'Tenant ID',
      'Booking ID', 
      'Amount',
      'Status',
      'Payment Method',
      'Payment Channel'
    ];
    
    const csvRows = [headers.join(',')];
    
    payments.forEach(payment => {
      const row = [
        payment.paymentId || 'N/A',
        payment.transactionId || (payment.invoiceId ? `INV-${payment.invoiceId}` : 'N/A'),
        payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A',
        payment.tenantId || 'N/A',
        payment.bookingId || 'N/A',
        payment.amount ? `${payment.amount.toLocaleString()}` : '0',
        payment.status || 'N/A',
        payment.paymentMethod || 'N/A',
        payment.paymentChannel || 'N/A'
      ];
      csvRows.push(row.map(field => `"${field}"`).join(','));
    });
    
    return csvRows.join('\n');
  };

  // ===================================================================
  // UTILITY FUNCTIONS
  // ===================================================================
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified': return 'green';
      case 'pending': return 'yellow';
      case 'failed': return 'red';
      case 'refunded': return 'orange';
      case 'expired': return 'gray';
      case 'rejected': return 'red'; // Legacy fallback
      case 'cancelled': return 'orange'; // Legacy fallback
      default: return 'gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified': return FiCheckCircle;
      case 'pending': return FiClock;
      case 'failed': return FiXCircle;
      case 'refunded': return FiAlertCircle;
      case 'expired': return FiLock;
      case 'rejected': return FiXCircle; // Legacy fallback
      case 'cancelled': return FiAlertCircle; // Legacy fallback
      default: return FiFileText;
    }
  };

  const getMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'midtrans': return FiCreditCard;
      case 'manual': return FiDollarSign;
      default: return FiCreditCard;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // ===================================================================
  // RENDER METHODS
  // ===================================================================
  const renderPaymentStats = () => {
    return (
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Transactions</StatLabel>
              <StatNumber color="blue.500">
                {stats.total_count}
              </StatNumber>
              <StatHelpText>
                <HStack>
                  <FiBarChart2 />
                  <Text>{formatCurrency(stats.total_amount)}</Text>
                </HStack>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Verified Payments</StatLabel>
              <StatNumber color="green.500">
                {stats.verified_count}
              </StatNumber>
              <StatHelpText>
                <HStack>
                  <FiCheckCircle />
                  <Text>{formatCurrency(stats.verified_amount)}</Text>
                </HStack>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Pending Payments</StatLabel>
              <StatNumber color="yellow.500">
                {stats.pending_count}
              </StatNumber>
              <StatHelpText>
                <HStack>
                  <FiClock />
                  <Text>{formatCurrency(stats.pending_amount)}</Text>
                </HStack>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Rejected Payments</StatLabel>
              <StatNumber color="red.500">
                {stats.rejected_count}
              </StatNumber>
              <StatHelpText>
                <HStack>
                  <FiXCircle />
                  <Text>{formatCurrency(stats.rejected_amount)}</Text>
                </HStack>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>
    );
  };

  // ===================================================================
  // MAIN RENDER
  // ===================================================================
  if (loading) {
    return (
      <AdminLayout>
        <Box p={6}>
          <Flex justify="space-between" align="center" mb={6}>
            <Heading size="lg">Payment Management</Heading>
          </Flex>
          <Center h="400px">
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" />
              <Text>Loading payment data...</Text>
            </VStack>
          </Center>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box p={6}>
        {/* Header */}
        <Flex justify="space-between" align="center" mb={6}>
          <VStack align="flex-start" spacing={1}>
            <Heading size="lg">Payment Management</Heading>
            <Text color="gray.600">Track and manage all payments and transactions</Text>
          </VStack>          <HStack spacing={3}>
            <Button leftIcon={<FiDownload />} colorScheme="brand" onClick={handleExportData}>
              Export CSV
            </Button>
          </HStack>
        </Flex>

        {/* Statistics */}
        {renderPaymentStats()}

        {/* Filters */}
        <Card mb={6}>
          <CardBody>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search by transaction ID, tenant..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </InputGroup>

              <Select
                placeholder="Payment Status"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="expired">Expired</option>
              </Select>

              <Select
                placeholder="Payment Method"
                value={filters.paymentMethod}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
              >
                <option value="midtrans">Midtrans</option>
                <option value="manual">Manual Transfer</option>
              </Select>

              <Select
                placeholder="Date Range"
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </Select>
            </Grid>
          </CardBody>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardBody p={0}>
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>Payment ID</Th>
                    <Th>Tenant</Th>
                    <Th>Amount</Th>
                    <Th>Method</Th>
                    <Th>Date</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {error ? (
                    <Tr>
                      <Td colSpan={7}>
                        <Alert status="error">
                          <AlertIcon />
                          {error}
                        </Alert>
                      </Td>
                    </Tr>
                  ) : payments.length === 0 ? (
                    <Tr>
                      <Td colSpan={7} textAlign="center" py={8}>
                        <VStack spacing={3}>
                          <Icon as={FiDollarSign} boxSize={10} color="gray.400" />
                          <Text color="gray.500">No payments found</Text>
                          <Text fontSize="sm" color="gray.400">Try adjusting your filters</Text>
                        </VStack>
                      </Td>
                    </Tr>
                  ) : (
                    payments.map((payment) => (
                      <Tr key={payment.paymentId}>
                        <Td>
                          <HStack>
                            <Icon as={getMethodIcon(payment.paymentMethod)} color="blue.500" />
                            <Text fontWeight="medium">#{payment.paymentId}</Text>
                          </HStack>
                          <Text fontSize="xs" color="gray.500">
                            {payment.transactionId || `INV-${payment.invoiceId}`}
                          </Text>
                        </Td>
                        <Td>
                          <HStack spacing={3}>
                            <Avatar size="sm" name={`Tenant ${payment.tenantId}`} />
                            <VStack align="flex-start" spacing={0}>
                              <Text fontWeight="medium">Tenant #{payment.tenantId}</Text>
                              <Text fontSize="xs" color="gray.500">
                                Booking #{payment.bookingId}
                              </Text>
                            </VStack>
                          </HStack>
                        </Td>
                        <Td fontWeight="medium">
                          {formatCurrency(payment.amount)}
                        </Td>
                        <Td>
                          <Badge colorScheme={payment.paymentMethod === 'midtrans' ? 'blue' : 'purple'}>
                            {payment.paymentMethod}
                          </Badge>
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            {payment.paymentChannel || 'N/A'}
                          </Text>
                        </Td>
                        <Td>
                          <Text>{formatDate(payment.createdAt)}</Text>
                          {payment.paidAt && (
                            <Text fontSize="xs" color="green.500">
                              Paid: {formatDate(payment.paidAt)}
                            </Text>
                          )}
                        </Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(payment.status)}>
                            <HStack spacing={1}>
                              <Icon as={getStatusIcon(payment.status)} />
                              <Text>{payment.status}</Text>
                            </HStack>
                          </Badge>
                        </Td>
                        <Td>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<FiMoreVertical />}
                              variant="ghost"
                              size="sm"
                            />
                            <MenuList>                              <MenuItem
                                icon={<FiEye />}
                                onClick={() => handleViewDetails(payment)}
                              >
                                View Details
                              </MenuItem>
                              
                              {payment.status === 'pending' && canVerify && (
                                <>
                                  <MenuItem
                                    icon={<FiCheckCircle />}
                                    color="green.500"
                                    onClick={() => {
                                      setSelectedPayment(payment);
                                      verifyModal.onOpen();
                                    }}
                                  >
                                    Verify Payment
                                  </MenuItem>
                                  <MenuItem
                                    icon={<FiXCircle />}
                                    color="red.500"
                                    onClick={() => {
                                      setSelectedPayment(payment);
                                      rejectModal.onOpen();
                                    }}
                                  >
                                    Reject Payment
                                  </MenuItem>
                                </>
                              )}
                              
                              <MenuItem
                                icon={<FiFileText />}
                                onClick={() => {
                                  // View/download receipt
                                }}
                              >
                                View Receipt
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>

            {/* Pagination */}
            {!loading && payments.length > 0 && (
              <Flex justify="space-between" align="center" p={4} borderTop="1px" borderColor="gray.200">
                <Text fontSize="sm" color="gray.600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} payments
                </Text>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    isDisabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    isDisabled={pagination.page * pagination.limit >= pagination.total}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Next
                  </Button>
                </HStack>
              </Flex>
            )}
          </CardBody>
        </Card>        {/* Payment Details Modal - Enhanced with booking and tenant details */}
        <Modal isOpen={detailsModal.isOpen} onClose={detailsModal.onClose} size="6xl">
          <ModalOverlay />
          <ModalContent maxH="90vh" overflowY="auto">
            <ModalHeader>
              <HStack>
                <Icon as={FiDollarSign} />
                <Text>Payment Details #{selectedPayment?.paymentId}</Text>
                {selectedPayment?.status && (
                  <Badge colorScheme={getStatusColor(selectedPayment.status)} ml={2}>
                    {selectedPayment.status}
                  </Badge>
                )}
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {loadingDetails ? (
                <Center py={8}>
                  <VStack>
                    <Spinner size="lg" />
                    <Text>Loading payment details...</Text>
                  </VStack>
                </Center>
              ) : detailedPayment ? (
                <VStack spacing={6} align="stretch">
                  {/* Payment Information */}
                  <Card>
                    <CardHeader>
                      <Heading size="md">Payment Information</Heading>
                    </CardHeader>
                    <CardBody>
                      <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                        <VStack align="flex-start" spacing={2}>
                          <Text fontSize="sm" color="gray.600">Payment ID</Text>
                          <Text fontWeight="medium">#{detailedPayment.paymentId}</Text>
                        </VStack>
                        <VStack align="flex-start" spacing={2}>
                          <Text fontSize="sm" color="gray.600">Status</Text>
                          <Badge colorScheme={getStatusColor(detailedPayment.status)}>
                            {detailedPayment.status}
                          </Badge>
                        </VStack>
                        <VStack align="flex-start" spacing={2}>
                          <Text fontSize="sm" color="gray.600">Amount</Text>
                          <Text fontWeight="bold" fontSize="lg" color="green.500">{formatCurrency(detailedPayment.amount)}</Text>
                        </VStack>
                        <VStack align="flex-start" spacing={2}>
                          <Text fontSize="sm" color="gray.600">Method</Text>
                          <HStack>
                            <Icon as={getMethodIcon(detailedPayment.paymentMethod)} />
                            <Text>{detailedPayment.paymentMethod}</Text>
                          </HStack>
                        </VStack>
                        <VStack align="flex-start" spacing={2}>
                          <Text fontSize="sm" color="gray.600">Channel</Text>
                          <Text>{detailedPayment.paymentChannel || 'N/A'}</Text>
                        </VStack>
                        <VStack align="flex-start" spacing={2}>
                          <Text fontSize="sm" color="gray.600">Transaction ID</Text>
                          <Text>{detailedPayment.transactionId || 'N/A'}</Text>
                        </VStack>
                        <VStack align="flex-start" spacing={2}>
                          <Text fontSize="sm" color="gray.600">Invoice ID</Text>
                          <Text>#{detailedPayment.invoiceId}</Text>
                        </VStack>
                        <VStack align="flex-start" spacing={2}>
                          <Text fontSize="sm" color="gray.600">Created</Text>
                          <Text>{formatDate(detailedPayment.createdAt)}</Text>
                        </VStack>
                        <VStack align="flex-start" spacing={2}>
                          <Text fontSize="sm" color="gray.600">Updated</Text>
                          <Text>{formatDate(detailedPayment.updatedAt)}</Text>
                        </VStack>
                        {detailedPayment.paidAt && (
                          <VStack align="flex-start" spacing={2}>
                            <Text fontSize="sm" color="gray.600">Paid At</Text>
                            <Text color="green.500">{formatDate(detailedPayment.paidAt)}</Text>
                          </VStack>
                        )}
                      </Grid>
                      {detailedPayment.notes && (
                        <Box mt={4}>
                          <Text fontSize="sm" color="gray.600" mb={2}>Payment Notes</Text>
                          <Text p={3} bg="gray.50" borderRadius="md">{detailedPayment.notes}</Text>
                        </Box>
                      )}
                    </CardBody>
                  </Card>

                  {/* Booking Information */}
                  {detailedPayment.booking && (
                    <Card>
                      <CardHeader>
                        <Heading size="md">Booking Information</Heading>
                      </CardHeader>
                      <CardBody>
                        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                          <VStack align="flex-start" spacing={2}>
                            <Text fontSize="sm" color="gray.600">Booking ID</Text>
                            <Text fontWeight="medium">#{detailedPayment.booking.bookingId}</Text>
                          </VStack>
                          <VStack align="flex-start" spacing={2}>
                            <Text fontSize="sm" color="gray.600">Check-in Date</Text>
                            <Text>{formatDate(detailedPayment.booking.checkInDate)}</Text>
                          </VStack>
                          <VStack align="flex-start" spacing={2}>
                            <Text fontSize="sm" color="gray.600">Check-out Date</Text>
                            <Text>{formatDate(detailedPayment.booking.checkOutDate)}</Text>
                          </VStack>
                          <VStack align="flex-start" spacing={2}>
                            <Text fontSize="sm" color="gray.600">Total Booking Amount</Text>
                            <Text fontWeight="medium">{formatCurrency(detailedPayment.booking.totalAmount)}</Text>
                          </VStack>
                          <VStack align="flex-start" spacing={2}>
                            <Text fontSize="sm" color="gray.600">Booking Status</Text>
                            <Badge colorScheme={detailedPayment.booking.status === 'approved' ? 'green' : 'yellow'}>
                              {detailedPayment.booking.status}
                            </Badge>
                          </VStack>
                          {detailedPayment.booking.room && (
                            <VStack align="flex-start" spacing={2}>
                              <Text fontSize="sm" color="gray.600">Room</Text>
                              <Text>{detailedPayment.booking.room.name}</Text>
                              <Text fontSize="xs" color="gray.500">
                                {detailedPayment.booking.room.classification?.name} • {detailedPayment.booking.room.rentalType?.name}
                              </Text>
                            </VStack>
                          )}
                        </Grid>
                        
                        {/* Tenant Information */}
                        {detailedPayment.booking.tenant && (
                          <Box mt={4} p={3} bg="blue.50" borderRadius="md">
                            <Text fontSize="sm" fontWeight="medium" color="blue.800" mb={2}>Tenant Information</Text>
                            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3}>
                              <HStack>
                                <Avatar size="sm" name={detailedPayment.booking.tenant.user?.fullName} />
                                <VStack align="flex-start" spacing={0}>
                                  <Text fontSize="sm" fontWeight="medium">{detailedPayment.booking.tenant.user?.fullName}</Text>
                                  <Text fontSize="xs" color="gray.600">{detailedPayment.booking.tenant.user?.email}</Text>
                                </VStack>
                              </HStack>
                              <VStack align="flex-start" spacing={1}>
                                <Text fontSize="xs" color="gray.600">Phone: {detailedPayment.booking.tenant.phone}</Text>
                                <Text fontSize="xs" color="gray.600">NIM: {detailedPayment.booking.tenant.nim}</Text>
                                <Text fontSize="xs" color="gray.600">Type: {detailedPayment.booking.tenant.tenantType?.name}</Text>
                              </VStack>
                            </Grid>
                          </Box>
                        )}
                      </CardBody>
                    </Card>
                  )}

                  {/* Payment Proof */}
                  {detailedPayment.paymentProof && (
                    <Card>
                      <CardHeader>
                        <Heading size="md">Payment Proof</Heading>
                      </CardHeader>
                      <CardBody>
                        <Grid templateColumns={{ base: '1fr', md: '1fr 2fr' }} gap={6}>
                          <VStack align="stretch" spacing={4}>
                            <VStack align="flex-start" spacing={2}>
                              <Text fontSize="sm" color="gray.600">File Name</Text>
                              <Text>{detailedPayment.paymentProof.fileName}</Text>
                            </VStack>
                            <VStack align="flex-start" spacing={2}>
                              <Text fontSize="sm" color="gray.600">File Type</Text>
                              <Text>{detailedPayment.paymentProof.fileType}</Text>
                            </VStack>
                            <VStack align="flex-start" spacing={2}>
                              <Text fontSize="sm" color="gray.600">Uploaded At</Text>
                              <Text>{formatDate(detailedPayment.paymentProof.uploadedAt)}</Text>
                            </VStack>
                            
                            {/* Bank Transfer Details */}
                            {detailedPayment.paymentProof.bankName && (
                              <Box p={3} bg="gray.50" borderRadius="md">
                                <Text fontSize="sm" fontWeight="medium" mb={2}>Bank Transfer Details</Text>
                                <VStack align="flex-start" spacing={1}>
                                  <Text fontSize="sm"><strong>Bank:</strong> {detailedPayment.paymentProof.bankName}</Text>
                                  <Text fontSize="sm"><strong>Account:</strong> {detailedPayment.paymentProof.accountNumber}</Text>
                                  <Text fontSize="sm"><strong>Holder:</strong> {detailedPayment.paymentProof.accountHolderName}</Text>
                                  <Text fontSize="sm"><strong>Transfer Date:</strong> {formatDate(detailedPayment.paymentProof.transferDate)}</Text>
                                </VStack>
                              </Box>
                            )}
                            
                            {/* Verification Status */}
                            {detailedPayment.paymentProof.verificationStatus && (
                              <Box p={3} bg={detailedPayment.paymentProof.verificationStatus === 'verified' ? 'green.50' : 'yellow.50'} borderRadius="md">
                                <Text fontSize="sm" fontWeight="medium" mb={1}>Verification Status</Text>
                                <Badge colorScheme={detailedPayment.paymentProof.verificationStatus === 'verified' ? 'green' : 'yellow'}>
                                  {detailedPayment.paymentProof.verificationStatus}
                                </Badge>
                                {detailedPayment.paymentProof.verificationNotes && (
                                  <Text fontSize="sm" mt={2}>{detailedPayment.paymentProof.verificationNotes}</Text>
                                )}
                                {detailedPayment.paymentProof.verifiedAt && (
                                  <Text fontSize="xs" color="gray.600" mt={1}>
                                    Verified: {formatDate(detailedPayment.paymentProof.verifiedAt)}
                                  </Text>
                                )}
                              </Box>
                            )}
                          </VStack>
                          
                          {/* Payment Proof Image */}
                          {detailedPayment.paymentProof.imageContent && (
                            <Box>
                              <Text fontSize="sm" color="gray.600" mb={2}>Payment Receipt</Text>
                              <Box border="2px solid" borderColor="gray.200" borderRadius="lg" overflow="hidden">
                                <Image
                                  src={`data:${detailedPayment.paymentProof.fileType};base64,${detailedPayment.paymentProof.imageContent}`}
                                  alt="Payment proof"
                                  width="100%"
                                  maxH="500px"
                                  objectFit="contain"
                                  bg="white"
                                />
                              </Box>
                              <HStack mt={2} spacing={2}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  leftIcon={<FiDownload />}
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = `data:${detailedPayment.paymentProof.fileType};base64,${detailedPayment.paymentProof.imageContent}`;
                                    link.download = detailedPayment.paymentProof.fileName;
                                    link.click();
                                  }}
                                >
                                  Download
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  leftIcon={<FiEye />}
                                  onClick={() => {
                                    const imageWindow = window.open();
                                    imageWindow.document.write(`<img src="data:${detailedPayment.paymentProof.fileType};base64,${detailedPayment.paymentProof.imageContent}" style="max-width:100%;height:auto;" />`);
                                  }}
                                >
                                  View Full Size
                                </Button>
                              </HStack>
                            </Box>
                          )}
                        </Grid>
                      </CardBody>
                    </Card>
                  )}                  {/* Actions for Pending Payments */}
                  {detailedPayment.status === 'pending' && canVerify && (
                    <Card bg="orange.50" borderColor="orange.200">
                      <CardBody>
                        <HStack spacing={4} justify="center">
                          <Button
                            colorScheme="green"
                            leftIcon={<FiThumbsUp />}
                            onClick={() => {
                              verifyModal.onOpen();
                            }}
                            size="lg"
                          >
                            Approve Payment
                          </Button>
                          <Button
                            colorScheme="red"
                            leftIcon={<FiThumbsDown />}
                            onClick={() => {
                              verifyModal.onOpen();
                            }}
                            size="lg"
                          >
                            Reject Payment
                          </Button>
                        </HStack>
                        <Text textAlign="center" mt={2} fontSize="sm" color="orange.600">
                          This payment requires your verification
                        </Text>
                      </CardBody>
                    </Card>
                  )}

                  {/* Info banner for admin users */}
                  {detailedPayment.status === 'pending' && isAdmin && (
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <Box>
                        <Text fontWeight="bold">Limited Access</Text>
                        <Text fontSize="sm">
                          You can view payment details but cannot approve or reject payments. 
                          Only Wakil Direktorat and Super Admin users can verify payments.
                        </Text>
                      </Box>
                    </Alert>
                  )}
                </VStack>
              ) : (
                <Alert status="error">
                  <AlertIcon />
                  Failed to load payment details
                </Alert>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={detailsModal.onClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Verify Payment Modal - Updated */}
        <Modal isOpen={verifyModal.isOpen} onClose={verifyModal.onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Payment Verification</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Payment Verification Required</Text>
                    <Text fontSize="sm">
                      Payment #{selectedPayment?.paymentId} for {formatCurrency(selectedPayment?.amount)} requires your verification.
                    </Text>
                  </Box>
                </Alert>
                
                <FormControl isRequired>
                  <FormLabel>Verification Notes</FormLabel>
                  <Textarea
                    placeholder="Add notes about this verification (required for rejection)"
                    value={verificationReason}
                    onChange={(e) => setVerificationReason(e.target.value)}
                    rows={4}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Please provide detailed notes for your verification decision
                  </Text>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" mr={3} onClick={verifyModal.onClose} isDisabled={processingAction}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                mr={3}
                onClick={() => handleVerifyPayment(false)}
                isLoading={processingAction}
                loadingText="Rejecting..."
                isDisabled={processingAction || !verificationReason.trim()}
              >
                Reject Payment
              </Button>
              <Button
                colorScheme="green"
                onClick={() => handleVerifyPayment(true)}
                isLoading={processingAction}
                loadingText="Approving..."
                isDisabled={processingAction}
              >
                Approve Payment
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Reject Payment Modal */}
        <Modal isOpen={rejectModal.isOpen} onClose={rejectModal.onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Reject Payment</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Confirm Payment Rejection</Text>
                    <Text fontSize="sm">
                      You are about to reject payment #{selectedPayment?.paymentId} for {formatCurrency(selectedPayment?.amount)}.
                    </Text>
                  </Box>
                </Alert>
                
                                <FormControl isRequired>
                                  <FormLabel>Rejection Reason</FormLabel>
                                  <Textarea
                                    placeholder="Provide a reason for rejecting this payment"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={4}
                                  />
                                </FormControl>
                              </VStack>
                            </ModalBody>
                            <ModalFooter>                              <Button variant="outline" mr={3} onClick={rejectModal.onClose} isDisabled={processingAction}>
                                Cancel
                              </Button>
                              <Button
                                colorScheme="red"
                                onClick={handleRejectPayment}
                                isLoading={processingAction}
                                loadingText="Rejecting..."
                              >
                                Reject Payment
                              </Button>
                            </ModalFooter>
                          </ModalContent>
                        </Modal>
      </Box>
    </AdminLayout>
  );
};

export default PaymentManagement;
