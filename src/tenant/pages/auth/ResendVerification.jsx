import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Heading, Text, VStack, FormControl, 
  FormLabel, Input, Button, Alert, AlertIcon, 
  useColorModeValue, Icon, Flex, FormErrorMessage
} from '@chakra-ui/react';
import { FaEnvelope, FaPaperPlane } from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import authService from '../../services/authService';

const ResendVerification = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [emailError, setEmailError] = useState('');
  
  const navigate = useNavigate();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setEmailError('');
    setStatus({ type: '', message: '' });
    
    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Call API to resend verification email
      const response = await authService.resendVerificationEmail(email);
      
      setStatus({
        type: 'success',
        message: response.message || 'Verification email has been sent. Please check your inbox.'
      });
      
      // Clear form
      setEmail('');
      
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Failed to send verification email. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
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
            <Heading size="xl">Resend Verification Email</Heading>
          </Flex>
          
          <Text mb={6}>
            Enter your email address below and we'll send you a new verification link.
          </Text>
          
          {status.type && (
            <Alert status={status.type} mb={6} borderRadius="md">
              <AlertIcon />
              {status.message}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              <FormControl isInvalid={!!emailError}>
                <FormLabel>Email Address</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                />
                {emailError && <FormErrorMessage>{emailError}</FormErrorMessage>}
              </FormControl>
              
              <Button
                type="submit"
                colorScheme="brand"
                size="lg"
                leftIcon={<FaPaperPlane />}
                isLoading={isSubmitting}
                loadingText="Sending..."
              >
                Send Verification Email
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/tenant/login')}
              >
                Back to Login
              </Button>
            </VStack>
          </form>
        </Box>
      </Container>
    </TenantLayout>
  );
};

export default ResendVerification;
