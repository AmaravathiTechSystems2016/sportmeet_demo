import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { bookingsAPI, paymentsAPI, venuesAPI } from '../services/api';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import PaymentModal from '../components/Payment/PaymentModal';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Building,
  CreditCard,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

const BookingConfirmationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const guestState = location.state && location.state.isGuest ? location.state : null;
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [, setBookingConfirmed] = useState(false);

  // Fetch booking details
  const { data: bookingResp, isLoading, error } = useQuery(
    ['booking', id],
    () => bookingsAPI.getBooking(id),
    { enabled: !!id && !guestState }
  );
  const booking = guestState?.booking || bookingResp?.data;

  // Normalize courts from booking payload (supports multiple possible shapes)
  const extractCourts = (b) => {
    if (!b) return [];
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
    if (Array.isArray(b.court)) return b.court;   // alternative key
    if (Array.isArray(b.court_names)) return b.court_names.map((name) => ({ name }));
    if (typeof b.court_name === 'string') return [{ name: b.court_name }];
    if (b.court && typeof b.court === 'object') return [b.court];
    if (typeof b.court === 'number' && b.court_name) return [{ id: b.court, name: b.court_name }];
    return [];
  };
  // Get court ids from various shapes
  const getCourtIds = (b) => {
    if (!b) return [];
    if (Array.isArray(b.court_ids)) return b.court_ids;
    if (Array.isArray(b.courts) && b.courts.length && typeof b.courts[0] === 'number') return b.courts;
    if (typeof b.courts === 'string') return b.courts.split(',').map((x) => parseInt(x, 10)).filter(Boolean);
    if (Array.isArray(b.court) && typeof b.court[0] === 'number') return b.court;
    if (typeof b.court === 'number') return [b.court];
    if (typeof b.court_id === 'number') return [b.court_id];
    return [];
  };
  const courts = extractCourts(booking);

  // If courts array lacks names, try to resolve via venue details using court ids
  const needsResolve = Array.isArray(courts) && courts.length === 0;
  const courtIds = getCourtIds(booking);
  const enableVenueQuery = (needsResolve || (Array.isArray(courts) && courts.some(c => !c.name))) && booking?.venue?.id;
  const { data: venueDetail } = useQuery(
    ['confirmation-venue', booking?.venue?.id],
    () => venuesAPI.getVenue(booking.venue.id),
    { enabled: !!enableVenueQuery }
  );
  const resolvedCourts = (() => {
    if (!enableVenueQuery || !venueDetail?.data) return courts;
    const venue = venueDetail.data;
    const list = Array.isArray(venue.courts) ? venue.courts : [];
    if (courtIds.length > 0) {
      return courtIds
        .map((id) => list.find((c) => c.id === id))
        .filter(Boolean)
        .map((c) => ({ id: c.id, name: c.name, sport: c.sport, price_per_duration: c.price_per_duration }));
    }
    // If we had anonymous court objects, enrich them by name match when possible
    if (Array.isArray(courts) && courts.length > 0) {
      return courts.map((c) => {
        if (c.name) return c;
        const match = list.find((x) => x.id === c.id);
        return match ? { id: match.id, name: match.name, sport: match.sport, price_per_duration: match.price_per_duration } : c;
      });
    }
    return courts;
  })();

  // Group other bookings created by the same payment intent so we can list all courts
  const { data: siblingResp } = useQuery(
    ['booking-siblings', booking?.payment_intent_id],
    () => bookingsAPI.getBookings({ payment_intent_id: booking.payment_intent_id }),
    { enabled: !!booking?.payment_intent_id }
  );
  const siblingBookings = Array.isArray(siblingResp?.data?.results)
    ? siblingResp.data.results
    : Array.isArray(siblingResp?.data)
    ? siblingResp.data
    : [];
  const siblingCourts = (() => {
    const list = siblingBookings.filter((b) => b.id !== booking.id).map((b) => {
      // Prefer full court object if present
      if (b.court && typeof b.court === 'object') return [b.court];
      // If only name/id fields exist from list serializer
      if (typeof b.court_name === 'string' && b.court_name.length > 0) {
        return [{ id: b.court_id || b.court, name: b.court_name }];
      }
      // If numeric id only
      if (typeof b.court === 'number') return [{ id: b.court }];
      return [];
    });
    const flat = Array.prototype.flat ? list.flat() : [].concat.apply([], list);
    return flat || [];
  })();

  // Aggregate payment and booking data across the payment group
  const groupBookings = [
    booking,
    ...siblingBookings.filter((b) => b.id !== booking.id)
  ];
  const hasGroup = groupBookings.length > 1;
  const sumField = (fieldA, fallbackField) =>
    groupBookings.reduce((acc, b) => {
      const val = Number(b?.[fieldA] ?? b?.[fallbackField] ?? 0);
      return acc + (Number.isFinite(val) ? val : 0);
    }, 0);
  const groupSubtotal = sumField('total_amount', 'base_price');
  const groupFinal = sumField('final_amount', 'total_amount');
  const groupDiscount = sumField('discount_amount', null);

  // Payment confirmation mutation
  const confirmPaymentMutation = useMutation(
    (paymentData) => paymentsAPI.confirmPayment(paymentData),
    {
      onSuccess: () => {
        setBookingConfirmed(true);
        toast.success('Booking confirmed and payment successful!');
        setShowPaymentModal(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Payment confirmation failed');
      }
    }
  );

  const handlePaymentSuccess = (paymentIntent) => {
    confirmPaymentMutation.mutate({
      payment_intent_id: paymentIntent.id,
      booking_id: id
    });
  };

  const handlePayNow = () => {
    setShowPaymentModal(true);
  };

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
          <Button variant="primary" onClick={() => navigate('/venues')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Venues
          </Button>
        </div>
      </div>
    );
  }

  const isPaid = booking.payment_status === 'paid';
  const isConfirmed = booking.status === 'confirmed';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          {guestState ? (
            <Button
              variant="ghost"
              onClick={() => navigate('/venues')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit Guest Mode
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => navigate('/bookings')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Bookings
            </Button>
          )}
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isConfirmed ? 'Booking Confirmed' : 'Complete Your Booking'}
          </h1>
          <p className="text-lg text-gray-600">
            {isConfirmed 
              ? 'Your booking has been confirmed and payment processed successfully.'
              : 'Please complete your payment to confirm your booking.'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Venue Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Venue Information</h2>
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {booking.venue.name}
                  </h3>
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
                    <span className="text-gray-900">
                      {new Date(booking.booking_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <div className="flex items-center p-3 border border-gray-200 rounded-md bg-gray-50">
                    <Clock className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">
                      {booking.start_time} - {booking.end_time}
                    </span>
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
              {/* Court details for multi-court bookings */}
              {Array.isArray(resolvedCourts) && (resolvedCourts.length > 0 || siblingCourts.length > 0) ? (
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Courts</h3>
                  <div className="space-y-2">
                    {[...resolvedCourts, ...siblingCourts].map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-gray-50">
                        <div className="flex items-center">
                          <Building className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-900">{c.name || `Court ${idx+1}`}{c.sport ? ` • ${c.sport}` : ''}</span>
                        </div>
                        {c.price_per_duration && (
                          <span className="text-gray-700">${c.price_per_duration} × {booking.slot_count || 1}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : booking.court ? (
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Court</h3>
                  <div className="flex items-center p-3 border border-gray-200 rounded-md bg-gray-50">
                    <Building className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{booking.court.name || 'Court'}</span>
                  </div>
                </div>
              ) : null}
            </Card>

            {/* Special Requests */}
            {booking.special_requests && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Special Requests</h2>
                <p className="text-gray-700">{booking.special_requests}</p>
              </Card>
            )}
          </div>

          {/* Payment Summary */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items</span>
                  <span className="text-gray-900">{hasGroup ? `${groupBookings.length} bookings` : '1 booking'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${hasGroup ? groupSubtotal : booking.total_amount}</span>
                </div>
                {(hasGroup ? groupDiscount : booking.discount_amount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${hasGroup ? groupDiscount : booking.discount_amount}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${hasGroup ? groupFinal : booking.final_amount}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Status */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                    booking.payment_status === 'paid' 
                      ? 'text-green-600 bg-green-100'
                      : 'text-yellow-600 bg-yellow-100'
                  }`}>
                    {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                  </span>
                </div>

                {isConfirmed ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">Booking Confirmed</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Complete your payment to confirm your booking.
                    </p>
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={handlePayNow}
                      disabled={isPaid}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {isPaid ? 'Payment Completed' : `Pay $${booking.final_amount} AUD`}
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Actions */}
            {isConfirmed && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
                <div className="space-y-3">
                  {guestState ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate('/venues')}
                    >
                      Exit Guest Mode
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(`/bookings/${booking.id}`)}
                      >
                        View Booking Details
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/venues')}
                      >
                        Browse More Venues
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={booking.final_amount}
          currency="AUD"
          bookingId={booking.id}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
