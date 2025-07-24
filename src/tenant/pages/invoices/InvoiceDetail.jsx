import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Divider,
  Badge,
  Spinner,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Image,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Icon,
  List,
  ListItem,
  ListIcon,
  Stat,
  StatLabel,
  StatNumber,
  Center,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  IconButton
} from '@chakra-ui/react';
import {
  FaFileInvoice,
  FaMoneyBill,
  FaCheck,
  FaTimes,
  FaClock,
  FaDownload,
  FaArrowLeft,
  FaExternalLinkAlt,
  FaUpload,
  FaHistory,
  FaInfoCircle,
  FaRegCheckCircle,
  FaRegTimesCircle,
  FaEye,
  FaExpand,
  FaCreditCard,
  FaUniversity,
  FaMobile,
  FaQrcode,
  FaShieldAlt,
  FaReceipt,
  FaBuilding
} from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import invoiceService from '../../services/invoiceService';
import paymentService from '../../services/paymentService';
import bookingService from '../../services/bookingService';
import tenantService from '../../services/tenantService';
import { formatCurrency, getStatusColor } from '../../components/helpers/typeConverters';
import { formatDate, formatDateTime } from '../../components/helpers/dateFormatter';

// Helper to display classification with proper labels
const getClassificationDisplay = (classification) => {
  if (!classification) return 'Unknown';
  
  // Map classification names to proper display labels
  const classificationMap = {
    'perempuan': 'Kamar Mahasiswi',
    'laki_laki': 'Kamar Mahasiswa', 
    'ruang_rapat': 'Ruang Rapat',
    'VIP': 'Kamar Non-Mahasiswa'
  };
  
  return classificationMap[classification.name] || classification.display_name || classification.name || 'Unknown';
};

// Helper to display tenant type
const getTenantTypeDisplay = (tenantType) => {
  if (!tenantType) return 'N/A';
  
  const typeMap = {
    'mahasiswa': 'Mahasiswa',
    'non_mahasiswa': 'Non-Mahasiswa',
    'pegawai': 'Pegawai'
  };
  
  return typeMap[tenantType.name] || tenantType.display_name || tenantType.name || 'N/A';
};

