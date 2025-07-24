import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  Input,
  VStack,
  Text,
  Alert,
  AlertIcon,
  useColorModeValue,
  Flex,
  Link as ChakraLink,
  Icon
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { FaEnvelope } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useTenantAuth } from '../../context/tenantAuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { requestPasswordReset } = useTenantAuth();
  
  const boxBgColor = useColorModeValue('white', 'gray.700');
  const pageBgColor = useColorModeValue('gray.50', 'gray.800');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset error state
    setError('');
    
    // Form validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    try {
      setIsLoading(true);
      await requestPasswordReset(email);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Password reset request error:', err);
      setError(err.message || 'Failed to request password reset. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isSubmitted) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg={pageBgColor}>
        <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
          <Box p={8} bg={boxBgColor} boxShadow="lg" borderRadius="xl" textAlign="center">
            <VStack spacing={6}>
              <Icon as={FaEnvelope} boxSize={12} color="brand.500" />
              
              <Heading size="lg">Check Your Email</Heading>
              
              <Text>
                We've sent a 6-digit reset code to <strong>{email}</strong>.
                Please check your inbox and use the code to reset your password.
              </Text>
              
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                If you don't see the email, check your spam folder. The code expires in 24 hours.
              </Alert>
              
              <Button as={Link} to="/tenant/reset-password" colorScheme="brand" size="lg" mt={4}>
                Enter Reset Code
              </Button>
              
              <Button as={Link} to="/tenant/login" leftIcon={<ArrowBackIcon />} variant="outline" mt={2}>
                Return to Login
              </Button>
            </VStack>
          </Box>
        </Container>
      </Flex>
    );
  }
  
  return (
    <Flex minH="100vh" align="center" justify="center" bg={pageBgColor}>
      <Container maxW="md" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
        <Box p={8} bg={boxBgColor} boxShadow="lg" borderRadius="xl">
          <VStack spacing={6} align="stretch">
            <Heading textAlign="center" size="lg">Forgot Your Password?</Heading>
            <Text textAlign="center" color="gray.500">
              Enter your email address and we'll send you a 6-digit reset code.
            </Text>
            
            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit}>
              <VStack spacing={6} align="flex-start">
                <FormControl isRequired>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </FormControl>
                
                <Button
                  type="submit"
                  colorScheme="brand"
                  size="lg"
                  fontSize="md"
                  width="full"
                  isLoading={isLoading}
                  loadingText="Submitting..."
                >
                  Reset Password
                </Button>
                
                <ChakraLink as={Link} to="/tenant/login" alignSelf="center" display="flex" alignItems="center">
                  <ArrowBackIcon mr={1} /> Back to Login
                </ChakraLink>
              </VStack>
            </form>
          </VStack>
        </Box>
      </Container>
    </Flex>
  );
};

export default ForgotPassword;
