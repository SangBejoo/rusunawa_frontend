import React, { useState, useEffect } from 'react';
import {
  Box, Container, Heading, Text, SimpleGrid, Stat, StatLabel,
  StatNumber, StatHelpText, useColorModeValue,
  Spinner, VStack, Button, Flex, Icon, Card, CardBody,
  Badge, HStack, Alert, AlertIcon, Tabs, TabList, TabPanels, Tab, TabPanel,
  Progress, useToast
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  FaCalendarAlt, FaFileInvoiceDollar, FaBed, FaTools, 
  FaArrowRight, FaExclamationTriangle, FaChartLine, 
  FaPlus, FaEye, FaCheckCircle, FaTimesCircle, FaSync
} from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import { useTenantAuth } from '../../context/tenantAuthContext';
import useEnhancedIntegration from '../../hooks/useEnhancedIntegration';
import enhancedBookingService from '../../services/enhancedBookingService';
import PaymentStatusIndicator from '../../components/payment/PaymentStatusIndicator';
import EnhancedBookingModal from '../../components/booking/EnhancedBookingModal';

const EnhancedDashboard = () => {
  const { tenant } = useTenantAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [activeBookings, setActiveBookings] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  // Use comprehensive enhanced integration
  const {
    integrationStatus,
    paymentStats,
    recentPayments,
    notifications,
    isProcessing,
    error,
    isReady,
    needsAttention,
    checkServiceHealth,
    reinitialize
  } = useEnhancedIntegration({
    autoRefresh: true,
    refreshInterval: 30000,
    enableNotifications: true
  });  const statBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('white', 'gray.800');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Show error toast when there are integration issues
  useEffect(() => {
    if (error && needsAttention) {
      toast({
        title: 'Service Integration Issue',
        description: error,
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [error, needsAttention, toast]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!tenant?.id) return;
      
      try {
        // Fetch enhanced booking data with payment integration
        const bookingsResponse = await enhancedBookingService.getTenantBookings(tenant.id);
        setActiveBookings(bookingsResponse.bookings || []);
        
        // Fetch recent activity
        const activityResponse = await enhancedBookingService.getRecentActivity(tenant.id);
        setRecentActivity(activityResponse.activities || []);
        
      } catch (error) {
        console.error('Error fetching enhanced dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [tenant]);
  const handleQuickBooking = () => {
    setShowBookingModal(true);
  };

  const renderServiceStatus = () => (
    <Alert 
      status={isReady ? 'success' : needsAttention ? 'warning' : 'info'} 
      variant="left-accent"
      mb={4}
    >
      <AlertIcon />
      <Box flex="1">
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <Text fontWeight="medium">
              Enhanced Services: {isReady ? 'Online' : needsAttention ? 'Issues Detected' : 'Initializing'}
            </Text>
            {integrationStatus.error && (
              <Text fontSize="sm" color="gray.600">{integrationStatus.error}</Text>
            )}
          </VStack>
          <HStack spacing={2}>
            {!isReady && (
              <Button size="sm" onClick={reinitialize} leftIcon={<FaSync />}>
                Retry
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={checkServiceHealth}>
              Check Status
            </Button>
          </HStack>
        </HStack>
      </Box>
    </Alert>
  );

  const renderQuickActions = () => (
    <Card bg={cardBg} shadow="md" mb={6}>
      <CardBody>
        <Heading size="md" mb={4}>Quick Actions</Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <Button
            leftIcon={<FaPlus />}
            colorScheme="blue"
            onClick={handleQuickBooking}
            size="lg"
          >
            New Booking
          </Button>
          <Button
            leftIcon={<FaEye />}
            variant="outline"
            onClick={() => navigate('/tenant/bookings/enhanced')}            size="lg"
          >
            View All Bookings
          </Button>
        </SimpleGrid>
      </CardBody>
    </Card>
  );

  const renderEnhancedStats = () => (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
      <Stat
        bg={statBg}
        p={6}
        borderRadius="lg"
        boxShadow="md"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <StatLabel fontSize="md" fontWeight="medium">Active Bookings</StatLabel>
        <StatNumber fontSize="3xl">{activeBookings.length}</StatNumber>
        <StatHelpText>
          <Flex justify="space-between" align="center" mt={2}>
            <Text color="gray.500">Current stays</Text>
            <Icon as={FaBed} color="green.500" />
          </Flex>
        </StatHelpText>
      </Stat>

      <Stat
        bg={statBg}
        p={6}
        borderRadius="lg"
        boxShadow="md"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <StatLabel fontSize="md" fontWeight="medium">Total Paid</StatLabel>
        <StatNumber fontSize="3xl">
          Rp {paymentStats?.totalPaid?.toLocaleString('id-ID') || '0'}
        </StatNumber>
        <StatHelpText color="green.500">
          {paymentStats?.successRate || 0}% success rate
        </StatHelpText>
      </Stat>

      <Stat
        bg={statBg}
        p={6}
        borderRadius="lg"
        boxShadow="md"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <StatLabel fontSize="md" fontWeight="medium">Pending Payments</StatLabel>
        <StatNumber fontSize="3xl">
          Rp {paymentStats?.pendingAmount?.toLocaleString('id-ID') || '0'}
        </StatNumber>
        <StatHelpText color="orange.500">
          {paymentStats?.pendingCount || 0} invoices
        </StatHelpText>
      </Stat>

      <Stat
        bg={statBg}
        p={6}
        borderRadius="lg"
        boxShadow="md"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <StatLabel fontSize="md" fontWeight="medium">This Month</StatLabel>
        <StatNumber fontSize="3xl">
          Rp {paymentStats?.monthlyTotal?.toLocaleString('id-ID') || '0'}
        </StatNumber>
        <StatHelpText color="blue.500">
          {paymentStats?.monthlyGrowth >= 0 ? '+' : ''}{paymentStats?.monthlyGrowth || 0}%
        </StatHelpText>
      </Stat>
    </SimpleGrid>
  );

  const renderRecentBookings = () => (
    <Card bg={cardBg} shadow="md">
      <CardBody>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">Recent Bookings</Heading>
          <Button
            as={RouterLink}
            to="/tenant/bookings/enhanced"
            size="sm"
            variant="ghost"
            rightIcon={<FaArrowRight />}
          >
            View All
          </Button>
        </Flex>
        
        {activeBookings.length === 0 ? (
          <Text color="gray.500" textAlign="center" py={8}>
            No active bookings found
          </Text>
        ) : (
          <VStack spacing={4} align="stretch">            {activeBookings.slice(0, 5).map((booking) => (
              <Box
                key={booking.id}
                p={4}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="md"
                _hover={{ bg: hoverBg }}
              >
                <Flex justify="space-between" align="center">
                  <Box>
                    <Text fontWeight="medium">{booking.room?.name || 'Room'}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(booking.checkInDate).toLocaleDateString('id-ID')} - 
                      {new Date(booking.checkOutDate).toLocaleDateString('id-ID')}
                    </Text>
                  </Box>
                  <VStack spacing={2} align="end">
                    <Badge colorScheme={booking.status === 'confirmed' ? 'green' : 'yellow'}>
                      {booking.status}
                    </Badge>
                    {booking.payment && (
                      <PaymentStatusIndicator payment={booking.payment} size="sm" />
                    )}
                  </VStack>
                </Flex>
              </Box>
            ))}
          </VStack>
        )}
      </CardBody>
    </Card>
  );

  const renderRecentPayments = () => (
    <Card bg={cardBg} shadow="md">
      <CardBody>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">Recent Payments</Heading>
          <Button
            as={RouterLink}
            to="/tenant/payments/history"
            size="sm"
            variant="ghost"
            rightIcon={<FaArrowRight />}
          >
            View All
          </Button>
        </Flex>
        
        {recentPayments.length === 0 ? (
          <Text color="gray.500" textAlign="center" py={8}>
            No recent payments found
          </Text>
        ) : (
          <VStack spacing={4} align="stretch">
            {recentPayments.slice(0, 5).map((payment) => (
              <Box
                key={payment.id}
                p={4}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="md"
              >
                <Flex justify="space-between" align="center">
                  <Box>
                    <Text fontWeight="medium">
                      Rp {payment.amount?.toLocaleString('id-ID')}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(payment.createdAt).toLocaleDateString('id-ID')}
                    </Text>
                  </Box>
                  <PaymentStatusIndicator payment={payment} size="sm" />
                </Flex>
              </Box>
            ))}
          </VStack>
        )}
      </CardBody>
    </Card>
  );

  const renderNotifications = () => (
    <Card bg={cardBg} shadow="md">
      <CardBody>
        <Heading size="md" mb={4}>Notifications</Heading>
        
        <Alert
          status="info"
          variant="left-accent"
          borderRadius="md"
        >
          <AlertIcon />
          <Box>
            <Text fontWeight="medium">🚧 Under Development</Text>
            <Text fontSize="sm" color="gray.600">
              The notification system is currently being developed. 
              Stay tuned for updates on your bookings, payments, and important announcements.
            </Text>
          </Box>
        </Alert>
      </CardBody>
    </Card>
  );
  if (isLoading || !integrationStatus.isInitialized) {
    return (
      <TenantLayout>
        <Container maxW="container.xl" py={8}>
          <VStack spacing={8} py={10}>
            <Spinner size="xl" thickness="4px" color="brand.500" />
            <VStack spacing={2}>
              <Text>Loading your enhanced dashboard...</Text>
              {!integrationStatus.isInitialized && (
                <>
                  <Text fontSize="sm" color="gray.500">
                    Initializing enhanced services
                  </Text>
                  <Progress size="sm" isIndeterminate width="200px" />
                </>
              )}
            </VStack>
          </VStack>
        </Container>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Container maxW="container.xl" py={8}>        <Box mb={8}>
          <Heading size="xl">Enhanced Dashboard</Heading>
          <Text mt={2} color="gray.600">
            Welcome back, {tenant?.user?.full_name || tenant?.name || 'Tenant'}!
          </Text>
        </Box>

        {renderServiceStatus()}
        {renderQuickActions()}
        {renderEnhancedStats()}

        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Overview</Tab>
            <Tab>Recent Activity</Tab>
            <Tab>Analytics</Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                {renderRecentBookings()}
                {renderRecentPayments()}
              </SimpleGrid>
            </TabPanel>

            <TabPanel px={0}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                {renderNotifications()}
                <Card bg={cardBg} shadow="md">
                  <CardBody>
                    <Heading size="md" mb={4}>Recent Activity</Heading>
                    {recentActivity.length === 0 ? (
                      <Text color="gray.500" textAlign="center" py={8}>
                        No recent activity
                      </Text>
                    ) : (
                      <VStack spacing={3} align="stretch">
                        {recentActivity.map((activity, index) => (                          <Box
                            key={index}
                            p={3}
                            borderLeftWidth="3px"
                            borderLeftColor="blue.500"
                            bg={cardBg}
                          >
                            <Text fontSize="sm" fontWeight="medium">
                              {activity.description}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {new Date(activity.timestamp).toLocaleString('id-ID')}
                            </Text>
                          </Box>
                        ))}
                      </VStack>
                    )}
                  </CardBody>
                </Card>
              </SimpleGrid>
            </TabPanel>

            <TabPanel px={0}>
              <Card bg={cardBg} shadow="md">
                <CardBody>                  <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md">Payment Analytics Summary</Heading>
                  </Flex>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                    <Stat>
                      <StatLabel>Success Rate</StatLabel>
                      <StatNumber>{paymentStats?.successRate || 0}%</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Avg Processing Time</StatLabel>
                      <StatNumber>{paymentStats?.avgProcessingTime || 0}s</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Failed Payments</StatLabel>
                      <StatNumber>{paymentStats?.failedCount || 0}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Refunds</StatLabel>
                      <StatNumber>{paymentStats?.refundCount || 0}</StatNumber>
                    </Stat>
                  </SimpleGrid>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Enhanced Booking Modal */}
        {showBookingModal && (
          <EnhancedBookingModal
            isOpen={showBookingModal}
            onClose={() => setShowBookingModal(false)}
            onSuccess={() => {
              setShowBookingModal(false);
              // Refresh dashboard data
              window.location.reload();
            }}
          />
        )}
      </Container>
    </TenantLayout>
  );
};

export default EnhancedDashboard;
