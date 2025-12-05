import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Input,
  Select,
  InputGroup,
  InputLeftElement,
  HStack,
  VStack,
  IconButton,
  useDisclosure,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Grid,
  GridItem,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Avatar,
  Progress,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tooltip,
  Tag,
  TagLabel,
  TagLeftIcon
} from '@chakra-ui/react';
import { Pagination } from '../../components/common/Pagination';
import {
  FiSearch,
  FiEye,
  FiCheck,
  FiX,
  FiClock,
  FiMoreVertical,
  FiCalendar,
  FiUser,
  FiHome,
  FiDollarSign,
  FiAlertCircle,
  FiCheckCircle,
  FiFileText,
  FiUsers,
  FiMapPin,
  FiTrendingUp,
  FiTrendingDown,
  FiTarget,
  FiNavigation
} from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import bookingService from '../../services/bookingService';
import issueService from '../../services/issueService';
import BookingDetailModal from '../../components/modals/BookingDetailModal';
import BookingRejectionModal from '../../components/modals/BookingRejectionModal';
import { handleApiCall } from '../../utils/errorHandler';
import { useAuth } from '../../context/authContext';
import { canUserApproveBookings, getPermissionDeniedMessage, isRegularAdmin } from '../../utils/roleUtils';

const BookingManagement = () => {
  // ===================================================================
  // AUTHENTICATION & ROLE-BASED ACCESS
  // ===================================================================
  const { user } = useAuth();
  const canApprove = canUserApproveBookings(user);
  const isAdmin = isRegularAdmin(user);
  // ===================================================================
  // STATE MANAGEMENT
  // ===================================================================
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]); // Store all bookings for client-side filtering
  const [issues, setIssues] = useState([]); // Add issues state
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [distanceFilter, setDistanceFilter] = useState('all'); // New distance filter
  const [distanceRange, setDistanceRange] = useState([0, 500]); // Distance range in km (increased to 500km)
  const [sortBy, setSortBy] = useState('priority'); // Default to priority sorting
  const [sortOrder, setSortOrder] = useState('desc'); // New sort order
  const [selectedBooking, setSelectedBooking] = useState(null);  
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10, // 10 items per page with pagination controls
    total: 0,
    totalPages: 0
  });

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    active: 0,
    averageDistance: 0, // New distance stat
    closeProximity: 0, // Tenants within 5km
    mediumProximity: 0, // Tenants 5-15km
    farProximity: 0, // Tenants >15km
    afirmasiCount: 0, // Afirmasi students count
    highPriorityCount: 0, // High priority bookings count
    averagePriorityScore: 0 // Average priority score
  });

  const { 
    isOpen: isDetailOpen, 
    onOpen: onDetailOpen, 
    onClose: onDetailClose 
  } = useDisclosure();

  const { 
    isOpen: isRejectionOpen, 
    onOpen: onRejectionOpen, 
    onClose: onRejectionClose 
  } = useDisclosure();

  const [bookingToReject, setBookingToReject] = useState(null);

  const toast = useToast();

  // ===================================================================
  // PRIORITY CALCULATION LOGIC
  // ===================================================================
  const calculatePriorityScore = (booking) => {
    if (!booking.tenant) return 0;
    
    let score = 0;
    const tenant = booking.tenant;
    const distance = tenant.distanceToCampus || 0;
      // Base score from distance (0-100 points)
    // Farther distance = higher priority
    // Max distance assumed to be 500km for scoring (increased from 50km)
    const distanceScore = Math.min((distance / 500) * 100, 100);
    score += distanceScore;
    
    // Afirmasi bonus (50 points)
    if (tenant.isAfirmasi) {
      score += 50;
    }
    
    // Student type bonus (10 points for mahasiswa)
    if (tenant.tenantType?.name === 'mahasiswa') {
      score += 10;
    }
    
    return Math.round(score);
  };

  const getPriorityLevel = (score) => {
    if (score >= 120) return { level: 'Very High', color: 'red' };
    if (score >= 80) return { level: 'High', color: 'orange' };
    if (score >= 40) return { level: 'Medium', color: 'yellow' };
    return { level: 'Low', color: 'green' };
  };

  const getPriorityLabel = (booking) => {
    const score = calculatePriorityScore(booking);
    const { level, color } = getPriorityLevel(score);
    return { score, level, color };
  };

  // ===================================================================
  // LIFECYCLE & DATA FETCHING
  // ===================================================================
  // Load initial data only once
  useEffect(() => {
    fetchBookings();
  }, []); // Only run once on component mount

  // Apply client-side filters whenever filter states change or allBookings changes
  useEffect(() => {
    if (allBookings.length > 0) {
      const filteredBookings = applyClientSideFilters(allBookings);
      const paginatedBookings = paginateBookings(filteredBookings);
      setBookings(paginatedBookings);
      
      // Update pagination info
      setPagination(prev => ({
        ...prev,
        total: filteredBookings.length,
        totalPages: Math.ceil(filteredBookings.length / prev.limit),
        page: 1 // Reset to first page when filters change
      }));
    }
  }, [searchTerm, statusFilter, dateFilter, distanceFilter, sortBy, sortOrder, allBookings]);

  // Apply pagination when page or limit changes
  useEffect(() => {
    if (allBookings.length > 0) {
      const filteredBookings = applyClientSideFilters(allBookings);
      const paginatedBookings = paginateBookings(filteredBookings);
      setBookings(paginatedBookings);
    }
  }, [pagination.page, pagination.limit]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Fetch all bookings for client-side filtering (since backend filters may not work properly)
      const params = {
        page: 1,
        limit: 100, // Fetch more records for client-side filtering
        sort_by: 'createdAt',
        sort_order: 'desc'
      };
      
      const response = await bookingService.getBookings(params);
      const fetchedBookings = response.bookings || [];
      
      // Store all bookings for client-side filtering
      setAllBookings(fetchedBookings);
      
      // Apply client-side filtering
      const filteredBookings = applyClientSideFilters(fetchedBookings);
      
      // Apply pagination to filtered results
      const paginatedBookings = paginateBookings(filteredBookings);
      setBookings(paginatedBookings);
      
      // Update pagination info
      setPagination(prev => ({
        ...prev,
        total: filteredBookings.length,
        totalPages: Math.ceil(filteredBookings.length / prev.limit)
      }));
      
      // Fetch stats separately for all bookings (not just current page)
      await fetchBookingStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch bookings',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering function since backend filters aren't working reliably
  const applyClientSideFilters = (bookingsToFilter = allBookings) => {
    let filtered = [...bookingsToFilter];
    
    // Apply search filter
    const searchQuery = searchTerm.toLowerCase().trim();
    if (searchQuery) {
      filtered = filtered.filter(booking => {
        const tenantName = booking.tenant?.user?.fullName?.toLowerCase() || '';
        const tenantEmail = booking.tenant?.user?.email?.toLowerCase() || '';
        const roomName = booking.room?.name?.toLowerCase() || '';
        const bookingId = String(booking.bookingId || '').toLowerCase();
        const status = booking.status?.toLowerCase() || '';
        
        return tenantName.includes(searchQuery) ||
               tenantEmail.includes(searchQuery) ||
               roomName.includes(searchQuery) ||
               bookingId.includes(searchQuery) ||
               status.includes(searchQuery);
      });
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }
    
    // Apply distance filter
    if (distanceFilter && distanceFilter !== 'all') {
      filtered = filtered.filter(booking => {
        const distance = booking.tenant?.distanceToCampus || 0;
        switch (distanceFilter) {
          case 'close':
            return distance <= 5;
          case 'medium':
            return distance > 5 && distance <= 15;
          case 'far':
            return distance > 15;
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'priority':
          aValue = calculatePriorityScore(a);
          bValue = calculatePriorityScore(b);
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        case 'distance':
          aValue = a.tenant?.distanceToCampus || 0;
          bValue = b.tenant?.distanceToCampus || 0;
          break;
        case 'tenantName':
          aValue = (a.tenant?.user?.fullName || '').toLowerCase();
          bValue = (b.tenant?.user?.fullName || '').toLowerCase();
          break;
        case 'amount':
          aValue = parseFloat(a.totalAmount || 0);
          bValue = parseFloat(b.totalAmount || 0);
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });
    
    console.log(`Applied filters - ${filtered.length} bookings remain from ${bookingsToFilter.length}`);
    return filtered;
  };

  // Client-side pagination function
  const paginateBookings = (filteredBookings) => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return filteredBookings.slice(startIndex, endIndex);
  };

  const fetchBookingStats = async () => {
    try {
      // Get all bookings to calculate proper stats
      const allBookingsResponse = await bookingService.getBookings({ limit: 500 });
      const allBookings = allBookingsResponse.bookings || [];
      const totalCount = allBookingsResponse.totalCount || allBookingsResponse.total || allBookings.length;
      
      console.log(`Fetched ${allBookings.length} bookings for stats out of ${totalCount} total`);
      
      // Calculate status counts from all bookings
      let baseStats = {
        total: totalCount,
        pending: 0,
        approved: 0,
        rejected: 0,
        active: 0
      };
      
      allBookings.forEach(booking => {
        switch (booking.status) {
          case 'pending': baseStats.pending++; break;
          case 'approved': baseStats.approved++; break;
          case 'rejected': baseStats.rejected++; break;
          case 'active': baseStats.active++; break;
        }
      });      // Use all bookings for enhanced stats calculation
      const enhancedStats = allBookings.reduce((acc, booking) => {
        // Make sure distance is a number to avoid NaN issues
        const distance = booking.tenant?.distanceToCampus ? parseFloat(booking.tenant.distanceToCampus) : 0;
        
        acc.totalDistance += distance;
        
        if (distance <= 5) acc.closeProximity++;
        else if (distance <= 15) acc.mediumProximity++;
        else acc.farProximity++;
        
        // Priority calculations
        const priorityScore = calculatePriorityScore(booking);
        acc.totalPriorityScore += priorityScore;
        
        if (priorityScore >= 80) acc.highPriorityCount++;
        if (booking.tenant?.isAfirmasi) acc.afirmasiCount++;
        
        return acc;
      }, { 
        totalDistance: 0, 
        closeProximity: 0, 
        mediumProximity: 0, 
        farProximity: 0,
        totalPriorityScore: 0,
        highPriorityCount: 0,
        afirmasiCount: 0
      });

      // Log the enhanced stats for debugging
      console.log('Enhanced stats calculated:', enhancedStats);
      console.log('Stats calculated from all bookings:', allBookings.length);

      setStats({
        ...baseStats,
        total: allBookings.length, // Use actual total count
        averageDistance: allBookings.length > 0 ? (enhancedStats.totalDistance / allBookings.length) : 0,
        closeProximity: enhancedStats.closeProximity,
        mediumProximity: enhancedStats.mediumProximity,
        farProximity: enhancedStats.farProximity,
        afirmasiCount: enhancedStats.afirmasiCount,
        highPriorityCount: enhancedStats.highPriorityCount,
        averagePriorityScore: allBookings.length > 0 ? (enhancedStats.totalPriorityScore / allBookings.length) : 0
      });
    } catch (error) {
      console.error('Failed to fetch booking stats:', error);
      // Fallback stats
      setStats({
        total: bookings.length,
        pending: 0,
        approved: 0,
        rejected: 0,
        active: 0,
        averageDistance: 0,
        closeProximity: 0,
        mediumProximity: 0,
        farProximity: 0,
        afirmasiCount: 0,
        highPriorityCount: 0,
        averagePriorityScore: 0
      });
    }
  };

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================
  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    onDetailOpen();
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({
      ...prev,
      page: 1, // Reset to first page when changing limit
      limit: parseInt(newLimit)
    }));
  };

  // Filter handlers with pagination reset
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDistanceFilterChange = (e) => {
    setDistanceFilter(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleApproveBooking = async (bookingId) => {
    // Check if user has permission to approve
    if (!canApprove) {
      toast({
        title: 'Access Denied',
        description: getPermissionDeniedMessage('approve bookings'),
        status: 'warning',
        duration: 6000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    try {
      // Get current user ID from auth context or localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const approverId = currentUser.userId || currentUser.user_id || 1; // fallback to 1 if not found
      
      console.log('🔍 Debug: Attempting to approve booking with user:', currentUser);
      console.log('🔍 Debug: Approver ID:', approverId);
      
      const response = await bookingService.approveBooking(bookingId, approverId, 'Booking approved by admin');
      
      console.log('🔍 Debug: Backend response:', response);
      console.log('🔍 Debug: Response status:', response?.status);
      console.log('🔍 Debug: Response message:', response?.message);
      
      // Check if the backend returned an error status
      if (response && response.status === 'error') {
        const errorMessage = response.message || 'Unknown error occurred';
        
        console.log('🔍 Debug: Error detected, message:', errorMessage);
        
        // Check if it's a permission-denied error
        if (errorMessage.toLowerCase().includes('permission denied') || 
            errorMessage.toLowerCase().includes('insufficient privileges') ||
            errorMessage.toLowerCase().includes('only wakil_direktorat can approve')) {
          
          console.log('🔍 Debug: Permission denied error detected');
          toast({
            title: 'Access Denied',
            description: 'Only Wakil Direktorat can approve bookings. Please contact an authorized user.',
            status: 'warning',
            duration: 6000,
            isClosable: true,
            position: 'top',
          });
        } else {
          // Other types of errors
          console.log('🔍 Debug: Other error type detected');
          toast({
            title: 'Approval Failed',
            description: errorMessage,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
        return;
      }
      
      // Check if backend silently rejected instead of approving (permission issue)
      if (response && response.approval && response.approval.approved === false) {
        console.log('🔍 Debug: Backend silently rejected booking instead of approving - permission issue detected');
        
        // Check if the message mentions wakil_direktorat (indicating permission issue)
        const statusMessage = response.status?.message || '';
        if (statusMessage.toLowerCase().includes('wakil_direktorat')) {
          toast({
            title: 'Access Denied',
            description: 'Only Wakil Direktorat can approve bookings. Your request was automatically rejected.',
            status: 'warning',
            duration: 6000,
            isClosable: true,
            position: 'top',
          });
          fetchBookings();
          fetchBookingStats();
          return;
        }
        
        // Other rejection reasons
        toast({
          title: 'Booking Rejected',
          description: statusMessage || 'Booking was rejected instead of approved.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        fetchBookings();
        fetchBookingStats();
        return;
      }
      
      // Check if we got a successful approval
      if (response && response.approval && response.approval.approved === true) {
        console.log('🔍 Debug: Legitimate approval success');
        toast({
          title: 'Success',
          description: 'Booking approved successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchBookings();
        fetchBookingStats();
        return;
      }
      
      // Fallback - something unexpected happened
      console.log('🔍 Debug: Unexpected response structure');
      toast({
        title: 'Unexpected Response',
        description: 'Received unexpected response from server. Please refresh and try again.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      
    } catch (error) {
      // Network or other critical errors
      console.log('🔍 Debug: Exception caught:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve booking - please try again',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };
  const handleRejectBooking = async (bookingId, reason = 'Admin decision') => {
    try {
      // Get current user ID from auth context or localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const approverId = currentUser.userId || currentUser.user_id || 1; // fallback to 1 if not found
      
      const response = await bookingService.rejectBooking(bookingId, approverId, reason);
      
      // Check if the backend returned an error status
      if (response && response.status === 'error') {
        toast({
          title: 'Access Denied',
          description: response.message || 'You do not have permission to reject bookings',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      // Success case
      toast({
        title: 'Success',
        description: 'Booking rejected successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchBookings();
      fetchBookingStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject booking',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Function to open rejection modal
  const openRejectionModal = (booking) => {
    setBookingToReject(booking);
    onRejectionOpen();
  };

  // Function to handle rejection from modal
  const handleRejectionFromModal = async (bookingId, reason) => {
    await handleRejectBooking(bookingId, reason);
    onRejectionClose();
    setBookingToReject(null);
  };

  // Alternative simpler approval function using the utility
  const handleApproveBookingSimple = async (bookingId) => {
    // Get current user ID from auth context or localStorage
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const approverId = currentUser.userId || currentUser.user_id || 1;
    
    const success = await handleApiCall(
      () => bookingService.approveBooking(bookingId, approverId, 'Booking approved by admin'),
      toast,
      {
        action: 'approve bookings',
        successTitle: 'Success',
        successMessage: 'Booking approved successfully'
      }
    );
    
    if (success) {
      fetchBookings();
      fetchBookingStats();
    }
  };

  const onBookingUpdated = () => {
    fetchBookings();
    fetchBookingStats();
  };

  // ===================================================================
  // UTILITY FUNCTIONS
  // ===================================================================
  const getDistanceColor = (distance) => {
    if (distance > 15) return 'green';     // Far distances are now high priority (green)
    if (distance > 5) return 'yellow';     // Medium distances are medium priority
    return 'red';                          // Close distances are lowest priority (red)
  };

  const getDistancePriority = (distance) => {
    if (distance > 15) return 'high';      // Far distances are high priority
    if (distance > 5) return 'medium';     // Medium distances are medium priority
    return 'low';                          // Close distances are low priority
  };
  const getDistanceLabel = (distance) => {
    if (distance > 100) return 'Very Far (Highest Priority)';
    if (distance > 50) return 'Extremely Far (Very High Priority)';
    if (distance > 15) return 'Far (High Priority)';
    if (distance > 5) return 'Medium (Medium Priority)';
    return 'Close (Low Priority)';
  };

  const isToday = (date) => {
    const today = new Date();
    const bookingDate = new Date(date);
    return bookingDate.toDateString() === today.toDateString();
  };

  const isThisWeek = (date) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const bookingDate = new Date(date);
    return bookingDate >= weekAgo && bookingDate <= now;
  };

  const isThisMonth = (date) => {
    const now = new Date();
    const bookingDate = new Date(date);
    return bookingDate.getMonth() === now.getMonth() && 
           bookingDate.getFullYear() === now.getFullYear();
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'orange',
      approved: 'green',
      rejected: 'red',
      active: 'blue',
      completed: 'gray',
      cancelled: 'red'
    };
    return statusColors[status] || 'gray';
  };

  const getStatusIcon = (status) => {
    const statusIcons = {
      pending: <FiClock />,
      approved: <FiCheckCircle />,
      rejected: <FiX />,
      active: <FiUser />,
      completed: <FiCheck />,
      cancelled: <FiAlertCircle />
    };
    return statusIcons[status] || <FiFileText />;
  };

  const getProgressValue = (status) => {
    const progressValues = {
      pending: 25,
      approved: 50,
      active: 75,
      completed: 100
    };
    return progressValues[status] || 0;
  };

  // ===================================================================
  // RENDER CONDITIONS
  // ===================================================================
  if (loading) {
    return (
      <AdminLayout>
        <Center h="400px">
          <Spinner size="xl" color="blue.500" />
        </Center>
      </AdminLayout>
    );  }

  // ===================================================================
  // MAIN RENDER
  // ===================================================================
  return (
    <AdminLayout>
      <Box p={6}>
        {/* Admin Permission Warning */}
        {isAdmin && (
          <Alert status="info" mb={6} borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Informasi untuk Administrator</Text>
              <Text fontSize="sm">
                Anda dapat melihat dan mengelola detail booking, namun hanya Wakil Direktorat dan Super Admin yang dapat menyetujui atau menolak booking.
              </Text>
            </Box>
          </Alert>
        )}

        {/* Header Section */}
        <Flex justify="space-between" align="center" mb={6}>
          <VStack align="start" spacing={1}>
            <Text fontSize="2xl" fontWeight="bold">Manajemen Booking</Text>
            <Text color="gray.600">Kelola pemesanan kamar dengan sistem prioritas berbasis jarak</Text>
          </VStack>
        </Flex>

        {/* Enhanced Statistics Cards with Distance */}
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6} mb={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Booking</StatLabel>
                <StatNumber>{stats.total}</StatNumber>
                <StatHelpText>
                  <HStack>
                    <FiFileText />
                    <Text>Booking sepanjang waktu</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Rata-rata Jarak</StatLabel>
                <StatNumber color="blue.500">{stats.averageDistance.toFixed(1)} km</StatNumber>
                <StatHelpText>
                  <HStack>
                    <FiMapPin />
                    <Text>Ke kampus</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Jarak Dekat</StatLabel>
                <StatNumber color="red.500">{stats.closeProximity}</StatNumber>
                <StatHelpText>
                  <HStack>
                    <FiTarget />
                    <Text>≤ 5km dari kampus (Prioritas rendah)</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Jarak Sedang</StatLabel>
                <StatNumber color="yellow.500">{stats.mediumProximity}</StatNumber>
                <StatHelpText>
                  <HStack>
                    <FiNavigation />
                    <Text>5-15km (Prioritas sedang)</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Jarak Jauh</StatLabel>
                <StatNumber color="green.500">{stats.farProximity}</StatNumber>
                <StatHelpText>
                  <HStack>
                    <FiTrendingUp />
                    <Text>> 15km dari kampus (Prioritas tinggi)</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Mahasiswa Afirmasi</StatLabel>
                <StatNumber color="purple.500">{stats.afirmasiCount}</StatNumber>
                <StatHelpText>
                  <HStack>
                    <FiUsers />
                    <Text>Prioritas lebih tinggi</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Prioritas Tinggi</StatLabel>
                <StatNumber color="red.500">{stats.highPriorityCount}</StatNumber>
                <StatHelpText>
                  <HStack>
                    <FiAlertCircle />
                    <Text>Skor ≥ 80 poin</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Rata-rata Skor Prioritas</StatLabel>
                <StatNumber color="teal.500">{stats.averagePriorityScore.toFixed(1)}</StatNumber>
                <StatHelpText>
                  <HStack>
                    <FiTrendingUp />
                    <Text>Dari 160 poin</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>        </Grid>

        {/* Priority System Explanation */}
        <Card mb={6} bg="blue.50" borderColor="blue.200">
          <CardBody>
            <VStack align="start" spacing={3}>
              <HStack>
                <FiAlertCircle color="blue" />
                <Text fontWeight="bold" color="blue.700">
                  Sistem Peringkat Prioritas
                </Text>
              </HStack>
              <Text fontSize="sm" color="blue.600">
                Booking diurutkan otomatis berdasarkan keadilan sosial dan kebutuhan hunian:
              </Text>
              <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} w="100%">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold" fontSize="sm" color="purple.700">
                    📚 Mahasiswa Afirmasi: +50 poin
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    Prioritas untuk mahasiswa kurang mampu
                  </Text>
                </VStack>
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold" fontSize="sm" color="green.700">
                    🏠 Jarak dari Kampus: 0-100 poin
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    Semakin jauh semakin prioritas
                  </Text>
                </VStack>
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold" fontSize="sm" color="blue.700">
                    🎓 Status Mahasiswa: +10 poin
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    Mahasiswa lebih diutamakan
                  </Text>
                </VStack>
              </Grid>
            </VStack>
          </CardBody>
        </Card>

        {/* Enhanced Filters Section with Distance Controls */}
        <Card mb={6}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
                <GridItem>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FiSearch color="gray.300" />
                    </InputLeftElement>
                    <Input
                      placeholder="Cari berdasarkan penyewa, kamar, atau ID booking..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </InputGroup>
                </GridItem>

                <GridItem>
                  <Select
                    placeholder="Filter berdasarkan status"
                    value={statusFilter}
                    onChange={handleStatusFilterChange}
                  >
                    <option value="pending">Menunggu</option>
                    <option value="approved">Disetujui</option>
                    <option value="rejected">Ditolak</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                  </Select>
                </GridItem>

                <GridItem>
                  <Select
                    placeholder="Filter berdasarkan jarak"
                    value={distanceFilter}
                    onChange={handleDistanceFilterChange}
                  >
                    <option value="all">Semua Jarak</option>
                    <option value="close">Dekat (≤ 5km)</option>
                    <option value="medium">Sedang (5-15km)</option>
                    <option value="far">Jauh (> 15km)</option>
                  </Select>
                </GridItem>

                <GridItem>
                  <Select
                    placeholder="Urutkan berdasarkan"
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                  >
                    <option value="priority">Skor Prioritas (Rekomendasi)</option>
                    <option value="createdAt">Tanggal Pengajuan</option>
                    <option value="distance">Jarak ke Kampus</option>
                    <option value="tenantName">Nama Penyewa</option>
                    <option value="amount">Jumlah Total</option>
                  </Select>
                </GridItem>

                <GridItem>
                  <Select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </Select>
                </GridItem>
                
                <GridItem>
                  <HStack spacing={2}>
                    <Text fontSize="sm" color="gray.600">Item per halaman:</Text>
                    <Select
                      width="100px"
                      value={pagination.limit}
                      onChange={(e) => handleLimitChange(e.target.value)}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="15">15</option>
                      <option value="20">20</option>
                      <option value="25">25</option>
                    </Select>
                  </HStack>
                </GridItem>
              </Grid>
            </VStack>
          </CardBody>
        </Card>

        {/* Enhanced Booking Table with Distance Information */}
        <Card>
          <CardBody p={0}>
            {bookings.length === 0 ? (
              <Center p={8}>
                <VStack>
                  <FiFileText size={48} color="gray.300" />
                  <Text fontSize="lg" color="gray.500">Tidak ada booking ditemukan</Text>
                  <Text color="gray.400">
                    {allBookings.length === 0 
                      ? "Belum ada booking yang terdaftar dalam sistem."
                      : "Tidak ada booking yang sesuai dengan filter yang dipilih. Coba ubah atau hapus beberapa filter."
                    }
                  </Text>
                  {allBookings.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="blue"
                      mt={2}
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('');
                        setDateFilter('');
                        setDistanceFilter('all');
                        setSortBy('priority');
                        setSortOrder('desc');
                      }}
                    >
                      Hapus Semua Filter
                    </Button>
                  )}
                </VStack>
              </Center>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th>ID Booking</Th>
                      <Th>Penyewa</Th>
                      <Th>Jarak ke Kampus</Th>
                      <Th>Kamar</Th>
                      <Th>Tanggal Pengajuan</Th>
                      <Th>Tanggal Masuk</Th>
                      <Th>Status</Th>
                      <Th>Prioritas</Th>
                      <Th>Total</Th>
                      <Th>Aksi</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {bookings.map((booking) => {
                      const distance = booking.tenant?.distanceToCampus || 0;
                      const priorityData = getPriorityLabel(booking);
                      
                      return (
                        <Tr key={booking.bookingId} _hover={{ bg: 'gray.50' }}>
                          <Td fontWeight="medium">BOOK-{booking.bookingId}</Td>
                          <Td>
                            <HStack>
                              <Avatar 
                                size="sm" 
                                name={booking.tenant?.user?.fullName}
                                src={booking.tenant?.photo}
                              />
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="medium">
                                  {booking.tenant?.user?.fullName}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  {booking.tenant?.user?.email}
                                </Text>
                                <HStack spacing={1}>
                                  <Text fontSize="xs" color="gray.500">
                                    NIM: {booking.tenant?.nim}
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    Jurusan: {booking.tenant?.jurusan || '-'}
                                  </Text>
                                  <HStack spacing={1}>
                                    {booking.tenant?.isAfirmasi && (
                                      <Badge colorScheme="purple" size="xs">
                                        Afirmasi
                                      </Badge>
                                    )}
                                  </HStack>
                                </HStack>
                              </VStack>
                            </HStack>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={1}>
                              <HStack>
                                <FiMapPin />
                                <Text fontWeight="medium">{distance.toFixed(1)} km</Text>
                              </HStack>
                              <Badge 
                                colorScheme={getDistanceColor(distance)}
                                size="sm"
                              >
                                {getDistanceLabel(distance).replace('Very Far (Highest Priority)', 'Sangat Jauh (Prioritas Tertinggi)')
                                  .replace('Extremely Far (Very High Priority)', 'Ekstrem Jauh (Prioritas Sangat Tinggi)')
                                  .replace('Far (High Priority)', 'Jauh (Prioritas Tinggi)')
                                  .replace('Medium (Medium Priority)', 'Sedang (Prioritas Sedang)')
                                  .replace('Close (Low Priority)', 'Dekat (Prioritas Rendah)')}
                              </Badge>
                            </VStack>
                          </Td>
                          <Td>
                            <HStack>
                              <FiHome />
                              <Text>{booking.room?.name}</Text>
                            </HStack>
                          </Td>
                          <Td>
                            <HStack>
                              <FiCalendar />
                              <Text>{new Date(booking.createdAt).toLocaleDateString('id-ID')}</Text>
                            </HStack>
                          </Td>
                          <Td>
                            <HStack>
                              {booking.checkInDate ? (
                                <>
                                  <FiCalendar />
                                  <Text>{new Date(booking.checkInDate).toLocaleDateString('id-ID')}</Text>
                                </>
                              ) : (
                                <Text color="gray.500">Belum Ditentukan</Text>
                              )}
                            </HStack>
                          </Td>
                          <Td>
                            <Badge 
                              colorScheme={getStatusColor(booking.status)}
                            >
                              {getStatusIcon(booking.status) && (
                                <Box as="span" mr={1} display="inline-flex" alignItems="center">
                                  {getStatusIcon(booking.status)}
                                </Box>
                              )}
                              {booking.status === 'pending' && 'Menunggu'}
                              {booking.status === 'approved' && 'Disetujui'}
                              {booking.status === 'rejected' && 'Ditolak'}
                              {booking.status === 'active' && 'Aktif'}
                              {booking.status === 'completed' && 'Selesai'}
                              {booking.status === 'cancelled' && 'Dibatalkan'}
                              {!['pending','approved','rejected','active','completed','cancelled'].includes(booking.status) && booking.status}
                            </Badge>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={1}>
                              <HStack>
                                <Text fontWeight="bold" fontSize="lg" color={`${priorityData.color}.500`}>
                                  {priorityData.score}
                                </Text>
                                <Text fontSize="xs" color="gray.500">poin</Text>
                              </HStack>
                              <Badge 
                                colorScheme={priorityData.color}
                                size="sm"
                              >
                                {priorityData.level === 'Very High' && 'Sangat Tinggi'}
                                {priorityData.level === 'High' && 'Tinggi'}
                                {priorityData.level === 'Medium' && 'Sedang'}
                                {priorityData.level === 'Low' && 'Rendah'}
                                {!['Very High','High','Medium','Low'].includes(priorityData.level) && priorityData.level}
                              </Badge>
                              <HStack spacing={1} fontSize="xs">
                                <Text color="gray.500">
                                  {distance.toFixed(1)}km
                                </Text>
                                {booking.tenant?.isAfirmasi && (
                                  <FiUsers color="purple" />
                                )}
                                {booking.status === 'pending' && (
                                  <FiClock color="orange" />
                                )}
                              </HStack>
                            </VStack>
                          </Td>
                          <Td>
                            <HStack>
                              <FiDollarSign />
                              <Text>Rp {booking.totalAmount?.toLocaleString('id-ID')}</Text>
                            </HStack>
                          </Td>
                          <Td>
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<FiMoreVertical />}
                                variant="ghost"
                                size="sm"
                              />
                              <MenuList>
                                <MenuItem 
                                  icon={<FiEye />}
                                  onClick={() => handleViewBooking(booking)}
                                >
                                  Lihat Detail
                                </MenuItem>
                                {booking.status === 'pending' && canApprove && (
                                  <>
                                    <MenuItem 
                                      icon={<FiCheck />}
                                      color="green.500"
                                      onClick={() => handleApproveBooking(booking.bookingId)}
                                    >
                                      Setujui Booking
                                    </MenuItem>
                                    <MenuItem 
                                      icon={<FiX />}
                                      color="red.500"
                                      onClick={() => openRejectionModal(booking)}
                                    >
                                      Tolak Booking
                                    </MenuItem>
                                  </>
                                )}
                                {booking.status === 'pending' && isAdmin && (
                                  <MenuItem 
                                    icon={<FiAlertCircle />}
                                    color="orange.500"
                                    isDisabled
                                  >
                                    Hanya Wakil Direktorat yang Bisa Menyetujui
                                  </MenuItem>
                                )}
                              </MenuList>
                            </Menu>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </Box>
            )}
          </CardBody>
          
          {/* Pagination Controls */}
          {bookings.length > 0 && (
            <Box p={4} borderTop="1px" borderColor="gray.200">
              <Flex justify="space-between" align="center" mb={4}>
                <Text fontSize="sm" color="gray.600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} entries
                </Text>
                
                <HStack spacing={2}>
                  <Text fontSize="sm" mr={2}>Items per page:</Text>
                  <Select
                    size="sm"
                    width="80px"
                    value={pagination.limit}
                    onChange={(e) => setPagination(prev => ({ 
                      ...prev, 
                      limit: parseInt(e.target.value),
                      page: 1 
                    }))}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </Select>
                </HStack>
              </Flex>
              
              <Flex justify="center" align="center">
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    leftIcon={<Text fontSize="sm">←</Text>}
                  >
                    Previous
                  </Button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === pagination.totalPages || 
                      Math.abs(page - pagination.page) <= 2
                    )
                    .map((page, index, array) => {
                      if (index > 0 && array[index - 1] !== page - 1) {
                        return [
                          <Text key={`ellipsis-${page}`} color="gray.500">...</Text>,
                          <Button
                            key={page}
                            size="sm"
                            variant={pagination.page === page ? "solid" : "outline"}
                            colorScheme={pagination.page === page ? "blue" : "gray"}
                            onClick={() => setPagination(prev => ({ ...prev, page }))}
                          >
                            {page}
                          </Button>
                        ];
                      }
                      return (
                        <Button
                          key={page}
                          size="sm"
                          variant={pagination.page === page ? "solid" : "outline"}
                          colorScheme={pagination.page === page ? "blue" : "gray"}
                          onClick={() => setPagination(prev => ({ ...prev, page }))}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  
                  <Button
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    rightIcon={<Text fontSize="sm">→</Text>}
                  >
                    Next
                  </Button>
                </HStack>
              </Flex>
            </Box>
          )}
        </Card>

        <BookingDetailModal
          isOpen={isDetailOpen}
          onClose={onDetailClose}
          booking={selectedBooking}
          onBookingUpdated={onBookingUpdated}
        />

        <BookingRejectionModal
          isOpen={isRejectionOpen}
          onClose={onRejectionClose}
          booking={bookingToReject}
          onRejected={handleRejectionFromModal}
        />
      </Box>
    </AdminLayout>
  );
};

export default BookingManagement;
