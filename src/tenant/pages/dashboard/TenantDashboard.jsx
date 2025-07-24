import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Icon,
  Divider,
  Image,
  Skeleton,
  useColorModeValue,
  useToast,
  SimpleGrid,
  Progress,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Avatar,
  AvatarBadge,
} from '@chakra-ui/react';
import { 
  FaCalendarCheck, 
  FaFileInvoice, 
  FaRegClock,
  FaKey,
  FaCheck,
  FaSignOutAlt,
  FaHome,
  FaClipboardCheck,
  FaMoneyBillWave,
  FaChevronRight,
  FaIdCard,
  FaFilePdf,
  FaCalendarAlt,
  FaUpload,
} from 'react-icons/fa';
import { BsHouseDoor, BsHouseCheck, BsCalendarX } from 'react-icons/bs';
import { useTenantAuth } from '../../context/tenantAuthContext';
import TenantLayout from '../../components/layout/TenantLayout';
import bookingService from '../../services/bookingService';
import invoiceService from '../../services/invoiceService';
import documentService from '../../services/documentService';
import paymentService from '../../services/paymentService';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { formatCurrency } from '../../../utils/formatters';
import BookingStatusBadge from '../../components/booking/BookingStatusBadge';
import PaymentStatusBadge from '../../components/payment/PaymentStatusBadge';
import DocumentCard from '../../components/document/DocumentCard';
import WelcomeSection from '../../components/dashboard/WelcomeSection';

