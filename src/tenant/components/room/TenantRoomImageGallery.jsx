import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Image,
  Text,
  Badge,
  VStack,
  HStack,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  Tooltip,
  Flex,
  Button
} from '@chakra-ui/react';
import {
  FiEye,
  FiStar,
  FiImage,
  FiCalendar,
  FiFileText,
  FiDownload
} from 'react-icons/fi';
import { MdZoomIn } from 'react-icons/md';
import roomService from '../../services/roomService';

const TenantRoomImageGallery = React.memo(({ roomId, maxImages = null, showTitle = true }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const fetchRoomImages = useCallback(async () => {
    try {
      setLoading(true);
      console.log(`🔍 [Tenant] Fetching images for room ID: ${roomId}`);
      
      if (!roomId || roomId === 'undefined') {
        console.warn('⚠️ [Tenant] Invalid roomId for image fetch:', roomId);
        setImages([]);
        return;
      }
      
      const response = await roomService.getRoomImages(roomId);
      console.log('📷 [Tenant] Room images API response:', response);
      
      if (response.status?.status === 'success' && response.images) {
        let imagesToShow = response.images;
        
        // Limit images if maxImages is specified
        if (maxImages && maxImages > 0) {
          imagesToShow = response.images.slice(0, maxImages);
        }
        
        console.log(`✅ [Tenant] Successfully loaded ${imagesToShow.length} images`);
        setImages(imagesToShow);
      } else {
        console.warn('⚠️ [Tenant] No images found or invalid response structure:', response);
        setImages([]);
      }
    } catch (error) {
      console.error('❌ [Tenant] Error fetching room images:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [roomId, maxImages]);
  useEffect(() => {
    console.log('🔍 [Tenant] TenantRoomImageGallery received roomId:', roomId);
    if (roomId && roomId !== 'undefined') {
      fetchRoomImages();
    } else {
      console.warn('⚠️ [Tenant] No valid roomId provided to TenantRoomImageGallery:', roomId);
      setLoading(false);
      setImages([]);
    }
  }, [roomId, fetchRoomImages]);

  const handleImagePreview = (image) => {
    setSelectedImage(image);
    onPreviewOpen();
  };

  const downloadImage = (image) => {
    if (image.imageUrl) {
      const link = document.createElement('a');
      link.href = image.imageUrl;
      link.download = image.imageName || 'room-image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <Center py={8}>
        <VStack>
          <Spinner size="lg" />
          <Text>Loading room images...</Text>
        </VStack>
      </Center>
    );
  }

  if (images.length === 0) {
    return (
      <Alert status="info">
        <AlertIcon />
        No images available for this room
      </Alert>
    );
  }

  return (
    <Box>
      {showTitle && (
        <Text fontSize="lg" fontWeight="semibold" mb={4}>
          Room Images ({images.length})
        </Text>
      )}

      {/* Images Grid */}
      <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={4}>
        {images.map((image) => (
          <Card key={image.imageId} overflow="hidden" cursor="pointer">
            <CardBody p={0}>
              <Box position="relative">
                {/* Image */}
                {image.imageUrl ? (
                  <Image
                    src={image.imageUrl}
                    alt={image.imageName}
                    objectFit="cover"
                    w="100%"
                    h="150px"
                    onClick={() => handleImagePreview(image)}
                    _hover={{ opacity: 0.8 }}
                    transition="opacity 0.2s"
                    fallback={
                      <Center h="150px" bg="gray.100">
                        <VStack>
                          <FiImage size="40px" color="gray.400" />
                          <Text fontSize="sm" color="gray.500">
                            Image Failed to Load
                          </Text>
                        </VStack>
                      </Center>
                    }
                  />
                ) : (
                  <Center h="150px" bg="gray.100">
                    <VStack>
                      <FiImage size="40px" color="gray.400" />
                      <Text fontSize="sm" color="gray.500">
                        No Preview Available
                      </Text>
                    </VStack>
                  </Center>
                )}
                
                {/* Primary Badge */}
                {image.isPrimary && (
                  <Badge
                    position="absolute"
                    top={2}
                    left={2}
                    colorScheme="yellow"
                    variant="solid"
                    fontSize="xs"
                  >
                    Primary
                  </Badge>
                )}
                
                {/* View Button */}
                <Flex
                  position="absolute"
                  top={2}
                  right={2}
                  gap={1}
                >
                  <Tooltip label="View Full Size">
                    <IconButton
                      icon={<MdZoomIn />}
                      size="xs"
                      colorScheme="blue"
                      variant="solid"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImagePreview(image);
                      }}
                    />
                  </Tooltip>
                </Flex>
              </Box>
              
              {/* Image Info */}
              <VStack align="start" p={3} spacing={1}>
                <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                  {image.imageName}
                </Text>
                <HStack fontSize="xs" color="gray.600">
                  <FiFileText />
                  <Text>{image.fileSizeFormatted || `${(image.fileSize / 1024).toFixed(1)} KB`}</Text>
                </HStack>
                <HStack fontSize="xs" color="gray.600">
                  <FiCalendar />
                  <Text>
                    {image.uploadedAt ? 
                      new Date(image.uploadedAt).toLocaleDateString() : 
                      'Unknown date'
                    }
                  </Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </Grid>

      {/* Image Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <FiEye />
              <Text>{selectedImage?.imageName}</Text>
              {selectedImage?.isPrimary && (
                <Badge colorScheme="yellow" ml={2}>
                  <HStack spacing={1}>
                    <FiStar size="10px" />
                    <Text fontSize="xs">Primary</Text>
                  </HStack>
                </Badge>
              )}
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            {selectedImage?.imageUrl && (
              <Image
                src={selectedImage.imageUrl}
                alt={selectedImage.imageName}
                maxH="70vh"
                maxW="100%"
                objectFit="contain"
                mx="auto"
                display="block"
              />
            )}
            
            {/* Image Details */}
            <VStack align="start" mt={4} spacing={2}>
              <HStack>
                <Text fontWeight="medium">File Size:</Text>
                <Text>{selectedImage?.fileSizeFormatted || `${(selectedImage?.fileSize / 1024).toFixed(1)} KB`}</Text>
              </HStack>
              <HStack>
                <Text fontWeight="medium">Content Type:</Text>
                <Text>{selectedImage?.contentType}</Text>
              </HStack>
              <HStack>
                <Text fontWeight="medium">Uploaded:</Text>
                <Text>
                  {selectedImage?.uploadedAt ? 
                    new Date(selectedImage.uploadedAt).toLocaleDateString() : 
                    'Unknown date'
                  }
                </Text>
              </HStack>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button
              leftIcon={<FiDownload />}
              onClick={() => downloadImage(selectedImage)}
              mr={3}
            >
              Download
            </Button>
            <Button variant="ghost" onClick={onPreviewClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
});

TenantRoomImageGallery.displayName = 'TenantRoomImageGallery';

export default TenantRoomImageGallery;
