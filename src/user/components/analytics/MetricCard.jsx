import React from 'react';
import {
  Box,
  Card,
  CardBody,
  Text,
  HStack,
  VStack,
  Icon,
  Badge,
  Skeleton,
  Alert,
  AlertIcon,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const MetricCard = ({
  title,
  value,
  icon,
  trend,
  colorScheme = 'blue',
  loading = false,
  error = null,
  tooltip,
  badge,
  formatter = (val) => val?.toLocaleString() || '0'
}) => {
  // Move all hooks to the top level
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');  const valueColor = useColorModeValue('gray.800', 'white');
  
  // Define all color scheme variations at component level
  const blueColor = useColorModeValue('blue.500', 'blue.300');
  const greenColor = useColorModeValue('green.500', 'green.300');
  const redColor = useColorModeValue('red.500', 'red.300');
  const orangeColor = useColorModeValue('orange.500', 'orange.300');
  const purpleColor = useColorModeValue('purple.500', 'purple.300');
  const tealColor = useColorModeValue('teal.500', 'teal.300');
  const cyanColor = useColorModeValue('cyan.500', 'cyan.300');
  const grayColor = useColorModeValue('gray.500', 'gray.300');

  const getColorSchemeColor = (scheme) => {
    const colors = {
      blue: blueColor,
      green: greenColor,
      red: redColor,
      orange: orangeColor,
      purple: purpleColor,
      teal: tealColor,
      cyan: cyanColor,
      gray: grayColor
    };
    return colors[scheme] || colors.blue;
  };

  const iconColor = getColorSchemeColor(colorScheme);
  
  if (loading) {
    return (
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Skeleton height="20px" width="120px" />
              <Skeleton height="24px" width="24px" borderRadius="md" />
            </HStack>
            <Skeleton height="32px" width="80px" />
            <Skeleton height="16px" width="100px" />
          </VStack>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardBody>
          <Alert status="error" size="sm" borderRadius="md">
            <AlertIcon />
            <VStack align="flex-start" spacing={1}>
              <Text fontSize="sm" fontWeight="medium">{title}</Text>
              <Text fontSize="xs">{error}</Text>
            </VStack>
          </Alert>
        </CardBody>
      </Card>
    );
  }

  const trendIcon = trend > 0 ? FiTrendingUp : FiTrendingDown;
  const trendColor = trend > 0 ? 'green.500' : 'red.500';

  const cardContent = (
    <Card 
      bg={cardBg} 
      borderWidth="1px" 
      borderColor={borderColor}
      _hover={{ shadow: 'md' }}
      transition="all 0.2s"
    >
      <CardBody>
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between" align="flex-start">
            <VStack align="flex-start" spacing={1} flex={1}>
              <HStack spacing={2} align="center">
                <Text fontSize="sm" color={textColor} fontWeight="medium">
                  {title}
                </Text>
                {badge && (
                  <Badge colorScheme={badge.colorScheme} size="sm">
                    {badge.text}
                  </Badge>
                )}
              </HStack>
              <Text fontSize="2xl" fontWeight="bold" color={valueColor}>
                {formatter(value)}
              </Text>
            </VStack>
            {icon && (
              <Icon as={icon} w={6} h={6} color={iconColor} />
            )}
          </HStack>
          
          {trend !== undefined && trend !== null && (
            <HStack spacing={2}>
              <Icon as={trendIcon} w={4} h={4} color={trendColor} />
              <Text fontSize="sm" color={trendColor} fontWeight="medium">
                {Math.abs(trend).toFixed(1)}%
              </Text>
              <Text fontSize="sm" color={textColor}>
                vs last month
              </Text>
            </HStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  );

  if (tooltip) {
    return (
      <Tooltip label={tooltip} placement="top" hasArrow>
        {cardContent}
      </Tooltip>
    );
  }

  return cardContent;
};

export default MetricCard;
