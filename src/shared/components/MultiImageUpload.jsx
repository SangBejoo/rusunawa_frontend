import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Card,
  CardBody,
  Image,
  IconButton,
  Progress,
  Grid,
  GridItem,
  Badge,
  Flex,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import {
  FaUpload,
  FaImage,
  FaTimes,
  FaCamera,
  FaTrash,
  FaEye,
  FaPlus,
  FaCloudUploadAlt,
  FaFileImage
} from 'react-icons/fa';

const MultiImageUpload = ({
  images = [],
  onImagesChange,
  maxImages = 5,
  maxSizePerFile = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  title = "Upload Images",
  description = "Drag and drop images here, or click to select files",
  contextDescription = "Evidence photos",
  disabled = false,
  required = false,
  showPreview = true,
  allowReorder = true
}) => {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBorderColor = useColorModeValue('blue.300', 'blue.500');
  const dragBorderColor = useColorModeValue('blue.500', 'blue.300');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');

  const handleFileValidation = (file) => {
    // Check file size
    if (file.size > maxSizePerFile) {
      toast({
        title: 'File too large',
        description: `Maximum file size is ${Math.round(maxSizePerFile / (1024 * 1024))}MB`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: `Only ${acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} formats are supported`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    return true;
  };

  const processFiles = useCallback(async (files) => {
    const fileArray = Array.from(files);
    
    // Check total count
    if (images.length + fileArray.length > maxImages) {
      toast({
        title: 'Too many files',
        description: `Maximum ${maxImages} images allowed`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const newImages = [];
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      
      if (!handleFileValidation(file)) {
        continue;
      }

      try {
        // Create preview and process file
        const preview = URL.createObjectURL(file);
        const base64 = await convertToBase64(file);
        
        const imageData = {
          id: Date.now() + i, // Temporary ID
          file,
          preview,
          fileName: file.name,
          fileType: file.type,
          size: file.size,
          base64: base64,
          contextDescription: contextDescription,
          isPrimary: images.length === 0 && i === 0, // First image is primary
          uploaded: false
        };

        newImages.push(imageData);
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        toast({
          title: 'Error processing file',
          description: `Failed to process ${file.name}`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }
  }, [images, maxImages, acceptedTypes, maxSizePerFile, contextDescription, onImagesChange, toast]);

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [disabled, processFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = (imageId) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    
    // Clean up preview URL
    const imageToRemove = images.find(img => img.id === imageId);
    if (imageToRemove && imageToRemove.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    
    onImagesChange(updatedImages);
  };

  const setPrimaryImage = (imageId) => {
    const updatedImages = images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }));
    onImagesChange(updatedImages);
  };

  const openFileDialog = () => {
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click();
    }
  };

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        {/* Upload Area */}
        <Card
          bg={cardBg}
          borderWidth="2px"
          borderStyle="dashed"
          borderColor={
            isDragging ? dragBorderColor :
            disabled ? borderColor :
            hoverBorderColor
          }
          p={6}
          textAlign="center"          cursor={disabled ? "not-allowed" : "pointer"}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
          _hover={!disabled ? {
            borderColor: hoverBorderColor,
            bg: hoverBg
          } : {}}
          transition="all 0.2s"
        >
          <CardBody>
            <VStack spacing={3}>
              <Icon
                as={images.length > 0 ? FaFileImage : FaCloudUploadAlt}
                size="3xl"
                color={disabled ? "gray.400" : "blue.500"}
                w={12}
                h={12}
              />
              <Box>
                <Text fontSize="lg" fontWeight="medium" color={disabled ? "gray.400" : textColor}>
                  {title}
                </Text>
                <Text fontSize="sm" color={disabled ? "gray.400" : textColor} mt={1}>
                  {description}
                </Text>
              </Box>
              
              {/* File info */}
              <VStack spacing={1}>
                <Text fontSize="xs" color="gray.500">
                  Max {maxImages} files, {Math.round(maxSizePerFile / (1024 * 1024))}MB each
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Supported: {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}
                </Text>
              </VStack>

              {/* Current count */}
              {images.length > 0 && (
                <Badge colorScheme="blue" variant="subtle">
                  {images.length} of {maxImages} files selected
                </Badge>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={disabled}
        />

        {/* Image Previews */}
        {showPreview && images.length > 0 && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={3} color={textColor}>
              Selected Images ({images.length})
            </Text>
            <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={4}>
              {images.map((image, index) => (
                <GridItem key={image.id}>
                  <Card
                    bg={cardBg}
                    borderWidth="1px"
                    borderColor={image.isPrimary ? "blue.500" : borderColor}
                    overflow="hidden"
                    position="relative"
                  >
                    <Box position="relative">
                      <Image
                        src={image.preview || image.url}
                        alt={image.fileName}
                        w="100%"
                        h="150px"
                        objectFit="cover"
                      />
                      
                      {/* Primary badge */}
                      {image.isPrimary && (
                        <Badge
                          position="absolute"
                          top={2}
                          left={2}
                          colorScheme="blue"
                          variant="solid"
                          fontSize="xs"
                        >
                          Primary
                        </Badge>
                      )}
                      
                      {/* Action buttons */}
                      <HStack
                        position="absolute"
                        top={2}
                        right={2}
                        spacing={1}
                      >
                        {!image.isPrimary && (
                          <IconButton
                            icon={<FaEye />}
                            size="xs"
                            colorScheme="blue"
                            variant="solid"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrimaryImage(image.id);
                            }}
                            title="Set as primary"
                          />
                        )}
                        <IconButton
                          icon={<FaTimes />}
                          size="xs"
                          colorScheme="red"
                          variant="solid"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(image.id);
                          }}
                          title="Remove image"
                        />
                      </HStack>
                    </Box>
                    
                    <CardBody p={3}>
                      <VStack spacing={1} align="start">
                        <Text fontSize="xs" fontWeight="medium" noOfLines={1}>
                          {image.fileName}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {(image.size / 1024).toFixed(1)} KB
                        </Text>
                        {image.contextDescription && (
                          <Text fontSize="xs" color="gray.500">
                            {image.contextDescription}
                          </Text>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </GridItem>
              ))}
            </Grid>
          </Box>
        )}

        {/* Validation message */}
        {required && images.length === 0 && (
          <Alert status="warning" size="sm">
            <AlertIcon />
            <AlertDescription>
              At least one image is required
            </AlertDescription>
          </Alert>
        )}
      </VStack>
    </Box>
  );
};

export default MultiImageUpload;
