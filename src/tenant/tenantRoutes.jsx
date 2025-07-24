import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTenantAuth } from './context/tenantAuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import AuthenticationWrapper from './components/auth/AuthenticationWrapper';

// Landing page
import Landing from './pages/Landing';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import EmailVerification from './pages/auth/EmailVerification';
import VerificationPrompt from './pages/auth/VerificationPrompt';

// Content pages
import Dashboard from './pages/dashboard/Dashboard';
import RoomsList from './pages/rooms/RoomsList';  
import RoomListing from './pages/rooms/RoomListing';
import RoomDetail from './pages/rooms/RoomDetail';
import BookRoom from './pages/rooms/BookRoom';
import DynamicRoomBooking from './pages/rooms/DynamicRoomBooking';

// Booking pages
import BookingHistory from './pages/bookings/BookingsList';
import BookingDetail from './pages/bookings/BookingDetail';
import EnhancedBookingsList from './pages/bookings/EnhancedBookingsList';

// Profile pages
import Profile from './pages/profile/Profile';
import EditProfile from './pages/profile/EditProfile';
import Documents from './pages/profile/Documents';
import UploadDocument from './pages/profile/UploadDocument';

// Payment pages
import PaymentHistory from './pages/payments/PaymentHistory';
import PaymentDetails from './pages/payments/PaymentDetails';
import PaymentProcess from './pages/payments/PaymentProcess';
import PaymentMethodSelection from './pages/payments/PaymentMethodSelection';
import ManualPayment from './pages/payments/ManualPayment';
import MidtransPayment from './pages/payments/MidtransPayment';
import MidtransCallback from './pages/payments/MidtransCallback';
import CreateManualPayment from './pages/payments/CreateManualPayment';

// Issues pages
import IssuesPage from './pages/issues/IssuesPage';
import ReportIssuePage from './pages/issues/ReportIssuePage';
import IssueDetailPage from './pages/issues/IssueDetailPage';

// Home page
import TenantHome from './pages/home/TenantHome';
import TenantDashboard from './pages/dashboard/TenantDashboard';

// Check-in pages
import CheckInPage from './pages/bookings/CheckInPage';

// Invoice pages
import InvoicesList from './pages/invoices/InvoicesList';
import InvoiceDetail from './pages/invoices/InvoiceDetail';

const TenantRoutes = () => {
  const { isAuthenticated, isLoading } = useTenantAuth();

  // Protected route wrapper
  const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    
    // Show loading while authentication is being checked
    if (isLoading) {
      return <LoadingSpinner message="Checking authentication..." />;
    }
    
    // Redirect to login with current location if not authenticated
    return isAuthenticated ? children : <Navigate to="/tenant/login" state={{ from: location }} replace />;
  };

  return (
    <AuthenticationWrapper>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<TenantHome />} />
        <Route path="/rooms" element={<RoomsList />} />
        <Route path="/rooms/listing" element={<RoomListing />} />
        <Route path="/rooms/:roomId" element={<RoomDetail />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/email-verification" element={<EmailVerification />} />
        <Route path="/verification-prompt" element={<VerificationPrompt />} />

      {/* Protected Routes */}      <Route path="/dashboard" element={
        <ProtectedRoute>
          <TenantDashboard />
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />

      <Route path="/profile/edit" element={
        <ProtectedRoute>
          <EditProfile />
        </ProtectedRoute>
      } />

      <Route path="/documents" element={
        <ProtectedRoute>
          <Documents />
        </ProtectedRoute>
      } />      <Route path="/documents/upload" element={
        <ProtectedRoute>
          <UploadDocument />
        </ProtectedRoute>
      } />

      <Route path="/bookings" element={
        <ProtectedRoute>
          <EnhancedBookingsList />
        </ProtectedRoute>
      } />

      <Route path="/bookings/:bookingId" element={
        <ProtectedRoute>
          <BookingDetail />
        </ProtectedRoute>
      } />

      <Route path="/bookings/:bookingId/check-in" element={
        <ProtectedRoute>
          <CheckInPage />
        </ProtectedRoute>
      } />

      <Route path="/bookings/:bookingId/payment" element={
        <ProtectedRoute>
          <PaymentProcess />
        </ProtectedRoute>
      } />

      <Route path="/bookings/:bookingId/payment-method" element={
        <ProtectedRoute>
          <PaymentMethodSelection />
        </ProtectedRoute>
      } />

      <Route path="/bookings/:bookingId/manual-payment" element={
        <ProtectedRoute>
          <ManualPayment />
        </ProtectedRoute>
      } />

      <Route path="/bookings/:bookingId/midtrans-payment" element={
        <ProtectedRoute>
          <MidtransPayment />
        </ProtectedRoute>
      } />

      <Route path="/invoices/:invoiceId/manual-payment" element={
        <ProtectedRoute>
          <ManualPayment />
        </ProtectedRoute>
      } />

      <Route path="/invoices/:invoiceId/midtrans-payment" element={
        <ProtectedRoute>
          <MidtransPayment />
        </ProtectedRoute>
      } />

      <Route path="/rooms/:roomId/book" element={
        <ProtectedRoute>
          <DynamicRoomBooking />
        </ProtectedRoute>
      } />

      <Route path="/rooms/:roomId/book-legacy" element={
        <ProtectedRoute>
          <BookRoom />
        </ProtectedRoute>
      } />

      <Route path="/payments/history" element={
        <ProtectedRoute>
          <PaymentHistory />
        </ProtectedRoute>
      } />

      <Route path="/payments/:paymentId" element={
        <ProtectedRoute>
          <PaymentDetails />
        </ProtectedRoute>
      } />

      {/* New manual payment creation routes */}
      <Route path="/payments/create/manual" element={
        <ProtectedRoute>
          <CreateManualPayment />
        </ProtectedRoute>
      } />

      <Route path="/bookings/:bookingId/payments/create/manual" element={
        <ProtectedRoute>
          <CreateManualPayment />
        </ProtectedRoute>
      } />

      <Route path="/invoices/:invoiceId/payments/create/manual" element={
        <ProtectedRoute>
          <CreateManualPayment />
        </ProtectedRoute>
      } />

      {/* Midtrans Callback Route */}
      <Route path="/payments/callback" element={
        <ProtectedRoute>
          <MidtransCallback />
        </ProtectedRoute>
      } />      <Route path="/issues" element={
        <ProtectedRoute>
          <IssuesPage />
        </ProtectedRoute>
      } />      <Route path="/issues/report" element={
        <ProtectedRoute>
          <ReportIssuePage />
        </ProtectedRoute>
      } />      <Route path="/issues/:issueId" element={
        <ProtectedRoute>
          <IssueDetailPage />
        </ProtectedRoute>
      } />

      <Route path="/invoices" element={
        <ProtectedRoute>
          <InvoicesList />
        </ProtectedRoute>
      } />

      <Route path="/invoices/history" element={
        <ProtectedRoute>
          <InvoicesList />
        </ProtectedRoute>
      } />

      <Route path="/invoices/:invoiceId" element={
        <ProtectedRoute>
          <InvoiceDetail />
        </ProtectedRoute>
      } />

      <Route path="/invoices/:invoiceId/payment-method" element={
        <ProtectedRoute>
          <PaymentMethodSelection />
        </ProtectedRoute>
      } />

      <Route path="/payments/process/:invoiceId" element={
        <ProtectedRoute>
          <PaymentProcess />
        </ProtectedRoute>
      } />

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/tenant" replace />} />
      </Routes>
    </AuthenticationWrapper>
  );
};

export default TenantRoutes;
