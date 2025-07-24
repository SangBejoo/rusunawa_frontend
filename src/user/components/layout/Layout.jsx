import React from 'react';
import {
  Box,
  Flex,
  useDisclosure,
  useColorModeValue,
} from '@chakra-ui/react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.100', 'gray.900')}>
      <Sidebar
        onClose={onClose}
        display={{ base: 'none', md: 'block' }}
      />
      <Flex direction="column" ml={{ base: 0, md: 60 }}>
        <Header onOpen={onOpen} />
        <Box p={4} flex="1">
          {children}
        </Box>
      </Flex>
    </Box>
  );
};

export default Layout;
