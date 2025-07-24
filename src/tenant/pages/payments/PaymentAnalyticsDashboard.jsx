import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Badge,
  Button,
  Select,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  useColorModeValue,
  useToast,
  IconButton,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import {
  FaChartLine,
  FaDownload,
  FaSync,
  FaFilter,
  FaBell,
  FaInfoCircle,
  FaTrendingUp,
  FaTrendingDown,
  FaEquals,
  FaCreditCard,
  FaMoneyBillWave,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import paymentAnalyticsService from '../../services/paymentAnalyticsService';
import { handlePaymentError } from '../../utils/paymentErrorHandler';
import { formatCurrency } from '../../components/helpers/typeConverters';
import { formatDate, formatDateTime } from '../../components/helpers/dateFormatter';

const PaymentAnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [successRateData, setSuccessRateData] = useState(null);
  const [methodComparison, setMethodComparison] = useState(null);
  const [invoiceAnalytics, setInvoiceAnalytics] = useState(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('last30days');
  const [selectedTab, setSelectedTab] = useState(0);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Color mode values
  const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  // Chart colors
  const chartColors = {
    primary: '#3182CE',
    secondary: '#38A169',
    accent: '#D69E2E',
    danger: '#E53E3E',
    warning: '#DD6B20',
    info: '#3182CE',
    success: '#38A169'
  };

  const pieColors = ['#3182CE', '#38A169', '#D69E2E', '#E53E3E', '#9F7AEA', '#ED8936'];

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
    loadRealTimeMetrics();
    
    // Set up real-time updates
    const realTimeInterval = setInterval(loadRealTimeMetrics, 30000); // Every 30 seconds
    
    return () => clearInterval(realTimeInterval);
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [analytics, successRate, methodComp, invoiceData] = await Promise.all([
        paymentAnalyticsService.getPaymentAnalytics({
          period: selectedPeriod,
          includeComparisons: true
        }),
        paymentAnalyticsService.getSuccessRateAnalytics({
          period: selectedPeriod
        }),
        paymentAnalyticsService.getPaymentMethodComparison({
          period: selectedPeriod
        }),
        paymentAnalyticsService.getInvoiceAnalytics({
          period: selectedPeriod
        })
      ]);

      setAnalyticsData(analytics);
      setSuccessRateData(successRate);
      setMethodComparison(methodComp);
      setInvoiceAnalytics(invoiceData);
    } catch (error) {
      handlePaymentError(error, {
        context: { action: 'loadAnalyticsData' },
        customMessage: 'Failed to load analytics data. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRealTimeMetrics = async () => {
    try {
      const metrics = await paymentAnalyticsService.getRealTimeMetrics();
      setRealTimeMetrics(metrics);
    } catch (error) {
      console.warn('Failed to load real-time metrics:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
    
    toast({
      title: 'Analytics Refreshed',
      description: 'Dashboard data has been updated.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleExport = async (format = 'pdf') => {
    try {
      const blob = await paymentAnalyticsService.exportAnalytics({
        format,
        reportType: 'comprehensive',
        dateRange: { period: selectedPeriod }
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-analytics-${selectedPeriod}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Export Successful',
        description: `Analytics report downloaded as ${format.toUpperCase()}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      handlePaymentError(error, {
        context: { action: 'exportAnalytics' },
        customMessage: 'Failed to export analytics. Please try again.'
      });
    }
  };

  // Render overview stats
  const renderOverviewStats = () => {
    if (!analyticsData?.overview) return null;

    const { overview, comparisons } = analyticsData;
    
    const stats = [
      {
        label: 'Total Revenue',
        value: formatCurrency(overview.totalRevenue || 0),
        change: comparisons?.revenue?.percentChange || 0,
        icon: FaMoneyBillWave,
        color: 'green'
      },
      {
        label: 'Total Payments',
        value: overview.totalPayments || 0,
        change: comparisons?.payments?.percentChange || 0,
        icon: FaCreditCard,
        color: 'blue'
      },
      {
        label: 'Success Rate',
        value: `${(overview.successRate || 0).toFixed(1)}%`,
        change: comparisons?.successRate?.percentChange || 0,
        icon: FaCheckCircle,
        color: overview.successRate >= 90 ? 'green' : overview.successRate >= 75 ? 'yellow' : 'red'
      },
      {
        label: 'Avg. Processing Time',
        value: `${(overview.avgProcessingTime || 0).toFixed(1)}s`,
        change: comparisons?.processingTime?.percentChange || 0,
        icon: FaClock,
        color: 'purple',
        invertChange: true
      }
    ];

    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        {stats.map((stat, index) => (
          <Card key={index} bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <Flex justify="space-between" align="center" mb={2}>
                  <StatLabel fontSize="sm" color={mutedColor}>
                    {stat.label}
                  </StatLabel>
                  <Box as={stat.icon} color={`${stat.color}.500`} boxSize={5} />
                </Flex>
                <StatNumber fontSize="2xl" color={`${stat.color}.600`}>
                  {stat.value}
                </StatNumber>
                {stat.change !== 0 && (
                  <StatHelpText mb={0}>
                    <StatArrow 
                      type={
                        stat.invertChange 
                          ? (stat.change > 0 ? 'decrease' : 'increase')
                          : (stat.change > 0 ? 'increase' : 'decrease')
                      } 
                    />
                    {Math.abs(stat.change).toFixed(1)}%
                  </StatHelpText>
                )}
              </Stat>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    );
  };

  // Render payment trends chart
  const renderPaymentTrends = () => {
    if (!analyticsData?.trends?.length) return null;

    return (
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardHeader>
          <Heading size="md">Payment Trends</Heading>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={analyticsData.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <RechartsTooltip />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stackId="1"
                stroke={chartColors.primary}
                fill={chartColors.primary}
                fillOpacity={0.6}
                name="Revenue"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="count"
                stroke={chartColors.secondary}
                strokeWidth={2}
                name="Payment Count"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    );
  };

  // Render payment method comparison
  const renderPaymentMethodComparison = () => {
    if (!methodComparison?.methods?.length) return null;

    return (
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Payment Method Usage</Heading>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={methodComparison.methods}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {methodComparison.methods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Success Rate by Method</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              {Object.entries(methodComparison.successRates || {}).map(([method, rate]) => (
                <Box key={method}>
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="sm" fontWeight="medium">{method}</Text>
                    <Text fontSize="sm" color={mutedColor}>{rate.toFixed(1)}%</Text>
                  </Flex>
                  <Progress
                    value={rate}
                    colorScheme={rate >= 90 ? 'green' : rate >= 75 ? 'yellow' : 'red'}
                    size="sm"
                    borderRadius="md"
                  />
                </Box>
              ))}
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>
    );
  };

  // Render real-time metrics
  const renderRealTimeMetrics = () => {
    if (!realTimeMetrics) return null;

    return (
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} mb={6}>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Heading size="md">Real-Time Metrics</Heading>
            <Badge colorScheme="green" fontSize="xs">
              LIVE
            </Badge>
          </Flex>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Stat>
              <StatLabel fontSize="xs">Active Payments</StatLabel>
              <StatNumber fontSize="lg">{realTimeMetrics.activePayments}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel fontSize="xs">Today's Revenue</StatLabel>
              <StatNumber fontSize="lg">
                {formatCurrency(realTimeMetrics.currentHourStats?.revenue || 0)}
              </StatNumber>
            </Stat>
            <Stat>
              <StatLabel fontSize="xs">Success Rate (24h)</StatLabel>
              <StatNumber fontSize="lg">
                {(realTimeMetrics.currentHourStats?.successRate || 0).toFixed(1)}%
              </StatNumber>
            </Stat>
            <Stat>
              <StatLabel fontSize="xs">System Health</StatLabel>
              <Badge
                colorScheme={
                  realTimeMetrics.systemHealth?.status === 'healthy' ? 'green' :
                  realTimeMetrics.systemHealth?.status === 'warning' ? 'yellow' : 'red'
                }
              >
                {realTimeMetrics.systemHealth?.status || 'Unknown'}
              </Badge>
            </Stat>
          </SimpleGrid>

          {realTimeMetrics.alerts?.length > 0 && (
            <>
              <Divider my={4} />
              <VStack spacing={2} align="stretch">
                <Text fontSize="sm" fontWeight="medium" color={mutedColor}>
                  Active Alerts
                </Text>
                {realTimeMetrics.alerts.map((alert, index) => (
                  <Alert key={index} status={alert.severity} size="sm">
                    <AlertIcon />
                    <Text fontSize="sm">{alert.message}</Text>
                  </Alert>
                ))}
              </VStack>
            </>
          )}
        </CardBody>
      </Card>
    );
  };

  // Render invoice analytics
  const renderInvoiceAnalytics = () => {
    if (!invoiceAnalytics?.overview) return null;

    const { overview, statusDistribution } = invoiceAnalytics;

    return (
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Invoice Overview</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Flex justify="space-between">
                <Text>Total Invoices</Text>
                <Text fontWeight="bold">{overview.totalInvoices || 0}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text>Paid Amount</Text>
                <Text fontWeight="bold" color="green.500">
                  {formatCurrency(overview.paidAmount || 0)}
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text>Outstanding Amount</Text>
                <Text fontWeight="bold" color="red.500">
                  {formatCurrency(overview.outstandingAmount || 0)}
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text>Overdue Invoices</Text>
                <Badge colorScheme="red">
                  {overview.overdueCount || 0}
                </Badge>
              </Flex>
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Invoice Status Distribution</Heading>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={Object.entries(statusDistribution || {}).map(([status, count]) => ({
                status: status.charAt(0).toUpperCase() + status.slice(1),
                count
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" fill={chartColors.primary} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </SimpleGrid>
    );
  };

  if (loading) {
    return (
      <TenantLayout>
        <Container maxW="container.xl" py={8}>
          <VStack spacing={8} justify="center" minH="400px">
            <Spinner size="xl" color="brand.500" thickness="4px" />
            <Text>Loading analytics dashboard...</Text>
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
                  <Box as={FaChartLine} mr={3} color="brand.500" />
                  Payment Analytics
                </Heading>
                <Text color={mutedColor}>
                  Comprehensive insights into your payment performance
                </Text>
              </Box>

              <HStack spacing={4}>
                <Select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  maxW="200px"
                  bg={cardBg}
                >
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="last90days">Last 90 Days</option>
                  <option value="lastyear">Last Year</option>
                </Select>

                <Tooltip label="Refresh Data">
                  <IconButton
                    icon={<FaSync />}
                    onClick={handleRefresh}
                    isLoading={refreshing}
                    variant="outline"
                    aria-label="Refresh"
                  />
                </Tooltip>

                <Tooltip label="Export Report">
                  <IconButton
                    icon={<FaDownload />}
                    onClick={() => handleExport('pdf')}
                    colorScheme="brand"
                    variant="outline"
                    aria-label="Export"
                  />
                </Tooltip>
              </HStack>
            </Flex>

            {/* Real-time Metrics */}
            {renderRealTimeMetrics()}

            {/* Overview Stats */}
            {renderOverviewStats()}

            {/* Main Analytics Tabs */}
            <Tabs index={selectedTab} onChange={setSelectedTab} colorScheme="brand">
              <TabList>
                <Tab>Trends</Tab>
                <Tab>Payment Methods</Tab>
                <Tab>Invoices</Tab>
                <Tab>Performance</Tab>
              </TabList>

              <TabPanels>
                <TabPanel px={0}>
                  {renderPaymentTrends()}
                </TabPanel>

                <TabPanel px={0}>
                  {renderPaymentMethodComparison()}
                </TabPanel>

                <TabPanel px={0}>
                  {renderInvoiceAnalytics()}
                </TabPanel>

                <TabPanel px={0}>
                  <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                    <CardHeader>
                      <Heading size="md">Performance Metrics</Heading>
                    </CardHeader>
                    <CardBody>
                      <Text color={mutedColor}>
                        Performance analytics coming soon...
                      </Text>
                    </CardBody>
                  </Card>
                </TabPanel>
              </TabPanels>
            </Tabs>

            {/* Insights and Recommendations */}
            {analyticsData?.insights?.length > 0 && (
              <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md" display="flex" alignItems="center">
                    <Box as={FaInfoCircle} mr={2} color="blue.500" />
                    Insights & Recommendations
                  </Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    {analyticsData.insights.map((insight, index) => (
                      <Alert key={index} status={insight.type || 'info'} borderRadius="md">
                        <AlertIcon />
                        <Text fontSize="sm">{insight.message}</Text>
                      </Alert>
                    ))}
                  </VStack>
                </CardBody>
              </Card>
            )}
          </VStack>
        </Container>
      </Box>
    </TenantLayout>
  );
};

export default PaymentAnalyticsDashboard;
