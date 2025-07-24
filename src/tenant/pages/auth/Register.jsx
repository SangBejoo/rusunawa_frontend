import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Stack,
  Text,
  Select,
  VStack,
  HStack,
  useToast,
  Icon,
  useColorModeValue,
  Divider,
  Card,
  CardBody,
  VisuallyHidden,
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
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Image,
  IconButton,
  Spinner
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon, CheckCircleIcon, SearchIcon, WarningIcon } from '@chakra-ui/icons';
import { FaUser, FaEnvelope, FaLock, FaIdCard, FaMapMarkerAlt, FaPhone, FaSchool, FaTransgender } from 'react-icons/fa';

import tenantAuthService from '../../services/tenantAuthService';
import { 
  validateEmail, 
  validatePassword, 
  validateConfirmPassword, 
  validateName, 
  validatePhone, 
  validateNIM, 
  validateEmailDomain,
  validateNIMFormat,
  validateAcademicEmail 
} from '../../utils/validationUtils';
import LocationPicker from '../../components/map/LocationPicker';
import { useTenantAuth } from '../../context/tenantAuthContext';
import rusunavaLogo from '../../../assets/images/rusunawa-logo.png';

// Common jurusan (major) options
const jurusanOptions = [
  'Teknik Informatika',
  'Sistem Informasi',
  'Teknik Komputer',
  'Teknik Elektro',
  'Teknik Mesin',
  'Teknik Sipil',
  'Teknik Industri',
  'Teknik Kimia',
  'Arsitektur',
  'Manajemen',
  'Akuntansi',
  'Ekonomi',
  'Hukum',
  'Psikologi',
  'Kedokteran',
  'Farmasi',
  'Keperawatan',
  'Pendidikan',
  'Sastra Indonesia',
  'Sastra Inggris',
  'Komunikasi',
  'Desain Grafis',
  'Lainnya'
];