const TenantDashboard = () => {
  const { tenant } = useTenantAuth();
  const [bookings, setBookings] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [pendingInvoice, setPendingInvoice] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const toast = useToast();
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const statCardBg = useColorModeValue('gray.50', 'gray.800');
  const highlightColor = useColorModeValue('brand.50', 'brand.900');
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!tenant?.tenantId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
          // Fetch bookings
        const bookingsResponse = await bookingService.getTenantBookings(tenant.tenantId);
        
        if (bookingsResponse && bookingsResponse.bookings) {
          const sortedBookings = [...bookingsResponse.bookings].sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          
          setBookings(sortedBookings);
            // Find active booking (prioritize checked-in, then approved)
          const activeBookings = sortedBookings.filter(b => ['checked_in', 'approved'].includes(b.status));
          const activeBooking = activeBookings.find(b => b.status === 'checked_in') || 
                               activeBookings.find(b => b.status === 'approved');
          
          setActiveBooking(activeBooking);
        }
        
        // Fetch invoices using tenant-specific endpoint
        if (tenant?.tenantId) {
          const invoicesResponse = await paymentService.getTenantInvoices(tenant.tenantId);
          
          if (invoicesResponse && invoicesResponse.invoices) {
            const sortedInvoices = [...invoicesResponse.invoices].sort((a, b) => {
              return new Date(b.issuedAt) - new Date(a.issuedAt);
            });
            
            setInvoices(sortedInvoices);
            
            // Find pending invoice
            const pendingInvoice = sortedInvoices.find(inv => inv.status === 'pending');
            setPendingInvoice(pendingInvoice);
          }
        }
          // Fetch documents
        const documentsResponse = await documentService.getTenantDocuments(tenant.tenantId);
        
        if (documentsResponse && documentsResponse.documents) {
          setDocuments(documentsResponse.documents);
        }
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
        
        if (process.env.NODE_ENV === 'development') {
          console.error('Dashboard error:', err.message);
        }
        
        toast({
          title: 'Error loading dashboard',
          description: err.message || 'Failed to load your dashboard data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();  }, [toast, tenant?.tenantId]);
    // Handle document deletion
  const handleDocumentDelete = async (documentId) => {
    try {
      console.log('Dashboard: Attempting to delete document', documentId);
      console.log('Current tenant:', tenant);
      
      await documentService.deleteDocument(documentId);
      
      // Update the documents list
      setDocuments(prev => prev.filter(doc => doc.docId !== documentId));
        toast({
        title: '🗑️ Document Deleted Successfully',
        description: 'The document has been removed from your dashboard.',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
        variant: 'subtle',
      });
    } catch (err) {
      console.error("Error deleting document:", err);      toast({
        title: '❌ Delete Failed',
        description: err.message || 'Failed to delete document. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
        variant: 'subtle',
      });
      throw err; // Re-throw so DocumentViewer can handle it too
    }
  };
    // Calculate document verification status
  const safeDocuments = Array.isArray(documents) ? documents : [];
  const documentsVerified = safeDocuments.length > 0 && safeDocuments.every(doc => doc.status === 'approved');
  const documentsPending = safeDocuments.length > 0 && safeDocuments.some(doc => doc.status === 'pending');
  
  // Count documents by status
  const documentCounts = {
    total: safeDocuments.length,
    approved: safeDocuments.filter(doc => doc.status === 'approved').length,
    pending: safeDocuments.filter(doc => doc.status === 'pending').length,
    rejected: safeDocuments.filter(doc => doc.status === 'rejected').length
  };
  // Calculate verification progress percentage
  const verificationProgress = safeDocuments.length && documentCounts.total > 0 ? 
    Math.round((documentCounts.approved / documentCounts.total) * 100) : 0;
    // Helper function to format date range
  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };
  // Helper function to safely format a single date
  const safeFormatDate = (date) => {
    if (!date) return 'N/A';
    try {
      // Add debug logging for problematic dates
      if (date === 'Invalid date' || date === null || date === undefined) {
        console.warn('Problematic date value:', date);
        return 'N/A';
      }
      return formatDate(date);
    } catch (error) {
      console.warn('Date formatting error:', error, 'for date:', date);
      return 'Invalid date';
    }
  };
  
  return (
    <TenantLayout>
      <Container maxW="container.xl" py={8}>
        {/* Welcome Section */}
        <WelcomeSection tenant={tenant} />
        
        {/* Dashboard Stats */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} mb={8}>
          <Stat
            px={4}
            py={5}
            bg={statCardBg}
            borderRadius="lg"
            boxShadow="sm"
          >
            <HStack spacing={4}>
              <Box
                p={2}
                bg="brand.100"
                borderRadius="md"
                color="brand.700"
              >
                <Icon as={FaHome} w={6} h={6} />
              </Box>
              <Box>
                <StatLabel fontWeight="medium">Total Bookings</StatLabel>
                <StatNumber>{Array.isArray(bookings) ? bookings.length : 0}</StatNumber>
                <StatHelpText>All time</StatHelpText>
              </Box>
            </HStack>
          </Stat>
          
          <Stat
            px={4}
            py={5}
            bg={statCardBg}
            borderRadius="lg"
            boxShadow="sm"
          >
            <HStack spacing={4}>
              <Box
                p={2}
                bg="green.100"
                borderRadius="md"
                color="green.700"
              >
                <Icon as={FaCheck} w={6} h={6} />
              </Box>
              <Box>
                <StatLabel fontWeight="medium">Completed Stays</StatLabel>
                <StatNumber>{Array.isArray(bookings) ? bookings.filter(b => b.status === 'completed').length : 0}</StatNumber>
                <StatHelpText>Check-out completed</StatHelpText>
              </Box>
            </HStack>
          </Stat>
          
          <Stat
            px={4}
            py={5}
            bg={statCardBg}
            borderRadius="lg"
            boxShadow="sm"
          >
            <HStack spacing={4}>
              <Box
                p={2}
                bg="blue.100"
                borderRadius="md"
                color="blue.700"
              >
                <Icon as={BsHouseCheck} w={6} h={6} />
              </Box>
              <Box>
                <StatLabel fontWeight="medium">Active Bookings</StatLabel>                <StatNumber>
                  {Array.isArray(bookings) ? bookings.filter(b => ['approved', 'checked_in'].includes(b.status)).length : 0}
                </StatNumber>
                <StatHelpText>Current stays</StatHelpText>
              </Box>
            </HStack>
          </Stat>
        </SimpleGrid>
        
        {/* Main Dashboard Content */}
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
          {/* Left Column */}
          <GridItem>
            {/* Document Verification Status */}
            <Card bg={cardBg} boxShadow="md" mb={8}>
              <CardBody>
                <HStack spacing={4} alignItems="center">
                  <Box
                    bg={documentsVerified ? 'green.100' : documentsPending ? 'yellow.100' : 'red.100'}
                    p={3}
                    borderRadius="md"
                  >
                    <Icon 
                      as={documentsVerified ? FaCheck : FaRegClock} 
                      color={documentsVerified ? 'green.500' : documentsPending ? 'yellow.500' : 'red.500'}
                      boxSize={6}
                    />
                  </Box>
                  <Box flex="1">
                    <Heading size="md">Document Verification</Heading>
                    <Text>
                      {documentsVerified 
                        ? 'All your documents have been verified!' 
                        : documents.length === 0
                          ? 'Please upload your documents for verification'
                          : documentsPending
                            ? 'Your documents are pending verification'
                            : 'Some documents require your attention'}
                    </Text>
                    <Progress 
                      value={verificationProgress} 
                      colorScheme={documentsVerified ? 'green' : 'yellow'} 
                      size="sm" 
                      mt={2} 
                      borderRadius="full" 
                    />
                  </Box>
                  <Button
                    as={RouterLink}
                    to="/tenant/documents"
                    variant="ghost"
                    colorScheme="brand"
                    rightIcon={<FaChevronRight />}
                  >
                    {documents.length === 0 ? 'Upload Documents' : 'View Documents'}
                  </Button>
                </HStack>
                  {documents.length > 0 && (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={6}>
                    {documents.map(doc => (
                      <DocumentCard 
                        key={doc.docId} 
                        document={doc} 
                        showStatus 
                        onDelete={handleDocumentDelete}
                      />
                    ))}
                  </SimpleGrid>
                )}
              </CardBody>
            </Card>
            
            {/* Active Booking Section */}
            {activeBooking ? (
              <Card bg={cardBg} boxShadow="md" mb={8} borderWidth="1px" borderColor={borderColor}>
                <CardHeader bg={highlightColor} py={4}>
                  <Flex justify="space-between" align="center">
                    <Heading size="md">Active Booking</Heading>
                    <BookingStatusBadge status={activeBooking.status} />
                  </Flex>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>                    <Box>
                      <Text fontWeight="bold" mb={2}>Room</Text>
                      <Text fontSize="lg" fontWeight="semibold">{activeBooking.room?.name || 'N/A'}</Text>
                      {activeBooking.room?.classification && (
                        <Badge colorScheme="blue" mt={1} fontSize="sm">
                          {activeBooking.room.classification.name === 'laki_laki' ? 'Male' : 
                           activeBooking.room.classification.name === 'perempuan' ? 'Female' :
                           activeBooking.room.classification.name === 'ruang_rapat' ? 'Meeting Room' :
                           activeBooking.room.classification.name}
                        </Badge>
                      )}
                    </Box>
                      <Box>
                      <Text fontWeight="bold" mb={2}>Dates</Text>
                      <VStack align="start" spacing={2}>
                        <HStack>
                          <Icon as={FaCalendarAlt} color="green.500" />
                          <Box>
                            <Text fontSize="sm" color="gray.600">Check-in</Text>
                            <Text fontSize="lg" fontWeight="bold">
                              {safeFormatDate(activeBooking.checkInDate || activeBooking.checkIn || activeBooking.startDate)}
                            </Text>
                          </Box>
                        </HStack>
                        <HStack>
                          <Icon as={FaCalendarAlt} color="red.500" />
                          <Box>
                            <Text fontSize="sm" color="gray.600">Check-out</Text>
                            <Text fontSize="lg" fontWeight="bold">
                              {safeFormatDate(activeBooking.checkOutDate || activeBooking.checkOut || activeBooking.endDate)}
                            </Text>
                          </Box>
                        </HStack>
                      </VStack>
                    </Box>
                      <Box>
                      <Text fontWeight="bold" mb={2}>Total Amount</Text>                      <Text fontSize="2xl" fontWeight="bold" color="brand.500">
                        {formatCurrency(activeBooking?.totalAmount || activeBooking?.amount || 0)}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Booking total cost
                      </Text>
                    </Box>                    <Box>
                      <Text fontWeight="bold" mb={2}>Actions</Text>                      {activeBooking.status === 'approved' ? (
                        (activeBooking.invoice && (activeBooking.invoice.invoiceId || activeBooking.invoice.id)) ? (
                          <Button 
                            leftIcon={<FaFileInvoice />} 
                            colorScheme="blue" 
                            size="sm"
                            as={RouterLink}
                            to={`/tenant/invoices/${activeBooking.invoice.invoiceId || activeBooking.invoice.id}`}
                          >
                            View Invoice Details
                          </Button>
                        ) : (
                          <Button 
                            leftIcon={<FaFileInvoice />} 
                            colorScheme="blue" 
                            size="sm"
                            as={RouterLink}
                            to={`/tenant/invoices`}
                          >
                            View Invoices
                          </Button>
                        )
                      ) : activeBooking.status === 'checked_in' ? (
                        <Button 
                          leftIcon={<FaSignOutAlt />} 
                          colorScheme="blue" 
                          size="sm"
                          as={RouterLink}
                          to={`/tenant/bookings/${activeBooking.bookingId}/check-out`}
                        >
                          Check Out
                        </Button>
                      ) : (
                        <Button 
                          colorScheme="brand" 
                          size="sm"
                          as={RouterLink}
                          to={`/tenant/bookings/${activeBooking.bookingId}`}
                        >
                          View Booking
                        </Button>
                      )}
                    </Box>
                  </SimpleGrid>
                </CardBody>
                <CardFooter bg={cardBg} borderTop="1px" borderColor={borderColor}>
                  <Button
                    as={RouterLink}
                    to={`/tenant/bookings/${activeBooking.bookingId}`}
                    variant="ghost"
                    colorScheme="brand"
                    size="sm"
                    ml="auto"
                    rightIcon={<FaChevronRight />}
                  >
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card bg={cardBg} boxShadow="md" mb={8}>
                <CardBody align="center" py={10}>
                  <Icon as={BsCalendarX} boxSize={12} color="gray.400" mb={4} />
                  <Heading size="md" mb={2}>No Active Booking</Heading>
                  <Text color="gray.500" mb={6}>
                    You don't have any active bookings right now.
                  </Text>
                  <Button
                    as={RouterLink}
                    to="/tenant/rooms"
                    colorScheme="brand"
                    leftIcon={<FaHome />}
                  >
                    Browse Rooms
                  </Button>
                </CardBody>
              </Card>
            )}
            
            {/* Recent Bookings Section */}
            <Card bg={cardBg} boxShadow="md" mb={{ base: 8, lg: 0 }}>
              <CardHeader>
                <Heading size="md">Recent Bookings</Heading>
              </CardHeader>
              <CardBody px={4}>
                {loading ? (
                  <Stack spacing={4}>
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} height="80px" borderRadius="md" />
                    ))}
                  </Stack>
                ) : bookings.length === 0 ? (
                  <Box textAlign="center" py={6}>
                    <Text color="gray.500">No booking history found</Text>
                  </Box>
                ) : (
                  <Stack spacing={4} divider={<Divider />}>
                    {bookings.slice(0, 5).map(booking => (
                      <HStack key={booking.bookingId} spacing={4} p={2}>
                        <Box 
                          bgGradient="linear(to-r, brand.400, brand.600)" 
                          color="white" 
                          p={3} 
                          borderRadius="md"
                          minW="50px"
                          textAlign="center"                        >
                          <Text fontWeight="bold" fontSize="lg">
                            {(() => {
                              const date = new Date(booking.checkIn || booking.startDate);
                              return isNaN(date.getTime()) ? 'N/A' : date.getDate();
                            })()}
                          </Text>
                          <Text fontSize="xs">
                            {(() => {
                              const date = new Date(booking.checkIn || booking.startDate);
                              return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-US', { month: 'short' });
                            })()}
                          </Text>
                        </Box>
                        
                        <Box flex="1">
                          <HStack justify="space-between">
                            <Text fontWeight="bold" noOfLines={1}>
                              {booking.room?.name || 'Room'}
                            </Text>
                            <BookingStatusBadge status={booking.status} />
                          </HStack>
                          <Text fontSize="sm" color="gray.500" noOfLines={1}>
                            {formatDateRange(
                              booking.checkIn || booking.startDate, 
                              booking.checkOut || booking.endDate
                            )}
                          </Text>
                        </Box>
                        
                        <Button
                          as={RouterLink}
                          to={`/tenant/bookings/${booking.bookingId}`}
                          variant="outline"
                          colorScheme="brand"
                          size="sm"
                        >
                          Details
                        </Button>
                      </HStack>
                    ))}
                  </Stack>
                )}
              </CardBody>
              <CardFooter>
                <Button
                  as={RouterLink}
                  to="/tenant/bookings"
                  variant="ghost"
                  colorScheme="brand"
                  size="sm"
                  ml="auto"
                  rightIcon={<FaChevronRight />}
                >
                  View All Bookings
                </Button>
              </CardFooter>
            </Card>
          </GridItem>
          
          {/* Right Column */}
          <GridItem>
            {/* Profile Summary */}
            <Card bg={cardBg} boxShadow="md" mb={8}>
              <CardBody>
                <VStack spacing={6} align="center">
                  <Avatar 
                    size="2xl" 
                    name={tenant?.name} 
                    bg="brand.500" 
                    color="white"
                    src=""
                  >
                    {documentsVerified && <AvatarBadge boxSize="1.25em" bg="green.500" icon={<FaCheck />} />}
                  </Avatar>
                  <Box textAlign="center">
                    <Heading size="md">{tenant?.name}</Heading>
                    <Text color="gray.500" fontSize="sm">{tenant?.email}</Text>
                  </Box>
                  <Divider />
                  <VStack align="stretch" width="100%" spacing={3}>
                    <HStack justify="space-between">
                      <HStack>
                        <Icon as={FaIdCard} color="brand.500" />
                        <Text fontWeight="medium">Student ID</Text>
                      </HStack>
                      <Text>{tenant?.nim || 'Not provided'}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <HStack>
                        <Icon as={FaHome} color="brand.500" />
                        <Text fontWeight="medium">Type</Text>
                      </HStack>
                      <Badge colorScheme="blue">{tenant?.tenant_type || tenant?.tenantType?.name || 'Regular'}</Badge>
                    </HStack>
                  </VStack>
                  <Button
                    as={RouterLink}
                    to="/tenant/profile"
                    colorScheme="brand"
                    variant="outline"
                    width="full"
                  >
                    View Profile
                  </Button>
                </VStack>
              </CardBody>
            </Card>
            
            {/* Pending Payment */}
            {pendingInvoice ? (
              <Card bg={cardBg} boxShadow="md" mb={8} borderWidth="1px" borderColor="orange.100">
                <CardHeader bg="orange.50">
                  <HStack>
                    <Icon as={FaFileInvoice} color="orange.500" boxSize={6} />
                    <Heading size="md">Payment Due</Heading>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <HStack justify="space-between">
                      <Text fontWeight="medium">Invoice Number</Text>
                      <Text>{pendingInvoice.invoiceNo}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="medium">Amount</Text>
                      <Text fontWeight="bold" fontSize="lg" color="brand.600">
                        {formatCurrency(pendingInvoice.amount)}
                      </Text>
                    </HStack>                    <HStack justify="space-between">
                      <Text fontWeight="medium">Due Date</Text>
                      <Text>{safeFormatDate(pendingInvoice.dueDate)}</Text>
                    </HStack>
                    <Button
                      colorScheme="brand"
                      leftIcon={<FaMoneyBillWave />}
                      as={RouterLink}
                      to={`/tenant/invoices/${pendingInvoice.invoiceId}`}
                      width="full"
                    >
                      Pay Now
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ) : null}
            
            {/* Document Upload Reminder */}
            {documents.length === 0 && (
              <Card bg={cardBg} boxShadow="md" mb={8} borderWidth="1px" borderColor="yellow.100">
                <CardHeader bg="yellow.50">
                  <HStack>
                    <Icon as={FaFilePdf} color="yellow.500" boxSize={6} />
                    <Heading size="md">Documents Required</Heading>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <Text>
                      Please upload your required documents to complete your profile verification. 
                      This is necessary for booking rooms at Rusunawa PNJ.
                    </Text>
                    <Button
                      colorScheme="yellow"
                      leftIcon={<FaUpload />}
                      as={RouterLink}
                      to="/tenant/documents/upload"
                      width="full"
                    >
                      Upload Documents
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            )}
            
            {/* Recent Invoices */}
            <Card bg={cardBg} boxShadow="md">
              <CardHeader>
                <Heading size="md">Recent Invoices</Heading>
              </CardHeader>
              <CardBody px={4}>
                {loading ? (
                  <Stack spacing={4}>
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} height="60px" borderRadius="md" />
                    ))}
                  </Stack>
                ) : invoices.length === 0 ? (
                  <Box textAlign="center" py={6}>
                    <Text color="gray.500">No invoices found</Text>
                  </Box>
                ) : (
                  <Stack spacing={4} divider={<Divider />}>
                    {invoices.slice(0, 5).map(invoice => (
                      <HStack key={invoice.invoiceId} spacing={4} p={2}>
                        <Box flex="1">
                          <HStack justify="space-between">
                            <Text fontWeight="bold" noOfLines={1}>
                              {invoice.invoiceNo}
                            </Text>
                            <PaymentStatusBadge status={invoice.status} />
                          </HStack>                          <HStack justify="space-between" mt={1}>
                            <Text fontSize="sm" color="gray.500">
                              {safeFormatDate(invoice.issuedAt)}
                            </Text>
                            <Text fontWeight="medium">
                              {formatCurrency(invoice.amount)}
                            </Text>
                          </HStack>
                        </Box>
                      </HStack>
                    ))}
                  </Stack>
                )}
              </CardBody>
              <CardFooter>
                <Button
                  as={RouterLink}
                  to="/tenant/invoices"
                  variant="ghost"
                  colorScheme="brand"
                  size="sm"
                  ml="auto"
                  rightIcon={<FaChevronRight />}
                >
                  View All Invoices
                </Button>
              </CardFooter>
            </Card>
          </GridItem>
        </Grid>
      </Container>
    </TenantLayout>
  );
};

export default TenantDashboard;
