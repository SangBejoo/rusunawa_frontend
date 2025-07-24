import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';

// Import route components
import UserRoutes from './user/userRoutes';
import TenantRoutes from './tenant/tenantRoutes';

// Import auth providers
import { AuthProvider } from './user/context/authContext';
import { TenantAuthProvider } from './tenant/context/tenantAuthContext';

// Define theme with brand colors for Rusunawa
const theme = extendTheme({
  colors: {
    brand: {
      50: '#e6f7ff',
      100: '#b3e0ff',
      200: '#80caff',
      300: '#4db3ff',
      400: '#1a9cff',
      500: '#0080e6', // Primary brand color
      600: '#0066b8',
      700: '#004d8a',
      800: '#00335c',
      900: '#001a2e',
    },
  },
  fonts: {
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  }
});

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Routes>
          {/* Tenant Routes - Public access */}
          <Route path="/tenant/*" element={
            <TenantAuthProvider>
              <TenantRoutes />
            </TenantAuthProvider>
          } />
          
          {/* Admin Routes - Protected */}
          <Route path="/*" element={
            <AuthProvider>
              <UserRoutes />
            </AuthProvider>
          } />
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App;
