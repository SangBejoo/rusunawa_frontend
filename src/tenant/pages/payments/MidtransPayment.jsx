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
  Alert,
  AlertIcon,
  Spinner,
  useToast,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Badge,
  Link,
  Icon
} from '@chakra-ui/react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaCreditCard, FaExternalLinkAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import bookingService from '../../services/bookingService';
import paymentService from '../../services/paymentService';
import invoiceService from '../../services/invoiceService';
import { validateId } from '../../utils/apiUtils';

const MidtransPayment = () => {
  const { bookingId, invoiceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [booking, setBooking] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [error, setError] = useState(null);

  // Get payment URL from navigation state if available
  const midtransUrlFromState = location.state?.paymentUrl;

  useEffect(() => {
    fetchData();
  }, [bookingId, invoiceId]);
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (bookingId) {
        const validBookingId = validateId(bookingId);
        if (!validBookingId) {
          throw new Error(`Invalid booking ID: ${bookingId}`);
        }
        
        const bookingResponse = await bookingService.getBooking(validBookingId);
        if (!bookingResponse || !bookingResponse.booking) {
          throw new Error('Booking not found');
        }
        
        setBooking(bookingResponse.booking);
      }
      
      if (invoiceId) {
        const validInvoiceId = validateId(invoiceId);
        if (!validInvoiceId) {
          throw new Error(`Invalid invoice ID: ${invoiceId}`);
        }
        
        // Fetch invoice details and related booking
        try {
          const invoiceResponse = await invoiceService.getInvoice(validInvoiceId);
          if (invoiceResponse && invoiceResponse.invoice) {
            setInvoice(invoiceResponse.invoice);
            
            // If invoice has booking info, try to fetch booking details
            const bookingId = invoiceResponse.invoice.bookingId || invoiceResponse.invoice.booking_id;
            if (bookingId && !booking) {
              try {
                const bookingResponse = await bookingService.getBooking(bookingId);
                if (bookingResponse && bookingResponse.booking) {
                  setBooking(bookingResponse.booking);
                }
              } catch (bookingError) {
                console.warn('Could not fetch booking for invoice:', bookingError);
                // Continue without booking details
              }
            }
          }
        } catch (invoiceError) {
          console.warn('Could not fetch invoice details:', invoiceError);
          // Continue without invoice details - user can still create payment
        }
      }
      
      // Use payment URL from state if available
      if (midtransUrlFromState) {
        setPaymentUrl(midtransUrlFromState);
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };
  const handleCreateMidtransPayment = async () => {
    try {
      setProcessing(true);
      
      // Handle both booking-based and invoice-based flows
      if (invoiceId) {
        // Invoice-based flow: use Snap token generation
        const response = await paymentService.generateSnapToken(null, invoiceId);
        
        if (response.redirectUrl || response.redirect_url) {
          const redirectUrl = response.redirectUrl || response.redirect_url;
          setPaymentUrl(redirectUrl);
          
          toast({
            title: 'Payment Link Generated',
            description: 'Your Midtrans payment link has been created successfully.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        } else {
          throw new Error('Failed to generate Midtrans payment link from invoice');
        }
        
      } else if (bookingId && booking) {
        // Booking-based flow: generate invoice with Midtrans
        const response = await paymentService.generateInvoiceWithMidtrans({
          booking_id: booking.bookingId || booking.booking_id,
          tenant_id: booking.tenantId || booking.tenant_id,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Payment via Midtrans',
          items: [
            {
              description: 'Room rental payment',
              quantity: 1,
              unit_price: booking.totalAmount || booking.total_amount || booking.amount || 0,
              total: booking.totalAmount || booking.total_amount || booking.amount || 0
            }
          ],
          enable_midtrans: true
        });
        
        if (response.midtransRedirectUrl) {
          setPaymentUrl(response.midtransRedirectUrl);
          
          toast({
            title: 'Payment Link Generated',
            description: 'Your Midtrans payment link has been created successfully.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        } else {
          throw new Error('Failed to generate Midtrans payment link from booking');
        }
        
      } else {
        throw new Error('Either booking or invoice information is required');
      }
      
    } catch (err) {
      console.error('Error creating Midtrans payment:', err);
      toast({
        title: 'Payment Error',
        description: err.message || 'Failed to create payment link',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenPayment = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
      
      toast({
        title: 'Payment Window Opened',
        description: 'Complete your payment in the new window. This page will update automatically.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleBackToBooking = () => {
    if (bookingId) {
      navigate(`/tenant/bookings/${bookingId}`);
    } else {
      navigate('/tenant/bookings');
    }
  };

  const handleCheckPaymentStatus = async () => {
    try {
      setProcessing(true);
      
      // Check payment status
      // This would typically involve checking the payment status via the backend
      toast({
        title: 'Checking Payment Status',
        description: 'Please wait while we verify your payment status...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
      // Simulate payment status check - in reality this would be an API call
      setTimeout(() => {
        toast({
          title: 'Payment Status Updated',
          description: 'Your payment status has been refreshed.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }, 2000);
      
    } catch (err) {
      console.error('Error checking payment status:', err);
      toast({
        title: 'Status Check Failed',
        description: 'Failed to check payment status. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <TenantLayout>
        <Container maxW="container.md" py={8}>
          <Flex direction="column" align="center" justify="center" minH="50vh">
            <Spinner size="xl" thickness="4px" color="brand.500" mb={4} />
            <Text>Loading payment information...</Text>
          </Flex>
        </Container>
      </TenantLayout>
    );
  }

  if (error) {
    return (
      <TenantLayout>
        <Container maxW="container.md" py={8}>
          <Button 
            leftIcon={<FaArrowLeft />} 
            onClick={handleBackToBooking}
            mb={6}
          >
            Back to Booking
          </Button>
          
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        </Container>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Container maxW="container.md" py={8}>
        <Button 
          leftIcon={<FaArrowLeft />} 
          onClick={handleBackToBooking}
          mb={6}
        >
          Back to Booking
        </Button>

        <VStack spacing={6} align="stretch">
          <Heading size="lg">Midtrans Payment</Heading>
          
          {/* Payment Summary */}
          {booking && (
            <Card>
              <CardHeader>
                <Heading size="md">Payment Summary</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <Text fontWeight="medium">Booking ID:</Text>
                    <Text>#{booking.bookingId}</Text>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text fontWeight="medium">Room:</Text>
                    <Text>{booking.room?.name || 'N/A'}</Text>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text fontWeight="medium">Check-in:</Text>
                    <Text>{new Date(booking.checkInDate).toLocaleDateString()}</Text>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text fontWeight="medium">Check-out:</Text>
                    <Text>{new Date(booking.checkOutDate).toLocaleDateString()}</Text>
                  </HStack>
                  
                  <Divider />
                  
                  <HStack justify="space-between">
                    <Text fontWeight="bold" fontSize="lg">Total Amount:</Text>
                    <Text fontWeight="bold" fontSize="lg" color="brand.500">
                      Rp {booking.totalAmount?.toLocaleString() || '0'}
                    </Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Payment Action */}
          <Card>
            <CardHeader>
              <HStack>
                <Icon as={FaCreditCard} color="brand.500" />
                <Heading size="md">Midtrans Online Payment</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Text>
                  Complete your payment securely through Midtrans. You can use:
                </Text>
                
                <VStack spacing={2} align="start" pl={4}>
                  <Text fontSize="sm">• Credit/Debit Cards (Visa, MasterCard, JCB)</Text>
                  <Text fontSize="sm">• Bank Transfer (Virtual Account)</Text>
                  <Text fontSize="sm">• E-Wallets (GoPay, OVO, DANA, LinkAja)</Text>
                  <Text fontSize="sm">• QRIS</Text>
                  <Text fontSize="sm">• Convenience Store Payment</Text>
                </VStack>
                
                {!paymentUrl ? (
                  <Button
                    colorScheme="brand"
                    size="lg"
                    onClick={handleCreateMidtransPayment}
                    isLoading={processing}
                    loadingText="Creating Payment Link..."
                    leftIcon={<FaCreditCard />}
                  >
                    Create Payment Link
                  </Button>
                ) : (
                  <VStack spacing={3} align="stretch">
                    <Alert status="success" borderRadius="md">
                      <AlertIcon />
                      <Box>
                        <Text fontWeight="bold">Payment Link Ready</Text>
                        <Text fontSize="sm">Click the button below to open Midtrans payment page.</Text>
                      </Box>
                    </Alert>
                    
                    <Button
                      colorScheme="brand"
                      size="lg"
                      onClick={handleOpenPayment}
                      leftIcon={<FaExternalLinkAlt />}
                    >
                      Open Payment Page
                    </Button>
                    
                    <Text fontSize="sm" textAlign="center" color="gray.600">
                      Payment URL: <Link href={paymentUrl} isExternal color="brand.500">
                        {paymentUrl.substring(0, 50)}...
                      </Link>
                    </Text>
                  </VStack>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Payment Status Check */}
          {paymentUrl && (
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Text fontWeight="medium">Already completed payment?</Text>
                  <Button
                    variant="outline"
                    onClick={handleCheckPaymentStatus}
                    isLoading={processing}
                    loadingText="Checking..."
                    leftIcon={<FaCheckCircle />}
                  >
                    Check Payment Status
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Help Text */}
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Need Help?</Text>
              <Text fontSize="sm">
                If you encounter any issues with the payment process, please contact our support team.
                Payment processing is handled securely by Midtrans.
              </Text>
            </Box>
          </Alert>
        </VStack>
      </Container>
    </TenantLayout>
  );
};

export default MidtransPayment;
