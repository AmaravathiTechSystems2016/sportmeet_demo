import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { eventsAPI } from '../services/api';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { Calendar, Users, Search, Filter, Grid, List, Clock, MapPin, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

const EventsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters] = useState({
    event_type: '',
    sport_category: '',
  });
  const [viewMode, setViewMode] = useState('grid');

  const { data: eventsData, isLoading, error } = useQuery(
    ['events', searchTerm, filters],
    () => eventsAPI.getEvents({
      search: searchTerm,
      ...filters,
    }),
    { staleTime: 5 * 60 * 1000 }
  );

  const events = eventsData?.data?.results || [];
  const API_ORIGIN = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '');
  const mediaUrl = (url) => {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Sports Events</h1>
          <p className="text-lg text-gray-600">
            Join exciting sports events and tournaments in your area
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search events, sports, or locations..."
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
            <p className="text-gray-500">Failed to load events. Please try again.</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No events found
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
            {events.map((event) => (
              <Link 
                key={event.id} 
                to={`/events/${event.id}`}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
              >
                {/* Event Image with Date Badge */}
                <div className="relative h-48 overflow-hidden">
                  {event.gallery_images && event.gallery_images.length > 0 ? (
                    <img 
                      src={mediaUrl(event.gallery_images[0].image)} 
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : event.cover_image_url ? (
                    <img 
                      src={mediaUrl(event.cover_image_url)} 
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <div className="text-white text-center">
                        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-80" />
                        <span className="text-sm font-semibold">{event.sport_category}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Date Badge */}
                  <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                    {new Date(event.start_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {event.title}
                  </h3>
                  
                  {/* Host */}
                  {event.host_name && (
                    <div className="flex items-center mb-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center mr-2">
                        <Users className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className="text-gray-700 font-semibold text-sm">{event.host_name}</span>
                    </div>
                  )}

                  {/* Time */}
                  <div className="flex items-center mb-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                      <Clock className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-gray-600 text-sm">
                      {event.start_time || 'midnight'} - {event.end_time || 'midnight'}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center mb-3">
                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center mr-2">
                      <MapPin className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-gray-600 text-sm">
                      {event.venue_name}{(event.city || event.venue_city) ? `, ${event.city || event.venue_city}` : ''}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center mb-3">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center mr-2">
                      <DollarSign className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-gray-600 text-sm font-semibold">
                      {event.currency}${parseFloat(event.entry_fee || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Sport */}
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center mr-2">
                      <Users className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-gray-600 text-sm font-medium capitalize">
                      {event.sport_category}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
