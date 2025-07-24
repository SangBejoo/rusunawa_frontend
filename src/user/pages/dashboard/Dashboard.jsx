import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Progress,
  Skeleton,
  Alert,
  AlertIcon,
  useColorModeValue,
  Icon,
  Flex,
  SimpleGrid
} from '@chakra-ui/react';
import {
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiAlertTriangle,
  FiTrendingUp,
  FiTrendingDown,
  FiMapPin,
  FiFileText
} from 'react-icons/fi';
import { MdApartment as FiBuilding } from 'react-icons/md';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import AdminLayout from '../../components/layout/AdminLayout';
import dashboardService from '../../services/dashboardService';

// Chart colors for consistent theming
const CHART_COLORS = [
  '#3182CE', '#38A169', '#D69E2E', '#E53E3E', '#805AD5',
  '#DD6B20', '#319795', '#C53030', '#9F7AEA', '#2B6CB0'
];

// Custom label function for pie charts
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show labels for very small slices

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize="12"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const StatCard = ({ title, value, change, icon, colorScheme = 'blue', isLoading }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const iconBg = useColorModeValue(`${colorScheme}.50`, `${colorScheme}.900`);
  const iconColor = useColorModeValue(`${colorScheme}.500`, `${colorScheme}.200`);

  if (isLoading) {
    return (
      <Card bg={cardBg}>
        <CardBody>
          <Skeleton height="100px" />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card bg={cardBg}>
      <CardBody>
        <Flex justify="space-between" align="flex-start">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">
              {title}
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold">
              {value}
            </StatNumber>
            {change && (
              <StatHelpText>
                <StatArrow type={change >= 0 ? 'increase' : 'decrease'} />
                {Math.abs(change)}%
              </StatHelpText>
            )}
          </Stat>
          <Box p={3} bg={iconBg} borderRadius="lg">
            <Icon as={icon} w={6} h={6} color={iconColor} />
          </Box>
        </Flex>
      </CardBody>
    </Card>
  );
};

const QuickMetric = ({ label, value, progress, color = 'blue' }) => (
  <VStack spacing={2} align="stretch">
    <HStack justify="space-between">
      <Text fontSize="sm" color="gray.600">
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="semibold">
        {value}
      </Text>
    </HStack>
    <Progress value={progress} colorScheme={color} size="sm" borderRadius="full" />
  </VStack>
);

const ChartCard = ({ title, children, isLoading, height = "280px" }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  
  return (
    <Card bg={cardBg} h={height}>
      <CardHeader pb={2}>
        <Heading size="sm">{title}</Heading>
      </CardHeader>
      <CardBody pt={0}>
        {isLoading ? (
          <Skeleton height="200px" />
        ) : (
          <Box height="200px">
            {children}
          </Box>
        )}
      </CardBody>
    </Card>
  );
};

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getDashboardData();
        
        // Add detailed logging for tenant count debugging
        console.log('Dashboard - Raw API tenant data:', data?.tenants?.length);
        console.log('Dashboard - API totalCount:', data?.totalTenants);
        console.log('Dashboard - Tenant breakdown:', {
          totalTenants: data?.totalTenants,
          actualTenantArrayLength: data?.tenants?.length,
          mahasiswa: data?.tenants?.filter(t => 
            t.tenantType?.name === 'mahasiswa' || t.type === 'mahasiswa'
          ).length,
          nonMahasiswa: data?.tenants?.filter(t => 
            t.tenantType?.name === 'non_mahasiswa' || t.type === 'non_mahasiswa'
          ).length,
          tenantsWithTypes: data?.tenants?.map(t => ({
            id: t.tenantId || t.tenant_id,
            name: t.user?.fullName || t.name,
            type: t.tenantType?.name || t.type,
            status: t.status || t.computed_status
          }))
        });
        
        // Check for data quality issues
        const tenants = data?.tenants || [];
        const duplicateNames = tenants.reduce((acc, tenant) => {
          const name = tenant.user?.fullName || tenant.name;
          acc[name] = (acc[name] || 0) + 1;
          return acc;
        }, {});
        
        const duplicatesFound = Object.entries(duplicateNames).filter(([name, count]) => count > 1);
        if (duplicatesFound.length > 0) {
          console.warn('⚠️ DUPLICATE TENANTS DETECTED:', duplicatesFound);
        }
        
        // Check for missing status fields
        const tenantsWithoutStatus = tenants.filter(t => !t.status && !t.computed_status);
        if (tenantsWithoutStatus.length > 0) {
          console.warn('⚠️ TENANTS WITHOUT STATUS:', tenantsWithoutStatus.length);
        }
        
        // Always use the actual tenant array length as the authoritative count
        const actualCount = tenants.length;
        const apiCount = data?.totalTenants || 0;
        
        // Use the higher of the two counts (most inclusive)
        const finalCount = Math.max(actualCount, apiCount);
        
        console.log(`📊 Tenant Count Analysis: Array=${actualCount}, API=${apiCount}, Using=${finalCount}`);
        
        const correctedData = {
          ...data,
          totalTenants: finalCount,
          dataQualityIssues: {
            duplicates: duplicatesFound,
            missingStatus: tenantsWithoutStatus.length,
            countMismatch: actualCount !== apiCount
          }
        };
        
        console.log(`✅ Final tenant count: ${finalCount} (${duplicatesFound.length} duplicates detected)`);
        setDashboardData(correctedData);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const cardBg = useColorModeValue('white', 'gray.700');

  if (error) {
    return (
      <AdminLayout>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          {error}
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <VStack spacing={4} align="stretch">
        {/* Page Header */}
        <Box>
          <Heading size="lg" mb={1}>
            Dasbor
          </Heading>
          <Text color="gray.600" fontSize="sm">
            Selamat datang! Berikut adalah ringkasan terbaru sistem Rusunawa Anda hari ini.
          </Text>
        </Box>



        {/* Key Metrics */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
          <StatCard
            title="Total Penghuni"
            value={dashboardData?.totalTenants || '0'}
            icon={FiUsers}
            colorScheme="blue"
            isLoading={loading}
          />
          <StatCard
            title="Kamar Tersedia"
            value={`${dashboardData?.availableRooms || '0'} / ${dashboardData?.totalRooms || '0'}`}
            icon={FiBuilding}
            colorScheme="green"
            isLoading={loading}
          />
          <StatCard
            title="Booking Aktif"
            value={dashboardData?.activeBookings || '0'}
            icon={FiCalendar}
            colorScheme="orange"
            isLoading={loading}
          />
          <StatCard
            title="Pendapatan Bulanan"
            value={`Rp ${(dashboardData?.monthlyRevenue || 0).toLocaleString('id-ID')}`}
            icon={FiDollarSign}
            colorScheme="purple"
            isLoading={loading}
          />
        </Grid>

        {/* Student Demographics */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
          <StatCard
            title="Total Mahasiswa"
            value={dashboardData?.tenants?.filter(t => 
              t.tenantType?.name === 'mahasiswa' || t.type === 'mahasiswa'
            ).length || '0'}
            icon={FiUsers}
            colorScheme="blue"
            isLoading={loading}
          />
          <StatCard
            title="Mahasiswa Afirmasi"
            value={dashboardData?.tenants?.filter(t => 
              (t.tenantType?.name === 'mahasiswa' || t.type === 'mahasiswa') && t.isAfirmasi
            ).length || '0'}
            icon={FiTrendingUp}
            colorScheme="orange"
            isLoading={loading}
          />
          <StatCard
            title="Mahasiswa Reguler"
            value={dashboardData?.tenants?.filter(t => 
              (t.tenantType?.name === 'mahasiswa' || t.type === 'mahasiswa') && !t.isAfirmasi
            ).length || '0'}
            icon={FiUsers}
            colorScheme="teal"
            isLoading={loading}
          />
          <StatCard
            title="Total Non-Mahasiswa"
            value={dashboardData?.tenants?.filter(t => 
              t.tenantType?.name === 'non_mahasiswa' || t.type === 'non_mahasiswa'
            ).length || '0'}
            icon={FiUsers}
            colorScheme="purple"
            isLoading={loading}
          />
        </Grid>

        {/* Advanced Analytics */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
          <StatCard
            title="Tingkat Hunian"
            value={`${((dashboardData?.totalOccupants || 0) / Math.max(1, dashboardData?.totalCapacity || 1) * 100).toFixed(1)}%`}
            icon={FiBuilding}
            colorScheme="green"
            isLoading={loading}
          />
          <StatCard
            title="Rata-rata Jarak ke Kampus"
            value={`${(dashboardData?.tenants?.reduce((sum, t) => sum + (t.distanceToCampus || 0), 0) / Math.max(1, dashboardData?.tenants?.length || 1)).toFixed(1)} km`}
            icon={FiMapPin}
            colorScheme="orange"
            isLoading={loading}
          />
          <StatCard
            title="Dokumen Terverifikasi"
            value={`${(dashboardData?.approvedDocuments || 0)} / ${(dashboardData?.totalDocuments || 0)}`}
            icon={FiFileText}
            colorScheme="blue"
            isLoading={loading}
          />
          <StatCard
            title="Rasio Booking Berhasil"
            value={`${(((dashboardData?.completedBookings || 0) / Math.max(1, dashboardData?.totalBookings || 1)) * 100).toFixed(1)}%`}
            icon={FiTrendingUp}
            colorScheme="purple"
            isLoading={loading}
          />
        </Grid>

        {/* Analytics Charts */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
          {/* Tenant Type Distribution */}
          <ChartCard title="Distribusi Tipe Penyewa" isLoading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(dashboardData?.tenantTypeDistribution || {}).map(([key, value]) => ({
                    name: key,
                    value,
                    percentage: ((value / (dashboardData?.totalTenants || 1)) * 100).toFixed(1)
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(dashboardData?.tenantTypeDistribution || {}).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Room Classification Distribution */}
          <ChartCard title="Distribusi Klasifikasi Kamar" isLoading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(dashboardData?.roomClassificationDistribution || {}).map(([key, value]) => ({
                    name: key.replace('_', ' ').toUpperCase(),
                    value,
                    percentage: ((value / (dashboardData?.totalRooms || 1)) * 100).toFixed(1)
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(dashboardData?.roomClassificationDistribution || {}).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend />
              </PieChart>            </ResponsiveContainer>
          </ChartCard>
          {/* Enhanced: Mahasiswa by Program & Afirmasi Status */}
          <ChartCard title="Mahasiswa per Program & Afirmasi" isLoading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(() => {
                  const mahasiswaByJurusan = {};
                  dashboardData?.tenants?.filter(t => 
                    t.tenantType?.name === 'mahasiswa' || t.type === 'mahasiswa'
                  ).forEach(student => {
                    const jurusan = student.jurusan || 'Tidak Diketahui';
                    if (!mahasiswaByJurusan[jurusan]) {
                      mahasiswaByJurusan[jurusan] = { afirmasi: 0, regular: 0 };
                    }
                    if (student.isAfirmasi) {
                      mahasiswaByJurusan[jurusan].afirmasi++;
                    } else {
                      mahasiswaByJurusan[jurusan].regular++;
                    }
                  });
                  return Object.entries(mahasiswaByJurusan)
                    .map(([jurusan, counts]) => ({
                      jurusan: jurusan.length > 15 ? jurusan.substring(0, 15) + '...' : jurusan,
                      afirmasi: counts.afirmasi,
                      regular: counts.regular,
                      total: counts.afirmasi + counts.regular
                    }))
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 6); // Top 6 programs
                })()}
                margin={{ top: 5, right: 15, left: 5, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="jurusan" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  fontSize={9}
                />
                <YAxis fontSize={10} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'afirmasi') return [value, 'Mahasiswa Afirmasi'];
                    if (name === 'regular') return [value, 'Mahasiswa Reguler'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Program: ${label}`}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => {
                    if (value === 'Afirmasi' || value === 'afirmasi') return 'Mahasiswa Afirmasi';
                    if (value === 'Reguler' || value === 'regular') return 'Mahasiswa Reguler';
                    return value;
                  }}
                />
                <Bar dataKey="afirmasi" stackId="a" fill="#F56500" name="Mahasiswa Afirmasi" />
                <Bar dataKey="regular" stackId="a" fill="#3182CE" name="Mahasiswa Reguler" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top Jurusan Distribution */}
          <ChartCard title="Distribusi Jurusan (Top 5)" isLoading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(
                  dashboardData?.tenants?.filter(t => 
                    (t.tenantType?.name === 'mahasiswa' || t.type === 'mahasiswa') && t.jurusan
                  ).reduce((acc, tenant) => {
                    const jurusan = tenant.jurusan;
                    acc[jurusan] = (acc[jurusan] || 0) + 1;
                    return acc;
                  }, {}) || {}
                )
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([jurusan, count]) => ({
                  jurusan: jurusan.length > 15 ? `${jurusan.substring(0, 15)}...` : jurusan,
                  fullJurusan: jurusan,
                  mahasiswa: count
                }))}
                margin={{ top: 5, right: 15, left: 5, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="jurusan" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={8}
                />
                <YAxis fontSize={10} />
                <Tooltip 
                  formatter={(value, name) => [value, 'Mahasiswa']}
                  labelFormatter={(label, payload) => 
                    payload && payload[0] ? payload[0].payload.fullJurusan : label
                  }
                />
                <Bar dataKey="mahasiswa" fill="#38A169" />
              </BarChart>
            </ResponsiveContainer>          </ChartCard>

          {/* Booking Status Distribution */}
          <ChartCard title="Status Booking" isLoading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(dashboardData?.bookingStatusDistribution || {}).map(([key, value]) => ({
                  status: key,
                  jumlah: value
                }))}
                margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="jumlah" fill="#38A169" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Document Verification Status */}
          <ChartCard title="Status Verifikasi Dokumen" isLoading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(dashboardData?.documentStats || {}).map(([key, value]) => ({
                  status: key,
                  jumlah: value
                }))}
                margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="jumlah" fill="#D69E2E" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* Payment & Revenue Analytics */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
          {/* Payment Method Distribution */}
          <ChartCard title="Distribusi Metode Pembayaran" isLoading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(dashboardData?.paymentMethodDistribution || {}).map(([key, value]) => ({
                    name: key === 'manual' ? 'Transfer Manual' : key === 'midtrans' ? 'Midtrans Gateway' : key,
                    value,
                    percentage: ((value / (Object.values(dashboardData?.paymentMethodDistribution || {}).reduce((a, b) => a + b, 1))) * 100).toFixed(1)
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(dashboardData?.paymentMethodDistribution || {}).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>          </ChartCard>

          {/* NEW: Room Occupancy Rate Trend */}
          <ChartCard title="Tingkat Hunian Kamar" isLoading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    category: 'Terisi',
                    jumlah: dashboardData?.occupiedRooms || 0,
                    percentage: ((dashboardData?.occupiedRooms || 0) / Math.max(1, dashboardData?.totalRooms || 1) * 100).toFixed(1),
                    occupants: dashboardData?.totalOccupants || 0,
                    capacity: dashboardData?.totalCapacity || 0
                  },
                  {
                    category: 'Kosong',
                    jumlah: dashboardData?.availableRooms || 0,
                    percentage: ((dashboardData?.availableRooms || 0) / Math.max(1, dashboardData?.totalRooms || 1) * 100).toFixed(1),
                    occupants: 0,
                    capacity: (dashboardData?.availableRooms || 0) * 4 // Assuming avg capacity 4
                  }
                ]}
                margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip 
                  formatter={(value, name, props) => {
                    const { occupants, capacity } = props.payload;
                    if (props.payload.category === 'Terisi') {
                      return [
                        `${value} kamar (${props.payload.percentage}%) - ${occupants}/${capacity} penghuni`, 
                        'Jumlah'
                      ];
                    }
                    return [
                      `${value} kamar (${props.payload.percentage}%)`, 
                      'Jumlah'
                    ];
                  }}
                />
                <Bar dataKey="jumlah" fill="#38A169" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* NEW: Revenue by Tenant Type */}
          <ChartCard title="Pendapatan per Tipe Penyewa" isLoading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    type: 'Mahasiswa',
                    revenue: (dashboardData?.tenants?.filter(t => 
                      t.tenantType?.name === 'mahasiswa' || t.type === 'mahasiswa'
                    ).length || 0) * 800000, // Asumsi rata-rata sewa bulanan
                    tenants: dashboardData?.tenants?.filter(t => 
                      t.tenantType?.name === 'mahasiswa' || t.type === 'mahasiswa'
                    ).length || 0
                  },
                  {
                    type: 'Non-Mahasiswa',
                    revenue: (dashboardData?.tenants?.filter(t => 
                      t.tenantType?.name === 'non_mahasiswa' || t.type === 'non_mahasiswa'
                    ).length || 0) * 1000000, // Tarif lebih tinggi untuk non-mahasiswa
                    tenants: dashboardData?.tenants?.filter(t => 
                      t.tenantType?.name === 'non_mahasiswa' || t.type === 'non_mahasiswa'
                    ).length || 0
                  }
                ]}
                margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" fontSize={10} />
                <YAxis tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(1)}Jt`} fontSize={10} />
                <Tooltip 
                  formatter={(value, name, props) => [
                    `Rp ${value.toLocaleString('id-ID')} (${props.payload.tenants} penyewa)`,
                    'Estimasi Pendapatan Bulanan'
                  ]}
                />
                <Bar dataKey="revenue" fill="#805AD5" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Monthly Revenue Trend */}
          <ChartCard title="Tren Pendapatan Bulanan" isLoading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardData?.monthlyRevenueTrend || []}
                margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={10} />
                <YAxis tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(1)}Jt`} fontSize={10} />
                <Tooltip formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']} />
                <Bar dataKey="revenue" fill="#4299E1" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>{/* System Status & Quick Stats */}
        <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={4}>
          {/* System Status */}
          <Card bg={cardBg}>            <CardHeader pb={2}>
              <Heading size="sm">Status Sistem</Heading>
            </CardHeader>
            <CardBody pt={0}>
              {loading ? (
                <HStack spacing={6}>
                  <Skeleton height="60px" flex={1} />
                  <Skeleton height="60px" flex={1} />
                  <Skeleton height="60px" flex={1} />
                </HStack>
              ) : (                <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6}>
                  <VStack>
                    <Icon as={FiUsers} w={8} h={8} color="blue.500" />
                    <VStack spacing={0}>
                      <Text fontSize="sm" fontWeight="semibold">
                        Sistem Penghuni
                      </Text>
                      <Badge colorScheme="green" size="sm">
                        {dashboardData?.totalTenants || 0} Aktif
                      </Badge>
                    </VStack>
                  </VStack>
                  <VStack>
                    <Icon as={FiBuilding} w={8} h={8} color="purple.500" />
                    <VStack spacing={0}>
                      <Text fontSize="sm" fontWeight="semibold">
                        Manajemen Kamar
                      </Text>
                      <Badge colorScheme="green" size="sm">
                        {dashboardData?.availableRooms || 0} Tersedia
                      </Badge>
                    </VStack>
                  </VStack>
                  <VStack>
                    <Icon as={FiCalendar} w={8} h={8} color="orange.500" />
                    <VStack spacing={0}>
                      <Text fontSize="sm" fontWeight="semibold">
                        Sistem Booking
                      </Text>
                      <Badge colorScheme="green" size="sm">
                        {dashboardData?.activeBookings || 0} Aktif
                      </Badge>
                    </VStack>
                  </VStack>
                  <VStack>
                    <Icon as={FiDollarSign} w={8} h={8} color="green.500" />
                    <VStack spacing={0}>
                      <Text fontSize="sm" fontWeight="semibold">
                        Payment Gateway
                      </Text>
                      <Badge colorScheme="green" size="sm">
                        {Object.keys(dashboardData?.paymentMethodDistribution || {}).length} Metode
                      </Badge>
                    </VStack>
                  </VStack>
                </Grid>
              )}
            </CardBody>
          </Card>

          {/* Quick Statistics */}
          <Card bg={cardBg}>            <CardHeader pb={2}>
              <Heading size="sm">Statistik Cepat</Heading>
            </CardHeader>
            <CardBody pt={0}>
              {loading ? (
                <VStack spacing={3}>
                  <Skeleton height="40px" />
                  <Skeleton height="40px" />
                  <Skeleton height="40px" />
                  <Skeleton height="40px" />
                </VStack>
              ) : (                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={FiDollarSign} color="green.500" />
                      <Text fontSize="sm">Total Pendapatan</Text>
                    </HStack>
                    <Badge colorScheme="green">
                      Rp {(dashboardData?.totalRevenue || 0).toLocaleString('id-ID')}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={FiFileText} color="blue.500" />
                      <Text fontSize="sm">Dokumen Pending</Text>
                    </HStack>
                    <Badge colorScheme="orange">
                      {dashboardData?.documentStats?.pending || 0}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={FiMapPin} color="green.500" />
                      <Text fontSize="sm">Penghuni Dekat (&lt;5km)</Text>
                    </HStack>
                    <Badge colorScheme="green">
                      {dashboardData?.distanceRanges?.['Sangat Dekat (< 5km)'] || 0}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={FiUsers} color="purple.500" />
                      <Text fontSize="sm">Penghuni Terverifikasi</Text>
                    </HStack>
                    <Badge colorScheme="purple">
                      {dashboardData?.tenants?.filter(t => t.isVerified).length || 0}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={FiCalendar} color="orange.500" />
                      <Text fontSize="sm">Booking Disetujui</Text>
                    </HStack>
                    <Badge colorScheme="blue">
                      {dashboardData?.bookingStatusDistribution?.approved || 0}
                    </Badge>
                  </HStack>
                </VStack>
              )}
            </CardBody>
          </Card>
        </Grid>
      </VStack>
    </AdminLayout>
  );
};

export default Dashboard;
