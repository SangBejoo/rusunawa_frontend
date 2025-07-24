import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  VStack,
  HStack,
  Select,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Skeleton,
  Alert,
  AlertIcon,
  useColorModeValue,
  Icon,
  Badge,
  Progress,
  SimpleGrid,
  Divider,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider
} from '@chakra-ui/react';
import {  FiTrendingUp,
  FiUsers,
  FiDollarSign,
  FiCalendar,
  FiDownload,
  FiHome,
  FiCreditCard,
  FiCheckCircle,
  FiClock,
  FiChevronDown
} from 'react-icons/fi';
import { MdApartment as FiBuilding } from 'react-icons/md';
import AdminLayout from '../../components/layout/AdminLayout';
import analyticsService from '../../services/analyticsService';
import { MetricCard, RevenueBreakdown, AnalyticsSummary } from '../../components/analytics';
// import { AIAnalytics, StreamingAnalytics } from '../../components/analytics'; // Hidden for now

const Analytics = () => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const toast = useToast();
  
  // Define all color mode values at the top level
  const greenBg = useColorModeValue('green.50', 'green.900');
  const blueBg = useColorModeValue('blue.50', 'blue.900');
  const purpleBg = useColorModeValue('purple.50', 'purple.900');
  const grayBg = useColorModeValue('gray.50', 'gray.700');
  
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Analytics: Fetching dashboard analytics...');
      
      // Get comprehensive analytics data
      const result = await analyticsService.getDashboardAnalytics();
      
      console.log('Analytics: Received result:', result);
      console.log('Analytics: Overall metrics:', result.overall);
      console.log('Analytics: Room data:', {
        totalRooms: result.overall?.totalRooms,
        availableRooms: result.overall?.availableRooms,
        occupiedRooms: result.overall?.totalRooms - result.overall?.availableRooms,
        occupancyRate: result.overall?.totalRooms > 0 ? 
          ((result.overall.totalRooms - result.overall.availableRooms) / result.overall.totalRooms * 100).toFixed(1) : 0
      });
      
      if (result.success) {
        setDashboardData(result);
        
        // Show warnings for any failed data
        if (result.errors && Object.values(result.errors).some(error => error !== null)) {
          const errorMessages = Object.values(result.errors).filter(Boolean);
          if (errorMessages.length > 0) {
            console.warn('Analytics: Some data failed to load:', errorMessages);
            toast({
              title: 'Some data failed to load',
              description: 'Main metrics loaded successfully, but some details may be missing.',
              status: 'warning',
              duration: 5000,
              isClosable: true,
            });
          }
        }
        
        // Show success message if room data was enhanced
        if (result.overall?.totalRooms > 0 && 
            result.overall?.availableRooms !== result.overall?.totalRooms) {
          toast({
            title: 'Analytics Updated',
            description: 'Room occupancy data has been verified and corrected for accuracy.',
            status: 'success',
            duration: 4000,
            isClosable: true,
          });
        }
      } else {
        setError(result.error);
        toast({
          title: 'Failed to load analytics',
          description: result.error,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.message || 'Failed to load analytics');
      toast({
        title: 'Analytics Error',
        description: 'Failed to load analytics data. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
    
    toast({
      title: 'Analytics Refreshed',
      description: 'Data has been updated successfully.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);  const handleExport = async (type) => {
    try {
      setRefreshing(true);
      
      toast({
        title: 'Export Started',
        description: `Preparing ${type} export...`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
      let exportResult;
      
      // Handle different export types
      if (type === 'comprehensive') {
        exportResult = await analyticsService.exportComprehensive({
          period: period,
          includeCharts: true,
          includeRecommendations: true
        });
      } else {
        // Determine export format based on type
        let exportFormat = 'csv';
        if (type.includes('excel') || type.includes('xlsx')) {
          exportFormat = 'excel';
        } else if (type.includes('pdf')) {
          exportFormat = 'pdf';
        }
        
        // Call the export service
        exportResult = await analyticsService.exportAnalytics(exportFormat, {
          period: period,
          includeCharts: true
        });
      }
      
      if (exportResult.success) {
        // Create download link and trigger download
        const link = document.createElement('a');
        link.href = exportResult.url;
        link.download = exportResult.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up object URL
        window.URL.revokeObjectURL(exportResult.url);
        
        // Show detailed success message for comprehensive export
        const description = type === 'comprehensive' && exportResult.dataPoints
          ? `Comprehensive report exported with ${exportResult.dataPoints.overallMetrics} overall metrics, ${exportResult.dataPoints.monthlyTrends} monthly trends, ${exportResult.dataPoints.paymentMethods} payment methods, ${exportResult.dataPoints.kpis} KPIs, and ${exportResult.dataPoints.recommendations} recommendations.`
          : `Analytics data exported successfully as ${exportResult.fileName}`;
        
        toast({
          title: 'Export Complete',
          description,
          status: 'success',
          duration: 7000,
          isClosable: true,
        });
      } else {
        throw new Error(exportResult.error);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export analytics data.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Helper function to safely get nested values
  const safeGet = (obj, path, defaultValue = 0) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : defaultValue;
    }, obj);
  };

  if (error && !dashboardData) {
    return (
      <AdminLayout>
        <Box p={6}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <VStack align="flex-start" spacing={2}>
              <Text fontWeight="bold">Gagal memuat analitik</Text>
              <Text fontSize="sm">{error}</Text>
              <Button size="sm" colorScheme="red" variant="outline" onClick={fetchAnalytics}>
                Coba Lagi
              </Button>
            </VStack>
          </Alert>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box p={6}>
        {/* Header */}
        <VStack spacing={6} align="stretch">
          <HStack justify="space-between" align="center">
            <VStack align="flex-start" spacing={1}>
              <Heading size="lg">Dasbor Analitik</Heading>
              <Text color="gray.600">
                Insight real-time performa Rusunawa Anda
              </Text>
            </VStack>
            <HStack spacing={3}>
              <Select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                w="150px"
                size="sm"
              >
                <option value="7d">7 Hari Terakhir</option>
                <option value="30d">30 Hari Terakhir</option>
                <option value="90d">3 Bulan Terakhir</option>
                <option value="1y">1 Tahun Terakhir</option>
              </Select>
              <Menu>
                <MenuButton
                  as={Button}
                  leftIcon={<FiDownload />}
                  rightIcon={<FiChevronDown />}
                  colorScheme="blue"
                  variant="outline"
                  size="sm"
                  isLoading={refreshing}
                >
                  Ekspor
                </MenuButton>
                <MenuList>
                  <MenuItem
                    icon={<FiDownload />}
                    onClick={() => handleExport('csv')}
                  >
                    Ekspor ke CSV
                  </MenuItem>
                  <MenuItem
                    icon={<FiDownload />}
                    onClick={() => handleExport('excel')}
                  >
                    Ekspor ke Excel
                  </MenuItem>
                  <MenuItem
                    icon={<FiDownload />}
                    onClick={() => handleExport('pdf')}
                  >
                    Ekspor ke PDF
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem
                    icon={<FiDownload />}
                    onClick={() => handleExport('comprehensive')}
                  >
                    Laporan Komprehensif
                  </MenuItem>
                </MenuList>
              </Menu>
              <Button
                colorScheme="blue"
                size="sm"
                onClick={handleRefresh}
                isLoading={refreshing}
                loadingText="Menyegarkan..."
              >
                Segarkan
              </Button>
            </HStack>
          </HStack>

          {/* Main Metrics Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            <MetricCard
              title="Total Pendapatan"
              value={safeGet(dashboardData, 'overall.totalRevenue', 0)}
              icon={FiDollarSign}
              trend={safeGet(dashboardData, 'trends.monthlyGrowth')}
              colorScheme="green"
              loading={loading}
              error={safeGet(dashboardData, 'errors.overallError')}
              tooltip="Total pendapatan dari semua pembayaran terverifikasi"
              formatter={(val) => new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
              }).format(val)}
            />
            
            <MetricCard
              title="Total Booking"
              value={safeGet(dashboardData, 'overall.totalBookings', 0)}
              icon={FiCalendar}
              trend={safeGet(dashboardData, 'trends.bookingsGrowth')}
              colorScheme="blue"
              loading={loading}
              error={safeGet(dashboardData, 'errors.overallError')}
              tooltip="Jumlah total booking di sistem"
            />
            
            <MetricCard
              title="Booking Aktif"
              value={safeGet(dashboardData, 'overall.activeBookings', 0)}
              icon={FiUsers}
              colorScheme="teal"
              loading={loading}
              error={safeGet(dashboardData, 'errors.overallError')}
              tooltip="Booking yang sedang aktif dan disetujui"
            />
            
            <MetricCard
              title="Kamar Tersedia"
              value={safeGet(dashboardData, 'overall.availableRooms', 0)}
              icon={FiHome}
              colorScheme="purple"
              loading={loading}
              error={safeGet(dashboardData, 'errors.overallError')}
              tooltip={`Kamar yang tersedia untuk booking. ${
                safeGet(dashboardData, 'overall.totalRooms', 0) === safeGet(dashboardData, 'overall.availableRooms', 0) 
                  ? 'Data telah diverifikasi untuk akurasi.' 
                  : 'Menggunakan data real-time dari sistem.'
              }`}
            />
          </SimpleGrid>

          {/* Payment Status Metrics */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            <MetricCard
              title="Pembayaran Terverifikasi"
              value={safeGet(dashboardData, 'overall.verifiedPayments', 0)}
              icon={FiCheckCircle}
              colorScheme="green"
              loading={loading}
              error={safeGet(dashboardData, 'errors.overallError')}
              tooltip="Jumlah pembayaran yang sudah diverifikasi dan selesai"
            />
            
            <MetricCard
              title="Pembayaran Pending"
              value={safeGet(dashboardData, 'overall.pendingPayments', 0)}
              icon={FiClock}
              colorScheme="orange"
              loading={loading}
              error={safeGet(dashboardData, 'errors.overallError')}
              tooltip="Pembayaran yang menunggu verifikasi"
              badge={safeGet(dashboardData, 'overall.pendingPayments', 0) > 0 ? {
                text: "Perlu Tindakan",
                colorScheme: "orange"
              } : null}
            />
            
            <MetricCard
              title="Total Kamar"
              value={safeGet(dashboardData, 'overall.totalRooms', 0)}
              icon={FiBuilding}
              colorScheme="gray"
              loading={loading}
              error={safeGet(dashboardData, 'errors.overallError')}
              tooltip="Jumlah kamar di sistem"
            />
            
            <MetricCard
              title="Pendapatan Harian"
              value={safeGet(dashboardData, 'daily.dailyRevenue', 0)}
              icon={FiDollarSign}
              colorScheme="cyan"
              loading={loading}
              error={safeGet(dashboardData, 'errors.dailyError')}
              tooltip="Pendapatan yang dihasilkan hari ini"
              formatter={(val) => new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
              }).format(val)}
            />
          </SimpleGrid>

          <Divider />          {/* Analytics Summary and Revenue Breakdown */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            <AnalyticsSummary
              data={dashboardData}
              loading={loading}
              error={error}
              title="Ringkasan Performa"
              period="Bulan Ini"
            />
            
            <RevenueBreakdown
              data={safeGet(dashboardData, 'revenueByMethod', [])}
              loading={loading}
              error={safeGet(dashboardData, 'errors.revenueError')}
              title="Pendapatan per Metode Pembayaran"
            />
          </SimpleGrid>          {/* AI Analytics Section - Hidden for now */}
          {/* <AIAnalytics /> */}

          {/* Tabs for Additional Analytics */}
          <Card bg={cardBg}>
            <CardBody>              <Tabs variant="enclosed" colorScheme="blue">                <TabList>
                  <Tab>Ringkasan Bulanan</Tab>
                  <Tab>Detail Harian</Tab>
                  <Tab>Kesehatan Sistem</Tab>
                  {/* <Tab>🌊 Streaming AI</Tab> Hidden for now */}
                </TabList>
                
                <TabPanels>
                  {/* Monthly Overview */}
                  <TabPanel>
                    <VStack spacing={6} align="stretch">
                      {loading ? (
                        <VStack spacing={4}>
                          <Skeleton height="20px" width="200px" />
                          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
                            {[1, 2, 3].map((i) => (
                              <Skeleton key={i} height="100px" />
                            ))}
                          </SimpleGrid>
                        </VStack>
                      ) : safeGet(dashboardData, 'monthly') ? (
                        <>
                          <Text fontSize="lg" fontWeight="semibold">
                            Performa {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                          </Text>
                          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                            <VStack spacing={2} p={4} bg={greenBg} borderRadius="md">
                              <Text fontSize="2xl" fontWeight="bold" color="green.600">
                                {new Intl.NumberFormat('id-ID', {
                                  style: 'currency',
                                  currency: 'IDR',
                                  minimumFractionDigits: 0
                                }).format(safeGet(dashboardData, 'monthly.monthlyRevenue', 0))}
                              </Text>
                              <Text fontSize="sm" color="gray.600">Pendapatan Bulanan</Text>
                            </VStack>
                            <VStack spacing={2} p={4} bg={blueBg} borderRadius="md">
                              <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                                {safeGet(dashboardData, 'monthly.monthlyBookings', 0)}
                              </Text>
                              <Text fontSize="sm" color="gray.600">Booking Bulanan</Text>
                            </VStack>
                            <VStack spacing={2} p={4} bg={purpleBg} borderRadius="md">
                              <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                                {safeGet(dashboardData, 'monthly.monthlyPayments', 0)}
                              </Text>
                              <Text fontSize="sm" color="gray.600">Pembayaran Bulanan</Text>
                            </VStack>
                          </SimpleGrid>
                        </>
                      ) : (
                        <Alert status="info">
                          <AlertIcon />
                          Data bulanan tidak tersedia
                        </Alert>
                      )}
                    </VStack>
                  </TabPanel>

                  {/* Daily Details */}
                  <TabPanel>
                    <VStack spacing={6} align="stretch">
                      {loading ? (
                        <Skeleton height="200px" />
                      ) : safeGet(dashboardData, 'daily') ? (
                        <>
                          <Text fontSize="lg" fontWeight="semibold">
                            Performa Hari Ini - {new Date().toLocaleDateString('id-ID')}
                          </Text>
                          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                            <HStack spacing={4} p={4} bg={grayBg} borderRadius="md">
                              <Icon as={FiDollarSign} w={8} h={8} color="green.500" />
                              <VStack align="flex-start" spacing={1}>
                                <Text fontSize="lg" fontWeight="bold">
                                  {new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0
                                  }).format(safeGet(dashboardData, 'daily.dailyRevenue', 0))}
                                </Text>
                                <Text fontSize="sm" color="gray.600">Pendapatan Hari Ini</Text>
                              </VStack>
                            </HStack>
                            <HStack spacing={4} p={4} bg={grayBg} borderRadius="md">
                              <Icon as={FiCalendar} w={8} h={8} color="blue.500" />
                              <VStack align="flex-start" spacing={1}>
                                <Text fontSize="lg" fontWeight="bold">
                                  {safeGet(dashboardData, 'daily.dailyBookings', 0)}
                                </Text>
                                <Text fontSize="sm" color="gray.600">Booking Hari Ini</Text>
                              </VStack>
                            </HStack>
                            <HStack spacing={4} p={4} bg={grayBg} borderRadius="md">
                              <Icon as={FiCreditCard} w={8} h={8} color="purple.500" />
                              <VStack align="flex-start" spacing={1}>
                                <Text fontSize="lg" fontWeight="bold">
                                  {safeGet(dashboardData, 'daily.dailyPayments', 0)}
                                </Text>
                                <Text fontSize="sm" color="gray.600">Pembayaran Hari Ini</Text>
                              </VStack>
                            </HStack>
                          </SimpleGrid>
                        </>
                      ) : (
                        <Alert status="info">
                          <AlertIcon />
                          Data harian tidak tersedia untuk hari ini
                        </Alert>
                      )}
                    </VStack>
                  </TabPanel>

                  {/* System Health */}
                  <TabPanel>
                    <VStack spacing={6} align="stretch">
                      <Text fontSize="lg" fontWeight="semibold">Ringkasan Kesehatan Sistem</Text>
                      
                      {loading ? (
                        <Skeleton height="150px" />
                      ) : (
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                          {/* Room Utilization */}
                          <VStack spacing={4} align="stretch">
                            <Text fontSize="md" fontWeight="medium">Utilisasi Kamar</Text>
                            <VStack spacing={3}>
                              <HStack justify="space-between" w="full">
                                <Text fontSize="sm">Kamar Terisi</Text>
                                <Text fontSize="sm" fontWeight="semibold">
                                  {safeGet(dashboardData, 'overall.totalRooms', 0) - safeGet(dashboardData, 'overall.availableRooms', 0)}
                                </Text>
                              </HStack>
                              <Progress 
                                value={safeGet(dashboardData, 'overall.totalRooms', 0) > 0 
                                  ? ((safeGet(dashboardData, 'overall.totalRooms', 0) - safeGet(dashboardData, 'overall.availableRooms', 0)) / safeGet(dashboardData, 'overall.totalRooms', 0) * 100)
                                  : 0
                                } 
                                colorScheme="blue" 
                                size="lg" 
                                borderRadius="full"
                              />
                              <HStack justify="space-between" w="full">
                                <Text fontSize="xs" color="gray.500">Tersedia: {safeGet(dashboardData, 'overall.availableRooms', 0)}</Text>
                                <Text fontSize="xs" color="gray.500">Total: {safeGet(dashboardData, 'overall.totalRooms', 0)}</Text>
                              </HStack>
                            </VStack>
                          </VStack>

                          {/* Payment Status */}
                          <VStack spacing={4} align="stretch">
                            <Text fontSize="md" fontWeight="medium">Kesehatan Pembayaran</Text>
                            <VStack spacing={3}>
                              <HStack justify="space-between" w="full">
                                <Text fontSize="sm">Rasio Pembayaran Berhasil</Text>
                                <Text fontSize="sm" fontWeight="semibold">
                                  {(safeGet(dashboardData, 'overall.verifiedPayments', 0) + safeGet(dashboardData, 'overall.pendingPayments', 0)) > 0
                                    ? ((safeGet(dashboardData, 'overall.verifiedPayments', 0) / (safeGet(dashboardData, 'overall.verifiedPayments', 0) + safeGet(dashboardData, 'overall.pendingPayments', 0))) * 100).toFixed(1)
                                    : 0}%
                                </Text>
                              </HStack>
                              <Progress 
                                value={(safeGet(dashboardData, 'overall.verifiedPayments', 0) + safeGet(dashboardData, 'overall.pendingPayments', 0)) > 0
                                  ? (safeGet(dashboardData, 'overall.verifiedPayments', 0) / (safeGet(dashboardData, 'overall.verifiedPayments', 0) + safeGet(dashboardData, 'overall.pendingPayments', 0))) * 100
                                  : 0
                                }
                                colorScheme="green" 
                                size="lg" 
                                borderRadius="full"
                              />
                              <HStack justify="space-between" w="full">
                                <Text fontSize="xs" color="gray.500">Pending: {safeGet(dashboardData, 'overall.pendingPayments', 0)}</Text>
                                <Text fontSize="xs" color="gray.500">Terverifikasi: {safeGet(dashboardData, 'overall.verifiedPayments', 0)}</Text>
                              </HStack>
                            </VStack>
                          </VStack>
                        </SimpleGrid>
                      )}
                      
                      {/* Warnings and Alerts */}
                      {safeGet(dashboardData, 'overall.pendingPayments', 0) > 0 && (
                        <Alert status="warning" borderRadius="md">
                          <AlertIcon />
                          <VStack align="flex-start" spacing={1}>
                            <Text fontWeight="medium">Perhatian Diperlukan</Text>
                            <Text fontSize="sm">
                              Ada {safeGet(dashboardData, 'overall.pendingPayments', 0)} pembayaran pending yang perlu diverifikasi.
                            </Text>
                          </VStack>
                        </Alert>
                      )}                    </VStack>
                  </TabPanel>
                  
                  {/* Streaming AI Analytics - Hidden for now */}
                  {/* 
                  <TabPanel>
                    <Box p={0}>
                      <StreamingAnalytics />
                    </Box>
                  </TabPanel>
                  */}
                </TabPanels>
              </Tabs>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    </AdminLayout>
  );
};

export default Analytics;
