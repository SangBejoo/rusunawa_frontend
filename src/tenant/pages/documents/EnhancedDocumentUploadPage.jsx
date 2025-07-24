// Enhanced Document Upload Page with Advanced Image/Document Upload Capabilities
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  Textarea,
  Select,
  Button,
  Card,
  CardBody,
  CardHeader,
  Image,
  IconButton,
  Badge,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  useColorModeValue,
  Flex,
  SimpleGrid,
  AspectRatio,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tooltip,
  CircularProgress,
  CircularProgressLabel,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  List,
  ListItem,
  ListIcon,
  Checkbox,
  Stack
} from '@chakra-ui/react';
import {
  FaUpload,
  FaTrash,
  FaEye,
  FaFile,
  FaImage,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaCheckCircle,
  FaArrowLeft,
  FaPlus,
  FaEdit,
  FaDownload,
  FaCog,
  FaFileUpload
} from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import TenantLayout from '../../components/layout/TenantLayout';
import enhancedDocumentService from '../../services/enhancedDocumentService';
import { useTenantAuth } from '../../context/tenantAuthContext';

const EnhancedDocumentUploadPage = () => {
  const { tenant } = useTenantAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

  // Form state
  const [formData, setFormData] = useState({
    doc_type_id: searchParams.get('docType') || '',
    description: '',
    tags: '',
    is_private: false
  });

  // File management
  const [files, setFiles] = useState([]);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [validationResults, setValidationResults] = useState(null);

  // Document types and requirements
  const [documentTypes, setDocumentTypes] = useState([]);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [loading, setLoading] = useState(true);

  // Processing options
  const [processingOptions, setProcessingOptions] = useState({
    enableOCR: true,
    enhanceImages: true,
    validateContent: true,
    extractMetadata: true,
    qualityCheck: true
  });

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Load document types with requirements
        const typesResponse = await enhancedDocumentService.getDocumentTypesWithImageRequirements();
        setDocumentTypes(typesResponse.types || []);

        // Set selected document type if provided in URL
        if (formData.doc_type_id) {
          const docType = typesResponse.types.find(type => 
            type.id === parseInt(formData.doc_type_id) || type.code === formData.doc_type_id
          );
          setSelectedDocType(docType);
        }

      } catch (error) {
        console.error('Error loading initial data:', error);
        toast({
          title: 'Loading Error',
          description: 'Failed to load document types. Please refresh the page.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    if (tenant?.id) {
      loadInitialData();
    }
  }, [tenant?.id, formData.doc_type_id, toast]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Update selected document type when doc_type_id changes
    if (name === 'doc_type_id') {
      const docType = documentTypes.find(type => 
        type.id === parseInt(value) || type.code === value
      );
      setSelectedDocType(docType);
      
      // Clear files if document type changes
      if (files.length > 0) {
        setFiles([]);
        setValidationResults(null);
      }
    }

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // File dropzone configuration
  const onDrop = useCallback(async (acceptedFiles) => {
    if (!selectedDocType) {
      toast({
        title: 'Document Type Required',
        description: 'Please select a document type first.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const maxFiles = selectedDocType.max_files || 5;
    const currentCount = files.length;
    const remainingSlots = maxFiles - currentCount;

    if (acceptedFiles.length > remainingSlots) {
      toast({
        title: 'Too Many Files',
        description: `You can only add ${remainingSlots} more file(s). Maximum ${maxFiles} files allowed for this document type.`,
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      acceptedFiles = acceptedFiles.slice(0, remainingSlots);
    }

    const newFiles = acceptedFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      name: file.name,
      size: file.size,
      type: file.type,
      uploaded: false,
      processed: false
    }));

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);

    // Validate files against document type requirements
    if (selectedDocType && updatedFiles.length > 0) {
      try {
        const imageFiles = updatedFiles
          .filter(f => f.file.type.startsWith('image/'))
          .map(f => f.file);
        
        if (imageFiles.length > 0) {
          const validation = await enhancedDocumentService.validateDocumentImages(
            selectedDocType.id,
            imageFiles
          );
          setValidationResults(validation);
          
          if (!validation.valid && validation.issues.length > 0) {
            toast({
              title: 'Validation Issues Found',
              description: `${validation.issues.length} issue(s) detected. Check the validation panel for details.`,
              status: 'warning',
              duration: 5000,
              isClosable: true,
            });
          }
        }
      } catch (error) {
        console.error('Error validating files:', error);
      }
    }
  }, [files, selectedDocType, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: true,
    maxSize: 20 * 1024 * 1024 // 20MB per file
  });

  // Remove file
  const removeFile = (fileId) => {
    setFiles(prev => {
      const updated = prev.filter(file => file.id !== fileId);
      // Revoke object URL to prevent memory leaks
      const fileToRemove = prev.find(file => file.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return updated;
    });
    
    // Clear validation results if no files remain
    if (files.length <= 1) {
      setValidationResults(null);
    }
  };

  // Preview file
  const previewFile = (file) => {
    setFilePreview(file);
    onOpen();
  };

  // Get file icon
  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return FaImage;
    if (fileType === 'application/pdf') return FaFilePdf;
    if (fileType.includes('word')) return FaFileWord;
    if (fileType.includes('excel') || fileType.includes('sheet')) return FaFileExcel;
    return FaFile;
  };

  // Get file type color
  const getFileTypeColor = (fileType) => {
    if (fileType.startsWith('image/')) return 'green';
    if (fileType === 'application/pdf') return 'red';
    if (fileType.includes('word')) return 'blue';
    if (fileType.includes('excel') || fileType.includes('sheet')) return 'teal';
    return 'gray';
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.doc_type_id) {
      errors.doc_type_id = 'Please select a document type';
    }

    if (files.length === 0) {
      errors.files = 'Please upload at least one file';
    }

    if (selectedDocType && files.length > 0) {
      // Check minimum files requirement
      if (selectedDocType.min_files && files.length < selectedDocType.min_files) {
        errors.files = `This document type requires at least ${selectedDocType.min_files} file(s)`;
      }

      // Check required file types
      if (selectedDocType.required_types && selectedDocType.required_types.length > 0) {
        const fileTypes = files.map(f => f.type);
        const missingTypes = selectedDocType.required_types.filter(type => 
          !fileTypes.includes(type)
        );
        if (missingTypes.length > 0) {
          errors.files = `Missing required file types: ${missingTypes.join(', ')}`;
        }
      }
    }

    // Check validation results
    if (validationResults && !validationResults.valid) {
      const criticalIssues = validationResults.issues.filter(issue => 
        issue.severity === 'error' || issue.severity === 'critical'
      );
      if (criticalIssues.length > 0) {
        errors.validation = 'Please fix critical validation issues before uploading';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please correct the errors in the form.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const documentData = {
        ...formData,
        tenant_id: tenant.id,
        processing_options: processingOptions
      };

      const fileObjects = files.map(f => f.file);

      const response = await enhancedDocumentService.uploadDocumentWithImages(
        documentData,
        fileObjects,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      toast({
        title: 'Documents Uploaded Successfully',
        description: `${response.documents?.length || 1} document(s) uploaded and processing started.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Navigate to documents list
      navigate('/tenant/documents');

    } catch (error) {
      console.error('Error uploading documents:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload documents. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <TenantLayout>
        <Container maxW="container.xl" py={8}>
          <VStack spacing={8} align="center">
            <CircularProgress isIndeterminate color="brand.500" size="80px" />
            <Text>Loading document types...</Text>
          </VStack>
        </Container>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <HStack mb={4}>
              <Button
                leftIcon={<FaArrowLeft />}
                variant="ghost"
                onClick={() => navigate('/tenant/documents')}
              >
                Back to Documents
              </Button>
            </HStack>
            
            <Heading size="xl" mb={2}>
              Upload Documents
            </Heading>
            <Text color="gray.600">
              Upload your documents for verification and compliance. Select the document type and upload high-quality images or files.
            </Text>
          </Box>

          {/* Main Form */}
          <form onSubmit={handleSubmit}>
            <Grid templateColumns={{ base: '1fr', xl: '2fr 1fr' }} gap={8}>
              {/* Left Column - Main Content */}
              <GridItem>
                <VStack spacing={6} align="stretch">
                  {/* Document Type Selection */}
                  <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                    <CardHeader>
                      <Heading size="md">Document Information</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <FormControl isRequired isInvalid={!!validationErrors.doc_type_id}>
                          <FormLabel>Document Type</FormLabel>
                          <Select
                            name="doc_type_id"
                            value={formData.doc_type_id}
                            onChange={handleInputChange}
                            placeholder="Select document type"
                            size="lg"
                          >
                            {documentTypes.map(type => (
                              <option key={type.id} value={type.id}>
                                {type.name} {type.icon && `${type.icon} `}
                                {type.required && '(Required)'}
                              </option>
                            ))}
                          </Select>
                          <FormErrorMessage>{validationErrors.doc_type_id}</FormErrorMessage>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Description</FormLabel>
                          <Textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Optional description or notes about this document"
                            rows={3}
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Tags</FormLabel>
                          <Input
                            name="tags"
                            value={formData.tags}
                            onChange={handleInputChange}
                            placeholder="Optional tags (comma-separated)"
                          />
                          <FormHelperText>
                            Add tags to help organize your documents
                          </FormHelperText>
                        </FormControl>

                        <FormControl>
                          <Checkbox
                            name="is_private"
                            isChecked={formData.is_private}
                            onChange={handleInputChange}
                          >
                            Mark as private document
                          </Checkbox>
                          <FormHelperText>
                            Private documents are only visible to you and authorized staff
                          </FormHelperText>
                        </FormControl>
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Document Type Requirements */}
                  {selectedDocType && (
                    <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                      <CardHeader>
                        <Heading size="md">Requirements for {selectedDocType.name}</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={4} align="stretch">
                          {selectedDocType.description && (
                            <Text>{selectedDocType.description}</Text>
                          )}
                          
                          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                            <Box>
                              <Text fontWeight="semibold" mb={2}>File Requirements:</Text>
                              <List spacing={1} fontSize="sm">
                                <ListItem>
                                  <ListIcon as={FaCheckCircle} color="green.500" />
                                  Files: {selectedDocType.min_files || 1} - {selectedDocType.max_files || 5}
                                </ListItem>
                                <ListItem>
                                  <ListIcon as={FaCheckCircle} color="green.500" />
                                  Max size: {selectedDocType.max_file_size || '20MB'} per file
                                </ListItem>
                                {selectedDocType.allowed_formats && (
                                  <ListItem>
                                    <ListIcon as={FaCheckCircle} color="green.500" />
                                    Formats: {selectedDocType.allowed_formats.join(', ')}
                                  </ListItem>
                                )}
                              </List>
                            </Box>
                            
                            {selectedDocType.requirements && (
                              <Box>
                                <Text fontWeight="semibold" mb={2}>Content Requirements:</Text>
                                <List spacing={1} fontSize="sm">
                                  {selectedDocType.requirements.map((req, index) => (
                                    <ListItem key={index}>
                                      <ListIcon as={FaCheckCircle} color="blue.500" />
                                      {req}
                                    </ListItem>
                                  ))}
                                </List>
                              </Box>
                            )}
                          </Grid>

                          {selectedDocType.examples && selectedDocType.examples.length > 0 && (
                            <Alert status="info" borderRadius="md">
                              <AlertIcon />
                              <Box>
                                <AlertTitle fontSize="sm">Example documents:</AlertTitle>
                                <AlertDescription fontSize="xs">
                                  {selectedDocType.examples.join(', ')}
                                </AlertDescription>
                              </Box>
                            </Alert>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  )}

                  {/* File Upload Area */}
                  <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                    <CardHeader>
                      <HStack justify="space-between">
                        <Heading size="md">Files</Heading>
                        <Badge colorScheme="blue">
                          {files.length}/{selectedDocType?.max_files || 5}
                        </Badge>
                      </HStack>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        {/* Upload Zone */}
                        {(!selectedDocType?.max_files || files.length < selectedDocType.max_files) && (
                          <Box
                            {...getRootProps()}
                            p={8}
                            border="2px dashed"
                            borderColor={isDragActive ? "brand.500" : borderColor}
                            borderRadius="lg"
                            bg={isDragActive ? hoverBgColor : "transparent"}
                            textAlign="center"
                            cursor="pointer"
                            transition="all 0.2s"
                            _hover={{ borderColor: "brand.500", bg: hoverBgColor }}
                          >
                            <input {...getInputProps()} />
                            <VStack spacing={4}>
                              <FaFileUpload size="3em" color="gray" />
                              <Text fontWeight="medium" fontSize="lg">
                                {isDragActive ? 'Drop files here' : 'Click or drag files here'}
                              </Text>
                              <Text color="gray.500">
                                Images, PDFs, DOC, DOCX, XLS, XLSX up to 20MB each
                              </Text>
                              {selectedDocType && (
                                <Text fontSize="sm" color="blue.500">
                                  {selectedDocType.name} - {selectedDocType.allowed_formats?.join(', ') || 'All formats'}
                                </Text>
                              )}
                            </VStack>
                          </Box>
                        )}

                        {/* File List */}
                        {files.length > 0 && (
                          <VStack spacing={3} align="stretch">
                            {files.map((file) => (
                              <Box
                                key={file.id}
                                p={4}
                                border="1px solid"
                                borderColor={borderColor}
                                borderRadius="md"
                                bg={hoverBgColor}
                              >
                                <HStack spacing={4}>
                                  {/* File Preview/Icon */}
                                  <Box flexShrink={0}>
                                    {file.preview ? (
                                      <AspectRatio ratio={1} w="60px">
                                        <Image
                                          src={file.preview}
                                          alt={file.name}
                                          objectFit="cover"
                                          borderRadius="md"
                                        />
                                      </AspectRatio>
                                    ) : (
                                      <Flex
                                        w="60px"
                                        h="60px"
                                        align="center"
                                        justify="center"
                                        bg={`${getFileTypeColor(file.type)}.100`}
                                        color={`${getFileTypeColor(file.type)}.500`}
                                        borderRadius="md"
                                      >
                                        <Box as={getFileIcon(file.type)} size="24px" />
                                      </Flex>
                                    )}
                                  </Box>

                                  {/* File Info */}
                                  <VStack align="start" spacing={1} flex={1}>
                                    <Text fontWeight="medium" isTruncated maxW="200px">
                                      {file.name}
                                    </Text>
                                    <HStack spacing={4}>
                                      <Text fontSize="sm" color="gray.500">
                                        {(file.size / 1024 / 1024).toFixed(1)} MB
                                      </Text>
                                      <Badge colorScheme={getFileTypeColor(file.type)}>
                                        {file.type.split('/')[1].toUpperCase()}
                                      </Badge>
                                    </HStack>
                                  </VStack>

                                  {/* Actions */}
                                  <HStack spacing={2}>
                                    {file.preview && (
                                      <Tooltip label="Preview">
                                        <IconButton
                                          icon={<FaEye />}
                                          size="sm"
                                          variant="outline"
                                          onClick={() => previewFile(file)}
                                        />
                                      </Tooltip>
                                    )}
                                    <Tooltip label="Remove">
                                      <IconButton
                                        icon={<FaTrash />}
                                        size="sm"
                                        colorScheme="red"
                                        variant="outline"
                                        onClick={() => removeFile(file.id)}
                                      />
                                    </Tooltip>
                                  </HStack>
                                </HStack>
                              </Box>
                            ))}
                          </VStack>
                        )}

                        {/* Validation Errors */}
                        {validationErrors.files && (
                          <Alert status="error" borderRadius="md">
                            <AlertIcon />
                            {validationErrors.files}
                          </Alert>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              </GridItem>

              {/* Right Column - Validation & Processing Options */}
              <GridItem>
                <VStack spacing={6} align="stretch">
                  {/* Validation Results */}
                  {validationResults && (
                    <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                      <CardHeader>
                        <HStack justify="space-between">
                          <Heading size="md">Validation Results</Heading>
                          <Badge 
                            colorScheme={validationResults.valid ? 'green' : 'red'}
                          >
                            Score: {Math.round(validationResults.score * 100)}%
                          </Badge>
                        </HStack>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={4} align="stretch">
                          {validationResults.valid ? (
                            <Alert status="success" borderRadius="md">
                              <AlertIcon />
                              <Box>
                                <AlertTitle fontSize="sm">Validation Passed!</AlertTitle>
                                <AlertDescription fontSize="xs">
                                  Your documents meet all requirements.
                                </AlertDescription>
                              </Box>
                            </Alert>
                          ) : (
                            <Alert status="warning" borderRadius="md">
                              <AlertIcon />
                              <Box>
                                <AlertTitle fontSize="sm">Issues Found</AlertTitle>
                                <AlertDescription fontSize="xs">
                                  {validationResults.issues.length} issue(s) detected.
                                </AlertDescription>
                              </Box>
                            </Alert>
                          )}

                          {validationResults.issues && validationResults.issues.length > 0 && (
                            <Box>
                              <Text fontWeight="semibold" mb={2} fontSize="sm">Issues:</Text>
                              <List spacing={1} fontSize="xs">
                                {validationResults.issues.map((issue, index) => (
                                  <ListItem key={index} color={
                                    issue.severity === 'error' ? 'red.500' : 
                                    issue.severity === 'warning' ? 'orange.500' : 'gray.500'
                                  }>
                                    • {issue.message}
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )}

                          {validationResults.suggestions && validationResults.suggestions.length > 0 && (
                            <Box>
                              <Text fontWeight="semibold" mb={2} fontSize="sm">Suggestions:</Text>
                              <List spacing={1} fontSize="xs">
                                {validationResults.suggestions.map((suggestion, index) => (
                                  <ListItem key={index} color="blue.500">
                                    • {suggestion}
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  )}

                  {/* Processing Options */}
                  <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                    <CardHeader>
                      <HStack>
                        <FaCog />
                        <Heading size="md">Processing Options</Heading>
                      </HStack>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <Checkbox
                          isChecked={processingOptions.enableOCR}
                          onChange={(e) => setProcessingOptions(prev => ({
                            ...prev,
                            enableOCR: e.target.checked
                          }))}
                        >
                          <Box>
                            <Text fontSize="sm" fontWeight="medium">Enable OCR</Text>
                            <Text fontSize="xs" color="gray.500">
                              Extract text from images
                            </Text>
                          </Box>
                        </Checkbox>

                        <Checkbox
                          isChecked={processingOptions.enhanceImages}
                          onChange={(e) => setProcessingOptions(prev => ({
                            ...prev,
                            enhanceImages: e.target.checked
                          }))}
                        >
                          <Box>
                            <Text fontSize="sm" fontWeight="medium">Enhance Images</Text>
                            <Text fontSize="xs" color="gray.500">
                              Improve image quality and clarity
                            </Text>
                          </Box>
                        </Checkbox>

                        <Checkbox
                          isChecked={processingOptions.validateContent}
                          onChange={(e) => setProcessingOptions(prev => ({
                            ...prev,
                            validateContent: e.target.checked
                          }))}
                        >
                          <Box>
                            <Text fontSize="sm" fontWeight="medium">Validate Content</Text>
                            <Text fontSize="xs" color="gray.500">
                              Check document authenticity
                            </Text>
                          </Box>
                        </Checkbox>

                        <Checkbox
                          isChecked={processingOptions.extractMetadata}
                          onChange={(e) => setProcessingOptions(prev => ({
                            ...prev,
                            extractMetadata: e.target.checked
                          }))}
                        >
                          <Box>
                            <Text fontSize="sm" fontWeight="medium">Extract Metadata</Text>
                            <Text fontSize="xs" color="gray.500">
                              Extract document information
                            </Text>
                          </Box>
                        </Checkbox>

                        <Checkbox
                          isChecked={processingOptions.qualityCheck}
                          onChange={(e) => setProcessingOptions(prev => ({
                            ...prev,
                            qualityCheck: e.target.checked
                          }))}
                        >
                          <Box>
                            <Text fontSize="sm" fontWeight="medium">Quality Check</Text>
                            <Text fontSize="xs" color="gray.500">
                              Assess image and document quality
                            </Text>
                          </Box>
                        </Checkbox>
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Submit Button */}
                  <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                    <CardBody>
                      <VStack spacing={4}>
                        {isSubmitting && (
                          <Box w="full">
                            <HStack justify="space-between" mb={2}>
                              <Text fontSize="sm">Uploading...</Text>
                              <Text fontSize="sm">{uploadProgress}%</Text>
                            </HStack>
                            <Progress value={uploadProgress} colorScheme="brand" />
                          </Box>
                        )}
                        
                        <Button
                          type="submit"
                          colorScheme="brand"
                          size="lg"
                          leftIcon={<FaUpload />}
                          isLoading={isSubmitting}
                          loadingText="Uploading..."
                          w="full"
                          disabled={files.length === 0 || !formData.doc_type_id}
                        >
                          Upload Documents
                        </Button>
                        
                        <Text fontSize="xs" color="gray.500" textAlign="center">
                          Documents will be processed and verified after upload
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              </GridItem>
            </Grid>
          </form>
        </VStack>

        {/* File Preview Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>File Preview</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {filePreview && (
                <VStack spacing={4}>
                  {filePreview.preview ? (
                    <Image
                      src={filePreview.preview}
                      alt={filePreview.name}
                      maxH="400px"
                      objectFit="contain"
                      borderRadius="md"
                    />
                  ) : (
                    <Flex
                      w="full"
                      h="300px"
                      align="center"
                      justify="center"
                      bg="gray.100"
                      borderRadius="md"
                      direction="column"
                      spacing={4}
                    >
                      <Box as={getFileIcon(filePreview.type)} size="60px" color="gray.400" />
                      <Text color="gray.500">No preview available</Text>
                    </Flex>
                  )}
                  <Box textAlign="center">
                    <Text fontWeight="medium">{filePreview.name}</Text>
                    <HStack justify="center" spacing={4} mt={2}>
                      <Text fontSize="sm" color="gray.500">
                        {(filePreview.size / 1024 / 1024).toFixed(1)} MB
                      </Text>
                      <Badge colorScheme={getFileTypeColor(filePreview.type)}>
                        {filePreview.type.split('/')[1].toUpperCase()}
                      </Badge>
                    </HStack>
                  </Box>
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </TenantLayout>
  );
};

export default EnhancedDocumentUploadPage;
