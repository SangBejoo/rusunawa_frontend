// Room Details Debug Component
import React, { useState } from 'react';
import { Button, VStack, Text, Card, CardBody, Code } from '@chakra-ui/react';
import roomService from '../services/roomService';

const RoomDetailsDebug = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testRoomDetails = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing room details API...');
      const response = await roomService.getRoomById(1);
      console.log('✅ Success:', response);
      setResult({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('❌ Error:', error);
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <VStack spacing={4} p={4}>
      <Button onClick={testRoomDetails} isLoading={loading} colorScheme="blue">
        Test Room Details API (Room ID: 1)
      </Button>
      
      {result && (
        <Card w="full">
          <CardBody>
            <VStack align="start" spacing={3}>
              <Text fontWeight="bold">
                Result: {result.success ? '✅ Success' : '❌ Error'}
              </Text>
              
              {result.success ? (
                <Code p={3} borderRadius="md" w="full">
                  {JSON.stringify(result.data, null, 2)}
                </Code>
              ) : (
                <Text color="red.500">{result.error}</Text>
              )}
            </VStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
};

export default RoomDetailsDebug;
