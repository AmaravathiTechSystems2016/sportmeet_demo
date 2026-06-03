import React from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { bookingsAPI, reportsAPI, venuesAPI } from '../services/api';
import VenueOwnerDashboard from './VenueOwnerDashboard';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { 
  Calendar, 
  MapPin, 
  Users, 
  TrendingUp, 
  Clock,
  Plus
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  
  // Show venue owner dashboard for venue owners
  if (user?.user_type === 'venue_owner') {
    return <VenueOwnerDashboard />;
  }

  // Player dashboard - all hooks must be called unconditionally
  return <PlayerDashboard />;
};

const PlayerDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useQuery(
    'user-dashboard-stats',
    () => reportsAPI.getDashboardStats(),
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: recentBookings, isLoading: bookingsLoading } = useQuery(
    'recent-bookings',
    () => bookingsAPI.getUserBookings({ limit: 5 }),
    { staleTime: 2 * 60 * 1000 }
  );

  const { data: recommendedVenues } = useQuery(
    'dashboard-recommended-venues',
    () => venuesAPI.getVenues({ status: 'approved', limit: 3 }),
    { staleTime: 5 * 60 * 1000 }
  );

  const dashboardStats = stats?.data || {};
  const bookingResults = Array.isArray(recentBookings?.data?.results)
    ? recentBookings.data.results
    : Array.isArray(recentBookings?.data)
    ? recentBookings.data
    : [];
  const venueResults = Array.isArray(recommendedVenues?.data?.results)
    ? recommendedVenues.data.results
    : Array.isArray(recommendedVenues?.data)
    ? recommendedVenues.data
    : [];
  const upcomingBooking = bookingResults.find((booking) => (
    ['pending', 'confirmed'].includes(booking.status) &&
    new Date(`${booking.booking_date}T${booking.start_time || '00:00'}`) >= new Date()
  ));

  const quickActions = [
    {
      title: 'Book a Venue',
      description: 'Find and book sports venues',
      icon: MapPin,
      href: '/venues',
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Join an Event',
      description: 'Discover sports events',
      icon: Calendar,
      href: '/events',
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-50',
    },
    {
      title: 'View Bookings',
      description: 'Manage your bookings',
      icon: Clock,
      href: '/bookings',
      color: 'text-accent-600',
      bgColor: 'bg-accent-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>
          <p className="text-lg text-gray-600">
            Welcome back! Here's what's happening with your sports activities.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statsLoading ? <LoadingSpinner size="sm" /> : dashboardStats.total_bookings || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPin className="h-8 w-8 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Venues Visited</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statsLoading ? <LoadingSpinner size="sm" /> : dashboardStats.total_venues || dashboardStats.venues_visited || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-accent-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Events Joined</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statsLoading ? <LoadingSpinner size="sm" /> : dashboardStats.total_events || dashboardStats.events_joined || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Spent</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statsLoading ? <LoadingSpinner size="sm" /> : `$${dashboardStats.total_revenue || dashboardStats.total_spent || 0}`}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => window.location.href = action.href}
                      className="w-full flex items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    >
                      <div className={`w-10 h-10 ${action.bgColor} rounded-lg flex items-center justify-center mr-4`}>
                        <Icon className={`w-5 h-5 ${action.color}`} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">{action.title}</h4>
                        <p className="text-sm text-gray-500">{action.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Recent Bookings */}
          <div className="lg:col-span-2">
            {upcomingBooking && (
              <Card className="mb-6 border-primary-100 bg-primary-50 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary-700">Next booking</p>
                    <h3 className="mt-1 text-xl font-bold text-gray-950">{upcomingBooking.venue?.name || 'Venue booking'}</h3>
                    <p className="mt-1 text-sm text-gray-700">
                      {new Date(upcomingBooking.booking_date).toLocaleDateString()} at {(upcomingBooking.start_time || '').slice(0, 5)}
                    </p>
                  </div>
                  <Button variant="primary" onClick={() => window.location.href = `/bookings/${upcomingBooking.id}`}>
                    View Booking
                  </Button>
                </div>
              </Card>
            )}

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Recent Bookings</h3>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/bookings'}>
                  View All
                </Button>
              </div>
              
              {bookingsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : bookingResults.length > 0 ? (
                <div className="space-y-4">
                  {bookingResults.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                          <MapPin className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{booking.venue?.name || 'Venue booking'}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(booking.booking_date).toLocaleDateString()} - {(booking.start_time || '').slice(0, 5)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${booking.final_amount}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'confirmed' 
                            ? 'text-green-600 bg-green-100'
                            : booking.status === 'pending'
                            ? 'text-yellow-600 bg-yellow-100'
                            : 'text-gray-600 bg-gray-100'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="font-medium text-gray-900 mb-2">No recent bookings</h4>
                  <p className="text-gray-500 mb-4">Start by booking your first venue!</p>
                  {venueResults.length > 0 && (
                    <div className="mb-5 grid gap-3 text-left sm:grid-cols-3">
                      {venueResults.slice(0, 3).map((venue) => (
                        <button
                          key={venue.id}
                          type="button"
                          onClick={() => window.location.href = `/venues/${venue.id}`}
                          className="rounded-lg border border-gray-200 bg-white p-3 hover:border-primary-300 hover:bg-primary-50"
                        >
                          <p className="font-medium text-gray-900">{venue.name}</p>
                          <p className="mt-1 text-sm text-gray-500">{venue.city || 'Local venue'}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  <Button variant="primary" onClick={() => window.location.href = '/venues'}>
                    <Plus className="w-4 h-4 mr-2" />
                    Book a Venue
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
