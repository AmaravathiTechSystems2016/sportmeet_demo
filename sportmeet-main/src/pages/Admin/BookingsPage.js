import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { bookingsAPI } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Search,
  Eye,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const BookingsPage = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    payment_status: '',
    venue: '',
    booking_date: ''
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const { data: bookingsData, isLoading, error, refetch } = useQuery(
    ['admin-bookings', filters],
    () => bookingsAPI.getAdminBookings(filters),
    { 
      staleTime: 0,
      cacheTime: 0,
      retry: 1,
      onError: (error) => {
        console.error('Error loading bookings:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
      },
      onSuccess: (data) => {
        console.log('Bookings loaded successfully:', data);
      }
    }
  );

  const { data: statsData } = useQuery(
    'admin-booking-stats',
    () => bookingsAPI.getAdminBookingStats(),
    { staleTime: 5 * 60 * 1000 }
  );

  const bookings = bookingsData?.data?.results || bookingsData?.data || [];
  const stats = statsData?.data || {};

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
    setShowStatusModal(false);
    setNewStatus('');
  };

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await bookingsAPI.updateBookingStatus(bookingId, status);
      toast.success('Booking status updated successfully');
      queryClient.invalidateQueries(['admin-bookings']);
      queryClient.invalidateQueries('admin-booking-stats');
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const handleStatusClick = (booking) => {
    setSelectedBooking(booking);
    setNewStatus(booking.status);
    setShowStatusModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending', icon: Clock },
      confirmed: { color: 'bg-green-100 text-green-800', text: 'Confirmed', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelled', icon: XCircle },
      completed: { color: 'bg-blue-100 text-blue-800', text: 'Completed', icon: CheckCircle },
      no_show: { color: 'bg-gray-100 text-gray-800', text: 'No Show', icon: AlertCircle }
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      paid: { color: 'bg-green-100 text-green-800', text: 'Paid' },
      failed: { color: 'bg-red-100 text-red-800', text: 'Failed' },
      refunded: { color: 'bg-gray-100 text-gray-800', text: 'Refunded' },
      partially_refunded: { color: 'bg-orange-100 text-orange-800', text: 'Partially Refunded' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid Time';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load bookings</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Venue Bookings</h1>
              <p className="text-lg text-gray-600">
                Manage all venue bookings and reservations.
              </p>
            </div>
            <Button onClick={() => refetch()} className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
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
                <p className="text-2xl font-semibold text-gray-900">{stats.total_bookings || 0}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{stats.confirmed_bookings || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${stats.total_revenue ? parseFloat(stats.total_revenue).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Failed Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.failed_payments || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
                <option value="no_show">No Show</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <select
                value={filters.payment_status}
                onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Payment Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Booking Date</label>
              <input
                type="date"
                value={filters.booking_date}
                onChange={(e) => handleFilterChange('booking_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => setFilters({ search: '', status: '', payment_status: '', venue: '', booking_date: '' })}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or check back later.
            </p>
            <Button onClick={() => refetch()}>Refresh</Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Booking Info */}
                  <div className="lg:w-2/3">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {booking.venue?.name || 'Unknown Venue'}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{booking.user_name || 'Unknown User'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{formatDate(booking.booking_date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(booking.status)}
                        {getPaymentStatusBadge(booking.payment_status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{booking.number_of_players} players</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{booking.duration_hours}h duration</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>${parseFloat(booking.final_amount).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{booking.venue?.city}, {booking.venue?.state}</span>
                      </div>
                    </div>

                    {booking.special_requests && (
                      <p className="text-sm text-gray-600 mb-4">
                        <strong>Special Requests:</strong> {booking.special_requests}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="lg:w-1/3 flex flex-col space-y-2">
                    <Button
                      onClick={() => handleViewDetails(booking)}
                      variant="outline"
                      className="w-full flex items-center justify-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </Button>
                    <Button
                      onClick={() => handleStatusClick(booking)}
                      variant="outline"
                      className="w-full flex items-center justify-center space-x-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Update Status</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Booking Details Modal */}
        <Modal
          isOpen={showDetailsModal}
          onClose={handleCloseModal}
          title="Booking Details"
          size="lg"
        >
          {selectedBooking && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Booking Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Venue:</strong> {selectedBooking.venue?.name}</p>
                    <p><strong>Date:</strong> {formatDate(selectedBooking.booking_date)}</p>
                    <p><strong>Time:</strong> {formatTime(selectedBooking.start_time)} - {formatTime(selectedBooking.end_time)}</p>
                    <p><strong>Duration:</strong> {selectedBooking.duration_hours} hours</p>
                    <p><strong>Players:</strong> {selectedBooking.number_of_players}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedBooking.status)}</p>
                    <p><strong>Payment Status:</strong> {getPaymentStatusBadge(selectedBooking.payment_status)}</p>
                    {/* Courts (single or multi) */}
                    {(() => {
                      const courts = Array.isArray(selectedBooking.courts)
                        ? selectedBooking.courts
                        : (selectedBooking.booking_courts || []);
                      if (courts && courts.length > 0) {
                        return (
                          <div>
                            <p className="font-semibold text-gray-900 mt-2">Courts:</p>
                            <ul className="list-disc ml-5">
                              {courts.map((c, idx) => (
                                <li key={idx}>
                                  {(c.court?.name || c.name || `Court ${idx+1}`)}
                                  {c.start_time && c.end_time ? ` • ${formatTime(c.start_time)} - ${formatTime(c.end_time)}` : ''}
                                  {c.price_per_hour ? ` • $${parseFloat(c.price_per_hour).toFixed(2)}/hour` : ''}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      }
                      // Legacy single-court display
                      if (selectedBooking.court && (selectedBooking.court.name || selectedBooking.court_name)) {
                        return (
                          <p><strong>Court:</strong> {selectedBooking.court.name || selectedBooking.court_name}</p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Pricing</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Total Amount:</strong> ${parseFloat(selectedBooking.total_amount || 0).toFixed(2)}</p>
                    {/* Show discount if present, including code when available */}
                    {(Number(selectedBooking.discount_amount) > 0 || selectedBooking.discount_code) && (
                      <p>
                        <strong>Discount:</strong> {selectedBooking.discount_code ? `${selectedBooking.discount_code} ` : ''}
                        {Number(selectedBooking.discount_amount) > 0 ? `-$${parseFloat(selectedBooking.discount_amount).toFixed(2)}` : '$0.00'}
                      </p>
                    )}
                    <p><strong>Final Amount:</strong> ${parseFloat(selectedBooking.final_amount || selectedBooking.total_amount || 0).toFixed(2)}</p>
                    <p><strong>Currency:</strong> {selectedBooking.currency}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">User Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">Name:</span>
                    <span>{selectedBooking.user_name || `${selectedBooking.user?.first_name || ''} ${selectedBooking.user?.last_name || ''}`.trim() || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold">Email:</span>
                    <a
                      href={`mailto:${selectedBooking.contact_email || selectedBooking.user?.email || ''}`}
                      className="text-blue-600 hover:underline truncate"
                    >
                      {selectedBooking.contact_email || selectedBooking.user?.email || 'N/A'}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold">Phone:</span>
                    <a
                      href={`tel:${selectedBooking.contact_phone || selectedBooking.user?.phone_number || ''}`}
                      className="text-blue-600 hover:underline"
                    >
                      {selectedBooking.contact_phone || selectedBooking.user?.phone_number || 'N/A'}
                    </a>
                  </div>
                </div>
              </div>

              {selectedBooking.special_requests && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Special Requests</h4>
                  <p className="text-sm text-gray-600">{selectedBooking.special_requests}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button onClick={handleCloseModal} variant="outline">
                  Close
                </Button>
                <Button onClick={() => handleStatusClick(selectedBooking)}>
                  Update Status
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Status Update Modal */}
        <Modal
          isOpen={showStatusModal}
          onClose={handleCloseModal}
          title="Update Booking Status"
          size="md"
        >
          {selectedBooking && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Status: {getStatusBadge(selectedBooking.status)}
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button onClick={handleCloseModal} variant="outline">
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleStatusUpdate(selectedBooking.id, newStatus)}
                  disabled={newStatus === selectedBooking.status}
                >
                  Update Status
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default BookingsPage;
