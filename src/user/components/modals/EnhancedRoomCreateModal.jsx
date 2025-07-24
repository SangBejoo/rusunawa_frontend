import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  SimpleGrid,
  Box,
  Alert,
  AlertIcon,
  useToast,
  Spinner,
  Badge,
  Card,
  CardBody,
  Heading,
  Image,
  IconButton,
  Grid,
  GridItem,
  Flex,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tag,
  TagLabel,
  TagCloseButton,
  Switch,
  FormHelperText,
  Progress,
  Center,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps
} from '@chakra-ui/react';
import {
  FiHome,
  FiUsers,
  FiDollarSign,
  FiCamera,
  FiTrash2,
  FiEye,
  FiPlus,
  FiX,
  FiUpload,
  FiStar,
  FiCheck,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import roomService from '../../services/roomService';
import ImageUploadPreview from '../common/ImageUploadPreview';
import AmenityManager from '../common/AmenityManager';

const EnhancedRoomCreateModal = ({ isOpen, onClose, onRoomCreated }) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef(null);
  
  // Add type_id for room type selection
  const [formData, setFormData] = useState({
    type_id: '', // 1: mahasiswa, 2: non_mahasiswa, 3: ruang_rapat
    name: '',
    description: '',
    capacity: 1,
    classification_id: '',
    rental_type_id: '',
    amenities: [],
    images: []
  });
  
  const [classifications, setClassifications] = useState([]);
  const [rentalTypes, setRentalTypes] = useState([]);
  const [features, setFeatures] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [customAmenities, setCustomAmenities] = useState([]);
  const [currentRate, setCurrentRate] = useState(null);
  const [newCustomAmenity, setNewCustomAmenity] = useState({
    name: '',
    description: '',
    quantity: 1
  });

  // Image preview state
  const [selectedImages, setSelectedImages] = useState([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);

  const toast = useToast();

  // Predefined rate mappings
  const rateMappings = {
    '1-2': { rate_id: 1, rate: 350000 }, // perempuan + bulanan
    '1-1': { rate_id: 2, rate: 100000 }, // perempuan + harian
    '2-2': { rate_id: 3, rate: 300000 }, // laki_laki + bulanan
    '2-1': { rate_id: 4, rate: 100000 }, // laki_laki + harian
    '3-2': { rate_id: 5, rate: 500000 }, // VIP + bulanan
    '3-1': { rate_id: 6, rate: 150000 }, // VIP + harian
    '4-1': { rate_id: 7, rate: 500000 }, // ruang_rapat + harian
  };
  const steps = [
    { title: 'Basic Info', description: 'Room details', icon: FiHome },
    { title: 'Amenities', description: 'Room features', icon: FiUsers },
    { title: 'Images', description: 'Photo gallery', icon: FiCamera },
    { title: 'Review', description: 'Final check', icon: FiCheck }
  ];

  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.classification_id && formData.rental_type_id) {
      updateRate();
    }
  }, [formData.classification_id, formData.rental_type_id]);
  const resetForm = () => {
    setFormData({
      type_id: '', // 1: mahasiswa, 2: non_mahasiswa, 3: ruang_rapat
      name: '',
      description: '',
      capacity: 1,
      classification_id: '',
      rental_type_id: '',
      amenities: [],
      images: []
    });
    setActiveStep(0);
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Mock data - in real app, fetch from API
      setClassifications([
        { classificationId: 1, name: 'perempuan' },
        { classificationId: 2, name: 'laki_laki' },
        { classificationId: 3, name: 'VIP' },
        { classificationId: 4, name: 'ruang_rapat' }
      ]);

      setRentalTypes([
        { rentalTypeId: 1, name: 'harian' },
        { rentalTypeId: 2, name: 'bulanan' }
      ]);

      setFeatures([
        { featureId: 1, name: 'AC', description: 'Air Conditioning' },
        { featureId: 2, name: 'private_bathroom', description: 'Private attached bathroom' },
        { featureId: 3, name: 'study_table', description: 'Study table and chair' },
        { featureId: 4, name: 'bed', description: 'Single bed with mattress' },
        { featureId: 5, name: 'wardrobe', description: 'Built-in wardrobe' },
        { featureId: 6, name: 'wifi', description: 'High-speed internet' },
        { featureId: 7, name: 'balcony', description: 'Private balcony' },
        { featureId: 8, name: 'tv', description: 'LED TV' }
      ]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load initial data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRate = () => {
    const key = `${formData.classification_id}-${formData.rental_type_id}`;
    const rateInfo = rateMappings[key];
    if (rateInfo) {
      setCurrentRate(rateInfo);
    } else {
      setCurrentRate(null);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Image handling functions
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select only image files',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Image size must be less than 5MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        
        setSelectedImages(prev => [...prev, file]);
        setImagePreviewUrls(prev => [...prev, imageData]);
        
        // Convert to base64 for API
        const base64Data = imageData.split(',')[1];
        const imageInput = {
          image_data: base64Data,
          image_name: file.name,
          content_type: file.type,
          is_primary: selectedImages.length === 0 // First image is primary by default
        };
        
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, imageInput]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));

    // Adjust primary image index if needed
    if (index === primaryImageIndex && selectedImages.length > 1) {
      setPrimaryImageIndex(0);
      // Update primary flag in formData
      setFormData(prev => ({
        ...prev,
        images: prev.images.map((img, i) => ({
          ...img,
          is_primary: i === 0
        }))
      }));
    } else if (index < primaryImageIndex) {
      setPrimaryImageIndex(prev => prev - 1);
    }
  };

  const setPrimaryImage = (index) => {
    setPrimaryImageIndex(index);
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        is_primary: i === index
      }))
    }));
  };

  // Amenity handling
  const toggleAmenity = (featureId) => {
    setSelectedAmenities(prev => {
      const newSelection = prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId];
      
      // Update formData
      setFormData(prevForm => ({
        ...prevForm,
        amenities: newSelection.map(id => ({
          feature_id: id,
          quantity: 1,
          is_custom: false
        }))
      }));
      
      return newSelection;
    });
  };

  const addCustomAmenity = () => {
    if (!newCustomAmenity.name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter amenity name',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const customAmenity = {
      custom_feature_name: newCustomAmenity.name,
      custom_description: newCustomAmenity.description,
      quantity: newCustomAmenity.quantity,
      is_custom: true
    };

    setCustomAmenities(prev => [...prev, customAmenity]);
    setFormData(prev => ({
      ...prev,
      amenities: [...prev.amenities, customAmenity]
    }));

    setNewCustomAmenity({ name: '', description: '', quantity: 1 });
  };

  const removeCustomAmenity = (index) => {
    setCustomAmenities(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(amenity => !amenity.is_custom || amenity !== customAmenities[index])
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.classification_id || !formData.rental_type_id) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await roomService.createRoom(formData);
      
      toast({
        title: 'Success',
        description: 'Room created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onRoomCreated(response.room);
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create room',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  const nextStep = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const prevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const canProceedToNextStep = () => {
    switch (activeStep) {
      case 0: // Basic Info
        return formData.name && formData.classification_id && formData.rental_type_id;
      case 1: // Amenities
        return true; // Amenities are optional
      case 2: // Images
        return true; // Images are optional
      default:
        return true;
    }
  };

  const renderStepIndicator = () => (
    <HStack spacing={4} mb={6}>
      {steps.map((step, index) => (
        <Flex key={step.number} align="center" flex={1}>
          <Flex
            align="center"
            justify="center"
            w={10}
            h={10}
            rounded="full"
            bg={currentStep >= step.number ? 'blue.500' : 'gray.200'}
            color={currentStep >= step.number ? 'white' : 'gray.500'}
            mr={3}
          >
            <step.icon />
          </Flex>
          <Box flex={1}>
            <Text
              fontSize="sm"
              fontWeight={currentStep === step.number ? 'bold' : 'normal'}
              color={currentStep >= step.number ? 'blue.500' : 'gray.500'}
            >
              {step.title}
            </Text>
          </Box>
          {index < steps.length - 1 && (
            <Box h={0.5} bg={currentStep > step.number ? 'blue.500' : 'gray.200'} flex={1} mx={2} />
          )}
        </Flex>
      ))}
    </HStack>
  );

  const typeOptions = [
    { typeId: 1, name: 'Mahasiswa' },
    { typeId: 2, name: 'Non Mahasiswa' },
    { typeId: 3, name: 'Ruang Rapat' }
  ];

  // Filter classification options based on type
  const getAvailableClassifications = () => {
    if (formData.type_id === '1' || formData.type_id === '2') {
      // Mahasiswa & Non Mahasiswa: perempuan, laki_laki, VIP
      return classifications.filter(c => [1,2,3].includes(c.classificationId));
    } else if (formData.type_id === '3') {
      // Ruang Rapat: hanya ruang_rapat
      return classifications.filter(c => c.classificationId === 4);
    }
    return [];
  };

  // When type changes, reset classification/rental type
  const handleTypeChange = (value) => {
    setFormData(prev => ({
      ...prev,
      type_id: value,
      classification_id: '',
      rental_type_id: '',
    }));
  };

  const renderBasicInformation = () => (
    <VStack spacing={4}>
      {/* Room Type Selection */}
      <FormControl isRequired>
        <FormLabel>Tipe Kamar</FormLabel>
        <Select
          value={formData.type_id}
          onChange={e => handleTypeChange(e.target.value)}
          placeholder="Pilih tipe kamar"
        >
          {typeOptions.map(type => (
            <option key={type.typeId} value={type.typeId}>{type.name}</option>
          ))}
        </Select>
      </FormControl>
      <FormControl isRequired>
        <FormLabel>Room Name</FormLabel>
        <Input
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter room name (e.g., Deluxe Room A1)"
        />
      </FormControl>

      <SimpleGrid columns={2} spacing={4} w="full">
        {/* Classification only for Mahasiswa/Non Mahasiswa */}
        {formData.type_id !== '3' && (
          <FormControl isRequired>
            <FormLabel>Room Classification</FormLabel>
            <Select
              value={formData.classification_id}
              onChange={(e) => handleInputChange('classification_id', e.target.value)}
              placeholder="Select classification"
            >
              {getAvailableClassifications().map(cls => (
                <option key={cls.classificationId} value={cls.classificationId}>
                  {cls.name.charAt(0).toUpperCase() + cls.name.slice(1).replace('_', ' ')}
                </option>
              ))}
            </Select>
          </FormControl>
        )}
        {/* For Ruang Rapat, set classification_id to 4 automatically */}
        {formData.type_id === '3' && (
          <input type="hidden" value="4" />
        )}
        <FormControl isRequired>
          <FormLabel>Rental Type</FormLabel>
          <Select
            value={formData.rental_type_id}
            onChange={(e) => handleInputChange('rental_type_id', e.target.value)}
            placeholder="Select rental type"
            isDisabled={formData.type_id === '' || (formData.type_id !== '3' && !formData.classification_id)}
          >
            {/* Only daily for ruang rapat */}
            {rentalTypes.filter(rt => formData.type_id !== '3' || rt.rentalTypeId === 1).map(type => (
              <option 
                key={type.rentalTypeId} 
                value={type.rentalTypeId}
                disabled={formData.type_id === '3' && type.rentalTypeId === 2}
              >
                {type.name.charAt(0).toUpperCase() + type.name.slice(1)}
              </option>
            ))}
          </Select>
        </FormControl>
      </SimpleGrid>

      <FormControl isRequired>
        <FormLabel>Capacity</FormLabel>
        <NumberInput
          value={formData.capacity}
          onChange={(value) => handleInputChange('capacity', parseInt(value))}
          min={1}
          max={4}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <FormHelperText>Maximum 4 people per room</FormHelperText>
      </FormControl>

      <FormControl>
        <FormLabel>Description</FormLabel>
        <Textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Enter room description..."
          rows={3}
        />
      </FormControl>

      {currentRate && (
        <Card w="full" bg="blue.50" borderColor="blue.200">
          <CardBody>
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" color="blue.600">Current Rate</Text>
                <Text fontSize="lg" fontWeight="bold" color="blue.800">
                  Rp {currentRate.rate.toLocaleString()}
                </Text>
              </VStack>
              <Badge colorScheme="blue">
                {rentalTypes.find(rt => rt.rentalTypeId.toString() === formData.rental_type_id)?.name}
              </Badge>
            </HStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );

  const renderAmenities = () => (
    <VStack spacing={6}>
      <Box w="full">
        <Heading size="sm" mb={4}>Standard Amenities</Heading>
        <SimpleGrid columns={2} spacing={3}>
          {features.map(feature => (
            <Card
              key={feature.featureId}
              cursor="pointer"
              onClick={() => toggleAmenity(feature.featureId)}
              bg={selectedAmenities.includes(feature.featureId) ? 'blue.50' : 'white'}
              borderColor={selectedAmenities.includes(feature.featureId) ? 'blue.500' : 'gray.200'}
              borderWidth={2}
              _hover={{ borderColor: 'blue.300' }}
            >
              <CardBody p={3}>
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold" fontSize="sm">
                      {feature.name.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {feature.description}
                    </Text>
                  </VStack>
                  {selectedAmenities.includes(feature.featureId) && (
                    <FiCheck color="blue.500" />
                  )}
                </HStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </Box>

      <Divider />

      <Box w="full">
        <Heading size="sm" mb={4}>Custom Amenities</Heading>
        
        <Card bg="gray.50" mb={4}>
          <CardBody>
            <VStack spacing={3}>
              <HStack w="full" spacing={3}>
                <FormControl>
                  <Input
                    placeholder="Amenity name (e.g., Mini Fridge)"
                    value={newCustomAmenity.name}
                    onChange={(e) => setNewCustomAmenity(prev => ({ ...prev, name: e.target.value }))}
                  />
                </FormControl>
                <NumberInput
                  value={newCustomAmenity.quantity}
                  onChange={(value) => setNewCustomAmenity(prev => ({ ...prev, quantity: parseInt(value) }))}
                  min={1}
                  max={10}
                  w="100px"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <IconButton
                  icon={<FiPlus />}
                  onClick={addCustomAmenity}
                  colorScheme="blue"
                  size="md"
                />
              </HStack>
              <Input
                placeholder="Description (optional)"
                value={newCustomAmenity.description}
                onChange={(e) => setNewCustomAmenity(prev => ({ ...prev, description: e.target.value }))}
              />
            </VStack>
          </CardBody>
        </Card>

        {customAmenities.length > 0 && (
          <VStack spacing={2} align="stretch">
            {customAmenities.map((amenity, index) => (
              <Card key={index} bg="green.50" borderColor="green.200">
                <CardBody p={3}>
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                      <HStack>
                        <Text fontWeight="bold" fontSize="sm">
                          {amenity.custom_feature_name}
                        </Text>
                        <Badge colorScheme="green">x{amenity.quantity}</Badge>
                      </HStack>
                      {amenity.custom_description && (
                        <Text fontSize="xs" color="gray.600">
                          {amenity.custom_description}
                        </Text>
                      )}
                    </VStack>
                    <IconButton
                      icon={<FiX />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => removeCustomAmenity(index)}
                    />
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  );

  const renderImages = () => (
    <VStack spacing={6}>
      <Box w="full">
        <HStack justify="space-between" mb={4}>
          <Heading size="sm">Room Images</Heading>
          <Button
            leftIcon={<FiUpload />}
            onClick={() => fileInputRef.current?.click()}
            colorScheme="blue"
            size="sm"
          >
            Upload Images
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </HStack>

        {imagePreviewUrls.length === 0 ? (
          <Card bg="gray.50" border="2px dashed" borderColor="gray.300">
            <CardBody>
              <VStack spacing={3} py={8}>
                <FiCamera size={48} color="gray" />
                <Text color="gray.500">No images uploaded</Text>
                <Text fontSize="sm" color="gray.400">
                  Click "Upload Images" to add room photos
                </Text>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <SimpleGrid columns={3} spacing={4}>
            {imagePreviewUrls.map((url, index) => (
              <Card key={index} position="relative">
                <CardBody p={2}>
                  <Box position="relative">
                    <Image
                      src={url}
                      alt={`Room image ${index + 1}`}
                      borderRadius="md"
                      objectFit="cover"
                      w="full"
                      h="150px"
                    />
                    
                    {/* Primary badge */}
                    {index === primaryImageIndex && (
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

                    {/* Action buttons */}
                    <HStack
                      position="absolute"
                      top={2}
                      right={2}
                      spacing={1}
                    >
                      {index !== primaryImageIndex && (
                        <IconButton
                          icon={<FiStar />}
                          size="xs"
                          colorScheme="yellow"
                          onClick={() => setPrimaryImage(index)}
                          title="Set as primary"
                        />
                      )}
                      <IconButton
                        icon={<FiTrash2 />}
                        size="xs"
                        colorScheme="red"
                        onClick={() => removeImage(index)}
                        title="Remove image"
                      />
                    </HStack>
                  </Box>
                  
                  <Text fontSize="xs" mt={2} isTruncated>
                    {selectedImages[index]?.name}
                  </Text>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}

        <Alert status="info" mt={4}>
          <AlertIcon />
          <Box>
            <Text fontSize="sm">
              • First image will be set as primary by default<br />
              • Maximum file size: 5MB per image<br />
              • Supported formats: JPG, PNG, GIF
            </Text>
          </Box>
        </Alert>
      </Box>
    </VStack>
  );

  const renderReview = () => (
    <VStack spacing={6}>
      <Card w="full" bg="blue.50">
        <CardBody>
          <Heading size="md" mb={4}>Room Information</Heading>
          <SimpleGrid columns={2} spacing={4}>
            <Box>
              <Text fontSize="sm" color="gray.600">Name</Text>
              <Text fontWeight="bold">{formData.name}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600">Classification</Text>
              <Text fontWeight="bold">
                {classifications.find(c => c.classificationId.toString() === formData.classification_id)?.name}
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600">Rental Type</Text>
              <Text fontWeight="bold">
                {rentalTypes.find(rt => rt.rentalTypeId.toString() === formData.rental_type_id)?.name}
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600">Capacity</Text>
              <Text fontWeight="bold">{formData.capacity} people</Text>
            </Box>
          </SimpleGrid>
          {formData.description && (
            <Box mt={4}>
              <Text fontSize="sm" color="gray.600">Description</Text>
              <Text>{formData.description}</Text>
            </Box>
          )}
        </CardBody>
      </Card>

      <Card w="full">
        <CardBody>
          <Heading size="md" mb={4}>Amenities ({formData.amenities.length})</Heading>
          {formData.amenities.length > 0 ? (
            <Grid templateColumns="repeat(2, 1fr)" gap={2}>
              {formData.amenities.map((amenity, index) => (
                <Tag key={index} size="md" colorScheme={amenity.is_custom ? 'green' : 'blue'}>
                  <TagLabel>
                    {amenity.is_custom ? amenity.custom_feature_name : 
                     features.find(f => f.featureId === amenity.feature_id)?.name}
                    {amenity.quantity > 1 && ` (${amenity.quantity})`}
                  </TagLabel>
                </Tag>
              ))}
            </Grid>
          ) : (
            <Text color="gray.500">No amenities selected</Text>
          )}
        </CardBody>
      </Card>

      <Card w="full">
        <CardBody>
          <Heading size="md" mb={4}>Images ({formData.images.length})</Heading>
          {formData.images.length > 0 ? (
            <SimpleGrid columns={4} spacing={2}>
              {imagePreviewUrls.map((url, index) => (
                <Box key={index} position="relative">
                  <Image
                    src={url}
                    alt={`Room image ${index + 1}`}
                    borderRadius="md"
                    objectFit="cover"
                    w="full"
                    h="80px"
                  />
                  {index === primaryImageIndex && (
                    <Badge
                      position="absolute"
                      top={1}
                      left={1}
                      colorScheme="yellow"
                      fontSize="xs"
                    >
                      Primary
                    </Badge>
                  )}
                </Box>
              ))}
            </SimpleGrid>
          ) : (
            <Text color="gray.500">No images uploaded</Text>
          )}
        </CardBody>
      </Card>

      {currentRate && (
        <Card w="full" bg="green.50">
          <CardBody>
            <Heading size="md" mb={2}>Pricing</Heading>
            <HStack justify="space-between">
              <Text>
                Rate per {rentalTypes.find(rt => rt.rentalTypeId.toString() === formData.rental_type_id)?.name}
              </Text>
              <Text fontSize="lg" fontWeight="bold" color="green.600">
                Rp {currentRate.rate.toLocaleString()}
              </Text>
            </HStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInformation();
      case 2:
        return renderAmenities();
      case 3:
        return renderImages();
      case 4:
        return renderReview();
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <HStack>
            <FiHome />
            <Text>Create New Room</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {loading ? (
            <Center py={10}>
              <Spinner size="xl" />
            </Center>
          ) : (
            <VStack spacing={6}>
              {renderStepIndicator()}
              {renderStepContent()}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button 
              variant="ghost" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            
            {currentStep > 1 && (
              <Button 
                onClick={prevStep}
                disabled={loading}
              >
                Previous
              </Button>
            )}
            
            {currentStep < steps.length ? (
              <Button
                colorScheme="blue"
                onClick={nextStep}
                disabled={!canProceedToNextStep() || loading}
              >
                Next
              </Button>
            ) : (
              <Button
                colorScheme="green"
                onClick={handleSubmit}
                isLoading={loading}
                loadingText="Creating Room..."
                leftIcon={<FiCheck />}
              >
                Create Room
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EnhancedRoomCreateModal;
