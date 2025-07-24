import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Card,
  CardBody,
  CardHeader,
  Image,
  Badge,
  Grid,
  GridItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useColorModeValue,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tooltip,
  Link,
  Flex,
  Tag,
  TagLabel,
  SimpleGrid
} from '@chakra-ui/react';
import {
  FaImage,
  FaEye,
  FaDownload,
  FaCalendarAlt,
  FaUser,
  FaFileImage,
  FaExpand,
  FaClock,
  FaTag,
  FaComment
} from 'react-icons/fa';
import { formatDateTime } from '../../utils/dateUtils';

const WorkflowImageViewer = ({
  attachments = [],
  currentStatus = 'open',
  showTitle = true,
  groupByPhase = true,
  allowDownload = true,
  allowFullscreen = true,
  compact = false
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Group attachments by workflow phase
  const groupedAttachments = groupByPhase ? groupAttachmentsByPhase(attachments) : { all: attachments };

  // Status phase mapping
  const statusPhases = {
    'open': 'Initial Report',
    'in_progress': 'Progress Updates',
    'resolved': 'Resolution Evidence',
    'closed': 'Final Verification'
  };

  // Phase colors
  const phaseColors = {
    'open': 'red',
    'in_progress': 'yellow',
    'resolved': 'green',
    'closed': 'blue'
  };
  function groupAttachmentsByPhase(attachments) {
    const grouped = {
      'open': [],
      'in_progress': [],
      'resolved': [],
      'closed': []
    };

    attachments.forEach(attachment => {
      // Determine phase based on attachment type or status
      let phase = attachment.status_phase || attachment.statusPhase;
      
      if (!phase) {
        // Map attachment type to workflow phase
        const attachmentType = attachment.attachment_type || attachment.attachmentType || 'evidence';
        switch (attachmentType) {
          case 'evidence':
          case 'initial':
          case 'report':
            phase = 'open';
            break;
          case 'progress':
          case 'work_in_progress':
            phase = 'in_progress';
            break;
          case 'completion':
          case 'resolved':
          case 'before_after':
            phase = 'resolved';
            break;
          case 'feedback':
          case 'verification':
          case 'satisfaction':
            phase = 'closed';
            break;
          default:
            phase = 'open'; // Default to initial report
        }
      }
      
      if (grouped[phase]) {
        grouped[phase].push(attachment);
      } else {
        // If unknown phase, add to open
        grouped['open'].push(attachment);
      }
    });

    return grouped;
  }

  const openImageModal = (attachment) => {
    setSelectedImage(attachment);
    onOpen();
  };
  const downloadImage = async (attachment) => {
    try {
      // Build proper image URL - handle multiple field name formats
      let imageUrl = attachment.file_url || attachment.fileUrl || attachment.filePath || attachment.file_path;
      
      // If no direct URL, try to construct from base64 content
      if (!imageUrl && attachment.content) {
        const fileType = attachment.file_type || attachment.fileType || attachment.mimeType || 'image/jpeg';
        imageUrl = `data:${fileType};base64,${attachment.content}`;
      }
      
      // If no content, try to build API URL
      if (!imageUrl && (attachment.id || attachment.attachmentId || attachment.attachment_id)) {
        const attachmentId = attachment.id || attachment.attachmentId || attachment.attachment_id;
        imageUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1'}/issues/attachments/${attachmentId}`;
      }
      
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.file_name || attachment.fileName || 'attachment.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const renderImageCard = (attachment, index) => {
    // Build proper image URL - handle multiple field name formats
    let imageUrl = attachment.file_url || attachment.fileUrl || attachment.filePath || attachment.file_path;
    
    // If no direct URL, try to construct from base64 content
    if (!imageUrl && attachment.content) {
      const fileType = attachment.file_type || attachment.fileType || attachment.mimeType || 'image/jpeg';
      imageUrl = `data:${fileType};base64,${attachment.content}`;
    }
    
    // If no content, try to build API URL
    if (!imageUrl && (attachment.id || attachment.attachmentId || attachment.attachment_id)) {
      const attachmentId = attachment.id || attachment.attachmentId || attachment.attachment_id;
      imageUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1'}/issues/attachments/${attachmentId}`;
    }
    
    // Fallback to placeholder if still no URL
    if (!imageUrl) {
      imageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjYWFhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PC9zdmc+';
    }
    
    return (
      <Card
        key={attachment.id || index}
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        overflow="hidden"
        cursor="pointer"
        _hover={{ transform: 'scale(1.02)', transition: 'transform 0.2s' }}
        onClick={() => openImageModal(attachment)}
      >
        <Box position="relative">
          <Image
            src={imageUrl}
            alt={attachment.file_name || attachment.fileName}
            w="100%"
            h={compact ? "120px" : "150px"}
            objectFit="cover"
            fallback={
              <Flex
                align="center"
                justify="center"
                h={compact ? "120px" : "150px"}
                bg="gray.100"
                color="gray.500"
              >
                <Icon as={FaFileImage} w={8} h={8} />
              </Flex>
            }
          />
          
          {/* Primary badge */}
          {attachment.is_primary && (
            <Badge
              position="absolute"
              top={2}
              left={2}
              colorScheme="blue"
              variant="solid"
              fontSize="xs"
            >
              Primary
            </Badge>
          )}

          {/* Action overlay */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.600"
            opacity={0}
            _hover={{ opacity: 1 }}
            transition="opacity 0.2s"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <HStack spacing={2}>
              {allowFullscreen && (
                <Button
                  size="sm"
                  colorScheme="blue"
                  variant="solid"
                  leftIcon={<FaEye />}
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageModal(attachment);
                  }}
                >
                  View
                </Button>
              )}
              {allowDownload && (
                <Button
                  size="sm"
                  colorScheme="gray"
                  variant="solid"
                  leftIcon={<FaDownload />}
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadImage(attachment);
                  }}
                >
                  Download
                </Button>
              )}
            </HStack>
          </Box>
        </Box>

        {!compact && (
          <CardBody p={3}>
            <VStack spacing={2} align="start">
              <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                {attachment.file_name || attachment.fileName || 'Attachment'}
              </Text>
              
              {/* Metadata */}
              <VStack spacing={1} align="start" w="100%">
                {attachment.context_description && (
                  <Text fontSize="xs" color={textColor} noOfLines={2}>
                    {attachment.context_description}
                  </Text>
                )}
                
                <HStack spacing={2} fontSize="xs" color="gray.500">
                  <Icon as={FaCalendarAlt} />
                  <Text>
                    {formatDateTime(attachment.uploaded_at || attachment.uploadedAt || new Date())}
                  </Text>
                </HStack>
                
                {attachment.uploaded_by_name && (
                  <HStack spacing={2} fontSize="xs" color="gray.500">
                    <Icon as={FaUser} />
                    <Text noOfLines={1}>
                      {attachment.uploaded_by_name}
                    </Text>
                  </HStack>
                )}
              </VStack>
            </VStack>
          </CardBody>
        )}
      </Card>
    );
  };

  const renderPhaseSection = (phase, attachments) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <Box key={phase}>
        <HStack spacing={3} mb={4}>
          <Badge
            colorScheme={phaseColors[phase] || 'gray'}
            variant="solid"
            px={3}
            py={1}
            borderRadius="full"
          >
            {statusPhases[phase] || phase.replace('_', ' ').toUpperCase()}
          </Badge>
          <Text fontSize="sm" color={textColor}>
            {attachments.length} image{attachments.length !== 1 ? 's' : ''}
          </Text>
        </HStack>
        
        <Grid
          templateColumns={compact ? "repeat(auto-fill, minmax(150px, 1fr))" : "repeat(auto-fill, minmax(200px, 1fr))"}
          gap={4}
          mb={6}
        >
          {attachments.map((attachment, index) => renderImageCard(attachment, index))}
        </Grid>
      </Box>
    );
  };

  if (!attachments || attachments.length === 0) {
    return (
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardBody textAlign="center" py={8}>
          <Icon as={FaFileImage} w={12} h={12} color="gray.400" mb={4} />
          <Text color={textColor}>No images attached</Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Box>
      {showTitle && (
        <Text fontSize="lg" fontWeight="semibold" mb={4}>
          Attached Images ({attachments.length})
        </Text>
      )}

      {groupByPhase ? (
        <VStack spacing={6} align="stretch">
          {Object.entries(groupedAttachments).map(([phase, phaseAttachments]) =>
            renderPhaseSection(phase, phaseAttachments)
          )}
        </VStack>
      ) : (
        <Grid
          templateColumns={compact ? "repeat(auto-fill, minmax(150px, 1fr))" : "repeat(auto-fill, minmax(200px, 1fr))"}
          gap={4}
        >
          {attachments.map((attachment, index) => renderImageCard(attachment, index))}
        </Grid>
      )}

      {/* Image Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent maxW="90vw" maxH="90vh">
          <ModalHeader>
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text>{selectedImage?.file_name || selectedImage?.fileName || 'Image'}</Text>
                <HStack spacing={4} fontSize="sm" color={textColor}>
                  <HStack>
                    <Icon as={FaCalendarAlt} />
                    <Text>
                      {formatDateTime(selectedImage?.uploaded_at || selectedImage?.uploadedAt || new Date())}
                    </Text>
                  </HStack>
                  {selectedImage?.uploaded_by_name && (
                    <HStack>
                      <Icon as={FaUser} />
                      <Text>{selectedImage.uploaded_by_name}</Text>
                    </HStack>
                  )}
                </HStack>
              </VStack>
              {allowDownload && selectedImage && (
                <Button
                  leftIcon={<FaDownload />}
                  onClick={() => downloadImage(selectedImage)}
                  colorScheme="blue"
                  variant="outline"
                >
                  Download
                </Button>
              )}
            </HStack>
          </ModalHeader>
          <ModalCloseButton />          <ModalBody pb={6}>
            {selectedImage && (
              <VStack spacing={4}>
                <Image
                  src={(() => {
                    // Build proper image URL for modal view
                    let imageUrl = selectedImage.file_url || selectedImage.fileUrl || selectedImage.filePath || selectedImage.file_path;
                    
                    // If no direct URL, try to construct from base64 content
                    if (!imageUrl && selectedImage.content) {
                      const fileType = selectedImage.file_type || selectedImage.fileType || selectedImage.mimeType || 'image/jpeg';
                      imageUrl = `data:${fileType};base64,${selectedImage.content}`;
                    }
                    
                    // If no content, try to build API URL
                    if (!imageUrl && (selectedImage.id || selectedImage.attachmentId || selectedImage.attachment_id)) {
                      const attachmentId = selectedImage.id || selectedImage.attachmentId || selectedImage.attachment_id;
                      imageUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1'}/issues/attachments/${attachmentId}`;
                    }
                    
                    return imageUrl;
                  })()}
                  alt={selectedImage.file_name || selectedImage.fileName}
                  maxW="100%"
                  maxH="70vh"
                  objectFit="contain"
                />
                
                {selectedImage.context_description && (
                  <Card w="100%" bg={cardBg}>
                    <CardBody>
                      <HStack>
                        <Icon as={FaComment} color="blue.500" />
                        <Text fontWeight="medium">Description:</Text>
                      </HStack>
                      <Text mt={2} color={textColor}>
                        {selectedImage.context_description}
                      </Text>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default WorkflowImageViewer;
