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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  Grid,
  GridItem,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Image,
} from '@chakra-ui/react';
import { FaDownload, FaEye, FaFileInvoice, FaReceipt } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import * as paymentService from '../../services/paymentService';

const TenantInvoiceDetails = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentProof, setSelectedPaymentProof] = useState(null);
  const { isOpen: isProofOpen, onOpen: onProofOpen, onClose: onProofClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    fetchInvoiceDetails();
  }, [invoiceId]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      const tenantId = localStorage.getItem('tenantId'); // Assuming tenant ID is stored in localStorage
      
      const response = await paymentService.getTenantInvoiceById(tenantId, invoiceId, {
        includePayments: true,
        includeItems: true,
        includeProofMetadata: true,
      });
      
      setInvoice(response.invoice);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch invoice details',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      console.error('Error fetching invoice details:', error);
    } finally {
      setLoading(false);
    }
  };
  const viewPaymentProof = async (paymentId) => {
    try {
      // Find the payment in the invoice payments array
      const payment = invoice.payments?.find(p => p.id === paymentId);
      if (!payment || !payment.paymentProof) {
        toast({
          title: 'Error',
          description: 'Payment proof not found',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Use embedded base64 content from payment proof
      const proof = payment.paymentProof;
      if (proof.base64Content) {
        setSelectedPaymentProof({
          src: `data:${proof.fileType || 'image/jpeg'};base64,${proof.base64Content}`,
          paymentId: paymentId,
        });
        onProofOpen();
      } else {
        throw new Error('No image content available');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load payment proof',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const downloadInvoice = () => {
    toast({
      title: 'Feature Coming Soon',
      description: 'Invoice download will be available soon',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'green';
      case 'unpaid': return 'red';
      case 'partially_paid': return 'yellow';
      case 'overdue': return 'red';
      default: return 'gray';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'green';
      case 'pending': return 'yellow';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const totalPaid = invoice.payments?.reduce((sum, payment) => {
    return payment.status === 'verified' ? sum + payment.amount : sum;
  }, 0) || 0;

  const remainingAmount = invoice.totalAmount - totalPaid;

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <Text fontSize="2xl" fontWeight="bold">Invoice Details</Text>
            <Text color="gray.600">Invoice #{invoice.invoiceNumber}</Text>
          </VStack>
          <HStack>
            <Button
              leftIcon={<FaDownload />}
              colorScheme="blue"
              onClick={downloadInvoice}
            >
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/tenant/invoices')}
            >
              Back to Invoices
            </Button>
          </HStack>
        </HStack>

        {/* Invoice Summary */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
          <Card>
            <CardHeader>
              <HStack>
                <FaFileInvoice />
                <Text fontWeight="bold">Invoice Information</Text>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <Text>Status:</Text>
                  <Badge colorScheme={getStatusColor(invoice.status)} size="lg">
                    {invoice.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </HStack>
                <HStack justify="space-between">
                  <Text>Issue Date:</Text>
                  <Text>{formatDate(invoice.issueDate)}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text>Due Date:</Text>
                  <Text>{formatDate(invoice.dueDate)}</Text>
                </HStack>
                {invoice.paidDate && (
                  <HStack justify="space-between">
                    <Text>Paid Date:</Text>
                    <Text>{formatDate(invoice.paidDate)}</Text>
                  </HStack>
                )}
                <HStack justify="space-between">
                  <Text>Payment Method:</Text>
                  <Text>{invoice.paymentMethod || 'N/A'}</Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <HStack>
                <FaReceipt />
                <Text fontWeight="bold">Payment Summary</Text>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <Text>Total Amount:</Text>
                  <Text fontWeight="bold" fontSize="lg">
                    {formatCurrency(invoice.totalAmount)}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text>Amount Paid:</Text>
                  <Text color="green.500" fontWeight="semibold">
                    {formatCurrency(totalPaid)}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text>Remaining:</Text>
                  <Text 
                    color={remainingAmount > 0 ? "red.500" : "green.500"} 
                    fontWeight="semibold"
                  >
                    {formatCurrency(remainingAmount)}
                  </Text>
                </HStack>
                {remainingAmount > 0 && (
                  <Button 
                    colorScheme="blue" 
                    size="sm"
                    onClick={() => navigate(`/tenant/payments/create?invoiceId=${invoice.id}`)}
                  >
                    Make Payment
                  </Button>
                )}
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        {/* Invoice Items */}
        {invoice.items && invoice.items.length > 0 && (
          <Card>
            <CardHeader>
              <Text fontWeight="bold">Invoice Items</Text>
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
                      <Td isNumeric>{formatCurrency(item.unitPrice)}</Td>
                      <Td isNumeric fontWeight="semibold">{formatCurrency(item.total)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              <Divider mt={4} />
              <HStack justify="flex-end" mt={4}>
                <Text fontSize="lg" fontWeight="bold">
                  Grand Total: {formatCurrency(invoice.totalAmount)}
                </Text>
              </HStack>
            </CardBody>
          </Card>
        )}

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <Card>
            <CardHeader>
              <Text fontWeight="bold">Payment History</Text>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {invoice.payments.map((payment) => (
                  <Card key={payment.id} variant="outline">
                    <CardBody>
                      <Grid templateColumns="1fr auto" gap={4}>
                        <VStack align="start" spacing={2}>
                          <HStack>
                            <Badge colorScheme={getPaymentStatusColor(payment.status)}>
                              {payment.status.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {payment.paymentMethod === 'manual' ? 'Manual Transfer' : 'Midtrans'}
                            </Badge>
                            <Text fontSize="sm" color="gray.500">
                              #{payment.id}
                            </Text>
                          </HStack>
                          
                          <Text fontWeight="bold">
                            {formatCurrency(payment.amount)}
                          </Text>
                          
                          <Text fontSize="sm" color="gray.600">
                            {formatDateTime(payment.createdAt)}
                          </Text>
                          
                          {payment.paymentChannel && (
                            <Text fontSize="sm">
                              Channel: {payment.paymentChannel}
                            </Text>
                          )}
                          
                          {payment.transactionId && (
                            <Text fontSize="sm">
                              Transaction: {payment.transactionId}
                            </Text>
                          )}
                          
                          {payment.notes && (
                            <Text fontSize="sm" fontStyle="italic">
                              {payment.notes}
                            </Text>
                          )}
                        </VStack>
                        
                        {payment.proof && (
                          <VStack spacing={2}>
                            <Button
                              size="sm"
                              leftIcon={<FaEye />}
                              onClick={() => viewPaymentProof(payment.id)}
                            >
                              View Proof
                            </Button>
                          </VStack>
                        )}
                      </Grid>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Notes */}
        {invoice.notes && (
          <Card>
            <CardHeader>
              <Text fontWeight="bold">Notes</Text>
            </CardHeader>
            <CardBody>
              <Text>{invoice.notes}</Text>
            </CardBody>
          </Card>
        )}
      </VStack>

      {/* Payment Proof Modal */}
      <Modal isOpen={isProofOpen} onClose={onProofClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Payment Proof - Payment #{selectedPaymentProof?.paymentId}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedPaymentProof && (
              <Image
                src={selectedPaymentProof.src}
                alt="Payment Proof"
                maxH="500px"
                objectFit="contain"
                w="100%"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TenantInvoiceDetails;
