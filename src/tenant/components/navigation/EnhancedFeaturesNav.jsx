// Enhanced Features Navigation Component
import React from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  HStack,
  VStack,
  Text,
  Badge,
  Icon,
  Tooltip,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Heading,
  SimpleGrid,
  useBreakpointValue
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaFileUpload, 
  FaImages, 
  FaCamera, 
  FaExclamationTriangle,
  FaChartLine,
  FaCreditCard,
  FaHome,
  FaArrowRight
} from 'react-icons/fa';

const EnhancedFeaturesNav = ({ compact = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const columns = useBreakpointValue({ base: 1, md: 2, lg: compact ? 2 : 4 });

  const enhancedFeatures = [
    {
      id: 'documents',
      title: 'Enhanced Documents',
      description: 'Advanced document upload with image processing',
      icon: FaFileUpload,
      color: 'blue',
      routes: {
        list: '/tenant/documents/enhanced',
        upload: '/tenant/documents/upload/enhanced'
      },
      features: ['Multi-file Upload', 'OCR Processing', 'Image Enhancement', 'Validation']
    },
    {
      id: 'issues',
      title: 'Enhanced Issues',
      description: 'Report issues with photo documentation',
      icon: FaExclamationTriangle,
      color: 'red',
      routes: {
        list: '/tenant/issues/enhanced',
        report: '/tenant/issues/report/enhanced'
      },      features: ['Photo Upload', 'Real-time Tracking', 'Status Updates', 'Progress Monitoring']
    },
    {
      id: 'bookings',
      title: 'Enhanced Bookings',
      description: 'Integrated booking and payment management',
      icon: FaHome,
      color: 'purple',
      routes: {
        list: '/tenant/bookings/enhanced',
        rooms: '/tenant/rooms/enhanced'
      },
      features: ['Payment Integration', 'Real-time Status', 'Analytics Dashboard', 'Smart Booking']
    }
  ];

  const isCurrentPath = (path) => {
    return location.pathname === path;
  };

  const FeatureCard = ({ feature }) => (
    <Card 
      bg={bgColor} 
      borderColor={borderColor} 
      borderWidth="1px"
      _hover={{ 
        shadow: 'md', 
        borderColor: `${feature.color}.300`,
        transform: 'translateY(-2px)'
      }}
      transition="all 0.2s"
    >
      <CardHeader pb={2}>
        <HStack spacing={3}>
          <Icon 
            as={feature.icon} 
            boxSize={6} 
            color={`${feature.color}.500`} 
          />
          <VStack align="start" spacing={0} flex={1}>
            <Heading size="sm">{feature.title}</Heading>
            <Text fontSize="xs" color="gray.500">
              {feature.description}
            </Text>
          </VStack>
        </HStack>
      </CardHeader>
      
      <CardBody pt={0}>
        <VStack spacing={3} align="stretch">
          {/* Feature Tags */}
          <Box>
            <SimpleGrid columns={2} spacing={1}>
              {feature.features.map((feat, index) => (
                <Badge 
                  key={index}
                  size="sm" 
                  colorScheme={feature.color}
                  variant="subtle"
                  fontSize="xs"
                >
                  {feat}
                </Badge>
              ))}
            </SimpleGrid>
          </Box>

          {/* Action Buttons */}
          <VStack spacing={2} align="stretch">
            {Object.entries(feature.routes).map(([key, path]) => (
              <Button
                key={key}
                size="sm"
                colorScheme={feature.color}
                variant={isCurrentPath(path) ? "solid" : "outline"}
                onClick={() => navigate(path)}
                rightIcon={<FaArrowRight />}
                justifyContent="space-between"
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Button>
            ))}
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  );

  const QuickAccessButtons = () => (
    <HStack spacing={2} wrap="wrap">
      <Tooltip label="Upload Documents with Image Processing">
        <Button
          size="sm"
          colorScheme="blue"
          variant={isCurrentPath('/tenant/documents/upload/enhanced') ? "solid" : "outline"}
          leftIcon={<FaFileUpload />}
          onClick={() => navigate('/tenant/documents/upload/enhanced')}
        >
          Upload Docs
        </Button>
      </Tooltip>
      
      <Tooltip label="Report Issue with Photos">
        <Button
          size="sm"
          colorScheme="red"
          variant={isCurrentPath('/tenant/issues/report/enhanced') ? "solid" : "outline"}
          leftIcon={<FaCamera />}
          onClick={() => navigate('/tenant/issues/report/enhanced')}
        >
          Report Issue
        </Button>      </Tooltip>
      
      <Tooltip label="Enhanced Room Booking">
        <Button
          size="sm"
          colorScheme="purple"
          variant={isCurrentPath('/tenant/rooms/enhanced') ? "solid" : "outline"}
          leftIcon={<FaHome />}
          onClick={() => navigate('/tenant/rooms/enhanced')}
        >
          Book Room
        </Button>
      </Tooltip>
    </HStack>
  );

  if (compact) {
    return (
      <Box>
        <Text fontSize="sm" fontWeight="semibold" mb={2} color="gray.600">
          Enhanced Features
        </Text>
        <QuickAccessButtons />
      </Box>
    );
  }

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <Box>
          <HStack justify="space-between" mb={4}>
            <VStack align="start" spacing={1}>
              <Heading size="lg">Enhanced Features</Heading>
              <Text color="gray.600">
                Access advanced functionality with improved user experience
              </Text>
            </VStack>
            <Badge colorScheme="green" variant="subtle" px={3} py={1}>
              New
            </Badge>
          </HStack>
          
          <QuickAccessButtons />
        </Box>

        <SimpleGrid columns={columns} spacing={4}>
          {enhancedFeatures.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  );
};

export default EnhancedFeaturesNav;
