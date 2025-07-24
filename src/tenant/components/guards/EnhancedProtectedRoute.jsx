import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTenantAuth } from '../../context/tenantAuthContext';
import DocumentApprovalGuard from './DocumentApprovalGuard';

/**
 * Enhanced Protected Route Component
 * Provides authentication and optional document approval protection
 */
const EnhancedProtectedRoute = ({ 
  children, 
  requiresAuth = true, 
  requiresDocumentApproval = false,
  redirectTo = "/tenant/login" 
}) => {
  const { isAuthenticated } = useTenantAuth();

  // If authentication is required and user is not authenticated
  if (requiresAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // If document approval is required, wrap with DocumentApprovalGuard
  if (requiresDocumentApproval) {
    return (
      <DocumentApprovalGuard requiresApproval={true}>
        {children}
      </DocumentApprovalGuard>
    );
  }

  // If only authentication is required or no protection needed
  return children;
};

/**
 * Standard Protected Route (backward compatibility)
 * Only requires authentication
 */
export const ProtectedRoute = ({ children }) => {
  return (
    <EnhancedProtectedRoute requiresAuth={true} requiresDocumentApproval={false}>
      {children}
    </EnhancedProtectedRoute>
  );
};

/**
 * Booking Protected Route
 * Requires both authentication and document approval
 */
export const BookingProtectedRoute = ({ children }) => {
  return (
    <EnhancedProtectedRoute requiresAuth={true} requiresDocumentApproval={true}>
      {children}
    </EnhancedProtectedRoute>
  );
};

/**
 * Payment Protected Route
 * Requires both authentication and document approval (since payments are tied to bookings)
 */
export const PaymentProtectedRoute = ({ children }) => {
  return (
    <EnhancedProtectedRoute requiresAuth={true} requiresDocumentApproval={true}>
      {children}
    </EnhancedProtectedRoute>
  );
};

export default EnhancedProtectedRoute;
