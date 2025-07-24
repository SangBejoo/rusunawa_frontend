import React from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import EnhancedNavigationBar from '../navigation/EnhancedNavigationBar';

/**
 * Layout component for tenant pages
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {boolean} props.hideHeader - Whether to hide the header
 * @param {boolean} props.hideFooter - Whether to hide the footer
 */
const TenantLayout = ({ children, hideHeader = false, hideFooter = false }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  
  return (
    <Box minH="100vh" bg={bgColor} display="flex" flexDirection="column">
      {!hideHeader && (
        <>
          <Navbar />
          <EnhancedNavigationBar />
        </>
      )}
      
      <Box flex="1" as="main">
        {children}
      </Box>
      
      {!hideFooter && <Footer />}
    </Box>
  );
};

export default TenantLayout;
