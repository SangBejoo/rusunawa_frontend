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
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Spinner,
  Alert,
  AlertIcon,
  Grid,
  GridItem,
  Divider,
  Icon,
  Tooltip,
  IconButton,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  useToast
} from '@chakra-ui/react';
import {
  FaEye,
  FaDownload,
  FaSearch,
  FaFilter,
  FaZoomIn,
  FaZoomOut,
  FaExpandArrowsAlt,
  FaMoneyBillWave,
  FaCreditCard,
  FaReceipt,
  FaCalendarAlt
} from 'react-icons/fa';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const PaymentHistory = ({ tenantId }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [imageLoading, setImageLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    fetchPayments();
  }, [tenantId, filters, pagination.page]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        include_proof_metadata: true,
        include_invoice_details: true,
        ...filters
      });

      const response = await fetch(`/v1/tenants/${tenantId}/payments/with-proof?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }

      const data = await response.json();
      setPayments(data.payments || []);
      setSummary(data.summary);
      setPagination(prev => ({
        ...prev,
        totalCount: data.total_count || 0
      }));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load payment history',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };
  const openImageModal = (payment) => {
    setSelectedPayment(payment);
    
    // Check if payment has embedded proof data
    if (payment.payment_proof && payment.payment_proof.base64_content) {
      setZoomLevel(100);
      setImageModalOpen(true);
    } else {
      toast({
        title: 'No Image',
        description: 'This payment has no proof image available',
        status: 'info',
        duration: 3000,
        isClosable: true
      });
    }
  };
    setZoomLevel(100);
    setImageModalOpen(true);
  };
  const downloadPaymentProof = async (paymentId, fileName) => {
    try {
      setImageLoading(true);
      
      // Find payment in current payments list
      const payment = payments.find(p => p.payment?.payment_id === paymentId);
      if (payment?.payment_proof) {
        const proof = payment.payment_proof;
        
        if (proof.image_content) {
          // Use embedded binary data
          const blob = new Blob([new Uint8Array(proof.image_content)], { 
            type: proof.file_type || 'image/jpeg' 
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = fileName || proof.file_name || 'payment-proof.jpg';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else if (proof.base64_content) {
          // Convert base64 to blob
          const byteCharacters = atob(proof.base64_content);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: proof.file_type || 'image/jpeg' });
          
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = fileName || proof.file_name || 'payment-proof.jpg';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          throw new Error('No image content available');
        }
      } else {
        // Fallback: try API endpoint (legacy)
        const response = await fetch(`/v1/payments/${paymentId}/proof/image?format=original&encoding=binary`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to download image');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName || 'payment-proof.jpg';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast({
        title: 'Success',
        description: 'Payment proof downloaded successfully',
        status: 'success',
        duration: 2000
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download payment proof',
        status: 'error',
        duration: 3000
      });
    } finally {
      setImageLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'paid':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'failed':
        return 'red';
      case 'cancelled':
        return 'gray';
      default:
        return 'blue';
    }
  };

  const getPaymentMethodIcon = (method) => {
    if (method?.toLowerCase().includes('manual') || method?.toLowerCase().includes('transfer')) {
      return FaMoneyBillWave;
    }
    return FaCreditCard;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const ImageModal = () => (
    <Modal isOpen={imageModalOpen} onClose={() => setImageModalOpen(false)} size="6xl">
      <ModalOverlay />
      <ModalContent maxW="90vw" maxH="90vh">
        <ModalHeader>
          <HStack justify="space-between">
            <Text>Payment Proof - {selectedPayment?.payment?.payment_method}</Text>
            <HStack>
              <Tooltip label="Zoom Out">
                <IconButton
                  icon={<FaZoomOut />}
                  size="sm"
                  onClick={() => setZoomLevel(prev => Math.max(25, prev - 25))}
                  isDisabled={zoomLevel <= 25}
                />
              </Tooltip>
              <Text fontSize="sm">{zoomLevel}%</Text>
              <Tooltip label="Zoom In">
                <IconButton
                  icon={<FaZoomIn />}
                  size="sm"
                  onClick={() => setZoomLevel(prev => Math.min(300, prev + 25))}
                  isDisabled={zoomLevel >= 300}
                />
              </Tooltip>
              <Tooltip label="Fit to Screen">
                <IconButton
                  icon={<FaExpandArrowsAlt />}
                  size="sm"
                  onClick={() => setZoomLevel(100)}
                />
              </Tooltip>
              <Tooltip label="Download">
                <IconButton
                  icon={<FaDownload />}
                  size="sm"
                  onClick={() => downloadPaymentProof(
                    selectedPayment?.payment?.payment_id,
                    selectedPayment?.proof_metadata?.file_name
                  )}
                  isLoading={imageLoading}
                />
              </Tooltip>
            </HStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={0}>
          <Box 
            overflow="auto" 
            maxH="70vh"
            display="flex"
            justifyContent="center"
            alignItems="center"
            bg="gray.50"
          >            {selectedPayment && (
              <Image
                src={selectedPayment.payment_proof?.base64_content ? 
                  `data:${selectedPayment.payment_proof.file_type || 'image/jpeg'};base64,${selectedPayment.payment_proof.base64_content}` :
                  `/v1/payments/${selectedPayment.payment.payment_id}/proof/image?format=jpeg&quality=high&zoom_level=${zoomLevel}%`
                }
                alt="Payment Proof"
                maxW="none"
                w={`${zoomLevel}%`}
                loading="lazy"
                fallback={<Spinner size="xl" />}
              />
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading payment history...</Text>
      </Box>
    );
  }

  return (
    <Box>
      {/* Summary Cards */}
      {summary && (
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} mb={6}>
          <Card>
            <CardBody>
              <HStack>
                <Icon as={FaMoneyBillWave} color="green.500" boxSize={6} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {formatCurrency(summary.total_amount)}
                  </Text>
                  <Text fontSize="sm" color="gray.500">Total Amount</Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <HStack>
                <Icon as={FaReceipt} color="blue.500" boxSize={6} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold">
                    {summary.total_payments}
                  </Text>
                  <Text fontSize="sm" color="gray.500">Total Payments</Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <HStack>
                <Icon as={FaCreditCard} color="green.500" boxSize={6} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {summary.successful_payments}
                  </Text>
                  <Text fontSize="sm" color="gray.500">Successful</Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <HStack>
                <Icon as={FaCalendarAlt} color="orange.500" boxSize={6} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                    {summary.pending_payments}
                  </Text>
                  <Text fontSize="sm" color="gray.500">Pending</Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        </Grid>
      )}

      {/* Filters */}
      <Card mb={6}>
        <CardBody>
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FaSearch color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search payments..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({...prev, searchTerm: e.target.value}))}
              />
            </InputGroup>
            
            <Select
              placeholder="All Statuses"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({...prev, status: e.target.value}))}
            >
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
            
            <Select
              placeholder="All Payment Methods"
              value={filters.paymentMethod}
              onChange={(e) => setFilters(prev => ({...prev, paymentMethod: e.target.value}))}
            >
              <option value="manual_transfer">Manual Transfer</option>
              <option value="midtrans">Midtrans</option>
              <option value="bank_transfer">Bank Transfer</option>
            </Select>
            
            <Input
              type="date"
              placeholder="From Date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({...prev, dateFrom: e.target.value}))}
            />
            
            <Input
              type="date"
              placeholder="To Date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({...prev, dateTo: e.target.value}))}
            />
          </Grid>
        </CardBody>
      </Card>

      {/* Payment List */}
      <VStack spacing={4} align="stretch">
        {payments.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            No payments found for the selected criteria.
          </Alert>
        ) : (
          payments.map((paymentData) => (
            <Card key={paymentData.payment.payment_id}>
              <CardBody>
                <Grid templateColumns="1fr auto" gap={4}>
                  <VStack align="start" spacing={3}>
                    <HStack justify="space-between" w="full">
                      <HStack>
                        <Icon as={getPaymentMethodIcon(paymentData.payment.payment_method)} />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold">
                            {formatCurrency(paymentData.payment.amount)}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            {paymentData.payment.payment_method} • {paymentData.payment.payment_channel}
                          </Text>
                        </VStack>
                      </HStack>
                      
                      <Badge colorScheme={getStatusColor(paymentData.payment.status)}>
                        {paymentData.payment.status}
                      </Badge>
                    </HStack>
                    
                    <Divider />
                    
                    <HStack justify="space-between" w="full">
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm" color="gray.500">Created</Text>
                        <Text fontSize="sm">
                          {format(new Date(paymentData.payment.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                        </Text>
                      </VStack>
                      
                      {paymentData.payment.paid_at && (
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm" color="gray.500">Paid At</Text>
                          <Text fontSize="sm">
                            {format(new Date(paymentData.payment.paid_at), 'dd MMM yyyy HH:mm', { locale: id })}
                          </Text>
                        </VStack>
                      )}
                      
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm" color="gray.500">Transaction ID</Text>
                        <Text fontSize="sm" fontFamily="mono">
                          {paymentData.payment.transaction_id || 'N/A'}
                        </Text>
                      </VStack>
                    </HStack>
                    
                    {paymentData.payment.notes && (
                      <>
                        <Divider />
                        <Box>
                          <Text fontSize="sm" color="gray.500" mb={1}>Notes</Text>
                          <Text fontSize="sm">{paymentData.payment.notes}</Text>
                        </Box>
                      </>
                    )}
                    
                    {paymentData.related_invoice && (
                      <>
                        <Divider />
                        <Box>
                          <Text fontSize="sm" color="gray.500" mb={1}>Related Invoice</Text>
                          <Text fontSize="sm">
                            #{paymentData.related_invoice.invoice_id} • 
                            Due: {format(new Date(paymentData.related_invoice.due_date), 'dd MMM yyyy', { locale: id })}
                          </Text>
                        </Box>
                      </>
                    )}
                  </VStack>
                  
                  <VStack>
                    {paymentData.has_image_proof && (
                      <>
                        <Box textAlign="center" mb={2}>
                          <Image
                            src={paymentData.thumbnail_url || `/v1/payments/${paymentData.payment.payment_id}/proof/thumbnail/medium`}
                            alt="Payment Proof Thumbnail"
                            boxSize="80px"
                            objectFit="cover"
                            borderRadius="md"
                            cursor="pointer"
                            onClick={() => openImageModal(paymentData)}
                            fallback={<Box boxSize="80px" bg="gray.200" borderRadius="md" />}
                          />
                          {paymentData.proof_metadata && (
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              {paymentData.proof_metadata.file_type}
                            </Text>
                          )}
                        </Box>
                        
                        <VStack spacing={2}>
                          <Button
                            size="sm"
                            leftIcon={<FaEye />}
                            onClick={() => openImageModal(paymentData)}
                            colorScheme="blue"
                            variant="outline"
                            w="full"
                          >
                            View
                          </Button>
                          
                          <Button
                            size="sm"
                            leftIcon={<FaDownload />}
                            onClick={() => downloadPaymentProof(
                              paymentData.payment.payment_id,
                              paymentData.proof_metadata?.file_name
                            )}
                            isLoading={imageLoading}
                            w="full"
                          >
                            Download
                          </Button>
                        </VStack>
                      </>
                    )}
                    
                    {!paymentData.has_image_proof && paymentData.payment.payment_method.includes('manual') && (
                      <Alert status="warning" size="sm">
                        <AlertIcon />
                        <Text fontSize="xs">No proof uploaded</Text>
                      </Alert>
                    )}
                  </VStack>
                </Grid>
              </CardBody>
            </Card>
          ))
        )}
      </VStack>

      {/* Pagination */}
      {pagination.totalCount > pagination.limit && (
        <HStack justify="center" mt={6}>
          <Button
            isDisabled={pagination.page === 1}
            onClick={() => setPagination(prev => ({...prev, page: prev.page - 1}))}
          >
            Previous
          </Button>
          
          <Text>
            Page {pagination.page} of {Math.ceil(pagination.totalCount / pagination.limit)}
          </Text>
          
          <Button
            isDisabled={pagination.page >= Math.ceil(pagination.totalCount / pagination.limit)}
            onClick={() => setPagination(prev => ({...prev, page: prev.page + 1}))}
          >
            Next
          </Button>
        </HStack>
      )}

      <ImageModal />
    </Box>
  );
};

export default PaymentHistory;
