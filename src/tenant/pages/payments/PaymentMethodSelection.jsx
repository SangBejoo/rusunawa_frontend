import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Heading, Text, Button, VStack, HStack,
  Spinner, Alert, AlertIcon, SimpleGrid, Card, CardBody,
  Image, Radio, RadioGroup, Stack, Badge, Divider,
  useToast, useDisclosure, Icon, Modal, ModalOverlay, 
  ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Textarea, Select, Flex
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheck, FaArrowLeft, FaCreditCard, FaMobileAlt, FaStore, FaWallet, FaMoneyBillWave, FaGlobe, FaUpload, FaUniversity } from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import PaymentSummary from '../../components/payment/PaymentSummary';
import MidtransPaymentRedirect from '../../components/payment/MidtransPaymentRedirect';
import bookingService from '../../services/bookingService';
import paymentService from '../../services/paymentService';
import invoiceService from '../../services/invoiceService';
import { validateId } from '../../utils/apiUtils';

const PaymentMethodSelection = () => {  const { bookingId, invoiceId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [booking, setBooking] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [error, setError] = useState(null);
  const [midtransUrl, setMidtransUrl] = useState(null);
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState(null);
  
  // Manual payment form states
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualPaymentData, setManualPaymentData] = useState({
    paymentChannel: '',
    notes: '',
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    transferDate: new Date().toISOString().split('T')[0], // Today's date
    fileName: '',
    fileType: '',
    content: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingManual, setUploadingManual] = useState(false);  // Fetch booking and payment methods
  useEffect(() => {
    fetchData();
  }, [bookingId, invoiceId]);

  // Debug effect to monitor showManualForm changes
  useEffect(() => {
    console.log('=== useEffect: showManualForm changed ===', showManualForm);
  }, [showManualForm]);

  // Refactored fetchData to properly integrate with backend
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Handle both booking-based and invoice-based flows
      if (invoiceId) {
        // Invoice-based flow: fetch invoice and related booking
        const validInvoiceId = validateId(invoiceId);
        if (!validInvoiceId) {
          throw new Error(`Invalid invoice ID: ${invoiceId}`);
        }
        
        // Fetch invoice details
        const invoiceResponse = await invoiceService.getInvoice(validInvoiceId);
        
        if (!invoiceResponse || !invoiceResponse.invoice) {
          throw new Error('Invoice not found');
        }
        
        setInvoice(invoiceResponse.invoice);
        
        // Fetch related booking if available
        if (invoiceResponse.invoice.bookingId || invoiceResponse.invoice.booking_id) {
          const bookingId = invoiceResponse.invoice.bookingId || invoiceResponse.invoice.booking_id;
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
        
      } else if (bookingId) {
        // Booking-based flow: validate booking ID and fetch booking
        const validBookingId = validateId(bookingId);
        if (!validBookingId) {
          throw new Error(`Invalid booking ID: ${bookingId}`);
        }
        
        // Fetch booking details
        const bookingResponse = await bookingService.getBooking(validBookingId);
        
        if (!bookingResponse || !bookingResponse.booking) {
          throw new Error('Booking not found');
        }
        
        setBooking(bookingResponse.booking);
        
      } else {
        throw new Error('Either booking ID or invoice ID must be provided');
      }
      
      // Fetch payment methods from backend
      const methodsResponse = await paymentService.getPaymentMethods();
      
      // Ensure proper structure of payment methods
      if (!methodsResponse.methods || !Array.isArray(methodsResponse.methods)) {
        console.warn("Payment methods response format unexpected:", methodsResponse);
        setPaymentMethods([]);
      } else {
        // Format payment methods for display
        const formattedMethods = methodsResponse.methods.map(method => ({
          methodId: method.methodId?.toString() || method.id?.toString(),
          name: method.name,
          description: method.description,
          icon: getPaymentMethodIcon(method.name),
          enabled: method.enabled ?? true
        }));
        
        setPaymentMethods(formattedMethods);
        
        // Set default payment method if available
        if (formattedMethods.length > 0) {
          // Find first enabled method
          const defaultMethod = formattedMethods.find(m => m.enabled);
          if (defaultMethod) {
            setSelectedMethod(defaultMethod.methodId);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get icons for payment methods
  const getPaymentMethodIcon = (methodName) => {
    const methodNameLower = methodName?.toLowerCase();
    
    if (methodNameLower?.includes('manual') || methodNameLower?.includes('transfer')) {
      return FaMoneyBillWave;
    } else if (methodNameLower?.includes('credit') || methodNameLower?.includes('card')) {
      return FaCreditCard;
    } else if (methodNameLower?.includes('midtrans')) {
      return FaGlobe;
    } else {
      return FaMoneyBillWave; // Default icon
    }
  };  // Simplified payment processing using only two endpoints
  const handleProceed = async () => {
    if (!selectedMethod) {
      toast({
        title: 'Error',
        description: 'Please select a payment method',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Determine current IDs
    const currentInvoiceId = invoiceId || invoice?.invoiceId || invoice?.invoice_id;
    const currentBookingId = bookingId || booking?.bookingId || booking?.booking_id;
    const currentTenantId = booking?.tenantId || booking?.tenant_id || invoice?.tenantId || invoice?.tenant_id;
    
    // Check if we have required information
    if (!currentBookingId && !currentInvoiceId) {
      toast({
        title: 'Error',
        description: 'Payment information is missing',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setProcessing(true);
      
      // Use string comparison for methodId
      const methodDetails = paymentMethods.find(m => m.methodId.toString() === selectedMethod.toString());
      console.log('Processing payment for method:', methodDetails);
      
      // Enhanced manual payment detection
      const isManualPayment = methodDetails?.name?.toLowerCase().includes('manual') || 
        methodDetails?.name?.toLowerCase().includes('transfer') ||
        methodDetails?.category?.toLowerCase() === 'manual' ||
        methodDetails?.type?.toLowerCase().includes('manual') ||
        methodDetails?.name?.toLowerCase() === 'manual_transfer';
        console.log('Is manual payment in handleProceed:', isManualPayment);
      
      if (isManualPayment) {
        // Manual payment: show form and notification
        console.log('Setting showManualForm to TRUE in handleProceed');
        setShowManualForm(true);
        
        toast({
          title: 'Manual Payment Selected',
          description: 'Please fill out the form below to upload your payment proof.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // MIDTRANS PAYMENT: Use POST /v1/invoices/generate
      const invoiceData = {
        enable_midtrans: true,
        notes: 'Payment via Midtrans'
      };
      
      // Add required fields based on available data
      if (currentBookingId) {
        invoiceData.booking_id = currentBookingId;
        invoiceData.tenant_id = currentTenantId;
        invoiceData.due_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        
        // Add items for booking
        if (booking) {
          invoiceData.items = [
            {
              description: 'Room rental payment',
              quantity: 1,
              unit_price: booking?.totalAmount || booking?.total_amount || booking?.amount || 0,
              total: booking?.totalAmount || booking?.total_amount || booking?.amount || 0
            }
          ];
        }
      }
      
      console.log('Generating invoice with Midtrans using POST /v1/invoices/generate:', invoiceData);
      
      const response = await paymentService.generateInvoiceWithMidtrans(invoiceData);
      
      console.log('Invoice generation response:', response);
      
      if (response.midtransRedirectUrl || response.midtrans_redirect_url) {
        const redirectUrl = response.midtransRedirectUrl || response.midtrans_redirect_url;
        
        toast({
          title: 'Payment Link Created',
          description: 'Redirecting to Midtrans payment page...',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Redirect to Midtrans payment page
        console.log('Redirecting to Midtrans payment URL:', redirectUrl);
        window.location.href = redirectUrl;
        
      } else {
        throw new Error('Failed to generate Midtrans payment link. Response: ' + JSON.stringify(response));
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      toast({
        title: 'Payment Error',
        description: err.message || 'Failed to process payment',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessing(false);
    }
  };// Handle Midtrans payment completion from redirect component
  const handlePaymentComplete = (result) => {
    onClose();
    
    if (result.status === 'success') {
      toast({
        title: 'Payment Successful',
        description: 'Your payment has been processed successfully and will be verified shortly.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Navigate to payment status page or booking details
      if (generatedInvoiceId) {
        navigate(`/tenant/invoices/${generatedInvoiceId}`);
      } else {
        navigate(`/tenant/bookings/${booking.bookingId}`);
      }
    } else if (result.status === 'failed') {
      toast({
        title: 'Payment Failed',
        description: 'Your payment could not be processed. Please try again with a different payment method.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  // Handle cancellation of Midtrans payment
  const handlePaymentCancel = () => {
    onClose();
    toast({
      title: 'Payment Cancelled',
      description: 'Payment process was cancelled. You can try again anytime.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  // Handle manual payment method selection
  const handleManualMethodSelect = (methodId) => {
    setSelectedMethod(methodId);
    setShowManualForm(true);
  };  // Update: Show manual form immediately when manual method is selected
  const handleMethodChange = (methodId) => {
    console.log('=== handleMethodChange called ===');
    console.log('methodId:', methodId);
    
    setSelectedMethod(methodId);
    const methodDetails = paymentMethods.find(m => m.methodId.toString() === methodId.toString());
    
    console.log('Method selected:', methodId);
    console.log('Method details:', methodDetails);
    console.log('All payment methods:', paymentMethods);
    
    const isManualPayment = methodDetails?.name?.toLowerCase().includes('manual') || 
      methodDetails?.name?.toLowerCase().includes('transfer') ||
      methodDetails?.category?.toLowerCase() === 'manual' ||
      methodDetails?.type?.toLowerCase().includes('manual') ||
      methodDetails?.name?.toLowerCase() === 'manual_transfer';
    
    console.log('Is manual payment:', isManualPayment);
    console.log('Method name check:', methodDetails?.name?.toLowerCase());
      // Use React's functional setState to ensure state update
    if (isManualPayment) {
      console.log('Setting showManualForm to TRUE');
      setShowManualForm(prevState => {
        console.log('Previous showManualForm state:', prevState);
        console.log('Setting showManualForm to: true');
        return true;
      });
      // Force immediate logging
      setTimeout(() => {
        console.log('=== Timeout check: showManualForm should be true now ===');
      }, 100);
    } else {
      console.log('Setting showManualForm to FALSE');
      setShowManualForm(prevState => {
        console.log('Previous showManualForm state:', prevState);
        console.log('Setting showManualForm to: false');
        return false;
      });
      // Reset manual form state when switching away
      setSelectedFile(null);
      setManualPaymentData({
        paymentChannel: '',
        notes: '',
        bankName: '',
        accountNumber: '',
        accountHolderName: '',
        transferDate: new Date().toISOString().split('T')[0],
        fileName: '',
        fileType: '',
        content: ''
      });
    }
    
    console.log('showManualForm state after change should be:', isManualPayment);
  };

  // Handle file upload for manual payment
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload JPG, PNG, or PDF files only',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Please upload files smaller than 5MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setSelectedFile(file);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64Content = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        setManualPaymentData(prev => ({
          ...prev,
          fileName: file.name,
          fileType: file.type,
          content: base64Content
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  // Handle manual payment form submission
  const handleManualPaymentSubmit = async () => {
    console.log('=== Starting manual payment submission ===');
    
    // Validate required fields
    if (!selectedFile) {
      toast({
        title: 'Missing File',
        description: 'Please upload your payment proof',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!manualPaymentData.bankName || !manualPaymentData.accountNumber || !manualPaymentData.accountHolderName) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required bank transfer details',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setUploadingManual(true);
      console.log('Upload state set to true');

      // Get current IDs
      const currentInvoiceId = invoiceId || invoice?.invoiceId || invoice?.invoice_id;
      const currentBookingId = bookingId || booking?.bookingId || booking?.booking_id;
      const currentTenantId = booking?.tenantId || booking?.tenant_id || invoice?.tenantId || invoice?.tenant_id;
      const currentAmount = booking?.totalAmount || booking?.total_amount || invoice?.amount || invoice?.total_amount || 0;

      console.log('Current IDs:', {
        currentInvoiceId,
        currentBookingId,
        currentTenantId,
        currentAmount
      });

      // Prepare manual payment data
      const paymentData = {
        bookingId: currentBookingId ? parseInt(currentBookingId) : 0,
        tenantId: currentTenantId ? parseInt(currentTenantId) : 0,
        invoiceId: currentInvoiceId ? parseInt(currentInvoiceId) : 0,
        amount: currentAmount,
        paymentChannel: manualPaymentData.paymentChannel || 'bank_transfer',
        notes: manualPaymentData.notes || 'Manual bank transfer payment',
        bankName: manualPaymentData.bankName,
        accountNumber: manualPaymentData.accountNumber,
        accountHolderName: manualPaymentData.accountHolderName,        transferDate: new Date(manualPaymentData.transferDate).toISOString(),
        fileName: manualPaymentData.fileName,
        fileType: manualPaymentData.fileType,
        imageContent: manualPaymentData.content,
        contentEncoding: 'base64'
      };

      console.log('=== Payment data prepared ===');
      console.log('PaymentData:', JSON.stringify(paymentData, null, 2));

      // Submit to /v1/payments/manual
      console.log('Calling paymentService.createManualPayment...');
      const response = await paymentService.createManualPayment(paymentData);
      console.log('=== Payment service response ===');
      console.log('Response:', response);

      toast({
        title: 'Payment Proof Uploaded',
        description: 'Your payment proof has been submitted successfully. It will be verified by our admin team.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Navigate to appropriate page
      console.log('Navigating after successful submission...');
      if (currentInvoiceId) {
        navigate(`/tenant/invoices/${currentInvoiceId}`);
      } else if (currentBookingId) {
        navigate(`/tenant/bookings/${currentBookingId}`);
      } else {
        navigate('/tenant/bookings');
      }

    } catch (error) {
      console.error('=== Manual payment submission error ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload payment proof. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      console.log('Setting upload state to false');
      setUploadingManual(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <TenantLayout>
        <Container maxW="container.md" py={8}>
          <VStack spacing={8} align="center">
            <Spinner size="xl" thickness="4px" color="brand.500" />
            <Text>Loading payment options...</Text>
          </VStack>
        </Container>
      </TenantLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <TenantLayout>
        <Container maxW="container.md" py={8}>          <VStack spacing={4} align="stretch">
            <Button 
              leftIcon={<FaArrowLeft />} 
              variant="outline" 
              onClick={() => {
                if (invoiceId) {
                  navigate(`/tenant/invoices/${invoiceId}`);
                } else if (bookingId) {
                  navigate(`/tenant/bookings/${bookingId}`);
                } else {
                  navigate('/tenant/bookings');
                }
              }}
            >
              Back
            </Button>
            
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
            
            <Button onClick={fetchData} colorScheme="blue">
              Retry
            </Button>
          </VStack>
        </Container>
      </TenantLayout>
    );
  }

  // Debug: Check render state
  console.log('RENDER - showManualForm:', showManualForm);
  console.log('RENDER - selectedMethod:', selectedMethod);

  return (
    <TenantLayout>      <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="stretch">
          <Button 
            leftIcon={<FaArrowLeft />} 
            variant="outline" 
            onClick={() => {
              if (invoiceId) {
                navigate(`/tenant/invoices/${invoiceId}`);
              } else if (bookingId || booking?.bookingId || booking?.booking_id) {
                const currentBookingId = bookingId || booking?.bookingId || booking?.booking_id;
                navigate(`/tenant/bookings/${currentBookingId}`);
              } else {
                navigate('/tenant/bookings');
              }
            }}
            alignSelf="flex-start"
          >
            Back
          </Button>
          
          <Heading size="lg">Choose Payment Method</Heading>
          
          <PaymentSummary booking={booking} />
          
          <Box>
            <Text fontSize="lg" fontWeight="semibold" mb={4}>
              Select your preferred payment method:
            </Text>
            
            <RadioGroup onChange={handleMethodChange} value={selectedMethod}>
              <Stack direction="column" spacing={4}>
                {paymentMethods.map(method => (
                  <Card 
                    key={method.methodId} 
                    variant={selectedMethod === method.methodId.toString() ? 'filled' : 'outline'}
                    borderWidth={selectedMethod === method.methodId.toString() ? 2 : 1}
                    borderColor={selectedMethod === method.methodId.toString() ? 'brand.500' : 'gray.200'}
                  >
                    <CardBody>
                      <Radio 
                        value={method.methodId.toString()} 
                        isChecked={selectedMethod === method.methodId.toString()}
                        size="lg"
                        colorScheme="brand"
                      >
                        <HStack spacing={3}>
                          <Icon 
                            as={method.name === 'midtrans' ? FaCreditCard : FaMobileAlt} 
                            boxSize={6} 
                            color="brand.500"
                          />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold">
                              {method.name === 'midtrans' ? 'Online Payment' : 'Manual Transfer'}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              {method.name === 'midtrans' 
                                ? 'Credit Card, Bank Transfer, E-Wallet, QRIS' 
                                : 'Transfer to our bank account and upload receipt'}
                            </Text>
                          </VStack>
                        </HStack>
                      </Radio>
                    </CardBody>
                  </Card>
                ))}
              </Stack>
            </RadioGroup>          </Box>
          
          {/* Manual Payment Form */}
          {console.log('=== RENDER: showManualForm state ===', showManualForm)}
          {showManualForm && (
            <Card border="2px solid" borderColor="brand.500" bg="brand.50">
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <HStack spacing={3} mb={4}>
                      <Icon as={FaUniversity} color="brand.500" boxSize={6} />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" fontSize="lg">Manual Payment</Text>
                        <Text fontSize="sm" color="gray.600">
                          Pay using your preferred method and upload payment proof
                        </Text>
                      </VStack>
                    </HStack>
                    
                    {/* Bank Details */}
                    <Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200" mb={6}>
                      <Text fontWeight="bold" mb={3}>Transfer to:</Text>
                      <VStack align="stretch" spacing={2}>
                        <HStack justify="space-between">
                          <Text fontWeight="medium">Bank:</Text>
                          <Text>Bank Central Asia (BCA)</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontWeight="medium">Account Number:</Text>
                          <Text fontFamily="mono">1234567890</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontWeight="medium">Account Name:</Text>
                          <Text>PT Rusunawa Management</Text>
                        </HStack>
                        <Divider />
                        <HStack justify="space-between">
                          <Text fontWeight="bold">Amount:</Text>
                          <Text fontWeight="bold" color="brand.500">
                            Rp {(booking?.totalAmount || booking?.total_amount || booking?.amount || 0).toLocaleString('id-ID')}
                          </Text>
                        </HStack>
                      </VStack>
                    </Box>
                  </Box>
                  
                  {/* Transfer Details Form */}
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>
                        {manualPaymentData.paymentChannel === 'bank_transfer' || !manualPaymentData.paymentChannel ? 'Transfer From (Bank Name)' :
                         manualPaymentData.paymentChannel === 'digital_wallet' ? 'Transfer From (Wallet/App)' :
                         manualPaymentData.paymentChannel === 'cash' ? 'Payment Location' :
                         'Transfer From'}
                      </FormLabel>
                      <Input
                        placeholder={
                          manualPaymentData.paymentChannel === 'bank_transfer' || !manualPaymentData.paymentChannel ? "e.g., BCA, Mandiri, BNI, BRI" :
                          manualPaymentData.paymentChannel === 'digital_wallet' ? "e.g., DANA, OVO, GoPay, ShopeePay" :
                          manualPaymentData.paymentChannel === 'flip' ? "Flip" :
                          manualPaymentData.paymentChannel === 'cash' ? "e.g., Office, Bank Counter" :
                          "Payment source/method"
                        }
                        value={manualPaymentData.bankName}
                        onChange={(e) => setManualPaymentData(prev => ({
                          ...prev,
                          bankName: e.target.value
                        }))}
                      />
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel>
                        {manualPaymentData.paymentChannel === 'bank_transfer' || !manualPaymentData.paymentChannel ? 'Your Account Number' :
                         manualPaymentData.paymentChannel === 'digital_wallet' ? 'Your Phone/Account Number' :
                         manualPaymentData.paymentChannel === 'cash' ? 'Reference Number' :
                         'Account/Reference Number'}
                      </FormLabel>
                      <Input
                        placeholder={
                          manualPaymentData.paymentChannel === 'bank_transfer' || !manualPaymentData.paymentChannel ? "Bank account number used for transfer" :
                          manualPaymentData.paymentChannel === 'digital_wallet' ? "Phone number or account ID" :
                          manualPaymentData.paymentChannel === 'cash' ? "Receipt or reference number" :
                          "Account number or reference"
                        }
                        value={manualPaymentData.accountNumber}
                        onChange={(e) => setManualPaymentData(prev => ({
                          ...prev,
                          accountNumber: e.target.value
                        }))}
                      />
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel>
                        {manualPaymentData.paymentChannel === 'cash' ? 'Payer Name' : 'Account Holder Name'}
                      </FormLabel>
                      <Input
                        placeholder={
                          manualPaymentData.paymentChannel === 'cash' ? "Name of person making payment" :
                          "Name on the account/wallet"
                        }
                        value={manualPaymentData.accountHolderName}
                        onChange={(e) => setManualPaymentData(prev => ({
                          ...prev,
                          accountHolderName: e.target.value
                        }))}
                      />
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel>
                        {manualPaymentData.paymentChannel === 'cash' ? 'Payment Date' : 'Transfer Date'}
                      </FormLabel>
                      <Input
                        type="date"
                        value={manualPaymentData.transferDate}
                        onChange={(e) => setManualPaymentData(prev => ({
                          ...prev,
                          transferDate: e.target.value
                        }))}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </FormControl>
                  </SimpleGrid>
                  
                  <FormControl>
                    <FormLabel>Payment Channel</FormLabel>
                    <Select
                      value={manualPaymentData.paymentChannel}
                      onChange={(e) => setManualPaymentData(prev => ({
                        ...prev,
                        paymentChannel: e.target.value
                      }))}
                      placeholder="Select transfer method"
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
                      <option value="atm">ATM Transfer</option>
                      <option value="internet_banking">Internet Banking</option>
                      <option value="mobile_banking">Mobile Banking</option>
                      <option value="cash">Cash Payment</option>
                      <option value="other">Other</option>
                    </Select>
                  </FormControl>
                  
                  {/* Contextual Help Based on Payment Channel */}
                  {manualPaymentData.paymentChannel && (
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <Box>
                        <Text fontWeight="medium">
                          {manualPaymentData.paymentChannel === 'bank_transfer' && 'Bank Transfer Instructions'}
                          {manualPaymentData.paymentChannel === 'digital_wallet' && 'Digital Wallet Payment'}
                          {manualPaymentData.paymentChannel === 'flip' && 'Flip Transfer'}
                          {manualPaymentData.paymentChannel === 'cash' && 'Cash Payment'}
                          {['bibit', 'jenius', 'livin', 'blu', 'seabank', 'jago', 'neobank'].includes(manualPaymentData.paymentChannel) && 'Digital Banking Transfer'}
                          {['atm', 'internet_banking', 'mobile_banking'].includes(manualPaymentData.paymentChannel) && 'Traditional Banking Transfer'}
                          {manualPaymentData.paymentChannel === 'other' && 'Other Payment Method'}
                        </Text>
                        <Text fontSize="sm">
                          {manualPaymentData.paymentChannel === 'bank_transfer' && 'Transfer to our bank account using any banking method. Upload your transfer receipt as proof.'}
                          {manualPaymentData.paymentChannel === 'digital_wallet' && 'Pay using your digital wallet (DANA, OVO, GoPay, ShopeePay, etc.). Screenshot the transaction success page as proof.'}
                          {manualPaymentData.paymentChannel === 'flip' && 'Transfer using Flip to our bank account. Upload the Flip transaction receipt as proof.'}
                          {manualPaymentData.paymentChannel === 'cash' && 'Make cash payment at our office or authorized location. Keep the payment receipt as proof.'}
                          {['bibit', 'jenius', 'livin', 'blu', 'seabank', 'jago', 'neobank'].includes(manualPaymentData.paymentChannel) && 'Transfer using your digital banking app. Upload the transaction receipt as proof.'}
                          {['atm', 'internet_banking', 'mobile_banking'].includes(manualPaymentData.paymentChannel) && 'Use your preferred banking method to transfer. Upload the receipt as proof.'}
                          {manualPaymentData.paymentChannel === 'other' && 'Use your preferred payment method and provide transaction details. Upload payment proof.'}
                        </Text>
                      </Box>
                    </Alert>
                  )}
                  
                  <FormControl>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <Textarea
                      placeholder={
                        manualPaymentData.paymentChannel === 'bank_transfer' ? "e.g., Transfer via internet banking, ATM reference number, etc." :
                        manualPaymentData.paymentChannel === 'digital_wallet' ? "e.g., Transaction ID, reference number, wallet app used, etc." :
                        manualPaymentData.paymentChannel === 'flip' ? "e.g., Flip transaction ID, recipient name, etc." :
                        "Additional notes about your payment..."
                      }
                      value={manualPaymentData.notes}
                      onChange={(e) => setManualPaymentData(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))}
                      rows={3}
                    />
                  </FormControl>
                  
                  {/* File Upload */}
                  <FormControl isRequired>
                    <FormLabel>
                      {manualPaymentData.paymentChannel === 'bank_transfer' || !manualPaymentData.paymentChannel ? 'Upload Transfer Receipt' :
                       manualPaymentData.paymentChannel === 'digital_wallet' ? 'Upload Transaction Screenshot' :
                       manualPaymentData.paymentChannel === 'cash' ? 'Upload Payment Receipt' :
                       'Upload Payment Proof'}
                    </FormLabel>
                    <VStack spacing={3} align="stretch">
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        p={1}
                      />
                      <Text fontSize="sm" color="gray.500">
                        Upload your payment proof: {
                          manualPaymentData.paymentChannel === 'bank_transfer' || !manualPaymentData.paymentChannel ? 'bank transfer receipt or confirmation' :
                          manualPaymentData.paymentChannel === 'digital_wallet' ? 'wallet transaction screenshot or receipt' :
                          manualPaymentData.paymentChannel === 'flip' ? 'Flip transaction receipt' :
                          manualPaymentData.paymentChannel === 'cash' ? 'cash payment receipt' :
                          'payment confirmation or receipt'
                        } (JPG, PNG, or PDF, max 5MB)
                      </Text>
                      
                      {selectedFile && (
                        <Alert status="success" borderRadius="md">
                          <FaCheck />
                          <Box ml={2}>
                            <Text fontWeight="medium">File selected:</Text>
                            <Text fontSize="sm">{selectedFile.name}</Text>
                          </Box>
                        </Alert>
                      )}
                    </VStack>
                  </FormControl>
                  
                  {/* Submit Button */}
                  <HStack spacing={3}>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowManualForm(false);
                        setSelectedMethod(null);
                        setSelectedFile(null);
                        setManualPaymentData({
                          paymentChannel: '',
                          notes: '',
                          bankName: '',
                          accountNumber: '',
                          accountHolderName: '',
                          transferDate: new Date().toISOString().split('T')[0],
                          fileName: '',
                          fileType: '',
                          content: ''
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      colorScheme="brand"
                      leftIcon={<FaUpload />}
                      onClick={handleManualPaymentSubmit}
                      isLoading={uploadingManual}
                      loadingText="Uploading..."
                      flex={1}
                    >
                      Submit Payment Proof
                    </Button>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          )}
          
          <Divider />
          
          {!showManualForm && (
            <Button 
              size="lg" 
              colorScheme="brand" 
              onClick={handleProceed}
              isLoading={processing}
              loadingText="Processing"
              isDisabled={!selectedMethod || !booking}
            >
              Proceed to Payment
            </Button>
          )}
        </VStack>
      </Container>      {/* Midtrans Payment Modal */}
      <Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Complete Your Payment</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {midtransUrl && generatedInvoiceId ? (
              <MidtransPaymentRedirect
                paymentUrl={midtransUrl}
                orderId={`ORDER-${generatedInvoiceId}`}
                invoiceId={generatedInvoiceId}
                paymentMethod="midtrans"
                amount={booking?.totalAmount || booking?.amount || 0}
                onComplete={handlePaymentComplete}
                onCancel={handlePaymentCancel}
                autoOpen={true}
              />
            ) : (
              <VStack spacing={4} py={6}>
                <Spinner size="lg" color="brand.500" />
                <Text>Preparing payment...</Text>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </TenantLayout>
  );
};

export default PaymentMethodSelection;
