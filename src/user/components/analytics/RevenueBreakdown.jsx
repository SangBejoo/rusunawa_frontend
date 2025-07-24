import React from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Heading,
  VStack,
  HStack,
  Text,
  Progress,
  Skeleton,
  Alert,
  AlertIcon,
  useColorModeValue
} from '@chakra-ui/react';

const RevenueBreakdown = ({
  data = [],
  loading = false,
  error = null,
  title = "Rincian Pendapatan"
}) => {
  // Move all hooks to the top level
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const valueColor = useColorModeValue('gray.800', 'white');
  
  // Define color schemes at the top level
  const colorSchemes = ['blue', 'green', 'purple', 'orange', 'teal', 'cyan', 'red', 'pink'];
  
  if (loading) {
    return (
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardHeader>
          <Skeleton height="24px" width="200px" />
        </CardHeader>
        <CardBody>
          <VStack spacing={4}>
            {[1, 2, 3].map((i) => (
              <VStack key={i} spacing={2} w="full">
                <Skeleton height="16px" width="120px" />
                <Skeleton height="8px" width="full" />
                <Skeleton height="14px" width="80px" />
              </VStack>
            ))}
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
              <Text fontWeight="medium">Gagal memuat data pendapatan</Text>
              <Text fontSize="sm">{error}</Text>
            </VStack>
          </Alert>
        </CardBody>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardHeader>
          <Heading size="md">{title}</Heading>
        </CardHeader>
        <CardBody>
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Text>Tidak ada data pendapatan tersedia</Text>
          </Alert>
        </CardBody>
      </Card>
    );
  }

  // Calculate total for percentage calculation
  const totalRevenue = data.reduce((sum, item) => sum + (item.amount || item.value || 0), 0);

  return (
    <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
      <CardHeader>
        <Heading size="md">{title}</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          {data.map((item, index) => {
            const amount = item.amount || item.value || 0;
            const percentage = totalRevenue > 0 ? (amount / totalRevenue * 100) : 0;
            const colorScheme = colorSchemes[index % colorSchemes.length];
            
            return (
              <VStack key={item.paymentMethod || item.name || index} spacing={2} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="medium" color={valueColor}>
                    {item.paymentMethod || item.name || 'Tidak diketahui'}
                  </Text>
                  <Text fontSize="sm" color={textColor}>
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0
                    }).format(amount)}
                  </Text>
                </HStack>
                <Progress
                  value={percentage}
                  colorScheme={colorScheme}
                  size="sm"
                  borderRadius="full"
                />
                <HStack justify="space-between">
                  <Text fontSize="xs" color={textColor}>
                    {percentage.toFixed(1)}%
                  </Text>
                  <Text fontSize="xs" color={textColor}>
                    {item.count || 0} transaksi
                  </Text>
                </HStack>
              </VStack>
            );
          })}
          
          {/* Total Summary */}
          <VStack spacing={2} pt={4} borderTopWidth="1px" borderColor={borderColor}>
            <HStack justify="space-between" w="full">
              <Text fontSize="md" fontWeight="bold" color={valueColor}>
                Total Pendapatan
              </Text>
              <Text fontSize="md" fontWeight="bold" color={valueColor}>
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0
                }).format(totalRevenue)}
              </Text>
            </HStack>
            <HStack justify="space-between" w="full">
              <Text fontSize="sm" color={textColor}>
                Total Transaksi
              </Text>
              <Text fontSize="sm" color={textColor}>
                {data.reduce((sum, item) => sum + (item.count || 0), 0)}
              </Text>
            </HStack>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default RevenueBreakdown;
