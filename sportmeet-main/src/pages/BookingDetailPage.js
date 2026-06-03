import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { bookingsAPI, venuesAPI } from '../services/api';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { Calendar, MapPin, Clock, Users, Star } from 'lucide-react';

const BookingDetailPage = () => {
  const { id } = useParams();
  
  const { data: bookingResp, isLoading, error } = useQuery(
    ['booking', id],
    () => bookingsAPI.getBooking(id),
    { enabled: !!id }
  );
  const booking = bookingResp?.data;
  // Resolve courts similar to confirmation page
  const extractCourts = (b) => {
    if (!b) return [];
    // Preferred: booking.booking_courts exposed as `courts` with nested `court`
    if (Array.isArray(b.courts)) {
      return b.courts.map((item) => {
        if (item && typeof item === 'object') {
          if (item.court && typeof item.court === 'object') {
            return {
              id: item.court.id ?? item.court_id ?? item.id,
              name: item.court.name ?? item.name,
              sport: item.court.sport,
              price_per_duration: item.price_per_hour ?? item.court.price_per_duration,
            };
          }
          // Flat object already
          return {
            id: item.id ?? item.court_id,
            name: item.name,
            sport: item.sport,
            price_per_duration: item.price_per_duration,
          };
        }
        return item;
      });
    }
    if (Array.isArray(b.court)) return b.court;
    if (Array.isArray(b.court_names)) return b.court_names.map((name) => ({ name }));
    if (typeof b.court_name === 'string') return [{ name: b.court_name }];
    if (b.court && typeof b.court === 'object') return [b.court];
    if (typeof b.court === 'number' && b.court_name) return [{ id: b.court, name: b.court_name }];
    return [];
  };
  const getCourtIds = (b) => {
    if (!b) return [];
    if (Array.isArray(b.court_ids)) return b.court_ids;
    if (Array.isArray(b.courts) && typeof b.courts[0] === 'number') return b.courts;
    if (typeof b.courts === 'string') return b.courts.split(',').map((x)=>parseInt(x,10)).filter(Boolean);
    if (Array.isArray(b.court) && typeof b.court[0] === 'number') return b.court;
    if (typeof b.court === 'number') return [b.court];
    if (typeof b.court_id === 'number') return [b.court_id];
    return [];
  };
  const courtsInit = extractCourts(booking);
  const courtIds = getCourtIds(booking);
  const enableVenueQuery = (
    (Array.isArray(courtsInit) && courtsInit.length === 0) ||
    courtsInit.some(c => !c.name)
  ) && booking?.venue?.id;
  const { data: venueDetail } = useQuery(['booking-venue', booking?.venue?.id], () => venuesAPI.getVenue(booking.venue.id), { enabled: !!enableVenueQuery });
  const courts = (() => {
    if (!enableVenueQuery || !venueDetail?.data) return courtsInit;
    const list = Array.isArray(venueDetail.data.courts) ? venueDetail.data.courts : [];
    if (courtIds.length > 0) {
      return courtIds.map((id)=> list.find(c=>c.id===id)).filter(Boolean).map(c=>({id:c.id,name:c.name,sport:c.sport,price_per_duration:c.price_per_duration}));
    }
    return courtsInit;
  })();

  // Include sibling bookings (same payment intent) to show other courts
  const { data: siblingResp } = useQuery(['booking-siblings', booking?.payment_intent_id], () => bookingsAPI.getBookings({ payment_intent_id: booking.payment_intent_id }), { enabled: !!booking?.payment_intent_id });
  const siblingBookings = Array.isArray(siblingResp?.data?.results) ? siblingResp.data.results : Array.isArray(siblingResp?.data) ? siblingResp.data : [];
  const siblingCourts = (() => {
    const list = siblingBookings.filter(b => b.id !== booking.id).map(b => {
      if (b.court && typeof b.court === 'object') return [b.court];
      if (typeof b.court_name === 'string' && b.court_name.length > 0) {
        return [{ id: b.court_id || b.court, name: b.court_name }];
      }
      if (typeof b.court === 'number') return [{ id: b.court }];
      return [];
    });
    const flat = Array.prototype.flat ? list.flat() : [].concat.apply([], list);
    return flat || [];
  })();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">The booking you're looking for doesn't exist.</p>
          <Button variant="primary" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Booking Details</h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-600">
              <Calendar className="w-5 h-5 mr-2" />
              <span>Booking #{booking.id}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(String(booking.status))}`}>
              {String(booking.status).charAt(0).toUpperCase() + String(booking.status).slice(1)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Venue Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Venue Information</h2>
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{booking.venue.name}</h3>
                  <p className="text-gray-600 mb-2">{booking.venue.description}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-1" />
                    {booking.venue.city}, {booking.venue.state}
                  </div>
                </div>
              </div>
            </Card>

            {/* Booking Details */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <div className="flex items-center p-3 border border-gray-200 rounded-md bg-gray-50">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{new Date(booking.booking_date).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <div className="flex items-center p-3 border border-gray-200 rounded-md bg-gray-50">
                    <Clock className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{booking.start_time} - {booking.end_time}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <div className="flex items-center p-3 border border-gray-200 rounded-md bg-gray-50">
                    <Clock className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{booking.duration_hours} hours</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Players</label>
                  <div className="flex items-center p-3 border border-gray-200 rounded-md bg-gray-50">
                    <Users className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{booking.number_of_players} people</span>
                  </div>
                </div>
              </div>
              {Array.isArray(courts) && (courts.length > 0 || siblingCourts.length > 0) && (
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Courts</h3>
                  <div className="space-y-2">
                    {[...courts, ...siblingCourts].map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-gray-50">
                        <div className="flex items-center">
                          <span className="text-gray-900">{c.name || `Court ${idx+1}`}{c.sport ? ` • ${c.sport}` : ''}</span>
                        </div>
                        {c.price_per_duration && (
                          <span className="text-gray-700">${c.price_per_duration}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Special Requests */}
            {booking.special_requests && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Special Requests</h2>
                <p className="text-gray-700">{booking.special_requests}</p>
              </Card>
            )}

            {/* Contact Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-3">
                {booking.contact_phone && (
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 w-24">Phone:</span>
                    <span className="text-gray-900">{booking.contact_phone}</span>
                  </div>
                )}
                {booking.contact_email && (
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 w-24">Email:</span>
                    <span className="text-gray-900">{booking.contact_email}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Price</span>
                  <span className="text-gray-900">${booking.base_price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price per Hour</span>
                  <span className="text-gray-900">${booking.price_per_hour}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="text-gray-900">{booking.duration_hours} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${booking.total_amount}</span>
                </div>
                {booking.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${booking.discount_amount}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${booking.final_amount}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Status */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                  booking.payment_status === 'paid' 
                    ? 'text-green-600 bg-green-100'
                    : booking.payment_status === 'pending'
                    ? 'text-yellow-600 bg-yellow-100'
                    : 'text-red-600 bg-red-100'
                }`}>
                  {String(booking.payment_status).charAt(0).toUpperCase() + String(booking.payment_status).slice(1)}
                </span>
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {booking.can_cancel && (
                  <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
                    Cancel Booking
                  </Button>
                )}
                {booking.can_review && (
                  <Button variant="outline" className="w-full text-primary-600 hover:text-primary-700">
                    <Star className="w-4 h-4 mr-2" />
                    Write Review
                  </Button>
                )}
                <Button variant="outline" className="w-full" onClick={() => window.print()}>
                  Download Receipt
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailPage;
