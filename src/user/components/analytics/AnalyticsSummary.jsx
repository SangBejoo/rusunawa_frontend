import React from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Heading,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Skeleton,
  Alert,
  AlertIcon,
  useColorModeValue,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Badge,
  Tooltip
} from '@chakra-ui/react';
import { FiTrendingUp, FiUsers, FiDollarSign, FiHome } from 'react-icons/fi';

const AnalyticsSummary = ({
  data = null,
  loading = false,
  error = null,
  title = "Ringkasan Performa",
  period = "Bulan Ini"
}) => {
  // Move all hooks to the top level
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const valueColor = useColorModeValue('gray.800', 'white');
  const accentBg = useColorModeValue('gray.50', 'gray.600');
  const greenBg = useColorModeValue('green.50', 'green.900');
  const blueBg = useColorModeValue('blue.50', 'blue.900');
  const purpleBg = useColorModeValue('purple.50', 'purple.900');
  const orangeBg = useColorModeValue('orange.50', 'orange.900');

  if (loading) {
    return (
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardHeader>
          <Skeleton height="24px" width="200px" />
        </CardHeader>
        <CardBody>
          <VStack spacing={4}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} height="80px" />
              ))}
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardHeader>
          <Heading size="md">{title}</Heading>
        </CardHeader>
        <CardBody>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <VStack align="flex-start" spacing={1}>
              <Text fontWeight="medium">Gagal memuat ringkasan analitik</Text>
              <Text fontSize="sm">{error}</Text>
            </VStack>
          </Alert>
        </CardBody>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardHeader>
          <Heading size="md">{title}</Heading>
        </CardHeader>
        <CardBody>
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Text>Tidak ada data analitik tersedia</Text>
          </Alert>
        </CardBody>
      </Card>
    );
  }

  // Safe data extraction
  const monthlyRevenue = data.monthly?.monthlyRevenue || 0;
  const monthlyBookings = data.monthly?.monthlyBookings || 0;
  const monthlyGrowth = data.trends?.monthlyGrowth || 0;
  const bookingsGrowth = data.trends?.bookingsGrowth || 0;
  const totalRooms = data.overall?.totalRooms || 0;
  const availableRooms = data.overall?.availableRooms || 0;
  const occupancyRate = totalRooms > 0 ? ((totalRooms - availableRooms) / totalRooms * 100) : 0;
  const isCalculatedFromInvoices = data.monthly?.isCalculatedFromInvoices || false;

  console.log('AnalyticsSummary - Room calculation:', {
    totalRooms,
    availableRooms,
    occupiedRooms: totalRooms - availableRooms,
    occupancyRate: occupancyRate.toFixed(1),
    monthlyRevenue,
    isCalculatedFromInvoices,
    rawData: data.overall
  });

  return (
    <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
      <CardHeader>
        <VStack align="flex-start" spacing={1}>
          <Heading size="md">{title}</Heading>
          <Text fontSize="sm" color={textColor}>{period}</Text>
        </VStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* Key Performance Indicators */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {/* Monthly Revenue */}
            <VStack spacing={3} p={4} bg={greenBg} borderRadius="md">
              <HStack w="full" justify="space-between">
                <Icon as={FiDollarSign} w={6} h={6} color="green.500" />
                <HStack spacing={2}>
                  <Text fontSize="xs" color={textColor}>PENDAPATAN</Text>
                  {isCalculatedFromInvoices && (
                    <Tooltip label="Data diperbaiki dari invoice real" hasArrow>
                      <Badge size="sm" colorScheme="green" variant="solid" fontSize="xs">
                        ✓ Akurat
                      </Badge>
                    </Tooltip>
                  )}
                </HStack>
              </HStack>
              <Stat>
                <StatLabel fontSize="sm">Pendapatan Bulanan</StatLabel>
                <StatNumber fontSize="xl">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0
                  }).format(monthlyRevenue)}
                </StatNumber>
                <StatHelpText mb={0}>
                  <StatArrow type={monthlyGrowth >= 0 ? 'increase' : 'decrease'} />
                  {Math.abs(monthlyGrowth).toFixed(1)}% dibanding bulan lalu
                  {isCalculatedFromInvoices && (
                    <Text as="span" fontSize="xs" color="green.600" ml={1}>
                      (dari invoice)
                    </Text>
                  )}
                </StatHelpText>
              </Stat>
            </VStack>

            {/* Monthly Bookings */}
            <VStack spacing={3} p={4} bg={blueBg} borderRadius="md">
              <HStack w="full" justify="space-between">
                <Icon as={FiUsers} w={6} h={6} color="blue.500" />
                <Text fontSize="xs" color={textColor}>BOOKING</Text>
              </HStack>
              <Stat>
                <StatLabel fontSize="sm">Booking Bulanan</StatLabel>
                <StatNumber fontSize="xl">{monthlyBookings}</StatNumber>
                <StatHelpText mb={0}>
                  <StatArrow type={bookingsGrowth >= 0 ? 'increase' : 'decrease'} />
                  {Math.abs(bookingsGrowth).toFixed(1)}% dibanding bulan lalu
                </StatHelpText>
              </Stat>
            </VStack>

            {/* Room Occupancy */}
            <VStack spacing={3} p={4} bg={purpleBg} borderRadius="md">
              <HStack w="full" justify="space-between">
                <Icon as={FiHome} w={6} h={6} color="purple.500" />
                <Text fontSize="xs" color={textColor}>TINGKAT HUNIAN</Text>
              </HStack>
              <Stat>
                <StatLabel fontSize="sm">Tingkat Hunian Kamar</StatLabel>
                <StatNumber fontSize="xl">{occupancyRate.toFixed(1)}%</StatNumber>
                <StatHelpText mb={0}>
                  {totalRooms - availableRooms} dari {totalRooms} kamar
                </StatHelpText>
              </Stat>
            </VStack>

            {/* Performance Score */}
            <VStack spacing={3} p={4} bg={orangeBg} borderRadius="md">
              <HStack w="full" justify="space-between">
                <Icon as={FiTrendingUp} w={6} h={6} color="orange.500" />
                <Text fontSize="xs" color={textColor}>PERFORMA</Text>
              </HStack>
              <Stat>
                <StatLabel fontSize="sm">Skor Performa</StatLabel>
                <StatNumber fontSize="xl">
                  {((monthlyGrowth + bookingsGrowth + occupancyRate) / 3).toFixed(0)}%
                </StatNumber>
                <StatHelpText mb={0}>
                  Performa sistem secara keseluruhan
                </StatHelpText>
              </Stat>
            </VStack>
          </SimpleGrid>

          {/* Summary Insights */}
          <VStack spacing={3} p={4} bg={accentBg} borderRadius="md">
            <Text fontSize="sm" fontWeight="semibold" color={valueColor}>
              Insight Utama
            </Text>
            <VStack spacing={2} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="sm" color={textColor}>Rata-rata Pendapatan Harian</Text>
                <Text fontSize="sm" fontWeight="medium" color={valueColor}>
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0
                  }).format(data.trends?.dailyAverage || 0)}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color={textColor}>Booking Aktif</Text>
                <Text fontSize="sm" fontWeight="medium" color={valueColor}>
                  {data.overall?.activeBookings || 0}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color={textColor}>Pembayaran Pending</Text>
                <Text fontSize="sm" fontWeight="medium" color={valueColor}>
                  {data.overall?.pendingPayments || 0}
                </Text>
              </HStack>
            </VStack>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default AnalyticsSummary;
