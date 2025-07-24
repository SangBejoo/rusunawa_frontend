import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  Code,
  Textarea,
  useToast,
  Divider,
  SimpleGrid,
  Badge
} from '@chakra-ui/react';
import TenantLayout from '../../components/layout/TenantLayout';
import paymentService from '../../services/paymentService';
import invoiceService from '../../services/invoiceService';

const PaymentTesting = () => {
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState([]);
  const [testData, setTestData] = useState({
    bookingId: 1,
    tenantId: 1,
    amount: 10000,
    invoiceId: 9
  });
  const toast = useToast();

  const addResponse = (action, data) => {
    setResponses(prev => [{
      id: Date.now(),
      action,
      data,
      timestamp: new Date().toLocaleTimeString()
    }, ...prev]);
  };

  const testGenerateInvoice = async () => {
    try {
      setLoading(true);
      const invoiceData = {
        booking_id: testData.bookingId,
        tenant_id: testData.tenantId,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Test invoice generation',
        items: [
          {
            description: 'Room rental payment',
            quantity: 1,
            unit_price: testData.amount,
            total: testData.amount
          }
        ],
        enable_midtrans: true
      };

      const response = await paymentService.generateInvoiceWithMidtrans(invoiceData);
      addResponse('Generate Invoice with Midtrans', response);
      
      toast({
        title: 'Success',
        description: 'Invoice generated successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      addResponse('Generate Invoice Error', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate invoice',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const testCreateManualPayment = async () => {
    try {
      setLoading(true);      const paymentData = {
        bookingId: testData.bookingId,
        tenantId: testData.tenantId,
        invoiceId: testData.invoiceId,
        amount: testData.amount,
        paymentChannel: 'bank_transfer',
        notes: 'Test manual payment',
        bankName: 'BCA',
        accountNumber: '1234567890',
        accountHolderName: 'Test User',
        transferDate: new Date().toISOString(),
        fileName: 'test_receipt.jpg',
        fileType: 'image/jpeg',
        imageContent: 'base64_dummy_content',
        contentEncoding: 'base64'
      };

      const response = await paymentService.createManualPayment(paymentData);
      addResponse('Create Manual Payment', response);
      
      toast({
        title: 'Success',
        description: 'Manual payment created successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      addResponse('Manual Payment Error', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create manual payment',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const testMidtransCallback = async () => {
    try {
      setLoading(true);
      const callbackData = {
        order_id: `ORDER-${testData.invoiceId}-test123`,
        transaction_id: 'test-txn-' + Date.now(),
        status_code: '200',
        transaction_status: 'settlement',
        payment_type: 'bank_transfer',
        gross_amount: testData.amount.toString() + '.00',
        transaction_time: new Date().toISOString(),
        signature_key: 'test_signature_key'
      };

      const response = await paymentService.handleMidtransCallback(callbackData);
      addResponse('Midtrans Callback', response);
      
      toast({
        title: 'Success',
        description: 'Midtrans callback processed successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      addResponse('Midtrans Callback Error', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process callback',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const testGetData = async (type) => {
    try {
      setLoading(true);
      let response;
      
      switch (type) {
        case 'payments':
          response = await paymentService.getPayments();
          break;
        case 'invoices':
          response = await paymentService.getInvoices();
          break;
        case 'invoice':
          response = await paymentService.getInvoice(testData.invoiceId);
          break;
        default:
          throw new Error('Unknown test type');
      }
      
      addResponse(`Get ${type}`, response);
      
      toast({
        title: 'Success',
        description: `${type} data fetched successfully`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      addResponse(`Get ${type} Error`, error);
      toast({
        title: 'Error',
        description: error.message || `Failed to fetch ${type}`,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TenantLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Heading size="lg">Payment System Testing</Heading>
          
          {/* Test Configuration */}
          <Card>
            <CardHeader>
              <Heading size="md">Test Configuration</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                <FormControl>
                  <FormLabel>Booking ID</FormLabel>
                  <Input
                    type="number"
                    value={testData.bookingId}
                    onChange={(e) => setTestData({...testData, bookingId: parseInt(e.target.value)})}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Tenant ID</FormLabel>
                  <Input
                    type="number"
                    value={testData.tenantId}
                    onChange={(e) => setTestData({...testData, tenantId: parseInt(e.target.value)})}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Amount</FormLabel>
                  <Input
                    type="number"
                    value={testData.amount}
                    onChange={(e) => setTestData({...testData, amount: parseInt(e.target.value)})}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Invoice ID</FormLabel>
                  <Input
                    type="number"
                    value={testData.invoiceId}
                    onChange={(e) => setTestData({...testData, invoiceId: parseInt(e.target.value)})}
                  />
                </FormControl>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Test Actions */}
          <Card>
            <CardHeader>
              <Heading size="md">Test Actions</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                <Button
                  colorScheme="blue"
                  onClick={testGenerateInvoice}
                  isLoading={loading}
                  loadingText="Testing..."
                >
                  Generate Invoice + Midtrans
                </Button>
                
                <Button
                  colorScheme="green"
                  onClick={testCreateManualPayment}
                  isLoading={loading}
                  loadingText="Testing..."
                >
                  Create Manual Payment
                </Button>
                
                <Button
                  colorScheme="orange"
                  onClick={testMidtransCallback}
                  isLoading={loading}
                  loadingText="Testing..."
                >
                  Test Midtrans Callback
                </Button>
                
                <Button
                  colorScheme="purple"
                  onClick={() => testGetData('payments')}
                  isLoading={loading}
                  loadingText="Testing..."
                >
                  Get All Payments
                </Button>
                
                <Button
                  colorScheme="teal"
                  onClick={() => testGetData('invoices')}
                  isLoading={loading}
                  loadingText="Testing..."
                >
                  Get All Invoices
                </Button>
                
                <Button
                  colorScheme="cyan"
                  onClick={() => testGetData('invoice')}
                  isLoading={loading}
                  loadingText="Testing..."
                >
                  Get Specific Invoice
                </Button>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* API Responses */}
          <Card>
            <CardHeader>
              <Heading size="md">API Responses</Heading>
              {responses.length > 0 && (
                <Button size="sm" onClick={() => setResponses([])}>
                  Clear Responses
                </Button>
              )}
            </CardHeader>
            <CardBody>
              {responses.length === 0 ? (
                <Text color="gray.500">No API responses yet. Run some tests above.</Text>
              ) : (
                <VStack spacing={4} align="stretch">
                  {responses.map((response) => (
                    <Box key={response.id} p={4} borderWidth="1px" borderRadius="md">
                      <HStack justify="space-between" mb={2}>
                        <Badge colorScheme="blue">{response.action}</Badge>
                        <Text fontSize="sm" color="gray.500">{response.timestamp}</Text>
                      </HStack>
                      <Code
                        p={3}
                        borderRadius="md"
                        fontSize="sm"
                        maxH="200px"
                        overflowY="auto"
                        display="block"
                        whiteSpace="pre-wrap"
                      >
                        {JSON.stringify(response.data, null, 2)}
                      </Code>
                    </Box>
                  ))}
                </VStack>
              )}
            </CardBody>
          </Card>

          {/* API Documentation */}
          <Card>
            <CardHeader>
              <Heading size="md">API Endpoints</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                <Box>
                  <Badge colorScheme="green">POST</Badge>
                  <Code ml={2}>/v1/invoices/generate</Code>
                  <Text fontSize="sm" color="gray.500">Generate invoice with Midtrans integration</Text>
                </Box>
                <Box>
                  <Badge colorScheme="blue">POST</Badge>
                  <Code ml={2}>/v1/payments/manual</Code>
                  <Text fontSize="sm" color="gray.500">Create manual payment with proof upload</Text>
                </Box>
                <Box>
                  <Badge colorScheme="orange">POST</Badge>
                  <Code ml={2}>/v1/payments/midtrans-callback</Code>
                  <Text fontSize="sm" color="gray.500">Process Midtrans payment callback</Text>
                </Box>
                <Box>
                  <Badge colorScheme="purple">GET</Badge>
                  <Code ml={2}>/v1/payments</Code>
                  <Text fontSize="sm" color="gray.500">Get all payments</Text>
                </Box>
                <Box>
                  <Badge colorScheme="teal">GET</Badge>
                  <Code ml={2}>/v1/invoices</Code>
                  <Text fontSize="sm" color="gray.500">Get all invoices</Text>
                </Box>
                <Box>
                  <Badge colorScheme="cyan">GET</Badge>
                  <Code ml={2}>/v1/invoices/:id</Code>
                  <Text fontSize="sm" color="gray.500">Get specific invoice</Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </TenantLayout>
  );
};

export default PaymentTesting;
