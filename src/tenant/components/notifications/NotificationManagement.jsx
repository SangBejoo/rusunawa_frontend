import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  IconButton,
  Flex,
  SimpleGrid,
  Switch,
  FormControl,
  FormLabel,
  Select,
  Textarea,
  Alert,
  AlertIcon,
  Spinner,
  useColorModeValue,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react';
import {
  FaBell,
  FaCheck,
  FaTrash,
  FaCog,
  FaFilter,
  FaEnvelope,
  FaSms,
  FaMobile,
  FaDesktop,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaTimes,
  FaEllipsisV,
  FaSync,
  FaClear,
  FaDownload,
  FaCalendarAlt,
  FaCreditCard,
  FaFileInvoice
} from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import { usePaymentNotifications } from '../../hooks/useEnhancedPayments';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITY, DELIVERY_CHANNELS } from '../../services/paymentNotificationService';
import { formatDateTime, formatDate } from '../../components/helpers/dateFormatter';

const NotificationManagement = () => {
  const {
    notifications,
    unreadCount,
    preferences,
    loading,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    updatePreferences,
    getStats,
    refresh
  } = usePaymentNotifications();

  const [selectedTab, setSelectedTab] = useState(0);
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showRead, setShowRead] = useState(true);
  const [stats, setStats] = useState({});
  const [localPreferences, setLocalPreferences] = useState({});
  const [savingPreferences, setSavingPreferences] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Color mode values
  const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  // Load stats
  useEffect(() => {
    if (typeof getStats === 'function') {
      const notificationStats = getStats();
      setStats(notificationStats);
    }
  }, [notifications, getStats]);

  // Initialize preferences
  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.PAYMENT_SUCCESS:
        return FaCheckCircle;
      case NOTIFICATION_TYPES.PAYMENT_FAILED:
        return FaExclamationTriangle;
      case NOTIFICATION_TYPES.PAYMENT_PENDING:
        return FaCreditCard;
      case NOTIFICATION_TYPES.INVOICE_CREATED:
      case NOTIFICATION_TYPES.INVOICE_DUE:
      case NOTIFICATION_TYPES.INVOICE_OVERDUE:
        return FaFileInvoice;
      case NOTIFICATION_TYPES.VERIFICATION_REQUIRED:
      case NOTIFICATION_TYPES.VERIFICATION_COMPLETE:
        return FaCheck;
      case NOTIFICATION_TYPES.SECURITY_ALERT:
        return FaExclamationTriangle;
      default:
        return FaInfoCircle;
    }
  };

  // Get notification color based on type and priority
  const getNotificationColor = (type, priority) => {
    if (priority === NOTIFICATION_PRIORITY.URGENT) return 'red';
    if (priority === NOTIFICATION_PRIORITY.HIGH) return 'orange';
    
    switch (type) {
      case NOTIFICATION_TYPES.PAYMENT_SUCCESS:
      case NOTIFICATION_TYPES.VERIFICATION_COMPLETE:
        return 'green';
      case NOTIFICATION_TYPES.PAYMENT_FAILED:
      case NOTIFICATION_TYPES.SECURITY_ALERT:
        return 'red';
      case NOTIFICATION_TYPES.PAYMENT_PENDING:
      case NOTIFICATION_TYPES.VERIFICATION_REQUIRED:
        return 'yellow';
      case NOTIFICATION_TYPES.INVOICE_DUE:
      case NOTIFICATION_TYPES.INVOICE_OVERDUE:
        return 'orange';
      default:
        return 'blue';
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filterType !== 'all' && notification.type !== filterType) return false;
    if (filterPriority !== 'all' && notification.priority !== filterPriority) return false;
    if (!showRead && notification.read) return false;
    return true;
  });

  // Handle preference update
  const handlePreferenceUpdate = async (type, field, value) => {
    const newPrefs = {
      ...localPreferences,
      [type]: {
        ...localPreferences[type],
        [field]: value
      }
    };
    setLocalPreferences(newPrefs);
  };

  // Save preferences
  const savePreferences = async () => {
    setSavingPreferences(true);
    try {
      const success = await updatePreferences(localPreferences);
      if (success) {
        toast({
          title: 'Preferences Saved',
          description: 'Your notification preferences have been updated.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSavingPreferences(false);
    }
  };

  // Render notification item
  const renderNotificationItem = (notification) => {
    const Icon = getNotificationIcon(notification.type);
    const color = getNotificationColor(notification.type, notification.priority);

    return (
      <Card
        key={notification.id}
        bg={cardBg}
        borderWidth="1px"
        borderColor={notification.read ? borderColor : `${color}.200`}
        borderLeftWidth={notification.read ? '1px' : '4px'}
        borderLeftColor={notification.read ? borderColor : `${color}.500`}
        opacity={notification.read ? 0.7 : 1}
        cursor="pointer"
        onClick={() => !notification.read && markAsRead(notification.id)}
        _hover={{ boxShadow: 'sm' }}
      >
        <CardBody py={4}>
          <Flex align="start" gap={3}>
            <Box
              as={Icon}
              color={`${color}.500`}
              boxSize={5}
              mt={1}
              flexShrink={0}
            />
            
            <Box flex="1" minW={0}>
              <Flex justify="space-between" align="start" mb={2}>
                <Text
                  fontWeight={notification.read ? 'normal' : 'semibold'}
                  fontSize="sm"
                  noOfLines={1}
                >
                  {notification.title}
                </Text>
                
                <HStack spacing={2}>
                  <Badge
                    colorScheme={color}
                    size="sm"
                    variant={notification.read ? 'outline' : 'solid'}
                  >
                    {notification.priority}
                  </Badge>
                  
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      icon={<FaEllipsisV />}
                      size="xs"
                      variant="ghost"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <MenuList>
                      {!notification.read && (
                        <MenuItem
                          icon={<FaCheck />}
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          Mark as Read
                        </MenuItem>
                      )}
                      <MenuItem
                        icon={<FaTrash />}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle delete notification
                        }}
                      >
                        Delete
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </HStack>
              </Flex>
              
              <Text fontSize="sm" color={mutedColor} mb={2} noOfLines={2}>
                {notification.message}
              </Text>
              
              <HStack justify="space-between" fontSize="xs" color={mutedColor}>
                <Text>{formatDateTime(notification.timestamp)}</Text>
                <HStack spacing={1}>
                  {notification.channels?.map((channel, index) => {
                    const ChannelIcon = {
                      [DELIVERY_CHANNELS.IN_APP]: FaDesktop,
                      [DELIVERY_CHANNELS.EMAIL]: FaEnvelope,
                      [DELIVERY_CHANNELS.SMS]: FaSms,
                      [DELIVERY_CHANNELS.PUSH]: FaMobile
                    }[channel] || FaDesktop;
                    
                    return (
                      <Tooltip key={index} label={channel.replace('_', ' ')}>
                        <Box as={ChannelIcon} boxSize={3} />
                      </Tooltip>
                    );
                  })}
                </HStack>
              </HStack>
            </Box>
          </Flex>
        </CardBody>
      </Card>
    );
  };

  // Render statistics
  const renderStatistics = () => (
    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
      <Stat>
        <StatLabel fontSize="sm">Total Notifications</StatLabel>
        <StatNumber fontSize="lg">{stats.total || 0}</StatNumber>
      </Stat>
      <Stat>
        <StatLabel fontSize="sm">Unread</StatLabel>
        <StatNumber fontSize="lg" color="blue.500">{stats.unread || 0}</StatNumber>
      </Stat>
      <Stat>
        <StatLabel fontSize="sm">Today</StatLabel>
        <StatNumber fontSize="lg">{stats.today || 0}</StatNumber>
      </Stat>
      <Stat>
        <StatLabel fontSize="sm">This Week</StatLabel>
        <StatNumber fontSize="lg">{stats.thisWeek || 0}</StatNumber>
      </Stat>
    </SimpleGrid>
  );

  // Render filters
  const renderFilters = () => (
    <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} mb={6}>
      <CardHeader pb={2}>
        <Heading size="sm">Filters</Heading>
      </CardHeader>
      <CardBody pt={0}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm">Type</FormLabel>
            <Select
              size="sm"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              {Object.values(NOTIFICATION_TYPES).map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </Select>
          </FormControl>
          
          <FormControl>
            <FormLabel fontSize="sm">Priority</FormLabel>
            <Select
              size="sm"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              {Object.values(NOTIFICATION_PRIORITY).map(priority => (
                <option key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </Select>
          </FormControl>
          
          <FormControl>
            <FormLabel fontSize="sm">Show Read</FormLabel>
            <Switch
              isChecked={showRead}
              onChange={(e) => setShowRead(e.target.checked)}
              colorScheme="blue"
            />
          </FormControl>
        </SimpleGrid>
      </CardBody>
    </Card>
  );

  // Render preferences tab
  const renderPreferencesTab = () => (
    <VStack spacing={6} align="stretch">
      {Object.entries(NOTIFICATION_TYPES).map(([key, type]) => {
        const prefs = localPreferences[type] || {};
        
        return (
          <Card key={type} bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader pb={2}>
              <Heading size="sm">
                {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Heading>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <HStack justify="space-between">
                    <FormLabel fontSize="sm" mb={0}>Enable Notifications</FormLabel>
                    <Switch
                      isChecked={prefs.enabled !== false}
                      onChange={(e) => handlePreferenceUpdate(type, 'enabled', e.target.checked)}
                      colorScheme="blue"
                    />
                  </HStack>
                </FormControl>

                {prefs.enabled !== false && (
                  <>
                    <FormControl>
                      <FormLabel fontSize="sm">Priority</FormLabel>
                      <Select
                        size="sm"
                        value={prefs.priority || NOTIFICATION_PRIORITY.MEDIUM}
                        onChange={(e) => handlePreferenceUpdate(type, 'priority', e.target.value)}
                      >
                        {Object.values(NOTIFICATION_PRIORITY).map(priority => (
                          <option key={priority} value={priority}>
                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Delivery Channels</FormLabel>
                      <VStack spacing={2} align="stretch">
                        {Object.values(DELIVERY_CHANNELS).map(channel => (
                          <HStack key={channel} justify="space-between">
                            <Text fontSize="sm">
                              {channel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Text>
                            <Switch
                              size="sm"
                              isChecked={prefs.channels?.includes(channel) !== false}
                              onChange={(e) => {
                                const currentChannels = prefs.channels || [DELIVERY_CHANNELS.IN_APP];
                                const newChannels = e.target.checked
                                  ? [...currentChannels, channel]
                                  : currentChannels.filter(c => c !== channel);
                                handlePreferenceUpdate(type, 'channels', newChannels);
                              }}
                              colorScheme="blue"
                            />
                          </HStack>
                        ))}
                      </VStack>
                    </FormControl>
                  </>
                )}
              </VStack>
            </CardBody>
          </Card>
        );
      })}

      <Button
        colorScheme="blue"
        onClick={savePreferences}
        isLoading={savingPreferences}
        loadingText="Saving..."
      >
        Save Preferences
      </Button>
    </VStack>
  );

  if (loading) {
    return (
      <TenantLayout>
        <Container maxW="container.xl" py={8}>
          <VStack spacing={8} justify="center" minH="400px">
            <Spinner size="xl" color="brand.500" thickness="4px" />
            <Text>Loading notifications...</Text>
          </VStack>
        </Container>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Box bg={bg} minH="100vh" py={8}>
        <Container maxW="container.xl">
          <VStack spacing={8} align="stretch">
            {/* Header */}
            <Flex 
              direction={{ base: 'column', md: 'row' }}
              justify="space-between"
              align={{ base: 'flex-start', md: 'center' }}
              gap={4}
            >
              <Box>
                <Heading as="h1" size="xl" mb={2} display="flex" alignItems="center">
                  <Box as={FaBell} mr={3} color="brand.500" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge ml={2} colorScheme="red" borderRadius="full">
                      {unreadCount}
                    </Badge>
                  )}
                </Heading>
                <Text color={mutedColor}>
                  Manage your payment and system notifications
                </Text>
              </Box>

              <HStack spacing={4}>
                <Tooltip label="Refresh Notifications">
                  <IconButton
                    icon={<FaSync />}
                    onClick={refresh}
                    variant="outline"
                    aria-label="Refresh"
                  />
                </Tooltip>

                {unreadCount > 0 && (
                  <Button
                    leftIcon={<FaCheck />}
                    onClick={markAllAsRead}
                    colorScheme="blue"
                    variant="outline"
                  >
                    Mark All Read
                  </Button>
                )}

                <Button
                  leftIcon={<FaTrash />}
                  onClick={() => clearNotifications(7)}
                  variant="outline"
                  colorScheme="red"
                >
                  Clear Old
                </Button>
              </HStack>
            </Flex>

            {/* Statistics */}
            {renderStatistics()}

            {/* Main Content */}
            <Tabs index={selectedTab} onChange={setSelectedTab} colorScheme="brand">
              <TabList>
                <Tab>
                  Notifications
                  {unreadCount > 0 && (
                    <Badge ml={2} colorScheme="red" borderRadius="full" fontSize="xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Tab>
                <Tab>Preferences</Tab>
                <Tab>Analytics</Tab>
              </TabList>

              <TabPanels>
                {/* Notifications Tab */}
                <TabPanel px={0}>
                  {renderFilters()}
                  
                  <VStack spacing={4} align="stretch">
                    {filteredNotifications.length > 0 ? (
                      filteredNotifications.map(renderNotificationItem)
                    ) : (
                      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                        <CardBody textAlign="center" py={12}>
                          <Box as={FaBell} boxSize={12} color={mutedColor} mb={4} mx="auto" />
                          <Text color={mutedColor}>
                            {notifications.length === 0 
                              ? 'No notifications yet'
                              : 'No notifications match your filters'
                            }
                          </Text>
                        </CardBody>
                      </Card>
                    )}
                  </VStack>
                </TabPanel>

                {/* Preferences Tab */}
                <TabPanel px={0}>
                  {renderPreferencesTab()}
                </TabPanel>

                {/* Analytics Tab */}
                <TabPanel px={0}>
                  <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                    <CardHeader>
                      <Heading size="md">Notification Analytics</Heading>
                    </CardHeader>
                    <CardBody>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        <Box>
                          <Text fontWeight="medium" mb={2}>By Type</Text>
                          <VStack spacing={2} align="stretch">
                            {Object.entries(stats.byType || {}).map(([type, count]) => (
                              <Flex key={type} justify="space-between">
                                <Text fontSize="sm">
                                  {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Text>
                                <Text fontSize="sm" fontWeight="medium">{count}</Text>
                              </Flex>
                            ))}
                          </VStack>
                        </Box>

                        <Box>
                          <Text fontWeight="medium" mb={2}>By Priority</Text>
                          <VStack spacing={2} align="stretch">
                            {Object.entries(stats.byPriority || {}).map(([priority, count]) => (
                              <Flex key={priority} justify="space-between">
                                <Text fontSize="sm">
                                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                </Text>
                                <Text fontSize="sm" fontWeight="medium">{count}</Text>
                              </Flex>
                            ))}
                          </VStack>
                        </Box>
                      </SimpleGrid>
                    </CardBody>
                  </Card>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Container>
      </Box>
    </TenantLayout>
  );
};

export default NotificationManagement;
