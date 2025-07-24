import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  Image,
  Box,
  useToast,
  Alert,
  AlertIcon,
  Center,
  Spinner,
  Card,
  CardBody,
  Grid,
  GridItem,
  useColorModeValue,
  Avatar,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { 
  FiUser, 
  FiCreditCard, 
  FiCalendar, 
  FiDollarSign, 
  FiDownload, 
  FiEye,
  FiFileText,
  FiClock
} from 'react-icons/fi';
import paymentService from '../../services/paymentService';

const PaymentDetailModal = ({ isOpen, onClose, payment, onPaymentUpdated }) => {
  const [paymentProof, setPaymentProof] = useState(null);
  const [proofLoading, setProofLoading] = useState(false);

  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    if (isOpen && payment) {
      fetchPaymentProof();
    }
  }, [isOpen, payment]);
  const fetchPaymentProof = async () => {
    if (!payment?.id) return;
    
    try {
      setProofLoading(true);
        // Check if payment proof is already embedded in payment object
      if (payment.paymentProof) {
        setPaymentProof({
          proof_url: payment.paymentProof.imageContent ? 
            `data:${payment.paymentProof.fileType || 'image/jpeg'};base64,${payment.paymentProof.imageContent}` : 
            payment.paymentProof.base64Content ? 
              `data:${payment.paymentProof.fileType || 'image/jpeg'};base64,${payment.paymentProof.base64Content}` : 
              null,
          proof_notes: payment.paymentProof.notes || '',
          file_name: payment.paymentProof.fileName || '',
          file_type: payment.paymentProof.fileType || '',
          uploaded_at: payment.paymentProof.uploadedAt,
          proof_data: payment.paymentProof.imageContent || payment.paymentProof.base64Content, // For download
        });
      } else {
        // Fallback: fetch proof details from API
        const response = await paymentService.getPaymentProofDetails(payment.id);
        setPaymentProof(response);
      }
    } catch (error) {
      console.error('Failed to fetch payment proof:', error);
      setPaymentProof(null);
    } finally {
      setProofLoading(false);
    }
  };
  const handleDownloadProof = async () => {
    try {
      if (paymentProof?.proof_data) {
        // Use embedded image data
        const blob = new Blob([new Uint8Array(paymentProof.proof_data)], { 
          type: paymentProof.file_type || 'image/jpeg' 
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = paymentProof.file_name || `payment-proof-${payment.id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else if (payment?.paymentProof?.base64Content) {
        // Fallback: convert base64 to blob
        const proof = payment.paymentProof;
        const byteCharacters = atob(proof.base64Content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: proof.fileType || 'image/jpeg' });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = proof.fileName || `payment-proof-${payment.id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Last resort: fetch from API
        const response = await paymentService.getPaymentProofDetails(payment.id, true);
        if (response.proof_data) {
          const blob = new Blob([response.proof_data], { type: 'image/jpeg' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `payment-proof-${payment.id}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download payment proof',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'completed': return 'blue';
      case 'verified': return 'green';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  if (!payment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxW="700px">
        <ModalHeader>
          <HStack>
            <FiFileText />
            <Text>Detail Pembayaran</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Payment Information */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <Text fontSize="lg" fontWeight="semibold" mb={4}>Informasi Pembayaran</Text>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" color="gray.500">Nomor Invoice</Text>
                      <Text fontWeight="semibold">{payment.invoice_number}</Text>
                    </VStack>
                  </GridItem>

                  <GridItem>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" color="gray.500">Jumlah</Text>
                      <Text fontSize="xl" fontWeight="bold" color="green.600">
                        {formatCurrency(payment.amount)}
                      </Text>
                    </VStack>
                  </GridItem>

                  <GridItem>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" color="gray.500">Status</Text>
                      <Badge colorScheme={getStatusColor(payment.status)} size="lg">
                        {payment.status === 'pending' && 'Menunggu'}
                        {payment.status === 'completed' && 'Selesai'}
                        {payment.status === 'verified' && 'Terverifikasi'}
                        {payment.status === 'failed' && 'Gagal'}
                        {!['pending','completed','verified','failed'].includes(payment.status) && payment.status}
                      </Badge>
                    </VStack>
                  </GridItem>

                  <GridItem>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" color="gray.500">Tipe Pembayaran</Text>
                      <Text fontWeight="medium">{payment.payment_type}</Text>
                    </VStack>
                  </GridItem>

                  <GridItem>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" color="gray.500">Metode Pembayaran</Text>
                      <HStack>
                        <FiCreditCard />
                        <Text fontWeight="medium">{payment.payment_method}</Text>
                      </HStack>
                    </VStack>
                  </GridItem>

                  <GridItem>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" color="gray.500">Jatuh Tempo</Text>
                      <HStack>
                        <FiCalendar />
                        <Text>{formatDate(payment.due_date)}</Text>
                      </HStack>
                    </VStack>
                  </GridItem>

                  {payment.payment_date && (
                    <GridItem colSpan={2}>
                      <VStack align="start" spacing={2}>
                        <Text fontSize="sm" color="gray.500">Tanggal Pembayaran</Text>
                        <HStack>
                          <FiClock />
                          <Text>{formatDate(payment.payment_date)}</Text>
                        </HStack>
                      </VStack>
                    </GridItem>
                  )}
                </Grid>
              </CardBody>
            </Card>

            {/* Tenant Information */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <Text fontSize="lg" fontWeight="semibold" mb={4}>Informasi Penyewa</Text>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" color="gray.500">Nama Penyewa</Text>
                      <HStack>
                        <Avatar size="sm" name={payment.tenant_name} />
                        <Text fontWeight="semibold">{payment.tenant_name}</Text>
                      </HStack>
                    </VStack>
                  </GridItem>

                  <GridItem>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" color="gray.500">Nomor Kamar</Text>
                      <Text fontWeight="medium">Kamar {payment.room_number}</Text>
                    </VStack>
                  </GridItem>

                  {payment.tenant_email && (
                    <GridItem colSpan={2}>
                      <VStack align="start" spacing={2}>
                        <Text fontSize="sm" color="gray.500">Email</Text>
                        <Text>{payment.tenant_email}</Text>
                      </VStack>
                    </GridItem>
                  )}
                </Grid>
              </CardBody>
            </Card>

            {/* Payment Proof */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <HStack justify="space-between" align="center" mb={4}>
                  <Text fontSize="lg" fontWeight="semibold">Bukti Pembayaran</Text>
                  {paymentProof?.proof_url && (
                    <Tooltip label="Unduh Bukti">
                      <IconButton
                        size="sm"
                        icon={<FiDownload />}
                        onClick={handleDownloadProof}
                        aria-label="Unduh bukti"
                      />
                    </Tooltip>
                  )}
                </HStack>
                
                {proofLoading ? (
                  <Center py={8}>
                    <Spinner size="lg" />
                  </Center>
                ) : paymentProof?.proof_url ? (
                  <Box>
                    <Image
                      src={paymentProof.proof_url}
                      alt="Payment Proof"
                      maxH="300px"
                      objectFit="contain"
                      border="1px"
                      borderColor={borderColor}
                      borderRadius="md"
                      w="100%"
                    />
                    {paymentProof.proof_notes && (
                      <Box mt={3} p={3} bg="gray.50" borderRadius="md">
                        <Text fontSize="sm" color="gray.600">
                          <strong>Catatan:</strong> {paymentProof.proof_notes}
                        </Text>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Alert status="info">
                    <AlertIcon />
                    Belum ada bukti pembayaran yang diunggah
                  </Alert>
                )}
              </CardBody>
            </Card>

            {/* Verification Information */}
            {payment.verification_notes && (
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Text fontSize="lg" fontWeight="semibold" mb={4}>Catatan Verifikasi</Text>
                  <Box p={3} bg="gray.50" borderRadius="md">
                    <Text fontSize="sm">{payment.verification_notes}</Text>
                  </Box>
                </CardBody>
              </Card>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose}>Tutup</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PaymentDetailModal;
