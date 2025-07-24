import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  Select,
  VStack,
  HStack,
  Switch,
  Alert,
  AlertIcon,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text,
  Badge,
  Divider,
  useToast,
} from '@chakra-ui/react';
import { FiHome, FiBuilding, FiLayers } from 'react-icons/fi';
import buildingService from '../../services/buildingService';

const EnhancedRoomCreateModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingRoom 
}) => {
  const [formData, setFormData] = useState({
    buildingId: '',
    floorId: '',
    roomClassificationId: '',
    name: '',
    description: '',
    capacity: '',
    pricePerNight: '',
    isAvailable: true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [classifications, setClassifications] = useState([]);
  const [generatedRoomCode, setGeneratedRoomCode] = useState('');

  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchData();
      if (editingRoom) {
        setFormData({
          buildingId: editingRoom.buildingId || '',
          floorId: editingRoom.floorId || '',
          roomClassificationId: editingRoom.roomClassificationId || '',
          name: editingRoom.name || '',
          description: editingRoom.description || '',
          capacity: editingRoom.capacity?.toString() || '',
          pricePerNight: editingRoom.pricePerNight?.toString() || '',
          isAvailable: editingRoom.isAvailable !== false,
        });
      } else {
        setFormData({
          buildingId: '',
          floorId: '',
          roomClassificationId: '',
          name: '',
          description: '',
          capacity: '',
          pricePerNight: '',
          isAvailable: true,
        });
      }
      setErrors({});
      setGeneratedRoomCode('');
    }
  }, [isOpen, editingRoom]);

  useEffect(() => {
    if (formData.buildingId) {
      fetchFloors(formData.buildingId);
    } else {
      setFloors([]);
      setFormData(prev => ({ ...prev, floorId: '' }));
    }
  }, [formData.buildingId]);

  useEffect(() => {
    if (formData.buildingId && formData.floorId && formData.roomClassificationId) {
      generateRoomCode();
    } else {
      setGeneratedRoomCode('');
    }
  }, [formData.buildingId, formData.floorId, formData.roomClassificationId]);

  const fetchData = async () => {
    try {
      const [buildingsResponse, classificationsResponse] = await Promise.all([
        buildingService.getBuildings({ limit: 100 }),
        buildingService.getRoomClassifications()
      ]);
      
      setBuildings(buildingsResponse.buildings || []);
      setClassifications(classificationsResponse.classifications || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const fetchFloors = async (buildingId) => {
    try {
      const response = await buildingService.getFloorsByBuilding(buildingId);
      setFloors(response.floors || []);
    } catch (error) {
      console.error('Failed to fetch floors:', error);
      setFloors([]);
    }
  };

  const generateRoomCode = async () => {
    try {
      const response = await buildingService.generateRoomCode(
        formData.buildingId,
        formData.floorId,
        formData.roomClassificationId
      );
      setGeneratedRoomCode(response.roomCode || '');
    } catch (error) {
      console.error('Failed to generate room code:', error);
      setGeneratedRoomCode('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.buildingId) {
      newErrors.buildingId = 'Gedung harus dipilih';
    }

    if (!formData.floorId) {
      newErrors.floorId = 'Lantai harus dipilih';
    }

    if (!formData.roomClassificationId) {
      newErrors.roomClassificationId = 'Klasifikasi ruangan harus dipilih';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Nama ruangan harus diisi';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nama ruangan minimal 2 karakter';
    }

    if (!formData.capacity) {
      newErrors.capacity = 'Kapasitas harus diisi';
    } else {
      const capacity = parseInt(formData.capacity);
      if (isNaN(capacity) || capacity < 1) {
        newErrors.capacity = 'Kapasitas minimal 1 orang';
      } else if (capacity > 50) {
        newErrors.capacity = 'Kapasitas maksimal 50 orang';
      }
    }

    if (!formData.pricePerNight) {
      newErrors.pricePerNight = 'Harga per malam harus diisi';
    } else {
      const price = parseFloat(formData.pricePerNight);
      if (isNaN(price) || price < 0) {
        newErrors.pricePerNight = 'Harga harus berupa angka positif';
      }
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Deskripsi maksimal 500 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const roomData = {
        ...formData,
        capacity: parseInt(formData.capacity),
        pricePerNight: parseFloat(formData.pricePerNight),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
      };

      if (editingRoom) {
        await buildingService.updateRoom(editingRoom.roomId, roomData);
      } else {
        await buildingService.createRoom(roomData);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save room:', error);
      setErrors({
        submit: error.response?.data?.message || 'Gagal menyimpan ruangan. Silakan coba lagi.'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedBuilding = buildings.find(b => b.buildingId === formData.buildingId);
  const selectedFloor = floors.find(f => f.floorId === formData.floorId);
  const selectedClassification = classifications.find(c => c.roomClassificationId === formData.roomClassificationId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <HStack>
            <FiHome />
            <Text>{editingRoom ? 'Edit Ruangan' : 'Tambah Ruangan'}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody overflowY="auto">
          <VStack spacing={4} align="stretch">
            {errors.submit && (
              <Alert status="error">
                <AlertIcon />
                {errors.submit}
              </Alert>
            )}

            {/* Building Selection */}
            <FormControl isInvalid={!!errors.buildingId} isRequired>
              <FormLabel>Gedung</FormLabel>
              <Select
                value={formData.buildingId}
                onChange={(e) => handleInputChange('buildingId', e.target.value)}
                placeholder="Pilih gedung"
              >
                {buildings.map((building) => (
                  <option key={building.buildingId} value={building.buildingId}>
                    {building.buildingCode} - {building.buildingName}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{errors.buildingId}</FormErrorMessage>
            </FormControl>

            {/* Floor Selection */}
            <FormControl isInvalid={!!errors.floorId} isRequired>
              <FormLabel>Lantai</FormLabel>
              <Select
                value={formData.floorId}
                onChange={(e) => handleInputChange('floorId', e.target.value)}
                placeholder="Pilih lantai"
                isDisabled={!formData.buildingId}
              >
                {floors.map((floor) => (
                  <option key={floor.floorId} value={floor.floorId}>
                    Lantai {floor.floorNumber} - {floor.floorName}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{errors.floorId}</FormErrorMessage>
            </FormControl>

            {/* Room Classification */}
            <FormControl isInvalid={!!errors.roomClassificationId} isRequired>
              <FormLabel>Klasifikasi Ruangan</FormLabel>
              <Select
                value={formData.roomClassificationId}
                onChange={(e) => handleInputChange('roomClassificationId', e.target.value)}
                placeholder="Pilih klasifikasi"
              >
                {classifications.map((classification) => (
                  <option key={classification.roomClassificationId} value={classification.roomClassificationId}>
                    {classification.name} - {classification.gender}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{errors.roomClassificationId}</FormErrorMessage>
            </FormControl>

            {/* Generated Room Code Preview */}
            {generatedRoomCode && (
              <Alert status="info" variant="left-accent">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold">Kode Ruangan yang akan dibuat:</Text>
                  <Badge colorScheme="blue" fontSize="md" p={2}>
                    {generatedRoomCode}
                  </Badge>
                  <Text fontSize="sm">
                    {selectedBuilding?.buildingCode} - Lantai {selectedFloor?.floorNumber} - {selectedClassification?.name}
                  </Text>
                </VStack>
              </Alert>
            )}

            <Divider />

            {/* Room Details */}
            <FormControl isInvalid={!!errors.name} isRequired>
              <FormLabel>Nama Ruangan</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Masukkan nama ruangan"
              />
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.capacity} isRequired>
              <FormLabel>Kapasitas</FormLabel>
              <NumberInput
                value={formData.capacity}
                onChange={(value) => handleInputChange('capacity', value)}
                min={1}
                max={50}
              >
                <NumberInputField placeholder="Jumlah orang" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormErrorMessage>{errors.capacity}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.pricePerNight} isRequired>
              <FormLabel>Harga per Malam (Rp)</FormLabel>
              <NumberInput
                value={formData.pricePerNight}
                onChange={(value) => handleInputChange('pricePerNight', value)}
                min={0}
                precision={0}
              >
                <NumberInputField placeholder="Harga dalam rupiah" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormErrorMessage>{errors.pricePerNight}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.description}>
              <FormLabel>Deskripsi (Opsional)</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Deskripsi ruangan..."
                resize="vertical"
                rows={3}
              />
              <FormErrorMessage>{errors.description}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <HStack justify="space-between">
                <FormLabel mb={0}>Status Tersedia</FormLabel>
                <Switch
                  isChecked={formData.isAvailable}
                  onChange={(e) => handleInputChange('isAvailable', e.target.checked)}
                  colorScheme="green"
                />
              </HStack>
              <Text fontSize="sm" color="gray.600" mt={1}>
                {formData.isAvailable 
                  ? 'Ruangan dapat disewa oleh penyewa' 
                  : 'Ruangan tidak tersedia untuk disewa'
                }
              </Text>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose} mr={3}>
            Batal
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={loading}
            loadingText={editingRoom ? 'Menyimpan...' : 'Menambah...'}
            isDisabled={!generatedRoomCode && !editingRoom}
          >
            {editingRoom ? 'Simpan Perubahan' : 'Tambah Ruangan'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EnhancedRoomCreateModal;
