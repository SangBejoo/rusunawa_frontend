import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Image,
  Text,
  Badge,
  VStack,
  HStack,
  IconButton,
  Button,
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
  useToast,
  Card,
  CardBody,
  Tooltip,
  Flex,
  Divider
} from '@chakra-ui/react';
import {
  FiEye,
  FiTrash2,
  FiStar,
  FiPlus,
  FiDownload,
  FiImage,
  FiCalendar,
  FiFileText
} from 'react-icons/fi';
import roomService from '../../services/roomService';

const RoomImageGallery = React.memo(({ roomId, isEditable = false, onImagesChange }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const toast = useToast();
  useEffect(() => {
    console.log('🔍 RoomImageGallery received roomId:', roomId);
    if (roomId) {
      fetchRoomImages();
    } else {
      console.warn('⚠️ No roomId provided to RoomImageGallery');
    }  }, [roomId]);
  
  const fetchRoomImages = useCallback(async () => {
    try {
      setLoading(true);
      console.log(`🔍 Fetching images for room ID: ${roomId}`);
      
      const response = await roomService.getRoomImages(roomId);
      console.log('📷 Room images API response:', response);
        if (response.status?.status === 'success' && response.images) {
        console.log(`✅ Successfully loaded ${response.images.length} images`);
        setImages(response.images);
        if (onImagesChange) {
          onImagesChange(response.images);
        }      } else {
        console.warn('⚠️ No images found or invalid response structure:', response);
        setImages([]);
        if (onImagesChange) {
          onImagesChange([]);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching room images:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch room images: ${error.message}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });      setImages([]);
      if (onImagesChange) {
        onImagesChange([]);
      }
    } finally {
      setLoading(false);
    }
  }, [roomId, onImagesChange, toast]);

  const handleImagePreview = (image) => {
    setSelectedImage(image);
    onPreviewOpen();
  };
  const handleSetPrimary = async (imageId) => {
    try {
      await roomService.setPrimaryRoomImage(imageId, roomId);
      toast({
        title: 'Success',
        description: 'Primary image updated successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      fetchRoomImages(); // Refresh images
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to set primary image',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  const handleDeleteImage = async (imageId) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await roomService.deleteRoomImage(imageId, roomId);
        toast({
          title: 'Success',
          description: 'Image deleted successfully',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
        fetchRoomImages(); // Refresh images
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete image',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // Validate file
      roomService.validateImageFile(file);
      
      setUploading(true);
      
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(',')[1]; // Remove data:image/... prefix
          
          await roomService.addRoomImage(roomId, {
            image_data: base64Data,
            image_name: file.name,
            content_type: file.type,
            is_primary: images.length === 0 // First image is primary
          });
          
          toast({
            title: 'Success',
            description: 'Image uploaded successfully',
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
          
          fetchRoomImages(); // Refresh images
        } catch (uploadError) {
          toast({
            title: 'Error',
            description: uploadError.message || 'Failed to upload image',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        } finally {
          setUploading(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (validationError) {
      toast({
        title: 'Validation Error',
        description: validationError.message,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const downloadImage = (image) => {
    if (!image.imageUrl) return;
    
    const link = document.createElement('a');
    link.href = image.imageUrl;
    link.download = image.imageName || 'room-image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Center h="200px">
        <Spinner size="lg" />
      </Center>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={4}>
        <HStack>
          <FiImage />
          <Text fontSize="lg" fontWeight="semibold">
            Room Images ({images.length})
          </Text>
        </HStack>
        
        {isEditable && (
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            size="sm"
            isLoading={uploading}
            loadingText="Uploading..."
            onClick={() => document.getElementById('image-upload').click()}
          >
            Add Image
          </Button>
        )}
      </Flex>

      {/* Hidden file input */}
      {isEditable && (
        <input
          id="image-upload"
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
      )}

      {/* Images Grid */}
      {images.length === 0 ? (
        <Alert status="info">
          <AlertIcon />
          No images available for this room
        </Alert>
      ) : (        <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={4}>
          {images.map((image) => (
            <Card key={image.imageId} overflow="hidden" cursor="pointer">
              <CardBody p={0}>
                <Box position="relative">{/* Image */}
                  {image.imageUrl ? (                    <Image
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
                      leftIcon={<FiStar />}
                    >
                      Primary
                    </Badge>
                  )}
                  
                  {/* Actions */}
                  {isEditable && (
                    <Flex
                      position="absolute"
                      top={2}
                      right={2}
                      direction="column"
                      gap={1}
                    >
                      <Tooltip label="Set as Primary">
                        <IconButton
                          icon={<FiStar />}
                          size="xs"
                          colorScheme={image.isPrimary ? "yellow" : "gray"}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!image.isPrimary) {
                              handleSetPrimary(image.imageId);
                            }
                          }}
                        />
                      </Tooltip>
                      
                      <Tooltip label="Delete Image">
                        <IconButton
                          icon={<FiTrash2 />}
                          size="xs"
                          colorScheme="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(image.imageId);
                          }}
                        />
                      </Tooltip>
                    </Flex>
                  )}
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
                  </HStack>                </VStack>
              </CardBody>
            </Card>
          ))}
        </Grid>
      )}

      {/* Image Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <FiImage />
              <Text>{selectedImage?.imageName}</Text>
              {selectedImage?.isPrimary && (
                <Badge colorScheme="yellow" leftIcon={<FiStar />}>
                  Primary
                </Badge>
              )}
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            {selectedImage && (
              <VStack spacing={4}>
                {/* Large Image Preview */}
                <Image
                  src={selectedImage.imageUrl}
                  alt={selectedImage.imageName}
                  maxH="500px"
                  maxW="100%"
                  objectFit="contain"
                  borderRadius="md"
                />
                
                <Divider />
                
                {/* Image Details */}
                <Grid templateColumns="repeat(2, 1fr)" gap={4} w="100%">
                  <VStack align="start">
                    <Text fontSize="sm" fontWeight="medium">File Name:</Text>
                    <Text fontSize="sm" color="gray.600">{selectedImage.imageName}</Text>
                  </VStack>
                  
                  <VStack align="start">
                    <Text fontSize="sm" fontWeight="medium">Content Type:</Text>
                    <Text fontSize="sm" color="gray.600">{selectedImage.contentType}</Text>
                  </VStack>
                  
                  <VStack align="start">
                    <Text fontSize="sm" fontWeight="medium">File Size:</Text>
                    <Text fontSize="sm" color="gray.600">
                      {selectedImage.fileSizeFormatted || `${(selectedImage.fileSize / 1024).toFixed(1)} KB`}
                    </Text>
                  </VStack>
                  
                  <VStack align="start">
                    <Text fontSize="sm" fontWeight="medium">Uploaded:</Text>
                    <Text fontSize="sm" color="gray.600">
                      {selectedImage.uploadedAt ? 
                        new Date(selectedImage.uploadedAt).toLocaleDateString() : 
                        'Unknown date'
                      }
                    </Text>
                  </VStack>
                </Grid>
              </VStack>
            )}
          </ModalBody>
          
          <ModalFooter>
            <HStack>
              <Button
                leftIcon={<FiDownload />}
                onClick={() => downloadImage(selectedImage)}
                variant="outline"
              >
                Download
              </Button>
              
              {isEditable && !selectedImage?.isPrimary && (
                <Button
                  leftIcon={<FiStar />}
                  colorScheme="yellow"
                  onClick={() => {
                    handleSetPrimary(selectedImage.imageId);
                    onPreviewClose();
                  }}
                >
                  Set as Primary
                </Button>
              )}
              
              <Button onClick={onPreviewClose}>
                Close
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
});

export default RoomImageGallery;
