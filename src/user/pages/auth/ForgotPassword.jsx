import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  VStack,
  Heading,
  Text,
  Link,
  Alert,
  AlertIcon,
  useToast,
  Card,
  CardBody,
  Flex,
  Image,
  Stack,
  Icon,
  Divider
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { FaEnvelope, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '../../context/authContext';
import rusunawa_logo from '../../../assets/images/rusunawa-logo.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  if (isSubmitted) {
    return (
      <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
        <Stack spacing="8">
          <Flex direction="column" align="center">
            <Image src={rusunawa_logo} alt="Rusunawa PNJ Logo" boxSize="80px" mb={4} />
            <Heading size="lg" color="brand.700" textAlign="center">
              Reset Link Sent
            </Heading>
          </Flex>
          
          <Card>
            <CardBody>
              <VStack spacing={6}>
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Email Sent Successfully!</Text>
                    <Text fontSize="sm">
                      If an account with that email exists, we've sent a password reset email containing a 6-digit code.
                    </Text>
                  </Box>
                </Alert>

                <VStack spacing={4} align="stretch" width="100%">
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Check your email for a message from Rusunawa PNJ. The email will contain a 6-digit code that you can use to reset your password.
                  </Text>
                  
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    The reset code will expire in 24 hours for security reasons.
                  </Text>
                </VStack>

                <Button as={RouterLink} to="/admin/reset-password" colorScheme="brand" size="lg" mt={4}>
                  Continue to Reset Password
                </Button>
                
                <Button as={RouterLink} to="/admin/login" leftIcon={<ArrowBackIcon />} variant="outline" mt={2}>
                  Back to Login
                </Button>
              </VStack>
            </CardBody>
          </Card>
          
          <Text fontSize="sm" color="gray.500" textAlign="center">
            Didn't receive the email? Check your spam folder or{' '}
            <Link as={RouterLink} to="/admin/login" alignSelf="center" display="flex" alignItems="center">
              <Icon as={ArrowBackIcon} mr={1} />
              try logging in again
            </Link>
          </Text>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
      <Stack spacing="8">
        <Flex direction="column" align="center">
          <Image src={rusunawa_logo} alt="Rusunawa PNJ Logo" boxSize="80px" mb={4} />
          <Heading size="lg" color="brand.700" textAlign="center">
            Reset Your Password
          </Heading>
          <Text mt={2} fontSize="sm" color="gray.600" textAlign="center">
            Enter your email address and we'll send you a 6-digit reset code
          </Text>
        </Flex>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Admin Password Reset</Text>
                    <Text fontSize="sm">
                      This is for Rusunawa PNJ admin accounts only. Enter your admin email address to receive a reset code.
                    </Text>
                  </Box>
                </Alert>

                <FormControl isInvalid={errors.email} isRequired>
                  <FormLabel color="gray.700" fontWeight="medium">
                    <Icon as={FaEnvelope} mr={2} />
                    Admin Email Address
                  </FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={handleChange}
                    placeholder="your.admin@rusunawa.com"
                    size="lg"
                    focusBorderColor="brand.500"
                  />
                  <FormErrorMessage>{errors.email}</FormErrorMessage>
                </FormControl>

                <VStack spacing={3} width="100%">
                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    width="100%"
                    isLoading={isLoading}
                    loadingText="Sending Reset Code..."
                    leftIcon={<FaShieldAlt />}
                  >
                    Send Reset Code
                  </Button>
                  
                  <Divider />
                  
                  <Button 
                    as={RouterLink} 
                    to="/admin/login" 
                    variant="ghost" 
                    leftIcon={<ArrowBackIcon />}
                    size="lg"
                    width="100%"
                  >
                    Back to Login
                  </Button>
                </VStack>
              </VStack>
            </form>
          </CardBody>
        </Card>

        <Text fontSize="xs" color="gray.500" textAlign="center">
          For security reasons, we'll send the reset code only if the email is registered in our system.
          If you don't receive an email within a few minutes, please check your spam folder.
        </Text>
      </Stack>
    </Container>
  );
};

export default ForgotPassword;
