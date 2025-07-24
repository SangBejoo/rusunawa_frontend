import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  useToast,
  Flex,
  Icon,
  Spinner,
  Image,
  Card,
  CardBody,
  CardFooter,
} from '@chakra-ui/react';
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useTenantAuth } from '../../context/tenantAuthContext';
import placeholderImages from '../../../utils/placeholderImages';

const VerifyEmail = () => {
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('');
  
  const { verifyEmail } = useTenantAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  // Get verification token from URL query parameters
  const query = new URLSearchParams(location.search);
  const token = query.get('token');
  
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }
      
      try {
        // Call the verification endpoint with the token
        const result = await verifyEmail(token);
        
        if (result.success) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
          
          // Store verification status in local storage
          localStorage.setItem('email_verified', 'true');
          
          // Show success toast
          toast({
            title: 'Email verified',
            description: 'Your account has been successfully verified.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        } else {
          setStatus('error');
          setMessage(result.error || 'Failed to verify your email. Please try again.');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    };
    
    verifyToken();
  }, [token, verifyEmail, toast]);
  
  const renderContent = () => {
    switch (status) {
      case 'checking':
        return (
          <VStack spacing={6}>
            <Spinner size="xl" color="brand.500" thickness="4px" />
            <Text>Verifying your email address...</Text>
          </VStack>
        );
        
      case 'success':
        return (
          <VStack spacing={6}>
            <Icon as={FaCheckCircle} boxSize={16} color="green.500" />
            <Heading size="md" textAlign="center">Email Verified Successfully!</Heading>
            <Text textAlign="center">
              Your email address has been verified. You can now access all features of your account.
            </Text>
            <Button
              as={RouterLink}
              to="/tenant/dashboard"
              colorScheme="brand"
              size="lg"
              width="full"
            >
              Go to Dashboard
            </Button>
          </VStack>
        );
        
      case 'error':
        return (
          <VStack spacing={6}>
            <Icon as={FaTimesCircle} boxSize={16} color="red.500" />
            <Heading size="md" textAlign="center">Verification Failed</Heading>
            <Text textAlign="center">
              {message || 'We could not verify your email address. The verification link may be invalid or expired.'}
            </Text>
            <Button
              as={RouterLink}
              to="/tenant/verification-prompt"
              colorScheme="brand"
              size="lg"
              width="full"
            >
              Try Again
            </Button>
          </VStack>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Container maxW="md" py={12}>
      <Card boxShadow="lg">
        <CardBody>
          <VStack spacing={6} align="center" py={4}>
            <Image
              src={placeholderImages.emailVerification}
              alt="Email Verification"
              maxWidth="200px"
              fallbackSrc={placeholderImages.emailVerification}
            />
            <Heading size="lg" textAlign="center">Email Verification</Heading>
            
            {renderContent()}
          </VStack>
        </CardBody>
        
        <CardFooter>
          <VStack width="full">
            <Button
              as={RouterLink}
              to="/tenant"
              variant="ghost"
              width="full"
            >
              Return to Home
            </Button>
          </VStack>
        </CardFooter>
      </Card>
    </Container>
  );
};

export default VerifyEmail;
