import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from 'react-query';
import { eventsAPI, venuesAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Card from '../../components/UI/Card';
import MapPicker from '../../components/Map/MapPicker';
import {
  Save,
  ArrowLeft,
  Plus,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [eventImages, setEventImages] = useState([]);
  const [location, setLocation] = useState({
    latitude: -33.8688,
    longitude: 151.2093,
    address: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Australia'
  });

  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';

  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  const { data: sportsData, isLoading: sportsLoading } = useQuery(
    'sports',
    venuesAPI.getSports
  );

  const sports = sportsData?.data || [];

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    setEventImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setEventImages(prev => prev.filter((_, i) => i !== index));
  };

  const formatApiError = (error, fallback) => {
    const payload = error.response?.data;
    if (!payload) return fallback;
    if (typeof payload === 'string') return payload;
    if (payload.error) return payload.error;
    if (payload.detail) return payload.detail;
    const firstFieldError = Object.entries(payload)[0];
    if (firstFieldError) {
      const [field, value] = firstFieldError;
      const message = Array.isArray(value) ? value[0] : value;
      return `${field}: ${message}`;
    }
    return fallback;
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add basic event data
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          formData.append(key, data[key]);
        }
      });
      
      // Keep manually typed fields unless the map picker supplied a newer value.
      const locationPayload = {
        venue_name: data.venue_name || '',
        address: location.address || data.address || '',
        city: location.city || data.city || '',
        state: location.state || data.state || '',
        postcode: location.postcode || data.postcode || '',
        country: location.country || data.country || 'Australia',
        latitude: location.latitude || data.latitude || '',
        longitude: location.longitude || data.longitude || '',
      };

      Object.entries(locationPayload).forEach(([key, value]) => {
        formData.set(key, value);
      });
      
      // Add event images
      eventImages.forEach((file, index) => {
        formData.append('gallery_images', file);
      });
      // Default to public if not explicitly set
      if (formData.get('is_public') === null) {
        formData.append('is_public', 'true');
      }

      await eventsAPI.createEvent(formData);
      
      // Invalidate and refetch events queries
      queryClient.invalidateQueries('admin-events');
      queryClient.invalidateQueries('events');
      
      toast.success('Event created successfully!');
      navigate('/admin/events');
    } catch (error) {
      toast.error(formatApiError(error, 'Failed to create event'));
    } finally {
      setIsLoading(false);
    }
  };

  if (sportsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/events')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Events</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
              <p className="text-gray-600">Add a new event to the platform</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title *
                  </label>
                  <Input
                    {...register('title', { required: 'Event title is required' })}
                    placeholder="Enter event title"
                    error={errors.title?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Host Name
                  </label>
                  <Input
                    {...register('host_name')}
                    placeholder="Enter host/organizer name"
                    error={errors.host_name?.message}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    {...register('description', { required: 'Description is required' })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your event..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type *
                  </label>
                  <select
                    {...register('event_type', { required: 'Event type is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Event Type</option>
                    <option value="tournament">Tournament</option>
                    <option value="league">League</option>
                    <option value="friendly">Friendly Match</option>
                    <option value="training">Training Session</option>
                    <option value="social">Social Event</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.event_type && (
                    <p className="mt-1 text-sm text-red-600">{errors.event_type.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sport Category *
                  </label>
                  <select
                    {...register('sport_category', { required: 'Sport category is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Sport</option>
                    {sports.map((sport) => (
                      <option key={sport.id} value={sport.name}>
                        {sport.name}
                      </option>
                    ))}
                  </select>
                  {errors.sport_category && (
                    <p className="mt-1 text-sm text-red-600">{errors.sport_category.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Name *
                  </label>
                  <Input
                    {...register('venue_name', { required: 'Venue name is required' })}
                    placeholder="Enter venue or location name"
                    error={errors.venue_name?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    {...register('status')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Location Details */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h2>
              
              {/* Map Picker - First */}
              <div className="mb-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Location *
                  </label>
                  <MapPicker
                    accessToken={MAPBOX_TOKEN}
                    value={location}
                    onChange={(val) => {
                      const newLocation = {
                        latitude: val.latitude ?? location.latitude,
                        longitude: val.longitude ?? location.longitude,
                        address: val.address ?? location.address,
                        city: val.city ?? location.city,
                        state: val.state ?? location.state,
                        postcode: val.postcode ?? location.postcode,
                        country: val.country ?? location.country,
                      };
                      setLocation(newLocation);
                      
                      // Update form fields
                      setValue('address', newLocation.address);
                      setValue('city', newLocation.city);
                      setValue('state', newLocation.state);
                      setValue('postcode', newLocation.postcode);
                      setValue('country', newLocation.country);
                      setValue('latitude', newLocation.latitude);
                      setValue('longitude', newLocation.longitude);
                    }}
                    height="280px"
                  />
                  <p className="text-xs text-gray-500 mt-2">Search or click on the map to set event location. This will auto-fill the location details below.</p>
                </div>
              </div>

              {/* Location Details - Second */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <Input
                    {...register('address', { required: 'Address is required' })}
                    placeholder="123 Main Street, City, State 12345"
                    error={errors.address?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <Input
                    {...register('city', { required: 'City is required' })}
                    placeholder="Enter city"
                    error={errors.city?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <Input
                    {...register('state', { required: 'State is required' })}
                    placeholder="Enter state"
                    error={errors.state?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code *
                  </label>
                  <Input
                    {...register('postcode', { required: 'Postal code is required' })}
                    placeholder="12345"
                    error={errors.postcode?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <Input
                    {...register('country', { required: 'Country is required' })}
                    placeholder="Australia"
                    error={errors.country?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude *
                  </label>
                  <Input
                    type="number"
                    step="any"
                    {...register('latitude', { required: 'Latitude is required' })}
                    placeholder="-33.8688"
                    error={errors.latitude?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude *
                  </label>
                  <Input
                    type="number"
                    step="any"
                    {...register('longitude', { required: 'Longitude is required' })}
                    placeholder="151.2093"
                    error={errors.longitude?.message}
                  />
                </div>
              </div>
            </Card>

            {/* Date and Time */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Date & Time</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Deadline
                  </label>
                  <Input
                    type="datetime-local"
                    {...register('registration_deadline')}
                    error={errors.registration_deadline?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <Input
                    type="date"
                    {...register('start_date', { required: 'Start date is required' })}
                    error={errors.start_date?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <Input
                    type="date"
                    {...register('end_date')}
                    error={errors.end_date?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <Input
                    type="time"
                    {...register('start_time', { required: 'Start time is required' })}
                    error={errors.start_time?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <Input
                    type="time"
                    {...register('end_time', { required: 'End time is required' })}
                    error={errors.end_time?.message}
                  />
                </div>
              </div>
            </Card>

            {/* Participants & Pricing */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Participants & Pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Participants *
                  </label>
                  <Input
                    type="number"
                    {...register('max_participants', { 
                      required: 'Max participants is required',
                      min: { value: 1, message: 'Must be at least 1' }
                    })}
                    placeholder="50"
                    error={errors.max_participants?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Participants
                  </label>
                  <Input
                    type="number"
                    {...register('min_participants', { 
                      min: { value: 1, message: 'Must be at least 1' }
                    })}
                    placeholder="1"
                    error={errors.min_participants?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entry Fee (AUD) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register('entry_fee', { 
                      required: 'Entry fee is required',
                      min: { value: 0, message: 'Must be 0 or greater' }
                    })}
                    placeholder="0.00"
                    error={errors.entry_fee?.message}
                  />
                </div>
              </div>
            </Card>

            {/* Additional Details */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rules
                  </label>
                  <textarea
                    {...register('rules')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Event rules and regulations..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requirements
                  </label>
                  <textarea
                    {...register('requirements')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Equipment, attire, or other requirements..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prizes
                  </label>
                  <textarea
                    {...register('prizes')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Prizes and awards..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Information
                  </label>
                  <textarea
                    {...register('contact_info')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contact details for participants..."
                  />
                </div>
              </div>
            </Card>

            {/* Settings */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('is_featured')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Featured Event
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('is_public')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Public Event
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('is_registration_open')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Registration is open
                  </label>
                </div>
              </div>
            </Card>

            {/* Event Images */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Images</h2>
              <div className="space-y-4">
                <div>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Plus className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">Upload event images</p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                
                {/* Display uploaded images */}
                {eventImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {eventImages.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Event ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/events')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isLoading ? 'Creating...' : 'Create Event'}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEventPage;
