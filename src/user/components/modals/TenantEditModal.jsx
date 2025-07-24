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
  VStack,
  HStack,
  Text,
  Textarea,
  Switch,
  useToast,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Box,
  Badge,
  Icon,
  Divider
} from '@chakra-ui/react';
import { FiUser, FiMapPin, FiBook, FiMail, FiPhone, FiHome } from 'react-icons/fi';
import LocationPicker from '../../../tenant/components/map/LocationPicker';
import tenantService from '../../services/tenantService';

const TenantEditModal = ({ isOpen, onClose, tenant, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [triggerGeocode, setTriggerGeocode] = useState(0);
  const toast = useToast();

  // Form data state
  const [formData, setFormData] = useState({
    // Basic tenant info
    full_name: '',
    email: '',
    phone: '',
    address: '',
    gender: '',
    jurusan: '',
    is_afirmasi: false,
    
    // Location data
    home_latitude: null,
    home_longitude: null,
    
    // NIM data
    nim: '',
    
    // Tenant type - now editable
    type_id: null
  });

  // Initialize form data when tenant prop changes
  useEffect(() => {
    if (tenant) {
      console.log('Initializing form with tenant data:', tenant);
      console.log('Tenant jurusan:', tenant.jurusan);
      console.log('Tenant isAfirmasi:', tenant.isAfirmasi);
      
      setFormData({
        full_name: tenant.user?.fullName || tenant.name || '',
        email: tenant.user?.email || tenant.email || '',
        phone: tenant.phone || '',
        address: tenant.address || '',
        gender: tenant.gender || '',
        jurusan: tenant.jurusan || '', // Ensure jurusan is properly set
        is_afirmasi: tenant.isAfirmasi || tenant.is_afirmasi || false,
        home_latitude: tenant.homeLatitude || null,
        home_longitude: tenant.homeLongitude || null,
        nim: tenant.nim || '',
        type_id: tenant.typeId || tenant.type_id || null // Add tenant type to form data
      });
      setErrors({});
      
      console.log('Form data initialized with jurusan:', tenant.jurusan || '');
    }
  }, [tenant]);

  // Handle form field changes
  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // If changing tenant type to non-mahasiswa, clear academic fields
      if (field === 'type_id' && value === 2) {
        newData.jurusan = '';
        newData.nim = '';
        newData.is_afirmasi = false;
        console.log('Switching to non-mahasiswa: clearing academic fields');
      }
      
      return newData;
    });
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Handle location changes from LocationPicker
  const handleLocationChange = (coordinates) => {
    if (coordinates && coordinates.lat && coordinates.lng) {
      setFormData(prev => ({
        ...prev,
        home_latitude: coordinates.lat,
        home_longitude: coordinates.lng
      }));
    }
  };

  // Handle address changes from LocationPicker
  const handleAddressChange = (address) => {
    setFormData(prev => ({
      ...prev,
      address: address
    }));
  };

  // Trigger geocoding from address
  const handleGeocodeAddress = () => {
    if (formData.address && formData.address.trim().length > 10) {
      setTriggerGeocode(prev => prev + 1);
    } else {
      toast({
        title: 'Alamat Terlalu Singkat',
        description: 'Silakan masukkan alamat yang lebih detail untuk pencarian koordinat.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Check if current tenant type is mahasiswa (based ONLY on form selection)
  const isStudentType = () => {
    // Only check the current form selection, ignore original tenant data
    return formData.type_id === 1;
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nama lengkap wajib diisi';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Nomor telepon wajib diisi';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Alamat wajib diisi';
    }

    if (!formData.gender) {
      newErrors.gender = 'Jenis kelamin wajib dipilih';
    }

    if (!formData.type_id) {
      newErrors.type_id = 'Tipe penyewa wajib dipilih';
    }

    // Only validate academic fields for students (only based on current form selection)
    if (formData.type_id === 1) {
      console.log('Validating student fields. Current jurusan:', formData.jurusan);
      console.log('Current NIM:', formData.nim);
      
      if (!formData.jurusan || !formData.jurusan.trim()) {
        newErrors.jurusan = 'Jurusan wajib diisi untuk mahasiswa';
        console.log('Jurusan validation failed - empty value');
      }

      if (!formData.nim || !formData.nim.trim()) {
        newErrors.nim = 'NIM wajib diisi untuk mahasiswa';
        console.log('NIM validation failed - empty value');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    const tenantId = tenant.tenantId || tenant.tenant_id;
    const originalTypeId = tenant.typeId || tenant.type_id;
    const isChangingToStudent = originalTypeId !== 1 && formData.type_id === 1;
    const isChangingFromStudent = originalTypeId === 1 && formData.type_id !== 1;

    // For type changes to mahasiswa, skip academic field validation
    if (!isChangingToStudent && !validateForm()) {
      toast({
        title: 'Data Tidak Valid',
        description: 'Silakan perbaiki kesalahan pada form.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // For type changes to mahasiswa, validate only basic fields
    if (isChangingToStudent) {
      const basicErrors = {};

      if (!formData.full_name.trim()) {
        basicErrors.full_name = 'Nama lengkap wajib diisi';
      }
      if (!formData.email.trim()) {
        basicErrors.email = 'Email wajib diisi';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        basicErrors.email = 'Format email tidak valid';
      }
      if (!formData.phone.trim()) {
        basicErrors.phone = 'Nomor telepon wajib diisi';
      }
      if (!formData.address.trim()) {
        basicErrors.address = 'Alamat wajib diisi';
      }
      if (!formData.gender) {
        basicErrors.gender = 'Jenis kelamin wajib dipilih';
      }
      if (!formData.type_id) {
        basicErrors.type_id = 'Tipe penyewa wajib dipilih';
      }

      if (Object.keys(basicErrors).length > 0) {
        setErrors(basicErrors);
        toast({
          title: 'Data Tidak Valid',
          description: 'Silakan perbaiki kesalahan pada form.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      console.log('Update sequence starting:', {
        originalType: originalTypeId,
        newType: formData.type_id,
        isChangingToStudent,
        isChangingFromStudent
      });

      // STEP 1: Handle type changes first (critical for database constraints)
      if (isChangingToStudent) {
        // When changing to mahasiswa, we need to update type first, then ask user to complete academic data
        console.log('Changing to mahasiswa - updating type first, academic data will be requested after reload');
        
        // Update basic data + type change (without academic fields)
        const basicData = {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          gender: formData.gender,
          type_id: formData.type_id, // Change to mahasiswa
          tenant_id: tenantId
        };

        console.log('Updating tenant type to mahasiswa:', basicData);
        await tenantService.updateTenant(tenantId, basicData);

        // Update location if provided
        if (formData.home_latitude && formData.home_longitude) {
          const locationData = {
            home_latitude: formData.home_latitude,
            home_longitude: formData.home_longitude,
            tenant_id: tenantId
          };
          await tenantService.updateTenantLocation(tenantId, locationData);
        }

        // Show success message with instructions for academic data
        toast({
          title: 'Tipe Berhasil Diubah',
          description: 'Penyewa telah diubah menjadi mahasiswa. Silakan edit kembali untuk melengkapi data akademik (NIM, jurusan).',
          status: 'success',
          duration: 6000,
          isClosable: true,
        });

        // Refresh parent data and close modal
        if (onUpdate) {
          await onUpdate();
        }
        onClose();
        return;
      }

      if (isChangingFromStudent) {
        // When changing from mahasiswa to non-mahasiswa, clear academic fields
        console.log('Changing from mahasiswa to non-mahasiswa - clearing academic data');
        
        const basicData = {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          gender: formData.gender,
          type_id: formData.type_id,
          jurusan: '', // Clear academic fields
          is_afirmasi: false,
          tenant_id: tenantId
        };

        await tenantService.updateTenant(tenantId, basicData);

        // Also clear NIM
        try {
          const nimData = { nim: '', tenant_id: tenantId };
          await tenantService.updateTenantNIM(tenantId, nimData);
        } catch (error) {
          console.log('NIM clearing might have failed, but continuing...');
        }

        if (formData.home_latitude && formData.home_longitude) {
          const locationData = {
            home_latitude: formData.home_latitude,
            home_longitude: formData.home_longitude,
            tenant_id: tenantId
          };
          await tenantService.updateTenantLocation(tenantId, locationData);
        }

        toast({
          title: 'Berhasil',
          description: 'Penyewa berhasil diubah menjadi non-mahasiswa. Data akademik telah dihapus.',
          status: 'success',
          duration: 4000,
          isClosable: true,
        });

        if (onUpdate) {
          await onUpdate();
        }
        onClose();
        return;
      }

      // STEP 2: Handle regular updates (no type change)
      const basicData = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        gender: formData.gender,
        type_id: formData.type_id,
        tenant_id: tenantId
      };

      // For existing mahasiswa, include academic fields
      if (formData.type_id === 1) {
        // Validate academic fields for existing students
        if (!formData.nim || !formData.nim.trim()) {
          toast({
            title: 'NIM Diperlukan',
            description: 'NIM wajib diisi untuk mahasiswa. Silakan lengkapi data akademik.',
            status: 'error',
            duration: 4000,
            isClosable: true,
          });
          setIsLoading(false);
          return;
        }

        if (!formData.jurusan || !formData.jurusan.trim()) {
          toast({
            title: 'Jurusan Diperlukan',
            description: 'Jurusan wajib diisi untuk mahasiswa. Silakan lengkapi data akademik.',
            status: 'error',
            duration: 4000,
            isClosable: true,
          });
          setIsLoading(false);
          return;
        }

        basicData.jurusan = formData.jurusan;
        basicData.is_afirmasi = formData.is_afirmasi;
        console.log('Including academic fields for existing student:', {
          jurusan: formData.jurusan,
          is_afirmasi: formData.is_afirmasi
        });
      } else {
        // For non-students, clear academic fields
        basicData.jurusan = '';
        basicData.is_afirmasi = false;
      }

      console.log('Updating tenant with data:', basicData);
      await tenantService.updateTenant(tenantId, basicData);

      // Update location if provided
      if (formData.home_latitude && formData.home_longitude) {
        const locationData = {
          home_latitude: formData.home_latitude,
          home_longitude: formData.home_longitude,
          tenant_id: tenantId
        };
        await tenantService.updateTenantLocation(tenantId, locationData);
      }

      // Update NIM for existing students
      if (formData.type_id === 1 && formData.nim) {
        const nimData = {
          nim: formData.nim,
          tenant_id: tenantId
        };
        console.log('Updating NIM for existing student:', nimData);
        await tenantService.updateTenantNIM(tenantId, nimData);
      }

      toast({
        title: 'Berhasil',
        description: 'Data penyewa berhasil diperbarui',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      if (onUpdate) {
        await onUpdate();
      }
      onClose();

    } catch (error) {
      console.error('Error updating tenant:', error);
      toast({
        title: 'Gagal Memperbarui',
        description: error.message || 'Terjadi kesalahan saat memperbarui data penyewa',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!tenant) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent maxH="90vh" overflowY="auto">
        <ModalHeader>
          <HStack spacing={3}>
            <Icon as={FiUser} color="purple.500" />
            <Text>Edit Data Penyewa</Text>
            <Badge colorScheme="purple">{tenant.user?.fullName || tenant.name}</Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <Tabs colorScheme="purple">
            <TabList>
              <Tab>
                <HStack spacing={2}>
                  <Icon as={FiUser} />
                  <Text>Data Pribadi</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <Icon as={FiMapPin} />
                  <Text>Lokasi</Text>
                </HStack>
              </Tab>
              {/* Only show Academic tab for students (based ONLY on current form selection) */}
              {formData.type_id === 1 && (
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={FiBook} />
                    <Text>Data Akademik</Text>
                    <Badge colorScheme="green" size="sm">Aktif</Badge>
                  </HStack>
                </Tab>
              )}
            </TabList>

            <TabPanels>
              {/* Personal Data Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="sm">
                      Perbarui data pribadi penyewa dengan hati-hati. Pastikan semua informasi akurat.
                    </Text>
                  </Alert>

                  <FormControl isInvalid={errors.full_name}>
                    <FormLabel>
                      <HStack spacing={2}>
                        <Icon as={FiUser} />
                        <Text>Nama Lengkap</Text>
                      </HStack>
                    </FormLabel>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => handleChange('full_name', e.target.value)}
                      placeholder="Masukkan nama lengkap"
                    />
                    {errors.full_name && (
                      <Text color="red.500" fontSize="sm">{errors.full_name}</Text>
                    )}
                  </FormControl>

                  <FormControl isInvalid={errors.email}>
                    <FormLabel>
                      <HStack spacing={2}>
                        <Icon as={FiMail} />
                        <Text>Email</Text>
                      </HStack>
                    </FormLabel>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="Masukkan email"
                    />
                    {errors.email && (
                      <Text color="red.500" fontSize="sm">{errors.email}</Text>
                    )}
                  </FormControl>

                  <FormControl isInvalid={errors.phone}>
                    <FormLabel>
                      <HStack spacing={2}>
                        <Icon as={FiPhone} />
                        <Text>Nomor Telepon</Text>
                      </HStack>
                    </FormLabel>
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="Masukkan nomor telepon"
                    />
                    {errors.phone && (
                      <Text color="red.500" fontSize="sm">{errors.phone}</Text>
                    )}
                  </FormControl>

                  <FormControl isInvalid={errors.gender}>
                    <FormLabel>Jenis Kelamin</FormLabel>
                    <Select
                      value={formData.gender}
                      onChange={(e) => handleChange('gender', e.target.value)}
                      placeholder="Pilih jenis kelamin"
                    >
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </Select>
                    {errors.gender && (
                      <Text color="red.500" fontSize="sm">{errors.gender}</Text>
                    )}
                  </FormControl>

                  {/* Editable tenant type selector */}
                  <FormControl isInvalid={errors.type_id}>
                    <FormLabel>Tipe Penyewa</FormLabel>
                    <Select
                      value={formData.type_id || ''}
                      onChange={(e) => handleChange('type_id', parseInt(e.target.value))}
                      placeholder="Pilih tipe penyewa"
                    >
                      <option value={1}>Mahasiswa</option>
                      <option value={2}>Non Mahasiswa</option>
                    </Select>
                    {errors.type_id && (
                      <Text color="red.500" fontSize="sm">{errors.type_id}</Text>
                    )}
                    <Text fontSize="xs" color="blue.600" mt={1}>
                      💡 Mengubah tipe penyewa akan memengaruhi field dan validasi yang tersedia
                    </Text>
                  </FormControl>

                  {/* Only show affirmasi status for students (based ONLY on current form selection) */}
                  {formData.type_id === 1 && (
                    <FormControl>
                      <FormLabel>Status Afirmasi</FormLabel>
                      <Box p={4} bg={formData.is_afirmasi ? "green.50" : "gray.50"} borderRadius="md" border="1px solid" borderColor={formData.is_afirmasi ? "green.200" : "gray.200"}>
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1}>
                            <Text fontSize="sm" fontWeight="medium" color={formData.is_afirmasi ? "green.700" : "gray.700"}>
                              {formData.is_afirmasi ? 'Penerima Afirmasi' : 'Bukan Penerima Afirmasi'}
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              Status afirmasi hanya berlaku untuk mahasiswa
                            </Text>
                          </VStack>
                          <Switch
                            isChecked={formData.is_afirmasi}
                            onChange={(e) => handleChange('is_afirmasi', e.target.checked)}
                            colorScheme={formData.is_afirmasi ? "green" : "purple"}
                            size="lg"
                          />
                        </HStack>
                        {formData.is_afirmasi && (
                          <Box mt={2} p={2} bg="green.100" borderRadius="md">
                            <Text fontSize="xs" color="green.800">
                              ✓ Mahasiswa ini terdaftar sebagai penerima program afirmasi
                            </Text>
                          </Box>
                        )}
                      </Box>
                    </FormControl>
                  )}

                  {/* Show message when non-mahasiswa is selected */}
                  {formData.type_id === 2 && (
                    <Box p={4} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                      <Text fontSize="sm" fontWeight="medium" color="blue.700">
                        📚 Non Mahasiswa
                      </Text>
                      <Text fontSize="xs" color="blue.600" mt={1}>
                        Data akademik seperti NIM, jurusan, dan status afirmasi tidak diperlukan untuk tipe penyewa ini.
                      </Text>
                    </Box>
                  )}
                </VStack>
              </TabPanel>

              {/* Location Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="sm">
                      Perbarui alamat dan koordinat rumah penyewa. Gunakan peta untuk memilih lokasi yang tepat.
                    </Text>
                  </Alert>

                  <FormControl isInvalid={errors.address}>
                    <FormLabel>
                      <HStack spacing={2}>
                        <Icon as={FiHome} />
                        <Text>Alamat Rumah</Text>
                      </HStack>
                    </FormLabel>
                    <Textarea
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="Masukkan alamat lengkap rumah"
                      rows={3}
                    />
                    {errors.address && (
                      <Text color="red.500" fontSize="sm">{errors.address}</Text>
                    )}
                  </FormControl>

                  <HStack>
                    <Button
                      onClick={handleGeocodeAddress}
                      colorScheme="blue"
                      size="sm"
                      leftIcon={<Icon as={FiMapPin} />}
                    >
                      Cari Koordinat dari Alamat
                    </Button>
                    {formData.home_latitude && formData.home_longitude && (
                      <Badge colorScheme="green">
                        Koordinat: {formData.home_latitude.toFixed(6)}, {formData.home_longitude.toFixed(6)}
                      </Badge>
                    )}
                  </HStack>

                  <Divider />

                  <Box>
                    <Text fontWeight="medium" mb={3}>Pilih Lokasi pada Peta</Text>
                    <Text fontSize="sm" color="gray.600" mb={4}>
                      Klik pada peta untuk memilih lokasi rumah, atau masukkan alamat di atas dan klik "Cari Koordinat"
                    </Text>
                    
                    <Box height="400px" borderRadius="md" overflow="hidden" border="1px solid" borderColor="gray.200">
                      <LocationPicker
                        value={formData.home_latitude && formData.home_longitude ? {
                          lat: formData.home_latitude,
                          lng: formData.home_longitude
                        } : null}
                        onChange={handleLocationChange}
                        addressValue={formData.address}
                        onAddressChange={handleAddressChange}
                        triggerGeocode={triggerGeocode}
                      />
                    </Box>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Academic Data Tab - Only for students (based ONLY on current form selection) */}
              {formData.type_id === 1 && (
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <Alert status="success" borderRadius="md">
                      <AlertIcon />
                      <Text fontSize="sm">
                        ✅ Data akademik diperlukan untuk mahasiswa. Silakan lengkapi semua field di bawah ini.
                      </Text>
                    </Alert>

                    <FormControl isInvalid={errors.nim}>
                      <FormLabel>
                        <HStack spacing={2}>
                          <Icon as={FiBook} />
                          <Text>NIM (Nomor Induk Mahasiswa)</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        value={formData.nim}
                        onChange={(e) => handleChange('nim', e.target.value)}
                        placeholder="Masukkan NIM"
                      />
                      {errors.nim && (
                        <Text color="red.500" fontSize="sm">{errors.nim}</Text>
                      )}
                      {!formData.nim && (
                        <Text fontSize="xs" color="orange.600" mt={1}>
                          ⚠️ NIM belum diisi. Silakan lengkapi data akademik.
                        </Text>
                      )}
                    </FormControl>

                    <FormControl isInvalid={errors.jurusan}>
                      <FormLabel>Jurusan/Program Studi</FormLabel>
                      <Input
                        value={formData.jurusan}
                        onChange={(e) => handleChange('jurusan', e.target.value)}
                        placeholder="Masukkan jurusan/program studi"
                      />
                      {errors.jurusan && (
                        <Text color="red.500" fontSize="sm">{errors.jurusan}</Text>
                      )}
                      {!formData.jurusan && (
                        <Text fontSize="xs" color="orange.600" mt={1}>
                          ⚠️ Jurusan belum diisi. Silakan lengkapi data akademik.
                        </Text>
                      )}
                    </FormControl>

                    {/* Display current academic info */}
                    {tenant.nim && (
                      <Box p={4} bg="gray.50" borderRadius="md">
                        <Text fontWeight="medium" mb={2}>Data Akademik Saat Ini:</Text>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm">NIM: {tenant.nim}</Text>
                          <Text fontSize="sm">Jurusan: {tenant.jurusan}</Text>
                          <Text fontSize="sm">Tipe: {tenant.tenantType?.name || 'N/A'}</Text>
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleSave}
              isLoading={isLoading}
              loadingText="Menyimpan..."
            >
              Simpan Perubahan
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TenantEditModal;
