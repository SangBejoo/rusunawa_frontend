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
  Image
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import rusunawa_logo from '../../../assets/images/rusunawa-logo.png';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear login error when user starts typing
    if (loginError) {
      setLoginError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Frontend validation first
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setLoginError('');

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        toast({
          title: 'Login successful',
          description: 'Welcome back!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/admin/dashboard');
      } else if (result.error) {
        // Enhanced error handling for backend responses
        let errorMessage = 'Invalid email or password';
        
        if (result.error.includes('invalid email or password')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (result.error.includes('Login failed')) {
          errorMessage = 'Login failed. Please verify your email and password.';
        } else {
          errorMessage = result.error;
        }
        
        setLoginError(errorMessage);
        toast({
          title: 'Login Failed',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        setLoginError('Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different types of errors
      let errorMessage = 'An error occurred. Please try again.';
      
      if (error.response && error.response.data) {
        const responseData = error.response.data;
        if (responseData.message && responseData.message.includes('invalid email or password')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (responseData.message) {
          errorMessage = responseData.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setLoginError(errorMessage);
      toast({
        title: 'Login Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" py={12}>
      <Container maxW="md">
        <VStack spacing={8} align="stretch">
          {/* Logo and Title */}
          <VStack spacing={4}>
            <Box>
              <Image 
                src={rusunawa_logo}
                alt="Rusunawa Logo" 
                maxH="80px"
                mx="auto"
              />
            </Box>
            <VStack spacing={2}>
              <Heading size="xl" color="gray.700">
                Admin Login
              </Heading>
              <Text color="gray.600" textAlign="center">
                Welcome back! Please sign in to your account.
              </Text>
            </VStack>
          </VStack>

          {/* Login Form */}
          <Card>
            <CardBody>
              {loginError && (
                <Alert status="error" mb={4} borderRadius="md">
                  <AlertIcon />
                  {loginError}
                </Alert>
              )}
              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isInvalid={!!errors.email}>
                    <FormLabel>Email Address</FormLabel>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      size="lg"
                    />
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.password}>
                    <FormLabel>Password</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        size="lg"
                      />
                      <InputRightElement h="full">
                        <IconButton
                          variant="ghost"
                          icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        />
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    width="full"
                    isLoading={isLoading}
                    loadingText="Signing in..."
                  >
                    Sign In
                  </Button>
                </VStack>
              </form>
            </CardBody>
          </Card>

          {/* Links */}
          <VStack spacing={2}>
            <Link as={RouterLink} to="/admin/forgot-password" color="brand.500">
              Forgot your password?
            </Link>
            <Text color="gray.600" fontSize="sm">
              Contact your system administrator for account creation.
            </Text>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default Login;
