import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { venuesAPI } from '../services/api';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Card from '../components/UI/Card';
import MapPicker from '../components/Map/MapPicker';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import SearchableCheckboxList from '../components/UI/SearchableCheckboxList';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Building, Plus, X } from 'lucide-react';

const VenueRegistrationPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sports, setSports] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [selectedSports, setSelectedSports] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [courts, setCourts] = useState([]);
  
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm();

  const password = watch('password');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/register-venue');
      return;
    }
    
    // Check if user is already a venue owner
    if (user?.user_type === 'venue_owner') {
      navigate('/venues/create');
      return;
    }
    
    // Load sports and amenities data
    loadSportsAndAmenities();
  }, [isAuthenticated, user, navigate]);

  const loadSportsAndAmenities = async () => {
    try {
      const [sportsResponse, amenitiesResponse] = await Promise.all([
        venuesAPI.getSports(),
        venuesAPI.getAmenities()
      ]);
      
      setSports(sportsResponse.data);
      setAmenities(amenitiesResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load sports and amenities data');
    }
  };

  // Limit court sports to selectedSports
  const allowedSports = useMemo(() => {
    if (!Array.isArray(sports)) return [];
    const byId = new Set(selectedSports);
    return sports
      .filter((s) => byId.has(s.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sports, selectedSports]);

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

  const addCourt = () => {
    setCourts(prev => [...prev, {
      id: Date.now(),
      name: '',
      sport: '',
      court_type: '',
      surface_type: '',
      is_indoor: false,
      max_players: 2,
      price_per_duration: 0,
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

  const [location, setLocation] = useState({ 
    latitude: null, 
    longitude: null, 
    address: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Australia'
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Validate courts client-side per new rules
      const validCourts = courts.filter(c => c.name && c.sport);
      if (validCourts.length === 0) {
        toast.error('Please add at least one court with name and sport.');
        setIsLoading(false);
        return;
      }
      for (let i = 0; i < validCourts.length; i += 1) {
        const c = validCourts[i];
        if (!c.price_per_duration) {
          toast.error(`Court ${i + 1}: Please enter Price per Duration.`);
          setIsLoading(false);
          return;
        }
      }
      // Prepare venue data
      const venueData = {
        name: data.name,
        email: data.email,
        phone_number: `+61${data.phone_number}`,
        description: 'Venue description will be added later',
        address: location.address || 'Address will be added later',
        city: location.city || 'City will be added later',
        state: location.state || 'State will be added later',
        postcode: location.postcode || '0000',
        country: location.country || 'Australia',
        latitude: location.latitude,
        longitude: location.longitude,
        sport_categories: selectedSports.map(id => {
          const sport = sports.find(s => s.id === id);
          return sport ? sport.name : null;
        }).filter(Boolean),
        amenities: selectedAmenities.map(id => {
          const amenity = amenities.find(a => a.id === id);
          return amenity ? amenity.name : null;
        }).filter(Boolean),
        currency: 'AUD',
        courts: validCourts.map(court => ({
          name: court.name,
          sport: court.sport,
          court_type: court.court_type || 'Standard',
          surface_type: court.surface_type || 'Hard Court',
          is_indoor: !!court.is_indoor,
          max_players: court.max_players || 2,
          booking_duration_minutes: 60,
          price_per_duration: court.price_per_duration,
        })),
      };

      const response = await venuesAPI.createVenue(venueData);
      
      toast.success(response.data.message || 'Venue registration submitted successfully! We will review and approve it soon.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || 'Failed to register venue. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show message for non-venue owners
  if (user?.user_type !== 'venue_owner') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Venue Owner Access Required
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You need to be a registered venue owner to create venues.
            </p>
          </div>

          <Card className="p-8">
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                To list your venues, you need to register as a venue owner first.
              </p>
              <div className="space-y-3">
                <Link
                  to="/register-venue-owner"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors inline-block"
                >
                  Register as Venue Owner
                </Link>
                <Link
                  to="/venues"
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors inline-block"
                >
                  Browse Venues Instead
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-900">SportMeet</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.first_name || user?.username}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Section - Information */}
          <div className="bg-gradient-to-br from-blue-600 to-green-600 rounded-2xl p-8 text-white">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mr-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 bg-white rounded-full"></div>
                </div>
              </div>
              <span className="text-3xl font-bold">SportMeet</span>
            </div>
            
            <h2 className="text-2xl font-bold mb-4">List Your Venue</h2>
            <p className="text-lg leading-relaxed mb-6">
              Connect with thousands of sports lovers by listing your venue on SportMeet. 
              Easily manage bookings, attract more players, and grow your business within 
              a vibrant sporting community.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm">✓</span>
                </div>
                <span>Reach thousands of sports enthusiasts</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm">✓</span>
                </div>
                <span>Easy booking management system</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm">✓</span>
                </div>
                <span>Grow your business with our platform</span>
              </div>
            </div>
          </div>

          {/* Right Section - Registration Form */}
          <Card className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Register As Venue Owner</h1>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Map Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Location
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
                  height="300px"
                />
                <p className="text-xs text-gray-500 mt-2">Search or click to set venue location. This will auto-fill coordinates.</p>
              </div>
              {/* Venue Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Name
                </label>
                <Input
                  {...register('name', { required: 'Venue name is required' })}
                  placeholder="Enter venue name"
                  error={errors.name?.message}
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  placeholder="Enter email address"
                  error={errors.email?.message}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="flex">
                  <div className="flex items-center px-3 border border-r-0 border-gray-300 rounded-l-md bg-gray-50">
                    <span className="text-gray-700">+61</span>
                  </div>
                  <Input
                    {...register('phone_number', { 
                      required: 'Phone number is required',
                      pattern: {
                        value: /^\d{9}$/,
                        message: 'Enter 9-digit number'
                      }
                    })}
                    placeholder="Enter 9-digit number"
                    className="rounded-l-none"
                    error={errors.phone_number?.message}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Input
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters'
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    error={errors.password?.message}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    {...register('confirm_password', { 
                      required: 'Please confirm your password',
                      validate: value => value === password || 'Passwords do not match'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    error={errors.confirm_password?.message}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Sports Selection */}
              <SearchableCheckboxList
                items={sports}
                selectedItems={selectedSports}
                onToggle={handleSportToggle}
                title="Sports Offered *"
                placeholder="Search sports..."
                showIcon={true}
                maxHeight="max-h-48"
              />

              {/* Amenities Selection */}
              <SearchableCheckboxList
                items={amenities}
                selectedItems={selectedAmenities}
                onToggle={handleAmenityToggle}
                title="Amenities"
                placeholder="Search amenities..."
                showIcon={true}
                maxHeight="max-h-48"
              />

              {/* Courts Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Courts
                  </label>
                  <Button
                    type="button"
                    onClick={addCourt}
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Court
                  </Button>
                </div>
                
                {courts.map((court, index) => (
                  <div key={court.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Court {index + 1}</h4>
                      <Button
                        type="button"
                        onClick={() => removeCourt(court.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Court Name
                        </label>
                        <Input
                          value={court.name}
                          onChange={(e) => updateCourt(court.id, 'name', e.target.value)}
                          placeholder="e.g., Court 1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sport
                        </label>
                        <select
                          value={court.sport}
                          onChange={(e) => updateCourt(court.id, 'sport', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Sport</option>
                          {allowedSports.map((sport) => (
                            <option key={sport.id} value={sport.name}>
                              {sport.name}
                            </option>
                          ))}
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
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price per Hour ($)
                        </label>
                        <Input
                          type="number"
                          value={court.price_per_duration}
                          onChange={(e) => updateCourt(court.id, 'price_per_duration', parseFloat(e.target.value))}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-3 rounded-lg font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Registering...
                  </div>
                ) : (
                  'Register'
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VenueRegistrationPage;
