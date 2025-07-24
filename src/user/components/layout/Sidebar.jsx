import React from 'react';
import {
  Box,
  CloseButton,
  Flex,
  useColorModeValue,
  Text,
  VStack,
  Icon,
  Link,
  Badge,
  HStack,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import rusunawa_logo from '../../../assets/images/rusunawa-logo.png';
import {
  FiHome,
  FiTrendingUp,
  FiUsers,
  FiGrid,
  FiCalendar,
  FiCreditCard,
  FiFileText,
  FiAlertCircle,
  FiSettings,
  FiTool,
  FiCheckSquare,
} from 'react-icons/fi';

const LinkItems = [
  { name: 'Dashboard', icon: FiHome, href: '/admin/dashboard' },
  { name: 'Analytics', icon: FiTrendingUp, href: '/admin/analytics' },
  { name: 'Tenants', icon: FiUsers, href: '/admin/tenants' },
  { name: 'Rooms', icon: FiGrid, href: '/admin/rooms' },
  { name: 'Bookings', icon: FiCalendar, href: '/admin/bookings' },
  { name: 'Payments', icon: FiCreditCard, href: '/admin/payments' },
  { name: 'Documents', icon: FiFileText, href: '/admin/documents' },
  { name: 'Issues', icon: FiAlertCircle, href: '/admin/issues' },
  { name: 'User Management', icon: FiSettings, href: '/admin/users' },
  { name: 'Testing & UAT', icon: FiCheckSquare, href: '/admin/testing' },
  { name: 'System Test', icon: FiTool, href: '/admin/system-test' },
];

const SidebarContent = ({ onClose, ...rest }) => {
  const location = useLocation();

  return (
    <Box
      transition="3s ease"
      bg={useColorModeValue('white', 'gray.900')}
      borderRight="1px"
      borderRightColor={useColorModeValue('gray.200', 'gray.700')}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <HStack spacing={3}>
          <Box>
            <img
              src={rusunawa_logo}
              alt="Rusunawa Logo"
              style={{ maxHeight: '35px', width: 'auto' }}
            />
          </Box>
          <Text fontSize="xl" fontFamily="monospace" fontWeight="bold">
            Rusunawa Admin
          </Text>
        </HStack>
        <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
      </Flex>
      <VStack spacing={1} align="stretch" px={4}>
        {LinkItems.map((link) => (
          <NavItem
            key={link.name}
            icon={link.icon}
            href={link.href}
            isActive={location.pathname === link.href}
          >
            {link.name}
          </NavItem>
        ))}
      </VStack>
    </Box>
  );
};

const NavItem = ({ icon, children, href, isActive, ...rest }) => {
  return (
    <Link
      as={RouterLink}
      to={href}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}
    >
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={isActive ? 'blue.400' : 'transparent'}
        color={isActive ? 'white' : 'inherit'}
        _hover={{
          bg: isActive ? 'blue.400' : 'gray.400',
          color: 'white',
        }}
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="16"
            _groupHover={{
              color: 'white',
            }}
            as={icon}
          />
        )}
        {children}
      </Flex>
    </Link>
  );
};

const Sidebar = ({ onClose, ...rest }) => {
  return <SidebarContent onClose={onClose} {...rest} />;
};

export default Sidebar;