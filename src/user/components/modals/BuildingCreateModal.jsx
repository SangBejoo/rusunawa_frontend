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
  Input,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  HStack,
  Switch,
  Alert,
  AlertIcon,
  useToast,
  Text,
  Box,
  Divider,
} from '@chakra-ui/react';
import { FiBuilding, FiMapPin, FiLayers } from 'react-icons/fi';
import buildingService from '../../services/buildingService';

const BuildingCreateModal = ({ isOpen, onClose, building = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    buildingCode: '',
    buildingName: '',
    genderType: '',
    address: '',
    description: '',
    totalFloors: 1,
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const toast = useToast();

  const isEdit = !!building;

  useEffect(() => {
    if (building) {
      setFormData({
        buildingCode: building.buildingCode || '',
        buildingName: building.buildingName || '',
        genderType: building.genderType || '',
        address: building.address || '',
        description: building.description || '',
        totalFloors: building.totalFloors || 1,
        isActive: building.isActive ?? true
      });
    } else {
      setFormData({
        buildingCode: '',
        buildingName: '',
        genderType: '',
        address: '',
        description: '',
        totalFloors: 1,
        isActive: true
      });
    }
    setErrors({});
  }, [building, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.buildingCode.trim()) {
      newErrors.buildingCode = 'Kode gedung wajib diisi';
    } else if (!/^[A-Z0-9]{2,10}$/.test(formData.buildingCode)) {
      newErrors.buildingCode = 'Kode gedung harus 2-10 karakter huruf besar dan angka';
    }

    if (!formData.buildingName.trim()) {
      newErrors.buildingName = 'Nama gedung wajib diisi';
    } else if (formData.buildingName.length < 3) {
      newErrors.buildingName = 'Nama gedung minimal 3 karakter';
    }

    if (!formData.genderType) {
      newErrors.genderType = 'Tipe gender wajib dipilih';
    }

    if (formData.totalFloors < 1 || formData.totalFloors > 10) {
      newErrors.totalFloors = 'Jumlah lantai harus antara 1-10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isEdit) {
        await buildingService.updateBuilding(building.buildingId, formData);
        toast({
          title: 'Berhasil',
          description: 'Gedung berhasil diperbarui',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await buildingService.createBuilding(formData);
        toast({
          title: 'Berhasil',
          description: 'Gedung berhasil ditambahkan',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (isEdit ? 'Gagal memperbarui gedung' : 'Gagal menambahkan gedung');
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const generateBuildingCode = () => {
    if (formData.genderType && formData.buildingName) {
      let code = '';
      if (formData.genderType === 'perempuan') {
        code = 'GP';
      } else if (formData.genderType === 'laki_laki') {
        code = 'GL';
      } else if (formData.genderType === 'mixed') {
        code = 'GM';
      }
      
      // Add number if not exists
      const nameWords = formData.buildingName.split(' ');
      const numberWord = nameWords.find(word => /\d+/.test(word));
      if (numberWord) {
        const number = numberWord.match(/\d+/)[0];
        code += number;
      } else {
        code += '1';
      }
      
      handleInputChange('buildingCode', code);
    }
  };

  useEffect(() => {
    if (!isEdit && formData.genderType && formData.buildingName && !formData.buildingCode) {
      generateBuildingCode();
    }
  }, [formData.genderType, formData.buildingName, isEdit]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <FiBuilding />
            <Text>{isEdit ? 'Edit Gedung' : 'Tambah Gedung Baru'}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4}>
            {/* Basic Information */}
            <Box w="full">
              <Text fontSize="md" fontWeight="semibold" mb={3} color="blue.600">
                Informasi Dasar
              </Text>
              
              <VStack spacing={4}>
                <HStack w="full" spacing={4}>
                  <FormControl isRequired isInvalid={errors.buildingCode}>
                    <FormLabel>Kode Gedung</FormLabel>
                    <Input
                      placeholder="Contoh: GP1, GL2"
                      value={formData.buildingCode}
                      onChange={(e) => handleInputChange('buildingCode', e.target.value.toUpperCase())}
                      maxLength={10}
                    />
                    {errors.buildingCode && (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {errors.buildingCode}
                      </Text>
                    )}
                  </FormControl>
                  
                  <FormControl isRequired isInvalid={errors.genderType}>
                    <FormLabel>Tipe Gender</FormLabel>
                    <Select
                      placeholder="Pilih tipe gender"
                      value={formData.genderType}
                      onChange={(e) => handleInputChange('genderType', e.target.value)}
                    >
                      <option value="perempuan">Perempuan</option>
                      <option value="laki_laki">Laki-laki</option>
                      <option value="mixed">Campuran</option>
                    </Select>
                    {errors.genderType && (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {errors.genderType}
                      </Text>
                    )}
                  </FormControl>
                </HStack>

                <FormControl isRequired isInvalid={errors.buildingName}>
                  <FormLabel>Nama Gedung</FormLabel>
                  <Input
                    placeholder="Contoh: Gedung Perempuan Pusat 1"
                    value={formData.buildingName}
                    onChange={(e) => handleInputChange('buildingName', e.target.value)}
                  />
                  {errors.buildingName && (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      {errors.buildingName}
                    </Text>
                  )}
                </FormControl>

                <FormControl>
                  <FormLabel>
                    <HStack>
                      <FiMapPin />
                      <Text>Alamat</Text>
                    </HStack>
                  </FormLabel>
                  <Textarea
                    placeholder="Alamat lengkap gedung (opsional)"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={2}
                  />
                </FormControl>
              </VStack>
            </Box>

            <Divider />

            {/* Floor Configuration */}
            <Box w="full">
              <Text fontSize="md" fontWeight="semibold" mb={3} color="green.600">
                <HStack>
                  <FiLayers />
                  <Text>Konfigurasi Lantai</Text>
                </HStack>
              </Text>
              
              <VStack spacing={4}>
                <FormControl isRequired isInvalid={errors.totalFloors}>
                  <FormLabel>Jumlah Lantai</FormLabel>
                  <NumberInput
                    min={1}
                    max={10}
                    value={formData.totalFloors}
                    onChange={(valueString, valueNumber) => 
                      handleInputChange('totalFloors', valueNumber || 1)}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  {errors.totalFloors && (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      {errors.totalFloors}
                    </Text>
                  )}
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Lantai akan dibuat otomatis setelah gedung disimpan
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel>Deskripsi</FormLabel>
                  <Textarea
                    placeholder="Deskripsi tambahan tentang gedung (opsional)"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </Box>

            <Divider />

            {/* Status */}
            {isEdit && (
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="is-active" mb="0">
                  Status Aktif
                </FormLabel>
                <Switch
                  id="is-active"
                  isChecked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                />
              </FormControl>
            )}

            {/* Information Alert */}
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box fontSize="sm">
                {isEdit ? (
                  <Text>
                    Perubahan jumlah lantai akan secara otomatis menambah atau mengurangi lantai di gedung ini.
                  </Text>
                ) : (
                  <Text>
                    Setelah gedung dibuat, lantai akan otomatis dibuatkan sesuai jumlah yang ditentukan. 
                    Anda dapat mengelola lantai di tab "Lantai".
                  </Text>
                )}
              </Box>
            </Alert>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Batal
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={loading}
            loadingText={isEdit ? 'Memperbarui...' : 'Menyimpan...'}
          >
            {isEdit ? 'Perbarui' : 'Simpan'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BuildingCreateModal;
