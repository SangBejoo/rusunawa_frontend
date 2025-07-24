import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Button,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Icon,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Grid,
  GridItem,
  Progress,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  FormControl,
  FormLabel,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaExclamationTriangle,
  FaCheck,
  FaClock,
  FaTools,
  FaCalendarAlt,
  FaCheckCircle,
  FaHistory,
  FaComments
} from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import { useTenantAuth } from '../../context/tenantAuthContext';
import issueService from '../../services/issueService';
import { formatDate } from '../../../utils/dateUtils';
import WorkflowImageViewer from '../../../shared/components/WorkflowImageViewer';
import MultiImageUpload from '../../../shared/components/MultiImageUpload';
import IssueHistory from '../../components/issues/IssueHistory';
import IssueComments from '../../components/issues/IssueComments';

const IssueDetailPage = () => {
  const { issueId } = useParams();
  const { tenant } = useTenantAuth();
  const navigate = useNavigate();
  const toast = useToast();  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [statusHistory, setStatusHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  
  // Feedback modal
  const { isOpen: isFeedbackOpen, onOpen: onFeedbackOpen, onClose: onFeedbackClose } = useDisclosure();
  const [feedbackImages, setFeedbackImages] = useState([]);
  const [feedbackText, setFeedbackText] = useState('');

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');  // Fetch issue details with attachments from both systems
  useEffect(() => {
    const fetchIssue = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch issue details first
        const issueResponse = await issueService.getIssue(issueId);
        const issueData = issueResponse.issue || issueResponse;
        
        // Fetch attachments from new system (issue_attachments table)
        const attachmentsResponse = await issueService.getIssueAttachments(issueId);
        const attachmentsData = attachmentsResponse.attachments || [];
        
        // Try to fetch legacy image (issue_images table) if issue has image attachment
        let legacyImage = null;
        if (issueData.hasImageAttachment || issueData.has_image_attachment) {
          try {
            const legacyImageResponse = await issueService.getIssueImage(issueId);
            if (legacyImageResponse.content) {
              legacyImage = {
                attachmentId: `legacy_${issueId}`, // Special ID for legacy image
                issueId: issueId,
                uploadedBy: issueData.reportedBy || issueData.reported_by,
                fileName: `issue_${issueId}_report_image`,
                fileType: legacyImageResponse.fileType || issueData.imageFileType || 'image/jpeg',
                fileSizeBytes: 0,
                mimeType: legacyImageResponse.fileType || issueData.imageFileType || 'image/jpeg',
                attachmentType: 'report', // Legacy images are always report images
                isPrimary: true,
                uploadedAt: issueData.reportedAt || issueData.reported_at,
                content: legacyImageResponse.content, // Base64 content
                id: `legacy_${issueId}`,
                file_name: `issue_${issueId}_report_image`,
                file_type: legacyImageResponse.fileType || issueData.imageFileType || 'image/jpeg',
                uploaded_at: issueData.reportedAt || issueData.reported_at,
                attachment_type: 'report',
                is_primary: true
              };
            }
          } catch (legacyError) {
            console.log('No legacy image found or error fetching:', legacyError);
          }
        }
        
        // Organize all attachments by workflow phase and load content for new attachments
        const organizedAttachments = {
          report: [],
          progress: [],
          completion: [],
          feedback: []
        };
        
        // Add legacy image to report section if exists
        if (legacyImage) {
          organizedAttachments.report.push(legacyImage);
        }
        
        // Process new system attachments and load their content
        for (const attachment of attachmentsData) {
          try {
            // Get the actual image content
            const contentResponse = await issueService.getAttachmentContent(attachment.attachmentId);
            
            // Add content to attachment in the format expected by WorkflowImageViewer
            const enrichedAttachment = {
              ...attachment,
              content: contentResponse.content, // base64 content for WorkflowImageViewer
              contentType: contentResponse.fileType,
              contentEncoding: contentResponse.contentEncoding,
              // Ensure proper field mapping for WorkflowImageViewer
              id: attachment.attachmentId,
              file_name: attachment.fileName,
              file_type: attachment.fileType || attachment.mimeType,
              uploaded_at: attachment.uploadedAt,
              attachment_type: attachment.attachmentType,
              is_primary: attachment.isPrimary
            };
            
            // Organize by attachment type
            const type = attachment.attachmentType || 'report';
            if (organizedAttachments[type]) {
              organizedAttachments[type].push(enrichedAttachment);
            } else {
              organizedAttachments.report.push(enrichedAttachment);
            }          } catch (contentError) {
            console.error(`Failed to load content for attachment ${attachment.attachmentId}:`, contentError);
            // Add attachment without content but with proper field mapping
            const fallbackAttachment = {
              ...attachment,
              id: attachment.attachmentId,
              file_name: attachment.fileName,
              file_type: attachment.fileType || attachment.mimeType,
              uploaded_at: attachment.uploadedAt,
              attachment_type: attachment.attachmentType,
              is_primary: attachment.isPrimary
            };
            
            const type = attachment.attachmentType || 'report';
            if (organizedAttachments[type]) {
              organizedAttachments[type].push(fallbackAttachment);
            } else {
              organizedAttachments.report.push(fallbackAttachment);
            }
          }        }
        
        // Combine legacy and new attachments
        const allAttachments = [...attachmentsData];
        if (legacyImage) {
          allAttachments.unshift(legacyImage); // Add legacy image at the beginning
        }
        
        // Add organized attachments to issue
        issueData.attachments = allAttachments;
        issueData.organizedAttachments = organizedAttachments;
        
        setIssue(issueData);
        
      } catch (err) {
        setError(err.message || 'Failed to load issue details');
        console.error('Error fetching issue:', err);
        toast({
          title: 'Error Loading Issue',
          description: err.message || 'Failed to load issue details',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    if (issueId) {
      fetchIssue();
    }
  }, [issueId, toast]);
  // Fetch status history
  const fetchStatusHistory = async () => {
    try {
      setLoadingHistory(true);
      console.log('Fetching status history for issue:', issueId);
      const response = await issueService.getIssueStatusHistory(issueId);
      console.log('Status history response:', response);
      setStatusHistory(response.history || response.statusHistory || []);
    } catch (error) {
      console.error('Error fetching status history:', error);
      toast({
        title: 'Error Loading History',
        description: error.message || 'Failed to load issue history',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch comments
  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      console.log('Fetching comments for issue:', issueId);
      const response = await issueService.getIssueComments(issueId, { includePrivate: false });
      console.log('Comments response:', response);
      setComments(response.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: 'Error Loading Comments',
        description: error.message || 'Failed to load issue comments',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingComments(false);
    }
  };
  // Load history and comments when issue is loaded
  useEffect(() => {
    if (issue && issueId) {
      console.log('Issue loaded, fetching history and comments for issue:', issueId);
      fetchStatusHistory();
      fetchComments();
    }
  }, [issue, issueId]);

  // Handle comments update
  const handleCommentsUpdate = () => {
    fetchComments();
  };

  // Debug logging
  console.log('Current state:', {
    issueId,
    issue: !!issue,
    statusHistory: statusHistory.length,
    comments: comments.length,
    loadingHistory,
    loadingComments
  });

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
    switch (priority?.toLowerCase()) {
      case 'high': return 'Mendesak';
      case 'medium': return 'Segera';
      case 'low': return 'Biasa';
      default: return 'Tidak Diketahui';
    }
  };

  // Status progress percentage
  const getStatusProgress = (status) => {
    switch (status) {
      case 'open': return 25;
      case 'in_progress': return 50;
      case 'resolved': return 75;
      case 'closed': return 100;
      default: return 0;
    }
  };
  // Submit feedback with images
  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim() && feedbackImages.length === 0) {
      toast({
        title: 'Feedback Required',
        description: 'Please provide feedback text or upload verification images',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }    setSubmittingFeedback(true);
    try {
      // Prepare feedback data for status update to 'closed'
      const statusUpdateData = {
        status: 'closed',
        notes: feedbackText.trim(),
        updatedBy: tenant?.userId || tenant?.id || 1,
        progressPercentage: 100,
        images: feedbackImages, // Pass images for the workflow
        rating: 5 // Default positive rating
      };

      // Use the issue service to update status with feedback
      const response = await issueService.updateIssueStatus(issueId, 'closed', statusUpdateData);
      
      toast({
        title: 'Issue Closed',
        description: `Your verification feedback has been submitted successfully${feedbackImages.length > 0 ? ` with ${feedbackImages.length} image${feedbackImages.length !== 1 ? 's' : ''}` : ''}. The issue is now closed.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset feedback form
      setFeedbackText('');
      setFeedbackImages([]);
      onFeedbackClose();      // Refresh issue data and related information
      const updatedIssue = await issueService.getIssue(issueId);
      setIssue(updatedIssue);
      
      // Refresh history and comments
      fetchStatusHistory();
      fetchComments();

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Error Submitting Feedback',
        description: error.message || 'Failed to submit feedback',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <TenantLayout>
        <Container maxW="container.xl" py={8}>
          <VStack spacing={8} align="center">
            <Spinner size="xl" color="blue.500" />
            <Text>Loading issue details...</Text>
          </VStack>
        </Container>
      </TenantLayout>
    );
  }

  if (error) {
    return (
      <TenantLayout>
        <Container maxW="container.xl" py={8}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        </Container>
      </TenantLayout>
    );
  }

  if (!issue) {
    return (
      <TenantLayout>
        <Container maxW="container.xl" py={8}>
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            Issue not found
          </Alert>
        </Container>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="start">
            <VStack align="start" spacing={2}>
              <Breadcrumb>
                <BreadcrumbItem>
                  <BreadcrumbLink as={RouterLink} to="/tenant/issues">
                    Issues
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem isCurrentPage>
                  <BreadcrumbLink>Issue #{issue.issueId}</BreadcrumbLink>
                </BreadcrumbItem>
              </Breadcrumb>
              
              <HStack spacing={4}>
                <Heading size="lg">Issue #{issue.issueId}</Heading>
                <Badge colorScheme={getStatusColor(issue.status)} variant="solid" px={3} py={1}>
                  {(issue.status || 'pending').replace('_', ' ').toUpperCase()}
                </Badge>
                {issue.priority ? (
                  <Badge colorScheme={getPriorityColor(issue.priority)} variant="outline" px={3} py={1}>
                    {getPriorityLabel(issue.priority).toUpperCase()}
                  </Badge>
                ) : (
                  <Badge colorScheme="gray" variant="outline" px={3} py={1}>
                    PRIORITY PENDING
                  </Badge>
                )}
              </HStack>
            </VStack>
            
            <Button
              leftIcon={<FaArrowLeft />}
              onClick={() => navigate('/tenant/issues')}
              variant="outline"
            >
              Back to Issues
            </Button>
          </HStack>

          {/* Status Progress */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <VStack spacing={4}>
                <HStack justify="space-between" w="100%">
                  <Text fontWeight="medium">Issue Progress</Text>
                  <Text fontSize="sm" color={textColor}>
                    {getStatusProgress(issue.status)}% Complete
                  </Text>
                </HStack>
                <Progress 
                  value={getStatusProgress(issue.status)} 
                  colorScheme={getStatusColor(issue.status)}
                  w="100%"
                  hasStripe
                  isAnimated
                />
                <HStack justify="space-between" w="100%" fontSize="sm">
                  <Text color={issue.status === 'open' ? 'red.500' : 'gray.500'} fontWeight={issue.status === 'open' ? 'bold' : 'normal'}>
                    Reported
                  </Text>
                  <Text color={issue.status === 'in_progress' ? 'yellow.500' : 'gray.500'} fontWeight={issue.status === 'in_progress' ? 'bold' : 'normal'}>
                    In Progress
                  </Text>
                  <Text color={issue.status === 'resolved' ? 'green.500' : 'gray.500'} fontWeight={issue.status === 'resolved' ? 'bold' : 'normal'}>
                    Resolved
                  </Text>
                  <Text color={issue.status === 'closed' ? 'blue.500' : 'gray.500'} fontWeight={issue.status === 'closed' ? 'bold' : 'normal'}>
                    Closed
                  </Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>          {/* Main Content */}
          <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
            {/* Left Column - Issue Details */}
            <GridItem>
              <VStack spacing={6} align="stretch">
                {/* Issue Information */}
                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">Issue Details</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Text fontSize="lg" fontWeight="medium">
                        {issue.title || 'Maintenance Request'}
                      </Text>
                      
                      <Text color={textColor}>
                        {issue.description || 'No description provided'}
                      </Text>
                      
                      <Divider />
                      
                      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                        <HStack>
                          <Icon as={FaTools} color="gray.500" />
                          <Text fontSize="sm">
                            <Text as="span" fontWeight="medium">Category:</Text> {issue.category || 'General'}
                          </Text>
                        </HStack>
                        
                        <HStack>
                          <Icon as={FaCalendarAlt} color="gray.500" />
                          <Text fontSize="sm">
                            <Text as="span" fontWeight="medium">Reported:</Text> {formatDate(issue.reportedAt)}
                          </Text>
                        </HStack>
                        
                        {issue.location && (
                          <HStack>
                            <Icon as={FaExclamationTriangle} color="gray.500" />
                            <Text fontSize="sm">
                              <Text as="span" fontWeight="medium">Location:</Text> {issue.location}
                            </Text>
                          </HStack>
                        )}
                        
                        {issue.estimatedResolution && (
                          <HStack>
                            <Icon as={FaClock} color="gray.500" />
                            <Text fontSize="sm">
                              <Text as="span" fontWeight="medium">ETA:</Text> {issue.estimatedResolution}
                            </Text>
                          </HStack>
                        )}
                      </Grid>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Priority Information */}
                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">Priority Status</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {issue.priority ? (
                        <HStack justify="space-between">
                          <Text>
                            This issue has been assigned a priority level by our admin team:
                          </Text>
                          <Badge colorScheme={getPriorityColor(issue.priority)} variant="solid" px={3} py={1}>
                            {getPriorityLabel(issue.priority).toUpperCase()}
                          </Badge>
                        </HStack>
                      ) : (
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <Text fontWeight="medium">Priority Assignment Pending</Text>
                            <Text fontSize="sm">
                              Our admin team will review this issue and assign an appropriate priority level (High, Medium, or Low) based on urgency and impact assessment.
                            </Text>
                          </Box>
                        </Alert>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Enhanced Content Tabs */}
                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                  <CardBody p={0}>
                    <Tabs variant="enclosed" colorScheme="blue">
                      <TabList>
                        <Tab>Evidence & Progress</Tab>
                        <Tab>
                          <HStack spacing={2}>
                            <Icon as={FaHistory} boxSize={4} />
                            <Text>History</Text>
                            {loadingHistory && <Spinner size="xs" />}
                          </HStack>
                        </Tab>
                        <Tab>
                          <HStack spacing={2}>
                            <Icon as={FaComments} boxSize={4} />
                            <Text>Comments</Text>
                            <Badge variant="outline" size="sm">
                              {comments.length}
                            </Badge>
                            {loadingComments && <Spinner size="xs" />}
                          </HStack>
                        </Tab>
                      </TabList>

                      <TabPanels>
                        {/* Evidence & Progress Images Tab */}
                        <TabPanel>
                          <VStack spacing={4} align="stretch">
                            <HStack justify="space-between">
                              <Text fontWeight="medium">Evidence & Progress Images</Text>
                              <Badge variant="outline">
                                {issue.attachments?.length || 0} image{(issue.attachments?.length || 0) !== 1 ? 's' : ''}
                              </Badge>
                            </HStack>
                            
                            {issue.organizedAttachments ? (
                              <Tabs variant="line" size="sm" colorScheme="blue">
                                <TabList>
                                  <Tab>Report ({issue.organizedAttachments.report?.length || 0})</Tab>
                                  <Tab>Progress ({issue.organizedAttachments.progress?.length || 0})</Tab>
                                  <Tab>Completion ({issue.organizedAttachments.completion?.length || 0})</Tab>
                                  <Tab>Feedback ({issue.organizedAttachments.feedback?.length || 0})</Tab>
                                </TabList>

                                <TabPanels>
                                  {/* Report Images */}
                                  <TabPanel px={0}>
                                    {issue.organizedAttachments.report?.length > 0 ? (
                                      <WorkflowImageViewer
                                        attachments={issue.organizedAttachments.report}
                                        currentStatus="report"
                                        showTitle={false}
                                        groupByPhase={false}
                                        allowDownload={true}
                                        allowFullscreen={true}
                                        compact={false}
                                      />
                                    ) : (
                                      <Text color="gray.500" textAlign="center" py={8}>
                                        No report images available
                                      </Text>
                                    )}
                                  </TabPanel>

                                  {/* Progress Images */}
                                  <TabPanel px={0}>
                                    {issue.organizedAttachments.progress?.length > 0 ? (
                                      <WorkflowImageViewer
                                        attachments={issue.organizedAttachments.progress}
                                        currentStatus="progress"
                                        showTitle={false}
                                        groupByPhase={false}
                                        allowDownload={true}
                                        allowFullscreen={true}
                                        compact={false}
                                      />
                                    ) : (
                                      <Text color="gray.500" textAlign="center" py={8}>
                                        No progress images available
                                      </Text>
                                    )}
                                  </TabPanel>

                                  {/* Completion Images */}
                                  <TabPanel px={0}>
                                    {issue.organizedAttachments.completion?.length > 0 ? (
                                      <WorkflowImageViewer
                                        attachments={issue.organizedAttachments.completion}
                                        currentStatus="completion"
                                        showTitle={false}
                                        groupByPhase={false}
                                        allowDownload={true}
                                        allowFullscreen={true}
                                        compact={false}
                                      />
                                    ) : (
                                      <Text color="gray.500" textAlign="center" py={8}>
                                        No completion images available
                                      </Text>
                                    )}
                                  </TabPanel>

                                  {/* Feedback Images */}
                                  <TabPanel px={0}>
                                    {issue.organizedAttachments.feedback?.length > 0 ? (
                                      <WorkflowImageViewer
                                        attachments={issue.organizedAttachments.feedback}
                                        currentStatus="feedback"
                                        showTitle={false}
                                        groupByPhase={false}
                                        allowDownload={true}
                                        allowFullscreen={true}
                                        compact={false}
                                      />
                                    ) : (
                                      <Text color="gray.500" textAlign="center" py={8}>
                                        No feedback images available
                                      </Text>
                                    )}
                                  </TabPanel>
                                </TabPanels>
                              </Tabs>
                            ) : (
                              <Text color="gray.500" textAlign="center" py={8}>
                                Loading images...
                              </Text>
                            )}
                          </VStack>
                        </TabPanel>                        {/* History Tab */}
                        <TabPanel>
                          <VStack spacing={4} align="stretch">
                            <Text fontSize="sm" color="gray.500">
                              Debug: History items: {statusHistory.length}, Loading: {loadingHistory ? 'yes' : 'no'}
                            </Text>
                            <IssueHistory 
                              history={statusHistory}
                              comments={[]} // Don't duplicate comments in history
                              compact={false}
                            />
                          </VStack>
                        </TabPanel>

                        {/* Comments Tab */}
                        <TabPanel>
                          <VStack spacing={4} align="stretch">
                            <Text fontSize="sm" color="gray.500">
                              Debug: Comments: {comments.length}, Loading: {loadingComments ? 'yes' : 'no'}
                            </Text>
                            <IssueComments
                              issueId={issueId}
                              comments={comments}
                              onCommentsUpdate={handleCommentsUpdate}
                              allowAdd={true}
                              compact={false}
                            />
                          </VStack>
                        </TabPanel>
                      </TabPanels>
                    </Tabs>
                  </CardBody>
                </Card>
              </VStack>
            </GridItem>

            {/* Right Column - Actions & Status */}
            <GridItem>
              <VStack spacing={6} align="stretch">                {/* Actions */}
                {issue.status === 'resolved' && (
                  <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                    <CardHeader>
                      <Heading size="md">Verification Required</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4}>
                        <Alert status="info">
                          <AlertIcon />
                          <Box>
                            <Text fontSize="sm">
                              The issue has been marked as resolved. Please verify the work and provide feedback.
                            </Text>
                          </Box>
                        </Alert>
                        
                        <Button
                          colorScheme="green"
                          leftIcon={<FaCheckCircle />}
                          onClick={onFeedbackOpen}
                          w="100%"
                        >
                          Verify & Provide Feedback
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </GridItem>
          </Grid>
        </VStack>

        {/* Feedback Modal */}
        <Modal isOpen={isFeedbackOpen} onClose={onFeedbackClose} size="4xl">
          <ModalOverlay />
          <ModalContent maxW="90vw">
            <ModalHeader>Verify Resolution & Provide Feedback</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={6} align="stretch">
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <Text fontSize="sm">
                      Please verify that the issue has been resolved to your satisfaction and provide feedback about the service quality.
                    </Text>
                  </Box>
                </Alert>

                <FormControl>
                  <FormLabel>Feedback Comments</FormLabel>
                  <Textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Please describe whether the issue was resolved satisfactorily and provide any additional feedback..."
                    rows={4}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Verification Images (Optional)</FormLabel>
                  <MultiImageUpload
                    images={feedbackImages}
                    onImagesChange={setFeedbackImages}
                    maxImages={3}
                    title="Upload Verification Images"
                    description="Upload images showing the resolved issue"
                    contextDescription="Final verification photo"
                    required={false}
                    showPreview={true}
                    allowReorder={true}
                  />
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    Upload images to verify the work has been completed satisfactorily
                  </Text>
                </FormControl>

                <HStack spacing={4} justify="end">
                  <Button onClick={onFeedbackClose} variant="outline">
                    Cancel
                  </Button>
                  <Button
                    colorScheme="green"
                    onClick={handleSubmitFeedback}
                    isLoading={submittingFeedback}
                    loadingText="Submitting..."
                    leftIcon={<FaCheckCircle />}
                  >
                    Submit Verification
                  </Button>
                </HStack>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </TenantLayout>
  );
};

export default IssueDetailPage;
