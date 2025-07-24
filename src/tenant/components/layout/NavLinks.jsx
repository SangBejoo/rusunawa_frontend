import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Stack, 
  Text,
  Icon,
  Flex,
  List,
  ListItem,
  ListIcon
} from '@chakra-ui/react';
import {
  MdHome,
  MdHotel,
  MdAssignment,
  MdPayment,
  MdDashboard,
  MdChevronRight,
  MdBugReport,
  MdDescription
} from 'react-icons/md';

const NavLinks = ({ isAuthenticated, onClose }) => {
  return (
    <List spacing={4}>
      <NavLink to="/" icon={MdHome} label="Home" onClose={onClose} />
      <NavLink to="/rooms" icon={MdHotel} label="Rooms" onClose={onClose} />
      {isAuthenticated && (
        <>
          <NavLink to="/bookings" icon={MdAssignment} label="My Bookings" onClose={onClose} />
          <NavLink to="/dashboard" icon={MdDashboard} label="Dashboard" onClose={onClose} />
          <NavLink to="/documents" icon={MdDescription} label="Documents" onClose={onClose} />
          <NavLink to="/payments/history" icon={MdPayment} label="Payment History" onClose={onClose} />
          <NavLink to="/invoices" icon={MdPayment} label="Invoices" onClose={onClose} />
          <NavLink to="/issues/report" icon={MdBugReport} label="Report Issue" onClose={onClose} />
        </>
      )}
    </List>
  );
};

const NavLink = ({ to, icon, label, onClose }) => {
  return (
    <ListItem>
      <Link to={to} onClick={onClose}>
        <Flex align="center" p={2} borderRadius="md" _hover={{ bg: "gray.100" }} role="group">
          <ListIcon as={icon} fontSize="xl" color="gray.500" _groupHover={{ color: "brand.500" }} />
          <Text ml={4} _groupHover={{ color: "brand.500" }}>{label}</Text>
          <Icon 
            as={MdChevronRight} 
            ml="auto" 
            fontSize="lg" 
            opacity={0}
            transform="translateX(-10px)"
            _groupHover={{ 
              opacity: 1, 
              transform: "translateX(0)",
              color: "brand.500"
            }}
            transition="all 0.2s"
          />
        </Flex>
      </Link>
    </ListItem>
  );
};

export default NavLinks;
