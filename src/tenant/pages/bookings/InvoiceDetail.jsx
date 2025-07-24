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
  Badge,
  Divider,
  Icon,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  useToast
} from '@chakra-ui/react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaFileInvoice, FaUpload, FaDownload, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import invoiceService from '../../../services/invoiceService';
import bookingService from '../../services/bookingService';
import { useTenantAuth } from '../../context/tenantAuthContext';
import { useEnhancedPayments } from '../../hooks/useEnhancedPayments';

const InvoiceDetail = () => {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { tenant } = useTenantAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { getPayment } = useEnhancedPayments();
  
  // Move ALL useColorModeValue calls to the top level
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const boxBgColor = useColorModeValue('gray.50', 'gray.700');
  const itemBgColor = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    fetchInvoiceDetails();
  }, [invoiceId]);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (invoice?.payment_id) {
        try {
          const paymentDetails = await getPayment(invoice.payment_id);
          if (!paymentDetails) {
            setError('Payment information not found.');
          }
        } catch (error) {
          console.error('Failed to fetch payment details:', error);
          setError('Failed to load payment details. Please try again later.');
        }
      }
    };

    fetchPaymentDetails();
  }, [invoice?.payment_id, getPayment]);

  const fetchInvoiceDetails = async () => {
    setLoading(true);
    try {
      const invoiceResponse = await invoiceService.getInvoice(invoiceId);
      setInvoice(invoiceResponse.invoice || invoiceResponse.data);
      
      // Also fetch the related booking
      if (invoiceResponse.invoice?.booking_id || invoiceResponse.data?.booking_id) {
        const bookingId = invoiceResponse.invoice?.booking_id || invoiceResponse.data?.booking_id;
        const bookingResponse = await bookingService.getBooking(bookingId);
        setBooking(bookingResponse.booking || bookingResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch invoice details:', error);
      setError('Failed to load invoice details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };
  
  const handleUploadReceipt = async () => {
    if (!receiptFile) {
      toast({
        title: 'No file selected',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setUploadLoading(true);
    try {
      await invoiceService.uploadPaymentReceipt(
        invoiceId,
        receiptFile,
        receiptFile.type
      );
      
      toast({
        title: 'Receipt uploaded successfully',
        description: 'Your payment is being processed.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      onClose();
      fetchInvoiceDetails(); // Refresh data
    } catch (error) {
      console.error('Failed to upload receipt:', error);
      toast({
        title: 'Failed to upload receipt',
        description: error.message || 'Please try again later',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploadLoading(false);
    }
  };
  
  const handleDownloadInvoice = () => {
    try {
      const pdfDoc = invoiceService.generateInvoicePDF(invoice, booking);
      pdfDoc.download();
      
      toast({
        title: 'Invoice downloaded',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to download invoice',
        description: 'Please try again later',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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
  
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    // Handle both timestamp object and ISO string
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
      
    return date.toLocaleDateString();
  };
  
  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'paid': return 'green';
      case 'failed': return 'red';
      case 'refunded': return 'purple';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <TenantLayout>
        <Flex justify="center" align="center" height="400px">
          <Spinner size="xl" color="brand.500" />
        </Flex>
      </TenantLayout>
    );
  }

  if (error || !invoice) {
    return (
      <TenantLayout>
        <Container maxW="container.lg" py={8}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error || 'Invoice not found'}
          </Alert>
          <Button
            mt={4}
            colorScheme="brand"
            onClick={() => navigate('/tenant/bookings')}
          >
            Back to My Bookings
          </Button>
        </Container>
      </TenantLayout>
    );
  }

  const isPastDue = new Date() > new Date(invoice.due_date);
  const isPending = invoice.status === 'pending';

  return (
    <TenantLayout>
      <Container maxW="container.lg" py={8}>
        <Button
          size="sm"
          variant="outline"
          onClick={() => booking ? navigate(`/tenant/bookings/${booking.booking_id}`) : navigate('/tenant/bookings')}
          mb={4}
        >
          ← Back to Booking
        </Button>
        
        <Flex 
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'flex-start', md: 'center' }}
          mb={6
        }>
          <Box>
            <Heading as="h1" size="xl">
              Invoice #{invoice.invoice_no}
            </Heading>
            <Text color="gray.500">
              {booking ? booking.room?.name : 'Room Booking'} | {formatDate(invoice.issued_at)}
            </Text>
          </Box>
          
          <Badge 
            colorScheme={getStatusColor(invoice.status)}
            fontSize="md"
            py={1}
            px={3}
            borderRadius="md"
            mt={{ base: 2, md: 0 }}
          >
            {invoice.status.toUpperCase()}
          </Badge>
        </Flex>
        
        {isPending && isPastDue && (
          <Alert status="error" mb={6}>
            <AlertIcon />
            This invoice is past due. Please make payment immediately to avoid booking cancellation.
          </Alert>
        )}
        
        {/* Main content */}
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
          {/* Invoice details - takes 2/3 of space on large screens */}
          <Box gridColumn={{ lg: "span 2" }}>
            <Box
              bg={bgColor}
              p={6}
              borderRadius="md"
              boxShadow="sm"
              mb={6}
            >
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md">Invoice Details</Heading>
                <Button
                  leftIcon={<FaDownload />}
                  colorScheme="brand"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadInvoice}
                >
                  Download PDF
                </Button>
              </Flex>
              
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mb={6}>
                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="gray.500">Invoice Number</Text>
                  <Text fontSize="md">{invoice.invoice_no}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="gray.500">Issue Date</Text>
                  <Text fontSize="md">{formatDate(invoice.issued_at)}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="gray.500">Due Date</Text>
                  <Text fontSize="md" color={isPastDue && isPending ? "red.500" : "inherit"}>
                    {formatDate(invoice.due_date)}
                    {isPastDue && isPending && " (Overdue)"}
                  </Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="gray.500">Payment Method</Text>
                  <Text fontSize="md">{invoice.payment_method || "Bank Transfer"}</Text>
                </Box>
                
                {invoice.paid_at && (
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Paid Date</Text>
                    <Text fontSize="md">{formatDate(invoice.paid_at)}</Text>
                  </Box>
                )}
              </SimpleGrid>
              
              <Divider my={4} />
              
              {/* Invoice items */}
              <Box>
                <Text fontWeight="bold" mb={3}>Invoice Items</Text>
                <Box 
                  borderWidth="1px" 
                  borderColor={borderColor} 
                  borderRadius="md" 
                  overflow="hidden"
                >
                  <Box p={4} bg={boxBgColor}>
                    <Flex>
                      <Text flex="3" fontWeight="medium">Item</Text>
                      <Text flex="1" textAlign="right" fontWeight="medium">Amount</Text>
                    </Flex>
                  </Box>
                  <Divider m={0} />
                  <Box p={4}>
                    <Flex>
                      <Box flex="3">
                        <Text fontWeight="medium">
                          {booking ? booking.room?.name : 'Room Booking'}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {booking ? `${formatDate(booking.start_date)} to ${formatDate(booking.end_date)}` : 'Booking period'}
                        </Text>
                      </Box>
                      <Text flex="1" textAlign="right">{formatCurrency(invoice.amount)}</Text>
                    </Flex>
                  </Box>
                  <Divider m={0} />
                  <Box p={4} bg={itemBgColor}>
                    <Flex>
                      <Text flex="3" fontWeight="bold">Total</Text>
                      <Text flex="1" textAlign="right" fontWeight="bold">{formatCurrency(invoice.amount)}</Text>
                    </Flex>
                  </Box>
                </Box>
              </Box>
            </Box>
            
            {/* Booking details summary */}
            {booking && (
              <Box
                bg={bgColor}
                p={6}
                borderRadius="md"
                boxShadow="sm"
              >
                <Flex justify="space-between" align="center" mb={4}>
                  <Heading size="md">Booking Details</Heading>
                  <Button
                    as={Link}
                    to={`/tenant/bookings/${booking.booking_id}`}
                    colorScheme="brand"
                    variant="ghost"
                    size="sm"
                  >
                    View Booking
                  </Button>
                </Flex>
                
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Room</Text>
                    <Text fontSize="md">{booking.room?.name}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Status</Text>
                    <Badge colorScheme={
                      booking.status === 'approved' ? 'green' : 
                      booking.status === 'pending' ? 'yellow' :
                      booking.status === 'completed' ? 'blue' : 'gray'
                    }>
                      {booking.status}
                    </Badge>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Check-in Date</Text>
                    <Text fontSize="md">{formatDate(booking.start_date)}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Check-out Date</Text>
                    <Text fontSize="md">{formatDate(booking.end_date)}</Text>
                  </Box>
                </SimpleGrid>
              </Box>
            )}
          </Box>
          
          {/* Payment info and actions - takes 1/3 of space on large screens */}
          <Box>
            <Box
              bg={bgColor}
              p={6}
              borderRadius="md"
              boxShadow="sm"
              position={{ base: 'static', lg: 'sticky' }}
              top="100px"
            >
              <Heading size="md" mb={4}>Payment Information</Heading>
              
              {invoice.status === 'pending' ? (
                <>
                  <Alert status="info" mb={4} borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="bold">Payment Required</Text>
                      <Text fontSize="sm">
                        Please make your payment before {formatDate(invoice.due_date)}
                      </Text>
                    </Box>
                  </Alert>
                  
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Text fontWeight="bold" mb={1}>Total Amount</Text>
                      <Text fontSize="2xl" fontWeight="bold" color="brand.500">
                        {formatCurrency(invoice.amount)}
                      </Text>
                    </Box>
                    
                    <Divider />
                    
                    <Box>
                      <Text fontWeight="bold" mb={3}>Bank Transfer Details</Text>
                      <VStack align="start" spacing={2}>
                        <Box>
                          <Text fontSize="sm" color="gray.500">Bank Name</Text>
                          <Text fontWeight="medium">Bank Central Asia (BCA)</Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.500">Account Number</Text>
                          <Text fontWeight="medium">1234-5678-9012</Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.500">Account Name</Text>
                          <Text fontWeight="medium">PT Rusunawa Sejahtera</Text>
                        </Box>
                      </VStack>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" mb={2}>
                        Please include your Invoice Number ({invoice.invoice_no}) in the payment reference.
                      </Text>
                      <Text fontSize="sm" color="red.500" mb={4}>
                        Note: Your booking will automatically be cancelled if payment is not received by the due date.
                      </Text>
                      
                      <Button
                        leftIcon={<FaUpload />}
                        colorScheme="brand"
                        width="full"
                        onClick={onOpen}
                      >
                        Upload Payment Receipt
                      </Button>
                    </Box>
                  </VStack>
                </>
              ) : invoice.status === 'paid' ? (
                <VStack spacing={6} align="stretch">
                  <Box textAlign="center" py={4}>
                    <Icon as={FaCheckCircle} w={12} h={12} color="green.500" mb={3} />
                    <Heading size="md" mb={2}>Payment Complete</Heading>
                    <Text>Thank you for your payment!</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" mb={1}>Amount Paid</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="green.500">
                      {formatCurrency(invoice.amount)}
                    </Text>
                  </Box>
                  
                  <Divider />
                  
                  <Box>
                    <Text fontWeight="bold" mb={2}>Payment Details</Text>
                    <SimpleGrid columns={2} spacing={2}>
                      <Text fontSize="sm" color="gray.500">Method</Text>
                      <Text>{invoice.payment_method || "Bank Transfer"}</Text>
                      
                      <Text fontSize="sm" color="gray.500">Date</Text>
                      <Text>{formatDate(invoice.paid_at)}</Text>
                      
                      {invoice.receipt_url && (
                        <>
                          <Text fontSize="sm" color="gray.500">Receipt</Text>
                          <Button
                            as="a"
                            href={invoice.receipt_url}
                            target="_blank"
                            size="xs"
                            colorScheme="blue"
                            leftIcon={<FaFileInvoice />}
                          >
                            View Receipt
                          </Button>
                        </>
                      )}
                    </SimpleGrid>
                  </Box>
                  
                  <Button
                    leftIcon={<FaDownload />}
                    colorScheme="brand"
                    variant="outline"
                    onClick={handleDownloadInvoice}
                  >
                    Download Invoice
                  </Button>
                </VStack>
              ) : (
                <VStack spacing={6} align="stretch">
                  <Box textAlign="center" py={4}>
                    <Icon as={FaExclamationCircle} w={12} h={12} color="red.500" mb={3} />
                    <Heading size="md" mb={2}>Payment {invoice.status === 'failed' ? 'Failed' : 'Refunded'}</Heading>
                    <Text>
                      {invoice.status === 'failed' 
                        ? 'There was an issue processing your payment.' 
                        : 'Your payment has been refunded.'}
                    </Text>
                  </Box>
                  
                  <Divider />
                  
                  <Button
                    as={Link}
                    to={`/tenant/support`}
                    colorScheme="brand"
                  >
                    Contact Support
                  </Button>
                </VStack>
              )}
            </Box>
          </Box>
        </SimpleGrid>
      </Container>
      
      {/* Upload Receipt Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload Payment Receipt</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isRequired mb={4}>
              <FormLabel>Payment Receipt</FormLabel>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                py={1}
              />
              <Text fontSize="sm" color="gray.500" mt={1}>
                Supported formats: JPEG, PNG, PDF (max 5MB)
              </Text>
            </FormControl>
            
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">
                Your payment will be verified by our team within 24 hours.
              </Text>
            </Alert>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="brand" 
              onClick={handleUploadReceipt}
              isLoading={uploadLoading}
              loadingText="Uploading..."
            >
              Upload
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </TenantLayout>
  );
};

export default InvoiceDetail;
