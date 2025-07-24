import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Alert,
  AlertIcon,
  Icon,
  Tooltip,
  useToast
} from '@chakra-ui/react';
import {
  FaDownload,
  FaPrint,
  FaEye,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaFileInvoice,
  FaArrowLeft
} from 'react-icons/fa';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useNavigate, useParams } from 'react-router-dom';

const TenantInvoiceDetail = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchInvoiceDetail();
  }, [invoiceId]);

  const fetchInvoiceDetail = async () => {
    setLoading(true);
    try {
      const tenantData = JSON.parse(localStorage.getItem('tenant'));
      const tenantId = tenantData?.tenant_id;

      if (!tenantId) {
        throw new Error('Tenant ID not found');
      }

      const response = await fetch(`/v1/tenants/${tenantId}/invoices/${invoiceId}?include_payments=true&include_items=true&include_proof_metadata=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoice details');
      }

      const data = await response.json();
      setInvoice(data.invoice);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load invoice details',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'green';
      case 'unpaid':
        return 'red';
      case 'overdue':
        return 'orange';
      case 'cancelled':
        return 'gray';
      default:
        return 'blue';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const downloadInvoice = async () => {
    try {
      setPaymentLoading(true);
      const response = await fetch(`/v1/invoices/${invoiceId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `invoice-${invoice.invoice_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Invoice downloaded successfully',
        status: 'success',
        duration: 2000
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download invoice',
        status: 'error',
        duration: 3000
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const printInvoice = () => {
    window.print();
  };

  const proceedToPayment = () => {
    navigate(`/tenant/payments/methods?invoiceId=${invoiceId}&bookingId=${invoice.booking_id}`);
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading invoice details...</Text>
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Alert status="error">
        <AlertIcon />
        Invoice not found or you don't have permission to view it.
      </Alert>
    );
  }

  const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status !== 'paid';
  const canPay = invoice.status === 'unpaid' || invoice.status === 'overdue';

  return (
    <Box maxW="4xl" mx="auto" p={6}>
      {/* Header */}
      <HStack justify="space-between" mb={6}>
        <HStack>
          <Button
            leftIcon={<FaArrowLeft />}
            variant="outline"
            onClick={() => navigate('/tenant/invoices')}
          >
            Back to Invoices
          </Button>
          <Text fontSize="2xl" fontWeight="bold">
            Invoice #{invoice.invoice_id}
          </Text>
        </HStack>
        
        <HStack>
          <Button
            leftIcon={<FaDownload />}
            onClick={downloadInvoice}
            isLoading={paymentLoading}
            size="sm"
          >
            Download
          </Button>
          <Button
            leftIcon={<FaPrint />}
            onClick={printInvoice}
            size="sm"
            variant="outline"
          >
            Print
          </Button>
          {canPay && (
            <Button
              leftIcon={<FaMoneyBillWave />}
              colorScheme="green"
              onClick={proceedToPayment}
            >
              Pay Now
            </Button>
          )}
        </HStack>
      </HStack>

      {/* Status Alerts */}
      {isOverdue && (
        <Alert status="warning" mb={4}>
          <AlertIcon />
          This invoice is overdue. Please make payment as soon as possible to avoid late fees.
        </Alert>
      )}

      {invoice.status === 'paid' && (
        <Alert status="success" mb={4}>
          <AlertIcon />
          This invoice has been paid successfully.
        </Alert>
      )}

      <VStack spacing={6} align="stretch">
        {/* Invoice Summary */}
        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <HStack>
                <Icon as={FaFileInvoice} boxSize={6} color="blue.500" />
                <Text fontSize="lg" fontWeight="semibold">Invoice Details</Text>
              </HStack>
              <Badge colorScheme={getStatusColor(invoice.status)} fontSize="md" px={3} py={1}>
                {invoice.status?.toUpperCase()}
              </Badge>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="gray.500">Invoice Date</Text>
                  <Text fontWeight="semibold">
                    {format(new Date(invoice.created_at), 'dd MMMM yyyy', { locale: id })}
                  </Text>
                </VStack>
                
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="gray.500">Due Date</Text>
                  <Text fontWeight="semibold" color={isOverdue ? 'red.500' : 'inherit'}>
                    {format(new Date(invoice.due_date), 'dd MMMM yyyy', { locale: id })}
                  </Text>
                </VStack>
                
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="gray.500">Total Amount</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {formatCurrency(invoice.total_amount)}
                  </Text>
                </VStack>
              </HStack>
              
              {invoice.notes && (
                <>
                  <Divider />
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={2}>Notes</Text>
                    <Text>{invoice.notes}</Text>
                  </Box>
                </>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Invoice Items */}
        {invoice.items && invoice.items.length > 0 && (
          <Card>
            <CardHeader>
              <Text fontSize="lg" fontWeight="semibold">Invoice Items</Text>
            </CardHeader>
            <CardBody>
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
                  {invoice.items.map((item, index) => (
                    <Tr key={index}>
                      <Td>{item.description}</Td>
                      <Td isNumeric>{item.quantity}</Td>
                      <Td isNumeric>{formatCurrency(item.unit_price)}</Td>
                      <Td isNumeric fontWeight="semibold">
                        {formatCurrency(item.total)}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              
              <Divider my={4} />
              
              <HStack justify="flex-end">
                <VStack align="end" spacing={2}>
                  <HStack>
                    <Text>Subtotal:</Text>
                    <Text fontWeight="semibold">
                      {formatCurrency(invoice.items.reduce((sum, item) => sum + item.total, 0))}
                    </Text>
                  </HStack>
                  {invoice.tax_amount > 0 && (
                    <HStack>
                      <Text>Tax:</Text>
                      <Text fontWeight="semibold">
                        {formatCurrency(invoice.tax_amount)}
                      </Text>
                    </HStack>
                  )}
                  <Divider />
                  <HStack>
                    <Text fontSize="lg" fontWeight="bold">Total:</Text>
                    <Text fontSize="lg" fontWeight="bold" color="green.500">
                      {formatCurrency(invoice.total_amount)}
                    </Text>
                  </HStack>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        )}

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <Card>
            <CardHeader>
              <Text fontSize="lg" fontWeight="semibold">Payment History</Text>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {invoice.payments.map((payment) => (
                  <Box key={payment.payment_id} p={4} borderWidth={1} borderRadius="md">
                    <HStack justify="space-between" mb={2}>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold">
                          {formatCurrency(payment.amount)}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {payment.payment_method} • {payment.payment_channel}
                        </Text>
                      </VStack>
                      
                      <VStack align="end" spacing={1}>
                        <Badge colorScheme={getPaymentStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                        <Text fontSize="sm" color="gray.500">
                          {format(new Date(payment.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                        </Text>
                      </VStack>
                    </HStack>
                    
                    {payment.transaction_id && (
                      <Text fontSize="sm" color="gray.500" fontFamily="mono">
                        Transaction ID: {payment.transaction_id}
                      </Text>
                    )}
                    
                    {payment.notes && (
                      <Text fontSize="sm" mt={2}>
                        {payment.notes}
                      </Text>
                    )}
                    
                    {payment.payment_proof && (
                      <HStack mt={2}>
                        <Button
                          size="sm"
                          leftIcon={<FaEye />}
                          onClick={() => navigate(`/tenant/payments/${payment.payment_id}/proof`)}
                          variant="outline"
                        >
                          View Proof
                        </Button>
                      </HStack>
                    )}
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Payment Actions */}
        {canPay && (
          <Card>
            <CardBody>
              <VStack spacing={4}>
                <Text fontSize="lg" fontWeight="semibold" textAlign="center">
                  Ready to Pay?
                </Text>
                <Text textAlign="center" color="gray.600">
                  Choose your preferred payment method to complete this invoice.
                </Text>
                <Button
                  size="lg"
                  colorScheme="green"
                  leftIcon={<FaMoneyBillWave />}
                  onClick={proceedToPayment}
                  w="full"
                  maxW="300px"
                >
                  Proceed to Payment
                </Button>
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Box>
  );
};

export default TenantInvoiceDetail;
