import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useLocation } from 'react-router-dom';
import { venuesAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import NearbySearch from '../components/Map/NearbySearch';
import {
  MapPin,
  Search,
  Star,
  Users,
  DollarSign,
  Navigation,
  Phone,
  Mail,
  Calendar,
  Map,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

const VenueDiscoveryPage = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [userLocation, setUserLocation] = useState(null);
  const [radius, setRadius] = useState(10); // km
  const [sortBy, setSortBy] = useState('distance');
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  
  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';
  const API_ORIGIN = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '');
  const mediaUrl = (url) => {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const { data: venuesData, isLoading, error } = useQuery(
    ['venues', searchTerm, selectedSport, priceRange, userLocation, radius, sortBy],
    () => venuesAPI.getVenues({
      search: searchTerm,
      sport_category: selectedSport,
      min_price: priceRange.min || undefined,
      max_price: priceRange.max || undefined,
      latitude: userLocation?.latitude,
      longitude: userLocation?.longitude,
      radius: radius,
      sort_by: sortBy
    }),
    {
      enabled: true
    }
  );

  const { data: sportsData } = useQuery('sports', venuesAPI.getSports);

  const venues = Array.isArray(venuesData?.data)
    ? venuesData.data
    : Array.isArray(venuesData?.results)
    ? venuesData.results
    : Array.isArray(venuesData?.data?.results)
    ? venuesData.data.results
    : [];
  const sports = Array.isArray(sportsData?.data) ? sportsData.data : [];

  const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch (e) {
        return [value];
      }
    }
    return [];
  };

  useEffect(() => {
    // Parse URL parameters for search
    const urlParams = new URLSearchParams(location.search);
    const searchParam = urlParams.get('search') || urlParams.get('city');
    const sportCategoryParam = urlParams.get('sport_category') || urlParams.get('sport');
    
    if (searchParam) {
      setSearchTerm(searchParam);
    }

    // Preselect sport from URL if provided
    if (sportCategoryParam) {
      setSelectedSport(sportCategoryParam);
    }

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, [location.search]);

  const handleSearch = (e) => {
    e.preventDefault();
    // The query will automatically refetch due to React Query
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSport('');
    setPriceRange({ min: '', max: '' });
    setUserLocation(null);
    setRadius(10);
    setSortBy('distance');
    setShowLocationSearch(false);
  };

  const getDistance = (venue) => {
    if (!userLocation || !venue.latitude || !venue.longitude) return null;
    
    const R = 6371; // Earth's radius in km
    const dLat = (venue.latitude - userLocation.latitude) * Math.PI / 180;
    const dLon = (venue.longitude - userLocation.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(venue.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10;
  };

  // Hide status badge on public listing; only approved venues are fetched
  const getStatusBadge = () => null;

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
        <p className="text-red-600 mb-4">Failed to load venues</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Discover Sports Venues</h1>
            <p className="text-xl mb-8">Find the perfect venue for your favorite sports activities</p>
            
            {/* Search Form */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search venues, sports, or locations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                </div>
                <Button type="submit" className="px-8 py-3">
                  Search
                </Button>
              </div>
            </form>

            {sports.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {sports.slice(0, 8).map((sport) => (
                  <button
                    key={sport.id}
                    type="button"
                    onClick={() => setSelectedSport(sport.name)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      selectedSport === sport.name
                        ? 'border-white bg-white text-primary-700'
                        : 'border-white/40 bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {sport.icon ? `${sport.icon} ` : ''}{sport.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
              
              {/* Sport Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Sports</option>
                  {sports.map((sport) => (
                    <option key={sport.id} value={sport.name}>
                      {sport.icon} {sport.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range (AUD/hour)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Location Search */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <button
                    onClick={() => setShowLocationSearch(!showLocationSearch)}
                    className="text-primary-600 hover:text-primary-800 text-sm"
                  >
                    {showLocationSearch ? 'Hide' : 'Set Location'}
                  </button>
                </div>
                
                {userLocation ? (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-green-500 mr-2" />
                        <div className="text-sm text-green-900">
                          {userLocation.address ? (
                            <span>{userLocation.address}</span>
                          ) : (
                            <div>
                              <div>{userLocation.latitude?.toFixed(6)},</div>
                              <div>{userLocation.longitude?.toFixed(6)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setUserLocation(null)}
                        className="text-green-500 hover:text-green-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : showLocationSearch ? (
                  <NearbySearch
                    accessToken={MAPBOX_TOKEN}
                    onLocationSelect={(location) => {
                      setUserLocation(location);
                      setShowLocationSearch(false);
                    }}
                    onRadiusChange={setRadius}
                    defaultRadius={radius}
                  />
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Set location to find nearby venues</p>
                  </div>
                )}
              </div>

              {/* Radius Filter */}
              {userLocation && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Distance (km)</label>
                  <select
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value={5}>Within 5 km</option>
                    <option value={10}>Within 10 km</option>
                    <option value={25}>Within 25 km</option>
                    <option value={50}>Within 50 km</option>
                    <option value={100}>Within 100 km</option>
                  </select>
                </div>
              )}

              {/* Sort By */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="distance">Distance</option>
                  <option value="price">Price (Low to High)</option>
                  <option value="-price">Price (High to Low)</option>
                  <option value="rating">Rating</option>
                  <option value="name">Name</option>
                </select>
              </div>

              <Button
                onClick={clearFilters}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </Card>
          </div>

          {/* Venues List */}
          <div className="lg:w-3/4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {venues.length} Venues Found
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Map className="w-4 h-4" />
                <span>
                  {selectedSport
                    ? `Filtered by ${selectedSport}`
                    : userLocation
                    ? 'Showing venues near you'
                    : 'Showing all venues'}
                </span>
              </div>
            </div>

            {(searchTerm || selectedSport || priceRange.min || priceRange.max) && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                {searchTerm && (
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-700">
                    Search: {searchTerm}
                  </span>
                )}
                {selectedSport && (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-sm text-green-700">
                    Sport: {selectedSport}
                  </span>
                )}
                {(priceRange.min || priceRange.max) && (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-700">
                    Price: {priceRange.min || '0'} - {priceRange.max || 'any'}
                  </span>
                )}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Clear all
                </button>
              </div>
            )}

            {venues.length === 0 ? (
              <Card className="p-12 text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No venues found</h3>
                <p className="text-gray-600 mb-6">
                  Try another sport, remove the price filter, or search a nearby city.
                </p>
                <Button onClick={clearFilters}>
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <div className="space-y-6">
                {venues.map((venue) => {
                  const distance = getDistance(venue);
                  return (
                    <Card key={venue.id} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Venue Image */}
                        <div className="lg:w-1/3">
                          {venue.cover_image_url ? (
                            <img
                              src={mediaUrl(venue.cover_image_url)}
                              alt={venue.name}
                              className="w-full h-48 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                              <MapPin className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Venue Details */}
                        <div className="lg:w-2/3">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {venue.name}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{venue.city}, {venue.state}</span>
                                </div>
                                {distance && (
                                  <div className="flex items-center space-x-1">
                                    <Navigation className="w-4 h-4" />
                                    <span>{distance} km away</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(venue.status)}
                              {venue.is_featured && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-gray-700 mb-4 line-clamp-2">
                            {venue.description}
                          </p>

                          <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{toArray(venue.sport_categories).length || 1} sports</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4" />
                              <span>{venue.currency || 'AUD'} pricing by court</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4" />
                              <span>Rating: {venue.average_rating || 'N/A'}</span>
                            </div>
                          </div>

                          {toArray(venue.sport_categories).length > 0 && (
                            <div className="mb-4">
                              <div className="flex flex-wrap gap-2">
                                {toArray(venue.sport_categories).map((sport, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                  >
                                    {sport}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Phone className="w-4 h-4" />
                                <span>{venue.phone_number || 'Contact via booking'}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Mail className="w-4 h-4" />
                                <span>{venue.email || venue.full_address || `${venue.city}, ${venue.state}`}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Link to={`/venues/${venue.id}`}>
                                <Button className="flex items-center space-x-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>Book Now</span>
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDiscoveryPage;
