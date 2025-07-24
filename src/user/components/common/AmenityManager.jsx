import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  IconButton,
  Card,
  CardBody,
  Badge,
  Heading,
  FormControl,
  FormLabel,
  Textarea,
  SimpleGrid,
  useToast,
  Flex,
  Divider,
  Tag,
  TagLabel,
  TagCloseButton,
  Switch,
  Collapse
} from '@chakra-ui/react';
import {
  FiPlus,
  FiX,
  FiEdit,
  FiSave,
  FiTrash2,
  FiCheck,
  FiStar,
  FiHome
} from 'react-icons/fi';

const AmenityManager = ({
  amenities = [],
  onAmenitiesChange,
  readOnly = false,
  showStandardOptions = true,
  standardAmenities = [
    { name: 'wifi', description: 'High-speed wireless internet access' },
    { name: 'ac', description: 'Air conditioning for climate control' },
    { name: 'private_bathroom', description: 'Individual bathroom facilities' },
    { name: 'desk', description: 'Study/work desk with chair' },
    { name: 'wardrobe', description: 'Built-in clothing storage' },
    { name: 'window', description: 'Natural lighting and ventilation' },
    { name: 'balcony', description: 'Private outdoor space' },
    { name: 'mini_fridge', description: 'Small refrigerator for personal use' },
    { name: 'tv', description: 'Television with cable connection' },
    { name: 'study_lamp', description: 'Dedicated reading/study light' }
  ]
}) => {
  const [newAmenity, setNewAmenity] = useState({
    name: '',
    custom_feature_name: '',
    description: '',
    quantity: 1,
    isCustom: false
  });
  const [editingAmenity, setEditingAmenity] = useState(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const toast = useToast();
  const addStandardAmenity = (standardAmenity) => {
    if (readOnly) return;
    
    // Check if amenity already exists (check by name for standard amenities)
    const exists = amenities.some(
      a => a.name.toLowerCase() === standardAmenity.name.toLowerCase()
    );
    
    if (exists) {
      toast({
        title: 'Amenity exists',
        description: `${standardAmenity.description} is already added`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const newAmenityData = {
      id: `amenity_${Date.now()}`,
      name: standardAmenity.name,
      description: standardAmenity.description,
      quantity: 1,
      isCustom: false
    };

    onAmenitiesChange([...amenities, newAmenityData]);
    
    toast({
      title: 'Amenity added',
      description: `${standardAmenity.description} has been added`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const addCustomAmenity = () => {
    if (readOnly) return;
    
    if (!newAmenity.custom_feature_name.trim() || !newAmenity.description.trim()) {
      toast({
        title: 'Invalid input',
        description: 'Custom feature name and description are required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Check if custom amenity already exists (check by custom_feature_name)
    const exists = amenities.some(
      a => a.custom_feature_name && 
           a.custom_feature_name.toLowerCase() === newAmenity.custom_feature_name.toLowerCase()
    );
    
    if (exists) {
      toast({
        title: 'Custom amenity exists',
        description: `${newAmenity.custom_feature_name} is already added`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }  const addCustomAmenity = () => {
    if (readOnly) return;
    
    if (!newAmenity.custom_feature_name.trim() || !newAmenity.description.trim()) {
      toast({
        title: 'Invalid input',
        description: 'Custom feature name and description are required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Check if custom amenity already exists (check by custom_feature_name)
    const exists = amenities.some(
      a => a.custom_feature_name && 
           a.custom_feature_name.toLowerCase() === newAmenity.custom_feature_name.toLowerCase()
    );
    
    if (exists) {
      toast({
        title: 'Custom amenity exists',
        description: `${newAmenity.custom_feature_name} is already added`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const newAmenityData = {
      id: `custom_amenity_${Date.now()}`,
      name: 'custom', // Backend expects 'custom' for custom amenities
      custom_feature_name: newAmenity.custom_feature_name.trim(),
      description: newAmenity.description.trim(),
      quantity: newAmenity.quantity || 1,
      isCustom: true
    };

    onAmenitiesChange([...amenities, newAmenityData]);
    
    // Reset form
    setNewAmenity({
      name: '',
      custom_feature_name: '',
      description: '',
      quantity: 1,
      isCustom: false
    });
    setShowCustomForm(false);
    
    toast({
      title: 'Custom amenity added',
      description: `${newAmenityData.custom_feature_name} has been added`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };    const newAmenityData = {
      id: `amenity_${Date.now()}`,
      name: newAmenity.name.trim(),
      description: newAmenity.description.trim(),
      quantity: newAmenity.quantity,
      isCustom: true
    };

    onAmenitiesChange([...amenities, newAmenityData]);
    setNewAmenity({ 
      name: '', 
      custom_feature_name: '', 
      description: '', 
      quantity: 1, 
      isCustom: false 
    });
    setShowCustomForm(false);
    
    toast({
      title: 'Custom amenity added',
      description: `${newAmenityData.name} has been added`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const removeAmenity = (amenityId) => {
    if (readOnly) return;
    
    const updatedAmenities = amenities.filter(a => a.id !== amenityId);
    onAmenitiesChange(updatedAmenities);
    
    if (editingAmenity?.id === amenityId) {
      setEditingAmenity(null);
    }
  };

  const startEditAmenity = (amenity) => {
    if (readOnly) return;
    setEditingAmenity({ ...amenity });
  };
  const saveEditAmenity = () => {
    // Validate based on amenity type
    if (editingAmenity.isCustom || editingAmenity.custom_feature_name) {
      if (!editingAmenity.custom_feature_name?.trim()) {
        toast({
          title: 'Invalid input',
          description: 'Custom feature name is required',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    } else {
      if (!editingAmenity.name?.trim()) {
        toast({
          title: 'Invalid input',
          description: 'Amenity name is required',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }

    const updatedAmenities = amenities.map(a =>
      a.id === editingAmenity.id ? editingAmenity : a
    );
    
    onAmenitiesChange(updatedAmenities);
    setEditingAmenity(null);
    
    const displayName = editingAmenity.custom_feature_name || editingAmenity.name;
    toast({
      title: 'Amenity updated',
      description: `${displayName} has been updated`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const cancelEdit = () => {
    setEditingAmenity(null);
  };

  const updateQuantity = (amenityId, newQuantity) => {
    if (readOnly) return;
    
    const updatedAmenities = amenities.map(a =>
      a.id === amenityId ? { ...a, quantity: newQuantity } : a
    );
    
    onAmenitiesChange(updatedAmenities);
  };

  const getAvailableStandardAmenities = () => {
    return standardAmenities.filter(standard =>
      !amenities.some(existing => 
        existing.name.toLowerCase() === standard.name.toLowerCase()
      )
    );
  };

  return (
    <VStack spacing={6} w="full">
      {/* Current Amenities */}
      {amenities.length > 0 && (
        <Box w="full">
          <Heading size="sm" mb={4}>Current Amenities</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
            {amenities.map((amenity) => (
              <Card key={amenity.id} variant="outline">                <CardBody p={4}>
                  {editingAmenity?.id === amenity.id ? (
                    // Edit mode
                    <VStack spacing={3}>
                      {editingAmenity.isCustom || editingAmenity.custom_feature_name ? (
                        <FormControl>
                          <FormLabel fontSize="sm">Custom Feature Name</FormLabel>
                          <Input
                            value={editingAmenity.custom_feature_name || ''}
                            onChange={(e) => setEditingAmenity(prev => ({
                              ...prev,
                              custom_feature_name: e.target.value
                            }))}
                            size="sm"
                          />
                        </FormControl>
                      ) : (
                        <FormControl>
                          <FormLabel fontSize="sm">Name</FormLabel>
                          <Input
                            value={editingAmenity.name}
                            onChange={(e) => setEditingAmenity(prev => ({
                              ...prev,
                              name: e.target.value
                            }))}
                            size="sm"
                          />
                        </FormControl>
                      )}
                      
                      <FormControl>
                        <FormLabel fontSize="sm">Description</FormLabel>
                        <Textarea
                          value={editingAmenity.description}
                          onChange={(e) => setEditingAmenity(prev => ({
                            ...prev,
                            description: e.target.value
                          }))}
                          size="sm"
                          rows={2}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel fontSize="sm">Quantity</FormLabel>
                        <NumberInput
                          value={editingAmenity.quantity}
                          onChange={(value) => setEditingAmenity(prev => ({
                            ...prev,
                            quantity: parseInt(value) || 1
                          }))}
                          min={1}
                          max={20}
                          size="sm"
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                      
                      <HStack spacing={2} w="full">
                        <Button
                          size="sm"
                          colorScheme="green"
                          leftIcon={<FiSave />}
                          onClick={saveEditAmenity}
                          flex={1}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<FiX />}
                          onClick={cancelEdit}
                          flex={1}
                        >
                          Cancel
                        </Button>
                      </HStack>
                    </VStack>
                  ) : (
                    // Display mode
                    <VStack align="stretch" spacing={3}>
                      <Flex justify="space-between" align="start">                        <VStack align="start" spacing={1} flex={1}>                          <HStack>
                            <Text fontWeight="semibold" fontSize="sm">
                              {amenity.custom_feature_name || amenity.name}
                            </Text>
                            <Badge colorScheme="blue" size="sm">
                              x{amenity.quantity}
                            </Badge>
                            {(amenity.isCustom || amenity.custom_feature_name) && (
                              <HStack spacing={1}>
                                <FiStar size="12px" color="purple" />
                                <Badge colorScheme="purple" size="sm">
                                  Custom
                                </Badge>
                              </HStack>
                            )}
                            {!amenity.isCustom && !amenity.custom_feature_name && (
                              <HStack spacing={1}>
                                <FiHome size="12px" color="green" />
                                <Badge colorScheme="green" size="sm">
                                  Standard
                                </Badge>
                              </HStack>
                            )}
                          </HStack>
                          {amenity.description && (
                            <Text fontSize="xs" color="gray.600">
                              {amenity.description}
                            </Text>
                          )}
                          {amenity.custom_feature_name && amenity.name !== amenity.custom_feature_name && (
                            <Text fontSize="xs" color="purple.500" fontStyle="italic">
                              Type: {amenity.name}
                            </Text>
                          )}
                        </VStack>
                        
                        {!readOnly && (
                          <HStack spacing={1}>
                            <IconButton
                              icon={<FiEdit />}
                              size="xs"
                              variant="ghost"
                              onClick={() => startEditAmenity(amenity)}
                            />
                            <IconButton
                              icon={<FiTrash2 />}
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => removeAmenity(amenity.id)}
                            />
                          </HStack>
                        )}
                      </Flex>
                      
                      {!readOnly && !editingAmenity && (
                        <NumberInput
                          value={amenity.quantity}
                          onChange={(value) => updateQuantity(amenity.id, parseInt(value) || 1)}
                          min={1}
                          max={20}
                          size="sm"
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      )}
                    </VStack>
                  )}
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Box>
      )}

      {!readOnly && (
        <>
          {/* Standard Amenities */}
          {showStandardOptions && getAvailableStandardAmenities().length > 0 && (
            <Box w="full">
              <Heading size="sm" mb={4}>Add Standard Amenities</Heading>
              <Flex wrap="wrap" gap={2}>
                {getAvailableStandardAmenities().map((amenity, index) => (
                  <Tag
                    key={index}
                    size="md"
                    variant="outline"
                    cursor="pointer"
                    _hover={{ bg: 'blue.50', borderColor: 'blue.300' }}
                    onClick={() => addStandardAmenity(amenity)}
                  >
                    <TagLabel>{amenity.name}</TagLabel>
                    <TagCloseButton as={FiPlus} />
                  </Tag>
                ))}
              </Flex>
            </Box>
          )}

          <Divider />          {/* Add Custom Amenity */}
          <Box w="full">
            <HStack justify="space-between" mb={4}>
              <Heading size="sm">Add Custom Amenity</Heading>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<FiStar />}
                onClick={() => setShowCustomForm(!showCustomForm)}
              >
                {showCustomForm ? 'Hide Form' : 'Create Custom'}
              </Button>
            </HStack>
            
            <Collapse in={showCustomForm}>
              <Card bg="gradient.50" borderColor="purple.200">
                <CardBody>
                  <VStack spacing={4}>
                    <HStack w="full" align="center">
                      <FiStar color="purple" />
                      <Text fontSize="sm" color="purple.600" fontWeight="medium">
                        Create a unique amenity with custom features
                      </Text>
                    </HStack>
                    
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Custom Feature Name *</FormLabel>
                        <Input
                          placeholder="e.g., Smart Mirror, Voice Assistant, Mini Bar"
                          value={newAmenity.custom_feature_name}
                          onChange={(e) => setNewAmenity(prev => ({
                            ...prev,
                            custom_feature_name: e.target.value
                          }))}
                          bg="white"
                          borderColor="purple.200"
                          _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px purple.400' }}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel fontSize="sm">Quantity</FormLabel>
                        <NumberInput
                          value={newAmenity.quantity}
                          onChange={(value) => setNewAmenity(prev => ({
                            ...prev,
                            quantity: parseInt(value) || 1
                          }))}
                          min={1}
                          max={20}
                        >
                          <NumberInputField 
                            bg="white" 
                            borderColor="purple.200"
                            _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px purple.400' }}
                          />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    </SimpleGrid>
                    
                    <FormControl isRequired>
                      <FormLabel fontSize="sm">Description *</FormLabel>
                      <Textarea
                        placeholder="Describe the custom feature and its benefits"
                        value={newAmenity.description}
                        onChange={(e) => setNewAmenity(prev => ({
                          ...prev,
                          description: e.target.value
                        }))}
                        bg="white"
                        borderColor="purple.200"
                        _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px purple.400' }}
                        rows={3}
                      />
                    </FormControl>
                    
                    <HStack w="full">
                      <Button
                        leftIcon={<FiStar />}
                        colorScheme="purple"
                        onClick={addCustomAmenity}
                        isDisabled={!newAmenity.custom_feature_name.trim() || !newAmenity.description.trim()}
                        size="sm"
                      >
                        Add Custom Amenity
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewAmenity({
                            name: '',
                            custom_feature_name: '',
                            description: '',
                            quantity: 1,
                            isCustom: false
                          });
                          setShowCustomForm(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </Collapse>
          </Box>
        </>
      )}

      {/* Empty state */}
      {amenities.length === 0 && (
        <Card w="full">
          <CardBody textAlign="center" py={8}>
            <Text color="gray.500">
              {readOnly ? 'No amenities configured' : 'No amenities added yet. Start by adding standard amenities or creating custom ones.'}
            </Text>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
};

export default AmenityManager;
