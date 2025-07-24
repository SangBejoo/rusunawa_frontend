import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Heading, Text, VStack, HStack, Badge, 
  Button, Flex, Spinner, Alert, AlertIcon, Divider, Table,
  Tbody, Tr, Td, Th, Thead, useColorModeValue, Grid, GridItem,
  Icon, Link
} from '@chakra-ui/react';
import {
  FaFileInvoiceDollar, FaCalendarAlt, FaClock, FaCheckCircle, 
  FaTimesCircle, FaArrowLeft, FaMoneyBillWave, FaDownload
} from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import paymentService from '../../services/paymentService';
import { formatDate } from '../../utils/dateUtils';

const InvoiceDetail = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);
  
  const fetchInvoice = async () => {
    if (!invoiceId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await paymentService.getInvoice(invoiceId);
      setInvoice(response.invoice);
    } catch (err) {
      console.error('Failed to fetch invoice:', err);
      setError(err.message || 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  // Get badge color based on status
  const getBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'green';
      case 'partially_paid':
        return 'yellow';
      case 'unpaid':
        return 'red';
      default:
        return 'gray';
    }
  };
    const handlePayNow = () => {
    navigate(`/tenant/invoices/${invoiceId}/pay`);
  };
  
  const handleViewPaymentHistory = () => {
    navigate('/tenant/payments/history');
  };
  
  const handleDownloadInvoice = () => {
    // Implement invoice download
    console.log('Download invoice:', invoiceId);
    // Actual implementation would connect to backend for PDF download
  };
  
  // UI colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  if (loading) {
    return (
      <TenantLayout>
        <Container maxW="container.md" py={8}>
          <VStack spacing={8} align="center">
            <Spinner size="xl" thickness="4px" color="brand.500" />
            <Text>Loading invoice details...</Text>
          </VStack>
        </Container>
      </TenantLayout>
    );
  }
  
  return (
    <TenantLayout>
      <Container maxW="container.lg" py={8}>
        <Button
          leftIcon={<FaArrowLeft />}
          onClick={() => navigate('/tenant/invoices/history')}
          mb={6}
          variant="outline"
        >
          Back to Invoices
        </Button>
        
        {error ? (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        ) : (
          <Box 
            bg={bgColor} 
            p={6} 
            borderRadius="lg" 
            borderWidth="1px" 
            borderColor={borderColor}
            boxShadow="sm"
          >
            {/* Invoice Header */}
            <Flex 
              direction={{ base: 'column', md: 'row' }}
              justify="space-between"
              align={{ base: 'flex-start', md: 'center' }}
              mb={6}
            >
              <HStack spacing={3} mb={{ base: 4, md: 0 }}>
                <Icon as={FaFileInvoiceDollar} boxSize="2em" color="brand.500" />
                <VStack align="flex-start" spacing={0}>
                  <Heading size="lg">Invoice #{invoice?.invoiceNumber}</Heading>
                  <Text color={mutedColor}>
                    {formatDate(invoice?.issueDate || invoice?.issue_date)}
                  </Text>
                </VStack>
              </HStack>
              
              <Badge 
                colorScheme={getBadgeColor(invoice?.status)} 
                fontSize="lg"
                px={3}
                py={1}
                borderRadius="md"
              >
                {invoice?.status?.toUpperCase()}
              </Badge>
            </Flex>
            
            <Divider my={4} />
            
            {/* Invoice Info */}
            <Grid 
              templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
              gap={6}
              mb={8}
            >
              <GridItem>
                <VStack align="stretch" spacing={4}>
                  <Box>
                    <Text fontSize="sm" color={mutedColor}>Invoice To</Text>
                    <Text fontWeight="bold">
                      {invoice?.tenant?.name || invoice?.tenant?.user?.full_name || 'Tenant'}
                    </Text>
                    <Text>
                      {invoice?.tenant?.email || invoice?.tenant?.user?.email || 'No email provided'}
                    </Text>
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" color={mutedColor}>Room</Text>
                    <Text>
                      {invoice?.booking?.room?.name || `Room #${invoice?.booking?.roomId || 'Unknown'}`}
                    </Text>
                  </Box>
                </VStack>
              </GridItem>
              
              <GridItem>
                <VStack align={{ base: 'stretch', md: 'flex-end' }} spacing={4}>
                  <HStack justifyContent={{ base: 'flex-start', md: 'flex-end' }}>
                    <Icon as={FaCalendarAlt} color={mutedColor} />
                    <Text fontSize="sm" color={mutedColor}>Due Date:</Text>
                    <Text fontWeight="bold">
                      {formatDate(invoice?.dueDate || invoice?.due_date)}
                    </Text>
                  </HStack>
                  
                  {invoice?.status === 'paid' && invoice?.paidDate && (
                    <HStack justifyContent={{ base: 'flex-start', md: 'flex-end' }}>
                      <Icon as={FaCheckCircle} color="green.500" />
                      <Text fontSize="sm" color={mutedColor}>Paid Date:</Text>
                      <Text fontWeight="bold">
                        {formatDate(invoice?.paidDate || invoice?.paid_at)}
                      </Text>
                    </HStack>
                  )}
                  
                  {invoice?.status === 'unpaid' && (
                    <HStack justifyContent={{ base: 'flex-start', md: 'flex-end' }}>
                      <Icon as={FaClock} color="red.500" />
                      <Text fontSize="sm" color="red.500">
                        {new Date(invoice?.dueDate) < new Date() ? 
                          'Payment Overdue!' : 'Payment Pending'}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </GridItem>
            </Grid>
            
            {/* Invoice Items */}
            <Box
              overflowX="auto"
              mb={8}
            >
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Description</Th>
                    <Th isNumeric>Quantity</Th>
                    <Th isNumeric>Unit Price</Th>
                    <Th isNumeric>Total</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {invoice?.items?.map(item => (
                    <Tr key={item.item_id}>
                      <Td>{item.description}</Td>
                      <Td isNumeric>{item.quantity}</Td>
                      <Td isNumeric>{formatCurrency(item.unit_price)}</Td>
                      <Td isNumeric>{formatCurrency(item.total)}</Td>
                    </Tr>
                  ))}
                  {!invoice?.items?.length && (
                    <Tr>
                      <Td>Room Booking</Td>
                      <Td isNumeric>1</Td>
                      <Td isNumeric>{formatCurrency(invoice?.totalAmount || invoice?.amount || 0)}</Td>
                      <Td isNumeric>{formatCurrency(invoice?.totalAmount || invoice?.amount || 0)}</Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
            
            {/* Invoice Total & Actions */}
            <Box borderTopWidth="1px" borderColor={borderColor} pt={4}>
              <Flex 
                direction={{ base: 'column', md: 'row' }}
                justify="space-between"
                align={{ base: 'stretch', md: 'center' }}
              >
                <VStack align={{ base: 'stretch', md: 'flex-start' }} mb={{ base: 4, md: 0 }}>
                  <HStack>
                    <Text fontSize="lg">Total Amount:</Text>
                    <Text fontSize="xl" fontWeight="bold">
                      {formatCurrency(invoice?.totalAmount || invoice?.amount || 0)}
                    </Text>
                  </HStack>
                  
                  {invoice?.notes && (
                    <Text fontSize="sm" color={mutedColor}>
                      Note: {invoice.notes}
                    </Text>
                  )}
                </VStack>
                
                <HStack spacing={4}>
                  {invoice?.status === 'paid' ? (
                    <Button
                      leftIcon={<FaDownload />}
                      colorScheme="green"
                      variant="outline"
                      onClick={handleDownloadInvoice}
                    >
                      Download Receipt
                    </Button>
                  ) : (
                    <Button
                      leftIcon={<FaMoneyBillWave />}
                      colorScheme="green"
                      onClick={handlePayNow}
                    >
                      Pay Now
                    </Button>
                  )}
                </HStack>
              </Flex>
            </Box>
          </Box>
        )}
      </Container>
    </TenantLayout>
  );
};

export default InvoiceDetail;
