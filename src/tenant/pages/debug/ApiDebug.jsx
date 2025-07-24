import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Divider,
  Code,
  Alert,
  AlertIcon,
  Spinner,
  VStack,
  HStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Input,
  FormControl,
  FormLabel,
  useToast
} from '@chakra-ui/react';
import TenantLayout from '../../components/layout/TenantLayout';
import api from '../../../utils/api';
import { checkApiConnectivity } from '../../../utils/api';
import { useTenantAuth } from '../../context/tenantAuthContext';

const ApiDebug = () => {
  const { tenant } = useTenantAuth();
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const [testResponse, setTestResponse] = useState(null);
  const [testError, setTestError] = useState(null);
  const [bookingData, setBookingData] = useState({
    tenant_id: tenant?.id || '',
    room_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
  });
  
  const toast = useToast();

  const checkConnection = async () => {
    setLoading(true);
    try {
      const isConnected = await checkApiConnectivity();
      setApiStatus(isConnected);
    } catch (error) {
      setApiStatus(false);
      console.error('Error checking API connectivity:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const testBookingEndpoint = async () => {
    setLoading(true);
    setTestResponse(null);
    setTestError(null);
    
    try {
      // Format dates to ISO format
      const formattedData = {
        ...bookingData,
        room_id: parseInt(bookingData.room_id),
        start_date: new Date(bookingData.start_date).toISOString(),
        end_date: new Date(bookingData.end_date).toISOString()
      };
      
      console.log('Testing booking endpoint with data:', formattedData);
      
      const response = await api.post('/v1/bookings', formattedData);
      setTestResponse(response.data);
      
      toast({
        title: 'API test successful',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('API test failed:', error);
      setTestError({
        message: error.message,
        response: error.response?.data || null,
        status: error.response?.status || null
      });
      
      toast({
        title: 'API test failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <TenantLayout>
      <Container maxW="container.md" py={8}>
        <Heading as="h1" size="xl" mb={6}>API Debug Tool</Heading>
        <Text mb={4}>Use this page to debug API connectivity issues.</Text>
        
        <VStack spacing={6} align="stretch">
          <Box p={4} borderWidth="1px" borderRadius="md">
            <Heading size="md" mb={4}>API Connectivity Check</Heading>
            <Button
              onClick={checkConnection}
              isLoading={loading}
              colorScheme="blue"
              mb={4}
            >
              Check API Connection
            </Button>
            
            {apiStatus !== null && (
              <Alert status={apiStatus ? "success" : "error"}>
                <AlertIcon />
                {apiStatus
                  ? "API is connected and responding."
                  : "API connection failed. Check developer console for details."
                }
              </Alert>
            )}
          </Box>
          
          <Box p={4} borderWidth="1px" borderRadius="md">
            <Heading size="md" mb={4}>Test Booking Endpoint</Heading>
            
            <VStack spacing={4} mb={4}>
              <FormControl>
                <FormLabel>Tenant ID</FormLabel>
                <Input
                  name="tenant_id"
                  value={bookingData.tenant_id}
                  onChange={handleInputChange}
                  placeholder={tenant?.id || "Enter tenant ID"}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Room ID</FormLabel>
                <Input
                  name="room_id"
                  value={bookingData.room_id}
                  onChange={handleInputChange}
                  placeholder="Enter room ID (number)"
                  type="number"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Start Date</FormLabel>
                <Input
                  name="start_date"
                  value={bookingData.start_date}
                  onChange={handleInputChange}
                  type="date"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>End Date</FormLabel>
                <Input
                  name="end_date"
                  value={bookingData.end_date}
                  onChange={handleInputChange}
                  type="date"
                />
              </FormControl>
            </VStack>
            
            <Button
              onClick={testBookingEndpoint}
              isLoading={loading}
              colorScheme="green"
              mb={4}
            >
              Test Booking Endpoint
            </Button>
            
            {testResponse && (
              <Accordion allowToggle mt={4}>
                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        Response Data
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <Box overflowX="auto">
                      <Code p={4} display="block" whiteSpace="pre" mt={3}>
                        {JSON.stringify(testResponse, null, 2)}
                      </Code>
                    </Box>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            )}
            
            {testError && (
              <Box mt={4}>
                <Alert status="error" mb={3}>
                  <AlertIcon />
                  Error: {testError.message}
                </Alert>
                
                <Accordion allowToggle>
                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          Error Details
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <Box overflowX="auto">
                        <Code p={4} display="block" whiteSpace="pre">
                          {JSON.stringify(testError, null, 2)}
                        </Code>
                      </Box>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </Box>
            )}
          </Box>
        </VStack>
      </Container>
    </TenantLayout>
  );
};

export default ApiDebug;
