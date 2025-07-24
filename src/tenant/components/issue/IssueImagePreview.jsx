import React, { useState } from 'react';
import {
  Box,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  IconButton,
  HStack,
  VStack,
  Text,
  Button,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import {
  FaExpand,
  FaDownload,
  FaSearchPlus,
  FaSearchMinus,
  FaSync
} from 'react-icons/fa';
import issueService from '../../services/issueService';

const IssueImagePreview = ({ issue, showThumbnail = true, size = "100px" }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(100);
  const toast = useToast();

  // Color mode values
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('white', 'gray.700');

  // Load full image when modal opens
  const handleImageClick = async () => {
    if (!issue.has_image_attachment) {
      return;
    }

    setLoading(true);
    setError(null);
    onOpen();

    try {
      // Get image with base64 encoding for display
      const response = await fetch(`/v1/issues/${issue.issue_id}/image?encoding=base64`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load image');
      }

      const data = await response.json();
      
      if (data.image_content && data.file_type) {
        setImageData({
          src: `data:${data.file_type};base64,${data.image_content}`,
          fileType: data.file_type,
          metadata: data.metadata
        });
      } else {
        throw new Error('Invalid image data received');
      }
    } catch (err) {
      console.error('Error loading issue image:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to load image',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Download image
  const handleDownload = async () => {
    try {
      const response = await fetch(`/v1/issues/${issue.issue_id}/image?encoding=binary`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download image');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `issue-${issue.issue_id}-image.${imageData?.fileType?.split('/')[1] || 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Image downloaded successfully',
        status: 'success',
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to download image',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleResetZoom = () => setZoom(100);

  if (!issue.has_image_attachment) {
    return null;
  }

  const thumbnailUrl = issue.image_thumbnail_url || `/v1/issues/${issue.issue_id}/image?format=jpeg&max_width=150&max_height=150`;

  return (
    <>
      {/* Thumbnail */}
      {showThumbnail && (
        <Box
          position="relative"
          cursor="pointer"
          onClick={handleImageClick}
          borderRadius="md"
          overflow="hidden"
          borderWidth="1px"
          borderColor={borderColor}
          _hover={{ opacity: 0.8, transform: 'scale(1.02)' }}
          transition="all 0.2s"
          bg={bgColor}
        >
          <Image
            src={thumbnailUrl}
            alt="Issue image"
            boxSize={size}
            objectFit="cover"
            fallback={
              <Box
                boxSize={size}
                bg="gray.200"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="xs" color="gray.500">
                  Image
                </Text>
              </Box>
            }
          />
          
          {/* Expand overlay */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.400"
            display="flex"
            alignItems="center"
            justifyContent="center"
            opacity={0}
            _hover={{ opacity: 1 }}
            transition="opacity 0.2s"
          >
            <IconButton
              icon={<FaExpand />}
              colorScheme="whiteAlpha"
              variant="solid"
              size="sm"
            />
          </Box>
        </Box>
      )}

      {/* Full Image Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent maxW="90vw" maxH="90vh" bg="transparent" shadow="none">
          <ModalHeader bg="blackAlpha.700" color="white" borderTopRadius="md">
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold">Issue #{issue.issue_id} - Image</Text>
                {imageData?.metadata && (
                  <Text fontSize="sm" opacity={0.8}>
                    {imageData.metadata.format?.toUpperCase()} • {imageData.metadata.size_bytes ? `${(imageData.metadata.size_bytes / 1024).toFixed(1)} KB` : ''}
                  </Text>
                )}
              </VStack>
              
              <HStack spacing={2}>
                <Tooltip label="Zoom Out">
                  <IconButton
                    icon={<FaSearchMinus />}
                    size="sm"
                    onClick={handleZoomOut}
                    isDisabled={zoom <= 25}
                    colorScheme="whiteAlpha"
                    variant="ghost"
                  />
                </Tooltip>
                
                <Text color="white" fontSize="sm" minW="60px" textAlign="center">
                  {zoom}%
                </Text>
                
                <Tooltip label="Zoom In">
                  <IconButton
                    icon={<FaSearchPlus />}
                    size="sm"
                    onClick={handleZoomIn}
                    isDisabled={zoom >= 300}
                    colorScheme="whiteAlpha"
                    variant="ghost"
                  />
                </Tooltip>
                
                <Tooltip label="Reset Zoom">
                  <IconButton
                    icon={<FaSync />}
                    size="sm"
                    onClick={handleResetZoom}
                    colorScheme="whiteAlpha"
                    variant="ghost"
                  />
                </Tooltip>
                
                <Tooltip label="Download">
                  <IconButton
                    icon={<FaDownload />}
                    size="sm"
                    onClick={handleDownload}
                    colorScheme="whiteAlpha"
                    variant="ghost"
                    isDisabled={!imageData}
                  />
                </Tooltip>
              </HStack>
            </HStack>
          </ModalHeader>
          
          <ModalCloseButton color="white" />
          
          <ModalBody p={0} bg="black" borderBottomRadius="md">
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              minH="60vh"
              maxH="80vh"
              overflow="auto"
              position="relative"
            >
              {loading && (
                <VStack spacing={4} color="white">
                  <Spinner size="xl" />
                  <Text>Loading image...</Text>
                </VStack>
              )}
              
              {error && (
                <Alert status="error" maxW="400px">
                  <AlertIcon />
                  {error}
                </Alert>
              )}
              
              {imageData && !loading && !error && (
                <Image
                  src={imageData.src}
                  alt="Issue image"
                  maxW="none"
                  maxH="none"
                  objectFit="contain"
                  transform={`scale(${zoom / 100})`}
                  transition="transform 0.3s ease"
                  cursor={zoom > 100 ? 'move' : 'default'}
                />
              )}
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default IssueImagePreview;
