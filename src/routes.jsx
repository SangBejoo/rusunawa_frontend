import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Auth Pages
import Login from './pages/auth/Login';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';
import UsersList from './pages/dashboard/Users/index';
import RoomsList from './pages/dashboard/Rooms/index';
import RoomDetail from './pages/dashboard/Rooms/RoomDetail';
import CreateRoom from './pages/dashboard/Rooms/CreateRoom';
import EditRoom from './pages/dashboard/Rooms/EditRoom';
import NotImplemented from './pages/dashboard/NotImplemented';

// Not Found Page
import NotFound from './pages/NotFound';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Default Route */}
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      
      {/* Auth Routes */}
      <Route path="/admin/login" element={<Login />} />
      
      {/* Dashboard Routes */}
      <Route path="/admin/dashboard" element={<Dashboard />} />
      
      {/* User Management */}
      <Route path="/admin/users" element={<UsersList />} />
      <Route path="/admin/users/create" element={<NotImplemented title="Create User Form" />} />
      <Route path="/admin/users/edit/:id" element={<NotImplemented title="Edit User Form" />} />
      
      {/* Room Management */}
      <Route path="/admin/rooms" element={<RoomsList />} />
      <Route path="/admin/rooms/create" element={<CreateRoom />} />
      <Route path="/admin/rooms/edit/:id" element={<EditRoom />} />
      <Route path="/admin/rooms/:id" element={<RoomDetail />} />
      
      {/* Other Management Routes - Not Yet Implemented */}
      <Route path="/admin/tenants" element={<NotImplemented title="Tenant Management" />} />
      <Route path="/admin/bookings" element={<NotImplemented title="Booking Management" />} />
      <Route path="/admin/invoices" element={<NotImplemented title="Invoice Management" />} />
      <Route path="/admin/issues" element={<NotImplemented title="Issue Management" />} />
      
      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
