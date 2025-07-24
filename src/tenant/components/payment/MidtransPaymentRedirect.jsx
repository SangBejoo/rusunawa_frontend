import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, 
  Heading, 
  Text, 
  Button, 
  VStack,
  HStack,
  Spinner,
  Alert,
  AlertIcon,
  Link as ChakraLink,
  useToast,
  Progress,
  Icon,
  Badge,
  Divider,
  useColorModeValue,
  Flex,
  SimpleGrid,
  Code,
  Tooltip
} from '@chakra-ui/react';
import { 
  ExternalLinkIcon, 
  CheckCircleIcon, 
  WarningIcon, 
  RepeatIcon 
} from '@chakra-ui/icons';
import { 
  FaClock, 
  FaExternalLinkAlt, 
  FaSync, 
  FaShieldAlt,
  FaCreditCard,
  FaMobileAlt,
  FaQrcode
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import paymentService from '../../services/paymentService';

/**
 * Enhanced Component to handle Midtrans payment redirection and status checking
 * 
 * @param {Object} props Component props
 * @param {string} props.paymentUrl Midtrans payment URL
 * @param {string} props.orderId Midtrans order ID or transaction ID
 * @param {number} props.invoiceId Invoice ID
 * @param {string} props.paymentMethod Payment method type
 * @param {number} props.amount Payment amount
 * @param {Function} props.onCancel Callback when user cancels
 * @param {Function} props.onComplete Callback when payment is completed
 * @param {boolean} props.autoOpen Whether to automatically open payment window
 */
const MidtransPaymentRedirect = ({ 
  paymentUrl, 
  orderId, 
  invoiceId, 
  paymentMethod,
  amount,
  onCancel, 
  onComplete,
  autoOpen = true
}) => {
  const [isOpening, setIsOpening] = useState(autoOpen);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentWindow, setPaymentWindow] = useState(null);
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [isPolling, setIsPolling] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [popupBlocked, setPopupBlocked] = useState(false);
  
  const toast = useToast();
  const navigate = useNavigate();
  
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const highlightBg = useColorModeValue('blue.50', 'blue.900');

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format time remaining
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get payment method icon and display name
  const getPaymentMethodInfo = (method) => {
    if (!method) return { icon: FaCreditCard, name: 'Online Payment', color: 'blue' };
    
    const lowerMethod = method.toLowerCase();
    if (lowerMethod.includes('qr') || lowerMethod.includes('qris')) {
      return { icon: FaQrcode, name: 'QRIS', color: 'purple' };
    } else if (lowerMethod.includes('gopay') || lowerMethod.includes('ovo') || lowerMethod.includes('dana')) {
      return { icon: FaMobileAlt, name: 'E-Wallet', color: 'green' };
    } else if (lowerMethod.includes('bank') || lowerMethod.includes('bca') || lowerMethod.includes('mandiri')) {
      return { icon: FaCreditCard, name: 'Bank Transfer', color: 'blue' };
    } else {
      return { icon: FaCreditCard, name: 'Credit Card', color: 'orange' };
    }
  };

  const methodInfo = getPaymentMethodInfo(paymentMethod);  // Auto-check payment status periodically
  const pollPaymentStatus = useCallback(async () => {
    if (!orderId || checkingStatus || isPolling) return;
    
    setIsPolling(true);
    try {
      const response = await paymentService.checkMidtransPaymentStatus(orderId);
      
      if (response && response.payment) {
        const status = response.payment.status?.toLowerCase();
        
        if (status === 'success' || status === 'settlement' || status === 'capture' || status === 'verified') {
          // Payment successful or verified
          if (paymentWindow) {
            paymentWindow.close();
          }
          
          const isVerified = status === 'verified';
          toast({
            title: isVerified ? "Payment Verified!" : "Payment Successful!",
            description: isVerified 
              ? "Your payment has been verified and approved."
              : "Your payment has been processed successfully.",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
          
          if (onComplete) {
            onComplete({ 
              status: 'success', 
              payment: response.payment,
              isVerified: isVerified
            });
          } else {
            // Navigate to confirmation page
            navigate(`/tenant/payments/status/${invoiceId}?transaction_id=${orderId}&verified=${isVerified}`);
          }
          return true;
        } else if (status === 'failure' || status === 'cancel' || status === 'expire' || status === 'denied') {
          // Payment failed
          if (paymentWindow) {
            paymentWindow.close();
          }
          
          const statusMessages = {
            'failure': 'Your payment could not be processed.',
            'cancel': 'Payment was cancelled.',
            'expire': 'Payment session has expired.',
            'denied': 'Payment was denied.'
          };
          
          toast({
            title: "Payment Failed",
            description: statusMessages[status] || "Your payment could not be processed. Please try again.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          
          if (onComplete) {
            onComplete({ status: 'failed', payment: response.payment });
          }
          return true;
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      // Enhanced error handling with retry logic
      toast({
        title: "Connection Error",
        description: "Unable to check payment status. Will retry automatically.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsPolling(false);
    }
    return false;
  }, [orderId, checkingStatus, isPolling, paymentWindow, toast, onComplete, navigate, invoiceId]);

  // Open payment window
  const openPaymentWindow = useCallback(() => {
    if (!paymentUrl) return;
    
    try {
      const newWindow = window.open(
        paymentUrl, 
        'midtrans_payment',
        'width=800,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
      );
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        setPopupBlocked(true);
        toast({
          title: 'Pop-up Blocked',
          description: 'Please enable pop-ups for this website and try again.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        setIsOpening(false);
        return;
      }
      
      setPaymentWindow(newWindow);
      setPopupBlocked(false);
      setIsOpening(false);
      
      // Check if window is closed
      const checkClosed = setInterval(() => {
        if (newWindow.closed) {
          clearInterval(checkClosed);
          setPaymentWindow(null);
          
          // Give user option to check status
          setTimeout(() => {
            toast({
              title: 'Payment Window Closed',
              description: 'If you completed the payment, click "Check Status" to verify.',
              status: 'info',
              duration: 8000,
              isClosable: true,
            });
          }, 1000);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error opening payment window:', error);
      setIsOpening(false);
      toast({
        title: 'Error',
        description: 'Failed to open payment window. Please try the manual link.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [paymentUrl, toast]);

  // Initialize countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-open payment window when component mounts
  useEffect(() => {
    if (autoOpen && paymentUrl && isOpening) {
      const timer = setTimeout(openPaymentWindow, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoOpen, paymentUrl, isOpening, openPaymentWindow]);

  // Start polling for payment status after opening window
  useEffect(() => {
    if (paymentWindow && !isPolling) {
      const pollInterval = setInterval(async () => {
        const completed = await pollPaymentStatus();
        if (completed) {
          clearInterval(pollInterval);
        }
      }, 5000); // Check every 5 seconds
      
      return () => clearInterval(pollInterval);
    }
  }, [paymentWindow, isPolling, pollPaymentStatus]);  // Handle manual status check
  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    setAttempts(prev => prev + 1);
    
    try {
      let transactionId = orderId;
      
      // Try to extract transaction ID from payment URL if not provided
      if (!transactionId && paymentUrl) {
        const urlTransactionIdMatch = paymentUrl.match(/\/([^/]+)$/);
        transactionId = urlTransactionIdMatch ? urlTransactionIdMatch[1] : null;
      }
      
      if (!transactionId) {
        toast({
          title: 'Error',
          description: 'Could not determine payment details for status check.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      const response = await paymentService.checkMidtransPaymentStatus(transactionId);
        if (response && response.payment) {
        const status = response.payment.status?.toLowerCase();
        
        if (status === 'success' || status === 'settlement' || status === 'capture' || status === 'verified') {
          toast({
            title: status === 'verified' ? "Payment Verified!" : "Payment Confirmed!",
            description: status === 'verified' 
              ? "Your payment has been successfully verified and approved."
              : "Your payment has been successfully verified.",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
          
          if (onComplete) {
            onComplete({ 
              status: 'success', 
              payment: response.payment,
              isVerified: status === 'verified'
            });
          } else {
            navigate(`/tenant/payments/status/${invoiceId}?transaction_id=${transactionId}&verified=${status === 'verified'}`);
          }
        } else if (status === 'pending') {
          toast({
            title: "Payment Still Pending",
            description: "Your payment is still being processed. Please wait a moment and try again.",
            status: "info",
            duration: 5000,
            isClosable: true,
          });
        } else if (status === 'failure' || status === 'cancel' || status === 'expire' || status === 'denied') {
          const statusMessages = {
            'failure': 'Your payment was not successful.',
            'cancel': 'Payment was cancelled.',
            'expire': 'Payment session has expired.',
            'denied': 'Payment was denied.'
          };
          
          toast({
            title: "Payment Failed",
            description: statusMessages[status] || "Your payment was not successful. Please try again with a different payment method.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          
          if (onComplete) {
            onComplete({ status: 'failed', payment: response.payment });
          }
        } else {
          toast({
            title: "Status Unknown",
            description: `Payment status: ${status}. Please contact support if this persists.`,
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
        }
      } else {
        toast({
          title: "Unable to Check Status",
          description: "Could not verify payment status. Please try again in a moment.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      toast({
        title: 'Error',
        description: 'Failed to check payment status. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  // Handle retry opening payment window
  const handleRetryOpen = () => {
    setIsOpening(true);
    setPopupBlocked(false);
    openPaymentWindow();
  };

  // Handle cancel
  const handleCancel = () => {
    if (paymentWindow) {
      paymentWindow.close();
    }
    if (onCancel) {
      onCancel();
    }
  };
  return (
    <Box 
      p={6} 
      borderWidth="1px" 
      borderRadius="lg" 
      bg={bgColor} 
      borderColor={borderColor}
      boxShadow="lg"
      maxW="600px"
      mx="auto"
    >
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <VStack spacing={3} align="center">
          <Icon as={methodInfo.icon} boxSize={12} color={`${methodInfo.color}.500`} />
          <Heading size="lg" textAlign="center" color="brand.600">
            Complete Your Payment
          </Heading>
          <Text color="gray.600" textAlign="center">
            Pay securely through Midtrans payment gateway
          </Text>
        </VStack>

        {/* Payment Details */}
        {amount && (
          <Box bg={highlightBg} p={4} borderRadius="md" textAlign="center">
            <Text fontSize="sm" color="gray.600" mb={1}>Amount to Pay</Text>
            <Text fontSize="2xl" fontWeight="bold" color="brand.600">
              {formatCurrency(amount)}
            </Text>
            {paymentMethod && (
              <Badge colorScheme={methodInfo.color} mt={2}>
                {methodInfo.name}
              </Badge>
            )}
          </Box>
        )}

        {/* Countdown Timer */}
        {countdown > 0 && (
          <Box>
            <Flex justify="space-between" align="center" mb={2}>
              <HStack>
                <Icon as={FaClock} color="orange.500" />
                <Text fontSize="sm" fontWeight="medium">Session Expires In</Text>
              </HStack>
              <Text fontSize="sm" fontWeight="bold" color="orange.500">
                {formatTime(countdown)}
              </Text>
            </Flex>
            <Progress 
              value={(300 - countdown) / 300 * 100} 
              size="sm" 
              colorScheme="orange" 
              borderRadius="full"
            />
          </Box>
        )}
        
        {/* Main Content */}
        {isOpening ? (
          <VStack spacing={4} py={6}>
            <Spinner size="xl" color="brand.500" thickness="4px" />
            <Text fontWeight="medium">Opening Midtrans payment window...</Text>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              A new window will open for secure payment processing
            </Text>
          </VStack>
        ) : popupBlocked ? (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="medium">Pop-up blocked!</Text>
              <Text fontSize="sm">
                Please enable pop-ups for this website and try again, or use the manual link below.
              </Text>
            </Box>
          </Alert>
        ) : (
          <VStack spacing={4} align="stretch">
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="medium">Payment window opened</Text>
                <Text fontSize="sm">
                  Complete your payment in the new window. If no window appeared, use the manual link below.
                </Text>
              </Box>
            </Alert>

            {/* Manual Payment Link */}
            <Box textAlign="center" p={4} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
              <Text fontWeight="medium" mb={2}>Didn't see the payment window?</Text>
              <ChakraLink 
                href={paymentUrl} 
                isExternal 
                color="brand.500" 
                fontWeight="bold"
                fontSize="lg"
                display="inline-flex"
                alignItems="center"
                gap={2}
              >
                Open Payment Page Manually
                <Icon as={FaExternalLinkAlt} />
              </ChakraLink>
            </Box>

            {/* Security Notice */}
            <HStack justify="center" p={3} bg="green.50" borderRadius="md" spacing={2}>
              <Icon as={FaShieldAlt} color="green.500" />
              <Text fontSize="sm" color="green.700">
                Your payment is secured by Midtrans SSL encryption
              </Text>
            </HStack>
          </VStack>
        )}

        <Divider />

        {/* Action Buttons */}
        <VStack spacing={3}>
          {!isOpening && (
            <>
              {popupBlocked && (
                <Button
                  onClick={handleRetryOpen}
                  colorScheme="brand"
                  size="lg"
                  width="full"
                  leftIcon={<RepeatIcon />}
                >
                  Retry Opening Payment Window
                </Button>
              )}
              
              <SimpleGrid columns={paymentWindow ? 1 : 2} spacing={3} width="full">
                <Button
                  onClick={handleCheckStatus}
                  colorScheme="brand"
                  size="lg"
                  isLoading={checkingStatus}
                  loadingText="Checking..."
                  leftIcon={<Icon as={FaSync} />}
                  variant={paymentWindow ? "solid" : "outline"}
                >
                  {attempts > 0 ? `Check Status (${attempts})` : 'Check Payment Status'}
                </Button>
                
                {!paymentWindow && (
                  <Button 
                    onClick={handleCancel} 
                    variant="outline"
                    colorScheme="gray"
                    size="lg"
                  >
                    Cancel Payment
                  </Button>
                )}
              </SimpleGrid>
              
              {paymentWindow && (
                <Button 
                  onClick={handleCancel} 
                  variant="ghost"
                  colorScheme="gray"
                  size="sm"
                >
                  Cancel Payment
                </Button>
              )}
            </>
          )}
        </VStack>

        {/* Instructions */}
        {!isOpening && (
          <Box fontSize="sm" color="gray.600" textAlign="center">
            <Text mb={2} fontWeight="medium">Next Steps:</Text>
            <VStack spacing={1} align="start">
              <Text>1. Complete your payment in the payment window</Text>
              <Text>2. Return to this page after payment</Text>
              <Text>3. Click "Check Payment Status" to verify</Text>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default MidtransPaymentRedirect;
