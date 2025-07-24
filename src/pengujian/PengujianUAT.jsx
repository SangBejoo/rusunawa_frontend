import React, { useState, useRef } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Flex,
  Spacer,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiDownload, FiCheckCircle, FiAlertCircle, FiFileText } from 'react-icons/fi';

// Import sections
import RespondenInfo from './sections/RespondenInfo';
import AuthenticationSection from './sections/AuthenticationSection';
import DashboardSection from './sections/DashboardSection';
import UserManagementSection from './sections/UserManagementSection';
import RoomManagementSection from './sections/RoomManagementSection';
import BookingManagementSection from './sections/BookingManagementSection';
import DocumentManagementSection from './sections/DocumentManagementSection';
import PaymentManagementSection from './sections/PaymentManagementSection';
import IssueManagementSection from './sections/IssueManagementSection';
import NotificationSection from './sections/NotificationSection';
import OverallEvaluationSection from './sections/OverallEvaluationSection';
import TechnicalIssuesSection from './sections/TechnicalIssuesSection';

// Import PDF export utility
import { exportToHTML } from './utils/pdfExporter';

const PengujianUAT = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const toast = useToast();
  const formRef = useRef();

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Define all sections
  const sections = [
    {
      id: 'responden',
      title: 'Informasi Responden',
      component: RespondenInfo,
      required: true,
      icon: FiFileText
    },
    {
      id: 'authentication',
      title: 'Authentication & Authorization',
      component: AuthenticationSection,
      required: true,
      icon: FiCheckCircle
    },
    {
      id: 'dashboard',
      title: 'Dashboard & Navigation',
      component: DashboardSection,
      required: true,
      icon: FiFileText
    },
    {
      id: 'user_management',
      title: 'User Management',
      component: UserManagementSection,
      required: true,
      icon: FiFileText
    },
    {
      id: 'room_management',
      title: 'Room Management',
      component: RoomManagementSection,
      required: true,
      icon: FiFileText
    },
    {
      id: 'booking_management',
      title: 'Booking Management',
      component: BookingManagementSection,
      required: true,
      icon: FiFileText
    },
    {
      id: 'document_management',
      title: 'Document Management',
      component: DocumentManagementSection,
      required: true,
      icon: FiFileText
    },
    {
      id: 'payment_management',
      title: 'Payment Management',
      component: PaymentManagementSection,
      required: true,
      icon: FiFileText
    },
    {
      id: 'issue_management',
      title: 'Issue Management',
      component: IssueManagementSection,
      required: true,
      icon: FiFileText
    },
    {
      id: 'notification',
      title: 'Notification System',
      component: NotificationSection,
      required: true,
      icon: FiFileText
    },
    {
      id: 'overall_evaluation',
      title: 'Overall System Evaluation',
      component: OverallEvaluationSection,
      required: true,
      icon: FiFileText
    },
    {
      id: 'technical_issues',
      title: 'Technical Issues',
      component: TechnicalIssuesSection,
      required: false,
      icon: FiAlertCircle
    }
  ];

  const currentSectionData = sections[currentSection];
  const CurrentComponent = currentSectionData.component;

  // Calculate progress
  const progress = ((currentSection + 1) / sections.length) * 100;

  const updateFormData = (sectionId, data) => {
    setFormData(prev => ({
      ...prev,
      [sectionId]: data
    }));
  };

  const validateCurrentSection = () => {
    const sectionId = currentSectionData.id;
    const sectionData = formData[sectionId] || {};
    
    // Basic validation - check if required fields are filled
    if (currentSectionData.required) {
      const hasData = Object.keys(sectionData).length > 0;
      if (!hasData) {
        setValidationErrors({
          [sectionId]: 'Section ini wajib diisi'
        });
        return false;
      }
    }
    
    setValidationErrors({});
    return true;
  };

  const handleNext = () => {
    if (validateCurrentSection()) {
      if (currentSection < sections.length - 1) {
        setCurrentSection(currentSection + 1);
      }
    } else {
      toast({
        title: 'Validasi Error',
        description: 'Mohon lengkapi section ini sebelum melanjutkan',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      
      // Validate all required sections
      let hasErrors = false;
      const errors = {};
      
      sections.forEach(section => {
        if (section.required && (!formData[section.id] || Object.keys(formData[section.id]).length === 0)) {
          errors[section.id] = 'Section wajib belum diisi';
          hasErrors = true;
        }
      });
      
      if (hasErrors) {
        setValidationErrors(errors);
        toast({
          title: 'Form Belum Lengkap',
          description: 'Mohon lengkapi semua section yang wajib diisi',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Export to HTML instead of PDF
      await exportToHTML(formData, sections);
      
      toast({
        title: 'Export Berhasil',
        description: 'Hasil pengujian UAT berhasil diekspor ke HTML',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Gagal',
        description: 'Terjadi kesalahan saat mengekspor HTML',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getSectionStatus = (index) => {
    const section = sections[index];
    const hasData = formData[section.id] && Object.keys(formData[section.id]).length > 0;
    const hasError = validationErrors[section.id];
    
    if (hasError) return 'error';
    if (hasData) return 'completed';
    if (index === currentSection) return 'current';
    return 'pending';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'current': return 'blue';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="6xl">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Card bg={cardBg} shadow="lg" borderColor={borderColor}>
            <CardHeader>
              <VStack spacing={4} align="stretch">
                <Heading size="lg" color="brand.600" textAlign="center">
                  User Acceptance Testing (UAT) - Admin/User POV
                </Heading>
                <Text textAlign="center" color="gray.600">
                  Sistem Manajemen Rusunawa - Pengujian Komprehensif
                </Text>
                
                {/* Progress Bar */}
                <Box>
                  <Flex justify="space-between" mb={2}>
                    <Text fontSize="sm" fontWeight="medium">
                      Section {currentSection + 1} of {sections.length}
                    </Text>
                    <Text fontSize="sm" color="brand.600" fontWeight="medium">
                      {Math.round(progress)}% Complete
                    </Text>
                  </Flex>
                  <Progress 
                    value={progress} 
                    colorScheme="brand" 
                    size="lg" 
                    borderRadius="full"
                    bg="gray.100"
                  />
                </Box>
              </VStack>
            </CardHeader>
          </Card>

          {/* Section Navigation */}
          <Card bg={cardBg} shadow="md" borderColor={borderColor}>
            <CardBody>
              <Flex flexWrap="wrap" gap={2}>
                {sections.map((section, index) => {
                  const status = getSectionStatus(index);
                  const color = getStatusColor(status);
                  
                  return (
                    <Badge
                      key={section.id}
                      variant={index === currentSection ? 'solid' : 'outline'}
                      colorScheme={color}
                      px={3}
                      py={1}
                      borderRadius="full"
                      cursor="pointer"
                      onClick={() => setCurrentSection(index)}
                      _hover={{ transform: 'scale(1.05)' }}
                      transition="all 0.2s"
                    >
                      <HStack spacing={1}>
                        <Icon as={section.icon} w={3} h={3} />
                        <Text fontSize="xs" fontWeight="medium">
                          {index + 1}. {section.title}
                        </Text>
                      </HStack>
                    </Badge>
                  );
                })}
              </Flex>
            </CardBody>
          </Card>

          {/* Validation Errors */}
          {validationErrors[currentSectionData.id] && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>
                {validationErrors[currentSectionData.id]}
              </AlertDescription>
            </Alert>
          )}

          {/* Current Section */}
          <Card bg={cardBg} shadow="lg" borderColor={borderColor} ref={formRef}>
            <CardHeader>
              <HStack>
                <Icon as={currentSectionData.icon} w={6} h={6} color="brand.500" />
                <VStack align="start" spacing={0}>
                  <Heading size="md" color="brand.600">
                    Section {currentSection + 1}: {currentSectionData.title}
                  </Heading>
                  {currentSectionData.required && (
                    <Badge colorScheme="red" size="sm">Required</Badge>
                  )}
                </VStack>
              </HStack>
            </CardHeader>
            
            <CardBody pt={0}>
              <CurrentComponent
                data={formData[currentSectionData.id] || {}}
                onChange={(data) => updateFormData(currentSectionData.id, data)}
              />
            </CardBody>
          </Card>

          {/* Navigation Buttons */}
          <Card bg={cardBg} shadow="md" borderColor={borderColor}>
            <CardBody>
              <Flex>
                <Button
                  onClick={handlePrevious}
                  disabled={currentSection === 0}
                  variant="outline"
                  colorScheme="brand"
                >
                  Previous
                </Button>
                
                <Spacer />
                
                <HStack spacing={4}>
                  {currentSection === sections.length - 1 ? (
                    <Button
                      onClick={handleExportPDF}
                      colorScheme="green"
                      size="lg"
                      leftIcon={<FiDownload />}
                      isLoading={isExporting}
                      loadingText="Exporting..."
                    >
                      Export to PDF
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      colorScheme="brand"
                      size="lg"
                    >
                      Next Section
                    </Button>
                  )}
                </HStack>
              </Flex>
            </CardBody>
          </Card>

          {/* Summary Card */}
          <Card bg={cardBg} shadow="md" borderColor={borderColor}>
            <CardBody>
              <VStack spacing={4}>
                <Heading size="sm" color="gray.600">
                  Progress Summary
                </Heading>
                
                <HStack spacing={8} justify="center">
                  <VStack>
                    <Text fontSize="2xl" fontWeight="bold" color="green.500">
                      {sections.filter((_, index) => getSectionStatus(index) === 'completed').length}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Completed</Text>
                  </VStack>
                  
                  <VStack>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                      1
                    </Text>
                    <Text fontSize="sm" color="gray.600">Current</Text>
                  </VStack>
                  
                  <VStack>
                    <Text fontSize="2xl" fontWeight="bold" color="gray.500">
                      {sections.filter((_, index) => getSectionStatus(index) === 'pending').length}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Remaining</Text>
                  </VStack>
                  
                  {sections.filter((_, index) => getSectionStatus(index) === 'error').length > 0 && (
                    <VStack>
                      <Text fontSize="2xl" fontWeight="bold" color="red.500">
                        {sections.filter((_, index) => getSectionStatus(index) === 'error').length}
                      </Text>
                      <Text fontSize="sm" color="gray.600">Errors</Text>
                    </VStack>
                  )}
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default PengujianUAT;
