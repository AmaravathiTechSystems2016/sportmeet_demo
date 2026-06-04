import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from 'react-query';
import { venuesAPI } from '../../services/api';
import { Search, Loader } from 'lucide-react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Card from '../../components/UI/Card';
import MapPicker from '../../components/Map/MapPicker';
import SearchableCheckboxList from '../../components/UI/SearchableCheckboxList';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, X, Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateVenuePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSports, setSelectedSports] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [courts, setCourts] = useState([]);
  const [venueImages, setVenueImages] = useState([]);
  const [coverImage, setCoverImage] = useState(null);
  const [selectedVenueOwner, setSelectedVenueOwner] = useState('');
  const [venueAvailability, setVenueAvailability] = useState({
    monday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
    tuesday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
    wednesday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
    thursday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
    friday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
    saturday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
    sunday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] }
  });

  const { register, handleSubmit, formState: { errors }, setValue } = useForm();
  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';
  const [location, setLocation] = useState({ latitude: null, longitude: null, address: '', city: '', state: '', postcode: '', country: 'Australia' });

  const { user } = useAuth();
  const isVenueOwner = user?.user_type === 'venue_owner';
  const venuesBackPath = isVenueOwner ? '/venues/manage' : '/admin/venues';

  const { data: sportsData, isLoading: sportsLoading } = useQuery(
    'sports',
    venuesAPI.getSports
  );

  const { data: amenitiesData, isLoading: amenitiesLoading } = useQuery(
    'amenities',
    venuesAPI.getAmenities
  );

  const [ownerSearch, setOwnerSearch] = useState('');
  const [ownerDebounced, setOwnerDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setOwnerDebounced(ownerSearch), 300);
    return () => clearTimeout(t);
  }, [ownerSearch]);
  const { data: venueOwnersData, isLoading: venueOwnersLoading } = useQuery(
    ['venue-owners', ownerDebounced],
    () => venuesAPI.getVenueOwners({ search: ownerDebounced }),
    { enabled: !(user && user.user_type === 'venue_owner') }
  );

  // Default owner to logged-in venue owner
  React.useEffect(() => {
    if (user && user.user_type === 'venue_owner') {
      setSelectedVenueOwner(user.id?.toString() || '');
    }
  }, [user]);

  const sports = useMemo(() => sportsData?.data || [], [sportsData?.data]);
  const amenities = amenitiesData?.data || [];
  const venueOwnersRaw = venueOwnersData?.data || venueOwnersData;
  const venueOwners = Array.isArray(venueOwnersRaw)
    ? venueOwnersRaw
    : (Array.isArray(venueOwnersRaw?.results) ? venueOwnersRaw.results : []);

  // Derive allowed sports list from selectedSports for court dropdowns
  const allowedSports = useMemo(() => {
    if (!Array.isArray(sports)) return [];
    const byId = new Set(selectedSports);
    return sports
      .filter((s) => byId.has(s.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sports, selectedSports]);

  // Sanitize courts' sport when selected sports change
  useEffect(() => {
    setCourts((prev) =>
      prev.map((court) =>
        allowedSports.find((s) => s.name === court.sport) ? court : { ...court, sport: '' }
      )
    );
  }, [allowedSports]);

  const handleSportToggle = (sport) => {
    setSelectedSports(prev => 
      prev.includes(sport.id) 
        ? prev.filter(id => id !== sport.id)
        : [...prev, sport.id]
    );
  };

  const handleAmenityToggle = (amenity) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity.id) 
        ? prev.filter(id => id !== amenity.id)
        : [...prev, amenity.id]
    );
  };

  const handleVenueAvailabilityChange = (day, field, value) => {
    setVenueAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleVenueWindowChange = (day, windowIndex, field, value) => {
    setVenueAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        windows: prev[day].windows.map((window, index) => 
          index === windowIndex ? { ...window, [field]: value } : window
        )
      }
    }));
  };

  const addVenueWindow = (day) => {
    setVenueAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        windows: [...prev[day].windows, { start_time: '09:00', end_time: '17:00' }]
      }
    }));
  };

  const removeVenueWindow = (day, windowIndex) => {
    setVenueAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        windows: prev[day].windows.filter((_, index) => index !== windowIndex)
      }
    }));
  };

  const addCourt = () => {
    setCourts(prev => [...prev, {
      id: Date.now(),
      name: '',
      sport: '',
      surface_type: '',
      is_indoor: false,
      max_players: 2,
      booking_duration_minutes: 60,
      price_per_duration: 50.00,
      gallery_images: [],
      availability: {
        monday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
        tuesday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
        wednesday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
        thursday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
        friday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
        saturday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
        sunday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] }
      }
    }]);
  };

  const removeCourt = (courtId) => {
    setCourts(prev => prev.filter(court => court.id !== courtId));
  };

  const updateCourt = (courtId, field, value) => {
    setCourts(prev => prev.map(court => 
      court.id === courtId ? { ...court, [field]: value } : court
    ));
  };

  const handleCourtAvailabilityChange = (courtId, day, field, value) => {
    setCourts(prev => prev.map(court => 
      court.id === courtId 
        ? {
            ...court,
            availability: {
              ...court.availability,
              [day]: {
                ...court.availability[day],
                [field]: value
              }
            }
          }
        : court
    ));
  };

  const handleCourtWindowChange = (courtId, day, windowIndex, field, value) => {
    setCourts(prev => prev.map(court => 
      court.id === courtId 
        ? {
            ...court,
            availability: {
              ...court.availability,
              [day]: {
                ...court.availability[day],
                windows: court.availability[day].windows.map((window, index) => 
                  index === windowIndex ? { ...window, [field]: value } : window
                )
              }
            }
          }
        : court
    ));
  };

  const addCourtWindow = (courtId, day) => {
    setCourts(prev => prev.map(court => 
      court.id === courtId 
        ? {
            ...court,
            availability: {
              ...court.availability,
              [day]: {
                ...court.availability[day],
                windows: [...(court.availability[day].windows || []), { start_time: '09:00', end_time: '17:00' }]
              }
            }
          }
        : court
    ));
  };

  const removeCourtWindow = (courtId, day, windowIndex) => {
    setCourts(prev => prev.map(court => 
      court.id === courtId 
        ? {
            ...court,
            availability: {
              ...court.availability,
              [day]: {
                ...court.availability[day],
                windows: court.availability[day].windows.filter((_, index) => index !== windowIndex)
              }
            }
          }
        : court
    ));
  };

  const handleVenueImageUpload = (event) => {
    const files = Array.from(event.target.files);
    setVenueImages(prev => [...prev, ...files]);
  };

  const removeVenueImage = (index) => {
    setVenueImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCourtImageUpload = (courtId, event) => {
    const files = Array.from(event.target.files);
    setCourts(prev => prev.map(court => 
      court.id === courtId 
        ? { ...court, gallery_images: [...(court.gallery_images || []), ...files] }
        : court
    ));
  };

  const removeCourtImage = (courtId, index) => {
    setCourts(prev => prev.map(court => 
      court.id === courtId 
        ? { ...court, gallery_images: court.gallery_images.filter((_, i) => i !== index) }
        : court
    ));
  };

  const onSubmit = async (data) => {
    // Validate required fields
    const requiredFields = ['name', 'email', 'phone_number', 'address', 'city', 'state', 'postcode', 'country', 'latitude', 'longitude', 'description', 'currency'];
    const missingFields = requiredFields.filter(field => !data[field] || data[field].toString().trim() === '');
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    const ownerIdToUse = isVenueOwner ? user?.id : selectedVenueOwner;

    // Validate venue owner selection
    if (!ownerIdToUse) {
      toast.error('Please select a venue owner');
      return;
    }
    
    if (selectedSports.length === 0) {
      toast.error('Please select at least one sport category');
      return;
    }
    // Courts validation: at least one valid court with positive price and duration
    const validCourts = courts.filter(c => c.name && c.sport);
    if (validCourts.length === 0) {
      toast.error('Please add at least one court (name and sport are required).');
      return;
    }
    for (let i = 0; i < validCourts.length; i += 1) {
      const c = validCourts[i];
      if (!c.booking_duration_minutes || Number.isNaN(parseInt(c.booking_duration_minutes))) {
        toast.error(`Court ${i + 1}: Please enter booking duration in minutes.`);
        return;
      }
      if (c.price_per_duration === undefined || c.price_per_duration === null || Number(c.price_per_duration) <= 0) {
        toast.error(`Court ${i + 1}: Price per Duration must be greater than 0.`);
        return;
      }
    }
    
    setIsLoading(true);
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add basic venue data
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
      
      // Add venue owner (admin can assign; venue owner defaults to self)
      if (ownerIdToUse) {
        formData.append('owner_id', ownerIdToUse);
      }
      
      // Add sport categories
      const sportCategories = selectedSports.map(id => {
        const sport = sports.find(s => s.id === id);
        return sport ? sport.name : null;
      }).filter(Boolean);
      formData.append('sport_categories', JSON.stringify(sportCategories.length > 0 ? sportCategories : []));
      
      // Add amenities
      const amenityList = selectedAmenities.map(id => {
        const amenity = amenities.find(a => a.id === id);
        return amenity ? amenity.name : null;
      }).filter(Boolean);
      formData.append('amenities', JSON.stringify(amenityList.length > 0 ? amenityList : []));
      
      // Add cover image (used on landing/cards)
      if (coverImage) {
        formData.append('cover_image', coverImage);
      }

      // Add venue images
      venueImages.forEach((file, index) => {
        formData.append('gallery_images', file);
      });
      
      // Add courts data - convert multi-window structure to individual records
      const courtsData = validCourts.map(court => {
        const availabilityRecords = [];
        if (court.availability) {
          Object.entries(court.availability).forEach(([day, schedule]) => {
            if (schedule.is_available && schedule.windows) {
              schedule.windows.forEach(window => {
                availabilityRecords.push({
                  day_of_week: day,
                  start_time: window.start_time,
                  end_time: window.end_time,
                  is_available: true
                });
              });
            }
          });
        }
        
        return {
          name: court.name,
          sport: court.sport,
          surface_type: court.surface_type || 'Hard Court',
          is_indoor: court.is_indoor,
          max_players: court.max_players,
          booking_duration_minutes: court.booking_duration_minutes,
          price_per_duration: court.price_per_duration,
          availability: availabilityRecords
        };
      });
      formData.append('courts', JSON.stringify(courtsData));
      
      // Add venue availability - convert multi-window structure to individual records
      const availabilityRecords = [];
      Object.entries(venueAvailability).forEach(([day, schedule]) => {
        if (schedule.is_available && schedule.windows) {
          schedule.windows.forEach(window => {
            availabilityRecords.push({
              day_of_week: day,
              start_time: window.start_time,
              end_time: window.end_time,
              is_available: true
            });
          });
        }
      });
      formData.append('availability', JSON.stringify(availabilityRecords));
      
      // Add court images
      courts.forEach((court, courtIndex) => {
        if (court.gallery_images && court.gallery_images.length > 0) {
          court.gallery_images.forEach((file, fileIndex) => {
            formData.append(`courts[${courtIndex}][gallery_images]`, file);
          });
        }
      });
      
      formData.append('status', 'approved');
      formData.append('is_verified', 'true');
      formData.append('is_featured', 'false');

      // Do not append raw courts again; sanitized courtsData already added above
      await venuesAPI.createVenue(formData);
      
      // Invalidate venue queries to refresh the list
      queryClient.invalidateQueries('admin-venues');
      queryClient.invalidateQueries('venues');
      
      toast.success('Venue created successfully!');
      navigate(venuesBackPath);
    } catch (error) {
      // Handle different error types
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          // Display field-specific errors
          Object.keys(errorData).forEach(field => {
            if (Array.isArray(errorData[field])) {
              toast.error(`${field}: ${errorData[field][0]}`);
            } else {
              toast.error(`${field}: ${errorData[field]}`);
            }
          });
        } else {
          toast.error(errorData || 'Validation failed');
        }
      } else {
        toast.error(error.response?.data?.error || error.message || 'Failed to create venue');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (sportsLoading || amenitiesLoading) {
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
              onClick={() => navigate(venuesBackPath)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Venues</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Venue</h1>
              <p className="text-gray-600">Add a new venue to the platform</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Fill form with test data
                setValue('name', 'Test Venue');
                setValue('email', 'test@venue.com');
                setValue('phone_number', '1234567890');
                setValue('address', '123 Test Street');
                setValue('city', 'Test City');
                setValue('state', 'Test State');
                setValue('postcode', '12345');
                setValue('country', 'Australia');
                setValue('latitude', '-37.8136');
                setValue('longitude', '144.9631');
                setValue('description', 'This is a test venue for debugging purposes.');
                setValue('currency', 'AUD');
                const firstSport = sports[0];
                setSelectedSports([firstSport?.id].filter(Boolean));
                setSelectedAmenities([amenities[0]?.id].filter(Boolean));
                setCourts([{
                  id: Date.now(),
                  name: 'Court 1',
                  sport: firstSport?.name || '',
                  surface_type: 'Hard Court',
                  is_indoor: true,
                  max_players: 4,
                  booking_duration_minutes: 60,
                  price_per_duration: 35,
                  gallery_images: [],
                  availability: {
                    monday: { is_available: true, windows: [{ start_time: '09:00', end_time: '21:00' }] },
                    tuesday: { is_available: true, windows: [{ start_time: '09:00', end_time: '21:00' }] },
                    wednesday: { is_available: true, windows: [{ start_time: '09:00', end_time: '21:00' }] },
                    thursday: { is_available: true, windows: [{ start_time: '09:00', end_time: '21:00' }] },
                    friday: { is_available: true, windows: [{ start_time: '09:00', end_time: '21:00' }] },
                    saturday: { is_available: true, windows: [{ start_time: '09:00', end_time: '21:00' }] },
                    sunday: { is_available: true, windows: [{ start_time: '09:00', end_time: '21:00' }] },
                  },
                }]);
                toast.success('Test data filled!');
              }}
            >
              Fill Test Data
            </Button>
          </div>

          {/* Error Display */}
          {Object.keys(errors).length > 0 && (
            <Card className="p-4 bg-red-50 border-red-200">
              <h3 className="text-red-800 font-medium mb-2">Please fix the following errors:</h3>
              <ul className="text-red-700 text-sm space-y-1">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>- {field}: {error.message}</li>
                ))}
              </ul>
            </Card>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Name *
                  </label>
                  <Input
                    {...register('name', { required: 'Venue name is required' })}
                    placeholder="Enter venue name"
                    error={errors.name?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    placeholder="venue@example.com"
                    error={errors.email?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <Input
                    {...register('phone_number', { required: 'Phone number is required' })}
                    placeholder="+61 123 456 789"
                    error={errors.phone_number?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <Input
                    {...register('website')}
                    placeholder="https://www.venue.com"
                    error={errors.website?.message}
                  />
                </div>
                {/* Map Picker - First */}
                <div className="md:col-span-2">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Venue Location *
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
                        setValue('latitude', newLocation.latitude);
                        setValue('longitude', newLocation.longitude);
                        setValue('address', newLocation.address);
                        setValue('city', newLocation.city);
                        setValue('state', newLocation.state);
                        setValue('postcode', newLocation.postcode);
                        setValue('country', newLocation.country);
                      }}
                      height="280px"
                    />
                    <p className="text-xs text-gray-500 mt-2">Search or click on the map to set venue location. This will auto-fill the location details below.</p>
                  </div>
                </div>

                {/* Location Details - Second */}
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
                    error={errors.postal_code?.message}
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Map Link
                  </label>
                  <Input
                    {...register('google_map_link')}
                    placeholder="https://maps.google.com/..."
                    error={errors.google_map_link?.message}
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
                    placeholder="Describe your venue..."
                    error={errors.description?.message}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                {/* Rules */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rules & Regulations
                  </label>
                  <textarea
                    {...register('rules')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter venue rules and regulations..."
                  />
                </div>

                {/* Cancellation Policy */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cancellation Policy
                  </label>
                  <textarea
                    {...register('cancellation_policy')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter cancellation policy..."
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency *
                  </label>
                  <select
                    {...register('currency', { required: 'Currency is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="AUD">AUD - Australian Dollar</option>
                  </select>
                  {errors.currency && (
                    <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>
                  )}
                </div>

                {/* Venue Owner */}
                {user && user.user_type === 'venue_owner' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Venue Owner *</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100" value={`${user.first_name} ${user.last_name}`.trim() || user.email} readOnly />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Venue Owner *</label>
                    <div className="mb-2 relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={ownerSearch}
                        onChange={(e) => setOwnerSearch(e.target.value)}
                        placeholder="Search by name, email, phone..."
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={selectedVenueOwner}
                      onChange={(e) => setSelectedVenueOwner(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={venueOwnersLoading}
                    >
                      <option value="">Select a venue owner</option>
                      {venueOwners.map((vo) => (
                        <option key={vo.id} value={vo.id}>{vo.first_name} {vo.last_name} ({vo.email})</option>
                      ))}
                    </select>
                    {venueOwnersLoading && (
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Loader className="w-3 h-3 mr-1 animate-spin" /> Loading...
                      </div>
                    )}
                    {!venueOwnersLoading && venueOwners.length === 0 && (
                      <p className="text-sm text-amber-600 mt-1">No venue owners found. Create venue owners first.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Cover Image */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image (used on landing/cards)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverImage(e.target.files && e.target.files[0])}
                  className="block w-full text-sm text-gray-500"
                />
              </div>

              {/* Venue Images Upload */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Images
                </label>
                <div className="space-y-4">
                  <div>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">Upload venue images</p>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleVenueImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  {/* Display uploaded venue images */}
                  {venueImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {venueImages.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Venue ${index + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeVenueImage(index)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Venue Availability */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Venue Availability</h2>
              <p className="text-sm text-gray-600 mb-4">Set the default operating hours for this venue (can be overridden per court). You can add multiple time windows per day.</p>
              <div className="space-y-4">
                {Object.entries(venueAvailability).map(([day, schedule]) => (
                  <div key={day} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={schedule.is_available}
                          onChange={(e) => handleVenueAvailabilityChange(day, 'is_available', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label className="text-sm font-medium text-gray-700 capitalize">
                          {day}
                        </label>
                      </div>
                      {schedule.is_available && (
                        <button
                          type="button"
                          onClick={() => addVenueWindow(day)}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                        >
                          + Add Window
                        </button>
                      )}
                    </div>
                    {schedule.is_available && (
                      <div className="space-y-2">
                        {schedule.windows.map((window, windowIndex) => (
                          <div key={windowIndex} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <label className="text-xs text-gray-600">From:</label>
                              <input
                                type="time"
                                value={window.start_time}
                                onChange={(e) => handleVenueWindowChange(day, windowIndex, 'start_time', e.target.value)}
                                className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <label className="text-xs text-gray-600">To:</label>
                              <input
                                type="time"
                                value={window.end_time}
                                onChange={(e) => handleVenueWindowChange(day, windowIndex, 'end_time', e.target.value)}
                                className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            {schedule.windows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeVenueWindow(day, windowIndex)}
                                className="text-red-600 hover:text-red-800 text-xs px-1"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Sports and Amenities */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sports & Amenities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SearchableCheckboxList
                  items={sports}
                  selectedItems={selectedSports}
                  onToggle={handleSportToggle}
                  title="Sports *"
                  placeholder="Search sports..."
                  showIcon={true}
                  maxHeight="max-h-48"
                />
                <SearchableCheckboxList
                  items={amenities}
                  selectedItems={selectedAmenities}
                  onToggle={handleAmenityToggle}
                  title="Amenities"
                  placeholder="Search amenities..."
                  showIcon={true}
                  maxHeight="max-h-48"
                />
              </div>
            </Card>

            {/* Courts */}
            <Card className="p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Courts</h2>
              </div>

              {courts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No courts added yet. Click "Add Court" to get started.
                </div>
              ) : (
                <div className="space-y-6">
                  {courts.map((court) => (
                    <div key={court.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-md font-medium text-gray-900">Court Details</h3>
                        <Button
                          type="button"
                          onClick={() => removeCourt(court.id)}
                          variant="outline"
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Court Name *
                          </label>
                          <Input
                            value={court.name}
                            onChange={(e) => updateCourt(court.id, 'name', e.target.value)}
                            placeholder="Court 1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sport *
                          </label>
                          <select
                            value={court.sport}
                            onChange={(e) => updateCourt(court.id, 'sport', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select Sport</option>
                            {allowedSports.map((sport) => (
                              <option key={sport.id} value={sport.name}>
                                {sport.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        {/* Court Type removed as per requirement */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Surface Type
                          </label>
                          <select
                            value={court.surface_type}
                            onChange={(e) => updateCourt(court.id, 'surface_type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="Hard Court">Hard Court</option>
                            <option value="Clay">Clay</option>
                            <option value="Grass">Grass</option>
                            <option value="Synthetic">Synthetic</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Players
                          </label>
                          <Input
                            type="number"
                            value={court.max_players}
                            onChange={(e) => updateCourt(court.id, 'max_players', parseInt(e.target.value))}
                            placeholder="2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Indoor Court
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={court.is_indoor}
                              onChange={(e) => updateCourt(court.id, 'is_indoor', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Yes</span>
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Booking Duration (minutes) *
                          </label>
                          <Input
                            type="number"
                            value={court.booking_duration_minutes}
                            onChange={(e) => updateCourt(court.id, 'booking_duration_minutes', parseInt(e.target.value))}
                            placeholder="60"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price per Duration ($) *
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            value={court.price_per_duration}
                            onChange={(e) => updateCourt(court.id, 'price_per_duration', parseFloat(e.target.value))}
                            placeholder="50.00"
                          />
                        </div>
                      </div>

                      {/* Court Images Upload */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Court Images
                        </label>
                        <div className="space-y-2">
                          <div>
                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                              <div className="flex flex-col items-center justify-center pt-3 pb-4">
                                <svg className="w-6 h-6 mb-2 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                </svg>
                                <p className="text-xs text-gray-500">Upload court images</p>
                              </div>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => handleCourtImageUpload(court.id, e)}
                                className="hidden"
                              />
                            </label>
                          </div>
                          
                          {/* Display uploaded court images */}
                          {court.gallery_images && court.gallery_images.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                              {court.gallery_images.map((file, index) => (
                                <div key={index} className="relative">
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={`Court ${index + 1}`}
                                    className="w-full h-16 object-cover rounded"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeCourtImage(court.id, index)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Court Availability */}
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Court Availability</h4>
                        <p className="text-xs text-gray-600 mb-3">Set specific hours for this court (overrides venue default). You can add multiple time windows per day.</p>
                        <div className="space-y-3">
                          {Object.entries(court.availability || {}).map(([day, schedule]) => (
                            <div key={day} className="p-3 border border-gray-200 rounded">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={schedule.is_available}
                                    onChange={(e) => handleCourtAvailabilityChange(court.id, day, 'is_available', e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                                </div>
                                {schedule.is_available && (
                                  <button
                                    type="button"
                                    onClick={() => addCourtWindow(court.id, day)}
                                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                                  >
                                    + Add Window
                                  </button>
                                )}
                              </div>
                              {schedule.is_available && schedule.windows && (
                                <div className="space-y-2">
                                  {schedule.windows.map((window, windowIndex) => (
                                    <div key={windowIndex} className="flex items-center space-x-2 p-2 bg-gray-50 rounded text-sm">
                                      <div className="flex items-center space-x-1">
                                        <label className="text-xs text-gray-600">From:</label>
                                        <input
                                          type="time"
                                          value={window.start_time}
                                          onChange={(e) => handleCourtWindowChange(court.id, day, windowIndex, 'start_time', e.target.value)}
                                          className="px-1 py-0.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                        />
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <label className="text-xs text-gray-600">To:</label>
                                        <input
                                          type="time"
                                          value={window.end_time}
                                          onChange={(e) => handleCourtWindowChange(court.id, day, windowIndex, 'end_time', e.target.value)}
                                          className="px-1 py-0.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                        />
                                      </div>
                                      {schedule.windows.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => removeCourtWindow(court.id, day, windowIndex)}
                                          className="text-red-600 hover:text-red-800 text-xs px-1"
                                        >
                                          Remove
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Floating Add Court Button */}
            <div className="sticky bottom-2 flex justify-end mt-6">
              <Button type="button" onClick={addCourt} className="flex items-center space-x-2 shadow-lg">
                <Plus className="w-4 h-4" />
                <span>Add Court</span>
              </Button>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(venuesBackPath)}
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
                <span>{isLoading ? 'Creating...' : 'Create Venue'}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateVenuePage;
