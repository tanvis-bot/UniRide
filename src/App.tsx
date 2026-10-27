import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { GuestRoute } from './components/auth/GuestRoute';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicLayout } from './components/layout/PublicLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';

import { Landing } from './pages/Landing';
import { HowItWorks } from './pages/HowItWorks';
import { SafetyPage } from './pages/SafetyPage';
import { About } from './pages/About';
import { Info } from './pages/Info';
import { NotFound } from './pages/NotFound';
import { Unauthorized } from './pages/Unauthorized';
import { TripShare } from './pages/TripShare';

import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';

import { PassengerDashboard } from './pages/passenger/PassengerDashboard';
import { FindRide } from './pages/passenger/FindRide';
import { RideDetails } from './pages/passenger/RideDetails';
import { MyBookings } from './pages/passenger/MyBookings';
import { BookingConfirmation } from './pages/passenger/BookingConfirmation';
import { ActiveRide } from './pages/passenger/ActiveRide';
import { StudentVerification } from './pages/passenger/StudentVerification';
import { EmergencyContacts } from './pages/passenger/EmergencyContacts';

import { DriverDashboard } from './pages/driver/DriverDashboard';
import { DriverVerification } from './pages/driver/DriverVerification';
import { Vehicles } from './pages/driver/Vehicles';
import { OfferRide } from './pages/driver/OfferRide';
import { MyRides } from './pages/driver/MyRides';
import { DriverRideDetail } from './pages/driver/DriverRideDetail';
import { RideRequests } from './pages/driver/RideRequests';
import { DriverActiveRide } from './pages/driver/DriverActiveRide';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminVerifications } from './pages/admin/AdminVerifications';
import { AdminRides } from './pages/admin/AdminRides';
import { AdminOperations } from './pages/admin/AdminOperations';

import { MessagesPage } from './pages/shared/MessagesPage';
import { NotificationsPage } from './pages/shared/NotificationsPage';
import { ProfilePage } from './pages/shared/ProfilePage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Toaster position="top-right" richColors closeButton />
          <Routes>
            {/* Public marketing site */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/safety" element={<SafetyPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/help" element={<Info kind="help" />} />
              <Route path="/contact" element={<Info kind="contact" />} />
              <Route path="/terms" element={<Info kind="terms" />} />
              <Route path="/privacy" element={<Info kind="privacy" />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Public read-only shared trip */}
            <Route path="/trip/:token" element={<TripShare />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Auth */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            {/* Passenger */}
            <Route element={<ProtectedRoute roles={['passenger']} />}>
              <Route path="/passenger" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/passenger/dashboard" replace />} />
                <Route path="dashboard" element={<PassengerDashboard />} />
                <Route path="find-ride" element={<FindRide />} />
                <Route path="rides/:rideId" element={<RideDetails />} />
                <Route path="bookings" element={<MyBookings />} />
                <Route path="bookings/:bookingId" element={<BookingConfirmation />} />
                <Route path="active-ride" element={<ActiveRide />} />
                <Route path="student-verification" element={<StudentVerification />} />
                <Route path="emergency-contacts" element={<EmergencyContacts />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* Driver */}
            <Route element={<ProtectedRoute roles={['driver']} />}>
              <Route path="/driver" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/driver/dashboard" replace />} />
                <Route path="dashboard" element={<DriverDashboard />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="verification" element={<DriverVerification />} />
                <Route path="vehicles" element={<Vehicles />} />
                <Route path="offer-ride" element={<OfferRide />} />
                <Route path="rides" element={<MyRides />} />
                <Route path="rides/:rideId" element={<DriverRideDetail />} />
                <Route path="requests" element={<RideRequests />} />
                <Route path="active-ride" element={<DriverActiveRide />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="history" element={<MyRides historyOnly />} />
              </Route>
            </Route>

            {/* Admin */}
            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="/admin" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route
                  path="drivers"
                  element={
                  <AdminUsers
                    lockedRole="driver"
                    title="Drivers"
                    description="Every registered driver with verification state and account status." />

                  } />
                
                <Route
                  path="student-verification"
                  element={<AdminVerifications type="student" />} />
                
                <Route
                  path="driver-verification"
                  element={<AdminVerifications type="driver" />} />
                
                <Route path="rides" element={<AdminRides />} />
                <Route path="bookings" element={<AdminOperations view="bookings" />} />
                <Route path="reports" element={<AdminOperations view="reports" />} />
                <Route path="issues" element={<AdminOperations view="issues" />} />
              </Route>
            </Route>
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>);

}