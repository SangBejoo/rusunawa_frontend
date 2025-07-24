import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Card,
  CardHeader,
  CardBody,
  useColorModeValue,
  SimpleGrid,
  Icon,
  Divider,
  Progress,
  Image,
  List,
  ListItem,
  ListIcon,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import {
  FaCalendarAlt,
  FaMoneyBillWave,
  FaArrowLeft,
  FaCheck,
  FaCheckCircle,
  FaClock,
  FaTimes,
  FaTimesCircle,
  FaExclamationTriangle,
  FaKey,
  FaSignOutAlt,
  FaFileInvoice,
  FaBed,
  FaUserAlt,
  FaUserClock,
  FaCreditCard,
  FaPrint,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa';
import { getRoomImage } from '../../../utils/roomImageUtils';
import bookingService from '../../services/bookingService';
import invoiceService from '../../services/invoiceService';
import paymentService from '../../services/paymentService';
import { formatCurrency } from '../../utils/formatUtils';
import { formatDate } from '../../utils/dateUtils';
import { useTenantAuth } from '../../context/tenantAuthContext';
import TenantLayout from '../../components/layout/TenantLayout';

const BookingDetail = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { tenant } = useTenantAuth();
  const cancelModal = useDisclosure();
  
  const [booking, setBooking] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [hasPendingPayment, setHasPendingPayment] = useState(false);
  
  // Colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('white', 'gray.700');
  
  // Helper functions
  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'approved': return 'green';
      case 'pending': return 'yellow';
      case 'rejected': return 'red';
      case 'cancelled': return 'red';
      case 'completed': return 'blue';
      case 'checked_in': return 'blue';
      default: return 'gray';
    }
  };

  const formatBookingStatus = (status) => {
    switch(status?.toLowerCase()) {
      case 'approved': return 'Approved';
      case 'pending': return 'Pending';
      case 'rejected': return 'Rejected';
      case 'cancelled': return 'Cancelled';
      case 'completed': return 'Completed';
      case 'checked_in': return 'Checked In';
      default: return status || 'Unknown';
    }
  };

  const canCancel = (booking) => {
    return booking && ['pending', 'approved'].includes(booking.status?.toLowerCase());
  };  const checkPendingPayments = async (invoiceId) => {
    try {
      if (!invoiceId) return;
      
      // Get tenant ID from localStorage or context
      const tenantData = JSON.parse(localStorage.getItem('tenant') || '{}');
      const tenantId = tenantData.tenantId || tenantData.tenant_id || tenantData.id;
      
      if (!tenantId) {
        console.warn('No tenant ID available for payment check');
        return;
      }
      
      // Use the centralized function with exact API field matching
      const result = await paymentService.checkPendingManualPayments(invoiceId, tenantId);
      
      if (result.hasPendingPayments && result.pendingPayments.length > 0) {
        const pendingPayment = result.pendingPayments[0];
        setPendingPayment(pendingPayment);
        setHasPendingPayment(true);
        
        console.log('Found pending manual payment for booking:', pendingPayment);
      } else {
        setPendingPayment(null);
        setHasPendingPayment(false);
      }
    } catch (error) {
      console.error('Error checking pending payments:', error);
      // Don't prevent form if we can't check - API might not be available
      setPendingPayment(null);
      setHasPendingPayment(false);
    }
  };

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch booking details
        const bookingResponse = await bookingService.getBooking(bookingId);
        console.log('Booking response:', bookingResponse);
        console.log('Booking approvals:', bookingResponse?.booking?.approvals);
        
        if (bookingResponse?.booking) {
          const booking = bookingResponse.booking;
          setBooking(booking);
          
          // Also fetch related invoice to get the actual payment status
          if (booking.invoice_id) {
            try {
              const invoiceResponse = await invoiceService.getInvoice(booking.invoice_id);
              console.log('Invoice response for booking:', invoiceResponse);
              
              if (invoiceResponse?.invoice) {
                setInvoice(invoiceResponse.invoice);
                
                // Update booking payment status based on invoice status
                const updatedBooking = {
                  ...booking,
                  payment_status: invoiceResponse.invoice.status === 'paid' ? 'paid' : booking.payment_status
                };
                setBooking(updatedBooking);
              }
            } catch (invoiceError) {
              console.warn('Could not fetch invoice for booking:', invoiceError);
            }
          }
          
          // If no invoice_id, try to fetch tenant invoices to find related invoice
          if (!booking.invoice_id && tenant?.tenantId) {
            try {
              const invoicesResponse = await paymentService.getTenantInvoices(tenant.tenantId);
              
              if (invoicesResponse?.invoices) {
                // Find invoice for this booking
                const relatedInvoice = invoicesResponse.invoices.find(inv => 
                  inv.bookingId === booking.bookingId || inv.booking_id === booking.booking_id
                );
                
                if (relatedInvoice) {
                  console.log('Found related invoice:', relatedInvoice);
                  setInvoice(relatedInvoice);
                  
                  // Update booking payment status
                  const updatedBooking = {
                    ...booking,
                    payment_status: relatedInvoice.status === 'paid' ? 'paid' : booking.payment_status,
                    invoice_id: relatedInvoice.invoiceId || relatedInvoice.invoice_id
                  };
                  setBooking(updatedBooking);
                  
                  // Check for pending payments for this invoice
                  await checkPendingPayments(relatedInvoice.invoiceId || relatedInvoice.invoice_id);
                }
              }
            } catch (invoicesError) {
              console.warn('Could not fetch invoices:', invoicesError);
            }
          }
          
          // Also check for pending payments if we have an invoice_id directly
          if (booking.invoice_id) {
            await checkPendingPayments(booking.invoice_id);
          }
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
        setError(error.message || 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookingDetails();
  }, [bookingId, tenant?.tenantId]);
  // Get payment status with proper business logic considering booking status
  const getPaymentStatus = () => {
    // CRITICAL: If booking is cancelled, payment should be considered invalid/refunded
    if (booking?.status === 'cancelled' || booking?.status === 'canceled') {
      return 'cancelled';
    }
    
    // If booking is rejected, payment should be refunded
    if (booking?.status === 'rejected') {
      return 'refund_required';
    }
    
    // Only for active/approved bookings, check actual payment status
    if (booking?.status === 'approved' || booking?.status === 'confirmed') {
      // If we have invoice data, use that as the source of truth
      if (invoice) {
        return invoice.status === 'paid' ? 'paid' : 'pending';
      }
      
      // Otherwise use booking payment status
      return booking?.payment_status || booking?.paymentStatus || 'pending';
    }
    
    // For pending bookings, show pending payment
    return 'pending';
  };
  // Update the payment status display with proper business logic
  const renderPaymentStatus = () => {
    const paymentStatus = getPaymentStatus();
    
    // Handle cancelled booking - payment should be invalid
    if (paymentStatus === 'cancelled') {
      return (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Booking Cancelled</Text>
            <Text fontSize="sm">
              This booking has been cancelled. If you made a payment, please contact administration for refund processing.
              {invoice?.status === 'paid' && (
                <Text color="red.600" fontWeight="bold" mt={1}>
                  ⚠️ Payment detected for cancelled booking - Refund required
                </Text>
              )}
            </Text>
          </Box>
        </Alert>
      );
    }
    
    // Handle rejected booking
    if (paymentStatus === 'refund_required') {
      return (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Booking Rejected</Text>
            <Text fontSize="sm">
              This booking has been rejected. If you made a payment, it will be refunded.
            </Text>
          </Box>
        </Alert>
      );
    }
    
    // Handle successful payment for active bookings
    if (paymentStatus === 'paid') {
      return (
        <Alert status="success" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Payment Completed</Text>
            <Text fontSize="sm">
              Your payment has been processed successfully.
              {invoice?.paidAt && ` Paid on ${formatDate(invoice.paidAt)}`}
            </Text>
          </Box>
        </Alert>
      );
    }
    
    // Handle pending payment
    return (
      <Alert status="warning" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Pending Payment</Text>
          <Text fontSize="sm">
            Please complete your payment to confirm this booking.
            {invoice && (
              <>
                {' '}
                <Text 
                  as={RouterLink} 
                  to={`/tenant/invoices/${invoice.invoiceId || invoice.invoice_id}`}
                  color="blue.500"
                  textDecoration="underline"
                  cursor="pointer"
                >
                  View Invoice
                </Text>
              </>
            )}
          </Text>
        </Box>
      </Alert>
    );
  };

  const handleCancelBooking = async () => {
    setCancelling(true);
    try {
      await bookingService.cancelBooking(bookingId);
      toast({
        title: 'Booking Cancelled',
        description: 'Your booking has been cancelled successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      cancelModal.onClose();
      navigate('/tenant/bookings');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel booking. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <TenantLayout>
        <Container maxW="container.lg" py={8}>
          <Flex justify="center" align="center" minH="400px">
            <VStack spacing={4}>
              <Spinner size="xl" color="brand.500" thickness="4px" />
              <Text>Loading booking details...</Text>
            </VStack>
          </Flex>
        </Container>
      </TenantLayout>
    );
  }

  if (error || !booking) {
    return (
      <TenantLayout>
        <Container maxW="container.lg" py={8}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error || 'Booking not found'}
          </Alert>
          <Button
            mt={4}
            leftIcon={<FaArrowLeft />}
            onClick={() => navigate('/tenant/bookings')}
          >
            Back to Bookings
          </Button>
        </Container>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Container maxW="container.lg" py={8}>
        <Button 
          leftIcon={<Icon as={FaArrowLeft} />}
          mb={6}
          onClick={() => navigate('/tenant/bookings')}
          variant="outline"
        >
          Back to Bookings
        </Button>
        
        {/* Booking Header */}
        <Box mb={6}>
          <Heading size="lg" mb={2}>
            Booking #{booking.bookingId || booking.booking_id}
          </Heading>
          
          <HStack spacing={4} mb={4}>
            <Badge colorScheme={getStatusColor(booking.status)} fontSize="md" px={2} py={1} borderRadius="md">
              {formatBookingStatus(booking.status)}
            </Badge>
          </HStack>
            {/* Status-specific alerts */}
          
          {/* Data Consistency Warning - Critical Issue Detection */}
          {(booking.status === 'cancelled' || booking.status === 'canceled' || booking.status === 'rejected') && 
           invoice && invoice.status === 'paid' && (
            <Alert status="error" mb={4} borderRadius="md" border="2px solid" borderColor="red.500">
              <AlertIcon as={FaExclamationTriangle} />
              <Box>
                <AlertTitle color="red.600">⚠️ Data Inconsistency Detected</AlertTitle>
                <AlertDescription>
                  <Text fontWeight="bold" color="red.700">
                    Critical Issue: This booking is {booking.status} but payment shows as completed.
                  </Text>
                  <Text fontSize="sm" mt={1}>
                    This indicates a system error. Please contact administration immediately for refund processing.
                    <br />
                    <Text as="span" fontWeight="bold">Invoice: #{invoice.invoiceNo || invoice.invoice_no}</Text> | 
                    <Text as="span" fontWeight="bold"> Amount: {formatCurrency(invoice.amount || invoice.total_amount)}</Text>
                  </Text>
                </AlertDescription>
              </Box>
            </Alert>
          )}
          
          {booking.status === 'pending' && (
            <Alert status="warning" mb={4} borderRadius="md">
              <AlertIcon as={FaExclamationTriangle} />
              <Box>
                <AlertTitle>Pending Approval</AlertTitle>
                <AlertDescription>Your booking is pending approval from the administrator.</AlertDescription>
              </Box>
            </Alert>
          )}
          
          {booking.status === 'approved' && (
            <Alert status="success" mb={4} borderRadius="md">
              <AlertIcon as={FaCheckCircle} />
              <Box>
                <AlertTitle>Booking Approved</AlertTitle>
                <AlertDescription>Your booking has been approved. Please proceed with payment.</AlertDescription>
              </Box>
            </Alert>
          )}

          {booking.status === 'rejected' && (
            <Alert status="error" mb={4} borderRadius="md">
              <AlertIcon as={FaTimesCircle} />
              <Box>
                <AlertTitle>Booking Rejected</AlertTitle>
                <AlertDescription>Unfortunately, your booking has been rejected by the administrator.</AlertDescription>
              </Box>
            </Alert>
          )}

          {/* Approval/Rejection Details */}
          {(booking.status === 'approved' || booking.status === 'rejected') && (
            <Card 
              bg={booking.status === 'approved' ? 'green.50' : 'red.50'} 
              borderWidth="2px" 
              borderColor={booking.status === 'approved' ? 'green.200' : 'red.200'} 
              mb={6}
              _dark={{ 
                bg: booking.status === 'approved' ? 'green.900' : 'red.900', 
                borderColor: booking.status === 'approved' ? 'green.600' : 'red.600' 
              }}
            >
              <CardHeader>
                <HStack spacing={3}>
                  {booking.status === 'approved' ? (
                    <FaCheckCircle color="green" size={20} />
                  ) : (
                    <FaTimesCircle color="red" size={20} />
                  )}
                  <Heading 
                    size="md" 
                    color={booking.status === 'approved' ? 'green.600' : 'red.600'}
                    _dark={{ color: booking.status === 'approved' ? 'green.300' : 'red.300' }}
                  >
                    {booking.status === 'approved' ? 'Approval Details' : 'Rejection Details'}
                  </Heading>
                </HStack>
              </CardHeader>
              <CardBody>
                {booking.approvals && booking.approvals.length > 0 ? (
                  <VStack spacing={4} align="stretch">
                    {booking.approvals.map((approval, index) => (
                      <Box 
                        key={index} 
                        p={4} 
                        bg="white" 
                        borderRadius="md" 
                        shadow="sm" 
                        _dark={{ bg: "gray.700" }}
                      >
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <VStack align="start" spacing={2}>
                            <Text fontSize="sm" fontWeight="semibold" color="gray.600" _dark={{ color: "gray.300" }}>
                              {approval.approved ? 'APPROVED BY' : 'REJECTED BY'}
                            </Text>
                            <VStack align="start" spacing={1}>
                              <Text fontSize="md" fontWeight="bold">
                                {approval.approver?.fullName || approval.approver?.full_name || 'Admin'}
                              </Text>
                              <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>
                                {approval.approver?.role?.name === 'wakil_direktorat' ? 'Deputy Director' : 
                                 approval.approver?.role?.name === 'super_admin' ? 'Super Admin' : 
                                 approval.approver?.role?.name || 'Administrator'}
                              </Text>
                            </VStack>
                          </VStack>
                          
                          <VStack align="start" spacing={2}>
                            <Text fontSize="sm" fontWeight="semibold" color="gray.600" _dark={{ color: "gray.300" }}>
                              DATE & TIME
                            </Text>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="md" fontWeight="bold">
                                {new Date(approval.actedAt || approval.acted_at).toLocaleDateString('en-US', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </Text>
                              <Text fontSize="sm" color="gray.500" _dark={{ color: "gray.400" }}>
                                {new Date(approval.actedAt || approval.acted_at).toLocaleTimeString('en-US')}
                              </Text>
                            </VStack>
                          </VStack>
                        </SimpleGrid>
                        
                        {approval.comments && (
                          <Box mt={4}>
                            <Text fontSize="sm" fontWeight="semibold" color="gray.600" _dark={{ color: "gray.300" }} mb={2}>
                              {approval.approved ? 'APPROVAL NOTE' : 'REJECTION REASON'}
                            </Text>
                            <Box 
                              p={3} 
                              bg={booking.status === 'approved' ? 'green.100' : 'red.100'} 
                              borderRadius="md" 
                              borderLeft="4px solid" 
                              borderLeftColor={booking.status === 'approved' ? 'green.400' : 'red.400'}
                              _dark={{ 
                                bg: booking.status === 'approved' ? 'green.800' : 'red.800',
                                borderLeftColor: booking.status === 'approved' ? 'green.300' : 'red.300'
                              }}
                            >
                              <Text fontSize="md" fontStyle="italic">
                                "{approval.comments}"
                              </Text>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    ))}
                  </VStack>
                ) : (
                  // Fallback when no approvals data is available
                  <VStack spacing={3} align="start">
                    <HStack justify="space-between" w="100%">
                      <Text fontSize="sm" fontWeight="semibold">
                        Status:
                      </Text>
                      <Text fontSize="sm" fontWeight="bold">
                        {booking.status === 'approved' ? 'Approved' : 'Rejected'}
                      </Text>
                    </HStack>
                    <HStack justify="space-between" w="100%">
                      <Text fontSize="sm" fontWeight="semibold">
                        Last Updated:
                      </Text>
                      <Text fontSize="sm" fontWeight="bold">
                        {new Date(booking.updatedAt || booking.updated_at).toLocaleDateString('en-US', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })} - {new Date(booking.updatedAt || booking.updated_at).toLocaleTimeString('en-US')}
                      </Text>
                    </HStack>
                    
                    {/* Debug info for tenant */}
                    <Box p={2} bg="gray.100" borderRadius="md" fontSize="xs" color="gray.600" w="100%" _dark={{ bg: "gray.600", color: "gray.300" }}>
                      <Text fontWeight="bold">Debug Info:</Text>
                      <Text>Booking ID: {booking.bookingId || booking.booking_id}</Text>
                      <Text>Status: {booking.status}</Text>
                      <Text>Has approvals: {booking.approvals ? 'Yes' : 'No'}</Text>
                      <Text>Approvals count: {booking.approvals ? booking.approvals.length : 'N/A'}</Text>
                      <Text fontSize="xs">If you don't see detailed approval information, please contact support.</Text>
                    </Box>
                  </VStack>
                )}
              </CardBody>
            </Card>
          )}
        </Box>
        
        {/* Room Details */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} mb={6}>
          <CardHeader>
            <Heading size="md">Room Details</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              {/* Room Information */}
              <VStack align="start" spacing={4}>
                <Box>
                  <Heading size="sm" mb={2}>
                    {booking.room?.name || `Room #${booking.roomId || booking.room_id}`}
                  </Heading>
                  <Text mb={3}>{booking.room?.description || 'No description provided.'}</Text>
                </Box>
                
                <HStack>
                  <Icon as={FaCalendarAlt} color="blue.500" />
                  <Box>
                    <Text fontWeight="medium">Stay Period</Text>
                    <Text>{formatDateRange(booking.checkInDate || booking.check_in || booking.start_date, booking.checkOutDate || booking.check_out || booking.end_date)}</Text>
                  </Box>
                </HStack>
                
                <HStack>
                  <Icon as={FaBed} color="blue.500" />
                  <Box>
                    <Text fontWeight="medium">Capacity</Text>
                    <Text>{booking.room?.capacity || 1} {booking.room?.capacity !== 1 ? 'persons' : 'person'}</Text>
                  </Box>
                </HStack>
                
                <HStack>
                  <Icon as={FaUserAlt} color="blue.500" />
                  <Box>
                    <Text fontWeight="medium">Classification</Text>
                    <Text>{booking.room?.classification?.name || 'Standard Room'}</Text>
                  </Box>
                </HStack>
              </VStack>
                {/* Room Image */}
              <Box>
                <Image
                  src={booking.room?.imageUrl || getRoomImage(booking.room)}
                  alt={booking.room?.name || 'Room image'}
                  borderRadius="md"
                  objectFit="cover"
                  width="100%"
                  height="200px"
                />
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>
        
        {/* Payment Details Section */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Payment Details</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="medium">Booking Amount</Text>
                <Text fontWeight="bold" fontSize="xl" color="brand.500">
                  {formatCurrency(booking?.total_amount || booking?.totalAmount || booking?.amount || 0)}
                </Text>
              </HStack>
              
              <Box>
                <Text fontWeight="medium" mb={2}>Payment Status</Text>
                {renderPaymentStatus()}
              </Box>
              
              {invoice && (
                <VStack spacing={2} align="stretch">
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.500">Invoice Number</Text>
                    <Text fontSize="sm" fontWeight="medium">
                      #{invoice.invoiceNo || invoice.invoice_no}
                    </Text>
                  </HStack>
                  
                  {invoice.status === 'paid' && invoice.paidAt && (
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.500">Payment Date</Text>
                      <Text fontSize="sm" fontWeight="medium">
                        {formatDate(invoice.paidAt)}
                      </Text>
                    </HStack>
                  )}
                  
                  <Button
                    as={RouterLink}
                    to={`/tenant/invoices/${invoice.invoiceId || invoice.invoice_id}`}
                    colorScheme="blue"
                    variant="outline"
                    size="sm"
                    leftIcon={<FaFileInvoice />}
                  >
                    View Invoice Details
                  </Button>
                </VStack>
              )}
            </VStack>          </CardBody>
        </Card>

        {/* Action Buttons Section */}
        {(booking.status === 'approved' || booking.status === 'pending') && getPaymentStatus() !== 'paid' && (
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} mt={6}>
            <CardHeader>
              <Heading size="md">Actions</Heading>
            </CardHeader>            <CardBody>              <VStack spacing={4} align="stretch">
                {hasPendingPayment && pendingPayment ? (
                  /* Pending Payment Warning */
                  <Alert status="warning" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Payment Already Submitted!</AlertTitle>
                      <AlertDescription>
                        You have already submitted a manual payment (#{pendingPayment.paymentId || pendingPayment.id}) for this booking 
                        that is currently pending verification. Please wait for the payment to be processed 
                        before submitting another payment.
                      </AlertDescription>
                      <HStack mt={3} spacing={3}>
                        <Button
                          size="sm"
                          onClick={() => navigate('/tenant/payments/history')}
                          colorScheme="orange"
                          variant="outline"
                        >
                          View Payment History
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => navigate('/tenant/contact')}
                          variant="outline"
                        >
                          Contact Support
                        </Button>
                        {invoice && (
                          <Button
                            as={RouterLink}
                            to={`/tenant/invoices/${invoice.invoiceId || invoice.invoice_id}`}
                            variant="outline"
                            size="sm"
                            leftIcon={<FaFileInvoice />}
                          >
                            View Invoice
                          </Button>
                        )}
                      </HStack>
                    </Box>
                  </Alert>
                ) : booking.status === 'approved' && getPaymentStatus() !== 'paid' ? (
                  <>
                    <Text fontWeight="medium" color="green.600" mb={2}>
                      Your booking has been approved! Choose a payment method to proceed:
                    </Text>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Button
                        as={RouterLink}
                        to={invoice ? 
                          `/tenant/invoices/${invoice.invoiceId || invoice.invoice_id}/payment-method` :
                          `/tenant/bookings/${bookingId}/payment-method`
                        }
                        colorScheme="blue"
                        size="lg"
                        leftIcon={<FaCreditCard />}
                        width="100%"
                      >
                        Choose Payment Method
                      </Button>
                      
                      {invoice && (
                        <Button
                          as={RouterLink}
                          to={`/tenant/invoices/${invoice.invoiceId || invoice.invoice_id}`}
                          variant="outline"
                          colorScheme="blue"
                          size="lg"
                          leftIcon={<FaFileInvoice />}
                          width="100%"
                        >
                          View Full Invoice
                        </Button>                      )}
                    </SimpleGrid>
                  </>
                ) : null}
                
                {canCancel(booking) && (
                  <Box pt={4} borderTopWidth="1px" borderTopColor={borderColor}>
                    <Button
                      onClick={cancelModal.onOpen}
                      colorScheme="red"
                      variant="outline"
                      size="sm"
                      leftIcon={<FaTimes />}
                    >
                      Cancel Booking
                    </Button>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Cancellation Confirmation Modal */}
        <Modal isOpen={cancelModal.isOpen} onClose={cancelModal.onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Cancel Booking</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Are you sure?</AlertTitle>
                  <AlertDescription>
                    This action cannot be undone. Your booking for {booking.room?.name || `Room #${booking.roomId || booking.room_id}`} will be cancelled.
                  </AlertDescription>
                </Box>
              </Alert>
            </ModalBody>
            <ModalFooter>
              <Button onClick={cancelModal.onClose} mr={3} isDisabled={cancelling}>
                No, Keep My Booking
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleCancelBooking}
                isLoading={cancelling}
                loadingText="Cancelling..."
              >
                Yes, Cancel Booking
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </TenantLayout>
  );
};

export default BookingDetail;
