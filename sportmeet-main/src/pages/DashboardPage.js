import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { bookingsAPI, reportsAPI, venuesAPI } from '../services/api';
import VenueOwnerDashboard from './VenueOwnerDashboard';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import EmptyState from '../components/UI/EmptyState';
import {
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Star,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';

const API_ORIGIN = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '');
const fallbackVenueImage = `${API_ORIGIN}/media/demo/generated-venue.png`;

const mediaUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
};

const DashboardPage = () => {
  const { user } = useAuth();

  if (user?.user_type === 'venue_owner') {
    return <VenueOwnerDashboard />;
  }

  return <PlayerDashboard />;
};

const PlayerDashboard = () => {
  const { user } = useAuth();
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

  const displayName = user?.first_name || user?.username || 'Player';
  const upcomingBooking = bookingResults.find((booking) => (
    ['pending', 'confirmed'].includes(booking.status) &&
    new Date(`${booking.booking_date}T${booking.start_time || '00:00'}`) >= new Date()
  ));

  const statCards = [
    { label: 'Total Bookings', value: dashboardStats.total_bookings || 0, icon: Calendar },
    { label: 'Venues Visited', value: dashboardStats.total_venues || dashboardStats.venues_visited || 0, icon: MapPin },
    { label: 'Events Joined', value: dashboardStats.total_events || dashboardStats.events_joined || 0, icon: Users },
    { label: 'Total Spent', value: `$${dashboardStats.total_revenue || dashboardStats.total_spent || 0}`, icon: TrendingUp },
  ];

  const quickActions = [
    { title: 'Book a Venue', description: 'Find courts by sport, city, date, and time.', icon: MapPin, href: '/venues' },
    { title: 'Join an Event', description: 'Register for tournaments and local games.', icon: Trophy, href: '/events' },
    { title: 'Manage Bookings', description: 'Review upcoming and previous bookings.', icon: Clock, href: '/bookings' },
  ];

  return (
    <div className="min-h-screen bg-[#F7FAF8]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 overflow-hidden rounded-3xl bg-slate-950 text-white">
          <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-lime-200">
                <Star className="h-4 w-4" />
                Player dashboard
              </p>
              <h1 className="text-3xl font-extrabold md:text-4xl">Welcome back, {displayName}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Track your bookings, find your next venue, and keep local sports activity in one clear place.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/venues" className="btn btn-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Book a Venue
                </Link>
                <Link to="/events" className="btn btn-on-dark">
                  Explore Events
                </Link>
              </div>
            </div>

            {upcomingBooking ? (
              <div className="rounded-2xl bg-white p-5 text-slate-950">
                <p className="text-sm font-bold uppercase tracking-wide text-primary-700">Next booking</p>
                <h2 className="mt-2 text-xl font-extrabold">{upcomingBooking.venue?.name || 'Venue booking'}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {new Date(upcomingBooking.booking_date).toLocaleDateString()} at {(upcomingBooking.start_time || '').slice(0, 5)}
                </p>
                <Link to={`/bookings/${upcomingBooking.id}`} className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold text-primary-700">
                  View Booking
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-5 text-slate-950">
                <p className="text-sm font-bold uppercase tracking-wide text-primary-700">Ready to play?</p>
                <h2 className="mt-2 text-xl font-extrabold">No upcoming booking yet</h2>
                <p className="mt-2 text-sm text-slate-600">Find a nearby court or join a local event to get started.</p>
              </div>
            )}
          </div>
        </section>

        <div className="mb-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                    <p className="mt-1 text-2xl font-black text-slate-950">
                      {statsLoading ? <LoadingSpinner size="sm" /> : stat.value}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
          <aside className="space-y-6">
            <Card className="p-5">
              <h2 className="text-lg font-extrabold text-slate-950">Quick Actions</h2>
              <div className="mt-4 space-y-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.title} to={action.href} className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-primary-200 hover:bg-primary-50">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-950">{action.title}</h3>
                        <p className="text-sm text-slate-600">{action.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>
          </aside>

          <section className="space-y-6">
            <Card className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-primary-700">Activity</p>
                  <h2 className="mt-1 text-xl font-extrabold text-slate-950">Recent Bookings</h2>
                </div>
                <Link to="/bookings" className="text-sm font-extrabold text-primary-700">View All</Link>
              </div>

              {bookingsLoading ? (
                <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div>
              ) : bookingResults.length > 0 ? (
                <div className="space-y-3">
                  {bookingResults.slice(0, 5).map((booking) => <BookingRow key={booking.id} booking={booking} />)}
                </div>
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="No recent bookings"
                  description="Start by booking a nearby venue or joining a local sports event."
                  action={<Link to="/venues" className="btn btn-primary"><Plus className="mr-2 h-4 w-4" />Book a Venue</Link>}
                />
              )}
            </Card>

            {venueResults.length > 0 && (
              <Card className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-primary-700">Recommended</p>
                    <h2 className="mt-1 text-xl font-extrabold text-slate-950">Venues to Try</h2>
                  </div>
                  <Link to="/venues" className="text-sm font-extrabold text-primary-700">Browse Venues</Link>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {venueResults.slice(0, 3).map((venue) => (
                    <Link key={venue.id} to={`/venues/${venue.id}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg">
                      <div className="aspect-[4/3]">
                        <img src={mediaUrl(venue.cover_image_url) || fallbackVenueImage} alt={venue.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="p-4">
                        <h3 className="truncate font-extrabold text-slate-950">{venue.name}</h3>
                        <p className="mt-1 text-sm text-slate-600">{venue.city || 'Local venue'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

const BookingRow = ({ booking }) => (
  <Link to={`/bookings/${booking.id}`} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-primary-200 hover:bg-primary-50 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
        <MapPin className="h-6 w-6" />
      </div>
      <div>
        <h3 className="font-extrabold text-slate-950">{booking.venue?.name || 'Venue booking'}</h3>
        <p className="text-sm text-slate-600">
          {new Date(booking.booking_date).toLocaleDateString()} - {(booking.start_time || '').slice(0, 5)}
        </p>
      </div>
    </div>
    <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
      <p className="font-extrabold text-slate-950">${booking.final_amount || booking.total_amount || 0}</p>
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
        booking.status === 'confirmed'
          ? 'bg-primary-50 text-primary-700'
          : booking.status === 'pending'
          ? 'bg-amber-50 text-amber-700'
          : 'bg-slate-100 text-slate-700'
      }`}>
        {booking.status || 'booking'}
      </span>
    </div>
  </Link>
);

export default DashboardPage;
