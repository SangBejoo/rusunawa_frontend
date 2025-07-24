import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  VStack,
  Text,
  Alert,
  AlertIcon,
  InputGroup,
  InputRightElement,
  IconButton,
  Link as ChakraLink,
  useColorModeValue,
  Flex,
  PinInput,
  PinInputField,
  HStack
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import tenantAuthService from '../../services/tenantAuthService';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token');
  
  const [token, setToken] = useState(urlToken || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  
  // Move all useColorModeValue calls to the top level
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const boxBgColor = useColorModeValue('white', 'gray.700');
  const inputBgColor = useColorModeValue('white', 'gray.700');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!token || token.length !== 6) {
      setError('Please enter the 6-digit reset code from your email.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setIsLoading(true);
    try {
      await tenantAuthService.resetPassword({ 
        token: token,
        new_password: password 
      });
      setIsSubmitted(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/tenant/login');
      }, 3000);
    } catch (err) {
      setError('Failed to reset password. The reset code may be expired or invalid.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex
      minH={'100vh'}
      align={'center'}
      justify={'center'}
      bg={bgColor}
    >
      <Container maxW="md" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
        <Box
          py="8"
          px={{ base: '4', sm: '10' }}
          bg={boxBgColor}
          boxShadow={'lg'}
          borderRadius={'xl'}
        >
          <VStack spacing="6">
            <Heading as="h1" size="xl">
              Reset Password
            </Heading>
            
            <Text textAlign="center" color="gray.500">
              Enter the 6-digit code sent to your email and create a new password.
            </Text>
            
            {!urlToken && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                Check your email for the 6-digit reset code.
              </Alert>
            )}
            
            {isSubmitted ? (
              <Box textAlign="center">
                <Alert status="success" borderRadius="md" mb={4}>
                  <AlertIcon />
                  Password successfully reset!
                </Alert>
                <Text mb={4}>
                  You will be redirected to login shortly...
                </Text>
                <Button as={Link} to="/tenant/login" colorScheme="brand" width="full">
                  Go to Login
                </Button>
              </Box>
            ) : (
              <>                
                {error && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {error}
                  </Alert>
                )}
                
                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                  <VStack spacing="5" align="flex-start">
                    {!urlToken && (
                      <FormControl isRequired>
                        <FormLabel htmlFor="resetCode" textAlign="center">
                          Enter 6-Digit Reset Code
                        </FormLabel>
                        <Box display="flex" justifyContent="center">
                          <PinInput 
                            value={token}
                            onChange={setToken}
                            size="lg"
                            placeholder=""
                            type="number"
                          >
                            <PinInputField />
                            <PinInputField />
                            <PinInputField />
                            <PinInputField />
                            <PinInputField />
                            <PinInputField />
                          </PinInput>
                        </Box>
                      </FormControl>
                    )}
                    
                    <FormControl isRequired>
                      <FormLabel htmlFor="password">New Password</FormLabel>
                      <InputGroup>
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          bg={inputBgColor}
                          placeholder="Enter new password"
                        />
                        <InputRightElement>
                          <IconButton
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                            onClick={() => setShowPassword(!showPassword)}
                            variant="ghost"
                          />
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel htmlFor="confirmPassword">Confirm New Password</FormLabel>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        bg={inputBgColor}
                        placeholder="Confirm new password"
                      />
                    </FormControl>
                    
                    <Button
                      type="submit"
                      colorScheme="brand"
                      size="lg"
                      fontSize="md"
                      isLoading={isLoading}
                      loadingText="Resetting Password..."
                      width="full"
                      isDisabled={!token || token.length !== 6}
                    >
                      Reset Password
                    </Button>
                  </VStack>
                </form>
                
                <VStack spacing={3} pt={4}>
                  <Text align="center">
                    Remember your password?{' '}
                    <ChakraLink as={Link} to="/tenant/login" color="brand.500">
                      Sign in
                    </ChakraLink>
                  </Text>
                  
                  <ChakraLink 
                    as={Link} 
                    to="/tenant/forgot-password" 
                    display="flex" 
                    alignItems="center"
                    color="gray.500"
                    fontSize="sm"
                  >
                    <ArrowBackIcon mr={1} /> Need a new reset code?
                  </ChakraLink>
                </VStack>
              </>
            )}
          </VStack>
        </Box>
      </Container>
    </Flex>
  );
};

export default ResetPassword;
