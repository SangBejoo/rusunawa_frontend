// Enhanced Issue Reporting Page with Photo Upload Capabilities
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  Textarea,
  Select,
  Button,
  Card,
  CardBody,
  CardHeader,
  Image,
  IconButton,
  Badge,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  useColorModeValue,
  Flex,
  SimpleGrid,
  AspectRatio,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tooltip,
  CircularProgress,
  CircularProgressLabel
} from '@chakra-ui/react';
import {
  FaCamera,
  FaUpload,
  FaTrash,
  FaEye,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowLeft,
  FaPlus,
  FaEdit
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import TenantLayout from '../../components/layout/TenantLayout';
import enhancedIssueService from '../../services/enhancedIssueService';
import { useTenantAuth } from '../../context/tenantAuthContext';

const EnhancedReportIssuePage = () => {
  const { tenant } = useTenantAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    location: '',
    booking_id: '',
    contact_info: ''
  });

  // Photo management
  const [photos, setPhotos] = useState([]);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Categories and other data
  const [categories, setCategories] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Load categories
        const categoriesResponse = await enhancedIssueService.getIssueCategoriesWithStats();
        setCategories(categoriesResponse.categories || []);

        // TODO: Load user's active bookings for location selection
        // const bookingsResponse = await bookingService.getTenantActiveBookings(tenant.id);
        // setBookings(bookingsResponse.bookings || []);

      } catch (error) {
        console.error('Error loading initial data:', error);
        toast({
          title: 'Loading Error',
          description: 'Failed to load form data. Please refresh the page.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    if (tenant?.id) {
      loadInitialData();
    }
  }, [tenant?.id, toast]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Photo dropzone configuration
  const onDrop = useCallback((acceptedFiles) => {
    const maxPhotos = 5;
    const currentCount = photos.length;
    const remainingSlots = maxPhotos - currentCount;

    if (acceptedFiles.length > remainingSlots) {
      toast({
        title: 'Too Many Photos',
        description: `You can only add ${remainingSlots} more photo(s). Maximum ${maxPhotos} photos allowed.`,
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      acceptedFiles = acceptedFiles.slice(0, remainingSlots);
    }

    const newPhotos = acceptedFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      uploaded: false
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
  }, [photos.length, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024 // 10MB per file
  });

  // Remove photo
  const removePhoto = (photoId) => {
    setPhotos(prev => {
      const updated = prev.filter(photo => photo.id !== photoId);
      // Revoke object URL to prevent memory leaks
      const photoToRemove = prev.find(photo => photo.id === photoId);
      if (photoToRemove?.preview) {
        URL.revokeObjectURL(photoToRemove.preview);
      }
      return updated;
    });
  };

  // Preview photo
  const previewPhoto = (photo) => {
    setPhotoPreview(photo);
    onOpen();
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.title || formData.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters long';
    }

    if (!formData.description || formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters long';
    }

    if (!formData.category) {
      errors.category = 'Please select a category';
    }

    if (!formData.priority) {
      errors.priority = 'Please select priority level';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please correct the errors in the form.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const issueData = {
        ...formData,
        tenant_id: tenant.id,
        reported_by_user_id: tenant.user_id
      };

      const photoFiles = photos.map(photo => photo.file);

      const response = await enhancedIssueService.reportIssueWithPhotos(
        issueData,
        photoFiles,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      toast({
        title: 'Issue Reported Successfully',
        description: `Your issue has been reported with ID: ${response.issue?.id || 'N/A'}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Navigate to issues list
      navigate('/tenant/issues');

    } catch (error) {
      console.error('Error reporting issue:', error);
      toast({
        title: 'Report Failed',
        description: error.message || 'Failed to report issue. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  // Priority color mapping
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  // Category icon mapping
  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'electrical': return '⚡';
      case 'plumbing': return '🚿';
      case 'hvac': return '❄️';
      case 'cleaning': return '🧽';
      case 'maintenance': return '🔧';
      case 'security': return '🔒';
      default: return '🏠';
    }
  };

  if (loading) {
    return (
      <TenantLayout>
        <Container maxW="container.lg" py={8}>
          <VStack spacing={8} align="center">
            <CircularProgress isIndeterminate color="brand.500" size="80px" />
            <Text>Loading form data...</Text>
          </VStack>
        </Container>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Container maxW="container.lg" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <HStack mb={4}>
              <Button
                leftIcon={<FaArrowLeft />}
                variant="ghost"
                onClick={() => navigate('/tenant/issues')}
              >
                Back to Issues
              </Button>
            </HStack>
            
            <Heading size="xl" mb={2}>
              Report Maintenance Issue
            </Heading>
            <Text color="gray.600">
              Describe the issue you're experiencing and upload photos to help us understand the problem better.
            </Text>
          </Box>

          {/* Main Form */}
          <form onSubmit={handleSubmit}>
            <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
              {/* Left Column - Form Fields */}
              <GridItem>
                <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                  <CardHeader>
                    <Heading size="md">Issue Details</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={6} align="stretch">
                      {/* Title */}
                      <FormControl isRequired isInvalid={!!validationErrors.title}>
                        <FormLabel>Issue Title</FormLabel>
                        <Input
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="Brief description of the issue"
                          size="lg"
                        />
                        <FormErrorMessage>{validationErrors.title}</FormErrorMessage>
                        <FormHelperText>Provide a clear, descriptive title (minimum 5 characters)</FormHelperText>
                      </FormControl>

                      {/* Category and Priority */}
                      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                        <FormControl isRequired isInvalid={!!validationErrors.category}>
                          <FormLabel>Category</FormLabel>
                          <Select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            placeholder="Select category"
                            size="lg"
                          >
                            {categories.map(category => (
                              <option key={category.id} value={category.code}>
                                {getCategoryIcon(category.name)} {category.name}
                              </option>
                            ))}
                          </Select>
                          <FormErrorMessage>{validationErrors.category}</FormErrorMessage>
                        </FormControl>

                        <FormControl isRequired isInvalid={!!validationErrors.priority}>
                          <FormLabel>Priority Level</FormLabel>
                          <Select
                            name="priority"
                            value={formData.priority}
                            onChange={handleInputChange}
                            size="lg"
                          >
                            <option value="low">🟢 Low - Minor issue</option>
                            <option value="medium">🟡 Medium - Moderate issue</option>
                            <option value="high">🔴 High - Urgent issue</option>
                          </Select>
                          <FormErrorMessage>{validationErrors.priority}</FormErrorMessage>
                        </FormControl>
                      </Grid>

                      {/* Description */}
                      <FormControl isRequired isInvalid={!!validationErrors.description}>
                        <FormLabel>Detailed Description</FormLabel>
                        <Textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Please describe the issue in detail..."
                          rows={6}
                          resize="vertical"
                        />
                        <FormErrorMessage>{validationErrors.description}</FormErrorMessage>
                        <FormHelperText>
                          Provide as much detail as possible (minimum 10 characters)
                        </FormHelperText>
                      </FormControl>

                      {/* Location */}
                      <FormControl>
                        <FormLabel>Location/Room</FormLabel>
                        <Input
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          placeholder="Specific location within your accommodation"
                        />
                        <FormHelperText>
                          e.g., "Bathroom", "Kitchen", "Bedroom", etc.
                        </FormHelperText>
                      </FormControl>

                      {/* Contact Info */}
                      <FormControl>
                        <FormLabel>Additional Contact Info</FormLabel>
                        <Input
                          name="contact_info"
                          value={formData.contact_info}
                          onChange={handleInputChange}
                          placeholder="Alternative phone number or contact method"
                        />
                        <FormHelperText>
                          Optional: Provide alternative contact if needed
                        </FormHelperText>
                      </FormControl>
                    </VStack>
                  </CardBody>
                </Card>
              </GridItem>

              {/* Right Column - Photo Upload */}
              <GridItem>
                <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                  <CardHeader>
                    <HStack justify="space-between">
                      <Heading size="md">Photos</Heading>
                      <Badge colorScheme="blue">{photos.length}/5</Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.600">
                      Upload up to 5 photos to help explain the issue
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {/* Photo Upload Zone */}
                      {photos.length < 5 && (
                        <Box
                          {...getRootProps()}
                          p={6}
                          border="2px dashed"
                          borderColor={isDragActive ? "brand.500" : borderColor}
                          borderRadius="lg"
                          bg={isDragActive ? hoverBgColor : "transparent"}
                          textAlign="center"
                          cursor="pointer"
                          transition="all 0.2s"
                          _hover={{ borderColor: "brand.500", bg: hoverBgColor }}
                        >
                          <input {...getInputProps()} />
                          <VStack spacing={3}>
                            <FaCamera size="2em" color="gray" />
                            <Text fontWeight="medium">
                              {isDragActive ? 'Drop photos here' : 'Click or drag photos here'}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              JPG, PNG, WEBP up to 10MB each
                            </Text>
                          </VStack>
                        </Box>
                      )}

                      {/* Photo Previews */}
                      {photos.length > 0 && (
                        <SimpleGrid columns={2} spacing={3}>
                          {photos.map((photo) => (
                            <Box key={photo.id} position="relative">
                              <AspectRatio ratio={1}>
                                <Image
                                  src={photo.preview}
                                  alt={photo.name}
                                  objectFit="cover"
                                  borderRadius="md"
                                  border="1px solid"
                                  borderColor={borderColor}
                                />
                              </AspectRatio>
                              
                              {/* Photo Controls */}
                              <HStack
                                position="absolute"
                                top={2}
                                right={2}
                                spacing={1}
                              >
                                <Tooltip label="Preview">
                                  <IconButton
                                    icon={<FaEye />}
                                    size="sm"
                                    colorScheme="blue"
                                    variant="solid"
                                    onClick={() => previewPhoto(photo)}
                                  />
                                </Tooltip>
                                <Tooltip label="Remove">
                                  <IconButton
                                    icon={<FaTrash />}
                                    size="sm"
                                    colorScheme="red"
                                    variant="solid"
                                    onClick={() => removePhoto(photo.id)}
                                  />
                                </Tooltip>
                              </HStack>

                              {/* Photo Info */}
                              <Box
                                position="absolute"
                                bottom={0}
                                left={0}
                                right={0}
                                bg="blackAlpha.700"
                                color="white"
                                p={2}
                                borderBottomRadius="md"
                              >
                                <Text fontSize="xs" isTruncated>
                                  {photo.name}
                                </Text>
                                <Text fontSize="xs">
                                  {(photo.size / 1024 / 1024).toFixed(1)} MB
                                </Text>
                              </Box>
                            </Box>
                          ))}
                        </SimpleGrid>
                      )}

                      {/* Upload Tips */}
                      {photos.length === 0 && (
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <AlertTitle fontSize="sm">Photo Tips:</AlertTitle>
                            <AlertDescription fontSize="xs">
                              • Take clear, well-lit photos
                              • Show the problem from different angles
                              • Include context (surrounding area)
                            </AlertDescription>
                          </Box>
                        </Alert>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Submit Button */}
                <Card bg={bgColor} borderColor={borderColor} borderWidth="1px" mt={6}>
                  <CardBody>
                    <VStack spacing={4}>
                      {isSubmitting && (
                        <Box w="full">
                          <Text fontSize="sm" mb={2}>
                            Uploading... {uploadProgress}%
                          </Text>
                          <Progress value={uploadProgress} colorScheme="brand" />
                        </Box>
                      )}
                      
                      <Button
                        type="submit"
                        colorScheme="brand"
                        size="lg"
                        leftIcon={<FaUpload />}
                        isLoading={isSubmitting}
                        loadingText="Reporting Issue..."
                        w="full"
                        disabled={photos.length === 0 && !formData.description}
                      >
                        Report Issue
                      </Button>
                      
                      <Text fontSize="xs" color="gray.500" textAlign="center">
                        You'll receive updates about your issue via notifications
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>
          </form>
        </VStack>

        {/* Photo Preview Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Photo Preview</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {photoPreview && (
                <VStack spacing={4}>
                  <Image
                    src={photoPreview.preview}
                    alt={photoPreview.name}
                    maxH="400px"
                    objectFit="contain"
                    borderRadius="md"
                  />
                  <Box textAlign="center">
                    <Text fontWeight="medium">{photoPreview.name}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {(photoPreview.size / 1024 / 1024).toFixed(1)} MB
                    </Text>
                  </Box>
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </TenantLayout>
  );
};

export default EnhancedReportIssuePage;
