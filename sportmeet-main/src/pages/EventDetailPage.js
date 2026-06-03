import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { eventsAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import EventBookingModal from '../components/EventBookingModal';
import mapboxgl from 'mapbox-gl';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Clock,
  ArrowLeft,
  User,
  CheckCircle,
  AlertCircle,
  Share2
} from 'lucide-react';
import toast from 'react-hot-toast';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const queryClient = useQueryClient();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';
  const API_ORIGIN = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '');
  const mediaUrl = (url) => {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const { data: eventData, isLoading, error } = useQuery(
    ['event', id],
    () => eventsAPI.getEvent(id),
    { staleTime: 5 * 60 * 1000 }
  );

  const registerEventMutation = useMutation(
    (registrationData) => eventsAPI.registerEvent(id, registrationData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['event', id]);
        toast.success('Successfully registered for the event!');
        setShowBookingModal(false);
        // Navigate to event booking confirmation page with event and participant info
        try {
          // The mutation response is available via onSuccess second arg, but react-query's mutate doesn't expose here.
          // We'll refetch the event and pass minimal details via state.
          navigate('/event-booking-confirmation', {
            state: {
              event: {
                id: event?.id,
                title: event?.title,
                start_date: event?.start_date,
                start_time: event?.start_time,
                venue_name: event?.venue_name,
                entry_fee: event?.entry_fee,
                currency: event?.currency,
              }
            }
          });
        } catch (e) {
          // Fallback: stay on page
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to register for event');
      },
    }
  );

  const event = eventData?.data;

  // Initialize map when event data is loaded
  useEffect(() => {
    if (event && mapRef.current && !mapInstanceRef.current && MAPBOX_TOKEN) {
      const { latitude, longitude } = event;
      
      if (latitude && longitude) {
        mapboxgl.accessToken = MAPBOX_TOKEN;
        
        const map = new mapboxgl.Map({
          container: mapRef.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [longitude, latitude],
          zoom: 15
        });

        mapInstanceRef.current = map;

        // Add marker
        const marker = new mapboxgl.Marker({ color: '#ef4444' })
          .setLngLat([longitude, latitude])
          .addTo(map);

        markerRef.current = marker;

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Cleanup function
        return () => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          }
        };
      }
    }
  }, [event, MAPBOX_TOKEN]);

  const handleViewOnMap = () => {
    if (event?.latitude && event?.longitude) {
      const url = `https://www.google.com/maps?q=${event.latitude},${event.longitude}`;
      window.open(url, '_blank');
    }
  };

  const handleBookEvent = () => {
    if (!event) return;
    
    if (event.entry_fee > 0) {
      setShowBookingModal(true);
    } else {
      // Free event - register directly
      registerEventMutation.mutate({});
    }
  };

  const handleBookingSubmit = (bookingData) => {
    registerEventMutation.mutate(bookingData);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'text-green-600 bg-green-100';
      case 'draft':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'tournament':
        return 'text-purple-600 bg-purple-100';
      case 'league':
        return 'text-blue-600 bg-blue-100';
      case 'friendly':
        return 'text-green-600 bg-green-100';
      case 'training':
        return 'text-orange-600 bg-orange-100';
      case 'social':
        return 'text-pink-600 bg-pink-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h2>
          <p className="text-gray-600 mb-4">The event you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/events')}>
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/events')}
            className="flex items-center space-x-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Events</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            <Card className="p-0 overflow-hidden">
              <div className="h-64 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                {event.cover_image_url || event.cover_image ? (
                  <img
                    src={mediaUrl(event.cover_image_url || event.cover_image)}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-white text-center">
                    <Calendar className="w-16 h-16 mx-auto mb-4" />
                    <span className="text-lg font-semibold">Event Image</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Event Details */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
                  {event.host_name && (
                    <p className="text-blue-600 text-lg font-medium mb-3">Hosted by {event.host_name}</p>
                  )}
                  <div className="flex items-center space-x-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEventTypeColor(event.event_type)}`}>
                      {event.event_type}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: event.title,
                          text: event.description,
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success('Event link copied to clipboard!');
                      }
                    }}
                    className="flex items-center space-x-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </Button>
                </div>
              </div>

              <div className="prose max-w-none">
                <p className="text-gray-700 text-lg leading-relaxed">{event.description}</p>
              </div>
            </Card>

            {/* Additional Information */}
            {(event.rules || event.requirements || event.prizes) && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
                <div className="space-y-4">
                  {event.rules && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Rules</h3>
                      <p className="text-gray-700">{event.rules}</p>
                    </div>
                  )}
                  {event.requirements && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Requirements</h3>
                      <p className="text-gray-700">{event.requirements}</p>
                    </div>
                  )}
                  {event.prizes && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Prizes</h3>
                      <p className="text-gray-700">{event.prizes}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Info Card */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">Host</p>
                    <p className="font-medium text-gray-900">
                      {event.organizer?.first_name} {event.organizer?.last_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(event.start_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium text-gray-900">
                      {event.start_time} - {event.end_time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">
                      {event.venue_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {event.city}, {event.state}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-500">Price</p>
                    <p className="font-medium text-gray-900">
                      ${event.entry_fee} {event.currency}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500">Participants</p>
                    <p className="font-medium text-gray-900">
                      {event.participant_count || event.participants_count || 0} / {event.max_participants}
                    </p>
                  </div>
                </div>
              </div>

              {/* Registration Status */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                {event.is_registration_open ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Registration Open</span>
                    </div>
                    <Button
                      onClick={handleBookEvent}
                      disabled={registerEventMutation.isLoading}
                      className="w-full"
                    >
                      {registerEventMutation.isLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Book your slot
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Registration Closed</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Map Card */}
            <Card className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">Location</h3>
              <div 
                ref={mapRef}
                className="h-48 bg-gray-200 rounded-lg"
                style={{ minHeight: '192px' }}
              >
                {!event?.latitude && (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Map View</p>
                    </div>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={handleViewOnMap}
                disabled={!event?.latitude}
              >
                <MapPin className="w-4 h-4 mr-2" />
                View on Map
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <EventBookingModal
          event={event}
          onClose={() => setShowBookingModal(false)}
          onSubmit={handleBookingSubmit}
          isLoading={registerEventMutation.isLoading}
        />
      )}
    </div>
  );
};

export default EventDetailPage;
