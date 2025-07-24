import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Icon,
  Text,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Button,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Badge,
  Collapse,
  useColorModeValue
} from '@chakra-ui/react';
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiAlertCircle,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiChevronDown,
  FiChevronRight,
  FiBarChart,
  FiFile
} from 'react-icons/fi';
import { MdApartment as FiBuilding } from 'react-icons/md';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import rusunawa_logo from '../../../assets/images/rusunawa-logo.png';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: FiHome, badge: null },
  { name: 'Analytics', href: '/admin/analytics', icon: FiBarChart, badge: null },
  { name: 'Tenant Management', href: '/admin/tenants', icon: FiUsers, badge: null },
  { name: 'Room Management', href: '/admin/rooms', icon: FiBuilding, badge: null },
  { name: 'Booking Management', href: '/admin/bookings', icon: FiCalendar, badge: null },
  { name: 'Payment Management', href: '/admin/payments', icon: FiDollarSign, badge: null },
  { name: 'Document Management', href: '/admin/documents', icon: FiFile, badge: null },
  { name: 'Issue Management', href: '/admin/issues', icon: FiAlertCircle, badge: null },
  { name: 'User Management', href: '/admin/users', icon: FiSettings, badge: null }
];

const SidebarContent = ({ onClose, ...rest }) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState({});

  // Initialize expanded items based on current route
  useEffect(() => {
    const newExpandedItems = {};
    navigation.forEach((item, index) => {
      if (item.children) {
        const isParentActive = item.children.some(child => 
          location.pathname === child.href || location.pathname.startsWith(child.href + '/')
        );
        if (isParentActive) {
          newExpandedItems[index] = true;
        }
      }
    });
    setExpandedItems(newExpandedItems);
  }, [location.pathname]);

  const toggleExpanded = (index) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const isActiveLink = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };
  const isParentActive = (item) => {
    if (item.href) return isActiveLink(item.href);
    return item.children?.some(child => isActiveLink(child.href));
  };
  // Handle mobile navigation close
  const handleNavClick = () => {
    // Only close on mobile (when isMobile prop is true)
    if (rest.isMobile && onClose) {
      onClose();
    }
  };

  const NavItem = ({ item, index }) => {
    // Sudah tidak ada children, jadi tidak perlu expandable
    const isActive = isActiveLink(item.href);
    return (
      <Flex
        as={RouterLink}
        to={item.href}
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={isActive ? 'brand.500' : 'transparent'}
        color={isActive ? 'white' : 'gray.600'}
        _hover={{
          bg: isActive ? 'brand.600' : 'gray.100',
          color: isActive ? 'white' : 'gray.900',
        }}
        // Hanya close drawer jika mobile
        onClick={rest.isMobile ? handleNavClick : undefined}
      >
        <Icon mr="4" fontSize="16" as={item.icon} />
        <Text fontSize="sm" fontWeight="medium">
          {item.name}
        </Text>
        {item.badge && (
          <Badge
            ml="auto"
            colorScheme={item.badge === 'New' ? 'blue' : 'red'}
            fontSize="xs"
          >
            {item.badge}
          </Badge>
        )}
      </Flex>
    );
  };

  return (
    <Box
      bg="white"
      borderRight="1px"
      borderRightColor="gray.200"
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      zIndex={100}
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="4" justify="center">
        <VStack spacing={2}>
          <Box>
            <img 
              src={rusunawa_logo}
              alt="Rusunawa Logo" 
              style={{ maxHeight: '40px', width: 'auto' }}
            />
          </Box>
          <Text fontSize="sm" fontFamily="monospace" fontWeight="bold" color="brand.500" textAlign="center">
            Rusunawa Admin
          </Text>
        </VStack>
      </Flex>
      <VStack spacing={1} align="stretch">
        {navigation.map((item, index) => (
          <NavItem key={index} item={item} index={index} />
        ))}
      </VStack>
    </Box>
  );
};

const MobileNav = ({ onOpen, ...rest }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg="white"
      borderBottomWidth="1px"
      borderBottomColor="gray.200"
      justifyContent={{ base: 'space-between', md: 'flex-end' }}
      {...rest}
    >
      <IconButton
        display={{ base: 'flex', md: 'none' }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
      />

      <HStack spacing={2} display={{ base: 'flex', md: 'none' }}>
        <img 
          src={rusunawa_logo}
          alt="Rusunawa Logo" 
          style={{ maxHeight: '25px', width: 'auto' }}
        />
        <Text
          fontSize="lg"
          fontFamily="monospace"
          fontWeight="bold"
          color="brand.500"
        >
          Rusunawa
        </Text>
      </HStack>

      <HStack spacing={{ base: '0', md: '6' }}>
        <Menu>
          <MenuButton
            as={Button}
            rounded="full"
            variant="link"
            cursor="pointer"
            minW={0}
          >
            <HStack>
              <Avatar
                size="sm"
                name={user?.name}
                src={user?.avatar}
              />
              <VStack
                display={{ base: 'none', md: 'flex' }}
                alignItems="flex-start"
                spacing="1px"
                ml="2"
              >
                <Text fontSize="sm" fontWeight="semibold">
                  {user?.name}
                </Text>                <Text fontSize="xs" color="gray.600">
                  {user?.role?.name || user?.role || 'User'}
                </Text>
              </VStack>
            </HStack>
          </MenuButton>
          <MenuList>
            <MenuItem icon={<FiSettings />}>
              Profile Settings
            </MenuItem>
            <MenuDivider />
            <MenuItem icon={<FiLogOut />} onClick={handleLogout}>
              Sign out
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  );
};

const AdminLayout = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box minH="100vh" bg="gray.50">
      <SidebarContent
        onClose={() => onClose}
        display={{ base: 'none', md: 'block' }}
      />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerOverlay />        <DrawerContent>
          <DrawerCloseButton />
          <SidebarContent onClose={onClose} isMobile={true} />
        </DrawerContent>
      </Drawer>
      
      <MobileNav onOpen={onOpen} />
      <Box ml={{ base: 0, md: 60 }} p="4">
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
