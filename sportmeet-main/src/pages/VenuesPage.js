import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { venuesAPI } from '../services/api';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { MapPin, Star, Search, Filter, Grid, List } from 'lucide-react';

const VenuesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters] = useState({
    city: '',
    sport_category: '',
    min_price: '',
    max_price: '',
  });
  const [viewMode, setViewMode] = useState('grid');

  const { data: venuesData, isLoading, error } = useQuery(
    ['venues', searchTerm, filters],
    () => venuesAPI.getVenues({
      search: searchTerm,
      ...filters,
    }),
    { staleTime: 5 * 60 * 1000 }
  );

  const venues = venuesData?.data?.results || [];
  const formatStartingPrice = (venue) => {
    const price = venue.min_price ?? venue.starting_price;
    return price ? `$${price}/slot` : 'Pricing on detail';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Sports Venues</h1>
          <p className="text-lg text-gray-600">
            Discover and book the best sports venues in your area
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search venues, sports, or locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <div className="flex border rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Failed to load venues. Please try again.</p>
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No venues found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search criteria or check back later.
            </p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {venues.map((venue) => (
              <Card key={venue.id} className="overflow-hidden hover-lift hover-glow">
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={
                      venue.cover_image_url ||
                      (venue.gallery_images && venue.gallery_images.length > 0
                        ? venue.gallery_images[0].image
                        : '/placeholder-venue.jpg')
                    }
                    alt={venue.name}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <Card.Content>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {venue.name}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {venue.description}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-1" />
                      {venue.city}, {venue.state}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
                      {venue.average_rating || 'New'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-primary-600">
                      {formatStartingPrice(venue)}
                    </span>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VenuesPage;
