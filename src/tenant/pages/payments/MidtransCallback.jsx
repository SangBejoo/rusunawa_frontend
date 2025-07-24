import React, { useState, useEffect } from 'react';
import {
  Box, Container, VStack, HStack, Text, Heading, Button, Card, CardBody,
  Spinner, Alert, AlertIcon, Progress, useToast, Badge, Divider,
  Icon, useColorModeValue
} from '@chakra-ui/react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiXCircle, FiClock, FiRefreshCw } from 'react-icons/fi';
import TenantLayout from '../../components/layout/TenantLayout';
import paymentService from '../../services/paymentService';

const MidtransCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('checking');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [progress, setProgress] = useState(0);
  
  // Extract parameters from URL
  const invoiceId = searchParams.get('invoice_id');
  const bookingId = searchParams.get('booking_id');
  const transactionStatus = searchParams.get('transaction_status');
  const orderId = searchParams.get('order_id');
  const statusCode = searchParams.get('status_code');
  
  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    if (invoiceId || orderId) {
      checkPaymentStatus();
    } else {
      setError('Missing payment information in URL');
      setLoading(false);
    }
  }, [invoiceId, orderId]);

  // Simulate progress animation
  useEffect(() => {
    if (paymentStatus === 'checking') {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      return () => clearInterval(progressInterval);
    } else {
      setProgress(100);
    }
  }, [paymentStatus]);

  const checkPaymentStatus = async () => {
    try {
      setLoading(true);
      setPaymentStatus('checking');
      
      console.log('Checking payment status for:', {
        invoiceId,
        orderId,
        transactionStatus,
        statusCode
      });

      let response;
      
      // Try checking by order ID first (most reliable)
      if (orderId) {
        response = await paymentService.checkMidtransPaymentStatus(orderId);
      } else if (invoiceId) {
        // Alternative: check invoice status
        response = await paymentService.getInvoice(invoiceId);
      }

      if (response) {
        console.log('Payment status response:', response);
        
        // Handle different response formats
        const payment = response.payment || response.data?.payment || response;
        const invoice = response.invoice || response.data?.invoice;
        
        setPaymentDetails({
          ...payment,
          invoice: invoice,
          order_id: payment.transaction_id || payment.order_id || orderId,
          transaction_status: payment.status || payment.transaction_status || transactionStatus,
          payment_type: payment.payment_channel || payment.payment_type,
          gross_amount: payment.amount || payment.gross_amount
        });

        // Determine payment status based on response
        const status = payment.status?.toLowerCase() || payment.transaction_status?.toLowerCase();
        
        if (status === 'verified' || status === 'success' || status === 'settlement' || status === 'capture') {
          setPaymentStatus('success');
          
          toast({
            title: 'Payment Successful!',
            description: 'Your payment has been verified and processed successfully.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          
        } else if (status === 'pending') {
          setPaymentStatus('pending');
          
          toast({
            title: 'Payment Pending',
            description: 'Your payment is being processed. Please wait for verification.',
            status: 'info',
            duration: 5000,
            isClosable: true,
          });
          
        } else if (status === 'failed' || status === 'deny' || status === 'cancel' || status === 'expire') {
          setPaymentStatus('failed');
          
          toast({
            title: 'Payment Failed',
            description: 'Your payment could not be processed. Please try again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          
        } else {
          setPaymentStatus('unknown');
          console.warn('Unknown payment status:', status);
        }
        
      } else {
        throw new Error('No payment information received');
      }
      
    } catch (error) {
      console.error('Error checking payment status:', error);
      setError(error.message || 'Failed to check payment status');
      setPaymentStatus('error');
      
      toast({
        title: 'Error',
        description: 'Failed to verify payment status. Please contact support.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetryCheck = () => {
    setError(null);
    checkPaymentStatus();
  };

  const handleViewInvoice = () => {
    if (invoiceId) {
      navigate(`/tenant/invoices/${invoiceId}`);
    } else {
      navigate('/tenant/invoices');
    }
  };

  const handleViewBooking = () => {
    if (bookingId) {
      navigate(`/tenant/bookings/${bookingId}`);
    } else {
      navigate('/tenant/bookings');
    }
  };

  const handleBackToPayment = () => {
    if (bookingId) {
      navigate(`/tenant/bookings/${bookingId}/payment-method`);
    } else {
      navigate('/tenant/bookings');
    }
  };

  const renderStatusContent = () => {
    switch (paymentStatus) {
      case 'success':
        return (
          <VStack spacing={6} align="center" py={8}>
            <Icon as={FiCheckCircle} w={20} h={20} color="green.500" />
            <VStack spacing={2} textAlign="center">
              <Heading size="lg" color="green.600">Payment Successful!</Heading>
              <Text color="gray.600">
                Your payment has been verified and processed successfully. 
                Your booking is now confirmed.
              </Text>
            </VStack>
            
            {paymentDetails && (
              <Card w="full" bg={cardBg}>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <Heading size="sm" color="green.600">Payment Details</Heading>
                    <Divider />
                    
                    {paymentDetails.order_id && (
                      <HStack justify="space-between">
                        <Text fontWeight="medium">Order ID:</Text>
                        <Text fontFamily="mono" fontSize="sm">{paymentDetails.order_id}</Text>
                      </HStack>
                    )}
                    
                    {paymentDetails.payment_type && (
                      <HStack justify="space-between">
                        <Text fontWeight="medium">Payment Method:</Text>
                        <Badge colorScheme="blue" textTransform="capitalize">
                          {paymentDetails.payment_type.replace('_', ' ')}
                        </Badge>
                      </HStack>
                    )}
                    
                    {paymentDetails.gross_amount && (
                      <HStack justify="space-between">
                        <Text fontWeight="medium">Amount:</Text>
                        <Text fontWeight="bold" color="green.600">
                          Rp {parseFloat(paymentDetails.gross_amount).toLocaleString('id-ID')}
                        </Text>
                      </HStack>
                    )}
                    
                    <HStack justify="space-between">
                      <Text fontWeight="medium">Status:</Text>
                      <Badge colorScheme="green">VERIFIED</Badge>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            )}
            
            <HStack spacing={3} pt={4}>
              <Button colorScheme="green" onClick={handleViewInvoice}>
                View Invoice
              </Button>
              <Button variant="outline" onClick={handleViewBooking}>
                View Booking
              </Button>
            </HStack>
          </VStack>
        );

      case 'pending':
        return (
          <VStack spacing={6} align="center" py={8}>
            <Icon as={FiClock} w={16} h={16} color="orange.500" />
            <VStack spacing={2} textAlign="center">
              <Heading size="lg" color="orange.600">Payment Pending</Heading>
              <Text color="gray.600">
                Your payment is being processed. This may take a few minutes.
              </Text>
            </VStack>
            
            <HStack spacing={3} pt={4}>
              <Button colorScheme="orange" leftIcon={<FiRefreshCw />} onClick={handleRetryCheck}>
                Check Status Again
              </Button>
              <Button variant="outline" onClick={handleViewBooking}>
                View Booking
              </Button>
            </HStack>
          </VStack>
        );

      case 'failed':
        return (
          <VStack spacing={6} align="center" py={8}>
            <Icon as={FiXCircle} w={16} h={16} color="red.500" />
            <VStack spacing={2} textAlign="center">
              <Heading size="lg" color="red.600">Payment Failed</Heading>
              <Text color="gray.600">
                We couldn't process your payment. Please try again with a different payment method.
              </Text>
            </VStack>
            
            <HStack spacing={3} pt={4}>
              <Button colorScheme="red" onClick={handleBackToPayment}>
                Try Again
              </Button>
              <Button variant="outline" onClick={handleViewBooking}>
                View Booking
              </Button>
            </HStack>
          </VStack>
        );

      case 'checking':
      default:
        return (
          <VStack spacing={6} align="center" py={10}>
            <Spinner size="xl" thickness="4px" color="blue.500" />
            <VStack spacing={2} textAlign="center">
              <Heading size="md">Verifying Payment</Heading>
              <Text color="gray.600">
                Please wait while we verify your payment status...
              </Text>
            </VStack>
            
            <Box w="full" maxW="md">
              <Progress value={progress} colorScheme="blue" borderRadius="full" />
            </Box>
          </VStack>
        );
    }
  };

  if (error) {
    return (
      <TenantLayout>
        <Container maxW="container.md" py={8}>
          <VStack spacing={6}>
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold">Error Checking Payment Status</Text>
                <Text fontSize="sm">{error}</Text>
              </VStack>
            </Alert>
            
            <HStack spacing={3}>
              <Button colorScheme="red" onClick={handleRetryCheck}>
                Retry
              </Button>
              <Button variant="outline" onClick={handleViewBooking}>
                View Booking
              </Button>
            </HStack>
          </VStack>
        </Container>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Container maxW="container.md" py={8}>
        <Card bg={cardBg} shadow="lg">
          <CardBody>
            {renderStatusContent()}
          </CardBody>
        </Card>
      </Container>
    </TenantLayout>
  );
};

export default MidtransCallback;
