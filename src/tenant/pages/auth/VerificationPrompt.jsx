import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  useToast,
  Flex,
  Icon,
  FormErrorMessage,
  Divider,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  InputGroup,
  InputLeftElement,
  Center,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FaEnvelope, FaKey, FaRedo } from 'react-icons/fa';
import { useTenantAuth } from '../../context/tenantAuthContext';
import tenantAuthService from '../../services/tenantAuthService';

const VerificationPrompt = () => {
  const [verificationToken, setVerificationToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  
  const { isAuthenticated, tenant, verifyEmail } = useTenantAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
    // If the user is already authenticated AND verified, they shouldn't be on this page
  useEffect(() => {
    // Only redirect if the user is authenticated AND we KNOW they're verified
    // AND they didn't just come from registration (don't interfere with registration flow)
    // AND this is not a page refresh (check if we're specifically on verification prompt)
    if (isAuthenticated && tenant?.isVerified && !location.state?.fromRegistration && location.pathname === '/tenant/verification-prompt') {
      const from = location.state?.from?.pathname || '/tenant/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, tenant, navigate, location.state, location.pathname]);
    
  // Check if user is already verified via localStorage and redirect if necessary
  useEffect(() => {
    const isVerified = localStorage.getItem('email_verified') === 'true';
    
    if (isVerified && location.pathname === '/tenant/verification-prompt') {
      // If already verified, redirect to login or dashboard
      if (isAuthenticated) {
        const from = location.state?.from?.pathname || '/tenant/dashboard';
        navigate(from, { replace: true });
      } else {
        navigate('/tenant/login', { 
          state: { 
            verificationSuccess: true,
            message: 'Your email has been verified. Please log in.'
          }
        });
      }
    }
  }, [isAuthenticated, navigate, location]);
  
  // Get the email from location state or tenant context
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    } else if (isAuthenticated && tenant?.email) {
      setEmail(tenant.email);
    }
  }, [location.state, tenant, isAuthenticated]);
    // Check if user is already verified and redirect if necessary
  useEffect(() => {
    // First check if we have a tenant in context with verified status
    if (tenant && tenant.isVerified === true) {
      toast({
        title: "Already Verified",
        description: "Your email is already verified. Redirecting to dashboard.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate('/dashboard');
      return;
    }
    
    // Otherwise if we have an authenticated tenant, check verification status directly
    if (isAuthenticated && tenant?.id) {
      // Make an API call to check verification status
      tenantAuthService.checkEmailVerification(tenant.id)
        .then(response => {
          if (response && response.isVerified) {
            localStorage.setItem('email_verified', 'true');
            toast({
              title: "Already Verified",
              description: "Your email is already verified. Redirecting to dashboard.",
              status: "success", 
              duration: 3000,
              isClosable: true,
            });
            navigate('/tenant/dashboard');
          }
        })
        .catch(err => {
          console.error("Error checking verification status:", err);
        });
    }
  }, [tenant, isAuthenticated, navigate, toast]);
    // Submit verification token
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!verificationToken.trim()) {
      setError('Please enter the verification token from your email');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await tenantAuthService.verifyEmail({ token: verificationToken });
      
      // Check if verification was successful or if email was already verified
      if (response.status === 'success' || 
          response.message?.toLowerCase().includes('success') ||
          response.alreadyVerified) {
        
        // Store verification status
        localStorage.setItem('email_verified', 'true');
        
        const message = response.alreadyVerified ? 
          'Your email was already verified. You can now login.' :
          'Your account is now fully activated. You can now login.';
        
        toast({
          title: 'Email verified successfully!',
          description: message,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
          // Redirect to login with success message
        navigate('/tenant/login', { 
          state: { 
            verificationSuccess: true,
            message: message
          } 
        });
      } else {
        setError('Invalid verification token. Please check your email and try again.');
      }
    } catch (err) {
      setError('An error occurred during verification. Please try again.');
      console.error('Verification error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Resend verification email
  const handleResend = async () => {
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setIsResending(true);
    
    try {
      const result = await tenantAuthService.resendVerification({ email });
      
      toast({
        title: 'Verification email sent',
        description: 'Please check your inbox for the verification token',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to send verification email. Please try again later',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Resend verification error:', err);
    } finally {
      setIsResending(false);
    }
  };
  
  return (
    <Container maxW="md" py={12}>
      <Card boxShadow="lg">
        <CardHeader pb={0}>
          <VStack textAlign="center" spacing={3}>
            <Center
              w={16}
              h={16}
              bg="brand.500"
              color="white"
              rounded="full"
              mb={1}
            >
              <Icon as={FaEnvelope} boxSize={8} />
            </Center>
            <Heading size="lg">Verify Your Email</Heading>
            <Text color="gray.600" px={4}>
              We've sent a verification token to {email ? <strong>{email}</strong> : 'your email address'}.
              Please check your inbox (and spam folder) and enter the token below.
            </Text>
          </VStack>
        </CardHeader>
        
        <CardBody>
          <VStack spacing={5} as="form" onSubmit={handleSubmit}>
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="medium">How to find your token:</Text>
                <Text fontSize="sm">
                  1. Check your email inbox for a message from Rusunawa<br />
                  2. Open the email and copy the verification token<br />
                  3. Paste or type the token in the field below
                </Text>
              </Box>
            </Alert>
            
            <FormControl isInvalid={!!error}>
              <FormLabel>Verification Token</FormLabel>
              <InputGroup size="lg">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaKey} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Enter the token from your email"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  type="text"
                  required
                />
              </InputGroup>
              <FormErrorMessage>{error}</FormErrorMessage>
            </FormControl>
            
            <Button
              colorScheme="brand"
              size="lg"
              width="full"
              type="submit"
              isLoading={isSubmitting}
              loadingText="Verifying..."
            >
              Verify Email
            </Button>
          </VStack>
        </CardBody>
        
        <Divider />
        
        <CardFooter>
          <VStack width="full" spacing={4}>
            <Text fontSize="sm" textAlign="center">
              Didn't receive the token? Check your spam folder or click below to resend.
            </Text>
            
            {!email && (
              <FormControl>
                <FormLabel>Your Email</FormLabel>
                <Input
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  mb={3}
                />
              </FormControl>
            )}
            
            <Button
              variant="outline"
              colorScheme="brand"
              width="full"
              leftIcon={<FaRedo />}
              onClick={handleResend}
              isLoading={isResending}
              loadingText="Sending..."
            >
              Resend Verification Token
            </Button>
          </VStack>
        </CardFooter>
      </Card>
    </Container>
  );
};

export default VerificationPrompt;
