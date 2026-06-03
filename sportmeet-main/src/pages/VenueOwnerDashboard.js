import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { venuesAPI, bookingsAPI, reportsAPI, reviewsAPI } from '../services/api';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { 
  Calendar, 
  Star,
  Plus,
  Building,
  DollarSign,
  Eye,
  Edit,
  Settings,
  BarChart3,
  MessageSquare
} from 'lucide-react';

const VenueOwnerDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useQuery(
    'venue-owner-dashboard-stats',
    () => reportsAPI.getDashboardStats(),
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: myVenues, isLoading: venuesLoading } = useQuery(
    'my-venues',
    () => venuesAPI.getUserVenues(),
    { staleTime: 2 * 60 * 1000 }
  );

  const { data: recentBookings, isLoading: bookingsLoading } = useQuery(
    'venue-bookings',
    () => bookingsAPI.getVenueBookings({ status: 'confirmed' }),
    { staleTime: 60 * 1000 }
  );

  const { data: venueReviews, isLoading: reviewsLoading } = useQuery(
    'venue-reviews',
    () => reviewsAPI.getReviews({ venue_owner: 'me', is_approved: undefined }),
    { staleTime: 2 * 60 * 1000 }
  );

  // Normalize responses
  const normalize = (resp) => Array.isArray(resp?.data?.results)
    ? resp.data.results
    : Array.isArray(resp?.data)
    ? resp.data
    : Array.isArray(resp?.results)
    ? resp.results
    : Array.isArray(resp)
    ? resp
    : [];

  const myVenuesArr = normalize(myVenues);
  const reviewsArr = normalize(venueReviews);
  const bookingsArr = normalize(recentBookings);

  // Owner-scoped derived stats using existing data
  const ownerVenueIds = useMemo(() => new Set(myVenuesArr.map(v => v.id)), [myVenuesArr]);
  const ownerBookings = useMemo(() => bookingsArr.filter(b => ownerVenueIds.has(b.venue?.id || b.venue_id)), [bookingsArr, ownerVenueIds]);
  const ownerTotals = useMemo(() => {
    let totalRevenue = 0;
    let totalBookings = 0;
    (ownerBookings || []).forEach(b => {
      totalBookings += 1;
      const amt = Number(b.final_amount || b.total_amount || 0);
      if (!Number.isNaN(amt)) totalRevenue += amt;
    });
    return { totalRevenue, totalBookings };
  }, [ownerBookings]);
  const averageRating = useMemo(() => {
    // If backend provides owner-scoped review stats, use them first
    const backendAvg = Number(stats?.data?.reviews?.average_rating);
    if (!Number.isNaN(backendAvg) && backendAvg > 0) {
      return backendAvg.toFixed(1);
    }
    // Prefer venue-level ratings; fallback to reviews’ overall_rating
    const venueRatings = myVenuesArr.map(v => Number(v.average_rating)).filter(n => !Number.isNaN(n) && n > 0);
    if (venueRatings.length > 0) {
      return (venueRatings.reduce((a,b)=>a+b,0) / venueRatings.length).toFixed(1);
    }
    const ratings = reviewsArr.map(r => Number(r.overall_rating)).filter(n => !Number.isNaN(n) && n > 0);
    if (ratings.length === 0) return '0.0';
    return (ratings.reduce((a,b)=>a+b,0) / ratings.length).toFixed(1);
  }, [stats, myVenuesArr, reviewsArr]);
  const trendData = useMemo(() => {
    // Group last 8 weeks by week number for a compact trend
    const weeks = new Map();
    (ownerBookings || []).forEach(b => {
      const d = new Date(b.booking_date || b.created_at || Date.now());
      const year = d.getFullYear();
      const oneJan = new Date(year, 0, 1);
      const week = Math.ceil((((d - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
      const key = `${year}-W${week}`;
      weeks.set(key, (weeks.get(key) || 0) + 1);
    });
    // Sort by key and return last 8
    const entries = Array.from(weeks.entries()).sort((a,b)=> a[0] > b[0] ? 1 : -1).slice(-8);
    return entries.map(([label, count]) => ({ label, count }));
  }, [ownerBookings]);
  const upcomingBookings = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    return (ownerBookings || [])
      .filter(b => {
        const d = new Date(b.booking_date || b.created_at || now);
        return d >= now && d <= tomorrow;
      })
      .sort((a,b)=> (a.booking_date > b.booking_date ? 1 : -1))
      .slice(0, 5);
  }, [ownerBookings]);

  const quickActions = [
    {
      title: 'Create New Venue',
      description: 'Add a new venue to your portfolio',
      icon: Plus,
      href: '/venues/create',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Manage Venues',
      description: 'View and edit your venues',
      icon: Building,
      href: '/venues/manage',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'View Bookings',
      description: 'Manage venue bookings',
      icon: Calendar,
      href: '/bookings/venue',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Analytics',
      description: 'View venue performance',
      icon: BarChart3,
      href: '/analytics',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Venue Owner Dashboard</h1>
          <p className="text-lg text-gray-600">
            Manage your venues, bookings, and grow your business.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Venues</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {venuesLoading ? <LoadingSpinner size="sm" /> : myVenuesArr.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statsLoading && venuesLoading ? <LoadingSpinner size="sm" /> : ownerTotals.totalBookings}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${statsLoading && venuesLoading ? <LoadingSpinner size="sm" /> : ownerTotals.totalRevenue.toFixed(0)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Average Rating</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {venuesLoading && reviewsLoading ? <LoadingSpinner size="sm" /> : averageRating}
                </p>
              </div>
            </div>
          </Card>

          {/* Removed My Events card as venue owners don't manage events here */}
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
                    <Link
                      key={index}
                      to={action.href}
                      className="w-full flex items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    >
                      <div className={`w-10 h-10 ${action.bgColor} rounded-lg flex items-center justify-center mr-4`}>
                        <Icon className={`w-5 h-5 ${action.color}`} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">{action.title}</h4>
                        <p className="text-sm text-gray-500">{action.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* My Venues & Trend */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">My Venues</h3>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => window.location.href = '/venues/manage'}>
                    <Eye className="w-4 h-4 mr-1" />
                    Manage
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => window.location.href = '/venues/create'}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Venue
                  </Button>
                </div>
              </div>
              {/* Mini trend */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Bookings (last 8 weeks)</span>
                  <span className="text-sm font-medium text-gray-900">{ownerTotals.totalBookings}</span>
                </div>
                <div className="h-20 flex items-end space-x-1">
                  {trendData.length === 0 ? (
                    <div className="text-gray-500 text-sm">No recent bookings</div>
                  ) : (
                    trendData.map((t, idx) => (
                      <div key={idx} className="flex-1 bg-green-500/20 rounded" style={{ height: `${Math.min(100, 8 + t.count * 12)}%` }} title={`${t.label}: ${t.count}`}>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {venuesLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : myVenuesArr.length > 0 ? (
                <div className="space-y-4">
                  {myVenuesArr.slice(0, 3).map((venue) => (
                    <div key={venue.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                          <Building className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{venue.name}</h4>
                          <p className="text-sm text-gray-500">
                            {venue.city}, {venue.state} • {venue.sport_categories?.join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">ID: {venue.venue_id}</p>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 mr-1" />
                            <span className="text-sm text-gray-500">{venue.average_rating || '0.0'}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="font-medium text-gray-900 mb-2">No venues yet</h4>
                  <p className="text-gray-500 mb-4">Start by creating your first venue!</p>
                  <Button variant="primary" onClick={() => window.location.href = '/venues/create'}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Venue
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="mt-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Upcoming (today & tomorrow)</h3>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/bookings/venue'}>
                View All
              </Button>
            </div>
            
            {bookingsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : upcomingBookings?.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                        <Calendar className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{booking.venue.name}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(booking.booking_date).toLocaleDateString()} • {booking.start_time} - {booking.end_time}
                        </p>
                        <p className="text-sm text-gray-500">
                          Customer: {booking.user?.first_name || booking.user_name || 'N/A'} {booking.user?.last_name || ''}
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
                <h4 className="font-medium text-gray-900 mb-2">No upcoming bookings</h4>
                <p className="text-gray-500 mb-4">New bookings for today or tomorrow will appear here.</p>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Events removed for venue owners */}

        {/* Recent Reviews */}
        <div className="mt-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <MessageSquare className="w-5 h-5 text-blue-600 mr-2" />
                Recent Reviews
              </h3>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/reviews?venue_owner=me&is_approved='}>
                View All Reviews
              </Button>
            </div>
            
            {reviewsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : reviewsArr.length > 0 ? (
              <div className="space-y-4">
                {reviewsArr.slice(0, 3).map((review) => (
                  <div key={review.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {review.user_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{review.user_name}</h4>
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.overall_rating 
                                      ? 'text-yellow-400 fill-current' 
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        review.is_approved 
                          ? 'text-green-800 bg-green-100' 
                          : 'text-yellow-800 bg-yellow-100'
                      }`}>
                        {review.is_approved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    
                    {review.title && (
                      <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                    )}
                    
                    <p className="text-gray-700 text-sm mb-3">{review.comment}</p>
                    
                    <div className="text-xs text-gray-500">
                      for {review.venue?.name || review.venue_name || 'Unknown Venue'}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const vid = review.venue?.id || review.venue_id || review.venue?.venue_id || '';
                          if (!vid) {
                            // Fallback to owner-wide reviews if venue id missing
                            window.location.href = '/reviews?venue_owner=me&is_approved=';
                          } else {
                            window.location.href = `/reviews?venue=${vid}`;
                          }
                        }}
                      >
                        Manage reviews for this venue
                      </Button>
                      {!review.is_approved && (
                        <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">Awaiting approval</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="font-medium text-gray-900 mb-2">No reviews yet</h4>
                <p className="text-gray-500">Reviews from customers will appear here.</p>
              </div>
            )}
          </Card>
        </div>

        {/* Additional Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

          <Card className="p-6">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-6 h-6 text-green-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
            </div>
            <p className="text-gray-600 mb-4">Track performance and optimize your venue operations.</p>
            <Button variant="outline" size="sm">
              View Analytics
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Settings className="w-6 h-6 text-purple-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Settings</h3>
            </div>
            <p className="text-gray-600 mb-4">Manage your account and venue preferences.</p>
            <Button variant="outline" size="sm">
              Open Settings
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VenueOwnerDashboard;
