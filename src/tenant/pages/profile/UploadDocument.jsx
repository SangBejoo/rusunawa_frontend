import React, { useState, useEffect, useRef } from 'react';
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
  Input,
  Select,
  Flex,
  VStack,
  Image,
  Icon,
  Alert,
  AlertIcon,
  useToast,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Textarea,
  HStack,
} from '@chakra-ui/react';
import { FaFileAlt, FaUpload, FaArrowLeft } from 'react-icons/fa';
import { FiUpload, FiFile } from 'react-icons/fi';
import TenantLayout from '../../components/layout/TenantLayout';
import documentService from '../../services/documentService';
import { useTenantAuth } from '../../context/tenantAuthContext';
import DocumentRequirements from '../../components/documents/DocumentRequirements';

const UploadDocument = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef();
  const { tenant } = useTenantAuth();
  
  const [docType, setDocType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');
  
  // Check if user is a student (mahasiswa)
  const isStudent = tenant?.tenantType?.name === 'mahasiswa';
  
  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setSelectedFile(null); // This line was causing an error if setSelectedFile was not defined
      setFilePreview(null);
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErrors({ file: 'Please upload a JPEG, PNG, or PDF file' });
      return;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setErrors({ file: 'File size should not exceed 5MB' });
      return;
    }
    
    // Clear previous errors
    setErrors({});
    setSelectedFile(file);
    setError('');

    // Create file preview if it's an image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };
  
  // Handle document type selection
  const handleDocTypeChange = (e) => {
    setDocType(e.target.value);
    if (errors.docType) {
      setErrors({ ...errors, docType: undefined });
    }
  };
  
  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!docType) {
      newErrors.docType = 'Please select a document type';
    }
    
    if (!selectedFile) {
      newErrors.file = 'Please select a file to upload';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
        toast({
            title: "Validation Error",
            description: "Please correct the errors in the form.",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        return;
    }
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError("");
    
    try {
      if (!selectedFile) {
        setError("Please select a file to upload");
        setIsSubmitting(false);
        return;
      }
      
      console.log(`Raw docType state before parsing: "${docType}"`);

      if (!docType) {
        setError("Please select a document type");
        setIsSubmitting(false);
        return;
      }
      
      // Parse document type to get the ID
      let docTypeId = 1; // Default to 1 (KTP)
      
      if (docType) {
        const match = docType.match(/^(\d+)/);
        if (match && match[1]) {
          docTypeId = parseInt(match[1], 10);
        } else {
          console.warn(`Could not parse numeric ID from docType: "${docType}". Defaulting to ID 1.`);
        }
      }
      
      docTypeId = Math.abs(docTypeId);
      
      console.log(`Using document type ID: ${docTypeId} from selected type: ${docType}`);
      
      // Convert file to base64
      const base64Content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // Prepare data for the service
      const documentUploadData = {
        docTypeId: docTypeId,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        content: base64Content,
        description: notes || '',
        isImage: selectedFile.type.startsWith('image/')
      };
      
      console.log("Submitting document data to service:", {
        docTypeId: documentUploadData.docTypeId,
        fileName: documentUploadData.fileName,
        fileType: documentUploadData.fileType,
        description: documentUploadData.description,
        isImage: documentUploadData.isImage
      });
      
      console.log("Calling documentService.uploadDocument...");
      const response = await documentService.uploadDocument(documentUploadData);
      console.log("documentService.uploadDocument responded:", response);
      
      toast({
        title: "Document uploaded successfully",
        description: response?.message || "Your document is being processed.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      navigate('/tenant/documents');
    } catch (err) {
      console.error("Error uploading document in component:", err);
      setError(err.message || "Failed to upload document. Please try again.");
      toast({
        title: "Upload Failed",
        description: err.message || "Could not upload the document.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ensure the document type options are properly formatted with IDs that can be parsed
  // Different options based on user type
  const getDocumentTypeOptions = () => {
    if (isStudent) {
      // For students (mahasiswa): KTP, KK, and Surat Perjanjian
      return [
        { value: "1 - KTP", label: "KTP (ID Card)" },
        { value: "3 - KK", label: "KK (Family Card)" },
        { value: "2 - Surat Perjanjian", label: "Surat Perjanjian (Agreement Letter)" },
      ];
    } else {
      // For non-students: Only KTP
      return [
        { value: "1 - KTP", label: "KTP (ID Card)" },
      ];
    }
  };
  
  const documentTypeOptions = getDocumentTypeOptions();

  return (
    <TenantLayout>
      <Container maxW="container.md" py={8}>
        <Button 
          leftIcon={<FaArrowLeft />} 
          mb={6} 
          onClick={() => navigate('/tenant/documents')}
        >
          Back to Documents
        </Button>
        
        {/* User Type Info */}
        <DocumentRequirements tenant={tenant} showDownload={true} />
        
        <Heading size="xl" mb={6} display="flex" alignItems="center">
          <Icon as={FaFileAlt} mr={3} color="brand.500" />
          Upload Document
        </Heading>
        
        <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
          <CardHeader pb={0}>
            <Text>Upload your documents for verification and compliance with housing requirements.</Text>
          </CardHeader>
          
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={6} align="stretch">
                <FormControl isInvalid={!!errors.docType} isRequired id="documentTypeControl"> {/* Added id to FormControl for clarity, not strictly for label */}
                  <FormLabel htmlFor="documentTypeSelect">Document Type</FormLabel>
                  <Select
                    id="documentTypeSelect" // Ensure ID matches htmlFor
                    placeholder="Select document type"
                    value={docType}
                    onChange={handleDocTypeChange}
                  >
                    {documentTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage>{errors.docType}</FormErrorMessage>
                </FormControl>
                
                <FormControl isInvalid={!!errors.file} isRequired id="documentFileControl">
                  <FormLabel htmlFor="documentFileInput">Document File</FormLabel>
                  <Input
                    id="documentFileInput" // Ensure ID matches htmlFor for the actual input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={handleFileChange}
                    display="none" // Hidden, custom button used
                  />
                  <Button
                    as="label" // Makes the button act as a label
                    htmlFor="documentFileInput" // Points to the hidden file input
                    leftIcon={<Icon as={FiUpload} />}
                    colorScheme="blue"
                    variant="outline"
                    cursor="pointer"
                    width="full"
                    py={2}
                    textAlign="center"
                  >
                    {selectedFile ? selectedFile.name : 'Choose File (JPG, PNG, PDF)'}
                  </Button>
                  <Text mt={1} fontSize="xs" color="gray.500">
                    Max file size: 5MB.
                  </Text>
                </FormControl>
                
                {filePreview && selectedFile?.type.startsWith('image/') && (
                  <Box mb={4} borderWidth={1} p={2} borderRadius="md" textAlign="center">
                    <Text fontWeight="semibold" mb={2}>Image Preview:</Text>
                    <Image src={filePreview} alt="Document preview" maxH="200px" mx="auto" borderRadius="md" />
                  </Box>
                )}
                
                {selectedFile && !selectedFile.type.startsWith('image/') && (
                  <HStack mb={4} p={3} borderWidth={1} borderRadius="md" spacing={3} align="center">
                    <Icon as={FiFile} boxSize={6} color="gray.500" />
                    <Text fontWeight="medium">{selectedFile.name} ({ (selectedFile.size / 1024).toFixed(2) } KB)</Text>
                  </HStack>
                )}
                
                <FormControl id="descriptionControl">
                  <FormLabel htmlFor="descriptionTextarea">Description (Optional)</FormLabel>
                  <Textarea
                    id="descriptionTextarea" // Ensure ID matches htmlFor
                    placeholder="Enter a brief description for the document"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </FormControl>
                
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  Uploaded documents will be reviewed by our staff for verification.
                </Alert>
              </VStack>
              
              <Button
                type="submit"
                colorScheme="brand"
                size="lg"
                leftIcon={<FaUpload />}
                mt={6}
                isLoading={isSubmitting} // Use isSubmitting here
                loadingText="Uploading..."
                w="full"
              >
                Upload Document
              </Button>
            </form>
          </CardBody>
        </Card>
      </Container>
    </TenantLayout>
  );
};

export default UploadDocument;
