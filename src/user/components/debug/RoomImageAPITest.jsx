import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  Text,
  Code,
  Alert,
  AlertIcon,
  useToast
} from '@chakra-ui/react';
import roomService from '../../services/roomService';

function RoomImageAPITest() {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const testAPI = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      console.log('🧪 Starting API test...');
      
      // Test direct API call
      const result = await roomService.getRoomImages(1);
      console.log('🎯 API Test Result:', result);
      
      setTestResult({
        success: true,
        data: result,
        message: `Successfully loaded ${result.images?.length || 0} images`
      });
      
      toast({
        title: 'API Test Success',
        description: `Found ${result.images?.length || 0} images`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('🚨 API Test Error:', error);
      
      setTestResult({
        success: false,
        error: error.message,
        message: 'API test failed'
      });
      
      toast({
        title: 'API Test Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={4} borderWidth={1} borderRadius="md" bg="gray.50">
      <VStack spacing={4} align="stretch">
        <Text fontWeight="bold">Room Images API Test</Text>
        
        <Button 
          onClick={testAPI} 
          isLoading={loading}
          loadingText="Testing API..."
          colorScheme="blue"
          size="sm"
        >
          Test Room 1 Images API
        </Button>
        
        {testResult && (
          <>
            <Alert status={testResult.success ? 'success' : 'error'}>
              <AlertIcon />
              {testResult.message}
            </Alert>
            
            <Code 
              display="block" 
              whiteSpace="pre-wrap" 
              p={3} 
              maxH="300px" 
              overflowY="auto"
              fontSize="xs"
            >
              {JSON.stringify(testResult.success ? testResult.data : testResult.error, null, 2)}
            </Code>
          </>
        )}
      </VStack>
    </Box>  );
}

export default RoomImageAPITest;
