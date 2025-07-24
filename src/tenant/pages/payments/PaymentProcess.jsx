import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Divider,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Alert,
  AlertIcon,
  useToast,
  Spinner,
  Image,
  useColorModeValue,
  Icon,
  Code,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  Input,
  FormControl,
  FormLabel,
  Select,
  Textarea
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaMobileAlt, FaQrcode, FaMoneyBillWave, 
  FaCreditCard, FaCopy, FaCheckCircle, FaSync, FaExclamationCircle,
  FaFileUpload
} from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import paymentService from '../../services/paymentService';
import invoiceService from '../../services/invoiceService';
import bookingService from '../../services/bookingService';
import { useTenantAuth } from '../../context/tenantAuthContext';
import { API_BASE_URL } from '../../../config/apiConfig';

const PaymentProcess = () => {
  const { paymentId, invoiceId, bookingId } = useParams();
  const [payment, setPayment] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('midtrans');
  const [timeRemaining, setTimeRemaining] = useState(3600); // 1 hour in seconds
  
  // Midtrans state
  const [midtransToken, setMidtransToken] = useState(null);
  const [midtransUrl, setMidtransUrl] = useState(null);
  
  // Manual payment state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [manualPaymentData, setManualPaymentData] = useState({
    payment_channel: 'bank_transfer',
    notes: '',
    bank_name: '',
    account_number: '',
    account_holder_name: '',
    transfer_date: new Date().toISOString().split('T')[0]
  });
  const [paymentProof, setPaymentProof] = useState(null);
  
  const navigate = useNavigate();
  const toast = useToast();
  
  const cardBgColor = useColorModeValue('white', 'gray.700');
  const codeBgColor = useColorModeValue('gray.50', 'gray.600');
  
  // Mock data for demonstration - in a real app, this would come from the payment gateway
  const [paymentDetails] = useState({
    virtualAccount: '1010087612345678',
    qrCode: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg',
    expiryTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  });  // Initialize data based on route parameters
  useEffect(() => {
    if (paymentId) {
      fetchPaymentData();
    } else if (invoiceId) {
      fetchInvoiceData();
    } else if (bookingId) {
      fetchBookingData();
    }
  }, [paymentId, invoiceId, bookingId]);
  // Handle navigation logic after data loads
  useEffect(() => {
    // If accessed directly without payment method selection, redirect to payment method selection
    if (!loading && !paymentId && !invoiceId && bookingId) {
      console.log('No payment method selected, redirecting to payment method selection');
      navigate(`/tenant/bookings/${bookingId}/payment-method`);
      return;
    }
    
    // Only navigate if we have data loaded and not currently loading
    if (!loading && invoice && !payment && invoice.invoice_id) {
      console.log('Navigating to invoice details:', invoice.invoice_id);
      // Navigate to payment method selection instead of direct invoice page
      navigate(`/tenant/invoices/${invoice.invoice_id}/payment-method`);
    }
  }, [invoice, payment, loading, navigate, paymentId, invoiceId, bookingId]);
  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      console.log('Fetching payment data for ID:', paymentId);
      
      if (!paymentId || paymentId === 'undefined') {
        throw new Error('Invalid payment ID');
      }
      
      const response = await paymentService.getPayment(paymentId);
      console.log('Payment response:', response);
      
      // Handle different response structures and map fields
      let paymentData = null;
      if (response.payment) {
        paymentData = response.payment;
      } else if (response.data && response.data.payment) {
        paymentData = response.data.payment;
      } else if (response.status === 'success' && response.data) {
        paymentData = response.data;
      } else {
        paymentData = response;
      }

      if (paymentData) {
        const mappedPayment = {
          payment_id: paymentData.paymentId || paymentData.payment_id || paymentData.id,
          invoice_id: paymentData.invoiceId || paymentData.invoice_id,
          booking_id: paymentData.bookingId || paymentData.booking_id,
          tenant_id: paymentData.tenantId || paymentData.tenant_id,
          amount: paymentData.amount,
          status: paymentData.status,
          payment_method: paymentData.paymentMethod || paymentData.payment_method,
          payment_channel: paymentData.paymentChannel || paymentData.payment_channel,
          transaction_id: paymentData.transactionId || paymentData.transaction_id,
          created_at: paymentData.createdAt || paymentData.created_at,
          updated_at: paymentData.updatedAt || paymentData.updated_at,
          notes: paymentData.notes,
          midtrans_token: paymentData.midtrans_token,
          midtrans_redirect_url: paymentData.midtrans_redirect_url
        };
        
        setPayment(mappedPayment);
        console.log('Mapped payment data:', mappedPayment);
      }
      
      if (paymentData?.invoice_id) {
        const invoiceResponse = await invoiceService.getInvoice(paymentData.invoice_id);
        if (invoiceResponse.invoice || invoiceResponse.data) {
          setInvoice(invoiceResponse.invoice || invoiceResponse.data);
        }
      }
    } catch (error) {
      console.error('Error fetching payment:', error);
      setError(error.message || 'Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      console.log('Fetching invoice data for ID:', invoiceId);
      
      if (!invoiceId || invoiceId === 'undefined') {
        throw new Error('Invalid invoice ID');
      }
      
      const response = await invoiceService.getInvoice(invoiceId);
      console.log('Invoice response:', response);
      
      // Handle different response structures and map fields
      let invoiceData = null;
      if (response.invoice) {
        invoiceData = response.invoice;
      } else if (response.data && response.data.invoice) {
        invoiceData = response.data.invoice;
      } else if (response.status === 'success' && response.data) {
        invoiceData = response.data;
      } else {
        invoiceData = response;
      }

      if (invoiceData) {
        // Map database field names to expected field names
        const mappedInvoice = {
          invoice_id: invoiceData.invoiceId || invoiceData.invoice_id || invoiceData.id,
          booking_id: invoiceData.bookingId || invoiceData.booking_id,
          tenant_id: invoiceData.tenantId || invoiceData.tenant_id,
          invoice_no: invoiceData.invoiceNo || invoiceData.invoice_no,
          amount: invoiceData.amount || invoiceData.totalAmount || invoiceData.total_amount,
          totalAmount: invoiceData.amount || invoiceData.totalAmount || invoiceData.total_amount,
          due_date: invoiceData.dueDate || invoiceData.due_date,
          status: invoiceData.status,
          payment_status: invoiceData.paymentStatus || invoiceData.payment_status,
          payment_id: invoiceData.payment_id,
          notes: invoiceData.notes,
          items: invoiceData.items,
          created_at: invoiceData.createdAt || invoiceData.created_at,
          updated_at: invoiceData.updatedAt || invoiceData.updated_at,
          booking: invoiceData.booking,
          tenant: invoiceData.tenant,
          payments: invoiceData.payments
        };
        
        setInvoice(mappedInvoice);
        console.log('Mapped invoice data:', mappedInvoice);
        
        // If invoice has payment_id, try to fetch payment details
        if (mappedInvoice.payment_id) {
          try {
            const paymentResponse = await paymentService.getPayment(mappedInvoice.payment_id);
            setPayment(paymentResponse.payment || paymentResponse.data);
          } catch (paymentError) {
            console.warn('Payment not found for invoice:', paymentError);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setError(error.message || 'Failed to load invoice data');
    } finally {
      setLoading(false);
    }
  };const fetchBookingData = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getBooking(bookingId);
      console.log('Booking response:', response); // Debug log
      
      // Handle different response structures
      let bookingData = null;
      if (response.booking) {
        bookingData = response.booking;
      } else if (response.data && response.data.booking) {
        bookingData = response.data.booking;
      } else if (response.status === 'success' && response.data) {
        bookingData = response.data;
      } else {
        bookingData = response;
      }
        // Map database field names to expected field names
      if (bookingData) {
        const mappedBooking = {
          booking_id: bookingData.bookingId || bookingData.booking_id || bookingData.id,
          tenant_id: bookingData.tenantId || bookingData.tenant_id,
          room_id: bookingData.roomId || bookingData.room_id,
          start_date: bookingData.checkInDate || bookingData.check_in || bookingData.start_date,
          end_date: bookingData.checkOutDate || bookingData.check_out || bookingData.end_date,
          total_amount: bookingData.totalAmount || bookingData.total_amount,
          amount: bookingData.totalAmount || bookingData.total_amount, // Alias for compatibility
          status: bookingData.status,
          payment_status: bookingData.paymentStatus || bookingData.payment_status,
          payment_id: bookingData.payment_id,
          invoice_id: bookingData.invoice_id,
          invoice: bookingData.invoice,
          room: bookingData.room,
          tenant: bookingData.tenant,
          payments: bookingData.payments,
          approvals: bookingData.approvals,
          created_at: bookingData.createdAt || bookingData.created_at,
          updated_at: bookingData.updatedAt || bookingData.updated_at
        };
          setBooking(mappedBooking);
        console.log('Mapped booking data:', mappedBooking); // Debug log
        
        // Fetch room details if not present
        if (!mappedBooking.room && mappedBooking.room_id) {
          try {
            const roomDetails = await fetchRoomDetails(mappedBooking.room_id);
            if (roomDetails) {
              mappedBooking.room = roomDetails;
              setBooking({...mappedBooking});
            }
          } catch (roomError) {
            console.warn('Failed to fetch room details:', roomError);
          }
        }
      }
      
      // Try to find existing payment for this booking
      if (bookingData?.payment_id) {
        try {
          const paymentResponse = await paymentService.getPayment(bookingData.payment_id);
          setPayment(paymentResponse.payment);
        } catch (paymentError) {
          console.warn('Payment not found for booking, will create new one:', paymentError);
          // If no payment exists, we'll need to create one or handle accordingly
          // For now, we'll show the payment creation flow
        }
      }
      
      // Also try to get invoice if exists
      if (bookingData?.invoice_id) {
        try {
          const invoiceResponse = await invoiceService.getInvoice(bookingData.invoice_id);
          setInvoice(invoiceResponse.invoice);
        } catch (invoiceError) {
          console.warn('Invoice not found for booking:', invoiceError);
        }
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      setError(error.message || 'Failed to load booking data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch room details if not included in booking
  const fetchRoomDetails = async (roomId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/rooms/${roomId}`);
      if (response.ok) {
        const roomData = await response.json();
        return roomData.room || roomData.data || roomData;
      }
    } catch (error) {
      console.warn('Failed to fetch room details:', error);
    }
    return null;
  };

  const handleMidtransPayment = async () => {
    try {
      setProcessing(true);
      
      let invoiceData;
      if (invoice) {
        // Use existing invoice
        invoiceData = {
          booking_id: invoice.bookingId,
          tenant_id: invoice.tenantId,
          due_date: invoice.dueDate,
          notes: invoice.notes || 'Payment via Midtrans',
          items: invoice.items || [
            {
              description: 'Room rental payment',
              quantity: 1,
              unit_price: invoice.totalAmount,
              total: invoice.totalAmount
            }
          ],
          enable_midtrans: true
        };
      } else if (booking) {
        // Create new invoice from booking        // Validate booking amount before proceeding
        const bookingAmount = booking.totalAmount || booking.total_amount || booking.amount;
        if (!bookingAmount || bookingAmount <= 0) {
          throw new Error('Invalid booking amount. Please contact support to resolve this issue.');
        }
        
        invoiceData = {
          booking_id: booking.bookingId,
          tenant_id: booking.tenantId,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Room rental payment',
          items: [
            {
              description: 'Room rental payment',
              quantity: 1,
              unit_price: bookingAmount,
              total: bookingAmount
            }
          ],
          enable_midtrans: true
        };
      }

      const response = await paymentService.generateInvoiceWithMidtrans(invoiceData);
      
      if (response.midtransToken && response.midtransRedirectUrl) {
        setMidtransToken(response.midtransToken);
        setMidtransUrl(response.midtransRedirectUrl);
        
        // Open Midtrans payment page
        window.open(response.midtransRedirectUrl, '_blank');
        
        toast({
          title: 'Payment Link Generated',
          description: 'Midtrans payment window has been opened. Complete your payment there.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error('Failed to generate Midtrans payment link');
      }
    } catch (error) {
      console.error('Error processing Midtrans payment:', error);
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to process payment',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleManualPayment = async () => {
    try {
      setProcessing(true);
      
      if (!paymentProof) {
        throw new Error('Please upload payment proof');
      }

      // Prepare payment data      // Validate amount before creating payment
      const paymentAmount = invoice?.totalAmount || booking?.totalAmount || booking?.total_amount || booking?.amount;
      if (!paymentAmount || paymentAmount <= 0) {
        throw new Error('Invalid payment amount. Cannot process payment without a valid amount.');
      }      const paymentData = {
        bookingId: invoice?.bookingId || booking?.bookingId,
        tenantId: invoice?.tenantId || booking?.tenantId,
        invoiceId: invoice?.invoiceId,
        amount: paymentAmount,
        paymentChannel: manualPaymentData.payment_channel,
        notes: manualPaymentData.notes,
        bankName: manualPaymentData.bank_name,
        accountNumber: manualPaymentData.account_number,
        accountHolderName: manualPaymentData.account_holder_name,
        transferDate: manualPaymentData.transfer_date + 'T00:00:00Z',
        fileName: paymentProof.name,
        fileType: paymentProof.type,
        contentEncoding: 'base64'
      };

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const content = reader.result.split(',')[1];
          paymentData.imageContent = content;
          
          const response = await paymentService.createManualPayment(paymentData);
          
          toast({
            title: 'Payment Submitted',
            description: 'Your payment proof has been submitted for verification.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          
          onClose();
          navigate('/tenant/payments/history');
        } catch (error) {
          console.error('Error creating manual payment:', error);
          toast({
            title: 'Payment Error',
            description: error.message || 'Failed to submit payment',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        } finally {
          setProcessing(false);
        }
      };
      
      reader.readAsDataURL(paymentProof);
    } catch (error) {
      console.error('Error processing manual payment:', error);
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to process manual payment',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setProcessing(false);
    }
  };
  
  // Create payment for booking if none exists
  const createPaymentForBooking = async () => {
    if (!booking) return;
    
    try {
      setProcessing(true);
      // Create invoice and payment for the booking
      const invoiceData = {
        booking_id: booking.booking_id,
        tenant_id: booking.tenant_id,
        room_id: booking.room_id,
        amount: booking.total_amount || booking.amount,
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        description: `Payment for room booking ${booking.booking_id}`
      };
      
      const response = await paymentService.generateInvoiceWithMidtrans(invoiceData);
      
      if (response.invoice) {
        setInvoice(response.invoice);
        if (response.payment) {
          setPayment(response.payment);
        }
        
        toast({
          title: 'Invoice Created',
          description: 'Payment invoice has been created successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      setError(error.message || 'Failed to create payment');
      toast({
        title: 'Error',
        description: 'Failed to create payment invoice.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessing(false);
    }
  };
  
  // Update countdown timer
  useEffect(() => {
    if (!payment) return;
    
    const expiryDate = new Date(paymentDetails.expiryTime);
    const interval = setInterval(() => {
      const secondsRemaining = Math.floor((expiryDate - new Date()) / 1000);
      setTimeRemaining(secondsRemaining > 0 ? secondsRemaining : 0);
      
      // If expired, refresh payment status
      if (secondsRemaining <= 0) {
        checkPaymentStatus();
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [payment, paymentDetails.expiryTime]);
  
  const formatTimeRemaining = () => {
    if (timeRemaining <= 0) return '00:00:00';
    
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({
          title: 'Copied to clipboard',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };
  
  const checkPaymentStatus = async () => {
    setRefreshing(true);
    try {
      const response = await paymentService.checkMidtransPaymentStatus(paymentId);
      setPayment(response.payment);
      
      if (response.payment.status === 'completed') {
        toast({
          title: 'Payment completed!',
          description: 'Your payment has been received and confirmed.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      toast({
        title: 'Failed to check payment status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <TenantLayout>
        <Container maxW="container.lg" py={8}>
          <Flex justify="center" align="center" minH="400px">
            <Spinner size="xl" color="brand.500" />
          </Flex>
        </Container>
      </TenantLayout>
    );
  }  // Show error if booking fails to load
  if (!booking && !loading) {
    return (
      <TenantLayout>
        <Container maxW="container.lg" py={8}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error || 'Payment information not found'}
          </Alert>
          <Button 
            mt={4}
            colorScheme="brand"
            leftIcon={<FaArrowLeft />}
            onClick={() => navigate('/tenant/bookings')}
          >
            Back to Bookings
          </Button>
        </Container>
      </TenantLayout>
    );
  }

  // Payment completed view
  if (payment && payment.status === 'completed') {
    return (
      <TenantLayout>
        <Container maxW="container.lg" py={8}>
          <Flex direction="column" align="center" justify="center" minH="400px">
            <Icon as={FaCheckCircle} boxSize="80px" color="green.500" mb={6} />
            <Heading as="h1" size="xl" mb={2} textAlign="center">Payment Successful!</Heading>
            <Text mb={6} textAlign="center">
              Your payment has been received and confirmed.
            </Text>
            
            <VStack spacing={4} align="stretch" maxW="400px" width="100%">
              <Box p={4} borderWidth="1px" borderRadius="md">
                <VStack align="start" spacing={2}>
                  <Text color="gray.500">Invoice Number</Text>
                  <Text fontWeight="bold">#{invoice?.invoice_no}</Text>
                </VStack>
              </Box>
              
              <Box p={4} borderWidth="1px" borderRadius="md">
                <VStack align="start" spacing={2}>
                  <Text color="gray.500">Amount Paid</Text>
                  <Text fontWeight="bold" fontSize="xl" color="green.500">
                    {formatCurrency(invoice?.amount || 0)}
                  </Text>
                </VStack>
              </Box>
              
              <Box p={4} borderWidth="1px" borderRadius="md">
                <VStack align="start" spacing={2}>
                  <Text color="gray.500">Payment Date</Text>
                  <Text fontWeight="bold">
                    {new Date(payment.updated_at).toLocaleString()}
                  </Text>
                </VStack>
              </Box>
              
              <Button 
                colorScheme="brand" 
                mt={4}
                onClick={() => navigate(`/tenant/bookings/${invoice?.booking_id}`)}
              >
                View Booking Details
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/tenant/invoices')}
              >
                Back to Invoices
              </Button>
            </VStack>
          </Flex>
        </Container>
      </TenantLayout>
    );
  }
  // Payment failed view
  if (payment && payment.status === 'failed') {
    return (
      <TenantLayout>
        <Container maxW="container.lg" py={8}>
          <Flex direction="column" align="center" justify="center" minH="400px">
            <Icon as={FaExclamationCircle} boxSize="80px" color="red.500" mb={6} />
            <Heading as="h1" size="xl" mb={2} textAlign="center">Payment Failed</Heading>
            <Text mb={6} textAlign="center">
              We couldn't process your payment. Please try again or choose another payment method.
            </Text>
            
            <VStack spacing={4} maxW="400px" width="100%">
              <Button 
                colorScheme="brand" 
                width="full"
                onClick={() => navigate(`/tenant/payments/method/${invoice?.invoice_id}`)}
              >
                Try Again
              </Button>
              
              <Button 
                variant="outline"
                width="full"
                onClick={() => navigate(`/tenant/invoices/${invoice?.invoice_id}`)}
              >
                Back to Invoice
              </Button>
            </VStack>
          </Flex>
        </Container>
      </TenantLayout>
    );
  }

  // Show payment creation interface if we have booking but no payment
  if (booking && !payment && !invoice) {
    return (
      <TenantLayout>
        <Container maxW="container.lg" py={8}>
          <VStack spacing={6} align="stretch">
            <Box>
              <Button
                leftIcon={<FaArrowLeft />}
                onClick={() => navigate('/tenant/bookings')}
                variant="ghost"
                mb={4}
              >
                Back to Bookings
              </Button>
              <Heading as="h1" size="xl" mb={2}>Create Payment</Heading>
              <Text color="gray.600">
                Create a payment invoice for your booking
              </Text>
            </Box>

            <Card bg={cardBgColor}>
              <CardHeader>
                <Heading as="h3" size="lg">Booking Details</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Text fontWeight="bold" color="gray.500">Booking ID</Text>
                    <Text>{booking.booking_id}</Text>
                  </Box>                  <Box>
                    <Text fontWeight="bold" color="gray.500">Room</Text>
                    <Text>{booking.room?.name || booking.room?.room_name || `Room ${booking.room_id}`}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color="gray.500">Check-in Date</Text>
                    <Text>{new Date(booking.start_date).toLocaleDateString()}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color="gray.500">Check-out Date</Text>
                    <Text>{new Date(booking.end_date).toLocaleDateString()}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color="gray.500">Total Amount</Text>
                    <Text fontSize="xl" fontWeight="bold" color="brand.500">
                      {formatCurrency(booking.total_amount || booking.amount || 0)}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color="gray.500">Status</Text>
                    <Badge colorScheme={booking.status === 'confirmed' ? 'green' : 'yellow'}>
                      {booking.status}
                    </Badge>
                  </Box>
                </SimpleGrid>
              </CardBody>
              <CardFooter>
                <Button
                  colorScheme="brand"
                  size="lg"
                  isLoading={processing}
                  loadingText="Creating Invoice..."
                  onClick={createPaymentForBooking}
                  width="100%"
                >
                  Create Payment Invoice
                </Button>
              </CardFooter>
            </Card>
          </VStack>
        </Container>
      </TenantLayout>
    );
  }

  // Payment processing view
  return (
    <TenantLayout>
      <Container maxW="container.lg" py={8}>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<FaArrowLeft />}
          onClick={() => navigate(`/tenant/invoices/${payment.invoice_id}`)}
          mb={6}
        >
          Back to Invoice
        </Button>
        
        <Heading as="h1" size="xl" mb={2}>Complete Your Payment</Heading>
        <Text mb={6} color="gray.500">
          Follow the instructions below to complete your payment
        </Text>
        
        <SimpleGrid columns={{ base: 1, md: 5 }} spacing={6}>
          {/* Payment instructions area */}
          <Box gridColumn={{ md: "span 3" }}>
            <Card bg={cardBgColor} mb={6}>
              <CardHeader pb={0}>
                <Heading size="md">Payment Instructions</Heading>
              </CardHeader>
              <CardBody>
                <Tabs variant="enclosed" colorScheme="brand">
                  <TabList>
                    <Tab>Bank Transfer</Tab>
                    <Tab>Mobile Banking</Tab>
                    <Tab>Internet Banking</Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          Transfer the exact amount to the virtual account number before the time expires.
                        </Alert>
                        
                        <Box p={4} borderWidth="1px" borderRadius="md">
                          <Text fontWeight="medium" mb={2}>BCA Virtual Account</Text>
                          <Flex 
                            bg={codeBgColor}
                            p={3}
                            borderRadius="md"
                            justify="space-between"
                            align="center"
                          >
                            <Code fontSize="lg" fontWeight="bold">
                              {paymentDetails.virtualAccount}
                            </Code>
                            <Button
                              size="sm"
                              leftIcon={<FaCopy />}
                              onClick={() => copyToClipboard(paymentDetails.virtualAccount)}
                            >
                              Copy
                            </Button>
                          </Flex>
                        </Box>
                        
                        <Divider />
                        
                        <VStack spacing={4} align="stretch">
                          <Heading size="sm">Steps:</Heading>
                          
                          <HStack align="flex-start">
                            <Flex 
                              minW="2rem"
                              h="2rem"
                              borderRadius="full"
                              bg="brand.500"
                              color="white"
                              justify="center"
                              align="center"
                            >
                              1
                            </Flex>
                            <Text>Go to an ATM or open your mobile banking app.</Text>
                          </HStack>
                          
                          <HStack align="flex-start">
                            <Flex 
                              minW="2rem"
                              h="2rem"
                              borderRadius="full"
                              bg="brand.500"
                              color="white"
                              justify="center"
                              align="center"
                            >
                              2
                            </Flex>
                            <Text>Choose "Transfer" and select "To BCA Virtual Account".</Text>
                          </HStack>
                          
                          <HStack align="flex-start">
                            <Flex 
                              minW="2rem"
                              h="2rem"
                              borderRadius="full"
                              bg="brand.500"
                              color="white"
                              justify="center"
                              align="center"
                            >
                              3
                            </Flex>
                            <Text>Enter the Virtual Account Number shown above.</Text>
                          </HStack>
                          
                          <HStack align="flex-start">
                            <Flex 
                              minW="2rem"
                              h="2rem"
                              borderRadius="full"
                              bg="brand.500"
                              color="white"
                              justify="center"
                              align="center"
                            >
                              4
                            </Flex>
                            <Text>Confirm the payment details and complete the transaction.</Text>
                          </HStack>
                          
                          <HStack align="flex-start">
                            <Flex 
                              minW="2rem"
                              h="2rem"
                              borderRadius="full"
                              bg="brand.500"
                              color="white"
                              justify="center"
                              align="center"
                            >
                              5
                            </Flex>
                            <Text>Your payment will be processed automatically.</Text>
                          </HStack>
                        </VStack>
                      </VStack>
                    </TabPanel>
                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          Open your mobile banking app and follow these instructions.
                        </Alert>
                        
                        <VStack spacing={4}>
                          <Box width="full">
                            <Text fontWeight="medium" mb={2}>QR Code Payment</Text>
                            <Flex justifyContent="center">
                              <Image 
                                src={paymentDetails.qrCode}
                                alt="Payment QR Code"
                                maxW="200px"
                                border="1px solid"
                                borderColor="gray.200"
                                borderRadius="md"
                              />
                            </Flex>
                          </Box>
                          
                          <Text fontSize="sm" color="gray.500">
                            Scan this QR code with your mobile banking app or e-wallet
                          </Text>
                        </VStack>
                        
                        <Divider />
                        
                        <VStack spacing={4} align="stretch">
                          <Heading size="sm">Steps:</Heading>
                          
                          <HStack align="flex-start">
                            <Flex 
                              minW="2rem"
                              h="2rem"
                              borderRadius="full"
                              bg="brand.500"
                              color="white"
                              justify="center"
                              align="center"
                            >
                              1
                            </Flex>
                            <Text>Open your mobile banking or e-wallet app.</Text>
                          </HStack>
                          
                          <HStack align="flex-start">
                            <Flex 
                              minW="2rem"
                              h="2rem"
                              borderRadius="full"
                              bg="brand.500"
                              color="white"
                              justify="center"
                              align="center"
                            >
                              2
                            </Flex>
                            <Text>Choose the QR code or QRIS scanning option.</Text>
                          </HStack>
                          
                          <HStack align="flex-start">
                            <Flex 
                              minW="2rem"
                              h="2rem"
                              borderRadius="full"
                              bg="brand.500"
                              color="white"
                              justify="center"
                              align="center"
                            >
                              3
                            </Flex>
                            <Text>Scan the QR code displayed above.</Text>
                          </HStack>
                          
                          <HStack align="flex-start">
                            <Flex 
                              minW="2rem"
                              h="2rem"
                              borderRadius="full"
                              bg="brand.500"
                              color="white"
                              justify="center"
                              align="center"
                            >
                              4
                            </Flex>
                            <Text>Confirm the payment amount and complete the transaction.</Text>
                          </HStack>
                        </VStack>
                      </VStack>
                    </TabPanel>
                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          Log into your internet banking portal and follow these steps.
                        </Alert>
                        
                        <Box p={4} borderWidth="1px" borderRadius="md">
                          <Text fontWeight="medium" mb={2}>BCA Virtual Account</Text>
                          <Flex 
                            bg={codeBgColor}
                            p={3}
                            borderRadius="md"
                            justify="space-between"
                            align="center"
                          >
                            <Code fontSize="lg" fontWeight="bold">
                              {paymentDetails.virtualAccount}
                            </Code>
                            <Button
                              size="sm"
                              leftIcon={<FaCopy />}
                              onClick={() => copyToClipboard(paymentDetails.virtualAccount)}
                            >
                              Copy
                            </Button>
                          </Flex>
                        </Box>
                        
                        <Divider />
                        
                        <VStack spacing={4} align="stretch">
                          <Heading size="sm">Steps:</Heading>
                          
                          <HStack align="flex-start">
                            <Flex 
                              minW="2rem"
                              h="2rem"
                              borderRadius="full"
                              bg="brand.500"
                              color="white"
                              justify="center"
                              align="center"
                            >
                              1
                            </Flex>
                            <Text>Log in to your internet banking account.</Text>
                          </HStack>
                          
                          <HStack align="flex-start">
                            <Flex 
                              minW="2rem"
                              h="2rem"
                              borderRadius="full"
                              bg="brand.500"
                              color="white"
                              justify="center"
                              align="center"
                            >
                              2
                            </Flex>
                            <Text>Go to "Transfer" or "Payments" section.</Text>
                          </HStack>
                          
                          <HStack align="flex-start">
                            <Flex 
                              minW="2rem"
                              h="2rem"
                              borderRadius="full"
                              bg="brand.500"
                              color="white"
                              justify="center"
                              align="center"
                            >
                              3
                            </Flex>
                            <Text>Choose "Virtual Account" payment option.</Text>
                          </HStack>
                          
                          <HStack align="flex-start">
                            <Flex 
                              minW="2rem"
                              h="2rem"
                              borderRadius="full"
                              bg="brand.500"
                              color="white"
                              justify="center"
                              align="center"
                            >
                              4
                            </Flex>
                            <Text>Enter the virtual account number and follow the instructions.</Text>
                          </HStack>
                        </VStack>
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </CardBody>
              <CardFooter>                <VStack spacing={3} width="full">
                  <Button
                    leftIcon={<FaSync />}
                    colorScheme="brand"
                    onClick={checkPaymentStatus}
                    isLoading={refreshing}
                    loadingText="Checking..."
                    width="full"
                  >
                    Check Payment Status
                  </Button>
                  
                  <Text fontSize="sm" textAlign="center" color="gray.500">
                    or
                  </Text>
                  
                  <Button
                    leftIcon={<FaFileUpload />}
                    variant="outline"
                    colorScheme="brand"
                    onClick={onOpen}
                    width="full"
                  >
                    Upload Manual Payment
                  </Button>
                </VStack>
              </CardFooter>
            </Card>
          </Box>
          
          {/* Payment summary area */}
          <Box gridColumn={{ md: "span 2" }}>
            <Card bg={cardBgColor} position={{ base: 'static', md: 'sticky' }} top="100px">
              <CardHeader pb={0}>
                <Heading size="md">Payment Summary</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Alert status="warning" borderRadius="md">
                    <AlertIcon />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold">Time remaining:</Text>
                      <Text>{formatTimeRemaining()}</Text>
                    </VStack>
                  </Alert>
                  
                  {payment?.payment_method && (
                    <Box>
                      <Text fontSize="sm" color="gray.500">Payment Method</Text>
                      <HStack>
                        <Icon as={
                          payment.payment_method.includes('bank') ? FaMoneyBillWave : 
                          payment.payment_method.includes('qr') ? FaQrcode :
                          payment.payment_method.includes('gopay') ? FaMobileAlt :
                          FaCreditCard
                        } />
                        <Text fontWeight="medium">
                          {payment.payment_method.replace('midtrans_', '').replace('_', ' ').toUpperCase()}
                        </Text>
                      </HStack>
                    </Box>
                  )}
                  
                  <Box>
                    <Text fontSize="sm" color="gray.500">Invoice Number</Text>
                    <Text fontWeight="medium">#{invoice?.invoice_no}</Text>
                  </Box>
                  
                  <Divider />
                  
                  <Box>
                    <Text fontSize="sm" color="gray.500">Payment Amount</Text>
                    <Text fontWeight="bold" fontSize="xl" color="green.500">
                      {formatCurrency(invoice?.amount || 0)}
                    </Text>
                  </Box>
                  
                  <Divider />
                  
                  <Text fontSize="sm">
                    After making the payment, it might take a few minutes for our system to receive the confirmation. 
                    Click "Check Payment Status" if you have completed the payment.
                  </Text>
                </VStack>
              </CardBody>
            </Card>          </Box>
        </SimpleGrid>
        
        {/* Manual Payment Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Upload Manual Payment</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4} align="stretch">
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">Manual Payment Instructions:</Text>
                    <Text fontSize="sm">
                      If you've already made the payment through bank transfer or other means, 
                      upload your payment proof here for verification.
                    </Text>
                  </VStack>
                </Alert>
                
                <FormControl isRequired>
                  <FormLabel>Payment Channel</FormLabel>
                  <Select
                    value={manualPaymentData.payment_channel}
                    onChange={(e) => setManualPaymentData(prev => ({
                      ...prev,
                      payment_channel: e.target.value
                    }))}
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash Payment</option>
                    <option value="check">Check</option>
                    <option value="money_order">Money Order</option>
                  </Select>
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Bank Name</FormLabel>
                  <Input
                    placeholder="e.g., BCA, BRI, Mandiri"
                    value={manualPaymentData.bank_name}
                    onChange={(e) => setManualPaymentData(prev => ({
                      ...prev,
                      bank_name: e.target.value
                    }))}
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Account Number</FormLabel>
                  <Input
                    placeholder="Account number used for transfer"
                    value={manualPaymentData.account_number}
                    onChange={(e) => setManualPaymentData(prev => ({
                      ...prev,
                      account_number: e.target.value
                    }))}
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Account Holder Name</FormLabel>
                  <Input
                    placeholder="Name on the account"
                    value={manualPaymentData.account_holder_name}
                    onChange={(e) => setManualPaymentData(prev => ({
                      ...prev,
                      account_holder_name: e.target.value
                    }))}
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Transfer Date</FormLabel>
                  <Input
                    type="date"
                    value={manualPaymentData.transfer_date}
                    onChange={(e) => setManualPaymentData(prev => ({
                      ...prev,
                      transfer_date: e.target.value
                    }))}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <Textarea
                    placeholder="Additional notes about the payment"
                    value={manualPaymentData.notes}
                    onChange={(e) => setManualPaymentData(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Payment Proof</FormLabel>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setPaymentProof(e.target.files[0])}
                    p={1}
                  />
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Upload bank transfer receipt, payment confirmation, or other payment proof (Image or PDF)
                  </Text>
                  {paymentProof && (
                    <Box mt={2} p={2} bg="gray.50" borderRadius="md">
                      <Text fontSize="sm" fontWeight="medium">
                        Selected file: {paymentProof.name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Size: {(paymentProof.size / 1024 / 1024).toFixed(2)} MB
                      </Text>
                    </Box>
                  )}
                </FormControl>
              </VStack>
            </ModalBody>
            
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="brand"
                onClick={handleManualPayment}
                isLoading={processing}
                loadingText="Submitting..."
                isDisabled={!paymentProof || !manualPaymentData.bank_name || !manualPaymentData.account_number}
              >
                Submit Payment
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </TenantLayout>
  );
};

export default PaymentProcess;
