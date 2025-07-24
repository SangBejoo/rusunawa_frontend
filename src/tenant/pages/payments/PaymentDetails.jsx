import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Divider,
  Button,
  Badge,
  Image,
  Flex,
  Skeleton,
  Alert,
  AlertIcon,
  useColorModeValue,
  Link
} from '@chakra-ui/react';
import { 
  FaArrowLeft, 
  FaFileInvoice, 
  FaCalendarAlt, 
  FaCreditCard, 
  FaMoneyBillWave,
  FaCheck, 
  FaTimesCircle,
  FaClock,
  FaDownload
} from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import { formatDateTime } from '../../components/helpers/dateFormatter';
import { statusDisplayMap, formatCurrency } from '../../components/helpers/typeConverters';
import invoiceService from '../../services/invoiceService';
import paymentService from '../../services/paymentService';

const paymentMethodDisplayMap = {
  manual_upload: 'Manual Bank Transfer',
  midtrans_bca: 'BCA Virtual Account',
  midtrans_bni: 'BNI Virtual Account',
  midtrans_mandiri: 'Mandiri Virtual Account',
  midtrans_gopay: 'GoPay',
  midtrans_qris: 'QRIS',
  credit_card: 'Credit Card',
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
  // Add more as needed
};

const PaymentDetails = () => {
  const { paymentId } = useParams();
  const [payment, setPayment] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Download payment proof function
  const handleDownloadPaymentProof = () => {
    try {
      let base64Data, mimeType, fileName;
      
      // Check multiple possible locations for image data
      if (payment?.paymentProof?.imageContent) {
        base64Data = payment.paymentProof.imageContent;
        mimeType = payment.paymentProof.fileType || 'image/png';
        fileName = payment.paymentProof.fileName || `payment-proof-${paymentId}`;
      } else if (payment?.paymentProof?.base64Content) {
        base64Data = payment.paymentProof.base64Content;
        mimeType = payment.paymentProof.fileType || 'image/png';
        fileName = payment.paymentProof.fileName || `payment-proof-${paymentId}`;
      } else if (payment?.receipt_image) {
        base64Data = payment.receipt_image;
        mimeType = payment.receipt_file_type || 'image/png';
        fileName = `payment-proof-${paymentId}`;
      } else {
        console.log('No payment proof image found in payment object:', {
          hasPaymentProof: !!payment?.paymentProof,
          paymentProofKeys: payment?.paymentProof ? Object.keys(payment.paymentProof) : [],
          hasReceiptImage: !!payment?.receipt_image
        });
        return;
      }
      
      console.log('Downloading payment proof:', { fileName, mimeType, dataLength: base64Data?.length });
      
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      const fileExtension = mimeType.split('/')[1] || 'png';
      link.download = `${fileName}.${fileExtension}`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Payment proof download completed');
    } catch (error) {
      console.error('Error downloading payment proof:', error);
    }
  };
  
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching payment details for payment ID:', paymentId);
        
        // Fetch payment details using paymentService with proof metadata
        const paymentResponse = await paymentService.getPayment(paymentId, {
          includeImageContent: true
        });
        
        console.log('Payment response received:', paymentResponse);
        
        if (paymentResponse.payment) {
          console.log('=== PAYMENT DETAILS DEBUG ===');
          console.log('Payment object:', paymentResponse.payment);
          console.log('Payment proof exists:', !!paymentResponse.payment.paymentProof);
          if (paymentResponse.payment.paymentProof) {
            console.log('Payment proof structure:', {
              hasImageContent: !!paymentResponse.payment.paymentProof.imageContent,
              hasBase64Content: !!paymentResponse.payment.paymentProof.base64Content,
              fileName: paymentResponse.payment.paymentProof.fileName,
              fileType: paymentResponse.payment.paymentProof.fileType,
              imageContentLength: paymentResponse.payment.paymentProof.imageContent?.length,
              base64ContentLength: paymentResponse.payment.paymentProof.base64Content?.length
            });
          }
          setPayment(paymentResponse.payment);
          
          // Log payment proof data for debugging
          if (paymentResponse.payment.paymentProof) {
            console.log('Payment proof data available:', {
              hasImageContent: !!paymentResponse.payment.paymentProof.imageContent,
              fileName: paymentResponse.payment.paymentProof.fileName,
              fileType: paymentResponse.payment.paymentProof.fileType,
              base64Content: !!paymentResponse.payment.paymentProof.base64Content
            });
          } else {
            console.log('No payment proof object found in response');
          }
          
          // Fetch associated invoice
          if (paymentResponse.payment.invoiceId) {
            const invoiceResponse = await invoiceService.getInvoice(paymentResponse.payment.invoiceId);
            if (invoiceResponse.invoice) {
              setInvoice(invoiceResponse.invoice);
            }
          }
        } else {
          setError('Payment details not found');
        }
      } catch (err) {
        console.error('Error fetching payment details:', err);
        setError(err.message || 'Failed to load payment details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPaymentDetails();
  }, [paymentId]);
  
  const getStatusBadge = (status) => {
    let colorScheme;
    let icon;
    
    switch(status) {
      case 'success':
        colorScheme = 'green';
        icon = <FaCheck />;
        break;
      case 'pending':
        colorScheme = 'yellow';
        icon = <FaClock />;
        break;
      case 'failed':
        colorScheme = 'red';
        icon = <FaTimesCircle />;
        break;
      case 'waiting_approval':
        colorScheme = 'blue';
        icon = <FaClock />;
        break;
      default:
        colorScheme = 'gray';
        icon = null;
    }
    
    return (
      <Badge 
        colorScheme={colorScheme} 
        display="flex" 
        alignItems="center"
        p={2}
        borderRadius="md"
        fontSize="md"
      >
        {icon && <Box mr={2}>{icon}</Box>}
        {statusDisplayMap[status] || status}
      </Badge>
    );
  };
  
  if (loading) {
    return (
      <TenantLayout>
        <Container maxW="container.md" py={8}>
          <VStack spacing={6} align="stretch">
            <Skeleton height="40px" width="200px" />
            <Skeleton height="200px" borderRadius="lg" />
            <VStack spacing={4} align="stretch">
              <Skeleton height="30px" />
              <Skeleton height="30px" />
              <Skeleton height="30px" />
              <Skeleton height="30px" />
            </VStack>
          </VStack>
        </Container>
      </TenantLayout>
    );
  }
  
  if (error) {
    return (
      <TenantLayout>
        <Container maxW="container.md" py={8}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
          <Button 
            as={RouterLink} 
            to="/tenant/payments" 
            leftIcon={<FaArrowLeft />} 
            mt={4}
            colorScheme="brand"
            variant="outline"
          >
            Kembali ke Daftar Pembayaran
          </Button>
        </Container>
      </TenantLayout>
    );
  }
  
  return (
    <TenantLayout>
      <Container maxW="container.md" py={8}>
        <Box mb={6}>
          <Button 
            as={RouterLink} 
            to="/tenant/payments" 
            leftIcon={<FaArrowLeft />} 
            variant="outline" 
            mb={4}
          >
            Kembali
          </Button>
          <Heading as="h1" size="xl">Detail Pembayaran</Heading>
        </Box>
        
        <Box 
          bg={bgColor} 
          p={6} 
          borderRadius="lg" 
          borderWidth="1px" 
          borderColor={borderColor}
          boxShadow="md"
          mb={6}
        >
          <Flex 
            justify="space-between" 
            align={{ base: "flex-start", md: "center" }}
            direction={{ base: "column", md: "row" }}
            mb={4}
          >
            <VStack align="flex-start" spacing={1}>
              <Text fontSize="sm" color="gray.500">ID Pembayaran</Text>
              <Text fontWeight="bold">{payment?.paymentId}</Text>
            </VStack>
            
            {payment && getStatusBadge(payment.status)}
          </Flex>
          
          <Divider my={4} />
          
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between">
              <HStack>
                <FaMoneyBillWave />
                <Text>Jumlah</Text>
              </HStack>
              <Text fontWeight="bold" fontSize="lg">
                {formatCurrency(payment?.amount)}
              </Text>
            </Flex>
            
            <Flex justify="space-between">
              <HStack>
                <FaCreditCard />
                <Text>Metode Pembayaran</Text>
              </HStack>
              <Text>
                {paymentMethodDisplayMap[payment?.payment_method_type] || payment?.payment_method_type}
              </Text>
            </Flex>
            
            {payment?.payment_channel && (
              <Flex justify="space-between">
                <HStack>
                  <FaCreditCard />
                  <Text>Channel Pembayaran</Text>
                </HStack>
                <Text>{payment.payment_channel}</Text>
              </Flex>
            )}
            
            <Flex justify="space-between">
              <HStack>
                <FaFileInvoice />
                <Text>ID Invoice</Text>
              </HStack>
              <Link 
                as={RouterLink} 
                to={`/tenant/invoices/${payment?.invoice_id}`}
                color="brand.500"
                fontWeight="medium"
              >
                {payment?.invoice_id}
              </Link>
            </Flex>
            
            <Flex justify="space-between">
              <HStack>
                <FaCalendarAlt />
                <Text>Tanggal Dibuat</Text>
              </HStack>
              <Text>{formatDateTime(payment?.created_at)}</Text>
            </Flex>
            
            {payment?.paid_at && (
              <Flex justify="space-between">
                <HStack>
                  <FaCalendarAlt />
                  <Text>Tanggal Dibayar</Text>
                </HStack>
                <Text>{formatDateTime(payment?.paid_at)}</Text>
              </Flex>
            )}
            
            {payment?.transaction_id && (
              <Flex justify="space-between">
                <HStack>
                  <FaFileInvoice />
                  <Text>ID Transaksi</Text>
                </HStack>
                <Text fontFamily="mono">{payment.transaction_id}</Text>
              </Flex>
            )}
            
            {payment?.notes && (
              <Box mt={2}>
                <Text fontWeight="medium" mb={1}>Catatan:</Text>
                <Text>{payment.notes}</Text>
              </Box>
            )}
          </VStack>
        </Box>
        
        {/* Enhanced Payment Proof Section with Better Debugging */}
        {(payment?.receipt_image || payment?.paymentProof?.imageContent || payment?.paymentProof?.base64Content) && (
          <Box 
            bg={bgColor} 
            p={6} 
            borderRadius="lg" 
            borderWidth="1px" 
            borderColor={borderColor}
            boxShadow="md"
          >
            <HStack justify="space-between" align="center" mb={4}>
              <Heading as="h3" size="md">Payment Proof</Heading>
              <Button
                leftIcon={<FaDownload />}
                size="sm"
                variant="outline"
                onClick={handleDownloadPaymentProof}
              >
                Download
              </Button>
            </HStack>
            
            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
              <Box mb={4} p={3} bg="gray.100" borderRadius="md" fontSize="sm">
                <Text fontWeight="bold">Debug Info:</Text>
                <Text>Payment Proof Available: {payment?.paymentProof ? 'Yes' : 'No'}</Text>
                <Text>Image Content Available: {payment?.paymentProof?.imageContent ? 'Yes' : 'No'}</Text>
                <Text>File Type: {payment?.paymentProof?.fileType || 'Not specified'}</Text>
                <Text>File Name: {payment?.paymentProof?.fileName || 'Not specified'}</Text>
                <Text>Receipt Image Available: {payment?.receipt_image ? 'Yes' : 'No'}</Text>
              </Box>
            )}
            
            <Box 
              borderWidth="1px" 
              borderColor={borderColor} 
              borderRadius="md" 
              overflow="hidden"
            >
              {(() => {
                console.log('=== RENDER DEBUG ===');
                console.log('payment object in render:', payment);
                console.log('payment?.paymentProof:', payment?.paymentProof);
                console.log('payment?.paymentProof?.imageContent exists:', !!payment?.paymentProof?.imageContent);
                console.log('payment?.paymentProof?.base64Content exists:', !!payment?.paymentProof?.base64Content);
                console.log('payment?.receipt_image exists:', !!payment?.receipt_image);
                return null;
              })()}
              {payment?.paymentProof?.imageContent ? (
                <Image 
                  src={`data:${payment.paymentProof.fileType || 'image/jpeg'};base64,${payment.paymentProof.imageContent}`} 
                  alt="Payment Proof" 
                  maxH="500px" 
                  mx="auto"
                  objectFit="contain"
                  onError={(e) => {
                    console.error('Error loading payment proof image:', e);
                    console.log('Image data preview:', payment.paymentProof.imageContent?.substring(0, 100) + '...');
                  }}
                  onLoad={() => {
                    console.log('Payment proof image loaded successfully');
                  }}
                />
              ) : payment?.paymentProof?.base64Content ? (
                <Image 
                  src={`data:${payment.paymentProof.fileType || 'image/jpeg'};base64,${payment.paymentProof.base64Content}`} 
                  alt="Payment Proof" 
                  maxH="500px" 
                  mx="auto"
                  objectFit="contain"
                  onError={(e) => {
                    console.error('Error loading payment proof image (base64Content):', e);
                  }}
                />
              ) : payment?.receipt_image ? (
                <Image 
                  src={`data:${payment.receipt_file_type || 'image/jpeg'};base64,${payment.receipt_image}`} 
                  alt="Payment Proof" 
                  maxH="500px" 
                  mx="auto"
                  objectFit="contain"
                  onError={(e) => {
                    console.error('Error loading receipt image:', e);
                  }}
                />
              ) : (
                <Box p={8} textAlign="center" color="gray.500">
                  <Text>Payment proof not available</Text>
                  <Text fontSize="sm">No payment proof image is attached to this payment.</Text>
                </Box>
              )}
            </Box>
            {(payment?.paymentProof?.fileName || payment?.receipt_image) && (
              <Text fontSize="sm" color="gray.500" mt={2}>
                File: {payment?.paymentProof?.fileName || 'receipt_image'}
              </Text>
            )}
          </Box>
        )}
        
        {payment?.payment_url && !(['success', 'failed'].includes(payment.status)) && (
          <Box mt={6} textAlign="center">
            <Button 
              as="a" 
              href={payment.payment_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              colorScheme="brand" 
              size="lg"
              leftIcon={<FaCreditCard />}
            >
              Lanjutkan Pembayaran
            </Button>
            <Text mt={2} fontSize="sm" color="gray.500">
              Link pembayaran akan kedaluwarsa pada: {formatDateTime(payment.expiry_time)}
            </Text>
          </Box>
        )}
      </Container>
    </TenantLayout>
  );
};

export default PaymentDetails;
