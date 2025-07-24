import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Divider,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Radio,
  RadioGroup,
  Image,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaMoneyBillWave, FaCreditCard, FaMobile } from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import paymentService from '../../services/paymentService';
import invoiceService from '../../../services/invoiceService';
import { useTenantAuth } from '../../context/tenantAuthContext';

const PaymentMethod = () => {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const { tenant } = useTenantAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const cardBgColor = useColorModeValue('white', 'gray.700');
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch invoice details
        const invoiceResponse = await invoiceService.getInvoice(invoiceId);
        setInvoice(invoiceResponse.invoice);
        
        // Fetch payment methods
        const methodsResponse = await paymentService.getPaymentMethods();
        setPaymentMethods(methodsResponse.methods || []);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load payment information. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [invoiceId]);
  
  const handlePaymentSubmit = async () => {
    if (!selectedMethod) {
      toast({
        title: 'Please select a payment method',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await paymentService.createPayment(
        parseInt(invoiceId), 
        selectedMethod
      );
      
      toast({
        title: 'Payment initiated',
        description: 'You will be redirected to the payment page',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Redirect based on payment method type
      const method = paymentMethods.find(m => m.id === selectedMethod);
      
      if (method?.type === 'online') {
        // For online payments, redirect to payment processing page
        navigate(`/tenant/payments/process/${response.payment.payment_id}`);
      } else {
        // For manual payments, redirect to instructions page
        navigate(`/tenant/payments/manual/${response.payment.payment_id}`);
      }
      
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast({
        title: 'Payment initiation failed',
        description: error.message || 'Failed to start payment process',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
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
            leftIcon={<FaArrowLeft />}
            onClick={() => navigate('/tenant/invoices')}
          >
            Back to Invoices
          </Button>
        </Container>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Container maxW="container.lg" py={8}>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<FaArrowLeft />}
          onClick={() => navigate(`/tenant/invoices/${invoiceId}`)}
          mb={6}
        >
          Back to Invoice
        </Button>
        
        <Heading as="h1" size="xl" mb={6}>Choose Payment Method</Heading>
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Box gridColumn={{ md: "span 2" }}>
            <Card bg={cardBgColor} mb={6}>
              <CardHeader pb={0}>
                <Heading size="md">Payment Methods</Heading>
              </CardHeader>
              <CardBody>
                <RadioGroup onChange={setSelectedMethod} value={selectedMethod}>
                  <VStack spacing={4} align="stretch">
                    {paymentMethods.map(method => (
                      <Box 
                        key={method.id} 
                        borderWidth="1px" 
                        borderRadius="md" 
                        borderColor={selectedMethod === method.id ? "brand.500" : "gray.200"}
                        p={4}
                        _hover={{ borderColor: "brand.200" }}
                        cursor="pointer"
                        onClick={() => setSelectedMethod(method.id)}
                      >
                        <Radio value={method.id}>
                          <Flex align="center" justify="space-between" width="100%">
                            <HStack>
                              {method.type === 'manual' ? (
                                <FaMoneyBillWave />
                              ) : method.id.includes('gopay') ? (
                                <FaMobile />
                              ) : (
                                <FaCreditCard />
                              )}
                              <Text fontWeight="medium">{method.name}</Text>
                            </HStack>
                            
                            {method.logo && (
                              <Image 
                                src={method.logo} 
                                alt={method.name}
                                height="30px"
                              />
                            )}
                          </Flex>
                        </Radio>
                      </Box>
                    ))}
                  </VStack>
                </RadioGroup>
              </CardBody>
            </Card>
          </Box>
          
          <Box>
            <Card bg={cardBgColor} position={{ base: 'static', md: 'sticky' }} top="100px">
              <CardHeader pb={2}>
                <Heading size="md">Payment Summary</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontSize="sm" color="gray.500">Invoice Number</Text>
                    <Text fontWeight="medium">#{invoice.invoice_no}</Text>
                  </Box>
                  
                  {invoice.booking && (
                    <Box>
                      <Text fontSize="sm" color="gray.500">Room</Text>
                      <Text fontWeight="medium">{invoice.booking.room?.name || 'N/A'}</Text>
                    </Box>
                  )}
                  
                  <Divider />
                  
                  <Flex justify="space-between">
                    <Text>Subtotal</Text>
                    <Text>{formatCurrency(invoice.amount)}</Text>
                  </Flex>
                  
                  <Flex justify="space-between">
                    <Text>Processing Fee</Text>
                    <Text>{formatCurrency(0)}</Text>
                  </Flex>
                  
                  <Divider />
                  
                  <Flex justify="space-between" fontWeight="bold">
                    <Text>Total</Text>
                    <Text color="brand.500" fontSize="xl">{formatCurrency(invoice.amount)}</Text>
                  </Flex>
                </VStack>
              </CardBody>
              <CardFooter pt={0}>
                <Button
                  colorScheme="brand"
                  size="lg"
                  width="full"
                  isLoading={submitting}
                  loadingText="Processing..."
                  onClick={handlePaymentSubmit}
                  isDisabled={!selectedMethod}
                >
                  Pay Now
                </Button>
              </CardFooter>
            </Card>
          </Box>
        </SimpleGrid>
      </Container>
    </TenantLayout>
  );
};

export default PaymentMethod;
