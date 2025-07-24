import React from 'react';
import {
  Box, Flex, Text, Badge, Icon, Button, Image,
  useColorModeValue, VStack, HStack, Tooltip,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalCloseButton, useDisclosure
} from '@chakra-ui/react';
import { 
  FaFileAlt, FaFilePdf, FaFileImage, FaCheckCircle,
  FaTimesCircle, FaClock, FaEye, FaDownload, FaTrash
} from 'react-icons/fa';
import documentService from '../../services/documentService';
import DocumentViewer from './DocumentViewer';

const DocumentCard = ({ document, onDelete, showStatus = true, isSelected = false, onView }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const boxBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const selectedBg = useColorModeValue('brand.50', 'brand.900');

  // Handle delete with modal closure
  const handleDelete = async (documentId) => {
    try {
      if (onDelete) {
        await onDelete(documentId);
        onClose(); // Close modal after successful deletion
      }
    } catch (error) {
      // Error is already handled by the onDelete function and DocumentViewer
      throw error;
    }
  };
  
  // Get file icon based on file type
  const getFileIcon = () => {
    const fileType = document.fileType?.toLowerCase() || '';
    
    if (fileType.includes('pdf')) {
      return FaFilePdf;
    } else if (fileType.includes('image') || document.isImage) {
      return FaFileImage;
    } else {
      return FaFileAlt;
    }
  };
  
  // Get status badge properties
  const getStatusBadge = () => {
    switch(document.status) {
      case 'approved':
        return { 
          colorScheme: 'green', 
          icon: FaCheckCircle, 
          text: 'Approved',
          borderColor: 'green.500' 
        };
      case 'rejected':
        return { 
          colorScheme: 'red', 
          icon: FaTimesCircle, 
          text: 'Rejected',
          borderColor: 'red.500'  
        };
      case 'pending':
      default:
        return { 
          colorScheme: 'yellow', 
          icon: FaClock, 
          text: 'Pending Review',
          borderColor: 'yellow.500'  
        };
    }
  };
  
  const statusInfo = getStatusBadge();
  const FileIcon = getFileIcon();
  
  // Generate appropriate URLs for display
  const getDocumentDisplayUrl = () => {
    // If document has content (base64), create blob URL
    if (document.content && document.isImage) {
      return documentService.createBlobUrl(document.content, document.fileType);
    }
    
    // If document has fileUrl, use it
    if (document.fileUrl) {
      return document.fileUrl;
    }
    
    // If document has thumbnailUrl, use it
    if (document.thumbnailUrl) {
      return document.thumbnailUrl;
    }
    
    // Generate view URL as fallback
    if (document.isImage) {
      return documentService.getDocumentImageUrl(document.docId);
    }
    
    return null;
  };
  
  const documentDisplayUrl = getDocumentDisplayUrl();
  
  const handleClick = () => {
    if (onView) {
      onView(document);
    }
  };
    const handleDownload = (e) => {
    e.stopPropagation();
    
    if (document.content) {
      // Create download from base64 content
      const blobUrl = documentService.createBlobUrl(document.content, document.fileType);
      const a = window.document.createElement('a');
      a.href = blobUrl;
      a.download = document.fileName || 'document';
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } else if (document.fileUrl) {
      window.open(document.fileUrl, '_blank');
    } else {
      // Use download service
      documentService.downloadDocument(document.docId)
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const a = window.document.createElement('a');
          a.href = url;
          a.download = document.fileName || 'document';
          window.document.body.appendChild(a);
          a.click();
          window.document.body.removeChild(a);
          URL.revokeObjectURL(url);
        })
        .catch(error => {
          console.error('Download failed:', error);
        });
    }
  };
  
  return (
    <Box 
      p={4}
      bg={isSelected ? selectedBg : boxBg}
      borderWidth="2px"
      borderRadius="md"
      borderColor={isSelected ? 'brand.500' : (document.status && showStatus ? statusInfo.borderColor : borderColor)}
      shadow="sm"
      position="relative"
      cursor={onView ? 'pointer' : 'default'}
      onClick={handleClick}
      _hover={onView ? { shadow: 'md', transform: 'translateY(-1px)' } : {}}
      transition="all 0.2s"
    >
      <Flex direction={{ base: 'column', sm: 'row' }} align="center">
        {document.isImage && documentDisplayUrl ? (
          <Image 
            src={documentDisplayUrl}
            alt={document.fileName || 'Document thumbnail'}
            boxSize="80px"
            objectFit="cover"
            borderRadius="md"
            mr={{ base: 0, sm: 4 }}
            mb={{ base: 3, sm: 0 }}
            fallback={
              <Icon 
                as={FileIcon} 
                boxSize="60px" 
                color="brand.500"
              />
            }
            onError={(e) => {
              // Fallback to icon if image fails to load
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <Icon 
            as={FileIcon} 
            boxSize="60px" 
            mr={{ base: 0, sm: 4 }}
            mb={{ base: 3, sm: 0 }}
            color="brand.500"
          />
        )}
        
        <VStack align="start" spacing={1} flex="1">
          <Text fontWeight="bold" fontSize="md" noOfLines={1}>
            {document.fileName || document.documentType?.name || 'Document'}
          </Text>
          
          {showStatus && (
            <Badge colorScheme={statusInfo.colorScheme}>
              <Flex align="center">
                <Icon as={statusInfo.icon} mr={1} fontSize="xs" />
                {statusInfo.text}
              </Flex>
            </Badge>
          )}
          
          {document.notes && (
            <Tooltip label={document.notes}>
              <Text fontSize="sm" color="gray.500" noOfLines={1} mt={1}>
                Note: {document.notes}
              </Text>
            </Tooltip>
          )}
          
          <Text fontSize="xs" color="gray.400">
            {document.documentType?.name || 'Unknown Type'}
          </Text>
        </VStack>
      </Flex>
      
      <HStack mt={4} spacing={3} justify="flex-end">
        {onDelete && (
          <Button
            size="sm"
            leftIcon={<FaTrash />}
            variant="ghost"
            colorScheme="red"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(document.docId);
            }}
          >
            Delete
          </Button>
        )}
          <Button
          size="sm"
          leftIcon={<FaEye />}
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          View
        </Button>
        
        <Button
          size="sm"
          leftIcon={<FaDownload />}
          variant="solid"
          colorScheme="brand"
          onClick={handleDownload}
        >          Download
        </Button>
      </HStack>

      {/* Document Preview Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Document Details - {document.docType || 'Document'}
          </ModalHeader>
          <ModalCloseButton />          <ModalBody pb={6}>
            <DocumentViewer 
              document={document} 
              onDelete={handleDelete}
              onReplace={null} // Disable replace in modal view
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DocumentCard;
