import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalCloseButton,
  ModalBody,
  Button,
  VStack,
  HStack,
  Text,
  FormControl,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  Input,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Box,
  useToast,
  Spinner,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
  Card,
  CardBody,
  Heading,
  Divider,
  Badge,
  Flex,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import {
  FiHome,
  FiUsers,
  FiCamera,
  FiCheck,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import roomService from '../../services/roomService';
import ImageUploadPreview from '../common/ImageUploadPreview';
import AmenityManager from '../common/AmenityManager';

const CLASSIFICATION_LABELS_ID = {
  1: { name: 'perempuan', display_name: 'Kamar Perempuan', description: 'Kamar untuk penyewa perempuan' },
  2: { name: 'laki_laki', display_name: 'Kamar Laki-laki', description: 'Kamar untuk penyewa laki-laki' },
  4: { name: 'ruang_rapat', display_name: 'Ruang Rapat', description: 'Ruang konferensi/rapat' }
};

const ModernRoomCreateModal = ({ isOpen, onClose, onRoomCreated }) => {
  const [loading, setLoading] = useState(false);  
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 4,
    classification_id: '', // Gender-based: 1=perempuan, 2=laki_laki, 3=VIP, 4=ruang_rapat
    building_id: '',        // Building selection
    floor_id: '',           // Floor selection
    room_number: '',        // Optional room number
    amenities: [],
    images: []
  });

  const [classifications, setClassifications] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [nameValidation, setNameValidation] = useState({ isValid: true, message: '' });
  const [isCheckingName, setIsCheckingName] = useState(false);
  const toast = useToast();

  // Debounce utility function
  const debounce = useCallback((func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  const steps = [
    { title: 'Info Dasar', description: 'Detail kamar', icon: FiHome },
    { title: 'Fasilitas', description: 'Fitur kamar', icon: FiUsers },
    { title: 'Gambar', description: 'Galeri foto', icon: FiCamera },
    { title: 'Tinjauan', description: 'Periksa final', icon: FiCheck }
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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      capacity: 4,
      classification_id: '',
      building_id: '',
      floor_id: '',
      room_number: '',
      amenities: [],
      images: []
    });
    setBuildings([]);
    setFloors([]);
    setActiveStep(0);
    // Reset validation state
    setNameValidation({ isValid: true, message: '' });
    setIsCheckingName(false);
  };

  const fetchInitialData = async () => {
    try {
      // Dynamic rate system - only gender-based room classifications
      const predefinedClassifications = [
        CLASSIFICATION_LABELS_ID[1],
        CLASSIFICATION_LABELS_ID[2],
        CLASSIFICATION_LABELS_ID[4]
      ].map((item, index) => ({ id: index + 1, ...item }));
      
      setClassifications(predefinedClassifications);
      
      // Load buildings
      await fetchBuildings();
    } catch (error) {
      console.error('Error setting predefined data:', error);
      toast({
        title: 'Kesalahan',
        description: 'Gagal memuat data formulir',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Fetch buildings
  const fetchBuildings = async () => {
    setLoadingBuildings(true);
    try {
      const response = await roomService.getBuildings();
      setBuildings(response.buildings || []);
    } catch (error) {
      console.error('Error fetching buildings:', error);
      toast({
        title: 'Kesalahan',
        description: 'Gagal memuat data gedung',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingBuildings(false);
    }
  };

  // Fetch floors for selected building
  const fetchFloors = async (buildingId) => {
    if (!buildingId) {
      setFloors([]);
      return;
    }

    setLoadingFloors(true);
    try {
      const response = await roomService.getBuildingFloors(buildingId);
      setFloors(response.floors || []);
    } catch (error) {
      console.error('Error fetching floors:', error);
      toast({
        title: 'Kesalahan',
        description: 'Gagal memuat data lantai',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setFloors([]);
    } finally {
      setLoadingFloors(false);
    }
  };

  // Handle building selection change
  const handleBuildingChange = (buildingId) => {
    updateFormData('building_id', buildingId);
    updateFormData('floor_id', ''); // Reset floor selection
    fetchFloors(buildingId);
  };

  // Validate room name for duplicates
  const validateRoomName = async (name) => {
    if (!name || name.trim().length < 2) {
      setNameValidation({ isValid: false, message: 'Nama kamar minimal 2 karakter' });
      return;
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(name)) {
      setNameValidation({ isValid: false, message: 'Nama kamar mengandung karakter tidak valid (<>:"/\\|?*)' });
      return;
    }

    setIsCheckingName(true);
    try {
      // Try to get rooms with similar name
      const response = await roomService.getRooms({ search: name.trim(), limit: 100 });
      const existingRooms = response.rooms || [];
      
      // Check if exact name exists (case-insensitive)
      const duplicateExists = existingRooms.some(room => 
        room.name.toLowerCase().trim() === name.toLowerCase().trim()
      );
      
      if (duplicateExists) {
        setNameValidation({ 
          isValid: false, 
          message: `⚠️ Nama kamar "${name}" sudah digunakan. Coba nama yang berbeda.` 
        });
      } else {
        // Check for very similar names
        const similarNames = existingRooms.filter(room => 
          room.name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(room.name.toLowerCase())
        );
        
        if (similarNames.length > 0) {
          setNameValidation({ 
            isValid: true, 
            message: `💡 Nama serupa ditemukan: ${similarNames.slice(0, 3).map(r => r.name).join(', ')}` 
          });
        } else {
          setNameValidation({ isValid: true, message: '✅ Nama kamar tersedia' });
        }
      }
    } catch (error) {
      console.warn('Could not validate room name:', error);
      setNameValidation({ isValid: true, message: '' }); // Don't block if validation fails
    } finally {
      setIsCheckingName(false);
    }
  };

  // Debounced name validation
  const debouncedValidateRoomName = useCallback(
    debounce((name) => validateRoomName(name), 500),
    []
  );

  // Handle name change with validation
  const handleNameChange = (name) => {
    updateFormData('name', name);
    setNameValidation({ isValid: true, message: '' }); // Reset validation while typing
    
    if (name.trim()) {
      debouncedValidateRoomName(name.trim());
    } else {
      setNameValidation({ isValid: true, message: '' });
    }
  };

  const handleSubmit = async () => {
    // Check required fields
    if (!formData.name || !formData.classification_id || !formData.building_id || !formData.floor_id) {
      toast({
        title: 'Kesalahan Validasi',
        description: 'Harap isi semua kolom yang diperlukan (Nama, Tipe Kamar, Gedung, dan Lantai)',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Check name validation
    if (!nameValidation.isValid) {
      toast({
        title: 'Nama Kamar Tidak Valid',
        description: nameValidation.message || 'Silakan perbaiki nama kamar sebelum melanjutkan',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // If name validation is still checking, wait a moment
    if (isCheckingName) {
      toast({
        title: 'Memeriksa Nama Kamar',
        description: 'Mohon tunggu sebentar, sistem sedang memeriksa ketersediaan nama kamar...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await roomService.createRoom(formData);
      toast({
        title: 'Berhasil',
        description: `Kamar berhasil dibuat dengan kode: ${response.room.fullRoomCode || response.room.full_room_code || 'N/A'}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onRoomCreated(response.room);
      onClose();
    } catch (error) {
      // Enhanced error handling with specific user-friendly messages
      let errorTitle = 'Kesalahan';
      let errorDescription = error.message || 'Gagal membuat kamar';
      let errorStatus = 'error';
      let errorDuration = 5000;
      
      // Handle specific error cases for better UX
      if (error.message && error.message.includes('sudah digunakan')) {
        errorTitle = '⚠️ Nama Kamar Sudah Ada';
        errorDescription = error.message;
        errorStatus = 'warning';
        errorDuration = 8000; // Longer duration for important warnings
      } else if (error.message && error.message.includes('sudah ada di sistem')) {
        errorTitle = '🔄 Data Sudah Tersedia';
        errorDescription = error.message;
        errorStatus = 'warning';
        errorDuration = 6000;
      } else if (error.message && error.message.includes('tidak valid')) {
        errorTitle = '❌ Data Tidak Valid';
        errorDescription = error.message;
        errorStatus = 'error';
        errorDuration = 6000;
      } else if (error.message && error.message.includes('network') || error.message && error.message.includes('connection')) {
        errorTitle = '🌐 Masalah Koneksi';
        errorDescription = 'Tidak dapat terhubung ke server. Silakan periksa koneksi internet Anda dan coba lagi.';
        errorStatus = 'error';
        errorDuration = 7000;
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        status: errorStatus,
        duration: errorDuration,
        isClosable: true,
        position: 'top-right'
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
        return formData.name && 
               formData.classification_id && 
               formData.building_id && 
               formData.floor_id && 
               nameValidation.isValid && 
               !isCheckingName;
      case 1: // Amenities
        return true; // Amenities are optional
      case 2: // Images
        return true; // Images are optional
      default:
        return true;
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAmenitiesChange = (newAmenities) => {
    updateFormData('amenities', newAmenities);
  };

  const handleImagesChange = (newImages) => {
    updateFormData('images', newImages);
  };

  const renderBasicInfo = () => (
    <VStack spacing={6}>
      <Card w="full">
        <CardBody>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={!nameValidation.isValid}>
              <FormLabel>Nama Kamar</FormLabel>
              <HStack>
                <Input
                  placeholder="contoh: Kamar A-101"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  isInvalid={!nameValidation.isValid}
                />
                {isCheckingName && <Spinner size="sm" />}
              </HStack>
              {nameValidation.message && (
                nameValidation.isValid ? (
                  <FormHelperText color={nameValidation.message.includes('serupa') ? 'orange.500' : 'green.500'}>
                    {nameValidation.message}
                  </FormHelperText>
                ) : (
                  <FormErrorMessage>
                    {nameValidation.message}
                  </FormErrorMessage>
                )
              )}
              <FormHelperText>
                Nama kamar harus unik dan tidak boleh mengandung karakter khusus
              </FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel>Deskripsi</FormLabel>
              <Textarea
                placeholder="Deskripsi singkat tentang kamar"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={3}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Tipe Kamar</FormLabel>
              <Select
                placeholder="Pilih tipe kamar"
                value={formData.classification_id}
                onChange={(e) => updateFormData('classification_id', e.target.value)}
              >
                {classifications.map((classification) => (
                  <option key={classification.id} value={classification.id}>
                    {classification.display_name}
                  </option>
                ))}
              </Select>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Pilih tipe kamar. Tarif akan dihitung secara dinamis saat waktu booking.
              </Text>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Gedung</FormLabel>
              <Select
                placeholder="Pilih gedung"
                value={formData.building_id}
                onChange={(e) => handleBuildingChange(e.target.value)}
                isDisabled={loadingBuildings}
              >
                {buildings.map((building) => (
                  <option key={building.buildingId} value={building.buildingId}>
                    {building.buildingCode} - {building.buildingName}
                  </option>
                ))}
              </Select>
              {loadingBuildings && (
                <HStack mt={1}>
                  <Spinner size="sm" />
                  <Text fontSize="sm" color="gray.500">Memuat gedung...</Text>
                </HStack>
              )}
              <Text fontSize="sm" color="gray.500" mt={1}>
                Pilih gedung tempat kamar berada
              </Text>
            </FormControl>

            <FormControl isRequired isDisabled={!formData.building_id}>
              <FormLabel>Lantai</FormLabel>
              <Select
                placeholder={formData.building_id ? "Pilih lantai" : "Pilih gedung terlebih dahulu"}
                value={formData.floor_id}
                onChange={(e) => updateFormData('floor_id', e.target.value)}
                isDisabled={loadingFloors || !formData.building_id}
              >
                {floors.map((floor) => (
                  <option key={floor.floorId} value={floor.floorId}>
                    {floor.floorName}
                  </option>
                ))}
              </Select>
              {loadingFloors && formData.building_id && (
                <HStack mt={1}>
                  <Spinner size="sm" />
                  <Text fontSize="sm" color="gray.500">Memuat lantai...</Text>
                </HStack>
              )}
              <Text fontSize="sm" color="gray.500" mt={1}>
                Pilih lantai tempat kamar berada
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel>Nomor Kamar</FormLabel>
              <Input
                placeholder="Kosongkan untuk auto-generate (contoh: 01, 02, A1)"
                value={formData.room_number}
                onChange={(e) => updateFormData('room_number', e.target.value)}
              />
              <Text fontSize="sm" color="gray.500" mt={1}>
                Opsional. Jika dikosongkan, sistem akan auto-generate nomor kamar
              </Text>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Kapasitas</FormLabel>
              <NumberInput
                value={formData.capacity}
                onChange={(value) => updateFormData('capacity', parseInt(value) || 4)}
                min={1}
                max={4}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Maksimal 4 orang per kamar
              </Text>
            </FormControl>

            <Alert status="info">
              <AlertIcon />
              <Text fontSize="sm">
                Tarif kamar dihitung secara dinamis berdasarkan tipe penyewa dan klasifikasi kamar saat waktu booking.
              </Text>
            </Alert>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );

  const renderAmenities = () => (
    <VStack spacing={6}>
      <AmenityManager
        amenities={formData.amenities}
        onAmenitiesChange={handleAmenitiesChange}
        readOnly={false}
        showStandardOptions={true}
      />
    </VStack>
  );

  const renderImages = () => (
    <VStack spacing={6}>
      <ImageUploadPreview
        images={formData.images}
        onImagesChange={handleImagesChange}
        maxImages={10}
        maxFileSize={5 * 1024 * 1024} // 5MB
        acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
        showPrimaryToggle={true}
        readOnly={false}
      />
    </VStack>
  );

  const renderReview = () => (
    <VStack spacing={6}>
      <Card w="full">
        <CardBody>
          <VStack align="stretch" spacing={4}>
            <Heading size="md">Tinjau Detail Kamar</Heading>
            
            <Box>
              <Text fontWeight="semibold" mb={2}>Informasi Dasar</Text>
              <VStack align="start" spacing={1} bg="gray.50" p={3} rounded="md">
                <HStack><Text fontWeight="medium">Nama:</Text><Text>{formData.name}</Text></HStack>
                <HStack><Text fontWeight="medium">Tipe:</Text><Text>{classifications.find(c => c.id === parseInt(formData.classification_id))?.display_name}</Text></HStack>
                <HStack><Text fontWeight="medium">Gedung:</Text><Text>{buildings.find(b => b.buildingId === parseInt(formData.building_id))?.buildingName}</Text></HStack>
                <HStack><Text fontWeight="medium">Kode Gedung:</Text><Text>{buildings.find(b => b.buildingId === parseInt(formData.building_id))?.buildingCode}</Text></HStack>
                <HStack><Text fontWeight="medium">Lantai:</Text><Text>{floors.find(f => f.floorId === parseInt(formData.floor_id))?.floorName}</Text></HStack>
                {formData.room_number && (
                  <HStack><Text fontWeight="medium">Nomor Kamar:</Text><Text>{formData.room_number}</Text></HStack>
                )}
                <HStack><Text fontWeight="medium">Kapasitas:</Text><Text>{formData.capacity} orang</Text></HStack>
                {formData.description && (
                  <Box>
                    <Text fontWeight="medium">Deskripsi:</Text>
                    <Text fontSize="sm" color="gray.600">{formData.description}</Text>
                  </Box>
                )}
                <Box mt={2}>
                  <Alert status="success" size="sm">
                    <AlertIcon />
                    <Text fontSize="sm">
                      Kode kamar akan dihasilkan otomatis: {buildings.find(b => b.buildingId === parseInt(formData.building_id))?.buildingCode}{floors.find(f => f.floorId === parseInt(formData.floor_id))?.floorNumber}-{formData.room_number || 'XX'}
                    </Text>
                  </Alert>
                </Box>
                <Box mt={2}>
                  <Alert status="info" size="sm">
                    <AlertIcon />
                    <Text fontSize="sm">
                      Tarif akan dihitung secara dinamis berdasarkan tipe penyewa saat waktu booking.
                    </Text>
                  </Alert>
                </Box>
              </VStack>
            </Box>

            <Box>
              <Text fontWeight="semibold" mb={2}>Fasilitas ({formData.amenities.length})</Text>
              {formData.amenities.length > 0 ? (
                <Flex wrap="wrap" gap={2}>
                  {formData.amenities.map((amenity, index) => (
                    <Badge 
                      key={index} 
                      colorScheme={amenity.custom_feature_name ? "purple" : "green"}
                      variant={amenity.custom_feature_name ? "solid" : "subtle"}
                    >
                      {amenity.custom_feature_name || amenity.name} (x{amenity.quantity})
                      {amenity.custom_feature_name && " ✨"}
                    </Badge>
                  ))}
                </Flex>
              ) : (
                <Text fontSize="sm" color="gray.500">Tidak ada fasilitas ditambahkan</Text>
              )}
            </Box>

            <Box>
              <Text fontWeight="semibold" mb={2}>Gambar ({formData.images.length})</Text>
              {formData.images.length > 0 ? (
                <Text fontSize="sm" color="green.600">
                  {formData.images.length} gambar siap untuk diunggah
                </Text>
              ) : (
                <Text fontSize="sm" color="gray.500">Tidak ada gambar ditambahkan</Text>
              )}
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderAmenities();
      case 2:
        return renderImages();
      case 3:
        return renderReview();
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <VStack align="stretch" spacing={4}>
            <Text>Buat Kamar Baru</Text>
            
            {/* Step Indicator */}
            <Box>
              <Stepper index={activeStep} size="sm">
                {steps.map((step, index) => (
                  <Step key={index}>
                    <StepIndicator>
                      <StepStatus
                        complete={<StepIcon />}
                        incomplete={<StepNumber />}
                        active={<StepNumber />}
                      />
                    </StepIndicator>

                    <Box flexShrink="0">
                      <StepTitle>{step.title}</StepTitle>
                      <StepDescription>{step.description}</StepDescription>
                    </Box>

                    <StepSeparator />
                  </Step>
                ))}
              </Stepper>
            </Box>
          </VStack>
        </ModalHeader>
        
        <ModalCloseButton />

        <ModalBody overflowY="auto">
          {renderStepContent()}
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3} w="full" justify="space-between">
            <Button
              leftIcon={<FiChevronLeft />}
              onClick={prevStep}
              isDisabled={activeStep === 0}
              variant="outline"
            >
              Sebelumnya
            </Button>

            <HStack spacing={3}>
              <Button variant="outline" onClick={onClose}>
                Batal
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  colorScheme="blue"
                  onClick={handleSubmit}
                  isLoading={loading}
                  loadingText="Membuat..."
                >
                  Buat Kamar
                </Button>
              ) : (
                <Button
                  rightIcon={<FiChevronRight />}
                  colorScheme="blue"
                  onClick={nextStep}
                  isDisabled={!canProceedToNextStep()}
                >
                  Selanjutnya
                </Button>
              )}
            </HStack>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ModernRoomCreateModal;
