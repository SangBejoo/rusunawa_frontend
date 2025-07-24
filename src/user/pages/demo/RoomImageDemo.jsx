import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  Card,
  CardBody,
  CardHeader,
  Heading,
  useToast,
  Divider,
  Code,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import RoomImageGallery from '../../components/room/RoomImageGallery';
import AdminLayout from '../../components/layout/AdminLayout';

const RoomImageDemo = () => {
  const [roomId, setRoomId] = useState('1'); // Default room ID for testing
  const [showGallery, setShowGallery] = useState(false);
  const toast = useToast();

  const handleShowGallery = () => {
    if (!roomId || roomId.trim() === '') {
      toast({
        title: 'Error',
        description: 'Please enter a valid room ID',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setShowGallery(true);
  };

  const exampleResponse = {
    "images": [
      {
        "imageId": 1,
        "roomId": 1,
        "imageData": "iVBORw0KGgoAAAANSUhEUgAAAA...", // Base64 image data
        "imageName": "kafka.png",
        "contentType": "image/png",
        "fileSize": 233114,
        "isPrimary": true,
        "uploadedAt": "2025-06-18T03:06:08.323930Z"
      }
    ],
    "status": {
      "message": "Room images retrieved successfully",
      "status": "success"
    }
  };

  return (
    <AdminLayout>
      <Box p={6} maxW="1200px" mx="auto">
        <VStack spacing={6} align="stretch">
          <Heading size="lg">Room Image Gallery Demo</Heading>

          {/* API Information */}
          <Card>
            <CardHeader>
              <Heading size="md">API Information</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={4}>
                <Text>
                  <strong>Endpoint:</strong> <Code>GET /v1/rooms/{'{roomId}'}/images</Code>
                </Text>
                <Text>
                  <strong>Example URL:</strong> <Code>https://qtd9x9cp-8001.asse.devtunnels.ms/v1/rooms/1/images</Code>
                </Text>
                <Text>
                  <strong>Response Format:</strong>
                </Text>
                <Code
                  display="block"
                  whiteSpace="pre"
                  p={4}
                  bg="gray.50"
                  borderRadius="md"
                  fontSize="sm"
                  maxH="300px"
                  overflowY="auto"
                >
                  {JSON.stringify(exampleResponse, null, 2)}
                </Code>
              </VStack>
            </CardBody>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <Heading size="md">Features Implemented</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={2}>
                <Text>✅ Image data returned with binary bytes for preview</Text>
                <Text>✅ Automatic conversion to data URLs for display</Text>
                <Text>✅ Primary image marking and management</Text>
                <Text>✅ Image upload with validation (5MB max, JPEG/PNG only)</Text>
                <Text>✅ Image deletion with confirmation</Text>
                <Text>✅ Full-screen image preview modal</Text>
                <Text>✅ Download functionality</Text>
                <Text>✅ File size and upload date display</Text>
                <Text>✅ Grid layout with responsive design</Text>
              </VStack>
            </CardBody>
          </Card>

          <Divider />

          {/* Demo Interface */}
          <Card>
            <CardHeader>
              <Heading size="md">Test Room Image Gallery</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <Alert status="info">
                  <AlertIcon />
                  Enter a room ID to test the image gallery functionality. Make sure your backend server is running on port 8001.
                </Alert>

                <HStack w="100%">
                  <Text minW="80px">Room ID:</Text>
                  <Input
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="Enter room ID (e.g., 1)"
                    maxW="200px"
                  />
                  <Button
                    colorScheme="blue"
                    onClick={handleShowGallery}
                  >
                    Load Gallery
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowGallery(false)}
                  >
                    Hide Gallery
                  </Button>
                </HStack>

                {showGallery && (
                  <Box w="100%" mt={6}>
                    <RoomImageGallery
                      roomId={parseInt(roomId)}
                      isEditable={true}
                      onImagesChange={(images) => {
                        console.log('Images updated:', images);
                        toast({
                          title: 'Images Updated',
                          description: `Gallery now has ${images.length} image(s)`,
                          status: 'info',
                          duration: 2000,
                          isClosable: true,
                        });
                      }}
                    />
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Usage Instructions */}
          <Card>
            <CardHeader>
              <Heading size="md">How to Use</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={3}>
                <Text>
                  <strong>1. View Images:</strong> The gallery automatically loads all images for the specified room with preview data.
                </Text>
                <Text>
                  <strong>2. Upload Images:</strong> Click "Add Image" to upload new images (max 5MB, JPEG/PNG only).
                </Text>
                <Text>
                  <strong>3. Set Primary:</strong> Click the star icon to set an image as the primary room image.
                </Text>
                <Text>
                  <strong>4. Delete Images:</strong> Click the trash icon to delete images (with confirmation).
                </Text>
                <Text>
                  <strong>5. Preview:</strong> Click on any image to view it in full-screen mode.
                </Text>
                <Text>
                  <strong>6. Download:</strong> Use the download button in the preview modal to save images.
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    </AdminLayout>
  );
};

export default RoomImageDemo;
