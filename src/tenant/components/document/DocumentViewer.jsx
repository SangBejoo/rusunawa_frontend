import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Image,
  Button,
  HStack,
  Spinner,
  useColorModeValue,
  Badge,
  Link,
  Flex,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  IconButton,
  Divider,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  ButtonGroup,
  Icon,
} from '@chakra-ui/react';
import { FaDownload, FaEye, FaFileAlt, FaFilePdf, FaTrash, FaUpload, FaExclamationTriangle } from 'react-icons/fa';
import { MdFullscreen, MdWarning } from 'react-icons/md';
import { formatDate } from '../../utils/dateUtils';
import documentService from '../../services/documentService';
import { ErrorAlert, DocumentDeleteAlert } from '../ui/EnhancedAlert';

/**
 * Component to view document details and preview
 */
const DocumentViewer = ({ document, onDelete, onReplace }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [documentData, setDocumentData] = useState(document);
  const [displayUrl, setDisplayUrl] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = React.useRef();
  const toast = useToast();
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  
  // Pre-define all useColorModeValue calls for AlertDialog
  const alertBg = useColorModeValue('white', 'gray.800');
  const alertBorderColor = useColorModeValue('red.100', 'red.700');
  const headerBorderColor = useColorModeValue('gray.100', 'gray.700');
  const headerBg = useColorModeValue('red.50', 'red.900');
  const headerColor = useColorModeValue('red.800', 'red.100');
  const bodyTextColor = useColorModeValue('gray.700', 'gray.300');
  const bodySpanColor = useColorModeValue('gray.900', 'white');
  const warningBg = useColorModeValue('orange.50', 'orange.900');
  const warningBorderColor = useColorModeValue('orange.200', 'orange.700');
  const warningTextColor = useColorModeValue('orange.800', 'orange.200');
  const warningSubTextColor = useColorModeValue('orange.700', 'orange.300');
  const fileBoxBg = useColorModeValue('gray.50', 'gray.700');
  const fileBoxBorderColor = useColorModeValue('gray.200', 'gray.600');
  const fileBoxLabelColor = useColorModeValue('gray.600', 'gray.400');
  const fileBoxTextColor = useColorModeValue('gray.900', 'white');
  const footerBorderColor = useColorModeValue('gray.100', 'gray.700');
  const cancelButtonHoverBg = useColorModeValue('gray.100', 'gray.700');
  
    // Load full document data if needed
  useEffect(() => {
    // Always use the document data that's passed in, don't fetch from API
    setDocumentData(document);
  }, [document]);

  // Generate display URL
  useEffect(() => {
    if (!documentData) return;

    let url = null;

    // If document has base64 content and is an image, create blob URL
    if (documentData.content && documentData.isImage) {
      url = documentService.createBlobUrl(documentData.content, documentData.fileType);
    }
    // If document has fileUrl, use it
    else if (documentData.fileUrl) {
      url = documentData.fileUrl;
    }
    // Generate view URL as fallback
    else if (documentData.isImage) {
      url = documentService.getDocumentViewUrl(documentData.docId);
    }

    setDisplayUrl(url);

    // Cleanup blob URL when component unmounts or URL changes
    return () => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [documentData]);
  
  // Get status display properties
  const getStatusDisplay = () => {
    switch (documentData?.status) {
      case 'approved':
        return { color: 'green', text: 'Approved' };
      case 'rejected':
        return { color: 'red', text: 'Rejected' };
      case 'pending':
        return { color: 'yellow', text: 'Pending Review' };
      default:
        return { color: 'gray', text: 'Unknown' };
    }
  };
  
  const statusDisplay = getStatusDisplay();
  // Handle document deletion
  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (onDelete) {
        await onDelete(documentData?.docId);
          // Show success message
        toast({
          title: '🗑️ Document Deleted Successfully',
          description: 'The document has been permanently removed from your account.',
          status: 'success',
          duration: 4000,
          isClosable: true,
          position: 'top-right',
          variant: 'subtle',
        });
        
        onDeleteClose(); // Close the confirmation dialog
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document. Please try again.');      toast({
        title: '❌ Delete Failed',
        description: err.message || 'Unable to delete the document. Please check your connection and try again.',
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'top-right',
        variant: 'subtle',
      });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirmation = () => {
    onDeleteOpen();
  };
  
  // Handle document replacement
  const handleReplace = () => {
    if (onReplace) {
      onReplace(documentData?.docId);
    }
  };
    // Handle document download
  const handleDownload = async () => {
    try {
      if (documentData?.content) {
        // Download from base64 content
        const blobUrl = documentService.createBlobUrl(documentData.content, documentData.fileType);
        const a = window.document.createElement('a');
        a.href = blobUrl;
        a.download = documentData.fileName || 'document';
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } else {
        // Use download service
        const blob = await documentService.downloadDocument(documentData.docId);
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = documentData.fileName || 'document';
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }toast({
        title: '📥 Download Started',
        description: 'Your document download has started.',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
        variant: 'subtle',
      });
    } catch (error) {
      console.error('Download failed:', error);      toast({
        title: '📥 Download Failed',
        description: 'Failed to download document. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
        variant: 'subtle',
      });
    }
  };
  
  // Determine if document is viewable
  const isViewable = documentData?.isImage || documentData?.fileType?.includes('image') || false;
  
  // Function to render preview based on file type
  const renderPreview = () => {
    if (loading) {
      return (
        <Flex justify="center" align="center" height="300px">
          <Spinner size="xl" />
        </Flex>
      );
    }    if (error) {
      return (
        <ErrorAlert
          title="Unable to Load Document"
          description={error}
          size="lg"
          boxShadow="lg"
        />
      );
    }
    
    if (isViewable && displayUrl) {
      return (
        <Box 
          position="relative" 
          width="100%" 
          height={{ base: "250px", md: "350px" }}
          borderRadius="md"
          overflow="hidden"
          borderWidth={1}
          borderColor={borderColor}
          bg="gray.50"
        >
          <Image
            src={displayUrl}
            alt={documentData?.fileName || 'Document preview'}
            objectFit="contain"
            width="100%"
            height="100%"
            fallback={
              <Flex justify="center" align="center" height="100%">
                <Spinner />
              </Flex>
            }
            onError={() => {
              setError('Failed to load image preview');
            }}
          />
          
          {/* Fullscreen button */}
          <IconButton 
            icon={<MdFullscreen />}
            position="absolute"
            top={2}
            right={2}
            colorScheme="brand"
            onClick={onOpen}
            aria-label="View fullscreen"
            size="sm"
          />
        </Box>
      );
    }
    
    // Non-image document preview
    return (
      <Flex
        width="100%"
        height={{ base: "200px", md: "300px" }}
        borderRadius="md"
        borderWidth={1}
        borderColor={borderColor}
        bg="gray.50"
        justifyContent="center"
        alignItems="center"
        direction="column"
      >
        <Box fontSize="5xl" mb={4}>
          {documentData?.fileType?.includes('pdf') ? <FaFilePdf color="#D14836" /> : <FaFileAlt color="#2B6CB0" />}
        </Box>
        <Text fontWeight="medium">{documentData?.fileName || 'Document'}</Text>
        
        <Button
          mt={4}
          leftIcon={<FaEye />}
          onClick={handleDownload}
          size="sm"
          colorScheme="blue"
        >
          Download to View
        </Button>
      </Flex>
    );
  };
  
  if (!documentData) {
    return (
      <Box p={6} textAlign="center">
        <Text>No document selected.</Text>
      </Box>
    );
  }
  
  return (
    <>
      <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="sm" width="100%">
        <VStack spacing={6} align="stretch">
          <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Heading size="md">{documentData.documentType?.name || 'Document'}</Heading>
            <Badge colorScheme={statusDisplay.color} px={2} py={1} borderRadius="full">
              {statusDisplay.text}
            </Badge>
          </Flex>
          
          <Divider />
          
          <Box>
            <Text fontSize="sm" color="gray.500" mb={1}>
              File Name
            </Text>
            <Text fontWeight="medium">{documentData.fileName || 'No file name'}</Text>
          </Box>
          
          <HStack>
            <Box flex="1">
              <Text fontSize="sm" color="gray.500" mb={1}>
                Uploaded
              </Text>
              <Text>{formatDate(documentData.uploadedAt || documentData.createdAt)}</Text>
            </Box>
            
            {documentData.status === 'approved' && documentData.approvedAt && (
              <Box flex="1">
                <Text fontSize="sm" color="gray.500" mb={1}>
                  Approved
                </Text>
                <Text>{formatDate(documentData.approvedAt)}</Text>
              </Box>
            )}
          </HStack>
          
          {documentData.status === 'rejected' && documentData.notes && (
            <Alert status="error" variant="left-accent" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Rejection Reason:</Text>
                <Text>{documentData.notes}</Text>
              </Box>
            </Alert>
          )}
          
          {/* Document Preview */}
          {renderPreview()}
          
          {/* Actions */}
          <HStack spacing={4} justify="space-between">
            <Button 
              leftIcon={<FaDownload />}
              variant="outline" 
              size="sm"
              onClick={handleDownload}
            >
              Download
            </Button>
            
            <HStack>
              {documentData.status === 'rejected' && (
                <Button 
                  leftIcon={<FaUpload />}
                  colorScheme="brand" 
                  size="sm"
                  onClick={handleReplace}
                >
                  Replace
                </Button>
              )}
                <Button 
                leftIcon={<FaTrash />}
                colorScheme="red" 
                variant="ghost" 
                size="sm"
                onClick={openDeleteConfirmation}
                isLoading={loading}
                _hover={{
                  bg: 'red.50',
                  color: 'red.600',
                  borderColor: 'red.200'
                }}
              >
                Delete
              </Button>
            </HStack>
          </HStack>
        </VStack>
      </Box>
      
      {/* Fullscreen modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{documentData.documentType?.name || 'Document'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isViewable && displayUrl ? (              <Image
                src={displayUrl}
                alt={documentData.fileName || 'Document preview'}
                objectFit="contain"
                width="100%"
                maxHeight="70vh"
              />
            ) : (
              <Box textAlign="center" p={6}>
                <Text>Preview not available for this document type.</Text>
                <Button
                  mt={4}
                  onClick={handleDownload}
                  colorScheme="brand"
                >
                  Download to View
                </Button>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* Delete confirmation dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
        size="md"
      >
        <AlertDialogOverlay bg="blackAlpha.300" backdropFilter="blur(10px)">
          <AlertDialogContent
            mx={4}
            borderRadius="xl"
            boxShadow="2xl"
            bg={alertBg}
            border="1px"
            borderColor={alertBorderColor}
          >
            <AlertDialogHeader
              fontSize="lg"
              fontWeight="bold"
              borderBottomWidth="1px"
              borderBottomColor={headerBorderColor}
              borderTopRadius="xl"
              bg={headerBg}
              color={headerColor}
            >
              Delete Document
            </AlertDialogHeader>

            <AlertDialogBody py={6}>
              <VStack spacing={4} align="start">
                <Text fontSize="md" color={bodyTextColor}>
                  Are you sure you want to delete this{' '}
                  <Text as="span" fontWeight="semibold" color={bodySpanColor}>
                    {documentData?.docType || 'document'}
                  </Text>
                  ?
                </Text>
                  <Alert 
                  status="warning" 
                  borderRadius="lg" 
                  bg={warningBg}
                  borderWidth="1px"
                  borderColor={warningBorderColor}
                  boxShadow="sm"
                >
                  <AlertIcon as={FaExclamationTriangle} color="orange.500" />
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color={warningTextColor}>
                      Permanent Action
                    </Text>
                    <Text fontSize="xs" color={warningSubTextColor} mt={1}>
                      This action cannot be undone. The document will be permanently removed from your account.
                    </Text>
                  </Box>
                </Alert>

                {documentData?.fileName && (
                  <Box
                    p={3}
                    borderRadius="md"
                    bg={fileBoxBg}
                    borderWidth="1px"
                    borderColor={fileBoxBorderColor}
                    w="full"
                  >
                    <Text fontSize="xs" color={fileBoxLabelColor} mb={1}>
                      File Name
                    </Text>
                    <Text fontWeight="semibold" color={fileBoxTextColor}>
                      {documentData.fileName}
                    </Text>
                  </Box>
                )}
              </VStack>
            </AlertDialogBody>
            <AlertDialogFooter borderTopWidth="1px" borderTopColor={footerBorderColor}>
              <ButtonGroup spacing={3}>
                <Button
                  ref={cancelRef}
                  onClick={onDeleteClose}
                  variant="ghost"
                  size="md"
                  _hover={{
                    bg: cancelButtonHoverBg,
                  }}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="red"
                  onClick={handleDelete}
                  isLoading={loading}
                  loadingText="Deleting..."
                  size="md"
                  _hover={{
                    bg: 'red.600',
                    transform: 'translateY(-1px)',
                    boxShadow: 'lg',
                  }}
                  transition="all 0.2s"
                >
                  Delete Document
                </Button>
              </ButtonGroup>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default DocumentViewer;
