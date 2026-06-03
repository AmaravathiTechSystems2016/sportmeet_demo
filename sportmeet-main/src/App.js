import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SiteProvider } from './contexts/SiteContext';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import PublicEventsPage from './pages/EventsPage';
import SportsPage from './pages/SportsPage';
import BookingsPage from './pages/BookingsPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VenueOwnerRegistrationPage from './pages/VenueOwnerRegistrationPage';
import VenueOwnerVenuesPage from './pages/VenueOwnerVenuesPage';
import VenueOwnerBookingsPage from './pages/VenueOwnerBookingsPage';
import VenueOwnerEditVenuePage from './pages/VenueOwnerEditVenuePage';
// import VenueDetailPage from './pages/VenueDetailPage';
import EventDetailPage from './pages/EventDetailPage';
import BookingDetailPage from './pages/BookingDetailPage';
import BookingConfirmationEventPage from './pages/BookingConfirmationEventPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import VenueRegistrationPage from './pages/VenueRegistrationPage';
import VenueDiscoveryPage from './pages/VenueDiscoveryPage';
import VenueBookingPage from './pages/VenueBookingPage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminLayout from './components/Admin/AdminLayout';
import AnalyticsPage from './pages/Admin/AnalyticsPage';
import UsersPage from './pages/Admin/UsersPage';
import VenueOwnersPage from './pages/Admin/VenueOwnersPage';
import SettingsPage from './pages/Admin/SettingsPage';
import AdminVenuesPage from './pages/Admin/VenuesPage';
import CreateVenuePage from './pages/Admin/CreateVenuePage';
import EditVenuePage from './pages/Admin/EditVenuePage';
import AdminSportsPage from './pages/Admin/SportsPage';
import AmenitiesPage from './pages/Admin/AmenitiesPage';
import SocialKeysPage from './pages/Admin/SocialKeysPage';
import EventsPage from './pages/Admin/EventsPage';
import CreateEventPage from './pages/Admin/CreateEventPage';
import EditEventPage from './pages/Admin/EditEventPage';
import EventBookingsPage from './pages/Admin/EventBookingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import NotFoundPage from './pages/NotFoundPage';
import BookingsAdminPage from './pages/Admin/BookingsPage';
import PaymentsAdminPage from './pages/Admin/PaymentsPage';
import ReviewsPage from './pages/Admin/ReviewsPage';
import ActivityLogPage from './pages/Admin/ActivityLogPage';
import DiscountsPage from './pages/Admin/DiscountsPage';
import StaticPage from './pages/Public/StaticPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SiteProvider>
            <AuthProvider>
              <div className="App">
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
                       <Route path="venues" element={<VenueDiscoveryPage />} />
                       <Route path="venues/:id" element={<VenueBookingPage />} />
                       <Route path="sports" element={<SportsPage />} />
                       <Route path="events" element={<PublicEventsPage />} />
                       <Route path="events/:id" element={<EventDetailPage />} />
                      <Route path="event-booking-confirmation" element={<BookingConfirmationEventPage />} />
                      <Route path="booking-confirmation/:id" element={<BookingConfirmationPage />} />
                       <Route path="faq" element={<StaticPage slug="faq" title="Frequently Asked Questions" />} />
                       <Route path="terms" element={<StaticPage slug="terms" title="Terms & Conditions" />} />
                       <Route path="privacy" element={<StaticPage slug="privacy" title="Privacy Policy" />} />
                       <Route path="cookies" element={<StaticPage slug="cookies" title="Cookie Policy" />} />
                       <Route path="support" element={<StaticPage slug="support" title="Support" />} />
                       <Route path="cancellation-policy" element={<StaticPage slug="cancellation" title="Cancellation Policy" />} />
                       <Route path="refund-policy" element={<StaticPage slug="refund" title="Refund Policy" />} />
                       <Route path="venue-owner-guide" element={<StaticPage slug="venue-owner-guide" title="Venue Owner Guide" />} />
                       <Route path="login" element={<LoginPage />} />
                       <Route path="register" element={<RegisterPage />} />
                       <Route path="register-venue-owner" element={<VenueOwnerRegistrationPage />} />
                       <Route path="register-venue" element={<VenueRegistrationPage />} />
            </Route>

            {/* Protected Routes */}
            <Route path="/" element={<Layout />}>
              <Route
                path="bookings"
                element={
                  <ProtectedRoute>
                    <BookingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="bookings/:id"
                element={
                  <ProtectedRoute>
                    <BookingDetailPage />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reviews"
                element={
                  <ProtectedRoute>
                    <ReviewsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="venues/create"
                element={
                  <ProtectedRoute>
                    <CreateVenuePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="venues/:id/edit"
                element={
                  <ProtectedRoute>
                    <VenueOwnerEditVenuePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="venues/manage"
                element={
                  <ProtectedRoute>
                    <VenueOwnerVenuesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="bookings/venue"
                element={
                  <ProtectedRoute>
                    <VenueOwnerBookingsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Admin Routes */}
            <Route
              path="admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="users/venue-owners" element={<VenueOwnersPage />} />
              <Route path="venues" element={<AdminVenuesPage />} />
              <Route path="venues/create" element={<CreateVenuePage />} />
              <Route path="venues/:id/edit" element={<EditVenuePage />} />
              <Route path="venues/sports" element={<AdminSportsPage />} />
              <Route path="venues/amenities" element={<AmenitiesPage />} />
              <Route path="bookings" element={<BookingsAdminPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="events/create" element={<CreateEventPage />} />
              <Route path="events/:id/edit" element={<EditEventPage />} />
              <Route path="events/bookings" element={<EventBookingsPage />} />
              <Route path="payments" element={<PaymentsAdminPage />} />
              <Route path="reviews" element={<ReviewsPage />} />
              <Route path="activity-log" element={<ActivityLogPage />} />
              <Route path="discounts" element={<DiscountsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="social-keys" element={<SocialKeysPage />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
            </AuthProvider>
          </SiteProvider>
        </ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
