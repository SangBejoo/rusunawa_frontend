import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  VStack,
  HStack,
  Text,
  Button,  Badge,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Icon,
  useColorModeValue,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Textarea,
  Select,  Progress,
  Spinner,
  Box,
  Flex,  Image,
  AspectRatio,
  Center,
  IconButton,
  SimpleGrid
} from '@chakra-ui/react';
import {
  FaCalendarAlt,
  FaUser,
  FaTools,
  FaExclamationTriangle,
  FaClock,
  FaImage,
  FaCheck,
  FaArrowRight,  FaComment,
  FaHistory,
  FaTimes,
  FaTrash,
  FaEye
} from 'react-icons/fa';
import { formatDate, formatDateTime } from '../../../utils/dateUtils';
import issueService from '../../services/issueService';
import WorkflowImageViewer from '../../../shared/components/WorkflowImageViewer';
import IssueHistoryAndComments from '../issue/IssueHistoryAndComments';

const EnhancedIssueDetailModal = ({ isOpen, onClose, issue, onIssueUpdated, currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
    // Multi-attachments state
  const [issueAttachments, setIssueAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);  // Image preview modal state
  const [previewImage, setPreviewImage] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const toast = useToast();
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');  useEffect(() => {
    if (issue) {
      // Load issue attachments and history
      loadIssueAttachments();
      loadIssueStatusHistory();
    }
  }, [issue]);  const loadIssueAttachments = async () => {
    // Get issue ID from various possible field names
    const issueId = issue?.issueId || issue?.id || issue?.issue_id;
    if (!issue || !issueId) return;
    
    setLoadingAttachments(true);
    try {
      console.log('Loading attachments for issue:', issueId);
      console.log('Issue object:', issue);
      console.log('Has image attachment check:', {
        hasImageAttachment: issue.hasImageAttachment,
        has_image_attachment: issue.has_image_attachment,
        imageFileUrl: issue.imageFileUrl,
        imageFileType: issue.imageFileType
      });
      
      // Fetch attachments from new system (issue_attachments table)
      const attachmentsResponse = await issueService.getIssueAttachments(issueId);
      const attachmentsData = attachmentsResponse.attachments || [];
      
      // Try to fetch legacy image (issue_images table) 
      // Check multiple conditions to ensure we catch the legacy image
      let legacyImage = null;
      const hasLegacyImage = issue.hasImageAttachment || 
                            issue.has_image_attachment || 
                            issue.imageFileUrl || 
                            issue.imageFileType;
      
      console.log('Attempting to fetch legacy image, conditions met:', hasLegacyImage);
      
      if (hasLegacyImage) {
        try {
          console.log('Fetching legacy image for issue:', issueId);
          const legacyImageResponse = await issueService.getIssueImage(issueId);
          console.log('Legacy image response:', legacyImageResponse);
          
          if (legacyImageResponse.content) {
            legacyImage = {
              attachmentId: `legacy_${issueId}`,
              issueId: issueId,
              uploadedBy: issue.reportedBy || issue.reported_by,
              fileName: `issue_${issueId}_report_image`,
              fileType: legacyImageResponse.fileType || issue.imageFileType || 'image/jpeg',
              fileSizeBytes: 0,
              mimeType: legacyImageResponse.fileType || issue.imageFileType || 'image/jpeg',
              attachmentType: 'report',
              isPrimary: true,
              uploadedAt: issue.reportedAt || issue.reported_at,
              content: legacyImageResponse.content,
              contextDescription: 'Initial report evidence (legacy)',
              id: `legacy_${issueId}`,
              file_name: `issue_${issueId}_report_image`,
              file_type: legacyImageResponse.fileType || issue.imageFileType || 'image/jpeg',
              uploaded_at: issue.reportedAt || issue.reported_at,
              attachment_type: 'report',
              is_primary: true
            };
            console.log('Legacy image loaded successfully:', legacyImage);
          } else {
            console.log('Legacy image response has no content');
          }
        } catch (legacyError) {
          console.log('No legacy image found or error fetching:', legacyError);
          // Even if metadata suggests there should be an image, try anyway
          // This handles cases where metadata might be inconsistent
          try {
            console.log('Attempting fallback legacy image fetch...');
            const fallbackResponse = await issueService.getIssueImage(issueId);
            if (fallbackResponse && fallbackResponse.content) {
              legacyImage = {
                attachmentId: `legacy_${issueId}`,
                issueId: issueId,
                uploadedBy: issue.reportedBy || issue.reported_by,
                fileName: `issue_${issueId}_report_image`,
                fileType: fallbackResponse.fileType || 'image/jpeg',
                fileSizeBytes: 0,
                mimeType: fallbackResponse.fileType || 'image/jpeg',
                attachmentType: 'report',
                isPrimary: true,
                uploadedAt: issue.reportedAt || issue.reported_at,
                content: fallbackResponse.content,
                contextDescription: 'Initial report evidence (legacy - fallback)',
                id: `legacy_${issueId}`,
                file_name: `issue_${issueId}_report_image`,
                file_type: fallbackResponse.fileType || 'image/jpeg',
                uploaded_at: issue.reportedAt || issue.reported_at,
                attachment_type: 'report',
                is_primary: true
              };
              console.log('Fallback legacy image loaded successfully');
            }
          } catch (fallbackError) {
            console.log('Fallback legacy image fetch also failed:', fallbackError);
          }
        }
      } else {
        // Even if no metadata suggests an image exists, try anyway for all issues
        // This ensures we don't miss images due to metadata inconsistencies
        try {
          console.log('No image metadata found, but trying anyway for issue:', issueId);
          const legacyImageResponse = await issueService.getIssueImage(issueId);
          if (legacyImageResponse && legacyImageResponse.content) {
            legacyImage = {
              attachmentId: `legacy_${issueId}`,
              issueId: issueId,
              uploadedBy: issue.reportedBy || issue.reported_by,
              fileName: `issue_${issueId}_report_image`,
              fileType: legacyImageResponse.fileType || 'image/jpeg',
              fileSizeBytes: 0,
              mimeType: legacyImageResponse.fileType || 'image/jpeg',
              attachmentType: 'report',
              isPrimary: true,
              uploadedAt: issue.reportedAt || issue.reported_at,
              content: legacyImageResponse.content,
              contextDescription: 'Initial report evidence (found despite no metadata)',
              id: `legacy_${issueId}`,
              file_name: `issue_${issueId}_report_image`,
              file_type: legacyImageResponse.fileType || 'image/jpeg',
              uploaded_at: issue.reportedAt || issue.reported_at,
              attachment_type: 'report',
              is_primary: true
            };
            console.log('Legacy image found despite no metadata:', legacyImage);
          }
        } catch (noMetadataError) {
          console.log('No legacy image found (no metadata):', noMetadataError);
        }
      }

      // Process new system attachments and load their content
      const enrichedAttachments = [];
      
      // Add legacy image first if exists
      if (legacyImage) {
        enrichedAttachments.push(legacyImage);
      }

      // Load content for new attachments
      for (const attachment of attachmentsData) {
        try {
          // Get the actual image content
          const contentResponse = await issueService.getAttachmentContent(attachment.attachmentId);
          
          // Add content to attachment
          const enrichedAttachment = {
            ...attachment,
            content: contentResponse.content,
            contentType: contentResponse.fileType,
            contentEncoding: contentResponse.contentEncoding
          };
          
          enrichedAttachments.push(enrichedAttachment);
        } catch (contentError) {
          console.error('Error loading content for attachment:', attachment.attachmentId, contentError);
          // Add attachment without content
          enrichedAttachments.push(attachment);
        }
      }
      
      console.log('Loaded attachments with content:', enrichedAttachments);
      setIssueAttachments(enrichedAttachments);
    } catch (error) {
      console.error('Error loading issue attachments:', error);
      setIssueAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  };  const loadIssueStatusHistory = async () => {
    // Get issue ID from various possible field names
    const issueId = issue?.issueId || issue?.id || issue?.issue_id;
    if (!issue || !issueId) return;
    
    setLoadingHistory(true);
    try {
      // Try to get status history from API (may not be implemented yet)
      const response = await issueService.getIssueStatusHistory?.(issueId);
      if (response?.history && Array.isArray(response.history)) {
        setStatusHistory(response.history);
      } else {
        throw new Error('Status history API not available');
      }
    } catch (error) {
      console.log('Status history API not implemented, using fallback:', error.message);
      // Create a comprehensive fallback history from current issue data
      const fallbackHistory = [
        {
          status: 'open',
          updatedByName: issue.reporterName || issue.reporter_name || 'System',
          updatedAt: issue.reportedAt || issue.reported_at || new Date().toISOString(),
          notes: `Issue reported: ${issue.description?.substring(0, 100)}${issue.description?.length > 100 ? '...' : ''}`
        }
      ];
      
      // Add status progression if issue is not in 'open' state
      if (issue.status && issue.status !== 'open') {
        if (issue.status === 'in_progress' || issue.status === 'resolved' || issue.status === 'closed') {
          fallbackHistory.push({
            status: 'in_progress',
            updatedByName: issue.assignedToName || issue.assigned_to_name || 'Admin',
            updatedAt: issue.assignedAt || issue.assigned_at || new Date().toISOString(),
            notes: 'Issue assigned and work started'
          });
        }
        
        if (issue.status === 'resolved' || issue.status === 'closed') {
          fallbackHistory.push({
            status: 'resolved',
            updatedByName: issue.lastUpdatedBy || 'Admin',
            updatedAt: issue.resolvedAt || issue.resolved_at || new Date().toISOString(),
            notes: issue.lastUpdateNotes || 'Issue resolved'
          });
        }
        
        if (issue.status === 'closed') {
          fallbackHistory.push({
            status: 'closed',
            updatedByName: issue.completionVerifiedBy || 'Admin',
            updatedAt: issue.completionVerifiedAt || issue.completion_verified_at || new Date().toISOString(),
            notes: 'Issue closed and verified'
          });
        }
      }
      
      setStatusHistory(fallbackHistory);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'red';
      case 'in_progress': return 'yellow';
      case 'resolved': return 'green';
      case 'closed': return 'gray';
      default: return 'gray';
    }
  };

  // Priority color mapping
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  // Priority label translation to Indonesian
  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'Mendesak';
      case 'medium': return 'Segera';
      case 'low': return 'Biasa';
      default: return 'Tidak Diketahui';
    }
  };
  // Get status progress percentage
  const getStatusProgress = (status) => {
    switch (status) {
      case 'open': return 25;
      case 'in_progress': return 50;
      case 'resolved': return 75;
      case 'closed': return 100;
      default: return 0;
    }
  };

  // Helper function to get attachment type icon and color
  const getAttachmentTypeIcon = (attachmentType) => {
    switch (attachmentType) {
      case 'evidence': return { icon: FaExclamationTriangle, color: 'red.500', label: 'Initial Evidence' };
      case 'progress': return { icon: FaTools, color: 'yellow.500', label: 'Work Progress' };
      case 'completion': return { icon: FaCheck, color: 'green.500', label: 'Completion Proof' };
      case 'feedback': return { icon: FaComment, color: 'blue.500', label: 'Tenant Feedback' };
      default: return { icon: FaImage, color: 'gray.500', label: 'General' };
    }
  };
  // Organize attachments by status/type - refactored to ensure no duplication and correct precedence
  const getAttachmentsByType = () => {
    // Precedence: report > progress > completion > feedback > other
    const categorized = {
      evidence: [],
      progress: [],
      completion: [],
      feedback: [],
      other: []
    };
    const seen = new Set();
    issueAttachments.forEach(att => {
      const id = att.attachmentId || att.id || att.fileName;
      if (seen.has(id)) return;
      if (att.attachmentType === 'report' || att.attachmentType === 'evidence') {
        categorized.evidence.push(att);
      } else if (att.attachmentType === 'progress') {
        categorized.progress.push(att);
      } else if (att.attachmentType === 'completion') {
        categorized.completion.push(att);
      } else if (att.attachmentType === 'feedback') {
        categorized.feedback.push(att);
      } else {
        categorized.other.push(att);
      }
      seen.add(id);
    });
    return categorized;
  };  // Get attachment URL for display - now handles base64 content
  const getAttachmentUrl = (attachment) => {
    // For preview, we need to fetch the base64 content and convert to data URL
    return null; // We'll handle this differently with a component
  };

  // Image preview functions
  const openImagePreview = (attachment) => {
    setPreviewImage(attachment);
    setIsPreviewOpen(true);
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
    setIsPreviewOpen(false);
  };
  // Component to handle image display with base64 content (already loaded)
  const AttachmentImage = ({ attachment, ...props }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
      try {
        setLoading(true);
        
        if (attachment.content) {
          // We already have the content from our loadIssueAttachments function
          const mimeType = attachment.fileType || attachment.mimeType || 'image/jpeg';
          const dataUrl = `data:${mimeType};base64,${attachment.content}`;
          setImageSrc(dataUrl);
        } else {
          // Fallback for attachments without content loaded
          console.warn('Attachment without content:', attachment);
          setError(true);
        }
      } catch (err) {
        console.error('Error processing attachment content:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }, [attachment]);

    if (loading) {
      return (
        <Center bg="gray.100" {...props}>
          <Spinner size="sm" />
        </Center>
      );
    }

    if (error || !imageSrc) {
      return (
        <Center bg="gray.100" {...props}>
          <Icon as={FaImage} boxSize={6} color="gray.400" />
        </Center>
      );
    }    return (
      <Image
        src={imageSrc}
        alt={attachment.fileName}
        objectFit="cover"
        {...props}
      />
    );
  };

  // Image Preview Modal Component
  const ImagePreviewModal = ({ isOpen, onClose, attachment }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);    useEffect(() => {
      if (!attachment || !isOpen) return;

      const fetchImageContent = async () => {
        setLoading(true);
        setError(false);
        try {
          // If attachment already has content, use it directly
          if (attachment.content) {
            const mimeType = attachment.fileType || attachment.mimeType || 'image/jpeg';
            const dataUrl = `data:${mimeType};base64,${attachment.content}`;
            setImageSrc(dataUrl);
            setLoading(false);
            return;
          }

          // For legacy images (with prefix 'legacy_')
          if (attachment.attachmentId && attachment.attachmentId.startsWith('legacy_')) {
            console.log('Fetching legacy image content for preview:', attachment);
            const response = await issueService.getIssueImage(attachment.issueId);
            
            if (response.content) {
              const mimeType = response.fileType || attachment.fileType || 'image/jpeg';
              const dataUrl = `data:${mimeType};base64,${response.content}`;
              setImageSrc(dataUrl);
            } else {
              setError(true);
            }
          } else {
            // For new attachment system
            console.log('Fetching attachment content for preview:', attachment.attachmentId);
            const response = await issueService.getAttachmentContent(attachment.attachmentId);
            
            if (response.content) {
              const mimeType = response.fileType || attachment.fileType || attachment.mimeType || 'image/jpeg';
              const dataUrl = `data:${mimeType};base64,${response.content}`;
              setImageSrc(dataUrl);
            } else {
              setError(true);
            }
          }
        } catch (err) {
          console.error('Error fetching image content:', err);
          setError(true);
        } finally {
          setLoading(false);
        }
      };

      fetchImageContent();
    }, [attachment, isOpen]);

    return (
      <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent maxW="90vw" maxH="90vh" bg="transparent" boxShadow="none">
          <ModalHeader color="white" textAlign="center">
            <VStack spacing={2}>
              <Text fontSize="lg" fontWeight="bold">
                {attachment?.fileName}
              </Text>
              <HStack spacing={4} fontSize="sm" opacity={0.8}>
                <Text>Size: {attachment?.fileSizeBytes ? `${(attachment.fileSizeBytes / 1024).toFixed(1)} KB` : 'Unknown'}</Text>
                <Text>Type: {attachment?.fileType}</Text>
                <Text>Uploaded: {attachment?.uploadedAt ? formatDateTime(attachment.uploadedAt) : 'Unknown'}</Text>
              </HStack>
            </VStack>
          </ModalHeader>
          <ModalCloseButton color="white" size="lg" />
          
          <ModalBody p={4}>
            <Center>
              {loading ? (
                <VStack spacing={4} color="white">
                  <Spinner size="xl" />
                  <Text>Loading image...</Text>
                </VStack>
              ) : error || !imageSrc ? (
                <VStack spacing={4} color="white">
                  <Icon as={FaImage} boxSize="4em" opacity={0.5} />
                  <Text>Failed to load image</Text>
                  <Text fontSize="sm" opacity={0.7}>
                    The image could not be displayed
                  </Text>
                </VStack>
              ) : (
                <Box maxW="100%" maxH="70vh" overflow="hidden">
                  <Image
                    src={imageSrc}
                    alt={attachment?.fileName}
                    maxW="100%"
                    maxH="70vh"
                    objectFit="contain"
                    borderRadius="lg"
                    boxShadow="2xl"
                  />
                </Box>
              )}
            </Center>
          </ModalBody>          <ModalFooter justifyContent="center">
            <Button 
              onClick={onClose}
              variant="solid" 
              colorScheme="gray"
              size="lg"
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  if (!issue) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent maxW="95vw" maxH="90vh">
          <ModalHeader>
            <VStack align="start" spacing={2}>
              <HStack spacing={4}>
                <Text>Issue #{issue.issueId}</Text>
                <Badge colorScheme={getStatusColor(issue.status)} variant="solid" px={3} py={1}>
                  {(issue.status || 'pending').replace('_', ' ').toUpperCase()}
                </Badge>
                {issue.priority && (
                  <Badge colorScheme={getPriorityColor(issue.priority)} variant="outline" px={3} py={1}>
                    {getPriorityLabel(issue.priority).toUpperCase()}
                  </Badge>
                )}
              </HStack>
              
              {/* Progress Bar */}
              <Box w="100%">
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="medium">Progress</Text>
                  <Text fontSize="sm" color={textColor}>
                    {getStatusProgress(issue.status)}% Complete
                  </Text>
                </HStack>
                <Progress 
                  value={getStatusProgress(issue.status)} 
                  colorScheme={getStatusColor(issue.status)}
                  hasStripe
                  isAnimated
                />
              </Box>
            </VStack>
          </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <Tabs index={activeTab} onChange={setActiveTab}>            <TabList>
              <Tab>Issue Details</Tab>
              <Tab>Images by Status</Tab>
              <Tab>History & Comments</Tab>
            </TabList>

            <TabPanels>
              {/* Issue Details Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  {/* Basic Info */}
                  <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                    <CardHeader>
                      <Text fontWeight="semibold">Issue Information</Text>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Text fontSize="lg" fontWeight="medium">
                          {issue.title || 'Maintenance Request'}
                        </Text>
                        <Text color={textColor} whiteSpace="pre-line">
                          {issue.description || 'No description provided'}
                        </Text>
                        
                        <Divider />
                        
                        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                          <Stat>
                            <StatLabel>Booking ID</StatLabel>
                            <StatNumber fontSize="md">
                              {issue.bookingId ? `#${issue.bookingId}` : 'N/A'}
                            </StatNumber>
                          </Stat>
                          <Stat>
                            <StatLabel>Tenant ID</StatLabel>
                            <StatNumber fontSize="md">
                              {issue.tenantId ? `#${issue.tenantId}` : 'N/A'}
                            </StatNumber>
                          </Stat>
                          <Stat>
                            <StatLabel>Location</StatLabel>
                            <StatNumber fontSize="md">
                              {issue.location || (issue.description && issue.description.match(/Location:\s*(.*)/i)?.[1]) || 'N/A'}
                            </StatNumber>
                          </Stat>
                          <Stat>
                            <StatLabel>Contact</StatLabel>
                            <StatNumber fontSize="md">
                              {issue.contact || (issue.description && issue.description.match(/Contact:\s*(.*)/i)?.[1]) || 'N/A'}
                            </StatNumber>
                          </Stat>
                          <Stat>
                            <StatLabel>Category</StatLabel>
                            <StatNumber fontSize="md">
                              {issue.category || 'General'}
                            </StatNumber>
                          </Stat>
                          <Stat>
                            <StatLabel>Priority</StatLabel>
                            <StatNumber fontSize="md">
                              <Badge colorScheme={getPriorityColor(issue.priority)}>
                                {getPriorityLabel(issue.priority || 'medium').toUpperCase()}
                              </Badge>
                            </StatNumber>
                          </Stat>
                          <Stat>
                            <StatLabel>Status</StatLabel>
                            <StatNumber fontSize="md">
                              <Badge colorScheme={getStatusColor(issue.status)} variant="solid">
                               {(issue.status || 'open').replace('_', ' ').toUpperCase()
                              }</Badge>
                            </StatNumber>
                          </Stat>
                          <Stat>
                            <StatLabel>Reported By</StatLabel>
                            <StatNumber fontSize="md">
                              {issue.reporterName || issue.reporter_name || (issue.reportedBy ? `User #${issue.reportedBy}` : 'Unknown')}
                            </StatNumber>
                          </Stat>
                          <Stat>
                            <StatLabel>Reported Date</StatLabel>
                            <StatNumber fontSize="md">
                              {issue.reportedAt ? formatDate(issue.reportedAt) : 'Unknown'}
                            </StatNumber>
                          </Stat>
                        </Grid>
                      </VStack>
                    </CardBody>
                  </Card>
                  
                  {/* Location Information */}
                  {(issue.roomNumber || issue.roomType || issue.buildingName) && (
                    <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                      <CardHeader>
                        <Text fontWeight="semibold">Location Details</Text>
                      </CardHeader>
                      <CardBody>
                        <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                          {issue.buildingName && (
                            <Stat>
                              <StatLabel>Building</StatLabel>
                              <StatNumber fontSize="md">
                                {issue.buildingName}
                              </StatNumber>
                            </Stat>
                          )}
                          {issue.roomType && (
                            <Stat>
                              <StatLabel>Room Type</StatLabel>
                              <StatNumber fontSize="md">
                                {issue.roomType}
                              </StatNumber>
                            </Stat>
                          )}
                          {issue.floorNumber && (
                            <Stat>
                              <StatLabel>Floor</StatLabel>
                              <StatNumber fontSize="md">
                                Floor {issue.floorNumber}
                              </StatNumber>
                            </Stat>
                          )}
                        </Grid>
                      </CardBody>
                    </Card>
                  )}
                  
                  {/* Assignee Information */}
                  {(issue.assigneeName || issue.assignee_name) && (
                    <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                      <CardHeader>
                        <Text fontWeight="semibold">Assignment Details</Text>
                      </CardHeader>
                      <CardBody>
                        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                          <Stat>
                            <StatLabel>Assigned To</StatLabel>
                            <StatNumber fontSize="md">
                              {issue.assigneeName || issue.assignee_name}
                            </StatNumber>
                          </Stat>
                          {(issue.assignedAt || issue.assigned_at) && (
                            <Stat>
                              <StatLabel>Assigned Date</StatLabel>
                              <StatNumber fontSize="md">
                                {formatDate(issue.assignedAt || issue.assigned_at)}
                              </StatNumber>
                            </Stat>
                          )}
                        </Grid>
                      </CardBody>
                    </Card>
                  )}
                </VStack>
              </TabPanel>

              {/* Images by Status Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  {loadingAttachments ? (
                    <Center py={10}>
                      <VStack spacing={4}>
                        <Spinner size="xl" />
                        <Text>Loading images...</Text>
                      </VStack>
                    </Center>
                  ) : (
                    <>
                      {/* Report Images */}
                      {getAttachmentsByType().evidence.length > 0 && (
                        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                          <CardHeader>
                            <HStack spacing={2}>
                              <Icon as={FaExclamationTriangle} color="red.500" />
                              <Text fontWeight="semibold">Report Evidence</Text>
                              <Badge colorScheme="red" variant="outline">
                                {getAttachmentsByType().evidence.length} image(s)
                              </Badge>
                            </HStack>
                          </CardHeader>
                          <CardBody>
                            <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
                              {(() => {
                                let primaryShown = false;
                                return getAttachmentsByType().evidence.map((attachment, index) => {
                                  const showPrimary = attachment.isPrimary && !primaryShown;
                                  if (showPrimary) primaryShown = true;
                                  return (
                                    <Box key={attachment.attachmentId || `evidence_${index}`} position="relative">
                                      <AspectRatio ratio={1}>
                                        <Box>
                                          <AttachmentImage
                                            attachment={attachment}
                                            borderRadius="md"
                                            cursor="pointer"
                                            onClick={() => openImagePreview(attachment)}
                                            _hover={{ opacity: 0.8 }}
                                            transition="opacity 0.2s"
                                          />
                                          <IconButton
                                            icon={<FaEye />}
                                            size="sm"
                                            position="absolute"
                                            top={2}
                                            right={2}
                                            bg="blackAlpha.700"
                                            color="white"
                                            _hover={{ bg: 'blackAlpha.800' }}
                                            onClick={() => openImagePreview(attachment)}
                                          />
                                        </Box>
                                      </AspectRatio>
                                      <Text fontSize="xs" mt={2} noOfLines={2}>
                                        {attachment.fileName || 'Report Image'}
                                      </Text>
                                      {showPrimary && (
                                        <Badge colorScheme="blue" size="sm" mt={1}>
                                          Primary
                                        </Badge>
                                      )}
                                    </Box>
                                  );
                                });
                              })()}
                            </SimpleGrid>
                          </CardBody>
                        </Card>
                      )}

                      {/* Progress Images */}
                      {getAttachmentsByType().progress.length > 0 && (
                        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                          <CardHeader>
                            <HStack spacing={2}>
                              <Icon as={FaTools} color="yellow.500" />
                              <Text fontWeight="semibold">Work Progress</Text>
                              <Badge colorScheme="yellow" variant="outline">
                                {getAttachmentsByType().progress.length} image(s)
                              </Badge>
                            </HStack>
                          </CardHeader>
                          <CardBody>
                            <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
                              {(() => {
                                let primaryShown = false;
                                return getAttachmentsByType().progress.map((attachment, index) => {
                                  const showPrimary = attachment.isPrimary && !primaryShown;
                                  if (showPrimary) primaryShown = true;
                                  return (
                                    <Box key={attachment.attachmentId || `progress_${index}`} position="relative">
                                      <AspectRatio ratio={1}>
                                        <Box>
                                          <AttachmentImage
                                            attachment={attachment}
                                            borderRadius="md"
                                            cursor="pointer"
                                            onClick={() => openImagePreview(attachment)}
                                            _hover={{ opacity: 0.8 }}
                                            transition="opacity 0.2s"
                                          />
                                          <IconButton
                                            icon={<FaEye />}
                                            size="sm"
                                            position="absolute"
                                            top={2}
                                            right={2}
                                            bg="blackAlpha.700"
                                            color="white"
                                            _hover={{ bg: 'blackAlpha.800' }}
                                            onClick={() => openImagePreview(attachment)}
                                          />
                                        </Box>
                                      </AspectRatio>
                                      <Text fontSize="xs" mt={2} noOfLines={2}>
                                        {attachment.fileName || 'Progress Image'}
                                      </Text>
                                      {showPrimary && (
                                        <Badge colorScheme="blue" size="sm" mt={1}>
                                          Primary
                                        </Badge>
                                      )}
                                      <Text fontSize="xs" color={textColor}>
                                        {attachment.uploadedAt ? formatDateTime(attachment.uploadedAt) : ''}
                                      </Text>
                                    </Box>
                                  );
                                });
                              })()}
                            </SimpleGrid>
                          </CardBody>
                        </Card>
                      )}

                      {/* Completion Images */}
                      {getAttachmentsByType().completion.length > 0 && (
                        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                          <CardHeader>
                            <HStack spacing={2}>
                              <Icon as={FaCheck} color="green.500" />
                              <Text fontWeight="semibold">Completion Proof</Text>
                              <Badge colorScheme="green" variant="outline">
                                {getAttachmentsByType().completion.length} image(s)
                              </Badge>
                            </HStack>
                          </CardHeader>
                          <CardBody>
                            <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
                              {(() => {
                                let primaryShown = false;
                                return getAttachmentsByType().completion.map((attachment, index) => {
                                  const showPrimary = attachment.isPrimary && !primaryShown;
                                  if (showPrimary) primaryShown = true;
                                  return (
                                    <Box key={attachment.attachmentId || `completion_${index}`} position="relative">
                                      <AspectRatio ratio={1}>
                                        <Box>
                                          <AttachmentImage
                                            attachment={attachment}
                                            borderRadius="md"
                                            cursor="pointer"
                                            onClick={() => openImagePreview(attachment)}
                                            _hover={{ opacity: 0.8 }}
                                            transition="opacity 0.2s"
                                          />
                                          <IconButton
                                            icon={<FaEye />}
                                            size="sm"
                                            position="absolute"
                                            top={2}
                                            right={2}
                                            bg="blackAlpha.700"
                                            color="white"
                                            _hover={{ bg: 'blackAlpha.800' }}
                                            onClick={() => openImagePreview(attachment)}
                                          />
                                        </Box>
                                      </AspectRatio>
                                      <Text fontSize="xs" mt={2} noOfLines={2}>
                                        {attachment.fileName || 'Completion Image'}
                                      </Text>
                                      {showPrimary && (
                                        <Badge colorScheme="blue" size="sm" mt={1}>
                                          Primary
                                        </Badge>
                                      )}
                                      <Text fontSize="xs" color={textColor}>
                                        {attachment.uploadedAt ? formatDateTime(attachment.uploadedAt) : ''}
                                      </Text>
                                    </Box>
                                  );
                                });
                              })()}
                            </SimpleGrid>
                          </CardBody>
                        </Card>
                      )}

                      {/* Feedback Images */}
                      {getAttachmentsByType().feedback.length > 0 && (
                        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                          <CardHeader>
                            <HStack spacing={2}>
                              <Icon as={FaComment} color="blue.500" />
                              <Text fontWeight="semibold">Tenant Feedback</Text>
                              <Badge colorScheme="blue" variant="outline">
                                {getAttachmentsByType().feedback.length} image(s)
                              </Badge>
                            </HStack>
                          </CardHeader>
                          <CardBody>
                            <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
                              {(() => {
                                let primaryShown = false;
                                return getAttachmentsByType().feedback.map((attachment, index) => {
                                  const showPrimary = attachment.isPrimary && !primaryShown;
                                  if (showPrimary) primaryShown = true;
                                  return (
                                    <Box key={attachment.attachmentId || `feedback_${index}`} position="relative">
                                      <AspectRatio ratio={1}>
                                        <Box>
                                          <AttachmentImage
                                            attachment={attachment}
                                            borderRadius="md"
                                            cursor="pointer"
                                            onClick={() => openImagePreview(attachment)}
                                            _hover={{ opacity: 0.8 }}
                                            transition="opacity 0.2s"
                                          />
                                          <IconButton
                                            icon={<FaEye />}
                                            size="sm"
                                            position="absolute"
                                            top={2}
                                            right={2}
                                            bg="blackAlpha.700"
                                            color="white"
                                            _hover={{ bg: 'blackAlpha.800' }}
                                            onClick={() => openImagePreview(attachment)}
                                          />
                                        </Box>
                                      </AspectRatio>
                                      <Text fontSize="xs" mt={2} noOfLines={2}>
                                        {attachment.fileName || 'Feedback Image'}
                                      </Text>
                                      {showPrimary && (
                                        <Badge colorScheme="blue" size="sm" mt={1}>
                                          Primary
                                        </Badge>
                                      )}
                                      <Text fontSize="xs" color={textColor}>
                                        {attachment.uploadedAt ? formatDateTime(attachment.uploadedAt) : ''}
                                      </Text>
                                    </Box>
                                  );
                                });
                              })()}
                            </SimpleGrid>
                          </CardBody>
                        </Card>
                      )}

                      {/* No Images Message */}
                      {issueAttachments.length === 0 && (
                        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                          <CardBody>
                            <Center py={10}>
                              <VStack spacing={4}>
                                <Icon as={FaImage} boxSize="3em" color="gray.400" />
                                <Text color={textColor}>No images attached to this issue</Text>
                              </VStack>
                            </Center>
                          </CardBody>
                        </Card>
                      )}
                    </>
                  )}
                </VStack>
              </TabPanel>              {/* History & Comments Tab */}
              <TabPanel>
                <IssueHistoryAndComments
                  issue={issue}
                  currentUser={currentUser}
                  onCommentAdded={onIssueUpdated}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>

      {/* Image Preview Modal */}
      <ImagePreviewModal 
        isOpen={isPreviewOpen} 
        onClose={closeImagePreview} 
        attachment={previewImage} 
      />
    </>
  );
};

export default EnhancedIssueDetailModal;