const InvoiceDetail = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [invoice, setInvoice] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProofImage, setSelectedProofImage] = useState(null);
  const [hasPendingManualPayment, setHasPendingManualPayment] = useState(false);
  const [pendingPayments, setPendingPayments] = useState([]);
  const { isOpen: isProofOpen, onOpen: onProofOpen, onClose: onProofClose } = useDisclosure();
  
  // Colors
  const bg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const paymentBg = useColorModeValue('green.50', 'green.900');
  const pendingBg = useColorModeValue('yellow.50', 'yellow.900');
  // Fetch invoice data
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        setLoading(true);
        
        // Get tenant information from auth context or localStorage
        const tenantData = JSON.parse(localStorage.getItem('tenant') || '{}');
        const tenantId = tenantData.tenantId || tenantData.tenant_id;
        
        if (!tenantId) {
          throw new Error('Tenant information not found');
        }
        
        // Use tenant-specific endpoint with includes
        const response = await invoiceService.getTenantInvoiceById(tenantId, invoiceId, {
          includePayments: true,
          includeItems: true,
          includeProofMetadata: true
        });
        
        if (!response || !response.invoice) {
          throw new Error('Invoice not found');
        }
        
        const invoiceData = response.invoice;
        
        // Map the response fields to match the expected structure
        const mappedInvoice = {
          ...invoiceData,
          invoice_no: invoiceData.invoiceNo || invoiceData.invoice_no,
          invoice_id: invoiceData.invoiceId || invoiceData.invoice_id,
          amount: invoiceData.totalAmount || invoiceData.amount,
          total_amount: invoiceData.totalAmount || invoiceData.amount,
          issued_at: invoiceData.createdAt || invoiceData.issued_at,
          due_date: invoiceData.dueDate || invoiceData.due_date,
          paid_at: invoiceData.paidAt || invoiceData.paid_at,
          booking_id: invoiceData.bookingId || invoiceData.booking_id,
          tenant_id: invoiceData.tenantId || invoiceData.tenant_id
        };
        
        setInvoice(mappedInvoice);
        
        // Fetch tenant payments WITH PROOF to get full payment proof data
        try {
          const paymentsResponse = await paymentService.getTenantPaymentsWithProof(tenantId, {
            includeProofMetadata: true,
            includeInvoiceDetails: true
          });
          
          if (paymentsResponse && paymentsResponse.payments) {
            // Filter payments for this invoice
            const invoicePayments = paymentsResponse.payments.filter(paymentData => 
              paymentData.payment.invoice_id === parseInt(invoiceId)
            );
              // Update invoice with full payment data including paymentProof
            if (invoicePayments.length > 0) {
              // Map the payment structure to match expected format
              const mappedPayments = invoicePayments.map(paymentData => ({
                paymentId: paymentData.payment.payment_id,
                amount: paymentData.payment.amount,
                status: paymentData.payment.status,
                paymentMethod: paymentData.payment.payment_method,
                paymentChannel: paymentData.payment.payment_channel,
                createdAt: paymentData.payment.created_at,
                updatedAt: paymentData.payment.updated_at,
                transactionId: paymentData.payment.transaction_id,
                // Map payment proof structure correctly for getTenantPaymentsWithProof API
                paymentProof: paymentData.payment_proof ? {
                  fileName: paymentData.payment_proof.file_name,
                  fileType: paymentData.payment_proof.file_type,
                  imageContent: paymentData.payment_proof.base64_content, // From getTenantPaymentsWithProof
                  uploadedAt: paymentData.payment_proof.uploaded_at
                } : null
              }));
              
              const updatedInvoice = {
                ...mappedInvoice,
                payments: mappedPayments
              };
              setInvoice(updatedInvoice);
              console.log('Updated invoice with payments (with proof):', updatedInvoice);
              
              // Check for pending manual payments
              const pendingManualPayments = mappedPayments.filter(payment => 
                payment.status === 'pending' && payment.paymentMethod === 'manual'
              );
              
              if (pendingManualPayments.length > 0) {
                setHasPendingManualPayment(true);
                setPendingPayments(pendingManualPayments);
                console.log('Found pending manual payments:', pendingManualPayments);
              }
            }
          }
        } catch (error) {
          console.warn('Could not fetch tenant payments with proof:', error);
          // FALLBACK: Try to get individual payment details with direct API call
          try {
            if (mappedInvoice.payments && mappedInvoice.payments.length > 0) {
              console.log('Attempting fallback: fetching individual payment details...');
              const enhancedPayments = await Promise.all(
                mappedInvoice.payments.map(async (payment) => {
                  try {
                    // Get individual payment details using the direct payment API
                    const paymentData = await paymentService.getPayment(payment.paymentId);
                    
                    console.log(`Payment ${payment.paymentId} details:`, paymentData);
                    
                    // Use the direct API structure which matches your example
                    return {
                      ...payment,
                      paymentProof: paymentData.payment.paymentProof ? {
                        fileName: paymentData.payment.paymentProof.fileName,
                        fileType: paymentData.payment.paymentProof.fileType,
                        imageContent: paymentData.payment.paymentProof.imageContent, // Direct from payment API
                        uploadedAt: paymentData.payment.paymentProof.uploadedAt
                      } : null
                    };
                    return payment; // Return original if API call fails
                  } catch (err) {
                    console.warn(`Failed to fetch details for payment ${payment.paymentId}:`, err);
                    return payment; // Return original if API call fails
                  }
                })
              );
              
              const updatedInvoiceWithFallback = {
                ...mappedInvoice,
                payments: enhancedPayments
              };
              setInvoice(updatedInvoiceWithFallback);
              console.log('Updated invoice with fallback payment details:', updatedInvoiceWithFallback);
            }
          } catch (fallbackError) {
            console.warn('Fallback payment details fetch also failed:', fallbackError);
          }
        }
        
        // Fetch related booking data if booking_id exists
        if (mappedInvoice.booking_id || mappedInvoice.bookingId) {
          try {
            const bookingData = await bookingService.getBooking(mappedInvoice.booking_id || mappedInvoice.bookingId);
            console.log('Booking data:', bookingData);
            setBooking(bookingData.booking || bookingData);
              
            // Enhanced tenant information fetching with smart caching
            if (tenantId && bookingData.booking) {
              try {
                const tenantData = await tenantService.getTenantById(tenantId);
                console.log('Tenant data:', tenantData);
                  
                // Merge comprehensive tenant data
                setBooking({
                  ...bookingData.booking,
                  tenant: {
                    ...bookingData.booking.tenant,
                    ...tenantData.tenant,
                    // Ensure proper name resolution
                    name: tenantData.tenant?.user?.full_name || 
                          tenantData.tenant?.name || 
                          bookingData.booking.tenant?.name ||
                          'Unknown Tenant',
                    // Additional tenant metadata for enhanced display
                    displayName: tenantData.tenant?.user?.full_name || 
                               tenantData.tenant?.name ||
                               'Tenant',
                    email: tenantData.tenant?.user?.email || 
                           tenantData.tenant?.email ||
                           bookingData.booking.tenant?.email,
                    phone: tenantData.tenant?.phone || 
                           bookingData.booking.tenant?.phone,
                    nim: tenantData.tenant?.nim,
                    address: tenantData.tenant?.address,
                    tenant_type: tenantData.tenant?.tenant_type || 
                               tenantData.tenant?.type,
                    // Cache timestamp for future optimization
                    _fetchedAt: new Date().toISOString()
                  }
                });
              } catch (tenantError) {
                console.warn('Tenant fetch error:', tenantError);
                setBooking(bookingData.booking);
              }
            } else {
              setBooking(bookingData.booking);
            }
          } catch (error) {
            console.warn('Could not fetch booking details:', error);
          }
        }
        
        // Check for pending manual payments for this invoice
        await checkPendingManualPayments(mappedInvoice.invoice_id || mappedInvoice.invoiceId, tenantId);
      } catch (error) {
        console.error('Error fetching invoice details:', error);
        setError(error.message || 'Failed to load invoice details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvoiceData();  }, [invoiceId]);
  
  // Handle payment
  const handlePayment = () => {
    if (invoice.payment_link_url) {
      // Open payment URL in new tab if available
      window.open(invoice.payment_link_url, '_blank');
    } else if (invoice.method_id === 2) { // Manual payment method
      navigate(`/tenant/invoices/${invoiceId}/manual-payment`);
    } else {
      toast({
        title: 'Payment Method Not Available',
        description: 'Please contact administrator for payment assistance',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    let color = 'gray';
    let icon = FaClock;
    let text = 'Unknown';
    
    switch (status?.toLowerCase()) {
      case 'paid':
        color = 'green';
        icon = FaCheck;
        text = 'Paid';
        break;
      case 'pending':
        color = 'yellow';
        icon = FaClock;
        text = 'Pending';
        break;
      case 'failed':
        color = 'red';
        icon = FaTimes;
        text = 'Failed';
        break;
      case 'waiting_approval':
        color = 'orange';
        icon = FaClock;
        text = 'Waiting Approval';
        break;
      default:
        break;
    }
    
    return (
      <Badge 
        colorScheme={color} 
        display="flex" 
        alignItems="center" 
        px={2} 
        py={1} 
        borderRadius="md"
      >
        <Icon as={icon} mr={1} boxSize={3} />
        {text}
      </Badge>
    );
  };
  
  // Handle go back
  const handleGoBack = () => {
    navigate('/tenant/invoices');
  };
  // Function to view payment proof from imageContent
  const viewPaymentProof = async (payment) => {
    console.log('=== Viewing payment proof ===');
    console.log('Payment object:', payment);
    console.log('Payment proof object:', payment.paymentProof);
    
    try {
      if (payment.paymentProof && payment.paymentProof.imageContent) {
        // Convert base64 image content to displayable format
        const imageData = payment.paymentProof.imageContent;
        const fileType = payment.paymentProof.fileType || 'image/png';
        
        console.log('Found image content, file type:', fileType);
        console.log('Image data length:', imageData ? imageData.length : 'null');
        
        // Create data URL from base64 content
        const imageUrl = `data:${fileType};base64,${imageData}`;
        
        setSelectedProofImage({
          src: imageUrl,
          fileName: payment.paymentProof.fileName || 'payment_proof.png',
          payment: payment
        });
        onProofOpen();
      } else {
        // FALLBACK: Try to fetch individual payment details if no imageContent
        console.log('No imageContent found, trying fallback API call...');
        try {
          const paymentData = await paymentService.getPayment(payment.paymentId);
          console.log('Fallback payment data:', paymentData);
          
          if (paymentData.payment.paymentProof && paymentData.payment.paymentProof.imageContent) {
            const imageData = paymentData.payment.paymentProof.imageContent;
            const fileType = paymentData.payment.paymentProof.fileType || 'image/png';
            
            console.log('Found imageContent in fallback data');
            
            const imageUrl = `data:${fileType};base64,${imageData}`;
            
            setSelectedProofImage({
              src: imageUrl,
              fileName: paymentData.payment.paymentProof.fileName || 'payment_proof.png',
              payment: payment
            });
            onProofOpen();
            return; // Success with fallback
          }
        } catch (fallbackError) {
          console.warn('Fallback API call failed:', fallbackError);
        }
        
        // No image content available
        console.warn('No payment proof image content available for payment:', payment.paymentId);
        console.warn('Available paymentProof properties:', payment.paymentProof ? Object.keys(payment.paymentProof) : 'null');
        
        toast({
          title: 'Payment proof not available',
          description: 'No payment proof image is attached to this payment.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error loading payment proof:', error);
      toast({
        title: 'Error loading payment proof',
        description: 'Failed to display the payment proof image.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }  };

  // Function to get payment method details
  const getPaymentMethodDetails = () => {
    // Check if there are any successful payments for this invoice
    const successfulPayments = invoice.payments?.filter(p => p.status === 'paid' || p.status === 'completed') || [];
    
    // If there's a midtrans payment ID, it was paid via Midtrans
    if (invoice.midtransPaymentId) {
      return {
        method: 'Midtrans Payment Gateway',
        icon: FaCreditCard,
        color: 'blue',
        details: `Transaction ID: ${invoice.midtransPaymentId}`,
        type: 'digital'
      };
    }
      // Check if there are successful payments with payment method info
    if (successfulPayments.length > 0) {
      const payment = successfulPayments[0];
      
      // IMPORTANT: Check for manual payment by looking for paymentProof first
      // Manual payments may have paymentMethod = "midtrans" but include paymentProof
      if (payment.paymentProof && (payment.paymentProof.fileName || payment.paymentProof.fileUrl)) {
        return {
          method: 'Manual Bank Transfer',
          icon: FaUniversity,
          color: 'orange',
          details: 'Verified by administrator',
          type: 'manual'
        };
      }
      
      if (payment.paymentMethod === 'midtrans' || payment.paymentChannel) {const channelMap = {
          'credit_card': { name: 'Credit Card', icon: FaCreditCard, color: 'blue' },
          'bank_transfer': { name: 'Bank Transfer', icon: FaUniversity, color: 'green' },
          'echannel': { name: 'E-Channel', icon: FaBuilding, color: 'purple' },
          'bca_va': { name: 'BCA Virtual Account', icon: FaUniversity, color: 'blue' },
          'bni_va': { name: 'BNI Virtual Account', icon: FaUniversity, color: 'orange' },
          'bri_va': { name: 'BRI Virtual Account', icon: FaUniversity, color: 'red' },
          'permata_va': { name: 'Permata Virtual Account', icon: FaUniversity, color: 'gray' },
          'other_va': { name: 'Virtual Account', icon: FaUniversity, color: 'gray' },
          'gopay': { name: 'GoPay', icon: FaMobile, color: 'green' },
          'qris': { name: 'QRIS', icon: FaQrcode, color: 'purple' }
        };
        
        const channelInfo = channelMap[payment.paymentChannel] || channelMap['bank_transfer'];
        
        return {
          method: `Midtrans - ${channelInfo.name}`,
          icon: channelInfo.icon,
          color: channelInfo.color,
          details: payment.transactionId ? `Transaction ID: ${payment.transactionId}` : '',
          type: 'digital'
        };
      }
        if (payment.paymentMethod === 'manual') {
        return {
          method: 'Manual Bank Transfer',
          icon: FaUniversity,
          color: 'orange',
          details: 'Verified by administrator',
          type: 'manual'
        };
      }
    }
      // Default fallback
    return {
      method: 'Bank Transfer',
      icon: FaUniversity,
      color: 'gray',
      details: 'Payment method not specified',
      type: 'unknown'
    };
  };

  // Check for pending manual payments
  const checkPendingManualPayments = async (invoiceId, tenantId) => {
    try {
      const result = await paymentService.checkPendingManualPayments(invoiceId, tenantId);
      
      if (result.hasPendingPayments) {
        setHasPendingManualPayment(true);
        setPendingPayments(result.pendingPayments);
        console.log('Found pending manual payments for invoice:', result.pendingPayments);
      } else {
        setHasPendingManualPayment(false);
        setPendingPayments([]);
      }
    } catch (error) {
      console.error('Error checking pending manual payments:', error);
      // Don't block the UI if check fails
      setHasPendingManualPayment(false);
      setPendingPayments([]);
    }
  };

  if (loading) {
    return (
      <TenantLayout>
        <Container maxW="container.lg" py={8}>
          <Flex justify="center" align="center" minH="60vh">
            <Spinner size="xl" color="brand.500" thickness="4px" />
          </Flex>
        </Container>
      </TenantLayout>
    );
  }

  if (error) {
    return (
      <TenantLayout>
        <Container maxW="container.lg" py={8}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
          <Button mt={4} onClick={() => navigate('/tenant/invoices')}>
            Back to Invoices
          </Button>
        </Container>
      </TenantLayout>
    );
  }

  const isPaid = invoice.status?.toLowerCase() === 'paid';
  const isPending = invoice.status?.toLowerCase() === 'pending';
  const isWaitingApproval = invoice.status?.toLowerCase() === 'waiting_approval';

  return (
    <TenantLayout>
      <Container maxW="container.lg" py={8}>
        <Button leftIcon={<FaArrowLeft />} mb={6} onClick={handleGoBack}>
          Back to Invoices
        </Button>
        
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8} templateColumns={{ base: '1fr', lg: '2fr 1fr' }}>
          {/* Main Invoice Content */}
          <Box gridColumn={{ base: 'span 1', lg: 'span 2' }}>
            <VStack spacing={6} align="stretch">
              <Flex 
                justify="space-between" 
                align={{ base: 'flex-start', md: 'center' }} 
                direction={{ base: 'column', md: 'row' }}
                gap={{ base: 4, md: 0 }}
              >                <Box>
                  <Heading as="h1" size="xl" display="flex" alignItems="center">
                    <Icon as={FaFileInvoice} mr={3} color="brand.500" />
                    Invoice #{invoice.invoice_no || 'Unknown'}
                  </Heading>
                  <Text color="gray.500" mt={1}>
                    Issued on {invoice.issued_at || invoice.createdAt ? 
                      formatDate(invoice.issued_at || invoice.createdAt) : 'N/A'}
                  </Text>
                </Box>
                
                {getStatusBadge(invoice.status)}
              </Flex>
              
              {/* Invoice Status Message */}
              {isPaid && (
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  Payment completed. Your booking is confirmed.
                </Alert>
              )}
              
              {isWaitingApproval && (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  Your payment receipt has been uploaded and is awaiting verification.
                </Alert>
              )}
              
              {isPending && (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  Payment is required to confirm your booking.
                </Alert>
              )}
                {/* Invoice Details */}
              <Card bg={bg} borderWidth="1px" borderColor={borderColor} borderRadius="md">
                <CardHeader pb={0}>
                  <Heading size="md">Invoice Details</Heading>
                </CardHeader>
                <CardBody>                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box>
                      <Text fontWeight="medium" color="gray.500">Bill To</Text>
                      <VStack align="start" spacing={2} mt={2}>
                        <Box>
                          <Text fontWeight="semibold" fontSize="lg">
                            {invoice.tenant?.user?.fullName || booking?.tenant?.name || 'Tenant'}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {invoice.tenant?.tenantType?.name || 'Student'}
                          </Text>
                        </Box>
                        
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Icon as={FaInfoCircle} color="gray.400" boxSize={3} />
                            <Text fontSize="sm">
                              {invoice.tenant?.user?.email || booking?.tenant?.email || 'No email'}
                            </Text>
                          </HStack>
                          <HStack>
                            <Icon as={FaInfoCircle} color="gray.400" boxSize={3} />
                            <Text fontSize="sm">
                              {invoice.tenant?.phone || booking?.tenant?.phone || 'No phone'}
                            </Text>
                          </HStack>
                          {invoice.tenant?.nim && (
                            <HStack>
                              <Icon as={FaInfoCircle} color="gray.400" boxSize={3} />
                              <Text fontSize="sm">NIM: {invoice.tenant.nim}</Text>
                            </HStack>
                          )}
                          {invoice.tenant?.address && (
                            <HStack align="start">
                              <Icon as={FaInfoCircle} color="gray.400" boxSize={3} mt="2px" />
                              <Text fontSize="sm">{invoice.tenant.address}</Text>
                            </HStack>
                          )}
                        </VStack>
                      </VStack>
                    </Box>
                    
                    <Box>
                      <List spacing={3}>
                        <ListItem display="flex" justifyContent="space-between">
                          <Text color="gray.500">Invoice Number:</Text>
                          <Text fontWeight="medium">{invoice.invoice_no || 'N/A'}</Text>
                        </ListItem>                        <ListItem display="flex" justifyContent="space-between">
                          <Text color="gray.500">Payment Method:</Text>
                          <HStack>
                            <Icon as={getPaymentMethodDetails().icon} color={`${getPaymentMethodDetails().color}.500`} />
                            <Text fontWeight="medium">{getPaymentMethodDetails().method}</Text>
                          </HStack>
                        </ListItem>
                        <ListItem display="flex" justifyContent="space-between">
                          <Text color="gray.500">Due Date:</Text>
                          <Text fontWeight="medium">
                            {invoice.due_date ? formatDate(invoice.due_date) : 'N/A'}
                          </Text>
                        </ListItem>
                        <ListItem display="flex" justifyContent="space-between">
                          <Text color="gray.500">Issue Date:</Text>
                          <Text fontWeight="medium">
                            {invoice.issued_at || invoice.createdAt ? 
                              formatDate(invoice.issued_at || invoice.createdAt) : 'N/A'}
                          </Text>
                        </ListItem>
                        {isPaid && (
                          <ListItem display="flex" justifyContent="space-between">
                            <Text color="gray.500">Paid On:</Text>
                            <Text fontWeight="medium">
                              {invoice.paid_at ? formatDate(invoice.paid_at) : 'N/A'}
                            </Text>
                          </ListItem>
                        )}
                      </List>
                    </Box>
                  </SimpleGrid>                </CardBody>
              </Card>
              
              {/* Enhanced Payment Information */}
              {isPaid && (
                <Card bg={paymentBg} borderWidth="1px" borderColor="green.200" borderRadius="md">
                  <CardHeader pb={2}>
                    <HStack>
                      <Icon as={FaShieldAlt} color="green.500" />
                      <Heading size="md" color="green.700">Payment Information</Heading>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <VStack align="start" spacing={3}>
                        <Box>
                          <Text fontSize="sm" color="green.600" fontWeight="semibold">Payment Method</Text>
                          <HStack>
                            <Icon as={getPaymentMethodDetails().icon} color={`${getPaymentMethodDetails().color}.500`} />
                            <Text fontWeight="medium">{getPaymentMethodDetails().method}</Text>
                          </HStack>
                        </Box>
                        
                        {getPaymentMethodDetails().details && (
                          <Box>
                            <Text fontSize="sm" color="green.600" fontWeight="semibold">Transaction Details</Text>
                            <Text fontSize="sm">{getPaymentMethodDetails().details}</Text>
                          </Box>
                        )}
                        
                        {invoice.notes && (
                          <Box>
                            <Text fontSize="sm" color="green.600" fontWeight="semibold">Payment Notes</Text>
                            <Text fontSize="sm">{invoice.notes}</Text>
                          </Box>
                        )}
                      </VStack>
                      
                      <VStack align="start" spacing={3}>
                        <Box>
                          <Text fontSize="sm" color="green.600" fontWeight="semibold">Payment Status</Text>
                          <HStack>
                            <Icon as={FaCheck} color="green.500" />
                            <Text fontWeight="medium" color="green.700">Payment Completed</Text>
                          </HStack>
                        </Box>
                        
                        <Box>
                          <Text fontSize="sm" color="green.600" fontWeight="semibold">Paid Amount</Text>
                          <Text fontWeight="bold" fontSize="lg" color="green.700">
                            {formatCurrency(invoice.amount || invoice.total_amount || 0)}
                          </Text>
                        </Box>
                        
                        <Box>
                          <Text fontSize="sm" color="green.600" fontWeight="semibold">Payment Date</Text>
                          <Text fontWeight="medium">
                            {invoice.paid_at ? formatDateTime(invoice.paid_at) : 'N/A'}
                          </Text>
                        </Box>
                      </VStack>
                    </SimpleGrid>
                    
                    {/* Show successful payments if available */}
                    {invoice.payments && invoice.payments.length > 0 && (
                      <Box mt={4}>
                        <Divider mb={4} />
                        <Text fontSize="sm" color="green.600" fontWeight="semibold" mb={3}>Payment History</Text>
                        {invoice.payments.filter(p => p.status === 'paid' || p.status === 'completed').map((payment, index) => (
                          <Card key={index} variant="outline" size="sm" mb={2}>
                            <CardBody>
                              <HStack justify="space-between">
                                <VStack align="start" spacing={1}>
                                  <HStack>
                                    <Icon as={FaReceipt} color="blue.500" boxSize={3} />
                                    <Text fontSize="sm" fontWeight="medium">
                                      Payment #{payment.paymentId}
                                    </Text>
                                    {getStatusBadge(payment.status)}
                                  </HStack>
                                  <Text fontSize="xs" color="gray.600">
                                    {payment.paymentDate ? formatDateTime(payment.paymentDate) : 'Date not available'}
                                  </Text>
                                  {payment.transactionId && (
                                    <Text fontSize="xs" color="gray.600">
                                      Transaction: {payment.transactionId}
                                    </Text>
                                  )}
                                </VStack>
                                <VStack align="end" spacing={1}>
                                  <Text fontWeight="bold" color="green.600">
                                    {formatCurrency(payment.amount)}
                                  </Text>
                                  {payment.paymentProof && (
                                    <Button size="xs" variant="outline" onClick={() => viewPaymentProof(payment)}>
                                      <Icon as={FaEye} mr={1} />
                                      View Proof
                                    </Button>
                                  )}
                                </VStack>
                              </HStack>
                            </CardBody>
                          </Card>
                        ))}
                      </Box>
                    )}
                  </CardBody>
                </Card>              )}
                
                {/* ENHANCED BOOKING SUMMARY - Replacing old booking details */}
                {(booking || invoice.booking) && (
                  <EnhancedBookingSummary 
                    booking={booking} 
                    invoice={invoice} 
                    bg={bg} 
                    borderColor={borderColor} 
                  />
                )}
                
                {/* Detailed Invoice Items */}
                {(booking || invoice.booking) && (
                <Card bg={bg} borderWidth="1px" borderColor={borderColor} borderRadius="md" mt={6}>
                  <CardHeader pb={2}>
                    <HStack>
                      <Icon as={FaReceipt} color="green.500" />
                      <Heading size="md">Invoice Breakdown</Heading>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <Divider mb={4} />
                    
                    {/* Invoice Items */}
                    <Box mb={4}>
                      <Text fontSize="sm" color="gray.600" fontWeight="semibold" mb={3}>Invoice Items</Text>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Description</Th>
                            <Th isNumeric>Quantity</Th>
                            <Th isNumeric>Unit Price</Th>
                            <Th isNumeric>Total</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {invoice.items && invoice.items.length > 0 ? (
                            invoice.items.map((item, index) => (
                              <Tr key={index}>
                                <Td>
                                  <Text fontWeight="medium">{item.description}</Text>
                                  {item.periodStart && item.periodEnd && (
                                    <Text fontSize="xs" color="gray.500">
                                      Period: {formatDate(item.periodStart)} - {formatDate(item.periodEnd)}
                                    </Text>
                                  )}
                                </Td>
                                <Td isNumeric>{item.quantity}</Td>
                                <Td isNumeric>{formatCurrency(item.unitPrice)}</Td>
                                <Td isNumeric fontWeight="medium">{formatCurrency(item.total)}</Td>
                              </Tr>
                            ))
                          ) : (
                            <Tr>
                              <Td>
                                <Text fontWeight="medium">
                                  {booking?.room?.name || invoice.booking?.room?.name || 'Room Rental'}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  {booking?.checkInDate && booking?.checkOutDate ? 
                                    `${formatDate(booking.checkInDate)} - ${formatDate(booking.checkOutDate)}` :
                                    invoice.booking?.checkInDate && invoice.booking?.checkOutDate ?
                                    `${formatDate(invoice.booking.checkInDate)} - ${formatDate(invoice.booking.checkOutDate)}` :
                                    'Service period'
                                  }
                                </Text>
                              </Td>
                              <Td isNumeric>1</Td>
                              <Td isNumeric>{formatCurrency(booking?.room?.rate || invoice.booking?.room?.rate || invoice.amount || 0)}</Td>
                              <Td isNumeric fontWeight="medium">
                                {formatCurrency(booking?.totalAmount || invoice.booking?.totalAmount || invoice.amount || invoice.total_amount || 0)}
                              </Td>
                            </Tr>
                          )}
                        </Tbody>
                      </Table>
                    </Box>
                      <Divider mb={4} />
                    
                    <Flex justify="flex-end">
                      <Box textAlign="right">
                        <Text color="gray.500" fontSize="sm">Total Amount</Text>
                        <Text fontWeight="bold" fontSize="2xl" color="brand.500">
                          {formatCurrency(invoice.amount || invoice.total_amount || 0)}
                        </Text>
                      </Box>
                    </Flex>
                  </CardBody>
                </Card>
              )}
              
              {/* Payment History */}
              {invoice.payments && invoice.payments.length > 0 && (
                <Card bg={bg} borderWidth="1px" borderColor={borderColor} borderRadius="md">
                  <CardHeader pb={0}>
                    <Heading size="md">Payment History</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {invoice.payments.map((payment, index) => (
                        <Box 
                          key={payment.id || index} 
                          p={4} 
                          borderWidth="1px" 
                          borderColor={borderColor} 
                          borderRadius="md"
                          bg={payment.status === 'verified' ? paymentBg : pendingBg}
                        >
                          <Flex justify="space-between" align="start" mb={3}>
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="bold">Payment #{payment.id}</Text>
                              <Text fontSize="sm" color="gray.600">
                                {payment.payment_method === 'manual' ? 'Manual Transfer' : 'Automatic Payment'}
                              </Text>
                              <Text fontSize="sm" color="gray.500">
                                Submitted: {formatDateTime(payment.created_at || payment.createdAt)}
                              </Text>
                              {payment.verified_at && (
                                <Text fontSize="sm" color="gray.500">
                                  Verified: {formatDateTime(payment.verified_at)}
                                </Text>
                              )}
                            </VStack>
                            <VStack align="end" spacing={1}>
                              <Badge 
                                colorScheme={payment.status === 'verified' ? 'green' : payment.status === 'pending' ? 'yellow' : 'red'}
                                fontSize="sm"
                                p={2}
                              >
                                {payment.status?.toUpperCase()}
                              </Badge>
                              <Text fontWeight="bold" fontSize="lg">
                                {formatCurrency(payment.amount)}
                              </Text>
                            </VStack>
                          </Flex>
                          
                          {payment.payment_method === 'manual' && payment.bank_name && (
                            <Box mt={3} p={3} bg="white" borderRadius="md" fontSize="sm">
                              <SimpleGrid columns={2} spacing={2}>
                                <Text><strong>Bank:</strong> {payment.bank_name}</Text>
                                <Text><strong>Account:</strong> {payment.account_number || 'N/A'}</Text>
                                <Text><strong>Holder:</strong> {payment.account_holder_name || 'N/A'}</Text>
                                <Text><strong>Transfer Date:</strong> {payment.transfer_date ? formatDate(payment.transfer_date) : 'N/A'}</Text>
                              </SimpleGrid>
                              {payment.notes && (
                                <Text mt={2}><strong>Notes:</strong> {payment.notes}</Text>
                              )}
                            </Box>
                          )}                          {/* Payment Proof Image */}
                          {payment.paymentProof && (
                            <Box mt={3}>
                              <Text fontWeight="medium" mb={2}>Payment Proof:</Text>
                              <HStack spacing={3}>
                                <Button
                                  size="sm"
                                  leftIcon={<FaEye />}
                                  onClick={() => viewPaymentProof(payment)}
                                  colorScheme="blue"
                                  variant="outline"
                                >
                                  View Proof
                                </Button>
                                {payment.paymentProof.fileName && (
                                  <Text fontSize="sm" color="gray.600">
                                    {payment.paymentProof.fileName}
                                  </Text>
                                )}
                                {payment.paymentProof.uploadedAt && (
                                  <Text fontSize="xs" color="gray.500">
                                    Uploaded: {formatDateTime(payment.paymentProof.uploadedAt)}
                                  </Text>
                                )}
                              </HStack>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </VStack>
                  </CardBody>                </Card>
              )}
            </VStack>
          </Box>
            {/* Sidebar - Payment Actions */}
          {!hasPendingManualPayment && (
            <Box>
              <Card 
                bg={isPaid ? paymentBg : isPending ? pendingBg : bg}
                borderWidth="1px" 
                borderColor={borderColor} 
                borderRadius="md"
                position={{ base: 'relative', lg: 'sticky' }}
                top={{ base: 'auto', lg: '100px' }}
              >
                <CardBody>
                  <VStack spacing={5} align="stretch">
                    <Flex align="center" gap={3}>
                      <Icon 
                        as={isPaid ? FaRegCheckCircle : FaRegTimesCircle} 
                        boxSize={6}
                        color={isPaid ? 'green.500' : 'orange.500'}
                      />
                      <Box>
                        <Text fontWeight="bold">
                          {isPaid ? 'Payment Completed' : 'Payment Required'}
                        </Text>
                        <Text fontSize="sm">
                          {isPaid 
                            ? 'Thank you for your payment' 
                            : isWaitingApproval 
                              ? 'Your payment is being verified'
                              : 'Please complete the payment'
                          }
                        </Text>
                      </Box>
                    </Flex>
                    
                    <Divider />
                      <Stat>
                      <StatLabel>Total Amount</StatLabel>
                      <StatNumber color={isPaid ? 'green.500' : 'brand.500'}>
                        {formatCurrency(invoice.amount || invoice.total_amount || 0)}
                      </StatNumber>
                    </Stat>
                    
                    {!isPaid && !isWaitingApproval && (
                      <>
                        <Button
                          colorScheme="brand"
                          size="lg"
                          onClick={handlePayment}
                          leftIcon={<FaMoneyBill />}
                          w="100%"
                        >
                          Pay Now
                        </Button>
                        
                        {invoice.method_id !== 2 && invoice.payment_link_url && (
                          <Button
                            as="a"
                            href={invoice.payment_link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            rightIcon={<FaExternalLinkAlt />}
                            variant="outline"
                            w="100%"
                          >
                            Open Payment Page
                          </Button>
                        )}
                        
                        {invoice.method_id === 2 && (
                          <Button
                            as={RouterLink}
                            to={`/tenant/invoices/${invoiceId}/manual-payment`}
                            rightIcon={<FaUpload />}
                            variant="outline"
                            w="100%"
                            colorScheme="blue"
                          >
                            Upload Payment Receipt
                          </Button>
                        )}
                      </>
                    )}
                    
                    {isWaitingApproval && (
                      <Flex align="center" px={4} py={3} bg="orange.100" borderRadius="md">
                        <Icon as={FaInfoCircle} color="orange.500" mr={2} />
                        <Text fontSize="sm">
                          Your payment receipt is being verified. This usually takes 1-2 business days.
                        </Text>
                      </Flex>
                    )}
                    
                    {isPaid && (
                      <>
                        <Button
                          variant="outline"
                          colorScheme="green"
                          leftIcon={<FaCheck />}
                          isDisabled
                          w="100%"
                        >
                          Paid on {formatDate(invoice.paid_at)}
                        </Button>
                        
                        {booking && (
                          <Button
                            as={RouterLink}
                            to={`/tenant/bookings/${booking.booking_id}`}
                            variant="solid"
                            colorScheme="brand"
                            w="100%"
                          >
                            View Booking
                          </Button>
                        )}
                      </>
                    )}
                    
                    <Divider />
                    
                    <Box fontSize="sm">
                      <Heading size="xs" mb={2}>Need help?</Heading>
                      <Text>
                        If you have any questions about your invoice or payment, please contact our support team
                        at <Text as="span" fontWeight="bold">support@rusunawa.ac.id</Text>.
                      </Text>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            </Box>
          )}

          {/* Pending Manual Payment Info */}
          {hasPendingManualPayment && (
            <Box>
              <Card 
                bg="orange.50"
                borderWidth="2px" 
                borderColor="orange.200" 
                borderRadius="md"
                position={{ base: 'relative', lg: 'sticky' }}
                top={{ base: 'auto', lg: '100px' }}
              >
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Flex align="center" gap={3}>
                      <Icon 
                        as={FaClock} 
                        boxSize={6}
                        color="orange.500"
                      />
                      <Box>
                        <Text fontWeight="bold" color="orange.700">
                          Payment Submitted
                        </Text>
                        <Text fontSize="sm" color="orange.600">
                          Your manual payment is being verified
                        </Text>
                      </Box>
                    </Flex>
                    
                    <Divider />
                    
                    <Stat>
                      <StatLabel>Total Amount</StatLabel>
                      <StatNumber color="orange.600">
                        {formatCurrency(invoice.amount || invoice.total_amount || 0)}
                      </StatNumber>
                    </Stat>
                    
                    <Alert status="warning" borderRadius="md" size="sm">
                      <AlertIcon />
                      <Box>
                        <Text fontSize="sm" fontWeight="medium">
                          Manual payment verification in progress
                        </Text>
                        <Text fontSize="xs" mt={1}>
                          You have {pendingPayments.length} pending payment{pendingPayments.length !== 1 ? 's' : ''} for this invoice. 
                          Please wait for verification before submitting another payment.
                        </Text>
                      </Box>
                    </Alert>
                    
                    {pendingPayments.length > 0 && (
                      <VStack spacing={2} align="stretch">
                        {pendingPayments.slice(0, 2).map((payment, index) => (
                          <Box key={payment.paymentId} p={3} bg="white" borderRadius="md" border="1px" borderColor="orange.200">
                            <Text fontSize="sm" fontWeight="medium">
                              Payment #{payment.paymentId}
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              Amount: {formatCurrency(payment.amount)}
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              Submitted: {formatDate(payment.createdAt)}
                            </Text>
                            {payment.paymentProof && (
                              <Button
                                size="xs"
                                mt={2}
                                leftIcon={<FaEye />}
                                onClick={() => viewPaymentProof(payment)}
                                colorScheme="orange"
                                variant="outline"
                              >
                                View Proof
                              </Button>
                            )}
                          </Box>
                        ))}
                        {pendingPayments.length > 2 && (
                          <Text fontSize="xs" color="gray.500" textAlign="center">
                            +{pendingPayments.length - 2} more pending payment{pendingPayments.length - 2 !== 1 ? 's' : ''}
                          </Text>
                        )}
                      </VStack>
                    )}
                    
                    <Button
                      as={RouterLink}
                      to="/tenant/payments/history"
                      variant="outline"
                      colorScheme="orange"
                      size="sm"
                      w="100%"
                    >
                      View Payment History
                    </Button>
                    
                    <Divider />
                    
                    <Box fontSize="sm">
                      <Heading size="xs" mb={2}>Need help?</Heading>
                      <Text>
                        If you have questions about your payment verification, contact our support team
                        at <Text as="span" fontWeight="bold">support@rusunawa.ac.id</Text>.
                      </Text>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            </Box>
          )}
        </SimpleGrid>

        {/* Payment Proof Modal */}
        <Modal isOpen={isProofOpen} onClose={onProofClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Payment Proof</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedProofImage && (
                <Image
                  src={selectedProofImage.src}
                  alt="Payment proof"
                  w="100%"
                  objectFit="contain"
                  borderRadius="md"
                />
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onProofClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </TenantLayout>
  );
};

// Enhanced Booking Summary Component
const EnhancedBookingSummary = ({ booking, invoice, bg, borderColor }) => {
  // Enhanced date formatting for prominence
  const formatProminentDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
      };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const bookingData = booking || invoice.booking;
  const tenantData = booking?.tenant;
  
  return (
    <Card bg={bg} borderWidth="2px" borderColor="blue.200" borderRadius="lg" shadow="md">
      <CardHeader bg="blue.50" borderTopRadius="lg">
        <HStack justify="space-between">
          <HStack>
            <Icon as={FaFileInvoice} color="blue.600" boxSize={5} />
            <Heading size="lg" color="blue.700">
              Room Booking: #{bookingData?.booking_id || bookingData?.bookingId || 'N/A'}
            </Heading>
          </HStack>
          {bookingData?.status && (
            <Badge 
              colorScheme={getStatusColor(bookingData.status)} 
              variant="solid" 
              fontSize="sm"
              px={3} 
              py={1}
              borderRadius="full"
            >
              {bookingData.status.toUpperCase()}
            </Badge>
          )}
        </HStack>
      </CardHeader>
      
      <CardBody>
        {/* PROMINENT DATE DISPLAY - As Requested */}
        <Box 
          bg="gradient(to-r, blue.50, purple.50)" 
          p={6} 
          borderRadius="xl" 
          mb={6}
          border="2px solid"
          borderColor="blue.100"
        >
          <VStack spacing={4}>
            <Text fontSize="sm" color="gray.600" fontWeight="medium" textTransform="uppercase" letterSpacing="wide">
              Booking Period
            </Text>
            <HStack spacing={8} align="center">
              <VStack spacing={2}>
                <Text fontSize="xs" color="gray.500" fontWeight="semibold">CHECK-IN</Text>
                <Text 
                  fontSize={{ base: "2xl", md: "3xl" }} 
                  fontWeight="bold" 
                  color="green.600"
                  lineHeight="short"
                >
                  {formatProminentDate(bookingData?.check_in_date || bookingData?.checkInDate)}
                </Text>
              </VStack>
              
              <Icon as={FaArrowLeft} transform="rotate(180deg)" color="blue.400" boxSize={6} />
              
              <VStack spacing={2}>
                <Text fontSize="xs" color="gray.500" fontWeight="semibold">CHECK-OUT</Text>
                <Text 
                  fontSize={{ base: "2xl", md: "3xl" }} 
                  fontWeight="bold" 
                  color="red.600"
                  lineHeight="short"
                >
                  {formatProminentDate(bookingData?.check_out_date || bookingData?.checkOutDate)}
                </Text>
              </VStack>
            </HStack>
            
            {/* Duration Calculation */}
            {bookingData?.check_in_date && bookingData?.check_out_date && (
              <Badge colorScheme="purple" variant="outline" fontSize="md" px={4} py={2}>
                Duration: {Math.ceil((new Date(bookingData.check_out_date) - new Date(bookingData.check_in_date)) / (1000 * 60 * 60 * 24))} days
              </Badge>
            )}
          </VStack>
        </Box>

        {/* TENANT INFORMATION - As Requested */}
        {tenantData && (
          <Card bg="gray.50" borderWidth="1px" borderColor="gray.200" mb={6}>
            <CardHeader pb={2}>
              <HStack>
                <Icon as={FaBuilding} color="purple.500" />
                <Heading size="md" color="purple.700">Tenant Information</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <VStack align="start" spacing={3}>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>Full Name</Text>
                    <Text fontWeight="semibold" fontSize="lg">
                      {tenantData.name || tenantData.user?.full_name || 'N/A'}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>Email</Text>
                    <Text>{tenantData.email || tenantData.user?.email || 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>Phone</Text>
                    <Text>{tenantData.phone || 'N/A'}</Text>
                  </Box>
                </VStack>
                
                <VStack align="start" spacing={3}>
                  {tenantData.nim && (
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>Student ID (NIM)</Text>
                      <Text fontWeight="medium">{tenantData.nim}</Text>
                    </Box>
                  )}
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>Tenant Type</Text>
                    <Badge 
                      colorScheme={tenantData.tenant_type?.name === 'mahasiswa' ? 'blue' : 'green'}
                      variant="solid"
                    >
                      {getTenantTypeDisplay(tenantData.tenant_type || tenantData.type)}
                    </Badge>
                  </Box>
                  {tenantData.address && (
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>Address</Text>
                      <Text fontSize="sm">{tenantData.address}</Text>
                    </Box>
                  )}
                </VStack>
              </SimpleGrid>
            </CardBody>
          </Card>
        )}

        {/* Room Information */}
        {(bookingData?.room || invoice.booking?.room) && (
          <Box mb={4}>
            <Text fontSize="sm" color="gray.600" fontWeight="semibold" mb={3}>Room Information</Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <Text fontWeight="medium" fontSize="lg">
                  {bookingData?.room?.name || invoice.booking?.room?.name || 'Room'}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Classification: {getClassificationDisplay(bookingData?.room?.classification || invoice.booking?.room?.classification)}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Building: {bookingData?.room?.buildingName || invoice.booking?.room?.buildingName || 'N/A'} 
                  {(bookingData?.room?.floorName || invoice.booking?.room?.floorName) && 
                    ` - ${bookingData?.room?.floorName || invoice.booking?.room?.floorName}`
                  }
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Room Code: {bookingData?.room?.fullRoomCode || invoice.booking?.room?.fullRoomCode || 
                              bookingData?.room?.roomNumber || invoice.booking?.room?.roomNumber || 'N/A'}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600">Capacity</Text>
                <Text fontWeight="medium">
                  {bookingData?.room?.capacity || invoice.booking?.room?.capacity || 'N/A'} person(s)
                </Text>
                <Text fontSize="sm" color="gray.600">Invoice Amount</Text>
                <Text fontWeight="medium" color="green.600">
                  {formatCurrency(invoice.amount || invoice.total_amount || 0)}
                </Text>
                <Text fontSize="sm" color="gray.600">Availability Status</Text>
                <Badge 
                  colorScheme={
                    (bookingData?.room?.isAvailable || invoice.booking?.room?.isAvailable) ? "green" : "red"
                  }
                  size="sm"
                >
                  {(bookingData?.room?.isAvailable || invoice.booking?.room?.isAvailable) ? "Available" : "Not Available"}
                </Badge>
              </Box>
            </SimpleGrid>
          </Box>
        )}
      </CardBody>
    </Card>
  );
};

export default InvoiceDetail;
