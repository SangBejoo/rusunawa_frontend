import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  VStack,
  Box,
  Heading,
  Text,
  Button,
  Icon,
  HStack,
  Spinner,
  Progress,
  useToast,
} from '@chakra-ui/react';
import { FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import paymentService from '../../services/paymentService';

/**
 * Component to handle Midtrans payment callback and status checking
 */
const MidtransCallback = ({ orderId, invoiceId, onComplete }) => {
  const [status, setStatus] = useState('checking');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  
  const navigate = useNavigate();
  const toast = useToast();
  
  // Reference to store the interval ID
  let intervalId = null;
  useEffect(() => {
    // Define the function to check payment status
    const checkPaymentStatus = async () => {      try {
        if (!orderId) {
          setError("Missing transaction ID. Cannot check payment status.");
          setLoading(false);
          return;
        }
        
        console.log("Checking payment status for transaction:", orderId);
        const response = await paymentService.checkMidtransPaymentStatus(orderId);
        
        if (response && response.payment) {
          setPaymentDetails(response.payment);
          
          // Update status based on payment status
          if (response.payment.status === 'success') {
            setStatus('success');
            if (intervalId) clearInterval(intervalId);
            
            toast({
              title: "Payment Successful!",
              description: "Your payment has been processed successfully.",
              status: "success",
              duration: 5000,
              isClosable: true,
            });
            
            // Notify parent component if provided
            if (onComplete) onComplete({status: 'success', payment: response.payment});
          } else if (response.payment.status === 'failed') {
            setStatus('failed');
            if (intervalId) clearInterval(intervalId);
            
            toast({
              title: "Payment Failed",
              description: "Your payment could not be processed.",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
            
            // Notify parent component if provided
            if (onComplete) onComplete({status: 'failed', payment: response.payment});
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error checking payment status:", error);
        setError(error.message || "Failed to check payment status");
        setLoading(false);
      }
    };
    
    // Set up polling interval (check every 3 seconds)
    intervalId = setInterval(checkPaymentStatus, 3000);
    
    // Clean up on component unmount
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderId, invoiceId, onComplete]);
  // Handle manual return to bookings
  const handleReturn = () => {
    navigate('/bookings');
  };
  // Handle viewing invoice
  const handleViewInvoice = () => {
    if (invoiceId) {
      navigate(`/invoices/${invoiceId}`);
    } else {
      navigate('/invoices');
    }
  };

  // Simulate progress for UX
  useEffect(() => {
    if (status === 'checking') {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return newProgress;
        });
      }, 500);
      
      return () => clearInterval(progressInterval);
    } else if (status === 'success' || status === 'failed') {
      setProgress(100);
    }
  }, [status]);

  // Render content based on status
  const renderContent = () => {
    switch (status) {
      case 'success':
        return (
          <VStack spacing={4} align="center" py={6}>
            <Icon as={FiCheckCircle} w={16} h={16} color="green.500" />
            <Heading size="lg" textAlign="center" color="green.600">Payment Successful!</Heading>
            <Text align="center">
              Your payment has been successfully processed. Your booking is now confirmed.
            </Text>
            {paymentDetails && (
              <Box w="full" bg="gray.50" p={4} borderRadius="md">
                <VStack spacing={2} align="stretch">
                  <HStack justify="space-between">
                    <Text fontWeight="medium">Order ID:</Text>
                    <Text>{paymentDetails.order_id}</Text>
                  </HStack>
                  {paymentDetails.payment_type && (
                    <HStack justify="space-between">
                      <Text fontWeight="medium">Payment Method:</Text>
                      <Text>{paymentDetails.payment_type.replace('_', ' ')}</Text>
                    </HStack>
                  )}
                  {paymentDetails.gross_amount && (
                    <HStack justify="space-between">
                      <Text fontWeight="medium">Amount:</Text>
                      <Text>Rp {parseFloat(paymentDetails.gross_amount).toLocaleString()}</Text>
                    </HStack>
                  )}
                </VStack>
              </Box>
            )}
            <HStack spacing={4} pt={4}>
              <Button
                onClick={handleViewInvoice}
                colorScheme="brand"
              >
                View Invoice
              </Button>
              <Button
                onClick={handleReturn}
                variant="outline"
              >
                Return to Bookings
              </Button>
            </HStack>
          </VStack>
        );
        
      case 'failed':
        return (
          <VStack spacing={4} align="center" py={6}>
            <Icon as={FiXCircle} w={16} h={16} color="red.500" />
            <Heading size="lg" textAlign="center" color="red.600">Payment Failed</Heading>
            <Text align="center">
              We couldn't process your payment. Please try again or choose a different payment method.
            </Text>
            <HStack spacing={4} pt={4}>
              <Button
                onClick={handleViewInvoice}
                colorScheme="brand"
              >
                Try Again
              </Button>
              <Button
                onClick={handleReturn}
                variant="outline"
              >
                Return to Bookings
              </Button>
            </HStack>
          </VStack>
        );
        
      case 'checking':
      default:
        return (
          <VStack spacing={6} align="center" py={10}>
            <Icon as={FiClock} w={12} h={12} color="brand.500" />
            <Heading size="md">Checking Payment Status</Heading>
            <Text align="center">
              Please wait while we verify your payment with our payment provider...
            </Text>
            <Box w="full" pt={2}>
              <Progress value={progress} size="sm" colorScheme="brand" borderRadius="full" />
            </Box>
            {loading && <Spinner color="brand.500" size="md" />}
            {error && (
              <Text color="red.500" fontSize="sm">
                Error: {error}
              </Text>
            )}
          </VStack>
        );
    }
  };

  return (
    <Box 
      bg="white" 
      borderRadius="lg" 
      boxShadow="md" 
      p={{ base: 4, md: 8 }}
      width="100%"
    >
      {renderContent()}
    </Box>
  );
};

export default MidtransCallback;
