import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  useToast,
} from '@chakra-ui/react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import TenantLayout from '../../components/layout/TenantLayout';
import MidtransCallback from '../../components/payment/MidtransCallback';

const PaymentStatus = () => {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const toast = useToast();
    // Extract query parameters
  const queryParams = new URLSearchParams(location.search);
  const orderId = queryParams.get('order_id');
  const transactionId = queryParams.get('transaction_id');
  const transactionStatus = queryParams.get('transaction_status');
  const statusCode = queryParams.get('status_code');
  const invoiceId = params.invoiceId;
  
  // If direct navigation without query params but we have invoiceId,
  // extract transaction ID from URL params instead
  const [transactionIdToUse, setTransactionIdToUse] = useState(transactionId || orderId || params.transactionId);
    useEffect(() => {
    // If no transaction_id in query params or URL params, try to get from state
    if (!transactionIdToUse && location.state?.transactionId) {
      setTransactionIdToUse(location.state.transactionId);
    } else if (!transactionIdToUse && location.state?.orderId) {
      setTransactionIdToUse(location.state.orderId);
    }
    
    // If we have transaction_status in URL, show appropriate toast
    if (transactionStatus) {
      let toastStatus = 'info';
      let title = 'Payment Status';
      let description = 'Payment status updated.';
      
      if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
        toastStatus = 'success';
        title = 'Payment Successful';
        description = 'Your payment has been confirmed!';
      } else if (transactionStatus === 'pending') {
        toastStatus = 'warning';
        title = 'Payment Pending';
        description = 'Your payment is being processed.';
      } else if (transactionStatus === 'deny' || transactionStatus === 'failure' || transactionStatus === 'cancel') {
        toastStatus = 'error';
        title = 'Payment Failed';
        description = `Payment failed with status: ${transactionStatus}`;
      } else if (transactionStatus === 'expire') {
        toastStatus = 'warning';
        title = 'Payment Expired';
        description = 'Your payment session has expired.';
      }
      
      toast({
        title,
        description,
        status: toastStatus,
        duration: 5000,
        isClosable: true,
      });
    }  }, [transactionStatus, transactionIdToUse, location.state, toast]);
  
  // Handle completion of status checking
  const handleStatusCheckComplete = (result) => {
    console.log("Payment status check completed:", result);
    
    if (result.status === 'success') {
      toast({
        title: 'Payment Verified',
        description: 'Your payment has been successfully verified.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // If we don't have required data, show error
  if (!transactionIdToUse && !transactionStatus) {
    return (
      <TenantLayout>
        <Container maxW="container.md" py={8}>
          <Box textAlign="center" py={10} px={6}>
            <Heading as="h2" size="xl" mt={6} mb={2}>
              Missing Payment Information
            </Heading>
            <Text color={'gray.500'}>
              We couldn't find the payment information needed to check your status.
            </Text>            <Button
              colorScheme="brand"
              mt={6}
              onClick={() => navigate('/bookings')}
            >
              Go to My Bookings
            </Button>
          </Box>
        </Container>
      </TenantLayout>
    );
  }
    return (
    <TenantLayout>
      <Container maxW="container.md" py={8}>
        <Heading size="lg" mb={6}>Payment Status</Heading>
        
        <MidtransCallback 
          orderId={transactionIdToUse}
          invoiceId={invoiceId}
          onComplete={handleStatusCheckComplete}
        />
      </Container>
    </TenantLayout>
  );
};

export default PaymentStatus;
