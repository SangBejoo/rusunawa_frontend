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
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  useToast,
  Tooltip
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  FaPlus,
  FaExclamationTriangle,
  FaCheck,
  FaClock,
  FaTools,
  FaCalendarAlt,
  FaBed
} from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import { useTenantAuth } from '../../context/tenantAuthContext';
import issueService from '../../services/issueService';
import bookingService from '../../services/bookingService';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

const IssuesPage = () => {
  const { tenant } = useTenantAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Booking-related state for checking if user can report issues
  const [activeBookings, setActiveBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');  // Fetch tenant-specific issues from API
  useEffect(() => {
    const fetchData = async () => {
      if (!tenant?.tenantId) {
        setLoading(false);
        setLoadingBookings(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch both issues and bookings in parallel
        const [issuesResponse, bookingsResponse] = await Promise.all([
          issueService.getTenantIssues(tenant.tenantId),
          bookingService.getTenantBookings(tenant.tenantId)
        ]);
        
        // Process issues
        let issuesData = issuesResponse.issues || issuesResponse || [];
        const uniqueIssues = issuesData.filter((issue, index, arr) => 
          arr.findIndex(i => i.issueId === issue.issueId) === index
        );
        setIssues(uniqueIssues);
        
        // Process bookings to find active ones
        if (bookingsResponse?.bookings) {
          const now = new Date();
          const activeBookings = bookingsResponse.bookings.filter(booking => {
            const checkIn = new Date(booking.checkInDate || booking.check_in);
            const checkOut = new Date(booking.checkOutDate || booking.check_out);
            
            return (
              (booking.status === 'checked_in') ||
              (booking.status === 'confirmed' && now >= checkIn && now <= checkOut) ||
              (booking.status === 'approved' && checkIn <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000))
            );
          });
          setActiveBookings(activeBookings);
        }
        
      } catch (err) {
        setError(err.message || 'Failed to load your issues');
        console.error('Error fetching data:', err);
        toast({
          title: 'Error Loading Data',
          description: err.message || 'Failed to load your issues',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
        setLoadingBookings(false);
      }
    };

    fetchData();
  }, [tenant?.tenantId, toast]);

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

  // Filter issues by status
  const filterIssuesByStatus = (status) => {
    if (status === 'all') return issues;
    return issues.filter(issue => issue.status === status);  };

  // Issue card component
  const IssueCard = ({ issue }) => (
    <Card 
      bg={cardBg} 
      borderWidth="1px" 
      borderColor={borderColor} 
      _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
      transition="all 0.2s"
      cursor="pointer"
      onClick={() => navigate(`/tenant/issues/${issue.issueId}`)}
    >
      <CardHeader pb={2}>
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={1} flex="1">
            <Heading size="sm" noOfLines={1}>
              {issue.title || `Issue #${issue.issueId}`}
            </Heading>
            <Text fontSize="sm" color="gray.500" noOfLines={2}>
              {issue.description || 'No description provided'}
            </Text>
          </VStack>
          <Badge colorScheme={getStatusColor(issue.status)} variant="solid">
            {(issue.status || 'pending').replace('_', ' ').toUpperCase()}
          </Badge>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <VStack align="stretch" spacing={3}>
          {issue.category && (
            <HStack justify="space-between">
              <HStack spacing={2}>
                <Icon as={FaTools} color="gray.500" />
                <Text fontSize="sm" color="gray.600">{issue.category}</Text>
              </HStack>
              {issue.priority ? (
                <Badge colorScheme={getPriorityColor(issue.priority)} variant="outline">
                  {getPriorityLabel(issue.priority).toUpperCase()}
                </Badge>
              ) : (
                <Badge colorScheme="gray" variant="outline">
                  PRIORITY PENDING
                </Badge>
              )}
            </HStack>
          )}
          
          <HStack spacing={2}>
            <Icon as={FaCalendarAlt} color="gray.500" />
            <Text fontSize="sm" color="gray.600">
              {formatDate(issue.reportedAt)}
            </Text>
          </HStack>
          
          <Button 
            size="sm" 
            colorScheme="blue" 
            variant="outline"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              navigate(`/tenant/issues/${issue.issueId}`);
            }}
          >
            View Details
          </Button>
        </VStack>
      </CardBody>
    </Card>
  );
  if (loading) {
    return (
      <TenantLayout>
        <Container maxW="container.xl" py={8}>
          <VStack spacing={8} align="center">
            <Spinner size="xl" color="blue.500" />
            <Text>Loading your issues...</Text>
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

  if (!tenant?.tenantId) {
    return (
      <TenantLayout>
        <Container maxW="container.xl" py={8}>
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            Please log in to view your issues.
          </Alert>
        </Container>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="center">
            <Box>
              <Heading size="xl" mb={2}>
                Maintenance Issues
              </Heading>
              <Text color="gray.600">
                Report and track maintenance issues in your room
              </Text>
            </Box>
            
            {/* Conditional Report Button */}
            {loadingBookings ? (
              <Spinner />
            ) : activeBookings.length > 0 ? (
              <Button
                as={RouterLink}
                to="/tenant/issues/report"
                leftIcon={<FaPlus />}
                colorScheme="blue"
                size="lg"
              >
                Report New Issue
              </Button>
            ) : (
              <VStack spacing={2} align="end">
                <Tooltip 
                  label="You need an active booking to report maintenance issues" 
                  hasArrow
                >
                  <Button
                    leftIcon={<FaPlus />}
                    colorScheme="gray"
                    size="lg"
                    isDisabled
                    cursor="not-allowed"
                  >
                    Report New Issue
                  </Button>
                </Tooltip>
                <Text fontSize="xs" color="red.500" textAlign="center">
                  Requires active booking
                </Text>
                <Button
                  as={RouterLink}
                  to="/tenant/rooms"
                  leftIcon={<FaBed />}
                  colorScheme="blue"
                  variant="outline"
                  size="sm"
                >
                  Browse Rooms
                </Button>
              </VStack>
            )}
          </HStack>

          {/* Active Booking Alert */}
          {!loadingBookings && activeBookings.length === 0 && (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="medium">No Active Booking Found</Text>
                <Text fontSize="sm">
                  You need to have an active room booking to report maintenance issues. 
                  Make a booking first to access issue reporting.
                </Text>
              </Box>
            </Alert>
          )}

          {/* Stats */}
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <Card bg={cardBg} textAlign="center">
              <CardBody>
                <VStack spacing={2}>
                  <Icon as={FaExclamationTriangle} boxSize={8} color="red.500" />
                  <Heading size="lg">{filterIssuesByStatus('open').length}</Heading>
                  <Text color="gray.600">Open Issues</Text>
                </VStack>
              </CardBody>
            </Card>
            
            <Card bg={cardBg} textAlign="center">
              <CardBody>
                <VStack spacing={2}>
                  <Icon as={FaClock} boxSize={8} color="yellow.500" />
                  <Heading size="lg">{filterIssuesByStatus('in_progress').length}</Heading>
                  <Text color="gray.600">In Progress</Text>
                </VStack>
              </CardBody>
            </Card>
            
            <Card bg={cardBg} textAlign="center">
              <CardBody>
                <VStack spacing={2}>
                  <Icon as={FaCheck} boxSize={8} color="green.500" />
                  <Heading size="lg">{filterIssuesByStatus('resolved').length}</Heading>
                  <Text color="gray.600">Resolved</Text>
                </VStack>
              </CardBody>
            </Card>
            
            <Card bg={cardBg} textAlign="center">
              <CardBody>
                <VStack spacing={2}>
                  <Icon as={FaTools} boxSize={8} color="blue.500" />
                  <Heading size="lg">{issues.length}</Heading>
                  <Text color="gray.600">Total Issues</Text>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Issues List with Tabs */}
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>All Issues</Tab>
              <Tab>Open</Tab>
              <Tab>In Progress</Tab>
              <Tab>Resolved</Tab>
            </TabList>

            <TabPanels>
              {/* All Issues */}
              <TabPanel px={0}>
                {issues.length === 0 ? (
                  <Card bg={cardBg} textAlign="center" py={10}>
                    <CardBody>
                      <VStack spacing={4}>
                        <Icon as={FaTools} boxSize={12} color="gray.400" />
                        <Heading size="md" color="gray.500">
                          No Issues Found
                        </Heading>
                        <Text color="gray.500">
                          You haven't reported any maintenance issues yet.
                        </Text>
                        <Button
                          as={RouterLink}
                          to="/tenant/issues/report"
                          leftIcon={<FaPlus />}
                          colorScheme="blue"
                        >
                          Report Your First Issue
                        </Button>
                      </VStack>                    </CardBody>
                  </Card>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {issues.map((issue) => (
                      <IssueCard key={issue.issueId} issue={issue} />
                    ))}
                  </SimpleGrid>                )}
              </TabPanel>

              {/* Open Issues */}
              <TabPanel px={0}>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {filterIssuesByStatus('open').map((issue) => (
                    <IssueCard key={issue.issueId} issue={issue} />
                  ))}
                </SimpleGrid>
                {filterIssuesByStatus('open').length === 0 && (
                  <Text textAlign="center" color="gray.500" py={8}>
                    No open issues found.
                  </Text>                )}
              </TabPanel>

              {/* In Progress Issues */}
              <TabPanel px={0}>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {filterIssuesByStatus('in_progress').map((issue) => (
                    <IssueCard key={issue.issueId} issue={issue} />
                  ))}
                </SimpleGrid>
                {filterIssuesByStatus('in_progress').length === 0 && (
                  <Text textAlign="center" color="gray.500" py={8}>
                    No issues currently in progress.
                  </Text>                )}
              </TabPanel>

              {/* Resolved Issues */}
              <TabPanel px={0}>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {filterIssuesByStatus('resolved').map((issue) => (
                    <IssueCard key={issue.issueId} issue={issue} />
                  ))}
                </SimpleGrid>
                {filterIssuesByStatus('resolved').length === 0 && (
                  <Text textAlign="center" color="gray.500" py={8}>
                    No resolved issues found.
                  </Text>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>
    </TenantLayout>
  );
};

export default IssuesPage;
