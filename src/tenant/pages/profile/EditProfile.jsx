import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  VStack,
  HStack,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Avatar,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Flex,
  Icon,
  Select,
  Textarea,
  Switch,
  Badge,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Divider,
  Progress,
  Collapse,
  useColorModeValue
} from '@chakra-ui/react';
import { 
  FaUser, 
  FaArrowLeft, 
  FaSave, 
  FaMapMarkerAlt, 
  FaIdCard, 
  FaGraduationCap,
  FaPhone,
  FaEnvelope,
  FaHome,
  FaTransgenderAlt,
  FaCalculator,
  FaMap,
  FaChevronUp,
  FaChevronDown
} from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import { useTenantAuth } from '../../context/tenantAuthContext';
import tenantService from '../../services/tenantService';
import { validateName, validatePhone, validateAddress, validateEmail } from '../../utils/validationUtils';
import LocationPicker from '../../components/map/LocationPicker';

const EditProfile = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { tenant, refreshTenant } = useTenantAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenantTypes, setTenantTypes] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  
  // Enhanced form data structure
  const [formData, setFormData] = useState({
    // Basic info
    full_name: '',
    email: '',
    phone: '',
    address: '',
    gender: '',
    
    // Academic info (only for students)
    nim: '',
    jurusan: '',
    is_afirmasi: false,
    
    // Location info
    home_latitude: '',
    home_longitude: '',
    
    // Password (optional)
    password: ''
  });

  // Location picker states
  const [locationCoordinates, setLocationCoordinates] = useState(null);  const [locationAddress, setLocationAddress] = useState('');
  const [triggerGeocode, setTriggerGeocode] = useState(0);
  const [showManualInput, setShowManualInput] = useState(false);

  const [errors, setErrors] = useState({});
  const [saveProgress, setSaveProgress] = useState(0);
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load tenant types (hardcoded, no API call needed)
        const typesResponse = await tenantService.getTenantTypes();
        setTenantTypes(typesResponse.tenantTypes || []);
        
        // Load current tenant data
        if (tenant) {
          const initialFormData = {
            full_name: tenant.user?.fullName || '',
            email: tenant.user?.email || '',
            phone: tenant.phone || '',
            address: tenant.address || '',
            gender: tenant.gender || '',
            nim: tenant.nim || '',
            jurusan: tenant.jurusan || '',
            is_afirmasi: tenant.isAfirmasi || false,
            home_latitude: tenant.homeLatitude ? tenant.homeLatitude.toString() : '',
            home_longitude: tenant.homeLongitude ? tenant.homeLongitude.toString() : '',
            password: ''
          };
          
          setFormData(initialFormData);
          
          // Set initial location data for LocationPicker
          if (tenant.homeLatitude && tenant.homeLongitude) {
            setLocationCoordinates({
              lat: tenant.homeLatitude,
              lng: tenant.homeLongitude
            });
          }
          
          // Use address from tenant data as initial location address
          if (tenant.address) {
            setLocationAddress(tenant.address);
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
        // Don't show error toast for tenant types since it's hardcoded now
        // Just set default tenant types
        setTenantTypes([
          { typeId: 1, name: 'mahasiswa' },
          { typeId: 2, name: 'non_mahasiswa' }
        ]);
        
        if (tenant) {
          const initialFormData = {
            full_name: tenant.user?.fullName || '',
            email: tenant.user?.email || '',
            phone: tenant.phone || '',
            address: tenant.address || '',
            gender: tenant.gender || '',
            nim: tenant.nim || '',
            jurusan: tenant.jurusan || '',
            is_afirmasi: tenant.isAfirmasi || false,
            home_latitude: tenant.homeLatitude ? tenant.homeLatitude.toString() : '',
            home_longitude: tenant.homeLongitude ? tenant.homeLongitude.toString() : '',
            password: ''
          };
          
          setFormData(initialFormData);
          
          // Set initial location data for LocationPicker
          if (tenant.homeLatitude && tenant.homeLongitude) {
            setLocationCoordinates({
              lat: tenant.homeLatitude,
              lng: tenant.homeLongitude
            });
          }
          
          // Use address from tenant data as initial location address
          if (tenant.address) {
            setLocationAddress(tenant.address);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [tenant, toast]);

  // Enhanced validation
  const validateForm = () => {
    const newErrors = {};
    
    // Basic validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailError = validateEmail(formData.email);
      if (emailError) newErrors.email = emailError;
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const phoneError = validatePhone(formData.phone);
      if (phoneError) newErrors.phone = phoneError;
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else {
      const addressError = validateAddress(formData.address);
      if (addressError) newErrors.address = addressError;
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    
    // Academic validation (only for students)
    const isStudent = tenant?.typeId === 1;
    if (isStudent) {
      if (!formData.nim.trim()) {
        newErrors.nim = 'NIM is required for students';
      }
      if (!formData.jurusan.trim()) {
        newErrors.jurusan = 'Department (Jurusan) is required for students';
      }
    }
    
    // Location validation
    if (formData.home_latitude) {
      const lat = parseFloat(formData.home_latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.home_latitude = 'Latitude must be a valid number between -90 and 90';
      }
    }
    
    if (formData.home_longitude) {
      const lng = parseFloat(formData.home_longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.home_longitude = 'Longitude must be a valid number between -180 and 180';
      }
    }
    
    // Password validation (if provided)
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }

    // Update location coordinates if this is a coordinate change
    if (name === 'home_latitude' || name === 'home_longitude') {
      const currentLat = name === 'home_latitude' ? value : formData.home_latitude;
      const currentLng = name === 'home_longitude' ? value : formData.home_longitude;
      
      if (currentLat && currentLng && !isNaN(parseFloat(currentLat)) && !isNaN(parseFloat(currentLng))) {
        setLocationCoordinates({
          lat: parseFloat(currentLat),
          lng: parseFloat(currentLng)
        });
      }
    }
  };

  const handleNumberChange = (name, value) => {
    // Ensure we handle empty strings and undefined values properly
    const cleanValue = value === undefined || value === null ? '' : value.toString();
    
    setFormData(prev => ({
      ...prev,
      [name]: cleanValue
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }

    // Update location coordinates if this is a coordinate change
    if (name === 'home_latitude' || name === 'home_longitude') {
      const currentLat = name === 'home_latitude' ? cleanValue : formData.home_latitude;
      const currentLng = name === 'home_longitude' ? cleanValue : formData.home_longitude;
      
      if (currentLat && currentLng && !isNaN(parseFloat(currentLat)) && !isNaN(parseFloat(currentLng))) {
        setLocationCoordinates({
          lat: parseFloat(currentLat),
          lng: parseFloat(currentLng)
        });
      }
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setLocationCoordinates(coords);
          setFormData(prev => ({
            ...prev,
            home_latitude: position.coords.latitude.toString(),
            home_longitude: position.coords.longitude.toString()
          }));
          
          toast({
            title: 'Location Updated',
            description: 'Your current location has been detected and updated on the map',
            status: 'success',
            duration: 3000,
            isClosable: true
          });
        },
        (error) => {
          toast({
            title: 'Location Error',
            description: 'Unable to get your current location',
            status: 'error',
            duration: 3000,
            isClosable: true
          });
        }
      );
    } else {
      toast({
        title: 'Not Supported',
        description: 'Geolocation is not supported by this browser',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // Handle location changes from LocationPicker
  const handleLocationChange = (coordinates, address) => {
    console.log('Location changed:', coordinates, 'Address:', address);
    setLocationCoordinates(coordinates);
    if (coordinates) {
      setFormData(prev => ({
        ...prev,
        home_latitude: coordinates.lat.toString(),
        home_longitude: coordinates.lng.toString(),
        // Update address if provided and not manually overridden
        ...(address && !prev.address ? { address } : {})
      }));
    }
  };

  // Handle address changes from LocationPicker
  const handleLocationAddressChange = (address) => {
    console.log('Address changed:', address);
    setLocationAddress(address);
    // Optionally update form address if user hasn't manually set one
    if (address && (!formData.address || formData.address.trim() === '')) {
      setFormData(prev => ({
        ...prev,
        address: address
      }));
    }
  };

  // Trigger geocoding when user searches for address
  const handleGeocodeAddress = () => {
    if (locationAddress && locationAddress.trim().length > 10) {
      setTriggerGeocode(Date.now()); // Use timestamp to trigger geocoding
    } else {
      toast({
        title: 'Address Too Short',
        description: 'Please enter a more detailed address for better location accuracy',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      setSaveProgress(0);
      
      // Prepare data for different endpoints
      const basicProfileData = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        gender: formData.gender,
        type_id: tenant?.typeId, // Use existing tenant type
        is_afirmasi: formData.is_afirmasi,
        jurusan: formData.jurusan
      };
      
      // Add password if provided
      if (formData.password) {
        basicProfileData.password = formData.password;
      }
      
      // Step 1: Update main profile
      await tenantService.updateCompleteProfile(basicProfileData);
      setSaveProgress(33);
      
      // Step 2: Update NIM if provided and is student
      const isStudent = tenant?.typeId === 1;
      if (isStudent && formData.nim) {
        await tenantService.updateNIM({
          nim: formData.nim
        });
      }
      setSaveProgress(66);
      
      // Step 3: Update location if provided
      if (formData.home_latitude && formData.home_longitude) {
        await tenantService.updateLocation({
          home_latitude: parseFloat(formData.home_latitude),
          home_longitude: parseFloat(formData.home_longitude)
        });
      }
      setSaveProgress(100);
      
      toast({
        title: 'Profile Updated Successfully! 🎉',
        description: 'All your profile information has been updated.',
        status: 'success',
        duration: 5000,
        isClosable: true
      });
      
      // Refresh tenant data
      await refreshTenant();
      
      // Navigate back to profile page
      setTimeout(() => navigate('/tenant/profile'), 1000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update profile information.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setSaving(false);
      setSaveProgress(0);
    }
  };

  return (
    <TenantLayout>
      <Container maxW="container.lg" py={8}>
        <Button 
          leftIcon={<FaArrowLeft />} 
          mb={6} 
          onClick={() => navigate('/tenant/profile')}
          variant="ghost"
        >
          Back to Profile
        </Button>
        
        <Heading size="xl" mb={6} display="flex" alignItems="center">
          <Icon as={FaUser} mr={3} color="brand.500" />
          Edit Profile
        </Heading>
        
        {loading ? (
          <Flex justify="center" my={10}>
            <Spinner size="xl" color="brand.500" />
          </Flex>
        ) : (
          <form onSubmit={handleSubmit}>
            <Card bg={cardBg} borderColor={borderColor}>
              <CardHeader>
                <HStack justify="space-between">
                  <Text fontSize="lg" fontWeight="bold">
                    Update Your Profile Information
                  </Text>
                  {tenant?.isVerified && (
                    <Badge colorScheme="green" variant="solid">
                      Verified Account
                    </Badge>
                  )}
                </HStack>
                {saving && (
                  <Progress 
                    value={saveProgress} 
                    size="sm" 
                    colorScheme="brand" 
                    mt={4}
                    borderRadius="md"
                  />
                )}
              </CardHeader>
              
              <CardBody>
                <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed">
                  <TabList>
                    <Tab>
                      <Icon as={FaUser} mr={2} />
                      Basic Info
                    </Tab>
                    {(tenant?.typeId === 1) && (
                      <Tab>
                        <Icon as={FaGraduationCap} mr={2} />
                        Academic
                      </Tab>
                    )}
                    <Tab>
                      <Icon as={FaMapMarkerAlt} mr={2} />
                      Location
                    </Tab>
                  </TabList>

                  <TabPanels>
                    {/* Basic Information Tab */}
                    <TabPanel>
                      <VStack spacing={6} align="stretch">
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                          <Box textAlign="center">
                            <Avatar 
                              size="2xl" 
                              name={formData.full_name || tenant?.user?.fullName} 
                              src={tenant?.avatar} 
                              mb={4}
                            />
                            <Text fontSize="sm" color="gray.500">
                              Tenant ID: {tenant?.tenantId}
                            </Text>
                          </Box>
                          
                          <VStack spacing={4} align="stretch">
                            <FormControl isInvalid={errors.full_name} isRequired>
                              <FormLabel>Full Name</FormLabel>
                              <Input 
                                name="full_name" 
                                value={formData.full_name} 
                                onChange={handleChange}
                                placeholder="Enter your full name"
                              />
                              <FormErrorMessage>{errors.full_name}</FormErrorMessage>
                            </FormControl>
                            
                            <FormControl isInvalid={errors.email} isRequired>
                              <FormLabel>Email Address</FormLabel>
                              <Input 
                                name="email" 
                                type="email"
                                value={formData.email} 
                                onChange={handleChange}
                                placeholder="Enter your email"
                              />
                              <FormErrorMessage>{errors.email}</FormErrorMessage>
                            </FormControl>
                          </VStack>
                        </SimpleGrid>
                        
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                          <FormControl isInvalid={errors.phone} isRequired>
                            <FormLabel>Phone Number</FormLabel>
                            <Input 
                              name="phone" 
                              value={formData.phone} 
                              onChange={handleChange}
                              placeholder="e.g., 081234567890"
                            />
                            <FormErrorMessage>{errors.phone}</FormErrorMessage>
                          </FormControl>
                          
                          <FormControl isInvalid={errors.gender} isRequired>
                            <FormLabel>Gender</FormLabel>
                            <Select 
                              name="gender" 
                              value={formData.gender} 
                              onChange={handleChange}
                              placeholder="Select gender"
                            >
                              <option value="L">Male (Laki-laki)</option>
                              <option value="P">Female (Perempuan)</option>
                            </Select>
                            <FormErrorMessage>{errors.gender}</FormErrorMessage>
                          </FormControl>
                        </SimpleGrid>
                        
                        <FormControl isInvalid={errors.address} isRequired>
                          <FormLabel>Address</FormLabel>
                          <Textarea 
                            name="address" 
                            value={formData.address} 
                            onChange={(e) => {
                              handleChange(e);
                              // If user manually changes address, update locationAddress too
                              setLocationAddress(e.target.value);
                            }}
                            placeholder="Enter your complete address"
                            rows={3}
                          />
                          <FormErrorMessage>{errors.address}</FormErrorMessage>
                          <FormHelperText>
                            This address will be used for location searches and can be auto-filled from map selection
                          </FormHelperText>
                        </FormControl>
                        
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                          <FormControl>
                            <FormLabel>Tenant Type</FormLabel>
                            <Box p={3} bg="gray.50" borderRadius="md" border="1px" borderColor="gray.200">
                              <Text fontWeight="medium">
                                {tenant?.typeId === 1 ? 'Student (Mahasiswa)' : 'Non-Student (Non-Mahasiswa)'}
                              </Text>
                              <Text fontSize="xs" color="gray.500" mt={1}>
                                Tenant type cannot be changed after registration
                              </Text>
                            </Box>
                          </FormControl>
                          
                          <FormControl>
                            <FormLabel>Password (Optional)</FormLabel>
                            <Input 
                              name="password" 
                              type="password"
                              value={formData.password} 
                              onChange={handleChange}
                              placeholder="Enter new password (leave blank to keep current)"
                            />
                            <FormHelperText>
                              Leave blank to keep your current password
                            </FormHelperText>
                            <FormErrorMessage>{errors.password}</FormErrorMessage>
                          </FormControl>
                        </SimpleGrid>
                      </VStack>
                    </TabPanel>

                    {/* Academic Information Tab - Only for Students */}
                    {(tenant?.typeId === 1) && (
                      <TabPanel>
                        <VStack spacing={6} align="stretch">
                          <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            Academic information is required for students (mahasiswa)
                          </Alert>
                          
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            <FormControl 
                              isInvalid={errors.nim}
                              isRequired={true}
                            >
                              <FormLabel>NIM (Student ID)</FormLabel>
                              <Input 
                                name="nim" 
                                value={formData.nim} 
                                onChange={handleChange}
                                placeholder="e.g., 2301421047"
                              />
                              <FormErrorMessage>{errors.nim}</FormErrorMessage>
                              <FormHelperText>
                                Required for students
                              </FormHelperText>
                            </FormControl>
                            
                            <FormControl 
                              isInvalid={errors.jurusan}
                              isRequired={true}
                            >
                              <FormLabel>Department (Jurusan)</FormLabel>
                              <Input 
                                name="jurusan" 
                                value={formData.jurusan} 
                                onChange={handleChange}
                                placeholder="e.g., Teknik Sipil"
                              />
                              <FormErrorMessage>{errors.jurusan}</FormErrorMessage>
                              <FormHelperText>
                                Your department/major
                              </FormHelperText>
                            </FormControl>
                          </SimpleGrid>
                          
                          <FormControl>
                            <HStack>
                              <Switch 
                                name="is_afirmasi"
                                isChecked={formData.is_afirmasi} 
                                onChange={handleChange}
                              />
                              <FormLabel mb={0}>Afirmasi Program</FormLabel>
                            </HStack>
                            <FormHelperText>
                              Check if you are part of the affirmative action program
                            </FormHelperText>
                          </FormControl>
                        </VStack>
                      </TabPanel>
                    )}

                    {/* Location Information Tab */}
                    <TabPanel>
                      <VStack spacing={6} align="stretch">
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          Location information helps calculate distance to campus
                        </Alert>
                        
                        {/* Location Address Input */}
                        <FormControl>
                          <FormLabel>Search Address</FormLabel>
                          <HStack>
                            <Input 
                              value={locationAddress}
                              onChange={(e) => setLocationAddress(e.target.value)}
                              placeholder="Enter your address to search (e.g., Tambun Selatan, Bekasi, West Java)"
                            />
                            <Button
                              leftIcon={<FaMapMarkerAlt />}
                              onClick={handleGeocodeAddress}
                              colorScheme="blue"
                              variant="outline"
                              isDisabled={!locationAddress || locationAddress.trim().length < 10}
                            >
                              Search
                            </Button>
                          </HStack>
                          <FormHelperText>
                            Type an address and click Search, or click directly on the map below
                          </FormHelperText>
                        </FormControl>

                        {/* Manual Coordinate Input (Collapsible) */}
                        <Box>
                          <Button
                            leftIcon={showManualInput ? <FaChevronUp /> : <FaChevronDown />}
                            onClick={() => setShowManualInput(!showManualInput)}
                            variant="ghost"
                            size="sm"
                            colorScheme="gray"
                          >
                            {showManualInput ? 'Hide' : 'Show'} Quick Location Options
                          </Button>
                          
                          <Collapse in={showManualInput} animateOpacity>
                            <Box mt={4}>
                              <Button
                                leftIcon={<FaMapMarkerAlt />}
                                onClick={getCurrentLocation}
                                colorScheme="blue"
                                variant="outline"
                                size="sm"
                                width="fit-content"
                              >
                                Use Current Location
                              </Button>
                            </Box>
                          </Collapse>
                        </Box>
                        
                        {formData.home_latitude && formData.home_longitude && (
                          <Alert status="success" borderRadius="md">
                            <AlertIcon />
                            <VStack align="start" spacing={1}>
                              <Text>Location: {parseFloat(formData.home_latitude).toFixed(6)}, {parseFloat(formData.home_longitude).toFixed(6)}</Text>
                              {locationAddress && (
                                <Text fontSize="sm" color="gray.600">Address: {locationAddress}</Text>
                              )}
                            </VStack>
                          </Alert>
                        )}
                        
                        {tenant?.distanceToCampus && (
                          <Box p={4} bg="gray.50" borderRadius="md">
                            <HStack>
                              <Icon as={FaCalculator} color="gray.600" />
                              <Text fontWeight="bold">Current Distance to Campus:</Text>
                              <Badge colorScheme="blue">{tenant.distanceToCampus.toFixed(2)} km</Badge>
                            </HStack>
                          </Box>
                        )}
                        
                        {/* React Leaflet Location Picker */}
                        <Box>
                          <Text fontWeight="semibold" mb={2}>Interactive Map</Text>
                          <Box 
                            border="1px solid" 
                            borderColor={borderColor} 
                            borderRadius="md"
                            overflow="hidden"
                            bg="white"
                            minH="400px"
                          >
                            <LocationPicker 
                              value={locationCoordinates}
                              onChange={handleLocationChange}
                              addressValue={locationAddress}
                              onAddressChange={handleLocationAddressChange}
                              triggerGeocode={triggerGeocode}
                            />
                          </Box>
                        </Box>
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
                
                <Divider my={6} />
                
                <HStack spacing={4} justify="flex-end">
                  <Button
                    onClick={() => navigate('/tenant/profile')}
                    variant="outline"
                    isDisabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    leftIcon={<FaSave />}
                    isLoading={saving}
                    loadingText={`Saving... ${saveProgress}%`}
                  >
                    Save All Changes
                  </Button>
                </HStack>
              </CardBody>
            </Card>
          </form>
        )}
      </Container>
    </TenantLayout>
  );
};

export default EditProfile;
