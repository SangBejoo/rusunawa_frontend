import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import './App.css';

// Import routes
import AdminRoutes from './admin/AdminRoutes';

// Import theme
import theme from './theme'; // Ensure this path is correct
import { TenantAuthProvider } from './tenant/context/tenantAuthContext'; // Ensure this path is correct
import TenantRoutes from './tenant/tenantRoutes'; // Ensure this path is correct

const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        {/* TenantAuthProvider must wrap any components that use useTenantAuth */}
        <TenantAuthProvider>
          <Routes>
            {/* Tenant Routes are now children of TenantAuthProvider */}
            <Route path="/tenant/*" element={<TenantRoutes />} />
            
            {/* Admin Routes are also children. If AdminRoutes uses useTenantAuth, it's covered. 
                If it uses a different auth context, it would need its own provider. */}
            <Route path="/admin/*" element={<AdminRoutes />} />
            
            {/* Default redirect */}
            {/* These Navigate components will redirect to paths handled within the Routes,
                which are already under TenantAuthProvider. */}
            <Route path="/" element={<Navigate to="/tenant" replace />} />
            <Route path="*" element={<Navigate to="/tenant" replace />} />
          </Routes>
        </TenantAuthProvider>
      </Router>
    </ChakraProvider>
  );
};

export default App;
