import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Spinner,
  Center,
  Image,
  IconButton,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  Divider,
  Icon,
  Tooltip,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  SimpleGrid,
  AspectRatio,
} from '@chakra-ui/react';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaUser,
  FaTag,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaImage,
  FaDownload,
  FaExpand,
  FaExternalLinkAlt
} from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import issueService from '../../services/issueService';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

const IssueDetail = () => {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
    const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [error, setError] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Priority label translation to Indonesian
  const getPriorityLabel = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'Mendesak';
      case 'medium': return 'Segera';
      case 'low': return 'Biasa';
      default: return 'Tidak Diketahui';
    }
  };

  // Debug logging
  console.log('IssueDetail - issueId from params:', issueId);
  
  // Fetch issue details
  useEffect(() => {
    const fetchIssue = async () => {
      console.log('fetchIssue called with issueId:', issueId);
      if (!issueId) {
        console.error('No issueId provided');
        setError('Issue ID not found in URL');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);      try {
        console.log('Calling issueService.getIssue with:', issueId);
        const response = await issueService.getIssue(issueId);
        console.log('Received issue data:', response);
        console.log('Issue hasImageAttachment:', response?.issue?.hasImageAttachment);
        setIssue(response.issue); // Extract just the issue data, not the whole response
      } catch (err) {
        console.error('Error fetching issue:', err);
        // Ensure error is always a string, handle API error objects
        const errorMessage = typeof err === 'string' ? err : 
                           (err?.message || err?.data?.message || err?.response?.data?.message || 'Failed to load issue details');
        setError(errorMessage);
        toast({
          title: 'Error Loading Issue',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };    fetchIssue();
  }, [issueId, toast]);
  // Fetch image data separately
  useEffect(() => {
    const fetchImageData = async () => {
      if (!issue?.hasImageAttachment || !issueId) return;
      
      try {
        setImageLoading(true);
        setImageError(false);
        const response = await issueService.getIssueImage(issueId);
        console.log('Image response:', response);
        
        if (response?.imageContent) {
          // Create data URL from base64 content
          const mimeType = response.fileType || 'image/png';
          const dataUrl = `data:${mimeType};base64,${response.imageContent}`;
          setImageUrl(dataUrl);
          setImageData(response);
        }
      } catch (err) {
        console.error('Error fetching image:', err);
        setImageError(true);
      } finally {
        setImageLoading(false);
      }
    };

    fetchImageData();
  }, [issue, issueId]);
  // Get status badge properties
  const getStatusBadge = (status) => {
    const statusStr = status ? String(status).toLowerCase() : '';
    switch(statusStr) {
      case 'resolved':
      case 'completed':
        return { colorScheme: 'green', icon: FaCheckCircle };
      case 'in_progress':
      case 'investigating':
        return { colorScheme: 'blue', icon: FaClock };
      case 'pending':
        return { colorScheme: 'yellow', icon: FaClock };
      case 'rejected':
      case 'closed':
        return { colorScheme: 'red', icon: FaExclamationTriangle };
      default:
        return { colorScheme: 'gray', icon: FaClock };
    }
  };
  // Handle image download
  const handleImageDownload = async () => {
    try {
      setImageLoading(true);
      
      if (imageData?.imageContent) {
        // Convert base64 to blob for download
        const base64Data = imageData.imageContent;
        const mimeType = imageData.fileType || 'image/png';
        
        // Convert base64 to blob
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        const fileExtension = mimeType.split('/')[1] || 'png';
        link.download = `issue-${issueId}-image.${fileExtension}`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: '📥 Download Started',
          description: 'Issue image download has started.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('No image data available');
      }
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download issue image.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setImageLoading(false);
    }
  };

  if (loading) {
    return (
      <TenantLayout>
        <Center h="50vh">
          <VStack spacing={4}>
            <Spinner size="xl" color="brand.500" thickness="4px" />
            <Text>Loading issue details...</Text>
          </VStack>
        </Center>
      </TenantLayout>
    );
  }

  if (error || !issue) {
    return (
      <TenantLayout>
        <Container maxW="container.lg" py={8}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <VStack align="start" spacing={2}>
              <Text fontWeight="medium">Error Loading Issue</Text>
              <Text>{error || 'Issue not found'}</Text>
            </VStack>
          </Alert>
          <Button
            leftIcon={<FaArrowLeft />}
            mt={4}
            onClick={() => navigate('/tenant/issues')}
          >
            Back to Issues
          </Button>
        </Container>
      </TenantLayout>
    );
  }

  const statusInfo = getStatusBadge(issue.status);

  return (
    <TenantLayout>
      <Container maxW="container.lg" py={8}>
        {/* Header */}
        <Flex justify="space-between" align="center" mb={6}>
          <HStack spacing={4}>
            <IconButton
              icon={<FaArrowLeft />}
              onClick={() => navigate('/tenant/issues')}
              variant="ghost"
              aria-label="Back to issues"
            />            <VStack align="start" spacing={0}>
              <Heading size="lg">Issue #{issue.issueId || issueId}</Heading>
              <Text color={textColor} fontSize="sm">
                Reported {formatDateTime(issue.reportedAt || issue.createdAt)}
              </Text>
            </VStack>
          </HStack>
          
          <Badge
            colorScheme={statusInfo.colorScheme}
            variant="solid"
            px={3}
            py={1}
            borderRadius="full"
            fontSize="sm"
          >
            <HStack spacing={1}>
              <Icon as={statusInfo.icon} boxSize={3} />
              <Text textTransform="capitalize">{issue.status || 'Pending'}</Text>
            </HStack>
          </Badge>
        </Flex>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Issue Details */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Issue Details</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {/* Description */}
                <Box>
                  <Text fontWeight="medium" mb={2}>Description</Text>
                  <Text color={textColor} lineHeight="tall">
                    {issue.description || 'No description provided'}
                  </Text>
                </Box>

                <Divider />

                {/* Additional Info */}
                <SimpleGrid columns={1} spacing={4}>
                  {issue.category && (
                    <Stat>
                      <StatLabel>
                        <HStack>
                          <Icon as={FaTag} />
                          <Text>Category</Text>
                        </HStack>
                      </StatLabel>
                      <StatNumber fontSize="md">{issue.category}</StatNumber>
                    </Stat>
                  )}

                  {issue.priority && (
                    <Stat>
                      <StatLabel>
                        <HStack>
                          <Icon as={FaExclamationTriangle} />
                          <Text>Priority</Text>
                        </HStack>
                      </StatLabel>
                      <StatNumber fontSize="md">
                        <Badge
                          colorScheme={
                            issue.priority === 'high' ? 'red' :
                            issue.priority === 'medium' ? 'yellow' : 'green'
                          }
                        >
                          {getPriorityLabel(issue.priority)}
                        </Badge>
                      </StatNumber>
                    </Stat>
                  )}

                  <Stat>
                    <StatLabel>
                      <HStack>
                        <Icon as={FaCalendarAlt} />
                        <Text>Reported Date</Text>
                      </HStack>
                    </StatLabel>                    <StatNumber fontSize="md">
                      {formatDate(issue.reportedAt || issue.createdAt)}
                    </StatNumber>
                    <StatHelpText>
                      {formatDateTime(issue.reportedAt || issue.createdAt)}
                    </StatHelpText>
                  </Stat>                  {(issue.reportedBy || issue.reporter) && (
                    <Stat>
                      <StatLabel>
                        <HStack>
                          <Icon as={FaUser} />
                          <Text>Reported By</Text>
                        </HStack>
                      </StatLabel>
                      <StatNumber fontSize="md">
                        {issue.reporter?.fullName || `User #${issue.reportedBy || issue.reportedByUserId}`}
                      </StatNumber>
                    </Stat>
                  )}
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>

          {/* Image Section */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">
                <HStack>
                  <Icon as={FaImage} />
                  <Text>Attached Image</Text>
                </HStack>
              </Heading>
            </CardHeader>            <CardBody>
              {issue.hasImageAttachment && !imageError ? (
                <VStack spacing={4}>
                  {/* Image Preview */}                  <AspectRatio ratio={16/9} w="100%">
                    <Box w="100%" h="100%">
                      {imageLoading ? (
                        <Center h="100%" bg="gray.100" borderRadius="md">
                          <VStack>
                            <Spinner size="lg" color="blue.500" />
                            <Text color="gray.500" fontSize="sm">Loading image...</Text>
                          </VStack>
                        </Center>
                      ) : imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={`Issue ${issueId} image`}
                          borderRadius="md"
                          objectFit="cover"
                          onClick={onOpen}
                          cursor="pointer"
                          _hover={{ opacity: 0.8 }}
                          onError={(e) => {
                            console.error('Image load error:', e);
                            setImageError(true);
                          }}
                        />
                      ) : (
                        <Center h="100%" bg="gray.100" borderRadius="md">
                          <VStack>
                            <Icon as={FaImage} boxSize={8} color="gray.400" />
                            <Text color="gray.500" fontSize="sm">
                              {imageError ? 'Failed to load image' : 'No image available'}
                            </Text>
                          </VStack>
                        </Center>
                      )}
                    </Box>
                  </AspectRatio>

                  {/* Image Info */}
                  <VStack spacing={2} align="stretch" w="100%">
                    <Text fontSize="sm" fontWeight="medium">
                      Attached Image
                    </Text>
                    {imageData?.fileType && (
                      <Text fontSize="xs" color={textColor}>
                        Type: {imageData.fileType}
                      </Text>
                    )}
                    {imageData?.metadata?.sizeBytes && (
                      <Text fontSize="xs" color={textColor}>
                        Size: {Math.round(imageData.metadata.sizeBytes / 1024)} KB
                      </Text>
                    )}
                  </VStack>

                  {/* Image Actions */}
                  <HStack spacing={2} w="100%">
                    <Button
                      leftIcon={<FaExpand />}
                      size="sm"
                      variant="outline"
                      onClick={onOpen}
                      flex={1}
                    >
                      View Full Size
                    </Button>
                    <Button
                      leftIcon={<FaDownload />}
                      size="sm"
                      colorScheme="brand"
                      onClick={handleImageDownload}
                      isLoading={imageLoading}
                      loadingText="Downloading"
                      flex={1}
                    >
                      Download
                    </Button>
                  </HStack>
                </VStack>
              ) : (
                <Center h="200px" borderWidth="2px" borderStyle="dashed" borderColor={borderColor} borderRadius="md">
                  <VStack>
                    <Icon as={FaImage} boxSize={8} color="gray.400" />
                    <Text color="gray.500" textAlign="center">
                      {imageError ? 'Failed to load image' : 'No image attached'}
                    </Text>
                    {imageError && (
                      <Button
                        size="sm"
                        variant="link"
                        leftIcon={<FaExternalLinkAlt />}
                        onClick={() => window.open(issueService.getIssueImageUrl(issueId), '_blank')}
                      >
                        Open in new tab
                      </Button>
                    )}
                  </VStack>
                </Center>
              )}
            </CardBody>
          </Card>
        </SimpleGrid>        {/* Full Size Image Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="6xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              Issue #{issueId} - Attached Image
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <Center>
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={`Issue ${issueId} full size image`}
                    maxH="70vh"
                    objectFit="contain"
                    borderRadius="md"
                  />
                ) : (
                  <VStack>
                    <Icon as={FaImage} boxSize={16} color="gray.400" />
                    <Text color="gray.500">Image not available</Text>
                  </VStack>
                )}
              </Center>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </TenantLayout>
  );
};

export default IssueDetail;
