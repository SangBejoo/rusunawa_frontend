import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import paymentService from '../../services/paymentService';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Alert,
  AlertIcon,
  useToast,
  Spinner,
  Image,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Badge,
  Link,
  useColorModeValue,
  SimpleGrid,
  Icon,
  Flex,
  Progress,
  List,
  ListItem,
  ListIcon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import {
  FaFileUpload,
  FaMoneyBillWave,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaInfoCircle,
  FaArrowLeft,
  FaReceipt,
  FaCalendarAlt,
  FaUser,
  FaCreditCard,
  FaUpload,
  FaDownload,
  FaEye,
  FaUniversity // Use FaUniversity instead of FaBank
} from 'react-icons/fa';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import TenantLayout from '../../components/layout/TenantLayout';
import invoiceService from '../../services/invoiceService';
import bookingService from '../../services/bookingService';
import { formatCurrency } from '../../utils/formatUtils';
import { formatDate } from '../../utils/dateUtils';
import { useTenantAuth } from '../../context/tenantAuthContext';

const ManualPayment = () => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { tenant } = useTenantAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Parse the bookingId from query parameters if available
  const queryParams = new URLSearchParams(location.search);
  const bookingIdFromQuery = queryParams.get('bookingId');
  
  // State management
  const [invoice, setInvoice] = useState(null);
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [manualPaymentData, setManualPaymentData] = useState({
    payment_channel: 'bank_transfer',
    bank_name: '',
    account_number: '',
    account_holder_name: '',
    transfer_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [hasPendingPayment, setHasPendingPayment] = useState(false);

  // Colors
  const bg = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const stepBg = useColorModeValue('gray.50', 'gray.700');

  // Steps configuration
  const steps = [
    { title: 'Bank Transfer', description: 'Transfer to our bank account' },
    { title: 'Upload Receipt', description: 'Upload payment proof' },
    { title: 'Verification', description: 'Wait for admin verification' }
  ];

  const { activeStep } = useSteps({
    index: currentStep,
    count: steps.length,
  });

  // Bank accounts for payment
  const bankAccounts = [
    {
      name: 'Bank BNI',
      accountNumber: '0123456789',
      accountHolder: 'Yayasan Rusunawa PNJ',
      code: 'BNI'
    },
    {
      name: 'Bank Mandiri', 
      accountNumber: '9876543210',
      accountHolder: 'Yayasan Rusunawa PNJ',
      code: 'MANDIRI'
    },
    {
      name: 'Bank BCA',
      accountNumber: '5555666677',
      accountHolder: 'Yayasan Rusunawa PNJ', 
      code: 'BCA'
    }
  ];
    // Colors
  const bgColor = useColorModeValue('white', 'gray.700');
    useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let invoiceData = null;
        let bookingData = null;
        
        // Try to fetch invoice if we have an invoice ID
        if (invoiceId && invoiceId !== 'undefined') {
          try {
            const response = await invoiceService.getInvoice(invoiceId);
            invoiceData = response.invoice || response.data;
          } catch (err) {
            console.error("Error fetching invoice:", err);
          }
        }
        
        // If we have a booking ID from either the invoice or query params, fetch booking details
        const bookingId = invoiceData?.booking_id || bookingIdFromQuery;
        if (bookingId) {
          try {
            const response = await bookingService.getBooking(bookingId);
            bookingData = response.booking || response.data;
          } catch (err) {
            console.error("Error fetching booking:", err);
          }
        }
        
        // Update state with whatever data we could retrieve
        setInvoice(invoiceData);
        setBooking(bookingData);
        
        // Check for pending manual payments
        if (invoiceData?.invoice_id) {
          await checkPendingPayments(invoiceData.invoice_id);
        }
        
        // If we have neither invoice nor booking, show an error
        if (!invoiceData && !bookingData) {
          throw new Error("Could not retrieve payment information");
        }
      } catch (err) {
        console.error("Error fetching payment data:", err);
        setError(err.message || "Failed to load payment information");
        
        toast({
          title: "Error",
          description: err.message || "Failed to load payment information",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [invoiceId, bookingIdFromQuery, toast]);
  const checkPendingPayments = async (currentInvoiceId) => {
    try {
      // Get tenant ID from localStorage
      const tenantData = JSON.parse(localStorage.getItem('tenant') || '{}');
      const tenantId = tenantData.tenantId || tenantData.tenant_id || tenantData.id;

      const response = await paymentService.checkPendingManualPayments(currentInvoiceId, tenantId);
      
      if (response.hasPendingPayments && response.pendingPayments?.length > 0) {
        const pendingPayment = response.pendingPayments[0];
        setPendingPayment(pendingPayment);
        setHasPendingPayment(true);
        
        toast({
          title: 'Pending Payment Found',
          description: `There is already a manual payment pending verification for this invoice.`,
          status: 'warning',
          duration: 6000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error checking pending payments:', error);
      // Don't prevent form if we can't check - API might not be available
    }
  };

  const handleInputChange = (field, value) => {
    setManualPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload JPEG, PNG, GIF, or PDF files only",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      setReceiptFile(file);
      
      // Create preview URL if it's an image
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const validateForm = () => {
    const errors = [];
    
    if (!manualPaymentData.bank_name.trim()) {
      const fieldName = manualPaymentData.payment_channel === 'bank_transfer' ? 'Bank name' :
                       manualPaymentData.payment_channel === 'digital_wallet' ? 'Wallet/App name' :
                       manualPaymentData.payment_channel === 'cash' ? 'Payment location' :
                       'Payment source';
      errors.push(`${fieldName} is required`);
    }
    
    if (!manualPaymentData.account_number.trim()) {
      const fieldName = manualPaymentData.payment_channel === 'bank_transfer' ? 'Account number' :
                       manualPaymentData.payment_channel === 'digital_wallet' ? 'Phone/Account number' :
                       manualPaymentData.payment_channel === 'cash' ? 'Reference number' :
                       'Account/Reference number';
      errors.push(`${fieldName} is required`);
    }
    
    if (!manualPaymentData.account_holder_name.trim()) {
      const fieldName = manualPaymentData.payment_channel === 'cash' ? 'Payer name' : 'Account holder name';
      errors.push(`${fieldName} is required`);
    }
    
    if (!manualPaymentData.transfer_date) {
      const fieldName = manualPaymentData.payment_channel === 'cash' ? 'Payment date' : 'Transfer date';
      errors.push(`${fieldName} is required`);
    }
    
    if (!receiptFile) {
      const receiptName = manualPaymentData.payment_channel === 'cash' ? 'Payment receipt' : 'Payment receipt';
      errors.push(`${receiptName} is required`);
    }
    
    return errors;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!receiptFile) {
      toast({
        title: "Missing File",
        description: "Please upload a payment receipt first.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (hasPendingPayment) {
      toast({
        title: "Payment Already Pending",
        description: "You cannot submit a new payment while another is pending verification.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(', '),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Convert file to base64
      const base64 = await convertFileToBase64(receiptFile);
      // Detect file signature (magic number) for image type validation
      const byteString = atob(base64.split(',')[1]);
      const uint8 = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) uint8[i] = byteString.charCodeAt(i);
      // Simple magic number check for PNG/JPEG
      let detectedType = receiptFile.type;
      if (uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4E && uint8[3] === 0x47) detectedType = 'image/png';
      else if (uint8[0] === 0xFF && uint8[1] === 0xD8 && uint8[2] === 0xFF) detectedType = 'image/jpeg';
      else if (uint8[0] === 0x47 && uint8[1] === 0x49 && uint8[2] === 0x46) detectedType = 'image/gif';
      // If mismatch, warn user and use detected type
      if (detectedType !== receiptFile.type) {
        toast({
          title: 'File type mismatch',
          description: `The uploaded file extension/type does not match its content. Detected as ${detectedType}.`,
          status: 'warning',
          duration: 7000,
          isClosable: true,
        });
      }      // Prepare payment data for createManualPayment API
      const paymentData = {
        bookingId: invoice?.booking_id || booking?.booking_id,
        tenantId: tenant?.id,
        invoiceId: parseInt(invoiceId),
        amount: invoice?.amount || booking?.total_amount || 0,
        paymentChannel: manualPaymentData.payment_channel,
        notes: manualPaymentData.notes,
        bankName: manualPaymentData.bank_name,
        accountNumber: manualPaymentData.account_number,
        accountHolderName: manualPaymentData.account_holder_name,
        transferDate: manualPaymentData.transfer_date + 'T00:00:00Z',
        fileName: receiptFile.name,
        fileType: detectedType,
        imageContent: base64.split(',')[1],
        contentEncoding: 'base64'
      };
      
      console.log('Submitting manual payment:', paymentData);
      
      // Create manual payment
      const response = await paymentService.createManualPayment(paymentData);
      
      toast({
        title: "Payment Submitted Successfully",
        description: "Your payment proof has been uploaded and is awaiting verification.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      // Move to verification step
      setCurrentStep(2);
      
      // Navigate to payment history after a brief delay
      setTimeout(() => {
        navigate('/tenant/payments/history');
      }, 3000);
      
    } catch (err) {
      console.error("Error submitting manual payment:", err);
      setError(err.message || "Failed to submit payment");
      
      toast({
        title: "Payment Submission Failed",
        description: err.message || "Failed to submit payment. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: `${text} has been copied`,
        status: "success",
        duration: 2000,
      });
    });
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
    if (isLoading) {
    return (
      <TenantLayout>
        <Container maxW="container.lg" py={8}>
          <Flex justify="center" align="center" minH="400px">
            <VStack spacing={4}>
              <Spinner size="xl" color="brand.500" thickness="4px" />
              <Text>Loading payment information...</Text>
            </VStack>
          </Flex>
        </Container>
      </TenantLayout>
    );
  }

  const getPaymentAmount = () => {
    return invoice?.amount || booking?.total_amount || 0;
  };

  // Render invoice/booking details
  const renderPaymentDetails = () => (
    <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} mb={6}>
      <CardHeader pb={0}>
        <HStack>
          <Icon as={FaReceipt} color="brand.500" />
          <Heading size="md">
            {invoice ? 'Invoice Details' : 'Booking Details'}
          </Heading>
        </HStack>
      </CardHeader>
      <CardBody>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {invoice ? (
            <>
              <Box>
                <Text fontSize="sm" color="gray.500" mb={1}>Invoice Number</Text>
                <Text fontWeight="bold">#{invoice.invoice_no}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500" mb={1}>Issue Date</Text>
                <Text fontWeight="medium">{formatDate(invoice.issued_at)}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500" mb={1}>Due Date</Text>
                <Text fontWeight="medium" color={new Date(invoice.due_date) < new Date() ? 'red.500' : 'inherit'}>
                  {formatDate(invoice.due_date)}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500" mb={1}>Status</Text>
                <Badge colorScheme={invoice.status === 'paid' ? 'green' : 'yellow'}>
                  {invoice.status?.toUpperCase()}
                </Badge>
              </Box>
            </>
          ) : (
            <>
              <Box>
                <Text fontSize="sm" color="gray.500" mb={1}>Booking ID</Text>
                <Text fontWeight="bold">#{booking?.booking_id}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500" mb={1}>Room</Text>
                <Text fontWeight="medium">{booking?.room?.name || 'N/A'}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500" mb={1}>Check-in</Text>
                <Text fontWeight="medium">{formatDate(booking?.check_in)}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500" mb={1}>Check-out</Text>
                <Text fontWeight="medium">{formatDate(booking?.check_out)}</Text>
              </Box>
            </>
          )}
          <Box gridColumn={{ base: 1, md: 'span 2' }}>
            <Divider my={4} />
            <Flex justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="bold">Total Amount</Text>
              <Text fontSize="2xl" fontWeight="bold" color="brand.500">
                {formatCurrency(getPaymentAmount())}
              </Text>
            </Flex>
          </Box>
        </SimpleGrid>
      </CardBody>
    </Card>
  );

  // Render bank transfer instructions
  const renderBankInstructions = () => (
    <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} mb={6}>
      <CardHeader pb={0}>
        <HStack>
          <Icon as={FaUniversity} color="brand.500" />
          <Heading size="md">Bank Transfer Instructions</Heading>
        </HStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontWeight="bold">Payment Instructions:</Text>
              <Text fontSize="sm">
                Please transfer the exact amount to one of the following bank accounts. 
                After completing the transfer, upload your payment receipt below.
              </Text>
            </VStack>
          </Alert>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {bankAccounts.map((bank, index) => (
              <Card key={index} variant="outline" borderColor={borderColor}>
                <CardBody p={4}>
                  <VStack spacing={3} align="stretch">
                    <HStack>
                      <Icon as={FaUniversity} color="blue.500" />
                      <Text fontWeight="bold" color="blue.500">{bank.name}</Text>
                    </HStack>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.500">Account Number</Text>
                      <HStack>
                        <Text fontWeight="bold" fontSize="lg">{bank.accountNumber}</Text>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => copyToClipboard(bank.accountNumber)}
                        >
                          Copy
                        </Button>
                      </HStack>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.500">Account Holder</Text>
                      <Text fontWeight="medium">{bank.accountHolder}</Text>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontWeight="bold">Important Notes:</Text>
              <List spacing={1} fontSize="sm">
                <ListItem>
                  <ListIcon as={FaInfoCircle} />
                  Transfer the exact amount: {formatCurrency(getPaymentAmount())}
                </ListItem>
                <ListItem>
                  <ListIcon as={FaInfoCircle} />
                  Include your invoice/booking number in the transfer description
                </ListItem>
                <ListItem>
                  <ListIcon as={FaInfoCircle} />
                  Keep your transfer receipt for upload
                </ListItem>
                <ListItem>
                  <ListIcon as={FaInfoCircle} />
                  Payment verification may take 1-2 business days
                </ListItem>
              </List>
            </VStack>
          </Alert>
        </VStack>
      </CardBody>
    </Card>
  );

  // Render upload form
  const renderUploadForm = () => (
    <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
      <CardHeader pb={0}>
        <HStack>
          <Icon as={FaUpload} color="brand.500" />
          <Heading size="md">Upload Payment Proof</Heading>
        </HStack>
      </CardHeader>
      <CardBody>
        <Box as="form" onSubmit={handleSubmit}>
          <VStack spacing={6} align="stretch">
            {/* Payment Channel */}
            <FormControl isRequired>
              <FormLabel>Payment Channel</FormLabel>
              <Select
                value={manualPaymentData.payment_channel}
                onChange={(e) => handleInputChange('payment_channel', e.target.value)}
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="digital_wallet">Digital Wallet (DANA, OVO, GoPay, etc.)</option>
                <option value="flip">Flip</option>
                <option value="bibit">Bibit</option>
                <option value="jenius">Jenius</option>
                <option value="livin">Livin by Mandiri</option>
                <option value="blu">blu by BCA Digital</option>
                <option value="seabank">SeaBank</option>
                <option value="jago">Bank Jago</option>
                <option value="neobank">Neo Bank</option>
                <option value="cash">Cash Payment</option>
                <option value="other">Other</option>
              </Select>
            </FormControl>

            {/* Contextual Help Based on Payment Channel */}
            {manualPaymentData.payment_channel && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="medium">
                    {manualPaymentData.payment_channel === 'bank_transfer' && 'Bank Transfer Instructions'}
                    {manualPaymentData.payment_channel === 'digital_wallet' && 'Digital Wallet Payment'}
                    {manualPaymentData.payment_channel === 'flip' && 'Flip Transfer'}
                    {manualPaymentData.payment_channel === 'cash' && 'Cash Payment'}
                    {['bibit', 'jenius', 'livin', 'blu', 'seabank', 'jago', 'neobank'].includes(manualPaymentData.payment_channel) && 'Digital Banking Transfer'}
                    {manualPaymentData.payment_channel === 'other' && 'Other Payment Method'}
                  </Text>
                  <Text fontSize="sm">
                    {manualPaymentData.payment_channel === 'bank_transfer' && 'Transfer to our bank account using ATM, internet banking, or mobile banking. Upload your transfer receipt as proof.'}
                    {manualPaymentData.payment_channel === 'digital_wallet' && 'Pay using your digital wallet (DANA, OVO, GoPay, ShopeePay, etc.). Screenshot the transaction success page as proof.'}
                    {manualPaymentData.payment_channel === 'flip' && 'Transfer using Flip to our bank account. Upload the Flip transaction receipt as proof.'}
                    {manualPaymentData.payment_channel === 'cash' && 'Make cash payment at our office or authorized location. Keep the payment receipt as proof.'}
                    {['bibit', 'jenius', 'livin', 'blu', 'seabank', 'jago', 'neobank'].includes(manualPaymentData.payment_channel) && 'Transfer using your digital banking app. Upload the transaction receipt as proof.'}
                    {manualPaymentData.payment_channel === 'other' && 'Use your preferred payment method and provide transaction details. Upload payment proof.'}
                  </Text>
                </Box>
              </Alert>
            )}

            {/* Payment Source Details */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isRequired>
                <FormLabel>
                  {manualPaymentData.payment_channel === 'bank_transfer' ? 'Transfer From (Bank Name)' :
                   manualPaymentData.payment_channel === 'digital_wallet' ? 'Transfer From (Wallet/App)' :
                   manualPaymentData.payment_channel === 'cash' ? 'Payment Location' :
                   'Transfer From'}
                </FormLabel>
                <Input
                  placeholder={
                    manualPaymentData.payment_channel === 'bank_transfer' ? "e.g., BCA, BRI, Mandiri, BNI" :
                    manualPaymentData.payment_channel === 'digital_wallet' ? "e.g., DANA, OVO, GoPay, ShopeePay" :
                    manualPaymentData.payment_channel === 'flip' ? "Flip" :
                    manualPaymentData.payment_channel === 'cash' ? "e.g., Office, Bank Counter" :
                    "Payment source/method"
                  }
                  value={manualPaymentData.bank_name}
                  onChange={(e) => handleInputChange('bank_name', e.target.value)}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>
                  {manualPaymentData.payment_channel === 'bank_transfer' ? 'Your Account Number' :
                   manualPaymentData.payment_channel === 'digital_wallet' ? 'Your Phone/Account Number' :
                   manualPaymentData.payment_channel === 'cash' ? 'Reference Number' :
                   'Account/Reference Number'}
                </FormLabel>
                <Input
                  placeholder={
                    manualPaymentData.payment_channel === 'bank_transfer' ? "Bank account number used for transfer" :
                    manualPaymentData.payment_channel === 'digital_wallet' ? "Phone number or account ID" :
                    manualPaymentData.payment_channel === 'cash' ? "Receipt or reference number" :
                    "Account number or reference"
                  }
                  value={manualPaymentData.account_number}
                  onChange={(e) => handleInputChange('account_number', e.target.value)}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>
                  {manualPaymentData.payment_channel === 'cash' ? 'Payer Name' : 'Account Holder Name'}
                </FormLabel>
                <Input
                  placeholder={
                    manualPaymentData.payment_channel === 'cash' ? "Name of person making payment" :
                    "Name on the account/wallet"
                  }
                  value={manualPaymentData.account_holder_name}
                  onChange={(e) => handleInputChange('account_holder_name', e.target.value)}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>
                  {manualPaymentData.payment_channel === 'cash' ? 'Payment Date' : 'Transfer Date'}
                </FormLabel>
                <Input
                  type="date"
                  value={manualPaymentData.transfer_date}
                  onChange={(e) => handleInputChange('transfer_date', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </FormControl>
            </SimpleGrid>

            {/* File Upload */}
            <FormControl isRequired>
              <FormLabel>
                {manualPaymentData.payment_channel === 'bank_transfer' ? 'Transfer Receipt' :
                 manualPaymentData.payment_channel === 'digital_wallet' ? 'Transaction Screenshot' :
                 manualPaymentData.payment_channel === 'cash' ? 'Payment Receipt' :
                 'Payment Proof'}
              </FormLabel>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                p={1}
              />
              <Text fontSize="sm" color="gray.500" mt={1}>
                Upload your payment proof: {
                  manualPaymentData.payment_channel === 'bank_transfer' ? 'bank transfer receipt or confirmation' :
                  manualPaymentData.payment_channel === 'digital_wallet' ? 'wallet transaction screenshot or receipt' :
                  manualPaymentData.payment_channel === 'flip' ? 'Flip transaction receipt' :
                  manualPaymentData.payment_channel === 'cash' ? 'cash payment receipt' :
                  'payment confirmation or receipt'
                } (JPG, PNG, or PDF, Max: 5MB)
              </Text>
              
              {receiptFile && (
                <Box mt={3} p={3} bg={stepBg} borderRadius="md">
                  <HStack spacing={3}>
                    <Icon as={FaFileUpload} color="green.500" />
                    <VStack align="start" spacing={1} flex="1">
                      <Text fontSize="sm" fontWeight="medium">
                        {receiptFile.name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Size: {(receiptFile.size / 1024 / 1024).toFixed(2)} MB
                      </Text>
                    </VStack>
                    <Button size="sm" variant="ghost" onClick={() => onOpen()}>
                      Preview
                    </Button>
                  </HStack>
                </Box>
              )}
            </FormControl>

            {/* Notes */}
            <FormControl>
              <FormLabel>Additional Notes (Optional)</FormLabel>
              <Textarea
                placeholder={
                  manualPaymentData.payment_channel === 'bank_transfer' ? "e.g., Transfer via internet banking, ATM reference number, etc." :
                  manualPaymentData.payment_channel === 'digital_wallet' ? "e.g., Transaction ID, reference number, wallet app used, etc." :
                  manualPaymentData.payment_channel === 'flip' ? "e.g., Flip transaction ID, recipient name, etc." :
                  "Add any additional information about your payment..."
                }
                value={manualPaymentData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </FormControl>

            {/* Submit Button */}
            <Button
              type="submit"              colorScheme="brand"
              size="lg"
              isLoading={isSubmitting}
              loadingText="Submitting Payment..."
              leftIcon={<FaCheckCircle />}
              isDisabled={!receiptFile || hasPendingPayment}
              title={hasPendingPayment ? 'Cannot submit new payment while another is pending' : ''}
            >
              {hasPendingPayment ? 'Payment Pending Verification' : 'Submit Payment Receipt'}
            </Button>
          </VStack>
        </Box>
      </CardBody>
    </Card>
  );

  return (
    <TenantLayout>
      <Container maxW="container.lg" py={8}>
        {/* Header */}
        <Flex 
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'flex-start', md: 'center' }}
          mb={8}
        >
          <Box>
            <Heading as="h1" size="xl" mb={2} display="flex" alignItems="center">
              <Icon as={FaMoneyBillWave} mr={3} color="brand.500" />
              Manual Payment
            </Heading>
            <Text color="gray.500">
              Complete your payment by bank transfer
            </Text>
          </Box>
          
          <Button
            leftIcon={<FaArrowLeft />}
            variant="outline"
            onClick={() => navigate(-1)}
            mt={{ base: 4, md: 0 }}
          >
            Back
          </Button>
        </Flex>

        {/* Pending Payment Warning */}
        {hasPendingPayment && pendingPayment && (
          <Alert status="warning" borderRadius="md" mb={6}>
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Payment Already Pending Verification</Text>
              <Text fontSize="sm" mt={1}>
                You have already submitted a manual payment (#{pendingPayment.id}) for this invoice 
                that is currently pending verification. You cannot submit another payment until the current one is processed.
              </Text>
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
              </HStack>
            </Box>
          </Alert>
        )}

        {/* Progress Stepper */}
        <Card bg={stepBg} borderWidth="1px" borderColor={borderColor} mb={8}>
          <CardBody>
            <Stepper index={currentStep} orientation="horizontal" gap="0">
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepIndicator>
                    <StepStatus
                      complete={<StepIcon />}
                      incomplete={<StepNumber />}
                      active={<StepNumber />}
                    />
                  </StepIndicator>

                  <Box flexShrink="0">
                    <StepTitle>{step.title}</StepTitle>
                    <StepDescription>{step.description}</StepDescription>
                  </Box>

                  <StepSeparator />
                </Step>
              ))}
            </Stepper>
          </CardBody>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert status="error" mb={6} borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Error</Text>
              <Text>{error}</Text>
            </Box>
          </Alert>
        )}

        {/* Payment Details */}
        {renderPaymentDetails()}

        {/* Step Content */}
        {currentStep === 0 && (
          <>
            {renderBankInstructions()}
            <Flex justify="flex-end" mt={6}>
              <Button 
                colorScheme="brand" 
                onClick={handleNextStep}
                rightIcon={<FaArrowLeft style={{ transform: 'rotate(180deg)' }} />}
              >
                Continue to Upload Receipt
              </Button>
            </Flex>
          </>
        )}

        {currentStep === 1 && (
          <>
            {renderUploadForm()}
            <Flex justify="space-between" mt={6}>
              <Button variant="outline" onClick={handlePrevStep}>
                Back to Instructions
              </Button>
            </Flex>
          </>
        )}

        {currentStep === 2 && (
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardBody textAlign="center" py={12}>
              <VStack spacing={6}>
                <Icon as={FaCheckCircle} boxSize="64px" color="green.500" />
                <Heading size="lg" color="green.500">
                  Payment Submitted Successfully!
                </Heading>
                <Text color="gray.500" maxW="md">
                  Your payment receipt has been uploaded and is awaiting verification. 
                  You will be notified once the payment is confirmed.
                </Text>
                
                <VStack spacing={3}>
                  <Button
                    colorScheme="brand"
                    onClick={() => navigate('/tenant/payments/history')}
                    leftIcon={<FaEye />}
                  >
                    View Payment History
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/tenant/dashboard')}
                  >
                    Back to Dashboard
                  </Button>
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* File Preview Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Receipt Preview</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {previewUrl ? (
                <Image 
                  src={previewUrl} 
                  alt="Receipt Preview" 
                  maxH="500px" 
                  mx="auto"
                  borderRadius="md"
                />
              ) : (
                <Flex justify="center" align="center" h="200px">
                  <VStack spacing={3}>
                    <Icon as={FaFileUpload} boxSize="48px" color="gray.400" />
                    <Text>No preview available for this file type</Text>
                  </VStack>
                </Flex>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </TenantLayout>
  );
};

export default ManualPayment;
