import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Image,
  IconButton,
  Card,
  CardBody,
  Badge,
  Alert,
  AlertIcon,
  Progress,
  SimpleGrid,
  useToast,
  Flex,
  Center,
  Input,
  Switch,
  FormControl,
  FormLabel,
  Tooltip
} from '@chakra-ui/react';
import {
  FiUpload,
  FiTrash2,
  FiStar,
  FiEye,
  FiImage,
  FiX,
  FiCamera,
  FiCheck
} from 'react-icons/fi';

const ImageUploadPreview = ({
  images = [],
  onImagesChange,
  maxImages = 10,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  showPrimaryToggle = true,
  readOnly = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const handleFiles = useCallback(async (files) => {
    if (readOnly) return;

    const fileArray = Array.from(files);
    
    // Validate file count
    if (images.length + fileArray.length > maxImages) {
      toast({
        title: 'Too many images',
        description: `Maximum ${maxImages} images allowed`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate files
    const validFiles = [];
    for (const file of fileArray) {
      if (!acceptedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not a supported image format`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        continue;
      }
      
      if (file.size > maxFileSize) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        continue;
      }
      
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      const newImages = await Promise.all(
        validFiles.map(async (file, index) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                id: `temp_${Date.now()}_${index}`,
                file: file,
                imageData: e.target.result,
                imageName: file.name,
                contentType: file.type,
                isPrimary: images.length === 0 && index === 0, // First image is primary by default
                isUploaded: false,
                uploadProgress: 0
              });
            };
            reader.readAsDataURL(file);
          });
        })
      );

      onImagesChange([...images, ...newImages]);
      
      toast({
        title: 'Images added',
        description: `${newImages.length} image(s) ready for upload`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process images',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  }, [images, onImagesChange, maxImages, maxFileSize, acceptedTypes, readOnly, toast]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const removeImage = (imageId) => {
    if (readOnly) return;
    
    const newImages = images.filter(img => img.id !== imageId);
    
    // If we removed the primary image, make the first remaining image primary
    if (newImages.length > 0 && !newImages.some(img => img.isPrimary)) {
      newImages[0].isPrimary = true;
    }
    
    onImagesChange(newImages);
  };

  const setPrimaryImage = (imageId) => {
    if (readOnly) return;
    
    const newImages = images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }));
    onImagesChange(newImages);
  };

  const openFileDialog = () => {
    if (readOnly) return;
    fileInputRef.current?.click();
  };

  return (
    <VStack spacing={6} w="full">
      {/* Upload Area */}
      {!readOnly && images.length < maxImages && (
        <Box w="full">
          <Text fontWeight="semibold" mb={3}>
            Upload Images ({images.length}/{maxImages})
          </Text>
          
          <Box
            border="2px dashed"
            borderColor={dragActive ? 'blue.500' : 'gray.300'}
            borderRadius="lg"
            p={8}
            textAlign="center"
            cursor="pointer"
            bg={dragActive ? 'blue.50' : 'gray.50'}
            _hover={{ borderColor: 'blue.400', bg: 'blue.50' }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFileDialog}
          >
            <VStack spacing={3}>
              <FiUpload size={32} color="gray" />
              <VStack spacing={1}>
                <Text fontWeight="medium">
                  Click to upload or drag and drop
                </Text>
                <Text fontSize="sm" color="gray.600">
                  PNG, JPG, WEBP up to {Math.round(maxFileSize / 1024 / 1024)}MB
                </Text>
              </VStack>
              {uploading && <Progress isIndeterminate w="200px" size="sm" />}
            </VStack>
          </Box>

          <Input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: 'none' }}
          />
        </Box>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <Box w="full">
          <Text fontWeight="semibold" mb={3}>
            Image Preview
          </Text>
          
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {images.map((image, index) => (
              <Card key={image.id} overflow="hidden" position="relative">
                <Box position="relative">
                  <Image
                    src={image.imageData || image.url}
                    alt={image.imageName || `Room image ${index + 1}`}
                    w="full"
                    h="200px"
                    objectFit="cover"
                  />
                  
                  {/* Overlay badges and controls */}
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    bg="blackAlpha.300"
                    opacity={0}
                    _hover={{ opacity: 1 }}
                    transition="opacity 0.2s"
                  >
                    <Flex
                      direction="column"
                      justify="space-between"
                      h="full"
                      p={2}
                    >
                      {/* Top badges */}
                      <HStack justify="space-between">
                        <HStack>
                          {image.isPrimary && (
                            <HStack spacing={1}>
                              <FiStar size={12} />
                              <Badge colorScheme="yellow">
                                Primary
                              </Badge>
                            </HStack>
                          )}
                          {!image.isUploaded && (
                            <Badge colorScheme="orange">
                              Pending
                            </Badge>
                          )}
                        </HStack>
                        
                        {!readOnly && (
                          <IconButton
                            icon={<FiX />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => removeImage(image.id)}
                          />
                        )}
                      </HStack>

                      {/* Bottom controls */}
                      <HStack justify="center" spacing={2}>
                        {showPrimaryToggle && !readOnly && !image.isPrimary && (
                          <Tooltip label="Set as primary image">
                            <IconButton
                              icon={<FiStar />}
                              size="sm"
                              colorScheme="yellow"
                              variant="solid"
                              onClick={() => setPrimaryImage(image.id)}
                            />
                          </Tooltip>
                        )}
                      </HStack>
                    </Flex>
                  </Box>
                </Box>

                <CardBody p={3}>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                      {image.imageName || 'Untitled'}
                    </Text>
                    <HStack justify="space-between" w="full">
                      <Text fontSize="xs" color="gray.600">
                        {image.contentType}
                      </Text>
                      {image.file && (
                        <Text fontSize="xs" color="gray.600">
                          {(image.file.size / 1024 / 1024).toFixed(1)}MB
                        </Text>
                      )}
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* Empty state */}
      {images.length === 0 && readOnly && (
        <Card w="full">
          <CardBody>
            <Center py={8}>
              <VStack spacing={3}>
                <FiImage size={48} color="gray" />
                <Text color="gray.500">No images available</Text>
              </VStack>
            </Center>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
};

export default ImageUploadPreview;
