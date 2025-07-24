import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Container, Heading, Text, VStack, Button, Alert,
  AlertIcon, Spinner, useColorModeValue, Icon, Flex
} from '@chakra-ui/react';
import { FaEnvelope, FaCheckCircle, FaExclamationCircle, FaArrowRight } from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import authService from '../../services/authService';

const EmailVerification = () => {
  const [verificationStatus, setVerificationStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Parse token from URL query params
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        
        if (!token) {
          setVerificationStatus('error');
          setMessage('Verification token is missing.');
          setLoading(false);
          return;
        }
        
        // Call API to verify token
        const response = await authService.verifyEmail(token);
        
        setVerificationStatus('success');
        setMessage(response.message || 'Your email has been successfully verified!');
        setLoading(false);
        
      } catch (error) {
        console.error('Email verification failed:', error);
        setVerificationStatus('error');
        setMessage(error.message || 'Failed to verify email. The token may be invalid or expired.');
        setLoading(false);
      }
    };
    
    verifyEmail();
  }, [location]);
  
  const handleContinue = () => {
    if (verificationStatus === 'success') {
      navigate('/tenant/login');
    } else {
      navigate('/tenant/resend-verification');
    }
  };
  
  const renderContent = () => {
    if (loading) {
      return (
        <VStack spacing={6} py={10}>
          <Spinner size="xl" thickness="4px" color="brand.500" />
          <Text>Verifying your email address...</Text>
        </VStack>
      );
    }
    
    if (verificationStatus === 'success') {
      return (
        <VStack spacing={6} py={10} textAlign="center">
          <Icon as={FaCheckCircle} boxSize="4rem" color="green.500" />
          <Heading size="lg">Email Verified!</Heading>
          <Text>{message}</Text>
          <Text>You can now log in to your account and enjoy all features of our platform.</Text>
          <Button 
            rightIcon={<FaArrowRight />} 
            colorScheme="brand" 
            onClick={handleContinue}
            size="lg"
            mt={4}
          >
            Continue to Login
          </Button>
        </VStack>
      );
    }
    
    // Error status
    return (
      <VStack spacing={6} py={10} textAlign="center">
        <Icon as={FaExclamationCircle} boxSize="4rem" color="red.500" />
        <Heading size="lg">Verification Failed</Heading>
        <Text>{message}</Text>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          If your token has expired, you can request a new verification email.
        </Alert>
        <Button 
          rightIcon={<FaArrowRight />} 
          colorScheme="brand" 
          onClick={handleContinue}
          size="lg"
          mt={4}
        >
          Resend Verification Email
        </Button>
      </VStack>
    );
  };
  
  return (
    <TenantLayout hideHeader={true}>
      <Container maxW="container.sm" py={10}>
        <Box
          bg={bgColor}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          p={8}
          shadow="md"
        >
          <Flex align="center" mb={6}>
            <Icon as={FaEnvelope} boxSize="1.5rem" mr={3} color="brand.500" />
            <Heading size="xl">Email Verification</Heading>
          </Flex>
          
          {renderContent()}
        </Box>
      </Container>
    </TenantLayout>
  );
};

export default EmailVerification;
