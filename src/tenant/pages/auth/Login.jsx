import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Stack,
  Text,
  VStack,
  HStack,
  useToast,
  useColorModeValue,
  Icon,
  Divider,
  Image,
  Card,
  CardBody,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { FaEnvelope, FaLock, FaSchool } from 'react-icons/fa';
import { useTenantAuth } from '../../context/tenantAuthContext';
import tenantAuthService from '../../services/tenantAuthService';
import rusunavaLogo from '../../../assets/images/rusunawa-logo.png';

const Login = () => {
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasVerificationMessage, setHasVerificationMessage] = useState(false);
  const [error, setError] = useState('');
  
  // Colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const labelColor = useColorModeValue('gray.700', 'gray.200');
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login, isAuthenticated } = useTenantAuth();
  
  // Get the redirect destination from state, sessionStorage, or default to dashboard
  const getRedirectPath = () => {
    // Priority: 1. from state, 2. stored location, 3. dashboard
    if (location.state?.from?.pathname) {
      return location.state.from.pathname;
    }
    
    const storedLocation = sessionStorage.getItem('tenant_last_location');
    if (storedLocation && storedLocation !== '/tenant/login') {
      return storedLocation;
    }
    
    return '/tenant/dashboard';
  };
  
  const from = getRedirectPath();
  // Check if redirected from email verification
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const verified = params.get('verified');
    const email = params.get('email');
    
    if (verified === 'true') {
      setHasVerificationMessage(true);
      if (email) setFormData(prev => ({ ...prev, email }));
      toast({
        title: 'Verifikasi Email Berhasil',
        description: 'Kamu sekarang dapat masuk ke akunmu.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [location, toast]);
  
  // Show success message if redirected from verification
  useEffect(() => {
    if (location.state?.verificationSuccess) {
      toast({
        title: "Email Berhasil Diverifikasi!",
        description: location.state.message || "Email kamu berhasil diverifikasi. Silakan masuk.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      // Clear location state to prevent showing the message again on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location, toast, navigate]);  // Redirect if already authenticated - but only after successful login, not on page load
  useEffect(() => {
    // Only redirect if we're on the login page and user just logged in
    // Don't redirect on initial page load or refresh
    if (isAuthenticated && location.pathname === '/tenant/login') {
      // Check if this is a fresh login (not a page refresh)
      const isFromSuccessfulLogin = sessionStorage.getItem('just_logged_in');
      if (isFromSuccessfulLogin) {
        sessionStorage.removeItem('just_logged_in');
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, navigate, from, location.pathname]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    const val = name === 'rememberMe' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    
    // Clear specific field errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear general error message when user starts typing
    if (error) {
      setError('');
    }
  };

  // Frontend validation function
  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Masukkan alamat email yang valid';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Kata sandi wajib diisi';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Kata sandi minimal 6 karakter';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

    // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Frontend validation first
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call login with email and password
      const result = await login({
        email: formData.email,
        password: formData.password
      });
      if (result.success) {
        // Set flag to indicate successful login
        sessionStorage.setItem('just_logged_in', 'true');
        
        // Clear stored location after successful login
        sessionStorage.removeItem('tenant_last_location');
        
        // If login is successful, the context will handle authentication
        // and redirect will happen via the useEffect that watches isAuthenticated
        toast({
          title: 'Berhasil Masuk',
          description: 'Selamat datang kembali!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Navigate to the intended destination
        navigate(from, { replace: true });
      } else if (result.needsVerification) {
        // Handle email verification needed
        navigate('/tenant/verification-prompt', { 
          state: { 
            email: formData.email,
            from: from 
          }
        });
      } else {
        // Enhanced error handling for backend responses
        let errorMessage = 'Email atau kata sandi salah';
        
        if (result.error) {
          if (result.error.includes('invalid email or password')) {
            errorMessage = 'Email atau kata sandi salah. Silakan cek kembali.';
          } else if (result.error.includes('Login failed')) {
            errorMessage = 'Gagal masuk. Silakan cek email dan kata sandi.';
          } else {
            errorMessage = result.error;
          }
        }
        
        setError(errorMessage);
        toast({
          title: 'Gagal Masuk',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle different types of errors
      let errorMessage = 'Terjadi kesalahan. Silakan coba lagi.';
      
      if (err.response && err.response.data) {
        const responseData = err.response.data;
        if (responseData.message && responseData.message.includes('invalid email or password')) {
          errorMessage = 'Email atau kata sandi salah. Silakan cek kembali.';
        } else if (responseData.message) {
          errorMessage = responseData.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast({
        title: 'Kesalahan Masuk',
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
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="container.xl" py={10}>
        <Stack direction={{ base: 'column', md: 'row' }} spacing={8}>
          {/* Left side - Image and info (for desktop) */}
          <Box display={{ base: 'none', md: 'block' }} flexBasis={{ md: '50%' }}>
            <VStack align="start" spacing={6}>
                <Heading as="h1" size="xl">
                  Selamat Datang di Rusunawa PNJ
                </Heading>
                <Image 
                src={rusunavaLogo} 
                alt="Rusunawa PNJ Logo" 
                borderRadius="md" 
                boxShadow="lg"
                w="100%"
                h="400px" 
                objectFit="contain"
                fallbackSrc={rusunavaLogo}
              />
              
              <Text fontSize="lg">
                Rusunawa PNJ menyediakan hunian nyaman dan terjangkau untuk mahasiswa dan profesional di Politeknik Negeri Jakarta.
              </Text>
              
              <Card variant="outline" width="100%">
                <CardBody>
                  <Heading size="md" mb={4}>
                    Kenapa Memilih Rusunawa PNJ?
                  </Heading>
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Icon as={FaSchool} color="brand.500" />
                      <Text>Lokasi strategis di dalam kampus</Text>
                    </HStack>
                    <HStack>
                      <Icon as={FaSchool} color="brand.500" />
                      <Text>Keamanan & dukungan 24 jam</Text>
                    </HStack>
                    <HStack>
                      <Icon as={FaSchool} color="brand.500" />
                      <Text>Harga terjangkau untuk mahasiswa</Text>
                    </HStack>
                    <HStack>
                      <Icon as={FaSchool} color="brand.500" />
                      <Text>Fasilitas nyaman & terawat</Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </Box>
          
          {/* Right side - Login form */}
          <Box flexBasis={{ base: '100%', md: '50%' }}>
            <Card bg={cardBg} p={8} borderRadius="lg" boxShadow="md">
              <CardBody>
                <VStack spacing={6} as="form" onSubmit={handleSubmit}>
                  <Heading textAlign="center">Masuk ke Akun Anda</Heading>
                  
                  {/* Email verification success message */}
                  {hasVerificationMessage && (
                    <Alert status="success" borderRadius="md">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Email berhasil diverifikasi!</AlertTitle>
                        <AlertDescription>
                          Email kamu sudah diverifikasi. Silakan masuk ke akunmu.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  )}
                  
                  {/* Login error message */}
                  {error && (
                    <Alert status="error" borderRadius="md">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Gagal Masuk!</AlertTitle>
                        <AlertDescription>
                          {error}
                        </AlertDescription>
                      </Box>
                    </Alert>
                  )}
                  
                  <FormControl isInvalid={!!errors.email}>
                    <FormLabel color={labelColor}>
                      <HStack spacing={2}>
                        <Icon as={FaEnvelope} />
                        <Text>Alamat Email</Text>
                      </HStack>
                    </FormLabel>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="emailkamu@email.com"
                      size="lg"
                      autoComplete="email"
                    />
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  </FormControl>
                  
                  <FormControl isInvalid={!!errors.password}>
                    <FormLabel color={labelColor}>
                      <HStack spacing={2}>
                        <Icon as={FaLock} />
                        <Text>Kata Sandi</Text>
                      </HStack>
                    </FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Masukkan kata sandi"
                        size="lg"
                        autoComplete="current-password"
                      />
                      <InputRightElement width="4.5rem" h="100%">
                        <Button
                          h="1.75rem"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          variant="ghost"
                        >
                          {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                  </FormControl>
                    <HStack justify="flex-end" width="100%">
                    <Link as={RouterLink} to="/tenant/forgot-password" color="brand.500">
                      Lupa kata sandi?
                    </Link>
                  </HStack>
                  
                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    width="100%"
                    isLoading={isLoading}
                    loadingText="Sedang Masuk"
                  >
                    Masuk
                  </Button>
                  
                  <Divider />
                  <Text textAlign="center">
                    Belum punya akun?{' '}
                    <Link as={RouterLink} to="/tenant/register" color="brand.500" fontWeight="semibold">
                      Daftar Sekarang
                    </Link>
                  </Text>
                </VStack>
              </CardBody>
            </Card>
              {/* Link to homepage (displayed only on mobile) */}
            <Box display={{ base: 'block', md: 'none' }} textAlign="center" mt={4}>
              <Link as={RouterLink} to="/" color="brand.500">
                ← Kembali ke Beranda
              </Link>
            </Box>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default Login;
