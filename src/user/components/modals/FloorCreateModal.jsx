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
} from '@chakra-ui/react';
import { FiLayers, FiBuilding } from 'react-icons/fi';
import buildingService from '../../services/buildingService';

const FloorCreateModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingFloor, 
  buildings = [],
  selectedBuildingId = null 
}) => {
  const [formData, setFormData] = useState({
    buildingId: selectedBuildingId || '',
    floorNumber: '',
    floorName: '',
    description: '',
    isAvailable: true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [existingFloors, setExistingFloors] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (editingFloor) {
        setFormData({
          buildingId: editingFloor.buildingId || selectedBuildingId || '',
          floorNumber: editingFloor.floorNumber.toString(),
          floorName: editingFloor.floorName || '',
          description: editingFloor.description || '',
          isAvailable: editingFloor.isAvailable !== false,
        });
      } else {
        setFormData({
          buildingId: selectedBuildingId || '',
          floorNumber: '',
          floorName: '',
          description: '',
          isAvailable: true,
        });
      }
      setErrors({});
    }
  }, [isOpen, editingFloor, selectedBuildingId]);

  useEffect(() => {
    if (formData.buildingId) {
      fetchExistingFloors(formData.buildingId);
    }
  }, [formData.buildingId]);

  const fetchExistingFloors = async (buildingId) => {
    try {
      const response = await buildingService.getFloorsByBuilding(buildingId);
      setExistingFloors(response.floors || []);
    } catch (error) {
      console.error('Failed to fetch existing floors:', error);
      setExistingFloors([]);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Building ID validation
    if (!formData.buildingId) {
      newErrors.buildingId = 'Gedung harus dipilih';
    }

    // Floor number validation
    if (!formData.floorNumber) {
      newErrors.floorNumber = 'Nomor lantai harus diisi';
    } else {
      const floorNum = parseInt(formData.floorNumber);
      if (isNaN(floorNum)) {
        newErrors.floorNumber = 'Nomor lantai harus berupa angka';
      } else if (floorNum < 1) {
        newErrors.floorNumber = 'Nomor lantai minimal 1';
      } else if (floorNum > 50) {
        newErrors.floorNumber = 'Nomor lantai maksimal 50';
      } else {
        // Check for duplicate floor number (only for new floors or when changing floor number)
        const isDuplicate = existingFloors.some(floor => 
          floor.floorNumber === floorNum && 
          (!editingFloor || floor.floorId !== editingFloor.floorId)
        );
        if (isDuplicate) {
          newErrors.floorNumber = `Lantai ${floorNum} sudah ada di gedung ini`;
        }
      }
    }

    // Floor name validation
    if (!formData.floorName.trim()) {
      newErrors.floorName = 'Nama lantai harus diisi';
    } else if (formData.floorName.trim().length < 2) {
      newErrors.floorName = 'Nama lantai minimal 2 karakter';
    } else if (formData.floorName.trim().length > 100) {
      newErrors.floorName = 'Nama lantai maksimal 100 karakter';
    }

    // Description validation (optional)
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

    // Clear specific field error when user starts typing
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
      const floorData = {
        ...formData,
        floorNumber: parseInt(formData.floorNumber),
        floorName: formData.floorName.trim(),
        description: formData.description.trim() || null,
      };

      if (editingFloor) {
        await buildingService.updateFloor(editingFloor.floorId, floorData);
      } else {
        await buildingService.createFloor(floorData);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save floor:', error);
      setErrors({
        submit: error.response?.data?.message || 'Gagal menyimpan lantai. Silakan coba lagi.'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateFloorName = () => {
    if (!formData.floorNumber) return;
    
    const floorNum = parseInt(formData.floorNumber);
    if (isNaN(floorNum)) return;

    let defaultName = '';
    if (floorNum === 1) {
      defaultName = 'Lantai Dasar';
    } else if (floorNum === 2) {
      defaultName = 'Lantai Dua';
    } else if (floorNum === 3) {
      defaultName = 'Lantai Tiga';
    } else {
      defaultName = `Lantai ${floorNum}`;
    }

    handleInputChange('floorName', defaultName);
  };

  const selectedBuilding = buildings.find(b => b.buildingId === formData.buildingId);
  const usedFloorNumbers = existingFloors.map(f => f.floorNumber);
  const nextAvailableFloor = Math.max(0, ...usedFloorNumbers) + 1;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <FiLayers />
            <Text>{editingFloor ? 'Edit Lantai' : 'Tambah Lantai'}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
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
                isDisabled={!!selectedBuildingId || !!editingFloor}
              >
                {buildings.map((building) => (
                  <option key={building.buildingId} value={building.buildingId}>
                    {building.buildingCode} - {building.buildingName}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{errors.buildingId}</FormErrorMessage>
            </FormControl>

            {/* Building Info */}
            {selectedBuilding && (
              <Alert status="info" variant="left-accent">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <HStack>
                    <FiBuilding />
                    <Text fontWeight="semibold">{selectedBuilding.buildingName}</Text>
                    <Badge colorScheme="blue">{selectedBuilding.buildingCode}</Badge>
                  </HStack>
                  <Text fontSize="sm">
                    Lantai tersedia: {usedFloorNumbers.length > 0 ? usedFloorNumbers.join(', ') : 'Belum ada'}
                    {!editingFloor && (
                      <> | Disarankan: {nextAvailableFloor}</>
                    )}
                  </Text>
                </VStack>
              </Alert>
            )}

            {/* Floor Number */}
            <FormControl isInvalid={!!errors.floorNumber} isRequired>
              <FormLabel>Nomor Lantai</FormLabel>
              <HStack>
                <NumberInput
                  value={formData.floorNumber}
                  onChange={(value) => handleInputChange('floorNumber', value)}
                  min={1}
                  max={50}
                  flex={1}
                >
                  <NumberInputField placeholder="Masukkan nomor lantai" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                {!editingFloor && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleInputChange('floorNumber', nextAvailableFloor.toString())}
                  >
                    Gunakan {nextAvailableFloor}
                  </Button>
                )}
              </HStack>
              <FormErrorMessage>{errors.floorNumber}</FormErrorMessage>
            </FormControl>

            {/* Floor Name */}
            <FormControl isInvalid={!!errors.floorName} isRequired>
              <FormLabel>Nama Lantai</FormLabel>
              <HStack>
                <Input
                  value={formData.floorName}
                  onChange={(e) => handleInputChange('floorName', e.target.value)}
                  placeholder="Masukkan nama lantai"
                  flex={1}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={generateFloorName}
                  isDisabled={!formData.floorNumber}
                >
                  Auto
                </Button>
              </HStack>
              <FormErrorMessage>{errors.floorName}</FormErrorMessage>
            </FormControl>

            {/* Description */}
            <FormControl isInvalid={!!errors.description}>
              <FormLabel>Deskripsi (Opsional)</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Deskripsi lantai..."
                resize="vertical"
                rows={3}
              />
              <FormErrorMessage>{errors.description}</FormErrorMessage>
            </FormControl>

            {/* Is Available */}
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
                  ? 'Lantai dapat digunakan untuk penempatan ruangan' 
                  : 'Lantai tidak tersedia untuk penempatan ruangan baru'
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
            loadingText={editingFloor ? 'Menyimpan...' : 'Menambah...'}
          >
            {editingFloor ? 'Simpan Perubahan' : 'Tambah Lantai'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default FloorCreateModal;
