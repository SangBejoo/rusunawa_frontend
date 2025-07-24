import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Image,
  Grid,
  GridItem,
  Badge,
  IconButton,
  useToast,
  Input,
  Progress,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Flex,
  Tooltip,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Spinner,
  Center
} from '@chakra-ui/react';
import {
  FiUpload,
  FiTrash2,
  FiEye,
  FiDownload,
  FiImage,
  FiStar,
  FiClock
} from 'react-icons/fi';
import issueService from '../../services/issueService';
import { useAuth } from '../../context/authContext';

const MultiImageAttachment = ({ 
  issueId,
  issueStatus = 'open', 
  onAttachmentsChange,
  readonly = false 
}) => {
  const { user } = useAuth();  const [attachments, setAttachments] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [imageCache, setImageCache] = useState({}); // Cache for loaded images
  
  const toast = useToast();
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  // Status-based attachment flow configuration
  const statusConfig = {
    open: {
      allowedTypes: ['report'],
      title: '📊 Report Phase',
      description: 'Upload initial damage photos and evidence'
    },
    in_progress: {
      allowedTypes: ['report', 'progress'],
      title: '🔧 In Progress Phase',
      description: 'Upload progress updates and repair documentation'
    },
    resolved: {
      allowedTypes: ['report', 'progress', 'completion'],
      title: '✅ Resolved Phase', 
      description: 'Upload completion photos and quality verification'
    },
    closed: {
      allowedTypes: ['report', 'progress', 'completion', 'feedback'],
      title: '🎯 Closed Phase',
      description: 'Upload feedback and final verification photos'
    }
  };

  const attachmentTypeConfig = {
    report: {
      icon: '📊',
      name: 'Report',
      description: 'Initial damage photos, location context, evidence',
      color: 'red'
    },
    progress: {
      icon: '🔧',
      name: 'Progress',
      description: 'Before repair, progress updates, additional damage',
      color: 'orange'
    },
    completion: {
      icon: '✅',
      name: 'Completion',
      description: 'After repair, quality check, cleanup proof',
      color: 'green'
    },
    feedback: {
      icon: '🎯',
      name: 'Feedback',
      description: 'Tenant feedback, satisfaction proof, final verification',
      color: 'blue'
    }
  };

  // Fetch attachments on component mount and when issueId changes
  useEffect(() => {
    if (issueId) {
      fetchAllAttachments();
    }
  }, [issueId]);

  const fetchAllAttachments = async () => {
    if (!issueId) return;
    
    try {
      setLoading(true);
      const response = await issueService.getIssueAttachments(issueId);
      
      // Group attachments by type
      const groupedAttachments = {};
      if (response.attachments && Array.isArray(response.attachments)) {
        response.attachments.forEach(attachment => {
          const type = attachment.attachmentType || attachment.attachment_type;
          if (!groupedAttachments[type]) {
            groupedAttachments[type] = [];
          }
          groupedAttachments[type].push(attachment);
        });
      }
      
      setAttachments(groupedAttachments);
      onAttachmentsChange && onAttachmentsChange(groupedAttachments);
    } catch (error) {
      console.error('Error fetching attachments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attachments',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file, attachmentType) => {
    if (!file || !issueId) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload only image files',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload images smaller than 5MB',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }    try {
      setUploading(true);
      
      // Ensure we have a user ID
      if (!user?.id) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in to upload attachments',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      const response = await issueService.uploadIssueAttachment(issueId, file, attachmentType, user.id);
      
      if (response.status?.status === 'success') {
        toast({
          title: 'Upload Successful',
          description: `${attachmentTypeConfig[attachmentType]?.name} attachment uploaded successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Refresh attachments
        await fetchAllAttachments();
      } else {
        throw new Error(response.status?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload attachment',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await issueService.deleteIssueAttachment(issueId, deleteTarget.attachmentId);
      
      toast({
        title: 'Deleted',
        description: 'Attachment deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      await fetchAllAttachments();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete attachment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDeleteTarget(null);
      onDeleteClose();
    }
  };

  const openImagePreview = (attachment) => {
    setSelectedImage(attachment);
    onImageOpen();
  };

  const openDeleteDialog = (attachment) => {
    setDeleteTarget(attachment);
    onDeleteOpen();
  };  // Fetch individual attachment content and cache it
  const fetchAttachmentContent = async (attachment) => {
    const cacheKey = `${attachment.attachmentId}`;
    
    // Return cached version if available
    if (imageCache[cacheKey]) {
      return imageCache[cacheKey];
    }
    
    try {
      const response = await issueService.getIssueAttachment(issueId, attachment.attachmentId);
      const content = response.attachment?.content || response.content;
      
      if (content) {
        const imageSrc = `data:image/${attachment.fileType || 'jpeg'};base64,${content}`;
        setImageCache(prev => ({ ...prev, [cacheKey]: imageSrc }));
        return imageSrc;
      }
    } catch (error) {
      console.error('Failed to fetch attachment content:', error);
    }
    
    return null;
  };

  const getImageSrc = (attachment) => {
    // Debug log to see what data we're getting
    console.log('Attachment data:', attachment);
    
    if (attachment.content) {
      const mimeType = attachment.mimeType || attachment.mime_type || `image/${attachment.fileType || attachment.file_type || 'jpeg'}`;
      return `data:${mimeType};base64,${attachment.content}`;
    }
    
    // Check cache for lazy-loaded content
    const cacheKey = `${attachment.attachmentId}`;
    return imageCache[cacheKey] || null;
  };

  // Component for handling async image loading
  const AsyncImage = ({ attachment, ...props }) => {
    const [imageSrc, setImageSrc] = useState(getImageSrc(attachment));
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (!imageSrc && !loading) {
        setLoading(true);
        fetchAttachmentContent(attachment).then((src) => {
          setImageSrc(src);
          setLoading(false);
        });
      }
    }, [attachment.attachmentId]);

    if (loading) {
      return (
        <Center h="100%">
          <Spinner size="sm" />
        </Center>
      );
    }

    if (imageSrc) {
      return <Image src={imageSrc} {...props} />;
    }

    return (
      <Center h="100%">
        <FiImage size={24} color="gray" />
      </Center>
    );
  };

  const currentConfig = statusConfig[issueStatus] || statusConfig.open;
  const allowedTypes = currentConfig.allowedTypes;

  if (loading) {
    return (
      <Center p={8}>
        <Spinner size="lg" />
      </Center>
    );
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Status Header */}
        <Card>
          <CardHeader>
            <VStack align="start" spacing={2}>
              <Heading size="md">{currentConfig.title}</Heading>
              <Text color="gray.600" fontSize="sm">{currentConfig.description}</Text>
              <HStack>
                <Badge colorScheme="blue" variant="subtle">
                  {issueStatus.toUpperCase()}
                </Badge>
                <Text fontSize="xs" color="gray.500">
                  Allowed attachments: {allowedTypes.map(type => attachmentTypeConfig[type]?.name).join(', ')}
                </Text>
              </HStack>
            </VStack>
          </CardHeader>
        </Card>

        {/* Attachment Sections */}
        {allowedTypes.map(type => (
          <Card key={type}>
            <CardHeader>
              <Flex justify="space-between" align="center">
                <HStack>
                  <Text fontSize="lg">
                    {attachmentTypeConfig[type]?.icon} {attachmentTypeConfig[type]?.name}
                  </Text>
                  <Badge colorScheme={attachmentTypeConfig[type]?.color} variant="outline">
                    {attachments[type]?.length || 0} files
                  </Badge>
                </HStack>
                
                {!readonly && (
                  <Button
                    size="sm"
                    leftIcon={<FiUpload />}
                    colorScheme={attachmentTypeConfig[type]?.color}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) handleFileUpload(file, type);
                      };
                      input.click();
                    }}
                    isLoading={uploading}
                  >
                    Upload
                  </Button>
                )}
              </Flex>
              <Text fontSize="sm" color="gray.600" mt={2}>
                {attachmentTypeConfig[type]?.description}
              </Text>
            </CardHeader>
            
            <CardBody>
              {attachments[type]?.length > 0 ? (
                <Grid templateColumns="repeat(auto-fill, minmax(150px, 1fr))" gap={4}>
                  {attachments[type].map((attachment, index) => (
                    <GridItem key={attachment.attachmentId || index}>
                      <Card size="sm" variant="outline">
                        <CardBody p={2}>
                          <VStack spacing={2}>
                            {/* Image Preview */}
                            <Box
                              position="relative"
                              w="100%"
                              h="100px"
                              bg="gray.100"
                              borderRadius="md"
                              overflow="hidden"                              cursor="pointer"
                              onClick={() => openImagePreview(attachment)}
                            >
                              <AsyncImage
                                attachment={attachment}
                                alt={attachment.fileName || attachment.filename}
                                w="100%"
                                h="100%"
                                objectFit="cover"
                              />
                              
                              {/* Primary Badge */}
                              {attachment.isPrimary && (
                                <Badge
                                  position="absolute"
                                  top={1}
                                  left={1}
                                  colorScheme="yellow"
                                  size="xs"
                                  display="flex"
                                  alignItems="center"
                                  gap={1}
                                >
                                  <FiStar size={10} />
                                  PRIMARY
                                </Badge>
                              )}
                            </Box>
                            
                            {/* File Info */}
                            <VStack spacing={1} w="100%">
                              <Text fontSize="xs" fontWeight="medium" noOfLines={1} w="100%">
                                {attachment.fileName || attachment.filename}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {Math.round((attachment.fileSizeBytes || attachment.file_size_bytes || 0) / 1024)}KB
                              </Text>
                            </VStack>
                            
                            {/* Actions */}
                            <HStack spacing={1} w="100%">
                              <Tooltip label="View">
                                <IconButton
                                  size="xs"
                                  icon={<FiEye />}
                                  onClick={() => openImagePreview(attachment)}
                                />
                              </Tooltip>
                              
                              {!readonly && (
                                <Tooltip label="Delete">
                                  <IconButton
                                    size="xs"
                                    icon={<FiTrash2 />}
                                    colorScheme="red"
                                    variant="ghost"
                                    onClick={() => openDeleteDialog(attachment)}
                                  />
                                </Tooltip>
                              )}
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    </GridItem>
                  ))}
                </Grid>
              ) : (
                <Center p={8} bg="gray.50" borderRadius="md" borderStyle="dashed" borderWidth="2px" borderColor="gray.300">
                  <VStack>
                    <FiImage size={32} color="gray" />
                    <Text color="gray.500" fontSize="sm">
                      No {attachmentTypeConfig[type]?.name.toLowerCase()} attachments yet
                    </Text>
                    {!readonly && (
                      <Text color="gray.400" fontSize="xs">
                        Click "Upload" to add images
                      </Text>
                    )}
                  </VStack>
                </Center>
              )}
            </CardBody>
          </Card>
        ))}
        
        {uploading && <Progress size="xs" isIndeterminate colorScheme="blue" />}
      </VStack>

      {/* Image Preview Modal */}
      <Modal isOpen={isImageOpen} onClose={onImageClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedImage?.fileName || selectedImage?.filename}
            {selectedImage?.isPrimary && (
              <Badge ml={2} colorScheme="yellow">
                <FiStar /> PRIMARY
              </Badge>
            )}
          </ModalHeader>
          <ModalCloseButton />          <ModalBody>
            {selectedImage && (
              <AsyncImage
                attachment={selectedImage}
                alt={selectedImage.fileName || selectedImage.filename}
                w="100%"
                borderRadius="md"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialog isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Delete Attachment</AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete "{deleteTarget?.fileName || deleteTarget?.filename}"?
              This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button onClick={onDeleteClose}>Cancel</Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default MultiImageAttachment;
