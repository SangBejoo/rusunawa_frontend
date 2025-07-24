import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Divider,
  Avatar,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Badge,
  useColorModeValue,
  Grid,
  GridItem,
  SimpleGrid,
  Skeleton,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Icon,
  Progress,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { 
  FaUser, 
  FaIdCard, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaEnvelope, 
  FaTransgenderAlt,
  FaEdit,
  FaFileAlt,
  FaUpload,
  FaBookmark,
} from 'react-icons/fa';

import TenantLayout from '../../components/layout/TenantLayout';
import DocumentCard from '../../components/document/DocumentCard';
import { useTenantAuth } from '../../context/tenantAuthContext';
import documentService from '../../services/documentService';

// Define color mode values at the top level
const useCardBg = () => useColorModeValue('white', 'gray.700');
const useBorderColor = () => useColorModeValue('gray.200', 'gray.600');
const useLabelColor = () => useColorModeValue('gray.600', 'gray.400');
const useTextColor = () => useColorModeValue('gray.800', 'white');
const useHighlightColor = () => useColorModeValue('brand.50', 'brand.900');
const useFooterBg = () => useColorModeValue('gray.50', 'gray.700'); // Add this new hook function

const Profile = () => {
  const { tenant } = useTenantAuth();
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState(null);
  
  const toast = useToast();
  
  // Document upload modal states - moved to top level
  const { isOpen: isUploadOpen, onOpen: onUploadOpen, onClose: onUploadClose } = useDisclosure();
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Use color hooks at the top level (not conditionally)
  const cardBg = useCardBg();
  const borderColor = useBorderColor();
  const labelColor = useLabelColor();
  const textColor = useTextColor();
  const highlightColor = useHighlightColor();
  const footerBg = useFooterBg(); // Add this new line to use the hook
  
  // Fetch tenant documents
  const fetchDocuments = async () => {
    setDocumentsLoading(true);
    try {
      const response = await documentService.getTenantDocuments();
      setDocuments(response.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocumentsError('Failed to load documents');
    } finally {
      setDocumentsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDocuments();
  }, []);
  
  // Document verification status
  const getDocumentVerificationStatus = () => {
    if (!documents || documents.length === 0) {
      return { status: 'missing', text: 'Missing Documents', color: 'red' };
    }
    
    const allApproved = documents.every(doc => doc.status === 'approved');
    const anyRejected = documents.some(doc => doc.status === 'rejected');
    
    if (allApproved) {
      return { status: 'verified', text: 'Verified', color: 'green' };
    } else if (anyRejected) {
      return { status: 'rejected', text: 'Documents Rejected', color: 'red' };
    } else {
      return { status: 'pending', text: 'Pending Verification', color: 'yellow' };
    }
  };
  
  const docStatus = getDocumentVerificationStatus();
  const requiredDocTypes = ['ktp', 'surat_perjanjian'];
  const submittedDocTypes = documents.map(doc => doc.documentType?.name);
  const missingDocTypes = requiredDocTypes.filter(type => !submittedDocTypes.includes(type));
  
  // Calculate verification progress percentage
  const getVerificationProgress = () => {
    if (!documents || documents.length === 0) return 0;
    
    const approvedDocs = documents.filter(doc => doc.status === 'approved').length;
    return (approvedDocs / documents.length) * 100;
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload only JPEG, PNG, or PDF files',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      if (file.size > maxSize) {
        toast({
          title: 'File Too Large',
          description: 'File size must be less than 5MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setSelectedFile(file);
    }
  };
  const handleUploadDocument = async () => {
    if (!selectedFile || !documentType) {
      toast({
        title: 'Missing Information',
        description: 'Please select a file and document type',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64
      const base64Content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          // Remove the data:image/jpeg;base64, prefix
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // Map document type to docTypeId
      const docTypeMapping = {
        'ktp': 1,
        'surat_perjanjian': 2,
        'kk': 3,
        'student_id': 4,
        'passport': 5,
        'other': 6
      };      const documentData = {
        docTypeId: docTypeMapping[documentType] || 1,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        content: base64Content,
        description: documentDescription || '',
        isImage: selectedFile.type.startsWith('image/')
      };

      await documentService.uploadDocument(documentData);
      
      toast({
        title: 'Document Uploaded',
        description: 'Your document has been uploaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form and close modal
      setSelectedFile(null);
      setDocumentType('');
      setDocumentDescription('');
      onUploadClose();
      
      // Refresh documents list
      await fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload document',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  };
  
  // If tenant data is not available yet, show loading skeleton
  if (!tenant) {
    return (
      <TenantLayout>
        <Container maxW="container.lg" py={8}>
          <VStack spacing={8} align="stretch">
            <Skeleton height="200px" borderRadius="lg" />
            <Skeleton height="400px" borderRadius="lg" />
          </VStack>
        </Container>
      </TenantLayout>    );
  }

  return (
    <TenantLayout>
      <Container maxW="container.lg" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Profile Header Card */}
          <Card bg={cardBg} boxShadow="md" overflow="hidden">
            <Box 
              bg="brand.500" 
              h="80px" 
              position="relative"
            />
            <CardBody position="relative" pt="60px">
              <Avatar
                size="xl"
                name={tenant.user?.fullName || tenant.name}
                src={tenant.photoUrl}
                position="absolute"
                top="-30px"
                left={{base: '50%', md: '24px'}}
                transform={{base: 'translateX(-50%)', md: 'none'}}
                bg="brand.500"
                color="white"
                border="4px solid white"
              />
              
              <Grid templateColumns={{base: '1fr', md: '1fr auto'}} gap={6} pt={{base: 6, md: 0}}>
                <GridItem>
                  <VStack align={{base: 'center', md: 'flex-start'}} spacing={2}>
                    <Heading size="lg">{tenant.user?.fullName || tenant.name}</Heading>
                    <HStack>
                      <Badge 
                        colorScheme={tenant.tenantType?.name === 'mahasiswa' ? 'blue' : 'purple'}
                      >
                        {tenant.tenantType?.name === 'mahasiswa' ? 'Student' : 'Non-Student'}
                      </Badge>
                      <Badge colorScheme={docStatus.color}>{docStatus.text}</Badge>
                    </HStack>
                    
                    <Text color={labelColor}>
                      Member since {new Date(tenant.createdAt).toLocaleDateString()}
                    </Text>
                  </VStack>
                </GridItem>
                
                <GridItem>
                  <VStack spacing={4} align={{base: 'center', md: 'flex-end'}}>
                    <Button
                      as={RouterLink}
                      to="/tenant/profile/edit"
                      leftIcon={<FaEdit />}
                      colorScheme="brand"
                    >
                      Edit Profile
                    </Button>
                  </VStack>
                </GridItem>
              </Grid>
            </CardBody>
          </Card>
          
          {/* Main Content */}
          <Tabs colorScheme="brand" variant="enclosed" isLazy>
            <TabList>
              <Tab fontWeight="semibold">Personal Info</Tab>
              <Tab fontWeight="semibold">Documents</Tab>
              <Tab fontWeight="semibold">Settings</Tab>
            </TabList>
            
            <TabPanels>
              {/* Personal Info Tab */}
              <TabPanel p={0} pt={6}>
                <Card bg={cardBg} boxShadow="md">
                  <CardHeader>
                    <Heading size="md">Personal Information</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{base: 1, md: 2}} spacing={6}>
                      <Box>
                        <HStack spacing={4} mb={4}>
                          <Icon as={FaUser} color="brand.500" />
                          <Text fontWeight="medium">Full Name</Text>
                        </HStack>
                        <Text>{tenant.user?.fullName || tenant.name}</Text>
                      </Box>
                      
                      <Box>
                        <HStack spacing={4} mb={4}>
                          <Icon as={FaEnvelope} color="brand.500" />
                          <Text fontWeight="medium">Email Address</Text>
                        </HStack>
                        <Text>{tenant.user?.email || tenant.email}</Text>
                      </Box>
                      
                      <Box>
                        <HStack spacing={4} mb={4}>
                          <Icon as={FaPhone} color="brand.500" />
                          <Text fontWeight="medium">Phone Number</Text>
                        </HStack>
                        <Text>{tenant.phone || 'Not provided'}</Text>
                      </Box>
                      
                      <Box>
                        <HStack spacing={4} mb={4}>
                          <Icon as={FaTransgenderAlt} color="brand.500" />
                          <Text fontWeight="medium">Gender</Text>
                        </HStack>
                        <Text>{tenant.gender === 'L' ? 'Male' : tenant.gender === 'P' ? 'Female' : 'Not provided'}</Text>
                      </Box>
                      
                      <Box>
                        <HStack spacing={4} mb={4}>
                          <Icon as={FaIdCard} color="brand.500" />
                          <Text fontWeight="medium">Tenant Type</Text>
                        </HStack>
                        <Badge 
                          colorScheme={tenant.tenantType?.name === 'mahasiswa' ? 'blue' : 'purple'}
                          variant="solid"
                        >
                          {tenant.tenantType?.name === 'mahasiswa' ? 'Student (Mahasiswa)' : 'Non-Student (Non-Mahasiswa)'}
                        </Badge>
                      </Box>
                      
                      {/* Student ID - Only for Students */}
                      {tenant.tenantType?.name === 'mahasiswa' && (
                        <Box>
                          <HStack spacing={4} mb={4}>
                            <Icon as={FaIdCard} color="brand.500" />
                            <Text fontWeight="medium">Student ID (NIM)</Text>
                          </HStack>
                          <Text>{tenant.nim || 'Not provided'}</Text>
                        </Box>
                      )}
                      
                      {/* Department - Show for all, but indicate if applicable */}
                      <Box>
                        <HStack spacing={4} mb={4}>
                          <Icon as={FaBookmark} color="brand.500" />
                          <Text fontWeight="medium">Department (Jurusan)</Text>
                        </HStack>
                        <HStack>
                          <Text>
                            {tenant.jurusan || 'Not provided'}
                          </Text>
                          {tenant.tenantType?.name !== 'mahasiswa' && tenant.jurusan && (
                            <Badge size="sm" colorScheme="blue" variant="outline">
                              Former/Alumni
                            </Badge>
                          )}
                        </HStack>
                      </Box>
                      
                      {/* Affirmative Action Status - Show for all */}
                      <Box>
                        <HStack spacing={4} mb={4}>
                          <Icon as={FaUser} color="brand.500" />
                          <Text fontWeight="medium">Affirmative Action Status</Text>
                        </HStack>
                        <VStack align="start" spacing={2}>
                          <HStack>
                            <Badge 
                              colorScheme={tenant.isAfirmasi ? 'green' : 'gray'}
                              variant={tenant.isAfirmasi ? 'solid' : 'outline'}
                            >
                              {tenant.isAfirmasi ? 'Afirmasi Program' : 'Regular Program'}
                            </Badge>
                            {tenant.tenantType?.name !== 'mahasiswa' && tenant.isAfirmasi && (
                              <Badge size="sm" colorScheme="orange" variant="outline">
                                Historical
                              </Badge>
                            )}
                          </HStack>
                          {tenant.isAfirmasi && (
                            <Text fontSize="sm" color="green.600">
                              ✓ {tenant.tenantType?.name === 'mahasiswa' ? 'Eligible for' : 'Previously eligible for'} affirmative action benefits
                            </Text>
                          )}
                        </VStack>
                      </Box>
                      
                      {/* Location Information - Show distance if available */}
                      {(tenant.homeLatitude && tenant.homeLongitude && tenant.distanceToCampus) && (
                        <Box>
                          <HStack spacing={4} mb={4}>
                            <Icon as={FaMapMarkerAlt} color="brand.500" />
                            <Text fontWeight="medium">Distance to Campus</Text>
                          </HStack>
                          <HStack>
                            <Badge colorScheme="blue" variant="solid">
                              {tenant.distanceToCampus.toFixed(2)} km
                            </Badge>
                            <Text fontSize="sm" color="gray.600">
                              from your home location
                            </Text>
                          </HStack>
                        </Box>
                      )}
                      
                      {/* Home Address */}
                      <Box>
                        <HStack spacing={4} mb={4}>
                          <Icon as={FaMapMarkerAlt} color="brand.500" />
                          <Text fontWeight="medium">Home Address</Text>
                        </HStack>
                        <Text>{tenant.address || 'Not provided'}</Text>
                        {(tenant.homeLatitude && tenant.homeLongitude) && (
                          <Text fontSize="sm" color="gray.500" mt={1}>
                            Coordinates: {tenant.homeLatitude.toFixed(6)}, {tenant.homeLongitude.toFixed(6)}
                          </Text>
                        )}
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </Card>
              </TabPanel>
              
              {/* Documents Tab */}
              <TabPanel p={0} pt={6}>
                <Card bg={cardBg} boxShadow="md">
                  <CardHeader>
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Heading size="md">Verification Documents</Heading>
                        <Text color={labelColor}>Upload your identity verification documents</Text>
                      </VStack>                      <Button
                        leftIcon={<FaUpload />}
                        colorScheme="brand"
                        size={{base: 'sm', md: 'md'}}
                        onClick={onUploadOpen}
                      >
                        Upload Document
                      </Button>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={6} align="stretch">
                      {/* Verification Status */}
                      <Box 
                        bg={highlightColor} 
                        p={4} 
                        borderRadius="md"
                      >
                        <HStack justify="space-between" mb={2}>
                          <Text fontWeight="medium">Verification Status</Text>
                          <Badge colorScheme={docStatus.color} fontSize="sm">
                            {docStatus.text}
                          </Badge>
                        </HStack>
                        <Progress 
                          value={getVerificationProgress()} 
                          colorScheme={docStatus.color} 
                          size="sm" 
                          borderRadius="full" 
                        />
                        
                        {missingDocTypes.length > 0 && (
                          <Text fontSize="sm" color={labelColor} mt={2}>
                            Missing documents: {missingDocTypes.join(', ')}
                          </Text>
                        )}
                      </Box>
                      
                      {/* Documents List */}
                      {documentsLoading ? (
                        <SimpleGrid columns={{base: 1, md: 2}} spacing={6}>
                          <Skeleton height="100px" />
                          <Skeleton height="100px" />
                        </SimpleGrid>
                      ) : documentsError ? (
                        <Text color="red.500">{documentsError}</Text>
                      ) : documents.length === 0 ? (
                        <Box textAlign="center" py={8}>
                          <Icon as={FaFileAlt} boxSize={10} color="gray.400" />
                          <Text mt={2} fontSize="lg">No documents uploaded yet</Text>
                          <Text color={labelColor}>
                            Please upload your verification documents to complete your profile
                          </Text>                          <Button
                            mt={4}
                            colorScheme="brand"
                            leftIcon={<FaUpload />}
                            onClick={onUploadOpen}
                          >
                            Upload Documents
                          </Button>
                        </Box>
                      ) : (
                        <SimpleGrid columns={{base: 1, md: 2, lg: 3}} spacing={6}>
                          {documents.map(doc => (
                            <DocumentCard
                              key={doc.docId}
                              document={doc}
                              showStatus
                            />
                          ))}
                        </SimpleGrid>
                      )}
                    </VStack>
                  </CardBody>
                  <CardFooter bg={footerBg} borderTop="1px" borderColor={borderColor}>
                    <Button
                      as={RouterLink}
                      to="/tenant/documents"
                      leftIcon={<FaBookmark />}
                      width="100%"
                      variant="ghost"
                      colorScheme="brand"
                    >
                      View All Documents
                    </Button>
                  </CardFooter>
                </Card>
              </TabPanel>
              
              {/* Settings Tab */}
              <TabPanel p={0} pt={6}>
                <Card bg={cardBg} boxShadow="md">
                  <CardHeader>
                    <Heading size="md">Account Settings</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={6} align="stretch">
                      <Text>Account settings will be available soon.</Text>
                    </VStack>
                  </CardBody>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>

      {/* Upload Document Modal */}
      <Modal isOpen={isUploadOpen} onClose={onUploadClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload Document</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>              <FormControl isRequired>
                <FormLabel>Document Type</FormLabel>
                <Select
                  placeholder="Select document type"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                >
                  <option value="ktp">KTP (ID Card)</option>
                  <option value="surat_perjanjian">Surat Perjanjian (Agreement Letter)</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>File</FormLabel>
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileSelect}
                  padding={1}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Supported formats: JPG, PNG, PDF (max 5MB)
                </Text>
              </FormControl>

              {selectedFile && (
                <Alert status="success">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="medium">File selected:</Text>
                    <Text fontSize="sm">{selectedFile.name}</Text>
                  </Box>
                </Alert>
              )}

              <FormControl>
                <FormLabel>Description (Optional)</FormLabel>
                <Textarea
                  placeholder="Add any additional notes about this document"
                  value={documentDescription}
                  onChange={(e) => setDocumentDescription(e.target.value)}
                  resize="vertical"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onUploadClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleUploadDocument}
              isLoading={uploading}
              loadingText="Uploading..."
              isDisabled={!selectedFile || !documentType}
            >
              Upload Document
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </TenantLayout>
  );
};

export default Profile;
