// Enhanced Documents List Page with Image Display Capabilities
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Image,
  IconButton,
  Badge,
  Button,
  Input,
  Select,
  InputGroup,
  InputLeftElement,
  useToast,
  useColorModeValue,
  Flex,
  SimpleGrid,
  AspectRatio,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tooltip,
  CircularProgress,
  CircularProgressLabel,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Spinner,
  Alert,
  AlertIcon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Skeleton,
  SkeletonText,
  Stack,
  Progress,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaEye,
  FaImage,
  FaCalendarAlt,
  FaUser,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaExclamationTriangle,
  FaEdit,
  FaDownload,
  FaSync,
  FaFileUpload,
  FaEllipsisV,
  FaFile,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaCog,
  FaTrash
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import TenantLayout from '../../components/layout/TenantLayout';
import enhancedDocumentService from '../../services/enhancedDocumentService';
import { useTenantAuth } from '../../context/tenantAuthContext';

const EnhancedDocumentsPage = () => {
  const { tenant } = useTenantAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

  // State management
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingDocs, setProcessingDocs] = useState(new Set());

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    docType: '',
    status: '',
    hasImages: '',
    verificationStatus: ''
  });

  const [activeTab, setActiveTab] = useState(0);

  // Load data
  const loadDocuments = useCallback(async (showRefreshIndicator = false) => {
    if (!tenant?.id) return;

    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [documentsResponse, typesResponse] = await Promise.all([
        enhancedDocumentService.getTenantDocumentsWithImages(tenant.id, filters),
        enhancedDocumentService.getDocumentTypesWithImageRequirements()
      ]);

      setDocuments(documentsResponse.documents || []);
      setDocumentTypes(typesResponse.types || []);
      
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: 'Loading Error',
        description: 'Failed to load documents. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenant?.id, filters, toast]);

  // Initial load
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Filter documents based on active tab and filters
  useEffect(() => {
    let filtered = [...documents];

    // Filter by tab
    switch (activeTab) {
      case 1: // Pending
        filtered = filtered.filter(doc => 
          ['pending', 'uploaded', 'processing'].includes(doc.status?.toLowerCase())
        );
        break;
      case 2: // Approved
        filtered = filtered.filter(doc => 
          ['approved', 'verified', 'accepted'].includes(doc.status?.toLowerCase())
        );
        break;
      case 3: // Rejected
        filtered = filtered.filter(doc => 
          ['rejected', 'declined', 'invalid'].includes(doc.status?.toLowerCase())
        );
        break;
      default: // All
        break;
    }

    // Apply additional filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.name?.toLowerCase().includes(searchLower) ||
        doc.description?.toLowerCase().includes(searchLower) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (filters.docType) {
      filtered = filtered.filter(doc => doc.doc_type_id === parseInt(filters.docType));
    }

    if (filters.status) {
      filtered = filtered.filter(doc => doc.status === filters.status);
    }

    if (filters.hasImages) {
      const hasImages = filters.hasImages === 'true';
      filtered = filtered.filter(doc => 
        hasImages ? (doc.image_count > 0) : (doc.image_count === 0)
      );
    }

    if (filters.verificationStatus) {
      filtered = filtered.filter(doc => doc.verification_status === filters.verificationStatus);
    }

    // Reset page if filter changes
    setPage(1);
    setFilteredDocuments(filtered);
  }, [documents, activeTab, filters]);

  // Get paginated documents
  const paginatedDocuments = filteredDocuments.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredDocuments.length / pageSize);

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      docType: '',
      status: '',
      hasImages: '',
      verificationStatus: ''
    });
  };
  // View document details
  const viewDocumentDetails = (document) => {
    setSelectedDocument(document);
    setSelectedImage(null); // Clear any selected image
    onOpen();
  };

  // Preview image
  const previewImage = (document, image) => {
    setSelectedDocument(document);
    setSelectedImage(image);
    onOpen();
  };

  // Process document
  const processDocument = async (documentId) => {
    try {
      setProcessingDocs(prev => new Set([...prev, documentId]));
      
      await enhancedDocumentService.processDocumentImages(documentId, {
        enableOCR: true,
        enhanceImages: true,
        validateContent: true,
        extractMetadata: true,
        qualityCheck: true
      });

      toast({
        title: 'Processing Started',
        description: 'Document processing has been initiated.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });

      // Refresh documents to get updated status
      setTimeout(() => loadDocuments(true), 2000);
      
    } catch (error) {
      console.error('Error processing document:', error);
      toast({
        title: 'Processing Error',
        description: error.message || 'Failed to start document processing.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessingDocs(prev => {
        const updated = new Set(prev);
        updated.delete(documentId);
        return updated;
      });
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'uploaded':
        return 'orange';
      case 'processing':
        return 'blue';
      case 'approved':
      case 'verified':
        return 'green';
      case 'rejected':
      case 'invalid':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Get verification status color
  const getVerificationColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return 'green';
      case 'unverified':
        return 'orange';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Get file icon
  const getFileIcon = (fileType) => {
    if (!fileType) return FaFile;
    if (fileType.startsWith('image/')) return FaImage;
    if (fileType === 'application/pdf') return FaFilePdf;
    if (fileType.includes('word')) return FaFileWord;
    if (fileType.includes('excel') || fileType.includes('sheet')) return FaFileExcel;
    return FaFile;
  };

  // Get document type name
  const getDocumentTypeName = (docTypeId) => {
    const docType = documentTypes.find(type => type.id === docTypeId);
    return docType?.name || 'Unknown';
  };

  // Document card component
  const DocumentCard = ({ document }) => {
    const isProcessing = processingDocs.has(document.id);
    
    return (
      <Card
        bg={bgColor}
        borderColor={borderColor}
        borderWidth="1px"
        _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
        transition="all 0.2s"
        cursor="pointer"
        onClick={() => viewDocumentDetails(document)}
      >
        <CardBody p={4}>
          <VStack align="stretch" spacing={4}>
            {/* Header */}
            <HStack justify="space-between">
              <HStack spacing={3}>
                <Box as={getFileIcon(document.file_type)} color="blue.500" />
                <Badge colorScheme={getStatusColor(document.status)} variant="subtle">
                  {document.status?.replace('_', ' ').toUpperCase()}
                </Badge>
                {document.verification_status && (
                  <Badge colorScheme={getVerificationColor(document.verification_status)} variant="outline" fontSize="xs">
                    {document.verification_status.toUpperCase()}
                  </Badge>
                )}
              </HStack>
              
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<FaEllipsisV />}
                  size="sm"
                  variant="ghost"
                  onClick={(e) => e.stopPropagation()}
                />
                <MenuList>
                  <MenuItem icon={<FaEye />} onClick={() => viewDocumentDetails(document)}>
                    View Details
                  </MenuItem>
                  {document.status === 'uploaded' && (
                    <MenuItem 
                      icon={<FaCog />} 
                      onClick={() => processDocument(document.id)}
                      isDisabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Process Document'}
                    </MenuItem>
                  )}
                  <MenuDivider />
                  <MenuItem icon={<FaDownload />}>
                    Download
                  </MenuItem>
                  {document.status === 'pending' && (
                    <MenuItem icon={<FaTrash />} color="red.500">
                      Delete
                    </MenuItem>
                  )}
                </MenuList>
              </Menu>
            </HStack>

            {/* Document Info */}
            <Box>
              <Heading size="sm" mb={1} noOfLines={1}>
                {getDocumentTypeName(document.doc_type_id)}
              </Heading>
              {document.description && (
                <Text fontSize="sm" color="gray.600" noOfLines={2}>
                  {document.description}
                </Text>
              )}
            </Box>

            {/* Images Preview */}
            {document.images && document.images.length > 0 && (
              <Box>
                <Text fontSize="xs" color="gray.500" mb={2}>
                  {document.images.length} image{document.images.length !== 1 ? 's' : ''}
                </Text>
                <SimpleGrid columns={Math.min(document.images.length, 4)} spacing={2}>
                  {document.images.slice(0, 4).map((image, index) => (
                    <Box key={image.id || index} position="relative">
                      <AspectRatio ratio={1} w="60px">
                        <Image
                          src={enhancedDocumentService.getDocumentImageThumbnailUrl(document.id, image.id, { size: 120 })}
                          alt={`Document image ${index + 1}`}
                          objectFit="cover"
                          borderRadius="md"
                          border="1px solid"
                          borderColor={borderColor}
                          onClick={(e) => {
                            e.stopPropagation();
                            previewImage(document, image);
                          }}
                          _hover={{ opacity: 0.8 }}
                          cursor="pointer"
                        />
                      </AspectRatio>
                      
                      {index === 3 && document.images.length > 4 && (
                        <Flex
                          position="absolute"
                          top={0}
                          left={0}
                          right={0}
                          bottom={0}
                          bg="blackAlpha.600"
                          color="white"
                          align="center"
                          justify="center"
                          borderRadius="md"
                          fontSize="xs"
                          fontWeight="bold"
                        >
                          +{document.images.length - 4}
                        </Flex>
                      )}
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            )}

            {/* Tags */}
            {document.tags && document.tags.length > 0 && (
              <Wrap>
                {document.tags.slice(0, 3).map((tag, index) => (
                  <WrapItem key={index}>
                    <Tag size="sm" colorScheme="blue" variant="subtle">
                      <TagLabel>{tag}</TagLabel>
                    </Tag>
                  </WrapItem>
                ))}
                {document.tags.length > 3 && (
                  <WrapItem>
                    <Tag size="sm" variant="outline">
                      <TagLabel>+{document.tags.length - 3}</TagLabel>
                    </Tag>
                  </WrapItem>
                )}
              </Wrap>
            )}

            {/* Processing Status */}
            {isProcessing && (
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm">Processing...</Text>
                  <CircularProgress size="20px" isIndeterminate color="blue.500" />
                </HStack>
                <Progress size="sm" colorScheme="blue" isIndeterminate />
              </Box>
            )}

            {/* Metadata */}
            <HStack justify="space-between" fontSize="xs" color="gray.500">
              <HStack spacing={1}>
                <FaCalendarAlt />
                <Text>
                  {formatDistanceToNow(new Date(document.uploaded_at || Date.now()), { addSuffix: true })}
                </Text>
              </HStack>
              {document.file_size && (
                <Text>
                  {(document.file_size / 1024 / 1024).toFixed(1)} MB
                </Text>
              )}
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
      <CardBody p={4}>
        <VStack align="start" spacing={3}>
          <HStack spacing={3} w="full">
            <Skeleton height="20px" width="80px" />
            <Skeleton height="20px" width="100px" />
          </HStack>
          <Box w="full">
            <Skeleton height="16px" width="60%" mb={2} />
            <SkeletonText mt="4" noOfLines={2} spacing="4" />
          </Box>
          <SimpleGrid columns={3} spacing={2} w="full">
            <Skeleton height="50px" />
            <Skeleton height="50px" />
            <Skeleton height="50px" />
          </SimpleGrid>
          <HStack spacing={4} w="full">
            <Skeleton height="14px" width="80px" />
            <Skeleton height="14px" width="60px" />
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );

  return (
    <TenantLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <HStack justify="space-between" mb={4}>
              <Box>
                <Heading size="xl" mb={2}>
                  My Documents
                </Heading>
                <Text color="gray.600">
                  Manage your verification documents with image processing and validation
                </Text>
              </Box>
              <HStack spacing={3}>
                <Button
                  leftIcon={<FaSync />}
                  variant="outline"
                  onClick={() => loadDocuments(true)}
                  isLoading={refreshing}
                  size="sm"
                >
                  Refresh
                </Button>
                <Button
                  leftIcon={<FaPlus />}
                  colorScheme="brand"
                  onClick={() => navigate('/tenant/documents/upload-enhanced')}
                >
                  Upload Document
                </Button>
              </HStack>
            </HStack>
          </Box>

          {/* Filters */}
          <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' }} gap={4}>
                <InputGroup>
                  <InputLeftElement>
                    <FaSearch color="gray" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search documents..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </InputGroup>

                <Select
                  placeholder="All Document Types"
                  value={filters.docType}
                  onChange={(e) => handleFilterChange('docType', e.target.value)}
                >
                  {documentTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </Select>

                <Select
                  placeholder="All Statuses"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Select>

                <Select
                  placeholder="Images"
                  value={filters.hasImages}
                  onChange={(e) => handleFilterChange('hasImages', e.target.value)}
                >
                  <option value="true">With Images</option>
                  <option value="false">Without Images</option>
                </Select>

                <Button
                  leftIcon={<FaFilter />}
                  variant="outline"
                  onClick={clearFilters}
                  size="md"
                >
                  Clear Filters
                </Button>
              </Grid>
            </CardBody>
          </Card>

          {/* Content */}
          <Box>
            <Tabs index={activeTab} onChange={setActiveTab} colorScheme="brand" variant="enclosed">
              <TabList>
                <Tab>All Documents ({documents.length})</Tab>
                <Tab>
                  Pending ({documents.filter(d => ['pending', 'uploaded', 'processing'].includes(d.status?.toLowerCase())).length})
                </Tab>
                <Tab>
                  Approved ({documents.filter(d => ['approved', 'verified', 'accepted'].includes(d.status?.toLowerCase())).length})
                </Tab>
                <Tab>
                  Rejected ({documents.filter(d => ['rejected', 'declined', 'invalid'].includes(d.status?.toLowerCase())).length})
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel px={0}>
                  {loading ? (
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
                      {[...Array(6)].map((_, index) => (
                        <LoadingSkeleton key={index} />
                      ))}
                    </Grid>
                  ) : filteredDocuments.length === 0 ? (
                    <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                      <CardBody py={12}>
                        <VStack spacing={4} textAlign="center">
                          <Box as={FaFileUpload} size="3em" color="gray.400" />
                          <Heading size="md" color="gray.500">
                            No Documents Found
                          </Heading>
                          <Text color="gray.500">
                            {filters.search || filters.docType || filters.status || filters.hasImages
                              ? 'No documents match your current filters.'
                              : 'You haven\'t uploaded any documents yet.'
                            }
                          </Text>
                          {!filters.search && !filters.docType && !filters.status && !filters.hasImages && (
                            <Button
                              leftIcon={<FaPlus />}
                              colorScheme="brand"
                              onClick={() => navigate('/tenant/documents/upload-enhanced')}
                            >
                              Upload Your First Document
                            </Button>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  ) : (
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
                      {paginatedDocuments.map(document => (
                        <DocumentCard key={document.id} document={document} />
                      ))}
                    </Grid>
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <Flex justify="center" mt={6} align="center" gap={4}>
                        <Button onClick={() => setPage(page - 1)} isDisabled={page === 1} size="sm">Previous</Button>
                        <Text fontSize="sm">Page {page} of {totalPages}</Text>
                        <Button onClick={() => setPage(page + 1)} isDisabled={page === totalPages} size="sm">Next</Button>
                        <Select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} width="70px" size="sm" ml={2}>
                          {[10, 20, 30, 50].map(size => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </Select>
                        <Text fontSize="xs" color="gray.500">per page</Text>
                      </Flex>
                    )}
                  )}
                </TabPanel>

                {/* Other tab panels use the same content structure */}
                {[1, 2, 3].map(tabIndex => (
                  <TabPanel key={tabIndex} px={0}>
                    {loading ? (
                      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
                        {[...Array(6)].map((_, index) => (
                          <LoadingSkeleton key={index} />
                        ))}
                      </Grid>
                    ) : filteredDocuments.length === 0 ? (
                      <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                        <CardBody py={12}>
                          <VStack spacing={4} textAlign="center">
                            <Box as={FaFileUpload} size="3em" color="gray.400" />
                            <Heading size="md" color="gray.500">
                              No Documents in This Category
                            </Heading>
                            <Text color="gray.500">
                              All your documents are in other status categories.
                            </Text>
                          </VStack>
                        </CardBody>
                      </Card>
                    ) : (
                      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
                        {filteredDocuments.map(document => (
                          <DocumentCard key={document.id} document={document} />
                        ))}
                      </Grid>
                    )}
                  </TabPanel>
                ))}
              </TabPanels>
            </Tabs>
          </Box>
        </VStack>        {/* Document Preview Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="6xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {selectedDocument && selectedImage && `${getDocumentTypeName(selectedDocument.doc_type_id)} - Image Preview`}
              {selectedDocument && !selectedImage && `${getDocumentTypeName(selectedDocument.doc_type_id)} - Document Details`}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {selectedImage && selectedDocument && (
                <VStack spacing={4}>
                  <Image
                    src={enhancedDocumentService.getDocumentImageUrl(selectedDocument.id, selectedImage.id)}
                    alt="Document image"
                    maxH="500px"
                    objectFit="contain"
                    borderRadius="md"
                  />
                  <Box textAlign="center">
                    <Text fontWeight="medium">{selectedImage.name || 'Document Image'}</Text>
                    <Text fontSize="sm" color="gray.500">
                      Uploaded {formatDistanceToNow(new Date(selectedImage.uploaded_at || Date.now()), { addSuffix: true })}
                    </Text>
                  </Box>
                  <HStack spacing={4}>
                    <Button
                      leftIcon={<FaDownload />}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const url = enhancedDocumentService.getDocumentImageUrl(selectedDocument.id, selectedImage.id);
                        window.open(url, '_blank');
                      }}
                    >
                      Download
                    </Button>
                    <Button
                      leftIcon={<FaEye />}
                      size="sm"
                      colorScheme="brand"
                      onClick={() => {
                        setSelectedImage(null); // Show document details instead
                      }}
                    >
                      View Document Details
                    </Button>
                  </HStack>
                </VStack>
              )}
              
              {selectedDocument && !selectedImage && (
                <VStack spacing={6} align="stretch">
                  {/* Document Basic Info */}
                  <Box>
                    <Heading size="md" mb={4}>Document Information</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Stat>
                        <StatLabel>Document Type</StatLabel>
                        <StatNumber fontSize="lg">{getDocumentTypeName(selectedDocument.doc_type_id)}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Status</StatLabel>
                        <StatNumber>
                          <Badge 
                            colorScheme={getStatusColor(selectedDocument.status)}
                            variant="solid"
                            px={2}
                            py={1}
                            borderRadius="md"
                          >
                            {selectedDocument.status}
                          </Badge>
                        </StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Uploaded</StatLabel>
                        <StatNumber fontSize="lg">
                          {formatDistanceToNow(new Date(selectedDocument.uploaded_at), { addSuffix: true })}
                        </StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>File Size</StatLabel>
                        <StatNumber fontSize="lg">
                          {selectedDocument.file_size ? `${(selectedDocument.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
                        </StatNumber>
                      </Stat>
                    </SimpleGrid>
                  </Box>

                  {/* Document Images */}
                  {selectedDocument.images && selectedDocument.images.length > 0 && (
                    <Box>
                      <Heading size="md" mb={4}>Document Images ({selectedDocument.images.length})</Heading>
                      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
                        {selectedDocument.images.map((image, index) => (
                          <Box key={index} borderWidth="1px" borderRadius="lg" overflow="hidden">
                            <Image
                              src={enhancedDocumentService.getDocumentImageUrl(selectedDocument.id, image.id)}
                              alt={`Document image ${index + 1}`}
                              h="150px"
                              w="100%"
                              objectFit="cover"
                              cursor="pointer"
                              onClick={() => setSelectedImage(image)}
                              _hover={{ opacity: 0.8 }}
                            />
                            <Box p={2}>
                              <Text fontSize="sm" fontWeight="medium">
                                {image.name || `Image ${index + 1}`}
                              </Text>
                              <HStack spacing={2} mt={1}>
                                <Button 
                                  size="xs" 
                                  variant="outline"
                                  onClick={() => setSelectedImage(image)}
                                >
                                  View
                                </Button>
                                <Button 
                                  size="xs" 
                                  variant="outline"
                                  onClick={() => {
                                    const url = enhancedDocumentService.getDocumentImageUrl(selectedDocument.id, image.id);
                                    window.open(url, '_blank');
                                  }}
                                >
                                  Download
                                </Button>
                              </HStack>
                            </Box>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </Box>
                  )}

                  {/* Actions */}
                  <HStack spacing={4} justify="center">
                    <Button
                      leftIcon={<FaUpload />}
                      colorScheme="brand"
                      onClick={() => {
                        onClose();
                        navigate('/tenant/documents/upload-enhanced');
                      }}
                    >
                      Upload New Document
                    </Button>
                    {selectedDocument.images && selectedDocument.images.length > 0 && (
                      <Button
                        leftIcon={<FaDownload />}
                        variant="outline"
                        onClick={() => {
                          // Download all images as zip
                          toast({
                            title: 'Download Started',
                            description: 'All document images will be downloaded.',
                            status: 'info',
                            duration: 3000,
                            isClosable: true,
                          });
                        }}
                      >
                        Download All
                      </Button>
                    )}
                  </HStack>
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </TenantLayout>
  );
};

export default EnhancedDocumentsPage;
