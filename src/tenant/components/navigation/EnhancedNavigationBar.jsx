import React from 'react';
import {
  Box, Flex, Button, ButtonGroup, Badge, Tooltip, 
  useColorModeValue, Text, Icon, HStack
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  FaRocket, FaChartLine, FaList, FaBed, 
  FaCreditCard 
} from 'react-icons/fa';

const EnhancedNavigationBar = () => {
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeColor = useColorModeValue('blue.600', 'blue.200');  const enhancedRoutes = [
    {
      path: '/tenant/rooms/enhanced',
      label: 'Enhanced Rooms',
      icon: FaBed,
      description: 'Streamlined booking experience'
    },
    {
      path: '/tenant/bookings/enhanced',
      label: 'Enhanced Bookings',
      icon: FaList,
      description: 'Advanced booking management'
    }
  ];

  const isEnhancedView = enhancedRoutes.some(route => 
    location.pathname.includes(route.path.replace('/tenant', ''))
  );

  if (!isEnhancedView) return null;

  return (
    <Box
      bg={bgColor}
      borderBottomWidth="1px"
      borderColor={borderColor}
      px={4}
      py={2}
      position="sticky"
      top="60px"
      zIndex="banner"
      boxShadow="sm"
    >
      <Flex justify="space-between" align="center" maxW="container.xl" mx="auto">
        <HStack spacing={4}>
          <HStack spacing={2}>
            <Icon as={FaRocket} color="blue.500" />
            <Text fontWeight="bold" color="blue.600">Enhanced Mode</Text>
            <Badge colorScheme="blue" variant="subtle">BETA</Badge>
          </HStack>
          
          <ButtonGroup size="sm" variant="ghost" spacing={1}>
            {enhancedRoutes.map((route) => {
              const isActive = location.pathname === route.path;
              return (
                <Tooltip 
                  key={route.path}
                  label={route.description}
                  placement="bottom"
                >
                  <Button
                    as={RouterLink}
                    to={route.path}
                    leftIcon={<Icon as={route.icon} />}
                    bg={isActive ? activeBg : 'transparent'}
                    color={isActive ? activeColor : 'gray.600'}
                    _hover={{
                      bg: activeBg,
                      color: activeColor
                    }}
                    size="sm"
                  >
                    {route.label}
                  </Button>
                </Tooltip>
              );
            })}
          </ButtonGroup>
        </HStack>

        <HStack spacing={2}>
          <Text fontSize="sm" color="gray.500">
            Switch to classic view
          </Text>
          <ButtonGroup size="sm" isAttached variant="outline">
            <Button
              as={RouterLink}
              to="/tenant/dashboard"
              colorScheme="gray"
              size="sm"
            >
              Classic
            </Button>
            <Button
              colorScheme="blue"
              size="sm"
              isDisabled
            >
              Enhanced
            </Button>
          </ButtonGroup>
        </HStack>
      </Flex>
    </Box>
  );
};

export default EnhancedNavigationBar;
