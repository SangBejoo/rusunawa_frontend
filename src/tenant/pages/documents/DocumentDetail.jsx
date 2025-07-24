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
  Grid,
  GridItem,
  Badge,
  Spinner,
  Center,
  Image,
  IconButton,
  Flex,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Divider,
  Icon,
  Progress,
  Tooltip,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ButtonGroup,
} from '@chakra-ui/react';
import {
  FaArrowLeft,
  FaDownload,
  FaSearchPlus,
  FaSearchMinus,
  FaSyncAlt,
  FaExpand,
  FaCompress,
  FaEye,
  FaFileImage,
  FaFilePdf,
  FaFile,
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaPrint,
  FaShare,
  FaRedo,
} from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import documentService from '../../services/documentService';

const DocumentDetail = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  // State management
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Image zoom and manipulation states
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Fullscreen modal
  const { isOpen: isFullscreenOpen, onOpen: onFullscreenOpen, onClose: onFullscreenClose } = useDisclosure();

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const highlightColor = useColorModeValue('brand.50', 'brand.900');

  // Fetch document details
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const response = await documentService.getDocumentById(documentId);
        setDocument(response.document);
      } catch (err) {
        console.error('Error fetching document:', err);
        setError(err.message || 'Failed to load document details');
        toast({
          title: 'Error',
          description: 'Failed to load document details',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchDocument();
    }
  }, [documentId, toast]);

  // Image manipulation functions
  const handleZoomIn = () => {
    setImageZoom(prev => Math.min(prev * 1.25, 5));
  };

  const handleZoomOut = () => {
    setImageZoom(prev => Math.max(prev / 1.25, 0.25));
  };

  const handleRotate = () => {
    setImageRotation(prev => (prev + 90) % 360);
  };

  const handleResetZoom = () => {
    setImageZoom(1);
    setImageRotation(0);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleFullscreen = () => {
    onFullscreenOpen();
  };

  // Mouse drag handlers for image panning
  const handleMouseDown = (e) => {
    if (imageZoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && imageZoom > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Download document
  const handleDownload = () => {
    if (document?.fileUrl) {
      window.open(document.fileUrl, '_blank');
    }
  };

  // Get file type icon
  const getFileIcon = (fileType) => {
    if (fileType?.includes('image')) return FaFileImage;
    if (fileType?.includes('pdf')) return FaFilePdf;
    return FaFile;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'verified':
        return 'green';
      case 'rejected':
      case 'declined':
        return 'red';
      case 'pending':
      case 'review':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  // Check if file is an image
  const isImageFile = (fileType) => {
    return fileType?.includes('image') || document?.isImage;
  };

  if (loading) {
    return (
      <TenantLayout>
        <Container maxW="container.xl" py={8}>
          <Center minH="400px">
            <VStack spacing={4}>
              <Spinner size="xl" color="brand.500" thickness="4px" />
              <Text>Loading document details...</Text>
            </VStack>
          </Center>
        </Container>
      </TenantLayout>
    );
  }

  if (error || !document) {
    return (
      <TenantLayout>
        <Container maxW="container.xl" py={8}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Error loading document</Text>
              <Text>{error}</Text>
            </Box>
          </Alert>
          <Button
            leftIcon={<FaArrowLeft />}
            mt={4}
            onClick={() => navigate('/tenant/documents')}
          >
            Back to Documents
          </Button>
        </Container>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center" flexWrap="wrap">
            <HStack spacing={4}>
              <Button
                leftIcon={<FaArrowLeft />}
                variant="ghost"
                onClick={() => navigate('/tenant/documents')}
              >
                Back to Documents
              </Button>
              <Icon as={getFileIcon(document.fileType)} color="brand.500" boxSize={6} />
              <VStack align="start" spacing={1}>
                <Heading size="lg" noOfLines={1}>
                  {document.fileName || 'Document Details'}
                </Heading>
                <HStack spacing={2}>
                  <Badge colorScheme={getStatusColor(document.status)} fontSize="sm">
                    {document.status?.toUpperCase()}
                  </Badge>
                  <Text fontSize="sm" color="gray.500">
                    {document.documentType?.name || 'Unknown Type'}
                  </Text>
                </HStack>
              </VStack>
            </HStack>

            <ButtonGroup spacing={2}>
              <Tooltip label="Download">
                <IconButton
                  icon={<FaDownload />}
                  onClick={handleDownload}
                  colorScheme="blue"
                  variant="outline"
                />
              </Tooltip>
              <Tooltip label="Print">
                <IconButton
                  icon={<FaPrint />}
                  onClick={() => window.print()}
                  colorScheme="gray"
                  variant="outline"
                />
              </Tooltip>
            </ButtonGroup>
          </Flex>

          {/* Document Statistics */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <CardBody>
                <Stat>
                  <StatLabel>File Size</StatLabel>
                  <StatNumber fontSize="lg">
                    {document.fileSize ? `${(document.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
                  </StatNumber>
                  <StatHelpText>
                    {document.fileType?.split('/')[1]?.toUpperCase() || 'Unknown'}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <CardBody>
                <Stat>
                  <StatLabel>Upload Date</StatLabel>
                  <StatNumber fontSize="lg">
                    {document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : 'Unknown'}
                  </StatNumber>
                  <StatHelpText>
                    {document.uploadedAt ? new Date(document.uploadedAt).toLocaleTimeString() : ''}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <CardBody>
                <Stat>
                  <StatLabel>Document Type</StatLabel>
                  <StatNumber fontSize="lg" noOfLines={1}>
                    {document.documentType?.name || 'Unknown'}
                  </StatNumber>
                  <StatHelpText>
                    ID: {document.docTypeId}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <CardBody>
                <Stat>
                  <StatLabel>Status</StatLabel>
                  <StatNumber fontSize="lg">
                    <Badge colorScheme={getStatusColor(document.status)} fontSize="md" px={2} py={1}>
                      {document.status?.toUpperCase()}
                    </Badge>
                  </StatNumber>
                  <StatHelpText>
                    {document.verifiedAt ? `Verified ${new Date(document.verifiedAt).toLocaleDateString()}` : 'Pending verification'}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Main Content */}
          <Grid templateColumns={{ base: '1fr', lg: '1fr 300px' }} gap={8}>
            {/* Document Preview */}
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <Heading size="md">Document Preview</Heading>
                  {isImageFile(document.fileType) && (
                    <ButtonGroup size="sm" isAttached>
                      <Tooltip label="Zoom Out">
                        <IconButton
                          icon={<FaSearchMinus />}
                          onClick={handleZoomOut}
                          isDisabled={imageZoom <= 0.25}
                        />
                      </Tooltip>
                      <Tooltip label="Reset Zoom">
                        <IconButton
                          icon={<FaRedo />}
                          onClick={handleResetZoom}
                        />
                      </Tooltip>
                      <Tooltip label="Zoom In">
                        <IconButton
                          icon={<FaSearchPlus />}
                          onClick={handleZoomIn}
                          isDisabled={imageZoom >= 5}
                        />
                      </Tooltip>
                      <Tooltip label="Rotate">
                        <IconButton
                          icon={<FaSyncAlt />}
                          onClick={handleRotate}
                        />
                      </Tooltip>
                      <Tooltip label="Fullscreen">
                        <IconButton
                          icon={<FaExpand />}
                          onClick={handleFullscreen}
                        />
                      </Tooltip>
                    </ButtonGroup>
                  )}
                </Flex>
              </CardHeader>
              <CardBody>
                <Box
                  position="relative"
                  w="100%"
                  h="600px"
                  bg="gray.50"
                  borderRadius="md"
                  overflow="hidden"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  cursor={isImageFile(document.fileType) && imageZoom > 1 ? 'grab' : 'default'}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {isImageFile(document.fileType) ? (
                    <Image
                      src={document.fileUrl || document.thumbnailUrl}
                      alt={document.fileName}
                      maxW="100%"
                      maxH="100%"
                      objectFit="contain"
                      transform={`scale(${imageZoom}) rotate(${imageRotation}deg) translate(${imagePosition.x}px, ${imagePosition.y}px)`}
                      transition="transform 0.3s ease"
                      userSelect="none"
                      draggable={false}
                    />
                  ) : document.fileType?.includes('pdf') ? (
                    <Box w="100%" h="100%" border="1px solid" borderColor={borderColor} borderRadius="md">
                      <iframe
                        src={`${document.fileUrl}#toolbar=1`}
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                        title={document.fileName}
                      />
                    </Box>
                  ) : (
                    <VStack spacing={4} color="gray.500">
                      <Icon as={getFileIcon(document.fileType)} boxSize={16} />
                      <Text fontSize="lg" fontWeight="medium">
                        Preview not available
                      </Text>
                      <Text>
                        This file type cannot be previewed directly
                      </Text>
                      <Button leftIcon={<FaDownload />} onClick={handleDownload} colorScheme="blue">
                        Download to View
                      </Button>
                    </VStack>
                  )}
                </Box>

                {/* Zoom indicator */}
                {isImageFile(document.fileType) && (
                  <HStack justify="center" mt={4} spacing={4}>
                    <Text fontSize="sm" color="gray.500">
                      Zoom: {Math.round(imageZoom * 100)}%
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Rotation: {imageRotation}°
                    </Text>
                  </HStack>
                )}
              </CardBody>
            </Card>

            {/* Document Information Sidebar */}
            <VStack spacing={6} align="stretch">
              {/* Document Details */}
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                <CardHeader>
                  <Heading size="md">Document Information</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={1}>File Name</Text>
                      <Text fontWeight="medium" wordBreak="break-word">
                        {document.fileName}
                      </Text>
                    </Box>

                    <Divider />

                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={1}>Description</Text>
                      <Text>
                        {document.description || 'No description provided'}
                      </Text>
                    </Box>

                    <Divider />

                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={1}>Upload Date</Text>
                      <HStack>
                        <Icon as={FaCalendarAlt} color="brand.500" />
                        <Text>
                          {document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : 'Unknown'}
                        </Text>
                      </HStack>
                    </Box>

                    {document.verifiedAt && (
                      <>
                        <Divider />
                        <Box>
                          <Text fontSize="sm" color="gray.500" mb={1}>Verified Date</Text>
                          <HStack>
                            <Icon as={FaCheckCircle} color="green.500" />
                            <Text>
                              {new Date(document.verifiedAt).toLocaleDateString()}
                            </Text>
                          </HStack>
                        </Box>
                      </>
                    )}

                    {document.rejectedAt && (
                      <>
                        <Divider />
                        <Box>
                          <Text fontSize="sm" color="gray.500" mb={1}>Rejected Date</Text>
                          <HStack>
                            <Icon as={FaTimesCircle} color="red.500" />
                            <Text>
                              {new Date(document.rejectedAt).toLocaleDateString()}
                            </Text>
                          </HStack>
                        </Box>
                      </>
                    )}
                  </VStack>
                </CardBody>
              </Card>

              {/* Status Information */}
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                <CardHeader>
                  <Heading size="md">Verification Status</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack>
                      <Icon 
                        as={document.status === 'approved' ? FaCheckCircle : 
                            document.status === 'rejected' ? FaTimesCircle : 
                            FaClock} 
                        color={getStatusColor(document.status) + '.500'} 
                      />
                      <Text fontWeight="medium">
                        {document.status === 'approved' ? 'Document Approved' :
                         document.status === 'rejected' ? 'Document Rejected' :
                         'Pending Verification'}
                      </Text>
                    </HStack>

                    {document.status === 'rejected' && document.rejectionReason && (
                      <Alert status="error" borderRadius="md">
                        <AlertIcon />
                        <Box>
                          <Text fontWeight="medium" fontSize="sm">Rejection Reason:</Text>
                          <Text fontSize="sm">{document.rejectionReason}</Text>
                        </Box>
                      </Alert>
                    )}

                    {document.status === 'pending' && (
                      <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        <Box>
                          <Text fontSize="sm">
                            Your document is currently under review. You will be notified once the verification is complete.
                          </Text>
                        </Box>
                      </Alert>
                    )}

                    {document.verificationNotes && (
                      <Box>
                        <Text fontSize="sm" color="gray.500" mb={1}>Verification Notes</Text>
                        <Text fontSize="sm" p={3} bg={highlightColor} borderRadius="md">
                          {document.verificationNotes}
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>

              {/* Actions */}
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                <CardHeader>
                  <Heading size="md">Actions</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3}>
                    <Button
                      leftIcon={<FaDownload />}
                      colorScheme="blue"
                      variant="outline"
                      w="100%"
                      onClick={handleDownload}
                    >
                      Download Document
                    </Button>
                    
                    <Button
                      leftIcon={<FaPrint />}
                      colorScheme="gray"
                      variant="outline"
                      w="100%"
                      onClick={() => window.print()}
                    >
                      Print Document
                    </Button>

                    {document.status === 'rejected' && (
                      <Button
                        leftIcon={<FaRedo />}
                        colorScheme="orange"
                        variant="outline"
                        w="100%"
                        onClick={() => navigate(`/tenant/documents/upload?replace=${documentId}`)}
                      >
                        Replace Document
                      </Button>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </Grid>
        </VStack>

        {/* Fullscreen Modal */}
        <Modal isOpen={isFullscreenOpen} onClose={onFullscreenClose} size="full">
          <ModalOverlay />
          <ModalContent bg="black">
            <ModalHeader color="white">
              <Flex justify="space-between" align="center">
                <Text>{document.fileName}</Text>
                <ButtonGroup spacing={2}>
                  <IconButton
                    icon={<FaSearchMinus />}
                    onClick={handleZoomOut}
                    colorScheme="whiteAlpha"
                    variant="ghost"
                    isDisabled={imageZoom <= 0.25}
                  />
                  <IconButton
                    icon={<FaRedo />}
                    onClick={handleResetZoom}
                    colorScheme="whiteAlpha"
                    variant="ghost"
                  />
                  <IconButton
                    icon={<FaSearchPlus />}
                    onClick={handleZoomIn}
                    colorScheme="whiteAlpha"
                    variant="ghost"
                    isDisabled={imageZoom >= 5}
                  />
                  <IconButton
                    icon={<FaSyncAlt />}
                    onClick={handleRotate}
                    colorScheme="whiteAlpha"
                    variant="ghost"
                  />
                  <IconButton
                    icon={<FaDownload />}
                    onClick={handleDownload}
                    colorScheme="whiteAlpha"
                    variant="ghost"
                  />
                </ButtonGroup>
              </Flex>
            </ModalHeader>
            <ModalCloseButton color="white" />
            <ModalBody p={0} display="flex" justifyContent="center" alignItems="center">
              <Box
                w="100%"
                h="100vh"
                display="flex"
                alignItems="center"
                justifyContent="center"
                cursor={imageZoom > 1 ? 'grab' : 'default'}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {isImageFile(document.fileType) && (
                  <Image
                    src={document.fileUrl || document.thumbnailUrl}
                    alt={document.fileName}
                    maxW="100%"
                    maxH="100%"
                    objectFit="contain"
                    transform={`scale(${imageZoom}) rotate(${imageRotation}deg) translate(${imagePosition.x}px, ${imagePosition.y}px)`}
                    transition="transform 0.3s ease"
                    userSelect="none"
                    draggable={false}
                  />
                )}
              </Box>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </TenantLayout>
  );
};

export default DocumentDetail;
