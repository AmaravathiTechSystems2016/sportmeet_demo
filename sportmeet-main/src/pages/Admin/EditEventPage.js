import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { eventsAPI, venuesAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import MapPicker from '../../components/Map/MapPicker';
// import TextArea from '../../components/UI/TextArea';
import { 
  ArrowLeft, 
  Upload,
  X,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';

const EditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  const [selectedImages, setSelectedImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);

  const { data: eventData, isLoading: eventLoading, error: eventError } = useQuery(
    ['event', id],
    () => eventsAPI.getEvent(id),
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: sportsData } = useQuery('sports', () => venuesAPI.getSports());

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    defaultValues: {
      title: '',
      description: '',
      event_type: 'social',
      sport_category: '',
      host_name: '',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      max_participants: 20,
      min_participants: 5,
      entry_fee: 0,
      currency: 'AUD',
      venue: '',
      rules: '',
      requirements: '',
      prizes: '',
      contact_info: '',
      is_featured: false,
      is_public: true,
      is_registration_open: true,
      registration_deadline: '',
      status: 'draft'
    }
  });

  // Update form when event data loads
  useEffect(() => {
    if (eventData?.data) {
      const event = eventData.data;
      console.log('Full event data loaded:', event);
      setValue('title', event.title || '');
      setValue('description', event.description || '');
      setValue('event_type', event.event_type || 'social');
      setValue('sport_category', event.sport_category || '');
      setValue('host_name', event.host_name || '');
      setValue('start_date', event.start_date || '');
      setValue('end_date', event.end_date || '');
      setValue('start_time', event.start_time || '');
      setValue('end_time', event.end_time || '');
      setValue('max_participants', event.max_participants || 20);
      setValue('min_participants', event.min_participants || 5);
      setValue('entry_fee', event.entry_fee || 0);
      setValue('currency', event.currency || 'AUD');
      // Set location data
      setLocation({
        latitude: event.latitude || -33.8688,
        longitude: event.longitude || 151.2093,
        address: event.address || '',
        city: event.city || '',
        state: event.state || '',
        postcode: event.postcode || '',
        country: event.country || 'Australia'
      });
      setValue('venue_name', event.venue_name || '');
      setValue('address', event.address || '');
      setValue('city', event.city || '');
      setValue('state', event.state || '');
      setValue('postcode', event.postcode || '');
      setValue('country', event.country || 'Australia');
      setValue('latitude', event.latitude || '');
      setValue('longitude', event.longitude || '');
      setValue('rules', event.rules || '');
      setValue('requirements', event.requirements || '');
      setValue('prizes', event.prizes || '');
      setValue('contact_info', event.contact_info || '');
      setValue('is_featured', event.is_featured || false);
      setValue('is_public', event.is_public || true);
      setValue('is_registration_open', event.is_registration_open || true);
      setValue('status', event.status || 'draft');
      if (event.registration_deadline) {
        console.log('Original registration_deadline:', event.registration_deadline);
        let rd = event.registration_deadline;
        
        try {
          // Handle different datetime formats from backend
          if (typeof rd === 'string') {
            // If it's already in datetime-local format (YYYY-MM-DDTHH:MM), use it directly
            if (rd.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
              console.log('Already in datetime-local format:', rd);
              setValue('registration_deadline', rd);
              return;
            }
            
            // If it's in ISO format with timezone, convert to local
            if (rd.includes('T') && (rd.includes('Z') || rd.includes('+') || rd.includes('-'))) {
              const date = new Date(rd);
              if (!isNaN(date.getTime())) {
                rd = date.toISOString().substring(0, 16);
                console.log('Converted from ISO to datetime-local:', rd);
                setValue('registration_deadline', rd);
                return;
              }
            }
            
            // If it's in 'YYYY-MM-DD HH:MM:SS' format, convert to datetime-local
            if (rd.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
              rd = rd.replace(' ', 'T').substring(0, 16);
              console.log('Converted from space format to datetime-local:', rd);
              setValue('registration_deadline', rd);
              return;
            }
            
            // Try to parse as Date and convert
            const date = new Date(rd);
            if (!isNaN(date.getTime())) {
              rd = date.toISOString().substring(0, 16);
              console.log('Converted from Date object to datetime-local:', rd);
              setValue('registration_deadline', rd);
            } else {
              console.error('Could not parse date:', rd);
            }
          }
        } catch (error) {
          console.error('Error processing registration_deadline:', error, rd);
        }
      } else {
        console.log('No registration_deadline found in event data');
      }
      
      // Load existing images
      if (event.gallery_images && event.gallery_images.length > 0) {
        const existingImages = event.gallery_images.map(img => ({
          id: img.id,
          image_url: img.image,
          isNew: false
        }));
        setSelectedImages(existingImages);
      }
    }
  }, [eventData, setValue]);

  const updateEventMutation = useMutation(
    (eventData) => eventsAPI.updateEvent(id, eventData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['event', id]);
        queryClient.invalidateQueries('events');
        toast.success('Event updated successfully!');
        navigate('/admin/events');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update event');
      },
    }
  );

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      isNew: true
    }));
    setSelectedImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    const image = selectedImages[index];
    if (image.isNew) {
      URL.revokeObjectURL(image.preview);
    } else {
      setRemovedImages(prev => [...prev, image.id]);
    }
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      
      // Add basic fields
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });

      // Add location fields
      formData.append('venue_name', data.venue_name || '');
      formData.append('address', location.address || '');
      formData.append('city', location.city || '');
      formData.append('state', location.state || '');
      formData.append('postcode', location.postcode || '');
      formData.append('country', location.country || 'Australia');
      formData.append('latitude', location.latitude || '');
      formData.append('longitude', location.longitude || '');

      // Add gallery images (only new images)
      selectedImages.forEach((image, index) => {
        if (image.isNew) {
          formData.append('gallery_images', image.file);
        }
      });

      // Add removed image IDs so backend deletes them
      removedImages.forEach((id) => formData.append('removed_image_ids', id));

      await updateEventMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (eventError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load event</p>
        <Button onClick={() => navigate('/admin/events')}>Back to Events</Button>
      </div>
    );
  }

  const sports = sportsData?.data || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/events')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Events</span>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
          <p className="text-gray-600">Update event details and settings</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
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
                  Event Type *
                </label>
                <select
                  {...register('event_type', { required: 'Event type is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="social">Social</option>
                  <option value="tournament">Tournament</option>
                  <option value="training">Training</option>
                  <option value="workshop">Workshop</option>
                </select>
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
                  {sports && sports.length > 0 ? sports.map((sport) => (
                    <option key={sport.id} value={sport.name}>
                      {sport.name}
                    </option>
                  )) : (
                    <option value="" disabled>No sports available</option>
                  )}
                </select>
                {errors.sport_category && (
                  <p className="mt-1 text-sm text-red-600">{errors.sport_category.message}</p>
                )}
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

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                placeholder="Describe your event..."
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </Card>

          {/* Location Details */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Location Details</h2>
            
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

          {/* Date & Time */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Date & Time</h2>
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
                  End Date *
                </label>
                <Input
                  type="date"
                  {...register('end_date', { required: 'End date is required' })}
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Participants & Pricing</h2>
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
                  error={errors.max_participants?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Participants *
                </label>
                <Input
                  type="number"
                  {...register('min_participants', { 
                    required: 'Min participants is required',
                    min: { value: 1, message: 'Must be at least 1' }
                  })}
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
                  error={errors.entry_fee?.message}
                />
              </div>
            </div>
          </Card>

          {/* Additional Details */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Details</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rules
                </label>
                <textarea
                  {...register('rules')}
                  placeholder="Event rules and regulations..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements
                </label>
                <textarea
                  {...register('requirements')}
                  placeholder="What participants need to bring or prepare..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prizes
                </label>
                <textarea
                  {...register('prizes')}
                  placeholder="Prizes and rewards for participants..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Information
                </label>
                <textarea
                  {...register('contact_info')}
                  placeholder="Contact details for participants..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </Card>

          {/* Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Settings</h2>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Event Images</h2>
            <div className="space-y-6">
              {/* Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Images
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Click to upload images or drag and drop
                    </span>
                    <span className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB each
                    </span>
                  </label>
                </div>
              </div>

              {/* Current Images */}
              {selectedImages.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Current Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.preview || image.image_url}
                          alt={`Event ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {!image.isNew && (
                          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            Existing
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedImages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Upload className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No images uploaded yet</p>
                  <p className="text-sm">Upload images to showcase your event</p>
                </div>
              )}
            </div>
          </Card>

          {/* Submit Button */}
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
              disabled={updateEventMutation.isLoading}
              className="flex items-center space-x-2"
            >
              {updateEventMutation.isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Update Event</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventPage;
