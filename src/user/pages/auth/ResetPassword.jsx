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
  InputGroup,
  InputRightElement,
  IconButton,
  useToast,
  Card,
  CardBody,
  Flex,
  Image,
  Stack,
  Icon,
  Divider,
  PinInput,
  PinInputField,
  HStack
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { FaLock, FaShieldAlt, FaKey } from 'react-icons/fa';
import { useAuth } from '../../context/authContext';
import rusunawa_logo from '../../../assets/images/rusunawa-logo.png';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    token: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.token || formData.token.length !== 6) {
      newErrors.token = 'Please enter the complete 6-digit code';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const result = await resetPassword(formData.token, formData.newPassword);
      if (result.success) {
        setIsSubmitted(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/admin/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Reset password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTokenChange = (value) => {
    setFormData(prev => ({
      ...prev,
      token: value
    }));
    
    if (errors.token) {
      setErrors(prev => ({ ...prev, token: '' }));
    }
  };

  if (isSubmitted) {
    return (
      <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
        <Stack spacing="8">
          <Flex direction="column" align="center">
            <Image src={rusunawa_logo} alt="Rusunawa PNJ Logo" boxSize="80px" mb={4} />
            <Heading size="lg" color="brand.700" textAlign="center">
              Password Reset Successful
            </Heading>
          </Flex>
          
          <Card>
            <CardBody>
              <VStack spacing={6}>
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Password Updated!</Text>
                    <Text fontSize="sm">
                      Your admin password has been successfully reset. You can now login with your new password.
                    </Text>
                  </Box>
                </Alert>

                <Button as={Link} to="/admin/login" colorScheme="brand" width="full">
                  Continue to Login
                </Button>
              </VStack>
            </CardBody>
          </Card>
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
            Enter the 6-digit code from your email and create a new password
          </Text>
        </Flex>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Reset Code Required</Text>
                    <Text fontSize="sm">
                      Enter the 6-digit code sent to your admin email address.
                    </Text>
                  </Box>
                </Alert>

                <FormControl isInvalid={errors.token} isRequired>
                  <FormLabel color="gray.700" fontWeight="medium">
                    <Icon as={FaKey} mr={2} />
                    6-Digit Reset Code
                  </FormLabel>
                  <HStack justify="center">
                    <PinInput
                      size="lg"
                      value={formData.token}
                      onChange={handleTokenChange}
                      placeholder=""
                      focusBorderColor="brand.500"
                      errorBorderColor="red.500"
                    >
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                    </PinInput>
                  </HStack>
                  <FormErrorMessage textAlign="center">{errors.token}</FormErrorMessage>
                  <Text fontSize="xs" color="gray.500" textAlign="center" mt={2}>
                    Check your email for the 6-digit code
                  </Text>
                </FormControl>

                <FormControl isInvalid={errors.newPassword} isRequired>
                  <FormLabel color="gray.700" fontWeight="medium">
                    <Icon as={FaLock} mr={2} />
                    New Password
                  </FormLabel>
                  <InputGroup size="lg">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="Enter your new password"
                      focusBorderColor="brand.500"
                    />
                    <InputRightElement>
                      <IconButton
                        variant="ghost"
                        onClick={() => setShowPassword(!showPassword)}
                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        size="sm"
                      />
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage>{errors.newPassword}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={errors.confirmPassword} isRequired>
                  <FormLabel color="gray.700" fontWeight="medium">
                    <Icon as={FaLock} mr={2} />
                    Confirm New Password
                  </FormLabel>
                  <InputGroup size="lg">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your new password"
                      focusBorderColor="brand.500"
                    />
                    <InputRightElement>
                      <IconButton
                        variant="ghost"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                        size="sm"
                      />
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                </FormControl>

                <VStack spacing={3} width="100%">
                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    width="100%"
                    isLoading={isLoading}
                    loadingText="Resetting Password..."
                    leftIcon={<FaShieldAlt />}
                  >
                    Reset Password
                  </Button>
                  
                  <Divider />
                  
                  <HStack spacing={4} width="100%">
                    <Button 
                      as={RouterLink} 
                      to="/admin/login" 
                      variant="outline"
                      leftIcon={<ArrowBackIcon />}
                      flex={1}
                    >
                      Back to Login
                    </Button>
                    
                    <Button 
                      as={RouterLink} 
                      to="/admin/forgot-password" 
                      variant="ghost"
                      flex={1}
                    >
                      Resend Code
                    </Button>
                  </HStack>
                </VStack>
              </VStack>
            </form>
          </CardBody>
        </Card>

        <Text fontSize="xs" color="gray.500" textAlign="center">
          Your reset code will expire in 24 hours. If you need help, please contact system administrator.
        </Text>
      </Stack>
    </Container>
  );
};

export default ResetPassword;