const steps = [
  { title: 'Akun', description: 'Buat akun' },
  { title: 'Data Diri', description: 'Informasi pribadi' },
  { title: 'Lokasi', description: 'Alamat rumah' },
  { title: 'Tinjau', description: 'Selesai' }
];

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });
  const { isAuthenticated } = useTenantAuth();
  
  // If user is already authenticated, redirect to dashboard - but only on successful registration
  useEffect(() => {
    if (isAuthenticated && location.pathname === '/tenant/register') {
      const isFromSuccessfulRegistration = sessionStorage.getItem('just_registered');
      if (isFromSuccessfulRegistration) {
        sessionStorage.removeItem('just_registered');
        navigate('/tenant/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, navigate, location.pathname]);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    gender: '',
    phone: '',
    address: '',
    homeLatitude: null,
    homeLongitude: null,
    nim: '',
    typeId: 1, // Default: mahasiswa
    isAfirmasi: false, // Default: false (regular mahasiswa)
    jurusan: '', // Major/Department
    customJurusan: '', // For custom jurusan input
    isCustomJurusan: false // Track if user selected "Other"
  });
  
  // Add the missing serverError state
  const [serverError, setServerError] = useState('');
    // Form validation state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  
  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Real-time validation states
  const [emailChecking, setEmailChecking] = useState(false);
  const [nimChecking, setNimChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [nimAvailable, setNimAvailable] = useState(null);
  
  // Cache for availability checks to prevent duplicate requests
  const [availabilityCache, setAvailabilityCache] = useState({
    emails: {},
    nims: {}
  });
  
  // Geocoding trigger state
  const [geocodeTrigger, setGeocodeTrigger] = useState(0);
  
  // Ref to access current form data without causing re-renders
  const formDataRef = useRef(formData);
  
  // Update ref whenever formData changes
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
  
  // Colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const labelColor = useColorModeValue('gray.700', 'gray.200');

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

  // Debounced email availability check
  const checkEmailAvailability = useCallback(
    debounce(async (email) => {
      if (!email || !validateEmail(email)) {
        setEmailAvailable(null);
        return;
      }
      
      // Check cache first
      const emailLower = email.toLowerCase();
      if (availabilityCache.emails[emailLower] !== undefined) {
        setEmailAvailable(availabilityCache.emails[emailLower]);
        return;
      }
      
      setEmailChecking(true);
      try {
        const result = await tenantAuthService.checkEmailAvailability(email);
        setEmailAvailable(result.available);
        
        // Cache the result
        setAvailabilityCache(prev => ({
          ...prev,
          emails: { ...prev.emails, [emailLower]: result.available }
        }));
        
        if (!result.available) {
          setErrors(prev => ({ 
            ...prev, 
            email: 'Email sudah terdaftar. Silakan gunakan email lain.' 
          }));
        }
      } catch (error) {
        console.error('Error checking email availability:', error);
        setEmailAvailable(null);
      } finally {
        setEmailChecking(false);
      }
    }, 1200), // Increased delay to 1.2 seconds to reduce API calls
    [debounce, availabilityCache.emails]
  );

  // Debounced NIM availability check
  const checkNIMAvailability = useCallback(
    debounce(async (nim) => {
      if (!nim || formData.typeId !== 1) {
        setNimAvailable(null);
        return;
      }
      
      // Basic format validation first
      const formatError = validateNIMFormat(nim, true);
      if (formatError) {
        setNimAvailable(null);
        return;
      }
      
      // Check cache first
      const nimLower = nim.toLowerCase();
      if (availabilityCache.nims[nimLower] !== undefined) {
        setNimAvailable(availabilityCache.nims[nimLower]);
        return;
      }
      
      setNimChecking(true);
      try {
        const result = await tenantAuthService.checkNIMAvailability(nim);
        setNimAvailable(result.available);
        
        // Cache the result
        setAvailabilityCache(prev => ({
          ...prev,
          nims: { ...prev.nims, [nimLower]: result.available }
        }));
        
        if (!result.available) {
          setErrors(prev => ({ 
            ...prev, 
            nim: 'NIM sudah terdaftar. Silakan periksa kembali NIM Anda.' 
          }));
        }
      } catch (error) {
        console.error('Error checking NIM availability:', error);
        setNimAvailable(null);
      } finally {
        setNimChecking(false);
      }
    }, 1200), // Increased delay to 1.2 seconds to reduce API calls
    [debounce, formData.typeId, availabilityCache.nims]
  );

  // Handle location selection with optional address
  const handleLocationSelect = useCallback((position, address = null) => {
    // Use functional state update to avoid depending on formData
    setFormData(prev => ({
      ...prev,
      homeLatitude: position?.lat || null,
      homeLongitude: position?.lng || null,
      // Only update address if provided from map selection
      ...(address && { address })
    }));
    
    // Clear location errors
    setErrors(prev => ({ ...prev, location: '' }));
    
    // Show success message if address was auto-filled
    if (address) {
      toast({
        title: 'Address Updated',
        description: 'Address has been automatically updated based on your selected coordinates.',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    }
  }, [toast]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
      // Special handling for typeId change
    if (name === 'typeId') {
      const newTypeId = parseInt(value);
      setFormData(prev => ({
        ...prev,
        [name]: newTypeId,
        // Clear student-specific fields when switching to non-student
        ...(newTypeId !== 1 && {
          nim: '',
          isAfirmasi: false,
          jurusan: '',
          customJurusan: '',
          isCustomJurusan: false
        })
      }));
      
      // Clear NIM availability state when switching account types
      setNimAvailable(null);
      setNimChecking(false);
      
      // Clear NIM cache when switching to non-student
      if (newTypeId !== 1) {
        setAvailabilityCache(prev => ({
          ...prev,
          nims: {}
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field when typing
    if(errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear server error when user starts typing
    if (serverError) {
      setServerError('');
    }
    
    // Real-time validation for specific fields
    if (name === 'email' && value) {
      const emailError = validateEmail(value);
      const domainSuggestion = validateEmailDomain(value);
      
      if (emailError) {
        setErrors(prev => ({ ...prev, email: emailError }));
        setEmailAvailable(null);
      } else if (domainSuggestion) {
        setErrors(prev => ({ ...prev, email: domainSuggestion }));
        setEmailAvailable(null);
      } else {
        // Trigger availability check for valid email
        checkEmailAvailability(value);
      }
    }
    
    if (name === 'nim' && value && formData.typeId === 1) {
      const nimError = validateNIMFormat(value, true);
      if (nimError) {
        setErrors(prev => ({ ...prev, nim: nimError }));
        setNimAvailable(null);
      } else {
        // Trigger availability check for valid NIM
        checkNIMAvailability(value);
      }
    }
    
    if (name === 'confirmPassword' && value) {
      const confirmError = validateConfirmPassword(formData.password, value);
      if (confirmError) {
        setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
      }
    }
  };  // Debounce state for address input - REMOVED: Not needed anymore since we use manual geocoding only
  
  // Handle address field changes
  const handleAddressChange = (e) => {
    const address = e.target.value;
    setFormData(prev => ({ ...prev, address }));
    
    // Clear error for address field when typing
    if (errors.address) {
      setErrors(prev => ({ ...prev, address: '' }));
    }
  };

  // Handle Enter key in address field (prevent form submission)
  const handleAddressKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Optionally trigger geocoding here
      handleCheckCoordinates();
    }
  };
  // Handle manual coordinate checking with validation
  const handleCheckCoordinates = useCallback(() => {
    // Get the current address from the ref to avoid dependency issues
    const currentAddress = formDataRef.current.address;
    
    if (!currentAddress || currentAddress.trim().length < 10) {
      toast({
        title: 'Address Too Short',
        description: 'Please enter a more detailed address (at least 10 characters)',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Trigger geocoding by incrementing the trigger counter
    setGeocodeTrigger(prev => prev + 1);
    toast({
      title: 'Checking Coordinates',
      description: 'Looking up coordinates for your address...',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  }, [toast]);

  // Handle address changes from LocationPicker
  const handleAddressChangeFromPicker = useCallback((address) => {
    setFormData(prev => ({ ...prev, address }));
  }, []);

  // Memoize location picker value to prevent unnecessary re-renders
  const locationPickerValue = useMemo(() => ({
    lat: formData.homeLatitude, 
    lng: formData.homeLongitude
  }), [formData.homeLatitude, formData.homeLongitude]);
  
  // Validate current step
  const validateStep = () => {
    const newErrors = {};
    
    switch(activeStep) {
      case 0: // Account
        const emailError = validateEmail(formData.email);
        const passwordError = validatePassword(formData.password);
        const confirmError = validateConfirmPassword(formData.password, formData.confirmPassword);
        
        if (emailError) newErrors.email = emailError;
        if (passwordError) newErrors.password = passwordError;
        if (confirmError) newErrors.confirmPassword = confirmError;
        
        // Additional email domain check
        if (!emailError) {
          const domainSuggestion = validateEmailDomain(formData.email);
          if (domainSuggestion && domainSuggestion.includes('Did you mean')) {
            newErrors.email = domainSuggestion;
          }
        }
        break;
        
      case 1: // Personal
        const nameError = validateName(formData.name);
        const phoneError = validatePhone(formData.phone);
        
        if (nameError) newErrors.name = nameError;
        if (phoneError) newErrors.phone = phoneError;
        if (!formData.gender) newErrors.gender = 'Gender is required';
          // NIM is required only for students
        if (formData.typeId === 1) {
          const nimError = validateNIMFormat(formData.nim, true);
          if (nimError) newErrors.nim = nimError;
          
          // Jurusan is also required for students
          if (!formData.jurusan.trim()) {
            newErrors.jurusan = 'Jurusan (Major/Department) is required for students';
          }
        }
        break;
        
      case 2: // Location
        if (!formData.homeLatitude || !formData.homeLongitude) {
          newErrors.location = 'Please select your home location on the map';
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Move to next step
  const handleNextStep = () => {
    if (validateStep()) {
      setActiveStep(activeStep + 1);
    }
  };

  // Move to previous step
  const handlePrevStep = () => {
    setActiveStep(activeStep - 1);
  };

  // Add the validateForm function if it doesn't exist
  const validateForm = () => {
    const validationErrors = {};
    
    // Email validation
    if (!formData.email) {
      validationErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      validationErrors.email = "Invalid email format";
    }
    
    // Password validation
    if (!formData.password) {
      validationErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      validationErrors.password = "Password must be at least 8 characters";
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      validationErrors.confirmPassword = "Passwords do not match";
    }
    
    // Name validation
    if (!formData.name) {
      validationErrors.name = "Name is required";
    }
    
    // Gender validation
    if (!formData.gender) {
      validationErrors.gender = "Gender is required";
    }
    
    // Type validation
    if (!formData.typeId && !formData.tenantType) {
      validationErrors.typeId = "Tenant type is required";
    }
      // NIM validation for students
    if ((formData.typeId === 1 || formData.tenantType === 'mahasiswa') && !formData.nim) {
      validationErrors.nim = "NIM is required for students";
    }
    
    // Jurusan validation for students
    if ((formData.typeId === 1 || formData.tenantType === 'mahasiswa') && !formData.jurusan.trim()) {
      validationErrors.jurusan = "Jurusan (Major/Department) is required for students";
    }
    
    return validationErrors;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset error state
    setErrors({});
    setServerError('');
    setIsSubmitting(true);
    
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }
    
    try {
      const result = await tenantAuthService.register(formData);
      
      // Check if registration was successful
      if (result.success || 
          (result.status && result.status.status === 'success') || 
          (result.tenant && result.tenant.tenantId)) {
        
        toast({
        title: "Registrasi Berhasil!",
        description: "Silakan cek email kamu untuk kode verifikasi.",
        status: "success",
        duration: 5000,
        isClosable: true,
        });
        
        // IMPORTANT: Immediately redirect to verification page with email pre-filled
        navigate('/tenant/verification-prompt', { 
          state: { 
            email: formData.email,
            fromRegistration: true
          } 
        });
      } else {
        setServerError(result.message || result.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error('Registration error:', err);
      
      // Enhanced error handling for different types of backend errors
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err?.response?.data) {
        const responseData = err.response.data;
        
        // Check for duplicate email error
        if (responseData.message && (
          responseData.message.includes('duplicate key value') ||
          responseData.message.includes('already exists') ||
          responseData.message.toLowerCase().includes('email sudah terdaftar') ||
          responseData.message.toLowerCase().includes('email already registered')
        )) {
          errorMessage = 'Email sudah terdaftar. Silakan gunakan email lain atau login dengan akun yang sudah ada.';
          setErrors(prev => ({ ...prev, email: 'Email ini sudah terdaftar' }));
        }
        // Check for duplicate NIM error - Enhanced detection
        else if (responseData.message && (
          responseData.message.includes('idx_tenants_nim_unique') ||
          responseData.message.includes('duplicate key value violates unique constraint') ||
          (responseData.message.toLowerCase().includes('nim') &&
           (responseData.message.includes('duplicate') || responseData.message.includes('already exists')))
        )) {
          errorMessage = 'NIM sudah terdaftar dalam sistem. Silakan periksa kembali NIM Anda atau hubungi admin jika ini adalah kesalahan.';
          setErrors(prev => ({ ...prev, nim: 'NIM ini sudah terdaftar' }));
          
          // Navigate back to step 1 (Personal info) to fix NIM
          setActiveStep(1);
          toast({
            title: 'NIM Sudah Terdaftar',
            description: 'Silakan periksa kembali NIM Anda pada halaman informasi personal.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        }
        // Check for invalid email format from backend
        else if (responseData.message && responseData.message.toLowerCase().includes('invalid email')) {
          errorMessage = 'Format email tidak valid. Silakan periksa kembali email Anda.';
          setErrors(prev => ({ ...prev, email: 'Format email tidak valid' }));
        }
        // Check for password requirements from backend
        else if (responseData.message && responseData.message.toLowerCase().includes('password')) {
          errorMessage = 'Kata sandi tidak memenuhi persyaratan. Pastikan minimal 8 karakter dengan angka dan karakter khusus.';
          setErrors(prev => ({ ...prev, password: 'Kata sandi tidak memenuhi persyaratan' }));
        }
        // Check for invalid argument error (generic backend validation)
        else if (responseData.message && responseData.message.includes('invalid argument')) {
          errorMessage = 'Data yang dimasukkan tidak valid. Silakan periksa kembali semua informasi Anda.';
        }
        // Generic backend message
        else if (responseData.message) {
          errorMessage = responseData.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Show toast notification
      toast({
        title: 'Registrasi Gagal',
        description: errorMessage,
        status: 'error',
        duration: 6000,
        isClosable: true,
      });
      
      setServerError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render different steps
  const renderStepContent = () => {
    switch(activeStep) {
      case 0: // Account Information
        return (
          <VStack spacing={6} align="stretch">
            <FormControl isInvalid={!!errors.email}>
            <FormLabel htmlFor="email" color={labelColor}>
              <HStack spacing={2}>
                <Icon as={FaEnvelope} />
                <Text>Alamat Email</Text>
              </HStack>
            </FormLabel>
              <InputGroup>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                placeholder="emailkamu@email.com"
                  size="lg"
                />
                <InputRightElement width="4.5rem" h="100%">
                  {emailChecking && <Spinner size="sm" color="blue.500" />}
                  {!emailChecking && emailAvailable === true && (
                    <CheckCircleIcon color="green.500" />
                  )}
                  {!emailChecking && emailAvailable === false && (
                    <WarningIcon color="red.500" />
                  )}
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.email}</FormErrorMessage>
              {!errors.email && emailAvailable === true && (
                <Text fontSize="sm" color="green.600" mt={1}>
                  ✓ Email tersedia
                </Text>
              )}
              {!errors.email && emailAvailable === false && (
                <Text fontSize="sm" color="red.600" mt={1}>
                  ✗ Email sudah digunakan
                </Text>
              )}
              {!errors.email && emailChecking && (
                <Text fontSize="sm" color="blue.600" mt={1}>
                  ⏳ Memeriksa ketersediaan email...
                </Text>
              )}
              <Text fontSize="xs" color="gray.500" mt={1}>
                Gunakan email aktif yang valid. Sistem akan memeriksa ketersediaan email secara otomatis dan mengirim kode verifikasi.
              </Text>
            </FormControl>
            
            <FormControl isInvalid={!!errors.password}>
            <FormLabel htmlFor="password" color={labelColor}>
              <HStack spacing={2}>
                <Icon as={FaLock} />
                <Text>Kata Sandi</Text>
              </HStack>
            </FormLabel>
              <InputGroup>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                placeholder="Buat kata sandi yang kuat"
                  size="lg"
                />
                <InputRightElement width="4.5rem" h="100%">
                  <Button
                    h="1.75rem"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    variant="ghost"
                  >
                    {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                  </Button>
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.password}</FormErrorMessage>
            </FormControl>
            
            <FormControl isInvalid={!!errors.confirmPassword}>
            <FormLabel htmlFor="confirmPassword" color={labelColor}>
              <HStack spacing={2}>
                <Icon as={FaLock} />
                <Text>Konfirmasi Kata Sandi</Text>
              </HStack>
            </FormLabel>
              <InputGroup>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                placeholder="Ulangi kata sandi"
                  size="lg"
                />
                <InputRightElement width="4.5rem" h="100%">
                  <Button
                    h="1.75rem"
                    size="sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    variant="ghost"
                  >
                    {showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                  </Button>
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
            </FormControl>
            
            <FormControl>
            <FormLabel htmlFor="typeId" color={labelColor}>
              <HStack spacing={2}>
                <Icon as={FaUser} />
                <Text>Tipe Akun</Text>
              </HStack>
            </FormLabel>
              <Select
                id="typeId"
                name="typeId"
                value={formData.typeId}
                onChange={handleChange}
                size="lg"
              >
              <option value={1}>Mahasiswa</option>
              <option value={2}>Non-Mahasiswa</option>
              </Select>
            </FormControl>
          </VStack>
        );
        
      case 1: // Personal Information
        return (
          <VStack spacing={6} align="stretch">
            <FormControl isInvalid={!!errors.name}>
            <FormLabel htmlFor="name" color={labelColor}>
              <HStack spacing={2}>
                <Icon as={FaUser} />
                <Text>Nama Lengkap</Text>
              </HStack>
            </FormLabel>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              placeholder="Nama lengkap sesuai KTP/identitas"
                size="lg"
              />
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>
            
            <FormControl isInvalid={!!errors.gender}>
            <FormLabel htmlFor="gender" color={labelColor}>
              <HStack spacing={2}>
                <Icon as={FaTransgender} />
                <Text>Jenis Kelamin</Text>
              </HStack>
            </FormLabel>
              <Select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                placeholder="Pilih jenis kelamin"
                size="lg"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </Select>
              <FormErrorMessage>{errors.gender}</FormErrorMessage>
            </FormControl>
            
            <FormControl isInvalid={!!errors.phone}>
            <FormLabel htmlFor="phone" color={labelColor}>
              <HStack spacing={2}>
                <Icon as={FaPhone} />
                <Text>No. HP</Text>
              </HStack>
            </FormLabel>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              placeholder="Contoh: 08123456789"
                size="lg"
              />
              <FormErrorMessage>{errors.phone}</FormErrorMessage>
            </FormControl>
              {formData.typeId === 1 && (
              <>
                <FormControl isInvalid={!!errors.nim}>
                  <FormLabel htmlFor="nim" color={labelColor}>
                    <HStack spacing={2}>
                      <Icon as={FaIdCard} />
                      <Text>NIM (Nomor Induk Mahasiswa)</Text>
                    </HStack>
                  </FormLabel>
                  <InputGroup>
                    <Input
                      id="nim"
                      name="nim"
                      value={formData.nim}
                      onChange={handleChange}
                      placeholder="Contoh: 2021123456, 2024987654"
                      size="lg"
                    />
                    <InputRightElement width="4.5rem" h="100%">
                      {nimChecking && <Spinner size="sm" color="blue.500" />}
                      {!nimChecking && nimAvailable === true && (
                        <CheckCircleIcon color="green.500" />
                      )}
                      {!nimChecking && nimAvailable === false && (
                        <WarningIcon color="red.500" />
                      )}
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage>{errors.nim}</FormErrorMessage>
                  {!errors.nim && nimAvailable === true && (
                    <Text fontSize="sm" color="green.600" mt={1}>
                      ✓ NIM tersedia
                    </Text>
                  )}
                  {!errors.nim && nimAvailable === false && (
                    <Text fontSize="sm" color="red.600" mt={1}>
                      ✗ NIM sudah digunakan
                    </Text>
                  )}
                  {!errors.nim && nimChecking && (
                    <Text fontSize="sm" color="blue.600" mt={1}>
                      ⏳ Memeriksa ketersediaan NIM...
                    </Text>
                  )}
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Format NIM PNJ: Tahun masuk (2021, 2024, dll) + kode program. Sistem akan memeriksa ketersediaan NIM secara otomatis.
                  </Text>
                </FormControl>                <FormControl isInvalid={!!errors.jurusan}>
                  <FormLabel htmlFor="jurusan" color={labelColor}>
                    <HStack spacing={2}>
                      <Icon as={FaSchool} />
                      <Text>Jurusan</Text>
                    </HStack>
                  </FormLabel>
                  <Select
                    id="jurusan"
                    name="jurusan"
                    value={formData.isCustomJurusan ? 'Lainnya' : formData.jurusan}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'Lainnya') {
                        setFormData(prev => ({
                          ...prev,
                          isCustomJurusan: true,
                          jurusan: ''
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          isCustomJurusan: false,
                          jurusan: value,
                          customJurusan: ''
                        }));
                      }
                    }}
                    placeholder="Pilih jurusan"
                    size="lg"
                  >
                    {jurusanOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                  
                  {/* Custom jurusan input field */}
                  {formData.isCustomJurusan && (
                    <Input
                      mt={2}
                      id="customJurusan"
                      name="customJurusan"
                      type="text"
                      value={formData.customJurusan}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          customJurusan: value,
                          jurusan: value // Update jurusan with custom value
                        }));
                      }}
                      placeholder="Masukkan jurusan"
                      size="lg"
                    />
                  )}
                  
                  <FormErrorMessage>{errors.jurusan}</FormErrorMessage>
                </FormControl>

                <FormControl>
                  <FormLabel color={labelColor}>
                    <HStack spacing={2}>
                      <Icon as={CheckCircleIcon} />
                      <Text>Status Mahasiswa</Text>
                    </HStack>
                  </FormLabel>
                  <Select
                    name="isAfirmasi"
                    value={formData.isAfirmasi}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      isAfirmasi: e.target.value === 'true' 
                    }))}
                    size="lg"
                  >
                    <option value={false}>Mahasiswa Reguler</option>
                    <option value={true}>Mahasiswa Afirmasi</option>
                  </Select>
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    Pilih "Mahasiswa Afirmasi" jika kamu penerima beasiswa atau program afirmasi
                  </Text>
                </FormControl>
              </>
            )}
          </VStack>
        );
        
      case 2: // Location Information
        return (
          <VStack spacing={6} align="stretch">
            <FormControl isInvalid={!!errors.location}>
            <FormLabel color={labelColor}>
              <HStack spacing={2}>
                <Icon as={FaMapMarkerAlt} />
                <Text>Lokasi Rumah</Text>
              </HStack>
            </FormLabel>
            <Text fontSize="sm" color="gray.600" mb={2}>
              Klik pada peta untuk memilih lokasi rumah kamu
            </Text>              <LocationPicker
                value={locationPickerValue}
                onChange={handleLocationSelect}
                addressValue={formData.address}
                onAddressChange={handleAddressChangeFromPicker}
                triggerGeocode={geocodeTrigger}
              />
              <FormErrorMessage>{errors.location}</FormErrorMessage>
            </FormControl>            <FormControl>
            <FormLabel htmlFor="address" color={labelColor}>Alamat Lengkap</FormLabel>
            <Text fontSize="sm" color="gray.600" mb={2}>
              Ketik alamat lengkap atau klik pada peta untuk mengisi otomatis
            </Text>
              <HStack spacing={2}>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleAddressChange}
                  onKeyDown={handleAddressKeyDown}
                  placeholder="Masukkan alamat lengkap (cth: Jl. Raya Tambun, Tambun Selatan, Bekasi)"
                  size="lg"
                  flex={1}
                />
                <IconButton
                  aria-label="Check coordinates for address"
                  icon={<SearchIcon />}
                  onClick={handleCheckCoordinates}
                  colorScheme="blue"
                  variant="outline"
                  size="lg"
                  isDisabled={!formData.address || formData.address.trim().length < 10}
                  title="Klik untuk mencari koordinat dari alamat"
                />
              </HStack>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Tekan Enter atau klik tombol cari untuk menemukan koordinat dari alamat kamu. Sertakan nama kota/kecamatan untuk hasil terbaik (cth: "Tambun Selatan, Bekasi").
              </Text>
            </FormControl>
          </VStack>
        );
        
      case 3: // Review & Complete
        return registrationComplete ? (
          <VStack spacing={6} align="center">
            <Icon as={CheckCircleIcon} w={20} h={20} color="green.500" />
            <Heading size="lg" textAlign="center">
              Registrasi Selesai!
            </Heading>
            <Text textAlign="center">
              Terima kasih telah mendaftar di Rusunawa PNJ. Silakan cek email kamu untuk instruksi verifikasi.
            </Text>
            <Button 
              as={RouterLink} 
              to="/tenant/login"
              colorScheme="brand" 
              size="lg" 
              width="100%"
            >
              Masuk ke Akun
            </Button>
          </VStack>
        ) : (
          <VStack spacing={6} align="stretch">
            <Heading size="md" mb={2}>
              Tinjau Data Anda
            </Heading>
            
            <Card variant="outline">
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontWeight="bold">Detail Akun</Text>
                    <Text>Email: {formData.email}</Text>
                    <Text>Tipe Akun: {formData.typeId === 1 ? 'Mahasiswa' : 'Non-Mahasiswa'}</Text>
                  </Box>
                  
                  <Divider />
                    <Box>
                    <Text fontWeight="bold">Data Diri</Text>
                    <Text>Nama: {formData.name}</Text>
                    <Text>Jenis Kelamin: {formData.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</Text>
                    <Text>No. HP: {formData.phone}</Text>
                    {formData.typeId === 1 && (
                      <>
                        <Text>NIM: {formData.nim}</Text>
                        <Text>Jurusan: {formData.jurusan}</Text>
                        <Text>Status: {formData.isAfirmasi ? 'Mahasiswa Afirmasi' : 'Mahasiswa Reguler'}</Text>
                      </>
                    )}
                  </Box>
                  
                  <Divider />
                  
                  <Box>
                    <Text fontWeight="bold">Lokasi</Text>
                    <Text>Koordinat: {formData.homeLatitude?.toFixed(6)}, {formData.homeLongitude?.toFixed(6)}</Text>
                    <Text>Alamat: {formData.address || '(Otomatis dari koordinat)'}</Text>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
            
            <Alert status="info">
              <AlertIcon />
              Dengan mendaftar, kamu menyetujui Syarat & Ketentuan serta Kebijakan Privasi kami.
            </Alert>
          </VStack>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.800')}>
      <Container maxW="container.xl" py={10}>
        <Stack direction={{ base: 'column', md: 'row' }} spacing={8} align="flex-start">
          {/* Left side - Image and info */}
          <Box display={{ base: 'none', md: 'block' }} flexBasis={{ md: '40%', lg: '50%' }}>
            <VStack align="start" spacing={6}>              <Image 
                src={rusunavaLogo} 
                alt="Rusunawa PNJ Logo" 
                borderRadius="md" 
                boxShadow="md"
                objectFit="contain"
                height="300px"
                width="100%"
                fallbackSrc={rusunavaLogo}
              />
              <Heading as="h2" size="lg">
                Daftar Rusunawa PNJ
              </Heading>
              <Text fontSize="md">
                Daftar sekarang untuk memesan hunian terbaik di Rusunawa Politeknik Negeri Jakarta. Nikmati kamar nyaman, fasilitas lengkap, dan komunitas yang suportif.
              </Text>
              <VStack align="start" spacing={3} mt={4}>
                <HStack>
                  <CheckCircleIcon color="green.500" />
                  <Text>Hunian ramah mahasiswa & terverifikasi</Text>
                </HStack>
                <HStack>
                  <CheckCircleIcon color="green.500" />
                  <Text>Pembayaran aman & mudah</Text>
                </HStack>
                <HStack>
                  <CheckCircleIcon color="green.500" />
                  <Text>Dukungan & keamanan 24 jam</Text>
                </HStack>
                <HStack>
                  <CheckCircleIcon color="green.500" />
                  <Text>Lokasi strategis dekat fasilitas kampus</Text>
                </HStack>
              </VStack>
            </VStack>
          </Box>
          
          {/* Right side - Registration form */}
          <Box 
            flexBasis={{ base: '100%', md: '60%', lg: '50%' }}
            bg={cardBg}
            p={8}
            borderRadius="lg"
            boxShadow="md"
            as="form"
            onSubmit={handleSubmit}
          >
            <VStack spacing={8} align="stretch">
              <Box>
                <Heading textAlign="center" mb={2}>Registrasi</Heading>
                <Text textAlign="center" color="gray.500">
                  Buat akun Rusunawa PNJ kamu
                </Text>
              </Box>
              
              {/* Stepper */}
              <Stepper index={activeStep} colorScheme="brand" mb={8}>
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
              
              {/* Server Error Alert */}
              {serverError && (
                <Alert status="error" borderRadius="md" mb={4}>
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Kesalahan Registrasi!</AlertTitle>
                    <AlertDescription>
                      {serverError}
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
              
              {/* Step content */}
              {renderStepContent()}
              
              {/* Navigation buttons */}
              <HStack justifyContent={activeStep > 0 ? 'space-between' : 'flex-end'} mt={4}>
                {activeStep > 0 && (
                    <Button 
                      onClick={handlePrevStep}
                      variant="outline"
                      colorScheme="brand"
                      isDisabled={isSubmitting}
                    >
                      Kembali
                    </Button>
                )}
                {activeStep < steps.length - 1 ? (
                    <Button 
                      onClick={handleNextStep}
                      colorScheme="brand"
                    >
                      Selanjutnya
                    </Button>
                ) : !registrationComplete && (
                  <Button 
                    type="submit"
                    colorScheme="brand"
                    isLoading={isSubmitting}
                    loadingText="Mengirim..."
                  >
                    Daftar
                  </Button>
                )}
              </HStack>
              
              {/* Sign in link */}
              {!registrationComplete && (
                <Text mt={4} textAlign="center">
                  Sudah punya akun?{' '}
                  <Link as={RouterLink} to="/tenant/login" color="brand.500" fontWeight="semibold">
                    Masuk
                  </Link>
                </Text>
              )}
            </VStack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default Register;
