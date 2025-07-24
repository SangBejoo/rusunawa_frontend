import React, { useState } from 'react';
import { Button, VStack, Text, Code, Alert, AlertIcon } from '@chakra-ui/react';
import roomService from '../services/roomService';

const RoomDetailsDebugger = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testRoomDetailsAPI = async () => {
    setLoading(true);
    try {
      console.log('Testing room details API...');
      
      // Test room ID 1
      const roomId = 1;
      const response = await roomService.getRoomById(roomId);
      
      console.log('API Response:', response);
      
      setTestResult({
        success: true,
        data: response,
        message: 'Room details loaded successfully!'
      });
      
    } catch (error) {
      console.error('API Test Error:', error);
      setTestResult({
        success: false,
        error: error.message,
        message: 'Failed to load room details'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <VStack spacing={4} p={4} border="1px" borderColor="gray.200" borderRadius="md">
      <Text fontWeight="bold">Room Details API Debugger</Text>
      
      <Button 
        onClick={testRoomDetailsAPI} 
        isLoading={loading}
        colorScheme="blue"
      >
        Test Room Details API
      </Button>
      
      {testResult && (
        <VStack spacing={3} w="full">
          <Alert status={testResult.success ? "success" : "error"}>
            <AlertIcon />
            {testResult.message}
          </Alert>
          
          {testResult.success ? (
            <VStack align="start" w="full">
              <Text fontWeight="bold">Room Data:</Text>
              <Code p={3} w="full" fontSize="sm">
                {JSON.stringify(testResult.data, null, 2)}
              </Code>
            </VStack>
          ) : (
            <VStack align="start" w="full">
              <Text fontWeight="bold">Error Details:</Text>
              <Code p={3} w="full" fontSize="sm" colorScheme="red">
                {testResult.error}
              </Code>
            </VStack>
          )}
        </VStack>
      )}
    </VStack>
  );
};

export default RoomDetailsDebugger;
