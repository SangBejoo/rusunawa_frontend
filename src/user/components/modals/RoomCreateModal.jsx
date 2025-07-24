import React, { useState, useEffect } from 'react';
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
  Checkbox,
  CheckboxGroup,
  SimpleGrid,
  Box,
  Alert,
  AlertIcon,
  useToast,
  Spinner,
  Badge,
  Card,
  CardBody,
  Heading
} from '@chakra-ui/react';
import { FiHome, FiUsers, FiDollarSign } from 'react-icons/fi';
import roomService from '../../services/roomService';

const RoomCreateModal = ({ isOpen, onClose, onRoomCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type_id: '', // 1: mahasiswa, 2: non_mahasiswa, 3: ruang_rapat
    name: '',
    description: '',
    capacity: 1,
    classification_id: '',
    rental_type_id: '',
    amenities: []
  });
  
  const [classifications, setClassifications] = useState([]);
  const [rentalTypes, setRentalTypes] = useState([]);
  const [features, setFeatures] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [currentRate, setCurrentRate] = useState(null);

  const toast = useToast();

  // Predefined rate mappings based on database
  const rateMappings = {
    '1-2': { rate_id: 1, rate: 350000 }, // perempuan + bulanan
    '1-1': { rate_id: 2, rate: 100000 }, // perempuan + harian
    '2-2': { rate_id: 3, rate: 300000 }, // laki_laki + bulanan
    '2-1': { rate_id: 4, rate: 100000 }, // laki_laki + harian
    '3-2': { rate_id: 5, rate: 500000 }, // VIP + bulanan
    '3-1': { rate_id: 6, rate: 150000 }, // VIP + harian
    '4-1': { rate_id: 7, rate: 500000 }, // ruang_rapat + harian (no monthly option)
  };

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.classification_id && formData.rental_type_id) {
      updateRate();
    }
  }, [formData.classification_id, formData.rental_type_id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Mock data based on database structure
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
        { featureId: 3, name: 'shared_bathroom', description: 'Shared bathroom' },
        { featureId: 4, name: 'single_bed', description: 'Single bed' },
        { featureId: 5, name: 'double_bed', description: 'Double bed' },
        { featureId: 6, name: 'desk', description: 'Study desk' },
        { featureId: 7, name: 'wifi', description: 'Wi-Fi access' },
        { featureId: 8, name: 'wardrobe', description: 'Clothes wardrobe' }
      ]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load form data',
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
    setCurrentRate(rateInfo);
  };

  const getClassificationLabel = (name) => {
    switch (name) {
      case 'perempuan': return 'Female';
      case 'laki_laki': return 'Male';
      case 'VIP': return 'VIP';
      case 'ruang_rapat': return 'Meeting Room';
      default: return name;
    }
  };

  const getRentalTypeLabel = (name) => {
    switch (name) {
      case 'harian': return 'Daily';
      case 'bulanan': return 'Monthly';
      default: return name;
    }
  };

  const getAvailableRentalTypes = () => {
    if (formData.classification_id === '4') {
      // Meeting rooms only have daily rates
      return rentalTypes.filter(rt => rt.rentalTypeId === 1);
    }
    return rentalTypes;
  };

  // Add type options
  const typeOptions = [
    { typeId: 1, name: 'Mahasiswa' },
    { typeId: 2, name: 'Non Mahasiswa' },
    { typeId: 3, name: 'Ruang Rapat' }
  ];

  // Filter classification options based on type
  const getAvailableClassifications = () => {
    if (formData.type_id === '1') {
      // Mahasiswa: perempuan, laki_laki, VIP
      return classifications.filter(c => [1,2,3].includes(c.classificationId));
    } else if (formData.type_id === '2') {
      // Non Mahasiswa: perempuan, laki_laki, VIP
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAmenityChange = (featureId, quantity) => {
    setSelectedAmenities(prev => {
      const existing = prev.find(a => a.feature_id === featureId);
      if (existing) {
        if (quantity === 0) {
          return prev.filter(a => a.feature_id !== featureId);
        }
        return prev.map(a => 
          a.feature_id === featureId ? { ...a, quantity } : a
        );
      } else if (quantity > 0) {
        return [...prev, { feature_id: featureId, quantity }];
      }
      return prev;
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.classification_id || !formData.rental_type_id) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!currentRate) {
      toast({
        title: 'Error',
        description: 'Invalid classification and rental type combination',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      
      // Get current user for audit trail
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      const roomData = {
        name: formData.name,
        description: formData.description,
        capacity: formData.capacity,
        classification_id: parseInt(formData.classification_id),
        rental_type_id: parseInt(formData.rental_type_id),
        amenities: selectedAmenities,
        created_by: currentUser.userId || currentUser.user_id || 1 // Add creator tracking
      };

      await roomService.createRoom(roomData);

      toast({
        title: 'Success',
        description: 'Room created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onRoomCreated();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create room',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      type_id: '', // 1: mahasiswa, 2: non_mahasiswa, 3: ruang_rapat
      name: '',
      description: '',
      capacity: 1,
      classification_id: '',
      rental_type_id: '',
      amenities: []
    });
    setSelectedAmenities([]);
    setCurrentRate(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <FiHome />
            <Text>Create New Room</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />        <ModalBody>
          <VStack spacing={4} align="stretch">            {/* Basic Information */}
            <Box>
              <Heading size="sm" mb={3}>Basic Information</Heading>
              <VStack spacing={3}>
                {/* Room Type Selection */}
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Tipe Kamar</FormLabel>
                  <Select
                    value={formData.type_id}
                    onChange={e => handleTypeChange(e.target.value)}
                    placeholder="Pilih tipe kamar"
                    size="sm"
                  >
                    {typeOptions.map(type => (
                      <option key={type.typeId} value={type.typeId}>{type.name}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm">Room Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter room name"
                    size="sm"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm">Description</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter room description"
                    rows={2}
                    size="sm"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm">Capacity (Max: 4)</FormLabel>
                  <NumberInput
                    value={formData.capacity}
                    onChange={(value) => handleInputChange('capacity', parseInt(value))}
                    min={1}
                    max={4}
                    size="sm"
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </VStack>
            </Box>            {/* Classification & Rental Type */}
            <Box>
              <Heading size="sm" mb={3}>Room Type & Pricing</Heading>
              <VStack spacing={3}>
                {/* Classification only for Mahasiswa/Non Mahasiswa */}
                {formData.type_id !== '3' && (
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Classification</FormLabel>
                    <Select
                      value={formData.classification_id}
                      onChange={(e) => handleInputChange('classification_id', e.target.value)}
                      placeholder="Select classification"
                      size="sm"
                    >
                      {getAvailableClassifications().map((classification) => (
                        <option key={classification.classificationId} value={classification.classificationId}>
                          {getClassificationLabel(classification.name)}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                )}
                {/* For Ruang Rapat, set classification_id to 4 automatically */}
                {formData.type_id === '3' && (
                  <input type="hidden" value="4" />
                )}
                {/* Rental Type */}
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Rental Type</FormLabel>
                  <Select
                    value={formData.rental_type_id}
                    onChange={(e) => handleInputChange('rental_type_id', e.target.value)}
                    placeholder="Select rental type"
                    isDisabled={formData.type_id === '' || (formData.type_id !== '3' && !formData.classification_id)}
                    size="sm"
                  >
                    {getAvailableRentalTypes().map((rentalType) => (
                      <option key={rentalType.rentalTypeId} value={rentalType.rentalTypeId}>
                        {getRentalTypeLabel(rentalType.name)}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                {currentRate && (
                  <Box w="100%" p={3} bg="green.50" borderRadius="md" border="1px" borderColor="green.200">
                    <HStack justify="space-between">
                      <VStack align="start" spacing={0}>
                        <Text fontSize="xs" color="gray.600">Automatic Rate</Text>
                        <HStack>
                          <FiDollarSign size={14} />
                          <Text fontSize="md" fontWeight="bold">
                            Rp {currentRate.rate.toLocaleString()}
                          </Text>
                        </HStack>
                      </VStack>
                      <Badge colorScheme="green" size="sm">Auto-assigned</Badge>
                    </HStack>
                  </Box>
                )}

                {formData.classification_id === '4' && (
                  <Alert status="info" size="sm">
                    <AlertIcon />
                    <Text fontSize="sm">Meeting rooms only have daily rental rates</Text>
                  </Alert>                )}
              </VStack>
            </Box>

            {/* Amenities */}
            <Box>
              <Heading size="sm" mb={3}>Room Amenities</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                {features.map((feature) => {
                  const currentQuantity = selectedAmenities.find(a => a.feature_id === feature.featureId)?.quantity || 0;
                  
                  return (
                    <Box key={feature.featureId} p={3} border="1px" borderColor="gray.200" borderRadius="md" bg="gray.50">
                      <HStack justify="space-between" align="center" spacing={2}>
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontWeight="medium" fontSize="sm">{feature.name}</Text>
                          <Text fontSize="xs" color="gray.600" noOfLines={1}>{feature.description}</Text>
                        </VStack>
                        <NumberInput
                          value={currentQuantity}
                          onChange={(value) => handleAmenityChange(feature.featureId, parseInt(value) || 0)}
                          min={0}
                          max={10}
                          size="sm"
                          w="70px"
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </HStack>
                    </Box>
                  );
                })}
              </SimpleGrid>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={loading}
            loadingText="Creating..."
            isDisabled={!currentRate}
          >
            Create Room
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default RoomCreateModal;
