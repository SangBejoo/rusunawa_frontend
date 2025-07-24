import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/authContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboard & Analytics
import Dashboard from './pages/dashboard/Dashboard';
import Analytics from './pages/analytics/Analytics';

// Management Pages
import TenantManagement from './pages/tenants/TenantManagement';
import RoomManagement from './pages/rooms/RoomManagement';
import BookingManagement from './pages/bookings/BookingManagement';
import PaymentManagement from './pages/payments/PaymentManagement';
import DocumentManagement from './pages/documents/DocumentManagement';
import IssueManagement from './pages/issues/IssueManagement';
import UserManagement from './pages/users/UserManagement';

// Testing & UAT
import PengujianUAT from '../pengujian/PengujianUAT';

// System Test (Development only)
// import SystemTest from './pages/system/SystemTest';
import RoomImageDemo from './pages/demo/RoomImageDemo';

const UserRoutes = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/reset-password" element={<ResetPassword />} />
          {/* Protected Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />          <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        
        {/* Streaming Analytics Route - Hidden for now */}
        {/*
        <Route
          path="/admin/analytics/streaming"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        */}

        {/* Tenant Management */}
        <Route
          path="/admin/tenants"
          element={
            <ProtectedRoute>
              <TenantManagement />
            </ProtectedRoute>
          }
        />

        {/* Room Management */}
        <Route
          path="/admin/rooms"
          element={
            <ProtectedRoute>
              <RoomManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rooms/types"
          element={
            <ProtectedRoute>
              <RoomManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rooms/availability"
          element={
            <ProtectedRoute>
              <RoomManagement />
            </ProtectedRoute>
          }
        />

        {/* Booking Management */}
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute>
              <BookingManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bookings/pending"
          element={
            <ProtectedRoute>
              <BookingManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bookings/calendar"
          element={
            <ProtectedRoute>
              <BookingManagement />
            </ProtectedRoute>
          }
        />        {/* Payment Management - Admin can view, but only wakil_direktorat can approve */}
        <Route
          path="/admin/payments"
          element={
            <ProtectedRoute allowedRoles={['admin', 'wakil_direktorat', 'super_admin']}>
              <PaymentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payments/pending"
          element={
            <ProtectedRoute allowedRoles={['admin', 'wakil_direktorat', 'super_admin']}>
              <PaymentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/invoices"
          element={
            <ProtectedRoute allowedRoles={['admin', 'wakil_direktorat', 'super_admin']}>
              <PaymentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payments/reports"
          element={
            <ProtectedRoute allowedRoles={['admin', 'wakil_direktorat', 'super_admin']}>
              <PaymentManagement />
            </ProtectedRoute>
          }
        />

        {/* Document Management */}
        <Route
          path="/admin/documents"
          element={
            <ProtectedRoute>
              <DocumentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/documents/pending"
          element={
            <ProtectedRoute>
              <DocumentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/documents/types"
          element={
            <ProtectedRoute>
              <DocumentManagement />
            </ProtectedRoute>
          }
        />

        {/* Issue Management */}
        <Route
          path="/admin/issues"
          element={
            <ProtectedRoute>
              <IssueManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/issues/open"
          element={
            <ProtectedRoute>
              <IssueManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/issues/categories"
          element={
            <ProtectedRoute>
              <IssueManagement />
            </ProtectedRoute>
          }
        />

        {/* User Management */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin', 'wakil_direktorat', 'super_admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />

        {/* Testing & UAT */}
        <Route
          path="/admin/testing"
          element={
            <ProtectedRoute>
              <PengujianUAT />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/pengujian"
          element={
            <ProtectedRoute>
              <PengujianUAT />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/uat"
          element={
            <ProtectedRoute>
              <PengujianUAT />
            </ProtectedRoute>
          }
        />

        {/* System Test - Development Only - Commented out for now */}
        {/*
        <Route
          path="/admin/system-test"
          element={
            <ProtectedRoute>
              <SystemTest />
            </ProtectedRoute>
          }
        />
        */}

        {/* Room Image Demo - Development Only */}
        <Route
          path="/admin/room-image-demo"
          element={
            <ProtectedRoute>
              <RoomImageDemo />
            </ProtectedRoute>
          }
        />

        {/* Default redirects */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default UserRoutes;
