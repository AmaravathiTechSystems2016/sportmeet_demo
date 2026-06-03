import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { venuesAPI } from '../services/api';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ReviewForm from '../components/ReviewForm';
import ReviewList from '../components/ReviewList';
import ImageSlider from '../components/ImageSlider';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Star, Clock, Users, Phone, Mail, Globe, DollarSign, MessageSquare, Share2 } from 'lucide-react';
import mapboxgl from 'mapbox-gl';

const VenueDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';
  
  const { data: venue, isLoading, error } = useQuery(
    ['venue', id],
    () => venuesAPI.getVenue(id),
    { enabled: !!id }
  );

  // Initialize map when venue data is loaded
  useEffect(() => {
    if (MAPBOX_TOKEN && venue && mapRef.current && !mapInstanceRef.current) {
      const { latitude, longitude } = venue;

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

        // Cleanup
        return () => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          }
        };
      }
    }
  }, [venue, MAPBOX_TOKEN]);

  const handleViewOnMap = () => {
    if (venue?.latitude && venue?.longitude) {
      const url = `https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`;
      window.open(url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Venue Not Found</h2>
          <p className="text-gray-600 mb-6">The venue you're looking for doesn't exist.</p>
          <Button variant="primary" onClick={() => window.history.back()}>
            Go Back
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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{venue.name}</h1>
              <div className="flex items-center text-gray-600">
                <MapPin className="w-5 h-5 mr-2" />
                <span>{venue.full_address}</span>
              </div>
            </div>
            <div className="ml-4">
              <Button
                variant="outline"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: venue.name,
                      text: venue.description,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    // eslint-disable-next-line no-alert
                    alert('Venue link copied to clipboard!');
                  }
                }}
                className="flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Images */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Photos</h2>
              <ImageSlider 
                images={venue.gallery_images || []} 
                className="w-full"
              />
            </Card>

            {/* Description */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
              <p className="text-gray-700 leading-relaxed">{venue.description}</p>
            </Card>

          {/* Map Card - moved to left column */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
            <div
              ref={mapRef}
              className="h-64 bg-gray-200 rounded-lg"
              style={{ minHeight: '256px' }}
            >
              {(!MAPBOX_TOKEN || !venue?.latitude) && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">{MAPBOX_TOKEN ? 'Map View' : 'Map unavailable until Mapbox is configured'}</p>
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={handleViewOnMap}
              disabled={!venue?.latitude}
            >
              <MapPin className="w-4 h-4 mr-2" />
              View on Map
            </Button>
          </Card>

            {/* Courts */}
            {venue.courts?.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Courts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {venue.courts.map((court, index) => (
                    <div key={court.id || index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{court.name}</h3>
                        <span className="text-sm text-gray-500">{court.sport}</span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          <span>Max {court.max_players} players</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{court.booking_duration_minutes} min slots</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2" />
                          <span>${court.price_per_duration} per slot</span>
                        </div>
                        {court.surface_type && (
                          <div className="text-xs text-gray-500">
                            Surface: {court.surface_type}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Amenities */}
            {(() => {
              // Handle different data types for amenities
              let amenitiesArray = [];
              if (Array.isArray(venue.amenities)) {
                amenitiesArray = venue.amenities;
              } else if (typeof venue.amenities === 'string') {
                try {
                  amenitiesArray = JSON.parse(venue.amenities);
                } catch (e) {
                  amenitiesArray = [venue.amenities];
                }
              }
              return amenitiesArray && amenitiesArray.length > 0;
            })() && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(() => {
                    let amenitiesArray = [];
                    if (Array.isArray(venue.amenities)) {
                      amenitiesArray = venue.amenities;
                    } else if (typeof venue.amenities === 'string') {
                      try {
                        amenitiesArray = JSON.parse(venue.amenities);
                      } catch (e) {
                        amenitiesArray = [venue.amenities];
                      }
                    }
                    return amenitiesArray.map((amenity, index) => (
                      <div key={index} className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                        <span>{amenity}</span>
                      </div>
                    ));
                  })()}
                </div>
              </Card>
            )}

            {/* Rules */}
            {venue.rules && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Rules & Guidelines</h2>
                <p className="text-gray-700 leading-relaxed">{venue.rules}</p>
              </Card>
            )}

            {/* Reviews Section */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Reviews
                </h2>
                <Button
                  variant="outline"
                  onClick={() => (user ? setShowReviewForm(true) : (window.location.href = '/login'))}
                  className="flex items-center"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Write a Review
                </Button>
              </div>

              {showReviewForm && (
                <div className="mb-6">
                  <ReviewForm
                    venueId={venue.id}
                    onClose={() => setShowReviewForm(false)}
                    onSuccess={() => setShowReviewForm(false)}
                  />
                </div>
              )}

              <ReviewList venueId={venue.id} />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {venue.min_price ? `$${venue.min_price}/slot` : 'Pricing by court'}
                </div>
                <div className="text-gray-600">Starting price</div>
              </div>
              
              <div className="space-y-4">
                <Link to={`/venues/${venue.id}/book`}>
                  <Button variant="primary" className="w-full" size="lg">
                    Book Now
                  </Button>
                </Link>
                <Button variant="outline" className="w-full">
                  Check Availability
                </Button>
              </div>
            </Card>

            {/* Venue Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Venue Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Capacity</div>
                    <div className="font-medium text-gray-900">{venue.capacity} people</div>
                  </div>
                </div>

                <div className="flex items-center">
                  <Star className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Rating</div>
                    <div className="font-medium text-gray-900">
                      {venue.average_rating ? `${venue.average_rating}/5` : 'No ratings yet'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Sports</div>
                    <div className="font-medium text-gray-900">
                      {venue.sport_categories?.join(', ') || 'Various sports'}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Contact Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              
              <div className="space-y-3">
                {venue.phone_number && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-700">{venue.phone_number}</span>
                  </div>
                )}
                
                {venue.email && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-700">{venue.email}</span>
                  </div>
                )}
                
                {venue.website && (
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 text-gray-400 mr-3" />
                    <a 
                      href={venue.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </Card>

          
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDetailPage;
