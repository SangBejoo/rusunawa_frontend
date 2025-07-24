import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  useColorModeValue,
  Icon,
  HStack,
} from '@chakra-ui/react';
import { FaArrowRight, FaCalendarPlus } from 'react-icons/fa';

/**
 * Welcome section for the tenant dashboard
 */
const WelcomeSection = ({ tenant }) => {
  // Get time of day for personalized greeting
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  // Get tenant's first name
  const getFirstName = () => {
    if (!tenant?.name) return '';
    return tenant.name.split(' ')[0];
  };
  
  // Colors
  const bgGradient = useColorModeValue(
    'linear(to-r, brand.50, blue.50)',
    'linear(to-r, brand.900, blue.900)'
  );
  const textColor = useColorModeValue('gray.800', 'white');
  
  return (
    <Box
      mb={8}
      p={6}
      borderRadius="xl"
      boxShadow="md"
      bgGradient={bgGradient}
      position="relative"
      overflow="hidden"
    >
      {/* Decorative elements */}
      <Box
        position="absolute"
        top="-20px"
        right="-10px"
        width="150px"
        height="150px"
        borderRadius="full"
        bg="brand.400"
        opacity="0.1"
        zIndex="0"
      />
      <Box
        position="absolute"
        bottom="-30px"
        left="20%"
        width="100px"
        height="100px"
        borderRadius="full"
        bg="blue.300"
        opacity="0.1"
        zIndex="0"
      />
      
      {/* Content */}
      <Flex
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        position="relative"
        zIndex="1"
      >
        <Box mb={{ base: 4, md: 0 }}>
          <Heading as="h1" size="xl" mb={2} color={textColor}>
            Good {getTimeOfDay()}, {getFirstName()}!
          </Heading>
          <Text fontSize="lg" color={textColor}>
            Welcome to your Rusunawa PNJ Dashboard
          </Text>
        </Box>
        
        <HStack spacing={4}>
          <Button
            as={RouterLink}
            to="/tenant/rooms"
            colorScheme="brand"
            leftIcon={<Icon as={FaCalendarPlus} />}
            size="lg"
          >
            Book a Room
          </Button>
          
          <Button
            as={RouterLink}
            to="/tenant/profile"
            variant="outline"
            colorScheme="brand"
            rightIcon={<Icon as={FaArrowRight} />}
            size="lg"
            display={{ base: 'none', md: 'flex' }}
          >
            Complete Profile
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
};

export default WelcomeSection;
