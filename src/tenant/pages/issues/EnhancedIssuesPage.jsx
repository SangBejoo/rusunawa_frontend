// Enhanced Issues List Page with Photo Display Capabilities
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
  Divider
} from '@chakra-ui/react';
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaEye,
  FaImage,
  FaCalendarAlt,
  FaUser,
  FaMapMarkerAlt,
  FaExclamationCircle,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaTools,
  FaEdit,
  FaDownload,
  FaSync,
  FaCamera,
  FaEllipsisV
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import TenantLayout from '../../components/layout/TenantLayout';
import enhancedIssueService from '../../services/enhancedIssueService';
import { useTenantAuth } from '../../context/tenantAuthContext';

const EnhancedIssuesPage = () => {
  const { tenant } = useTenantAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

  // State management
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    priority: '',
    hasPhotos: ''
  });

  const [activeTab, setActiveTab] = useState(0);
  // Load data
  const loadIssues = useCallback(async (showRefreshIndicator = false) => {
    if (!tenant?.tenantId) return;

    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [issuesResponse, categoriesResponse] = await Promise.all([
        enhancedIssueService.getTenantIssuesWithPhotos(tenant.tenantId, filters),
        enhancedIssueService.getIssueCategoriesWithStats()
      ]);

      // Deduplicate issues by issueId (in case API returns duplicates)
      const uniqueIssues = (issuesResponse.issues || []).filter((issue, index, arr) => 
        arr.findIndex(i => i.issueId === issue.issueId) === index
      );

      setIssues(uniqueIssues);
      setCategories(categoriesResponse.categories || []);
      
    } catch (error) {
      console.error('Error loading issues:', error);
      toast({
        title: 'Loading Error',
        description: 'Failed to load your issues. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenant?.tenantId, filters, toast]);

  // Initial load
  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  // Filter issues based on active tab and filters
  useEffect(() => {
    let filtered = [...issues];

    // Filter by tab
    switch (activeTab) {
      case 1: // Open
        filtered = filtered.filter(issue => 
          ['open', 'reported', 'acknowledged'].includes(issue.status?.toLowerCase())
        );
        break;
      case 2: // In Progress
        filtered = filtered.filter(issue => 
          ['in_progress', 'assigned', 'investigating'].includes(issue.status?.toLowerCase())
        );
        break;
      case 3: // Resolved
        filtered = filtered.filter(issue => 
          ['resolved', 'closed', 'completed'].includes(issue.status?.toLowerCase())
        );
        break;
      default: // All
        break;
    }

    // Apply additional filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(issue =>
        issue.title?.toLowerCase().includes(searchLower) ||
        issue.description?.toLowerCase().includes(searchLower) ||
        issue.location?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(issue => issue.status === filters.status);
    }

    if (filters.category) {
      filtered = filtered.filter(issue => issue.category === filters.category);
    }

    if (filters.priority) {
      filtered = filtered.filter(issue => issue.priority === filters.priority);
    }

    if (filters.hasPhotos) {
      const hasPhotos = filters.hasPhotos === 'true';
      filtered = filtered.filter(issue => 
        hasPhotos ? (issue.photo_count > 0) : (issue.photo_count === 0)
      );
    }

    setFilteredIssues(filtered);
  }, [issues, activeTab, filters]);

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
      status: '',
      category: '',
      priority: '',
      hasPhotos: ''
    });
  };

  // View issue details
  const viewIssueDetails = (issue) => {
    navigate(`/tenant/issues/${issue.id}`);
  };

  // Preview photo
  const previewPhoto = (issue, photo) => {
    setSelectedIssue(issue);
    setSelectedPhoto(photo);
    onOpen();
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'reported':
        return 'red';
      case 'acknowledged':
      case 'assigned':
        return 'orange';
      case 'in_progress':
      case 'investigating':
        return 'blue';
      case 'resolved':
      case 'completed':
        return 'green';
      case 'closed':
        return 'gray';
      default:
        return 'gray';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'green';
      default:
        return 'gray';
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

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'reported':
        return FaExclamationCircle;
      case 'in_progress':
      case 'investigating':
        return FaClock;
      case 'resolved':
      case 'completed':
        return FaCheckCircle;
      case 'closed':
        return FaTimesCircle;
      default:
        return FaTools;
    }
  };

  // Issue card component
  const IssueCard = ({ issue }) => {
    const StatusIcon = getStatusIcon(issue.status);
    
    return (
      <Card
        bg={bgColor}
        borderColor={borderColor}
        borderWidth="1px"
        _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
        transition="all 0.2s"
        cursor="pointer"
        onClick={() => viewIssueDetails(issue)}
      >
        <CardBody p={4}>
          <Grid templateColumns="1fr auto" gap={4}>
            {/* Main Content */}
            <VStack align="start" spacing={3}>
              {/* Header */}
              <HStack justify="space-between" w="full">
                <HStack spacing={3}>
                  <Box as={StatusIcon} color={`${getStatusColor(issue.status)}.500`} />
                  <Badge colorScheme={getStatusColor(issue.status)} variant="subtle">
                    {issue.status?.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge colorScheme={getPriorityColor(issue.priority)} variant="outline">
                    {getPriorityLabel(issue.priority).toUpperCase()}
                  </Badge>
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
                    <MenuItem icon={<FaEye />} onClick={() => viewIssueDetails(issue)}>
                      View Details
                    </MenuItem>
                    {issue.status === 'open' && (
                      <MenuItem icon={<FaEdit />}>
                        Edit Issue
                      </MenuItem>
                    )}
                    <MenuDivider />
                    <MenuItem icon={<FaDownload />}>
                      Export Report
                    </MenuItem>
                  </MenuList>
                </Menu>
              </HStack>

              {/* Title and Description */}
              <Box>
                <Heading size="sm" mb={1} noOfLines={1}>
                  {issue.title}
                </Heading>
                <Text fontSize="sm" color="gray.600" noOfLines={2}>
                  {issue.description}
                </Text>
              </Box>

              {/* Metadata */}
              <HStack spacing={4} fontSize="xs" color="gray.500">
                {issue.category && (
                  <HStack spacing={1}>
                    <FaTools />
                    <Text>{issue.category}</Text>
                  </HStack>
                )}
                {issue.location && (
                  <HStack spacing={1}>
                    <FaMapMarkerAlt />
                    <Text>{issue.location}</Text>
                  </HStack>
                )}
                <HStack spacing={1}>
                  <FaCalendarAlt />
                  <Text>
                    {formatDistanceToNow(new Date(issue.created_at || Date.now()), { addSuffix: true })}
                  </Text>
                </HStack>
                {issue.photo_count > 0 && (
                  <HStack spacing={1}>
                    <FaCamera />
                    <Text>{issue.photo_count} photo{issue.photo_count !== 1 ? 's' : ''}</Text>
                  </HStack>
                )}
              </HStack>
            </VStack>

            {/* Photos Preview */}
            {issue.photos && issue.photos.length > 0 && (
              <Box flexShrink={0}>
                <SimpleGrid columns={issue.photos.length === 1 ? 1 : 2} spacing={2} maxW="120px">
                  {issue.photos.slice(0, 3).map((photo, index) => (
                    <Box key={photo.id || index} position="relative">
                      <AspectRatio ratio={1} w="50px">
                        <Image
                          src={enhancedIssueService.getIssuePhotoThumbnailUrl(issue.id, photo.id, { size: 100 })}
                          alt={`Issue photo ${index + 1}`}
                          objectFit="cover"
                          borderRadius="md"
                          border="1px solid"
                          borderColor={borderColor}
                          onClick={(e) => {
                            e.stopPropagation();
                            previewPhoto(issue, photo);
                          }}
                          _hover={{ opacity: 0.8 }}
                          cursor="pointer"
                        />
                      </AspectRatio>
                      
                      {index === 2 && issue.photos.length > 3 && (
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
                          +{issue.photos.length - 3}
                        </Flex>
                      )}
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            )}
          </Grid>
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
            <Skeleton height="20px" width="80px" />
          </HStack>
          <Box w="full">
            <Skeleton height="16px" width="60%" mb={2} />
            <SkeletonText mt="4" noOfLines={2} spacing="4" />
          </Box>
          <HStack spacing={4} w="full">
            <Skeleton height="14px" width="80px" />
            <Skeleton height="14px" width="100px" />
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
                  Maintenance Issues
                </Heading>
                <Text color="gray.600">
                  Track and manage your maintenance requests with photo documentation
                </Text>
              </Box>
              <HStack spacing={3}>
                <Button
                  leftIcon={<FaSync />}
                  variant="outline"
                  onClick={() => loadIssues(true)}
                  isLoading={refreshing}
                  size="sm"
                >
                  Refresh
                </Button>
                <Button
                  leftIcon={<FaPlus />}
                  colorScheme="brand"
                  onClick={() => navigate('/tenant/issues/report-enhanced')}
                >
                  Report New Issue
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
                    placeholder="Search issues..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </InputGroup>

                <Select
                  placeholder="All Categories"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.code}>
                      {category.name}
                    </option>
                  ))}
                </Select>

                <Select
                  placeholder="All Priorities"
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </Select>

                <Select
                  placeholder="Photos"
                  value={filters.hasPhotos}
                  onChange={(e) => handleFilterChange('hasPhotos', e.target.value)}
                >
                  <option value="true">With Photos</option>
                  <option value="false">Without Photos</option>
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
                <Tab>All Issues ({issues.length})</Tab>
                <Tab>
                  Open ({issues.filter(i => ['open', 'reported', 'acknowledged'].includes(i.status?.toLowerCase())).length})
                </Tab>
                <Tab>
                  In Progress ({issues.filter(i => ['in_progress', 'assigned', 'investigating'].includes(i.status?.toLowerCase())).length})
                </Tab>
                <Tab>
                  Resolved ({issues.filter(i => ['resolved', 'closed', 'completed'].includes(i.status?.toLowerCase())).length})
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel px={0}>
                  {loading ? (
                    <Stack spacing={4}>
                      {[...Array(5)].map((_, index) => (
                        <LoadingSkeleton key={index} />
                      ))}
                    </Stack>
                  ) : filteredIssues.length === 0 ? (
                    <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                      <CardBody py={12}>
                        <VStack spacing={4} textAlign="center">
                          <Box as={FaTools} size="3em" color="gray.400" />
                          <Heading size="md" color="gray.500">
                            No Issues Found
                          </Heading>
                          <Text color="gray.500">
                            {filters.search || filters.category || filters.priority || filters.hasPhotos
                              ? 'No issues match your current filters.'
                              : 'You haven\'t reported any maintenance issues yet.'
                            }
                          </Text>
                          {!filters.search && !filters.category && !filters.priority && !filters.hasPhotos && (
                            <Button
                              leftIcon={<FaPlus />}
                              colorScheme="brand"
                              onClick={() => navigate('/tenant/issues/report-enhanced')}
                            >
                              Report Your First Issue
                            </Button>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {filteredIssues.map(issue => (
                        <IssueCard key={issue.id} issue={issue} />
                      ))}
                    </VStack>
                  )}
                </TabPanel>

                {/* Other tab panels use the same content structure */}
                {[1, 2, 3].map(tabIndex => (
                  <TabPanel key={tabIndex} px={0}>
                    {loading ? (
                      <Stack spacing={4}>
                        {[...Array(3)].map((_, index) => (
                          <LoadingSkeleton key={index} />
                        ))}
                      </Stack>
                    ) : filteredIssues.length === 0 ? (
                      <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                        <CardBody py={12}>
                          <VStack spacing={4} textAlign="center">
                            <Box as={FaTools} size="3em" color="gray.400" />
                            <Heading size="md" color="gray.500">
                              No Issues in This Category
                            </Heading>
                            <Text color="gray.500">
                              All your issues are in other status categories.
                            </Text>
                          </VStack>
                        </CardBody>
                      </Card>
                    ) : (
                      <VStack spacing={4} align="stretch">
                        {filteredIssues.map(issue => (
                          <IssueCard key={issue.id} issue={issue} />
                        ))}
                      </VStack>
                    )}
                  </TabPanel>
                ))}
              </TabPanels>
            </Tabs>
          </Box>
        </VStack>

        {/* Photo Preview Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {selectedIssue && `Photo from: ${selectedIssue.title}`}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {selectedPhoto && selectedIssue && (
                <VStack spacing={4}>
                  <Image
                    src={enhancedIssueService.getIssuePhotoUrl(selectedIssue.id, selectedPhoto.id)}
                    alt="Issue photo"
                    maxH="500px"
                    objectFit="contain"
                    borderRadius="md"
                  />
                  <Box textAlign="center">
                    <Text fontWeight="medium">{selectedPhoto.name || 'Issue Photo'}</Text>
                    <Text fontSize="sm" color="gray.500">
                      Uploaded {formatDistanceToNow(new Date(selectedPhoto.uploaded_at || Date.now()), { addSuffix: true })}
                    </Text>
                  </Box>
                  <HStack spacing={4}>
                    <Button
                      leftIcon={<FaDownload />}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const url = enhancedIssueService.getIssuePhotoUrl(selectedIssue.id, selectedPhoto.id);
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
                        onClose();
                        viewIssueDetails(selectedIssue);
                      }}
                    >
                      View Issue Details
                    </Button>
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

export default EnhancedIssuesPage;
