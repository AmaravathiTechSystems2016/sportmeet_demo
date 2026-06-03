import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { eventsAPI } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Filter,
  Search,
  Eye,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Mail,
  CreditCard,
  Calendar as CalendarIcon
} from 'lucide-react';

const EventBookingsPage = () => {
  const [filters, setFilters] = useState({
    search: '',
    event: '',
    status: '',
    date: ''
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { data: bookingsData, isLoading, error } = useQuery(
    ['event-bookings', filters],
    () => eventsAPI.getEventBookings(filters),
    { 
      staleTime: 0,
      cacheTime: 0,
      retry: 1,
      onError: (error) => {
        console.error('Error loading event bookings:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
      },
      onSuccess: (data) => {
        console.log('Event bookings loaded successfully:', data);
      }
    }
  );

  const { data: eventsData } = useQuery('events', () => eventsAPI.getEvents());

  const bookings = bookingsData?.data?.results || bookingsData?.data || [];
  const events = eventsData?.data?.results || eventsData?.data || [];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setSelectedBooking(null);
    setShowDetailsModal(false);
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      // In a real implementation, you would call an API to update the status
      console.log(`Updating booking ${bookingId} status to ${newStatus}`);
      // For now, just show an alert
      alert(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'registered':
        return 'text-blue-600 bg-blue-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'no_show':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'registered':
        return <AlertCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load event bookings</p>
        <p className="text-gray-600 mb-4">Error: {error.message}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Bookings</h1>
            <p className="text-lg text-gray-600">
              Manage all event registrations and bookings.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">{bookings.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Confirmed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {bookings.filter(b => b.status === 'confirmed').length}
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
                  ${bookings.reduce((sum, b) => sum + (parseFloat(b.event_entry_fee) || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Unique Participants</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {new Set(bookings.map(b => b.user)).size}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by participant name..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event</label>
              <select
                value={filters.event}
                onChange={(e) => handleFilterChange('event', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Events</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title || 'Untitled Event'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="registered">Registered</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => setFilters({ search: '', event: '', status: '', date: '' })}
                variant="outline"
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-600 mb-6">
                {filters.search || filters.event || filters.status || filters.date
                  ? 'No bookings match your current filters.'
                  : 'There are no event bookings yet.'
                }
              </p>
              {filters.search || filters.event || filters.status || filters.date ? (
                <Button
                  onClick={() => setFilters({ search: '', event: '', status: '', date: '' })}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              ) : null}
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.user_name || 'Unknown User'}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{booking.event_title || 'Event TBD'}</span>
                        <span className="mx-2">•</span>
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{booking.venue_name || 'Venue TBD'}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>
                          {booking.event_start_date ? new Date(booking.event_start_date).toLocaleDateString() : 'Date TBD'} • 
                          {booking.event_start_time || 'TBD'} - {booking.event_end_time || 'TBD'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          ${parseFloat(booking.event_entry_fee || 0).toFixed(2)} {booking.event_currency || 'AUD'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(booking.registration_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(booking.status)}
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <button 
                            onClick={() => handleViewDetails(booking)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium block"
                          >
                            <Eye className="w-4 h-4 inline mr-1" />
                            View Details
                          </button>
                          {booking.status === 'registered' && (
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                              className="text-green-600 hover:text-green-800 text-xs font-medium block"
                            >
                              Quick Confirm
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Booking Details Modal */}
        {showDetailsModal && selectedBooking && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCloseModal}></div>
              
              {/* Modal panel */}
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Booking Details</h3>
                    <button
                      onClick={handleCloseModal}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Participant Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        Participant Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Name</label>
                          <p className="text-sm text-gray-900">
                            {selectedBooking.user_name || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Email</label>
                          <p className="text-sm text-gray-900 flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {selectedBooking.user_email || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Event Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                        <CalendarIcon className="w-5 h-5 mr-2" />
                        Event Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Event Title</label>
                          <p className="text-sm text-gray-900">{selectedBooking.event_title || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Venue</label>
                          <p className="text-sm text-gray-900 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {selectedBooking.venue_name || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Date</label>
                          <p className="text-sm text-gray-900 flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {selectedBooking.event_start_date ? new Date(selectedBooking.event_start_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Time</label>
                          <p className="text-sm text-gray-900 flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {selectedBooking.event_start_time || 'N/A'} - {selectedBooking.event_end_time || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Entry Fee</label>
                          <p className="text-sm text-gray-900 flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            ${parseFloat(selectedBooking.event_entry_fee || 0).toFixed(2)} {selectedBooking.event_currency || 'AUD'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Organizer</label>
                          <p className="text-sm text-gray-900">{selectedBooking.organizer_name || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Booking Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                        <CreditCard className="w-5 h-5 mr-2" />
                        Booking Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Registration Date</label>
                          <p className="text-sm text-gray-900">
                            {new Date(selectedBooking.registration_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Status</label>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(selectedBooking.status)}
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedBooking.status)}`}>
                              {selectedBooking.status}
                            </span>
                          </div>
                          <div className="mt-2 flex space-x-2">
                            {selectedBooking.status !== 'confirmed' && (
                              <button
                                onClick={() => handleStatusUpdate(selectedBooking.id, 'confirmed')}
                                className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                              >
                                Confirm
                              </button>
                            )}
                            {selectedBooking.status !== 'cancelled' && (
                              <button
                                onClick={() => handleStatusUpdate(selectedBooking.id, 'cancelled')}
                                className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Payment Status</label>
                          <p className="text-sm text-gray-900">
                            {selectedBooking.payment_status || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Special Requests</label>
                          <p className="text-sm text-gray-900">
                            {selectedBooking.special_requests || 'None'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button
                    onClick={handleCloseModal}
                    className="w-full sm:w-auto"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventBookingsPage;
