import React, { useState, useEffect } from 'react';
import { API_URL } from '../../utils/apiConfig';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Grid,
  Box,
  useToast,
  Spinner,
  Center,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Image,
  FormControl,
  FormLabel,
  Select,
  Textarea,
  Progress,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Input,
  SimpleGrid,
  AspectRatio,
  IconButton,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import {
  FiUser,
  FiCalendar,
  FiTool,
  FiZap,
  FiDroplet,
  FiWifi,
  FiThermometer,
  FiHome,
  FiAlertCircle,
  FiCheck,
  FiImage,
  FiFileText,
  FiActivity,
  FiEye,
  FiDownload,
  FiUpload,
  FiX,
  FiCheckCircle,
  FiClock
} from 'react-icons/fi';
import issueService from '../../services/issueService';
import MultiImageAttachment from '../attachments/MultiImageAttachment';
import { useAuth } from '../../context/authContext';

const IssueDetailModal = ({ isOpen, onClose, issue, onIssueUpdated }) => {
  const { user } = useAuth();  const [loading, setLoading] = useState(false);
  const [issueDetails, setIssueDetails] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [status, setStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [attachmentCount, setAttachmentCount] = useState(0);
  const [resolution, setResolution] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [completionAttachment, setCompletionAttachment] = useState(null);
  const [showCompletionUpload, setShowCompletionUpload] = useState(false);
  const { 
    isOpen: isImageModalOpen, 
    onOpen: onImageModalOpen, 
    onClose: onImageModalClose 
  } = useDisclosure();
  const { 
    isOpen: isStatusConfirmOpen, 
    onOpen: onStatusConfirmOpen, 
    onClose: onStatusConfirmClose 
  } = useDisclosure();
  const toast = useToast();  useEffect(() => {
    if (isOpen && issue) {
      const issueId = issue.issueId || issue.issue_id;
      if (issueId !== undefined && issueId !== null) {
        fetchIssueDetails();
      }
    }
  }, [isOpen, issue]);  const fetchIssueDetails = async () => {
    const issueId = issue?.issueId || issue?.issue_id;
    if (!issue || issueId === undefined || issueId === null) return;
    try {
      setLoading(true);
      // Use the direct API call to get complete issue details from /v1/issues/{issueId}
      const response = await fetch(`${API_URL}/issues/${issueId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
          // 'Authorization': `Bearer ${token}`
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // The API returns the issue data in the 'issue' field
      const issueData = data.issue;
      setIssueDetails(issueData);
      setStatus(issueData.status || issue.status);
      
      // Set attachments from the response
      if (data.attachments) {
        setAttachments(data.attachments);
        setAttachmentCount(data.attachments.length);
      }
      
      // Also fetch additional attachments using the service
      await fetchAttachments(issueId);
    } catch (error) {
      console.error('Error fetching issue details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch issue details',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachments = async (issueId) => {
    try {
      const response = await issueService.getIssueAttachments(issueId);
      const attachmentsList = response.attachments || [];
      setAttachments(attachmentsList);
      setAttachmentCount(attachmentsList.length);
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
    }
  };

  const handleImagePreview = async (attachmentId) => {
    try {
      // Use the correct endpoint that returns actual image bytes
      const response = await fetch(`${API_URL}/issue-attachments/${attachmentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      
      const data = await response.json();
      
      if (data.content) {
        // Create blob URL from base64 content
        const byteCharacters = atob(data.content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: data.fileType || 'image/jpeg' });
        const imageUrl = URL.createObjectURL(blob);
        
        setSelectedImage({
          url: imageUrl,
          filename: `attachment_${attachmentId}`,
          fileType: data.fileType
        });
        onImageModalOpen();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load image preview',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }  };

  const handleMainImagePreview = async () => {
    try {
      // Fetch the main issue image from the legacy issue_images table
      const response = await fetch(`${API_URL}/issues/${issueDetails?.issueId}/image`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch main issue image');
      }
      
      const data = await response.json();
      
      if (data.content) {
        // Create blob URL from base64 content
        const byteCharacters = atob(data.content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: issueDetails?.imageFileType || 'image/jpeg' });
        const imageUrl = URL.createObjectURL(blob);
        
        setSelectedImage({
          url: imageUrl,
          filename: `issue_${issueDetails?.issueId}_main_image`,
          fileType: issueDetails?.imageFileType || 'image/jpeg'
        });
        onImageModalOpen();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load main issue image',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCompletionFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: 'Please select an image file',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'File size must be less than 10MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      setCompletionAttachment(file);
    }
  };

  const isStatusChangeRequiresAttachment = (newStatus) => {
    const currentStatus = issueDetails?.status || issue?.status;
    return (currentStatus === 'in_progress' || currentStatus === 'resolved') && newStatus === 'closed';
  };

  const handleStatusChange = (newStatus) => {
    if (isStatusChangeRequiresAttachment(newStatus)) {
      setStatus(newStatus);
      setShowCompletionUpload(true);
      onStatusConfirmOpen();
    } else {
      setStatus(newStatus);
      if (newStatus !== (issueDetails?.status || issue?.status)) {
        onStatusConfirmOpen();
      }
    }
  };  const handleUpdateStatus = async () => {
    const issueId = issue?.issueId || issue?.issue_id;
    if (!issue || issueId === undefined || issueId === null) return;
    
    // Check if completion attachment is required but missing
    if (isStatusChangeRequiresAttachment(status) && !completionAttachment) {
      toast({
        title: 'Error',
        description: 'Completion proof image is required when closing an issue',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    console.log('Updating status for issue:', issueId, 'to status:', status);
    
    try {
      setLoading(true);
        // Upload completion attachment if provided
      if (completionAttachment) {
        try {
          await issueService.uploadIssueAttachment(
            issueId, 
            completionAttachment, 
            'completion', 
            user?.id || user?.userId || 1
          );
          
          // Now update the status
          await updateStatusOnly();
        } catch (error) {
          console.error('Attachment upload error:', error);
          toast({
            title: 'Error',
            description: 'Failed to upload completion proof',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          setLoading(false);
        }
      } else {
        await updateStatusOnly();
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast({
        title: 'Error',
        description: `Failed to update issue status: ${error.message}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  const updateStatusOnly = async () => {
    const issueId = issue?.issueId || issue?.issue_id;
    
    // Build the proper payload according to API specification
    const payload = {
      status: status,
      notes: statusNotes || `Status changed to ${status}`,
      updatedBy: user?.id || user?.userId || 1,
      progressPercentage: getProgressPercentage(status),
      progressAttachments: []
    };
    
    // Add resolvedAt timestamp if status is resolved
    if (status === 'resolved') {
      payload.resolvedAt = new Date().toISOString();
    }
    
    console.log('Status update payload:', payload);
    
    const response = await issueService.updateIssueStatus(issueId, payload);
    console.log('Status update response:', response);
    
    toast({
      title: 'Success',
      description: 'Issue status updated successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    
    // Reset states
    setCompletionAttachment(null);
    setShowCompletionUpload(false);
    setStatusNotes('');
    onStatusConfirmClose();
    
    // Refresh data
    onIssueUpdated();
    fetchIssueDetails();
    setLoading(false);
  };

  // Helper function to get progress percentage based on status
  const getProgressPercentage = (status) => {
    switch (status) {
      case 'open': return 0;
      case 'in_progress': return 50;
      case 'resolved': return 100;
      case 'closed': return 100;
      default: return 0;
    }
  };
  const handleResolveIssue = async () => {
    const issueId = issue?.issueId || issue?.issue_id;
    if (!issue || issueId === undefined || issueId === null) return;
    if (!resolution.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide resolution details',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await issueService.resolveIssue(issueId, {
        resolution: resolution,
        status: 'resolved'
      });
      toast({
        title: 'Success',
        description: 'Issue resolved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onIssueUpdated();
      fetchIssueDetails();
      setResolution('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resolve issue',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'orange';
      case 'in_progress': return 'blue';
      case 'resolved': return 'green';
      case 'closed': return 'gray';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'low': return 'green';
      case 'medium': return 'yellow';
      case 'high': return 'orange';
      case 'urgent': return 'red';
      default: return 'gray';
    }
  };

  // Priority label translation to Indonesian
  const getPriorityLabel = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'Mendesak';
      case 'medium': return 'Segera';
      case 'low': return 'Biasa';
      case 'urgent': return 'Sangat Mendesak';
      default: return 'Tidak Diketahui';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'maintenance': return FiTool;
      case 'electrical': return FiZap;
      case 'plumbing': return FiDroplet;
      case 'internet': return FiWifi;
      case 'hvac': return FiThermometer;      case 'room': return FiHome;
      default: return FiAlertCircle;
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString();
    } catch (error) {
      return 'N/A';
    }
  };

  if (!issue) return null;

  const currentIssue = issueDetails || issue;
  // Map backend fields to frontend expected fields for display
  const issueId = currentIssue.issueId || currentIssue.issue_id || 'N/A';
  const tenantId = currentIssue.tenantId || currentIssue.tenant_id || 'N/A';
  const description = currentIssue.description || 'N/A';
  const statusValue = currentIssue.status || 'N/A';
  const reportedAt = currentIssue.reportedAt || currentIssue.reported_at || null;
  const resolvedAt = currentIssue.resolvedAt || currentIssue.resolved_at || null;
  const reporter = currentIssue.reporter || {};
  const reporterName = reporter.fullName || reporter.full_name || 'N/A';
  const reporterEmail = reporter.email || 'N/A';
  const reporterRole = (reporter.role && (reporter.role.name || reporter.role_name)) || 'N/A';

  const CategoryIcon = getCategoryIcon(currentIssue.category || 'general');
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent maxH="90vh" overflowY="auto" maxW="1200px">
        <ModalHeader>
          <HStack>
            <CategoryIcon />
            <Text>Issue #{issueId}</Text>
            <Badge colorScheme={getStatusColor(statusValue)} ml={2}>
              {statusValue}
            </Badge>
          </HStack>
        </ModalHeader>        <ModalCloseButton />
        
        <ModalBody maxH="80vh" overflowY="auto">
          {loading ? (
            <Center py={8}>
              <Spinner size="xl" />
            </Center>
          ) : (
            <Tabs variant="soft-rounded" colorScheme="blue">
              <TabList>
                <Tab>
                  <HStack>
                    <FiFileText />
                    <Text>Details</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack>
                    <FiImage />
                    <Text>Attachments</Text>
                    {attachmentCount > 0 && (
                      <Badge colorScheme="blue" ml={1}>{attachmentCount}</Badge>
                    )}
                  </HStack>
                </Tab>
                <Tab>
                  <HStack>
                    <FiActivity />
                    <Text>Status</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels mt={4}>
                {/* Details Tab */}
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    {/* Issue Overview */}
                    <Card>
                      <CardBody p={4}>                        <VStack spacing={3} align="stretch">
                          <Text fontSize="lg" fontWeight="bold" lineHeight="1.2">
                            {description}
                          </Text>

                          {/* Main Issue Image */}
                          {currentIssue?.hasImageAttachment && currentIssue?.imageFileUrl && (
                            <Box>
                              <Text fontSize="xs" color="gray.600" mb={2}>Issue Photo</Text>
                              <Box 
                                position="relative" 
                                maxW="300px"
                                cursor="pointer"
                                onClick={() => handleMainImagePreview()}
                                _hover={{ opacity: 0.8 }}
                                transition="opacity 0.2s"
                              >
                                <AspectRatio ratio={16/9} maxW="300px">
                                  <Box
                                    border="2px solid"
                                    borderColor="gray.200"
                                    borderRadius="md"
                                    overflow="hidden"
                                    bg="gray.50"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                  >
                                    <VStack spacing={2}>
                                      <FiImage size={24} color="gray.400" />
                                      <Text fontSize="sm" color="gray.500">
                                        Click to view image
                                      </Text>
                                    </VStack>
                                  </Box>
                                </AspectRatio>
                                <Tooltip label="Click to view full image">
                                  <IconButton
                                    icon={<FiEye />}
                                    size="sm"
                                    position="absolute"
                                    top={2}
                                    right={2}
                                    colorScheme="blue"
                                    variant="solid"
                                    opacity={0.8}
                                  />
                                </Tooltip>
                              </Box>
                            </Box>
                          )}                          <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.600">Issue ID</Text>
                              <Text fontWeight="medium" fontSize="sm">#{issueId}</Text>
                            </VStack>

                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.600">Booking ID</Text>
                              <Text fontWeight="medium" fontSize="sm">
                                {currentIssue.bookingId ? `#${currentIssue.bookingId}` : 'N/A'}
                              </Text>
                            </VStack>
                            
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.600">Tenant ID</Text>
                              <Text fontWeight="medium" fontSize="sm">
                                {currentIssue.tenantId ? `#${currentIssue.tenantId}` : 'N/A'}
                              </Text>
                            </VStack>

                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.600">Category</Text>
                              <HStack>
                                <CategoryIcon size={14} />
                                <Text fontWeight="medium" fontSize="sm" textTransform="capitalize">
                                  {currentIssue.category || 'N/A'}
                                </Text>
                              </HStack>
                            </VStack>

                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.600">Priority</Text>
                              <Badge 
                                colorScheme={getPriorityColor(currentIssue.priority)} 
                                size="sm"
                                textTransform="uppercase"
                              >
                                {getPriorityLabel(currentIssue.priority)}
                              </Badge>
                            </VStack>
                            
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.600">Status</Text>
                              <Badge colorScheme={getStatusColor(statusValue)} size="sm" textTransform="uppercase">
                                {statusValue}
                              </Badge>
                            </VStack>
                            
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.600">Reported Date</Text>
                              <Text fontWeight="medium" fontSize="sm">
                                {reportedAt ? formatDateTime(reportedAt) : 'N/A'}
                              </Text>
                            </VStack>

                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.600">Reported By</Text>
                              <Text fontWeight="medium" fontSize="sm">
                                {currentIssue.reportedBy ? `User #${currentIssue.reportedBy}` : 'Unknown'}
                              </Text>
                            </VStack>
                            
                            {resolvedAt && (
                              <VStack align="start" spacing={0}>
                                <Text fontSize="xs" color="gray.600">Resolved Date</Text>
                                <Text fontWeight="medium" fontSize="sm">
                                  {formatDateTime(resolvedAt)}
                                </Text>
                              </VStack>
                            )}

                            {currentIssue.assignedTo && currentIssue.assignedTo > 0 && (
                              <VStack align="start" spacing={0}>
                                <Text fontSize="xs" color="gray.600">Assigned To</Text>
                                <Text fontWeight="medium" fontSize="sm">
                                  User #{currentIssue.assignedTo}
                                </Text>
                              </VStack>
                            )}

                            {currentIssue.assignedAt && (
                              <VStack align="start" spacing={0}>
                                <Text fontSize="xs" color="gray.600">Assigned Date</Text>
                                <Text fontWeight="medium" fontSize="sm">
                                  {formatDateTime(currentIssue.assignedAt)}
                                </Text>
                              </VStack>
                            )}

                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.600">Est. Resolution Hours</Text>
                              <Text fontWeight="medium" fontSize="sm">
                                {currentIssue.estimatedResolutionHours || 0} hours
                              </Text>
                            </VStack>

                            {currentIssue.actualResolutionHours > 0 && (
                              <VStack align="start" spacing={0}>
                                <Text fontSize="xs" color="gray.600">Actual Resolution Hours</Text>
                                <Text fontWeight="medium" fontSize="sm">
                                  {currentIssue.actualResolutionHours} hours
                                </Text>
                              </VStack>
                            )}

                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.600">Last Updated</Text>
                              <Text fontWeight="medium" fontSize="sm">
                                {currentIssue.updatedAt ? formatDateTime(currentIssue.updatedAt) : 'N/A'}
                              </Text>
                            </VStack>

                            {currentIssue.lastUpdatedBy && currentIssue.lastUpdatedBy > 0 && (
                              <VStack align="start" spacing={0}>
                                <Text fontSize="xs" color="gray.600">Last Updated By</Text>
                                <Text fontWeight="medium" fontSize="sm">
                                  User #{currentIssue.lastUpdatedBy}
                                </Text>
                              </VStack>
                            )}

                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.600">Attachments</Text>
                              <Text fontWeight="medium" fontSize="sm">
                                {currentIssue.attachmentCount || 0} file(s)
                              </Text>
                            </VStack>

                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.600">Comments</Text>
                              <Text fontWeight="medium" fontSize="sm">
                                {currentIssue.commentCount || 0} comment(s)
                              </Text>
                            </VStack>

                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.600">Status Changes</Text>
                              <Text fontWeight="medium" fontSize="sm">
                                {currentIssue.statusChangeCount || 0} change(s)
                              </Text>
                            </VStack>
                          </SimpleGrid>

                          <Box>
                            <Text fontSize="xs" color="gray.600" mb={1}>Progress</Text>
                            <Progress
                              value={getProgressPercentage(currentIssue.status)}
                              colorScheme={getStatusColor(currentIssue.status)}
                              size="md"
                              borderRadius="full"
                            />
                          </Box>
                        </VStack>
                      </CardBody>                    </Card>

                    {/* Additional Information */}
                    {(currentIssue.lastUpdateNotes || 
                      currentIssue.tenantSatisfactionRating > 0 || 
                      currentIssue.tenantFeedback ||
                      currentIssue.completionVerifiedBy > 0) && (
                      <Card>
                        <CardBody p={4}>
                          <Heading size="sm" mb={3}>Additional Information</Heading>
                          <VStack spacing={3} align="stretch">
                            {currentIssue.lastUpdateNotes && (
                              <Box>
                                <Text fontSize="xs" color="gray.600" mb={1}>Last Update Notes</Text>
                                <Text fontSize="sm" p={3} bg="gray.50" borderRadius="md">
                                  {currentIssue.lastUpdateNotes}
                                </Text>
                              </Box>
                            )}

                            {currentIssue.tenantSatisfactionRating > 0 && (
                              <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="xs" color="gray.600">Satisfaction Rating</Text>
                                  <HStack>
                                    <Text fontWeight="medium" fontSize="sm">
                                      {currentIssue.tenantSatisfactionRating}/5
                                    </Text>
                                    <Box>
                                      {'★'.repeat(currentIssue.tenantSatisfactionRating)}
                                      {'☆'.repeat(5 - currentIssue.tenantSatisfactionRating)}
                                    </Box>
                                  </HStack>
                                </VStack>
                              </Grid>
                            )}

                            {currentIssue.tenantFeedback && (
                              <Box>
                                <Text fontSize="xs" color="gray.600" mb={1}>Tenant Feedback</Text>
                                <Text fontSize="sm" p={3} bg="green.50" borderRadius="md">
                                  {currentIssue.tenantFeedback}
                                </Text>
                              </Box>
                            )}

                            {currentIssue.completionVerifiedBy > 0 && (
                              <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="xs" color="gray.600">Completion Verified By</Text>
                                  <Text fontWeight="medium" fontSize="sm">
                                    User #{currentIssue.completionVerifiedBy}
                                  </Text>
                                </VStack>
                                {currentIssue.completionVerifiedAt && (
                                  <VStack align="start" spacing={0}>
                                    <Text fontSize="xs" color="gray.600">Verification Date</Text>
                                    <Text fontWeight="medium" fontSize="sm">
                                      {formatDateTime(currentIssue.completionVerifiedAt)}
                                    </Text>
                                  </VStack>
                                )}
                              </Grid>
                            )}
                          </VStack>
                        </CardBody>
                      </Card>
                    )}

                    {/* Reporter Information */}
                    <Card>
                      <CardBody p={4}>
                        <Heading size="sm" mb={3}>Reporter Information</Heading>
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="xs" color="gray.600">Reporter ID</Text>
                            <Text fontWeight="medium" fontSize="sm">
                              {currentIssue.reportedBy ? `User #${currentIssue.reportedBy}` : 'Unknown'}
                            </Text>
                          </VStack>
                          
                          <VStack align="start" spacing={0}>
                            <Text fontSize="xs" color="gray.600">Name</Text>
                            <Text fontWeight="medium" fontSize="sm">
                              {reporterName || 'Loading...'}
                            </Text>
                          </VStack>
                          
                          <VStack align="start" spacing={0}>
                            <Text fontSize="xs" color="gray.600">Email</Text>
                            <Text fontWeight="medium" fontSize="sm">
                              {reporterEmail || 'Loading...'}
                            </Text>
                          </VStack>
                          
                          <VStack align="start" spacing={0}>
                            <Text fontSize="xs" color="gray.600">Role</Text>
                            <Text fontWeight="medium" fontSize="sm">
                              {reporterRole || 'Loading...'}
                            </Text>
                          </VStack>
                        </SimpleGrid>
                      </CardBody>
                    </Card>

                    {/* Booking Information */}
                    {currentIssue.bookingId && currentIssue.bookingId > 0 && (
                      <Card>
                        <CardBody p={4}>
                          <Heading size="sm" mb={3}>Related Booking Information</Heading>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.600">Booking ID</Text>
                              <Text fontWeight="medium" fontSize="sm">
                                #{currentIssue.bookingId}
                              </Text>
                            </VStack>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.600">Room</Text>
                              <Text fontWeight="medium" fontSize="sm">
                                {currentIssue.booking?.roomNumber || 'N/A'}
                              </Text>
                            </VStack>
                          </SimpleGrid>
                        </CardBody>
                      </Card>
                    )}

                    {/* Tenant Information */}
                    {currentIssue.tenantId && currentIssue.tenantId > 0 && (
                      <Card>
                        <CardBody p={4}>
                          <Heading size="sm" mb={3}>Tenant Information</Heading>
                          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.600">Tenant ID</Text>
                              <Text fontWeight="medium" fontSize="sm">
                                #{currentIssue.tenantId}
                              </Text>
                            </VStack>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.600">Name</Text>
                              <Text fontWeight="medium" fontSize="sm">
                                {currentIssue.tenant?.fullName || 'Loading...'}
                              </Text>
                            </VStack>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.600">Room</Text>
                              <Text fontWeight="medium" fontSize="sm">
                                {currentIssue.tenant?.roomNumber || 'N/A'}
                              </Text>
                            </VStack>
                          </SimpleGrid>
                        </CardBody>
                      </Card>
                    )}
                  </VStack>
                </TabPanel>                {/* Attachments Tab */}
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    {/* Existing Attachments */}
                    {attachments.length > 0 ? (
                      <Card>
                        <CardBody>
                          <Heading size="sm" mb={4}>
                            <HStack>
                              <FiImage />
                              <Text>Issue Attachments ({attachments.length})</Text>
                            </HStack>
                          </Heading>
                          
                          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                            {attachments.map((attachment) => (
                              <Card key={attachment.attachmentId} variant="outline">
                                <CardBody p={3}>
                                  <VStack spacing={2}>
                                    <HStack w="full" justify="space-between">
                                      <Badge colorScheme="blue" fontSize="xs">
                                        {attachment.attachmentType || 'evidence'}
                                      </Badge>
                                      {attachment.isPrimary && (
                                        <Badge colorScheme="gold" fontSize="xs">
                                          PRIMARY
                                        </Badge>
                                      )}
                                    </HStack>
                                    
                                    <AspectRatio ratio={16/9} w="full">
                                      <Box
                                        bg="gray.100"
                                        borderRadius="md"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        cursor="pointer"
                                        onClick={() => handleImagePreview(attachment.attachmentId)}
                                        _hover={{ bg: "gray.200" }}
                                      >
                                        <VStack>
                                          <FiImage size={24} color="gray.500" />
                                          <Text fontSize="xs" color="gray.600">
                                            Click to preview
                                          </Text>
                                        </VStack>
                                      </Box>
                                    </AspectRatio>
                                    
                                    <VStack spacing={1} w="full">
                                      <Text fontSize="xs" fontWeight="medium" noOfLines={1}>
                                        {attachment.filename || `attachment_${attachment.attachmentId}`}
                                      </Text>
                                      <Text fontSize="xs" color="gray.500">
                                        {attachment.fileType}
                                      </Text>
                                      <Text fontSize="xs" color="gray.400">
                                        {new Date(attachment.uploadedAt).toLocaleDateString()}
                                      </Text>
                                    </VStack>
                                    
                                    <HStack spacing={2} w="full">
                                      <Tooltip label="Preview Image">
                                        <IconButton
                                          icon={<FiEye />}
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleImagePreview(attachment.attachmentId)}
                                          flex={1}
                                        />
                                      </Tooltip>
                                    </HStack>
                                  </VStack>
                                </CardBody>
                              </Card>
                            ))}
                          </SimpleGrid>
                        </CardBody>
                      </Card>
                    ) : (
                      <Card>
                        <CardBody>
                          <Center py={8}>
                            <VStack>
                              <FiImage size={48} color="gray.300" />
                              <Text color="gray.500">No attachments yet</Text>
                              <Text fontSize="sm" color="gray.400">
                                Attachments will appear here when uploaded
                              </Text>
                            </VStack>
                          </Center>
                        </CardBody>
                      </Card>
                    )}

                    {/* Upload Section */}
                    <MultiImageAttachment
                      issueId={currentIssue?.issueId || currentIssue?.issue_id}
                      issueStatus={statusValue}
                      onAttachmentsChange={(attachments) => {
                        // Refresh attachments when new ones are uploaded
                        const issueId = currentIssue?.issueId || currentIssue?.issue_id;
                        if (issueId) {
                          fetchAttachments(issueId);
                        }
                      }}
                      readonly={false}
                    />
                  </VStack>
                </TabPanel>                {/* Status Management Tab */}
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    {/* Current Status Info */}
                    <Card>
                      <CardBody p={4}>
                        <Heading size="sm" mb={3}>Current Status</Heading>
                        <HStack spacing={3}>
                          <Badge colorScheme={getStatusColor(statusValue)} fontSize="md" p={2}>
                            {statusValue.toUpperCase()}
                          </Badge>
                          <Text fontSize="sm" color="gray.600">
                            {statusValue === 'open' && 'Issue reported and waiting for action'}
                            {statusValue === 'in_progress' && 'Issue is being worked on'}
                            {statusValue === 'resolved' && 'Issue has been fixed'}
                            {statusValue === 'closed' && 'Issue is completed and verified'}
                          </Text>
                        </HStack>
                      </CardBody>
                    </Card>

                    {/* Status Flow Info */}
                    {attachments.length > 0 && statusValue === 'open' && (
                      <Alert status="info">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>Ready to Start!</AlertTitle>
                          <AlertDescription>
                            This issue has initial attachments. You can change status to "In Progress" without uploading additional images.
                          </AlertDescription>
                        </Box>
                      </Alert>
                    )}

                    {statusValue === 'in_progress' && (
                      <Alert status="warning">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>Work in Progress</AlertTitle>
                          <AlertDescription>
                            When marking as "Closed", you'll need to upload a completion proof image.
                          </AlertDescription>
                        </Box>
                      </Alert>
                    )}

                    {statusValue === 'resolved' && (
                      <Alert status="warning">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>Issue Resolved</AlertTitle>
                          <AlertDescription>
                            To close this issue, please upload a completion proof image showing the final result.
                          </AlertDescription>
                        </Box>
                      </Alert>
                    )}

                    {/* Status Management */}
                    <Card>
                      <CardBody p={4}>
                        <Heading size="sm" mb={3}>Update Status</Heading>
                        <VStack spacing={3} align="stretch">
                          <FormControl>
                            <FormLabel fontSize="sm">New Status</FormLabel>
                            <Select
                              value={status}
                              onChange={(e) => handleStatusChange(e.target.value)}
                              size="sm"
                            >
                              <option value="open">📊 Open</option>
                              <option value="in_progress">🔧 In Progress</option>
                              <option value="resolved">✅ Resolved</option>
                              <option value="closed">🎯 Closed</option>
                            </Select>
                          </FormControl>
                          
                          <FormControl>
                            <FormLabel fontSize="sm">Status Notes (Optional)</FormLabel>
                            <Textarea
                              value={statusNotes}
                              onChange={(e) => setStatusNotes(e.target.value)}
                              placeholder="Add notes about this status change..."
                              size="sm"
                              rows={2}
                            />
                          </FormControl>
                        </VStack>
                      </CardBody>
                    </Card>

                    {/* Status Flow Information */}
                    <Card>
                      <CardBody p={4}>
                        <Heading size="sm" mb={3}>Multi-Image Flow</Heading>
                        <VStack spacing={3} align="stretch">
                          <Text fontSize="sm" color="gray.600">
                            Each status allows different types of attachments:
                          </Text>
                          
                          <Grid templateColumns="1fr" gap={2}>
                            <HStack>
                              <Badge colorScheme="red" variant="outline">📊 OPEN</Badge>
                              <Text fontSize="sm">Report attachments only</Text>
                            </HStack>
                            <HStack>
                              <Badge colorScheme="orange" variant="outline">🔧 IN PROGRESS</Badge>
                              <Text fontSize="sm">Report + Progress attachments</Text>
                            </HStack>
                            <HStack>
                              <Badge colorScheme="green" variant="outline">✅ RESOLVED</Badge>
                              <Text fontSize="sm">Report + Progress + Completion attachments</Text>
                            </HStack>
                            <HStack>
                              <Badge colorScheme="blue" variant="outline">🎯 CLOSED</Badge>
                              <Text fontSize="sm">All attachment types (including Feedback)</Text>
                            </HStack>
                          </Grid>
                        </VStack>
                      </CardBody>
                    </Card>

                    {/* Resolution Section */}
                    {status === 'resolved' && (
                      <Card>
                        <CardBody p={4}>
                          <Heading size="sm" mb={3}>Resolution</Heading>
                          <VStack spacing={3} align="stretch">
                            <FormControl>
                              <FormLabel fontSize="sm">Resolution Details</FormLabel>
                              <Textarea
                                placeholder="Describe how the issue was resolved..."
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                rows={3}
                                size="sm"
                              />
                            </FormControl>

                            {currentIssue.status !== 'resolved' && (
                              <HStack justify="flex-end">
                                <Button
                                  leftIcon={<FiCheck />}
                                  colorScheme="green"
                                  onClick={handleResolveIssue}
                                  isDisabled={!resolution.trim()}
                                  size="sm"
                                >
                                  Mark as Resolved
                                </Button>
                              </HStack>
                            )}
                          </VStack>
                        </CardBody>
                      </Card>
                    )}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}
        </ModalBody>        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>

      {/* Image Preview Modal */}
      <Modal isOpen={isImageModalOpen} onClose={onImageModalClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <FiImage />
              <Text>Image Preview</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedImage && (
              <VStack spacing={4}>
                <Box maxW="full" maxH="70vh" overflow="hidden">
                  <Image
                    src={selectedImage.url}
                    alt={selectedImage.filename}
                    maxW="full"
                    maxH="70vh"
                    objectFit="contain"
                    borderRadius="md"
                  />
                </Box>
                <VStack spacing={1}>
                  <Text fontWeight="medium">{selectedImage.filename}</Text>
                  <Text fontSize="sm" color="gray.600">{selectedImage.fileType}</Text>
                </VStack>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onImageModalClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Status Confirmation Dialog */}
      <AlertDialog isOpen={isStatusConfirmOpen} onClose={onStatusConfirmClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirm Status Change
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack spacing={4} align="stretch">
                <Text>
                  Are you sure you want to change the status to <strong>{status}</strong>?
                </Text>

                {isStatusChangeRequiresAttachment(status) && (
                  <VStack spacing={3} align="stretch">
                    <Alert status="warning">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Completion Proof Required</AlertTitle>
                        <AlertDescription>
                          Please upload an image showing the completed work.
                        </AlertDescription>
                      </Box>
                    </Alert>
                    
                    <FormControl>
                      <FormLabel fontSize="sm">Upload Completion Proof *</FormLabel>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleCompletionFileUpload}
                        size="sm"
                      />
                      {completionAttachment && (
                        <Text fontSize="xs" color="green.600" mt={1}>
                          ✓ {completionAttachment.name} selected
                        </Text>
                      )}
                    </FormControl>
                  </VStack>
                )}

                {statusNotes && (
                  <Box>
                    <Text fontSize="sm" fontWeight="medium">Notes:</Text>
                    <Text fontSize="sm" color="gray.600">{statusNotes}</Text>
                  </Box>
                )}
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onStatusConfirmClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleUpdateStatus}
                ml={3}
                isLoading={loading}
                isDisabled={isStatusChangeRequiresAttachment(status) && !completionAttachment}
              >
                Confirm Update
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Modal>
  );
};

export default IssueDetailModal;
