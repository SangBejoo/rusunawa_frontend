import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Divider,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Badge,
  SimpleGrid,
  useColorModeValue,
  useToast,
  Progress,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Code
} from '@chakra-ui/react';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaFileInvoice,
  FaArrowLeft,
  FaHome,
  FaCalendarAlt,
  FaDownload,
  FaReceipt,
  FaSync,
  FaClock,
  FaInfoCircle,
  FaShare,
  FaPrint,
  FaWhatsapp,
  FaEnvelope,
  FaCopy
} from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import paymentService from '../../services/paymentService';
import invoiceService from '../../services/invoiceService';
import { formatCurrency } from '../../components/helpers/typeConverters';
import { formatDate, formatDateTime } from '../../components/helpers/dateFormatter';

const PaymentConfirmation = () => {
  const { paymentId, invoiceId } = useParams();
  const [searchParams] = useSearchParams();
  const transactionId = searchParams.get('transaction_id');
  const navigate = useNavigate();
  const toast = useToast();
  
  // Enhanced state management
  const [payment, setPayment] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [lastChecked, setLastChecked] = useState(null);
  const [progress, setProgress] = useState(0);
  
  // Modal controls
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [shareUrl, setShareUrl] = useState('');
  
  // Enhanced color mode hooks
  const successBg = useColorModeValue('green.50', 'green.900');
  const successColor = useColorModeValue('green.700', 'green.200');
  const failedBg = useColorModeValue('red.50', 'red.900');
  const failedColor = useColorModeValue('red.700', 'red.200');
  const pendingBg = useColorModeValue('yellow.50', 'yellow.900');
  const pendingColor = useColorModeValue('yellow.700', 'yellow.200');
  const cardBg = useColorModeValue('white', 'gray.700');
  const highlightBg = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');  // Enhanced utility functions
  const getBgColor = () => {
    switch (paymentStatus) {
      case 'success': return successBg;
      case 'failed': return failedBg;
      default: return pendingBg;
    }
  };

  const getTextColor = () => {
    switch (paymentStatus) {
      case 'success': return successColor;
      case 'failed': return failedColor;
      default: return pendingColor;
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success': return FaCheckCircle;
      case 'failed': return FaTimesCircle;
      default: return FaExclamationTriangle;
    }
  };

  const getStatusText = () => {
    switch (paymentStatus) {
      case 'success': return 'Payment Successful';
      case 'failed': return 'Payment Failed';
      default: return 'Payment Processing';
    }
  };

  const getStatusDescription = () => {
    switch (paymentStatus) {
      case 'success':
        return 'Your payment has been processed successfully. Your booking is now confirmed.';
      case 'failed':
        return 'There was an issue with your payment. Please try again or choose another payment method.';
      default:
        return 'Your payment is being processed. This may take a few moments.';
    }
  };

  // Get time since last check
  const getTimeSinceLastCheck = () => {
    if (!lastChecked) return '';
    const seconds = Math.floor((new Date() - lastChecked) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };
    // Enhanced manual status check
  const handleManualStatusCheck = () => {
    checkPaymentStatus(true);
  };

  // Retry payment function
  const handleRetryPayment = async () => {
    try {
      setRefreshing(true);
      
      if (invoice?.invoice_id) {
        // Navigate back to payment process
        navigate(`/tenant/invoice/${invoice.invoice_id}/payment`);
      } else {
        toast({
          title: 'Error',
          description: 'Unable to retry payment. Invoice information not found.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error retrying payment:', error);
      toast({
        title: 'Retry Failed',
        description: 'Unable to retry payment. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setRefreshing(false);
    }
  };
  const checkPaymentStatus = useCallback(async (showToast = false) => {
    try {
      setRefreshing(true);
      setCheckAttempts(prev => prev + 1);
      setLastChecked(new Date());
      
      let statusResult = null;
      
      // Try different methods to check payment status
      if (transactionId) {
        // Check using Midtrans transaction ID
        try {
          const midtransResponse = await paymentService.checkMidtransPaymentStatus(transactionId);
          if (midtransResponse && midtransResponse.payment) {
            statusResult = midtransResponse.payment;
          }
        } catch (midtransError) {
          console.warn('Midtrans status check failed:', midtransError);
        }
      }
      
      // Fallback to invoice check
      if (!statusResult && invoice?.invoice_id) {
        const invoiceResponse = await invoiceService.getInvoice(invoice.invoice_id);
        if (invoiceResponse && invoiceResponse.invoice) {
          setInvoice(invoiceResponse.invoice);
          statusResult = { status: invoiceResponse.invoice.status };
        }
      }
      
      // Update payment status based on results
      if (statusResult) {        const status = statusResult.status?.toLowerCase();
        
        if (status === 'success' || status === 'settlement' || status === 'capture' || status === 'paid' || status === 'verified') {
          setPaymentStatus('success');
          setProgress(100);
          
          if (showToast) {
            toast({
              title: 'Payment Confirmed!',
              description: 'Your payment has been successfully verified.',
              status: 'success',
              duration: 5000,
              isClosable: true,
            });
          }
          
          return true;
        } else if (status === 'failure' || status === 'cancel' || status === 'expire' || status === 'failed' || status === 'deny') {
          setPaymentStatus('failed');
          setProgress(0);
          
          if (showToast) {
            toast({
              title: 'Payment Failed',
              description: 'Your payment was not successful. Please try again.',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          }
          
          return true;
        } else if (status === 'pending') {
          setPaymentStatus('pending');
          setProgress(Math.min(25 + (checkAttempts * 10), 75));
          
          if (showToast && checkAttempts > 3) {
            toast({
              title: 'Still Processing',
              description: 'Your payment is still being processed. Please wait a moment.',
              status: 'info',
              duration: 3000,
              isClosable: true,
            });
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking payment status:', error);
      if (showToast) {
        toast({
          title: 'Status Check Failed',
          description: 'Unable to check payment status. Please try again.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
      return false;
    } finally {
      setRefreshing(false);
    }
  }, [transactionId, invoice, toast, checkAttempts]);

  // Enhanced data fetching
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setLoading(true);
        setProgress(10);
        
        let foundData = null;
        
        // Try to get data by invoice ID first
        if (invoiceId) {
          try {
            const invoiceResponse = await invoiceService.getInvoice(invoiceId);
            if (invoiceResponse && invoiceResponse.invoice) {
              foundData = invoiceResponse.invoice;
              setInvoice(foundData);
            }
          } catch (invoiceError) {
            console.warn('Invoice fetch failed:', invoiceError);
          }
        }
        
        // If no invoice found, try finding by payment ID
        if (!foundData && paymentId) {
          foundData = await findInvoiceByPaymentId(paymentId);
          if (foundData) {
            setInvoice(foundData);
          }
        }
        
        setProgress(50);
        
        if (foundData) {
          // Initial status check
          const initialStatus = foundData.status?.toLowerCase();
          if (initialStatus === 'paid' || initialStatus === 'success') {
            setPaymentStatus('success');
            setProgress(100);
          } else if (initialStatus === 'failed') {
            setPaymentStatus('failed');
            setProgress(0);
          } else {
            setPaymentStatus('pending');
            setProgress(25);
            
            // Perform initial status check if we have transaction ID
            if (transactionId) {
              setTimeout(() => checkPaymentStatus(false), 2000);
            }
          }
        } else {
          throw new Error('Payment information not found');
        }
        
      } catch (error) {
        console.error('Error fetching payment data:', error);
        setError(error.message || 'Failed to load payment information');
        setProgress(0);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPaymentData();
  }, [paymentId, invoiceId, transactionId, checkPaymentStatus]);

  // Auto-polling for pending payments
  useEffect(() => {
    if (paymentStatus === 'pending' && !loading) {
      const pollInterval = setInterval(async () => {
        const completed = await checkPaymentStatus(false);
        if (completed) {
          clearInterval(pollInterval);
        }
      }, 10000); // Check every 10 seconds
      
      return () => clearInterval(pollInterval);
    }
  }, [paymentStatus, loading, checkPaymentStatus]);
  
  // Simulate finding invoice by payment ID
  // In a real implementation, this would be an API call
  const findInvoiceByPaymentId = async (paymentId) => {
    try {
      // This is a simplification - in reality you'd have an API endpoint to get payment info
      // For now we'll just fetch recent invoices and find one with matching payment ID
      const response = await invoiceService.getTenantInvoices();
      
      if (response && response.invoices) {
        return response.invoices.find(inv => 
          inv.midtrans_payment_id === paymentId || 
          (inv.payment && inv.payment.payment_id === parseInt(paymentId))
        );
      }
      return null;
    } catch (error) {
      console.error('Error finding invoice:', error);
      return null;
    }
  };
    // Check for payment status updates (kept for backward compatibility)
  const checkPaymentStatusLegacy = async () => {
    try {
      if (!invoice) return;
      
      const response = await invoiceService.getInvoice(invoice.invoice_id);
      
      if (response && response.invoice) {
        setInvoice(response.invoice);
        
        if (response.invoice.status === 'paid') {
          setPaymentStatus('success');
          toast({
            title: 'Payment Successful',
            description: 'Your payment has been processed successfully.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        } else if (response.invoice.status === 'failed') {
          setPaymentStatus('failed');
          toast({
            title: 'Payment Failed',
            description: 'There was an issue with your payment.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  // Download payment receipt
  const downloadReceipt = async () => {
    if (!payment?.payment_id) {
      toast({
        title: 'No Receipt Available',
        description: 'Receipt is not available for this payment.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setDownloadingReceipt(true);
      const blob = await paymentService.downloadReceipt(payment.payment_id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${payment.payment_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Receipt Downloaded',
        description: 'Your payment receipt has been downloaded.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download receipt. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setDownloadingReceipt(false);
    }
  };

  // Download invoice PDF
  const downloadInvoicePDF = async () => {
    if (!invoice?.invoice_id) {
      toast({
        title: 'No Invoice Available',
        description: 'Invoice is not available.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setDownloadingInvoice(true);
      const blob = await paymentService.downloadInvoicePDF(invoice.invoice_id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoice_no}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Invoice Downloaded',
        description: 'Your invoice has been downloaded.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download invoice. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setDownloadingInvoice(false);
    }
  };

  // Share payment details
  const handleShare = () => {
    const url = window.location.href;
    setShareUrl(url);
    
    if (navigator.share) {
      navigator.share({
        title: 'Payment Confirmation',
        text: `Payment confirmation for invoice ${invoice?.invoice_no}`,
        url: url,
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(url).then(() => {
        toast({
          title: 'Link Copied',
          description: 'Payment confirmation link copied to clipboard.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      });
    }
  };

  // Print confirmation
  const handlePrint = () => {
    window.print();
  };

  // Format share URL
  useEffect(() => {
    if (invoice) {
      const url = `${window.location.origin}/tenant/payment-confirmation/${paymentId}?transaction_id=${transactionId}`;
      setShareUrl(url);
    }
  }, [invoice, paymentId, transactionId]);

  // Enhanced loading state
  if (loading) {
    return (
      <TenantLayout>
        <Container maxW="container.md" py={8}>
          <Card borderRadius="lg" boxShadow="lg" p={8}>
            <VStack spacing={6} align="center">
              <Box position="relative">
                <Spinner size="xl" color="brand.500" thickness="4px" />
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                >
                  <Icon as={FaClock} boxSize={6} color="brand.500" />
                </Box>
              </Box>
              
              <VStack spacing={2} textAlign="center">
                <Heading size="lg">Checking Payment Status</Heading>
                <Text color="gray.600">
                  Please wait while we confirm your payment details...
                </Text>
              </VStack>
              
              {progress > 0 && (
                <Box width="100%" maxW="300px">
                  <Progress 
                    value={progress} 
                    size="sm" 
                    colorScheme="brand" 
                    borderRadius="full"
                    hasStripe
                    isAnimated
                  />
                  <Text fontSize="xs" textAlign="center" mt={1} color="gray.500">
                    {progress}% Complete
                  </Text>
                </Box>
              )}
            </VStack>
          </Card>
        </Container>
      </TenantLayout>
    );
  }

  // Enhanced error state
  if (error) {
    return (
      <TenantLayout>
        <Container maxW="container.md" py={8}>
          <VStack spacing={6}>
            <Alert status="error" borderRadius="lg" p={6}>
              <AlertIcon boxSize={8} />
              <Box>
                <AlertTitle fontSize="lg" mb={2}>Payment Error</AlertTitle>
                <AlertDescription fontSize="md">{error}</AlertDescription>
              </Box>
            </Alert>
            
            <HStack spacing={4}>
              <Button 
                leftIcon={<FaArrowLeft />} 
                onClick={() => navigate('/tenant/bookings')}
                variant="outline"
              >
                Back to Bookings
              </Button>
              <Button 
                leftIcon={<FaSync />} 
                onClick={() => window.location.reload()}
                colorScheme="brand"
              >
                Retry
              </Button>
            </HStack>
          </VStack>
        </Container>
      </TenantLayout>
    );
  }

    // Enhanced main content rendering
  return (
    <TenantLayout>
      <Container maxW="container.md" py={8}>
        {/* Main Status Card */}
        <Card 
          bg={getBgColor()}
          color={getTextColor()}
          borderRadius="xl"
          mb={6}
          p={8}
          boxShadow="xl"
          border="2px solid"
          borderColor={paymentStatus === 'success' ? 'green.200' : paymentStatus === 'failed' ? 'red.200' : 'yellow.200'}
        >
          <VStack spacing={6} align="center" textAlign="center">
            <Box position="relative">
              <Icon as={getStatusIcon()} boxSize={20} />
              {paymentStatus === 'pending' && (
                <Spinner
                  position="absolute"
                  top="-8px"
                  right="-8px"
                  size="md"
                  color="current"
                />
              )}
            </Box>
            
            <VStack spacing={3}>
              <Heading size="xl">{getStatusText()}</Heading>
              <Text fontSize="lg" maxW="400px">
                {getStatusDescription()}
              </Text>
              
              {paymentStatus === 'pending' && (
                <VStack spacing={2} mt={4}>
                  <HStack>
                    <Icon as={FaClock} />
                    <Text fontSize="sm">
                      Checking status... ({checkAttempts} attempts)
                    </Text>
                  </HStack>
                  
                  {lastChecked && (
                    <Text fontSize="xs" color="current" opacity={0.8}>
                      Last checked: {getTimeSinceLastCheck()}
                    </Text>
                  )}
                  
                  <Box width="200px" mt={2}>
                    <Progress 
                      value={progress} 
                      size="sm" 
                      colorScheme={paymentStatus === 'success' ? 'green' : 'yellow'} 
                      borderRadius="full"
                      hasStripe
                      isAnimated={paymentStatus === 'pending'}
                    />
                  </Box>
                </VStack>
              )}
            </VStack>
            
            {/* Action Buttons for Status */}
            {paymentStatus === 'pending' && (
              <HStack spacing={3} mt={4}>
                <Button
                  onClick={handleManualStatusCheck}
                  isLoading={refreshing}
                  loadingText="Checking..."
                  leftIcon={<FaSync />}
                  colorScheme="brand"
                  variant="solid"
                  bg="white"
                  color="brand.600"
                  _hover={{ bg: 'gray.50' }}
                >
                  Check Now
                </Button>
                
                <Tooltip label="Get help with payment issues">
                  <Button
                    leftIcon={<FaInfoCircle />}
                    variant="outline"
                    borderColor="current"
                    color="current"
                    _hover={{ bg: 'whiteAlpha.200' }}
                    onClick={() => navigate('/tenant/contact')}
                  >
                    Need Help?
                  </Button>
                </Tooltip>
              </HStack>
            )}
          </VStack>
        </Card>

        {/* Enhanced Payment Details */}
        {invoice && (
          <Card borderRadius="lg" boxShadow="md" mb={6} bg={cardBg}>
            <CardHeader pb={0}>
              <Flex justify="space-between" align="center">
                <Heading size="md">Payment Details</Heading>
                <HStack spacing={2}>
                  <Tooltip label="Share payment confirmation">
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<FaShare />}
                      onClick={handleShare}
                    >
                      Share
                    </Button>
                  </Tooltip>
                  <Tooltip label="Print confirmation">
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<FaPrint />}
                      onClick={handlePrint}
                    >
                      Print
                    </Button>
                  </Tooltip>
                </HStack>
              </Flex>
            </CardHeader>
            
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <VStack align="start" spacing={4}>
                  <Box>
                    <Text color="gray.500" fontSize="sm" mb={1}>Invoice Number</Text>
                    <HStack>
                      <Code colorScheme="brand" fontSize="md" p={2}>
                        {invoice.invoice_no}
                      </Code>
                      <Tooltip label="Copy invoice number">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(invoice.invoice_no);
                            toast({
                              title: 'Copied!',
                              description: 'Invoice number copied to clipboard',
                              status: 'success',
                              duration: 2000,
                            });
                          }}
                        >
                          Copy
                        </Button>
                      </Tooltip>
                    </HStack>
                  </Box>
                  
                  <Box>
                    <Text color="gray.500" fontSize="sm" mb={1}>Payment Method</Text>
                    <Badge colorScheme="blue" fontSize="sm" p={2}>
                      {invoice.payment_method || 'Online Payment'}
                    </Badge>
                  </Box>
                  
                  {transactionId && (
                    <Box>
                      <Text color="gray.500" fontSize="sm" mb={1}>Transaction ID</Text>
                      <Code fontSize="sm">{transactionId}</Code>
                    </Box>
                  )}
                </VStack>
                
                <VStack align="start" spacing={4}>
                  <Box>
                    <Text color="gray.500" fontSize="sm" mb={1}>Payment Date</Text>
                    <Text fontWeight="medium">
                      {invoice.paid_at && paymentStatus === 'success' 
                        ? formatDateTime(invoice.paid_at) 
                        : paymentStatus === 'pending' 
                          ? 'Processing...' 
                          : 'Not completed'}
                    </Text>
                  </Box>
                  
                  <Box>
                    <Text color="gray.500" fontSize="sm" mb={1}>Amount</Text>
                    <Text fontWeight="bold" fontSize="xl" color="brand.500">
                      {formatCurrency(invoice.amount)}
                    </Text>
                  </Box>
                  
                  <Box>
                    <Text color="gray.500" fontSize="sm" mb={1}>Status</Text>
                    <Badge 
                      colorScheme={paymentStatus === 'success' ? 'green' : paymentStatus === 'failed' ? 'red' : 'yellow'}
                      fontSize="sm"
                      p={2}
                    >
                      {getStatusText()}
                    </Badge>
                  </Box>
                </VStack>
              </SimpleGrid>
              
              <Divider my={6} />
              
              {/* Enhanced Booking Information */}
              {invoice.booking && (
                <Box>
                  <Text color="gray.500" fontSize="sm" mb={3}>Booking Information</Text>
                  <Card bg={highlightBg} p={4} borderRadius="md">
                    <HStack spacing={4} align="center">
                      <Icon as={FaCalendarAlt} color="brand.500" boxSize={8} />
                      <VStack align="start" spacing={1} flex="1">
                        <Text fontWeight="bold" fontSize="lg">
                          {invoice.booking.room?.name || 'Room Booking'}
                        </Text>
                        <Text color="gray.600">
                          {formatDate(invoice.booking.check_in)} - {formatDate(invoice.booking.check_out)}
                        </Text>
                        {invoice.booking.room?.room_type && (
                          <Badge colorScheme="purple" size="sm">
                            {invoice.booking.room.room_type}
                          </Badge>
                        )}
                      </VStack>
                      <VStack align="end" spacing={1}>
                        <Badge 
                          colorScheme={paymentStatus === 'success' ? 'green' : 'yellow'}
                          fontSize="md"
                          p={2}
                        >
                          {paymentStatus === 'success' ? 'Confirmed' : 'Pending Confirmation'}
                        </Badge>
                        {paymentStatus === 'success' && (
                          <HStack>
                            <Icon as={FaCheckCircle} color="green.500" />
                            <Text fontSize="sm" color="green.600">Ready for Check-in</Text>
                          </HStack>
                        )}
                      </VStack>
                    </HStack>
                  </Card>
                </Box>
              )}
            </CardBody>
          </Card>
        )}
        
        {/* Download Buttons - Only show if payment is successful */}
        {paymentStatus === 'success' && invoice && (
          <Card borderRadius="md" boxShadow="md" mb={6}>
            <CardHeader pb={0}>
              <Heading size="md">Download Documents</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Button
                  leftIcon={<FaDownload />}
                  colorScheme="blue"
                  variant="outline"
                  onClick={downloadInvoicePDF}
                  isLoading={downloadingInvoice}
                  loadingText="Downloading..."
                >
                  Download Invoice
                </Button>
                
                {payment?.payment_id && (
                  <Button
                    leftIcon={<FaReceipt />}
                    colorScheme="green"
                    variant="outline"
                    onClick={downloadReceipt}
                    isLoading={downloadingReceipt}
                    loadingText="Downloading..."
                  >
                    Download Receipt
                  </Button>
                )}
              </SimpleGrid>
            </CardBody>
          </Card>
        )}
        
        {/* Retry and Share section - Only show if payment has failed */}
        {paymentStatus === 'failed' && (
          <Card borderRadius="md" boxShadow="md" mb={6}>
            <CardHeader pb={0}>
              <Heading size="md">Payment Failed</Heading>
            </CardHeader>
            <CardBody>
              <Text color="red.500" fontWeight="medium" mb={4}>
                There was an issue processing your payment. Please try again.
              </Text>
              
              <Flex gap={4} justify="center">
                <Button
                  leftIcon={<FaSync />}
                  colorScheme="green"
                  onClick={handleRetryPayment}
                  isLoading={refreshing}
                  loadingText="Retrying..."
                >
                  Retry Payment
                </Button>
                
                <Button
                  leftIcon={<FaShare />}
                  colorScheme="blue"
                  onClick={onOpen}
                >
                  Share Payment Details
                </Button>
              </Flex>
            </CardBody>
          </Card>
        )}
        
        {/* Payment details modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Share Payment Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text>
                  You can share your payment details with others using the link below:
                </Text>
                
                <Code p={2} borderRadius="md" bg="gray.100" fontSize="sm">
                  {shareUrl}
                </Code>
                
                <Text fontSize="sm" color="gray.500">
                  * Link expires in 24 hours.
                </Text>
                
                <Divider />
                
                <Text fontWeight="medium">
                  Or share directly via:
                </Text>
                
                <HStack spacing={4}>
                  <Button
                    as="a"
                    href={`https://wa.me/?text=Check out my payment details for Invoice #${invoice?.invoice_no}%0A${shareUrl}`}
                    target="_blank"
                    leftIcon={<FaWhatsapp />}
                    colorScheme="green"
                    variant="outline"
                    flex={1}
                  >
                    WhatsApp
                  </Button>
                  
                  <Button
                    as="a"
                    href={`mailto:?subject=Payment Details for Invoice #${invoice?.invoice_no}&body=Check out my payment details: ${shareUrl}`}
                    target="_blank"
                    leftIcon={<FaEnvelope />}
                    colorScheme="blue"
                    variant="outline"
                    flex={1}
                  >
                    Email
                  </Button>
                </HStack>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        
        <Flex gap={4} justify="center"
          flexWrap="wrap"
        >
          <Button 
            leftIcon={<FaHome />} 
            onClick={() => navigate('/tenant')}
            variant="outline"
          >
            Home
          </Button>
          
          {invoice && (
            <>
              <Button
                leftIcon={<FaFileInvoice />}
                onClick={() => navigate(`/tenant/invoices/${invoice.invoice_id}`)}
                colorScheme="blue"
              >
                View Invoice
              </Button>
              
              {invoice.booking && (
                <Button
                  leftIcon={<FaCalendarAlt />}
                  onClick={() => navigate(`/tenant/bookings/${invoice.booking.booking_id}`)}
                  colorScheme="brand"
                >
                  View Booking
                </Button>
              )}
            </>
          )}
        </Flex>
      </Container>
    </TenantLayout>
  );
};

export default PaymentConfirmation;
