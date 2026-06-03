import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { venuesAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import MapPicker from '../components/Map/MapPicker';
import SearchableCheckboxList from '../components/UI/SearchableCheckboxList';
import { ArrowLeft, Save, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const VenueOwnerEditVenuePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Australia',
    phone_number: '',
    email: '',
    website: '',
    sport_categories: [],
    amenities: [],
    latitude: '',
    longitude: '',
    google_map_link: '',
    currency: 'AUD',
    rules: '',
    cancellation_policy: '',
    status: 'pending'
  });

  const [selectedImages, setSelectedImages] = useState([]);
  const [coverImage, setCoverImage] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [selectedSports, setSelectedSports] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [courts, setCourts] = useState([]);
  const [venueAvailability, setVenueAvailability] = useState({
    monday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
    tuesday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
    wednesday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
    thursday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
    friday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
    saturday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
    sunday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] }
  });

  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';

  // Fetch sports and amenities data
  const { data: sportsData, isLoading: sportsLoading } = useQuery(
    'sports',
    venuesAPI.getSports
  );

  const { data: amenitiesData, isLoading: amenitiesLoading } = useQuery(
    'amenities',
    venuesAPI.getAmenities
  );

  const sports = useMemo(() => sportsData?.data || [], [sportsData?.data]);
  const amenities = amenitiesData?.data || [];

  // Derive allowed sports based on selectedSports for court dropdowns
  const allowedSports = useMemo(() => {
    if (!Array.isArray(sports)) return [];
    const byId = new Set(selectedSports);
    return sports
      .filter((s) => byId.has(s.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sports, selectedSports]);

  // When selected sports change, clear invalid court.sport values
  useEffect(() => {
    setCourts((prev) =>
      prev.map((court) =>
        allowedSports.find((s) => s.name === court.sport) ? court : { ...court, sport: '' }
      )
    );
  }, [allowedSports]);

  // Fetch venue data
  const { isLoading, error } = useQuery(
    ['venue', id],
    () => venuesAPI.getVenue(id),
    {
      onSuccess: (data) => {
        const venue = data.data;
        // Safely handle sport_categories and amenities for formData
        let safeSportCategories = [];
        if (Array.isArray(venue.sport_categories)) {
          safeSportCategories = venue.sport_categories;
        } else if (typeof venue.sport_categories === 'string') {
          try {
            safeSportCategories = JSON.parse(venue.sport_categories);
          } catch (e) {
            safeSportCategories = [venue.sport_categories];
          }
        }

        let safeAmenities = [];
        if (Array.isArray(venue.amenities)) {
          safeAmenities = venue.amenities;
        } else if (typeof venue.amenities === 'string') {
          try {
            safeAmenities = JSON.parse(venue.amenities);
          } catch (e) {
            safeAmenities = [venue.amenities];
          }
        }

        setFormData({
          name: venue.name || '',
          description: venue.description || '',
          address: venue.address || '',
          city: venue.city || '',
          state: venue.state || '',
          postcode: venue.postcode || '',
          country: venue.country || 'Australia',
          phone_number: venue.phone_number || '',
          email: venue.email || '',
          website: venue.website || '',
          sport_categories: safeSportCategories,
          amenities: safeAmenities,
          latitude: venue.latitude || '',
          longitude: venue.longitude || '',
          google_map_link: venue.google_map_link || '',
          currency: venue.currency || 'AUD',
          rules: venue.rules || '',
          cancellation_policy: venue.cancellation_policy || '',
          status: venue.status || 'pending'
        });

        // Set selected sports and amenities based on venue data
        if (sports.length > 0) {
          const sportIds = safeSportCategories.map(category => {
            const sport = sports.find(s => s.name === category);
            return sport ? sport.id : null;
          }).filter(Boolean);
          setSelectedSports(sportIds);
        }

        if (amenities.length > 0) {
          const amenityIds = safeAmenities.map(amenityName => {
            const amenity = amenities.find(a => a.name === amenityName);
            return amenity ? amenity.id : null;
          }).filter(Boolean);
          setSelectedAmenities(amenityIds);
        }

        // Set images
        if (venue.cover_image) {
          setCoverImage({ url: venue.cover_image, isExisting: true });
        }
        if (venue.gallery_images && Array.isArray(venue.gallery_images)) {
          const existingImages = venue.gallery_images.map(img => ({
            id: img.id,
            url: img.image || img.url || img,
            isExisting: true
          }));
          setSelectedImages(existingImages);
        }

        // Set courts
        if (venue.courts && Array.isArray(venue.courts)) {
          setCourts(venue.courts.map(court => ({
            id: court.id || Date.now() + Math.random(),
            name: court.name || '',
            sport: court.sport || '',
            court_type: court.court_type || 'Standard',
            surface_type: court.surface_type || 'Hard Court',
            is_indoor: court.is_indoor || false,
            max_players: court.max_players || 2,
            booking_duration_minutes: court.booking_duration_minutes || 60,
            price_per_duration: court.price_per_duration || 50.00,
            gallery_images: court.gallery_images || [],
            availability: (() => {
              if (!court.availability) {
                return {
                  monday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
                  tuesday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
                  wednesday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
                  thursday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
                  friday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
                  saturday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] },
                  sunday: { is_available: true, windows: [{ start_time: '06:00', end_time: '22:00' }] }
                };
              }
              
              // Convert from backend format to multi-window format
              const convertedAvailability = {};
              Object.entries(court.availability).forEach(([day, schedule]) => {
                if (schedule.windows) {
                  // Already in new format
                  convertedAvailability[day] = schedule;
                } else {
                  // Convert from old format to new format
                  convertedAvailability[day] = {
                    is_available: schedule.is_available || true,
                    windows: schedule.start_time && schedule.end_time 
                      ? [{ start_time: schedule.start_time, end_time: schedule.end_time }]
                      : [{ start_time: '06:00', end_time: '22:00' }]
                  };
                }
              });
              return convertedAvailability;
            })()
          })));
        } else {
          setCourts([]);
        }

        // Set venue availability - convert from backend format to multi-window format
        if (venue.availability) {
          const convertedAvailability = {};
          Object.entries(venue.availability).forEach(([day, schedule]) => {
            if (schedule.windows) {
              // Already in new format
              convertedAvailability[day] = schedule;
            } else {
              // Convert from old format to new format
              convertedAvailability[day] = {
                is_available: schedule.is_available || true,
                windows: schedule.start_time && schedule.end_time 
                  ? [{ start_time: schedule.start_time, end_time: schedule.end_time }]
                  : [{ start_time: '06:00', end_time: '22:00' }]
              };
            }
          });
          setVenueAvailability(convertedAvailability);
        }
      }
    }
  );

  // Update venue mutation
  const updateVenueMutation = useMutation(
    (data) => venuesAPI.updateVenue(id, data),
    {
      onSuccess: (response) => {
        console.log('Update success:', response);
        toast.success('Venue updated successfully');
        
        // Clear all related caches
        queryClient.invalidateQueries(['venue', id]);
        queryClient.invalidateQueries('my-venues');
        queryClient.removeQueries(['venue', id]);
        queryClient.removeQueries('my-venues');
        
        // Force refresh after a short delay
        setTimeout(() => {
          navigate('/venues/my-venues');
          window.location.reload();
        }, 500);
      },
      onError: (error) => {
        console.error('Update error:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        toast.error(`Failed to update venue: ${error.response?.data?.detail || error.message}`);
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
      court_type: 'Standard',
      surface_type: 'Hard Court',
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

  const handleVenueAvailabilityChange = (day, field, value) => {
    setVenueAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setCoverImage({ file, url: URL.createObjectURL(file), isExisting: false });
    }
  };

  const handleVenueImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      isExisting: false
    }));
    setNewImages(prev => [...prev, ...newFiles]);
  };

  const removeImage = (index, isExisting) => {
    if (isExisting) {
      setSelectedImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setNewImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleCourtImageUpload = (courtId, e) => {
    const files = Array.from(e.target.files);
    setCourts(prev => prev.map(court => 
      court.id === courtId 
        ? { 
            ...court, 
            gallery_images: [...(court.gallery_images || []), ...files]
          }
        : court
    ));
  };

  const removeCourtImage = (courtId, index) => {
    setCourts(prev => prev.map(court => 
      court.id === courtId 
        ? { 
            ...court, 
            gallery_images: court.gallery_images.filter((_, i) => i !== index)
          }
        : court
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create FormData for file uploads
      const formDataToSend = new FormData();
      
      // Add basic venue data
      Object.keys(formData).forEach(key => {
        if (key !== 'sport_categories' && key !== 'amenities') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Add sport categories
      const sportCategories = selectedSports.map(id => {
        const sport = sports.find(s => s.id === id);
        return sport ? sport.name : null;
      }).filter(Boolean);
      formDataToSend.append('sport_categories', JSON.stringify(sportCategories));
      
      // Add amenities
      const amenityList = selectedAmenities.map(id => {
        const amenity = amenities.find(a => a.id === id);
        return amenity ? amenity.name : null;
      }).filter(Boolean);
      formDataToSend.append('amenities', JSON.stringify(amenityList));
      
      // Add cover image if changed
      if (coverImage && coverImage.file) {
        formDataToSend.append('cover_image', coverImage.file);
      }
      
      // Add existing images (keep them)
      selectedImages.forEach((image) => {
        if (image.isExisting) {
          formDataToSend.append('existing_images', image.id);
        }
      });
      
      // Add new venue images
      newImages.forEach((image) => {
        formDataToSend.append('gallery_images', image.file);
      });
      
      // Add courts data - convert multi-window structure to individual records
      const courtsData = courts.filter(court => court.name && court.sport).map(court => {
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
      formDataToSend.append('courts', JSON.stringify(courtsData));
      
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
      formDataToSend.append('availability', JSON.stringify(availabilityRecords));
      
      updateVenueMutation.mutate(formDataToSend);
    } catch (error) {
      console.error('Error preparing form data:', error);
      toast.error('Failed to prepare venue data');
    }
  };

  if (isLoading || sportsLoading || amenitiesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Venue</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Button onClick={() => navigate('/venues/my-venues')}>
            Back to My Venues
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/venues/my-venues')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Venues
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Venue</h1>
          <p className="text-gray-600 mt-2">Update your venue information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 relative">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venue Name *
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter venue name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your venue"
                />
              </div>

              {/* Rules */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rules & Regulations
                </label>
                <textarea
                  name="rules"
                  value={formData.rules}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter venue rules and regulations..."
                />
              </div>

              {/* Cancellation Policy */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cancellation Policy
                </label>
                <textarea
                  name="cancellation_policy"
                  value={formData.cancellation_policy}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter cancellation policy..."
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency *
                </label>
                <select
                  name="currency"
                  value={formData.currency || 'AUD'}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <MapPicker
                  accessToken={MAPBOX_TOKEN}
                  value={{ 
                    latitude: formData.latitude, 
                    longitude: formData.longitude, 
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    postcode: formData.postcode,
                    country: formData.country
                  }}
                  onChange={(val) => setFormData((prev) => ({
                    ...prev,
                    latitude: val.latitude ?? prev.latitude,
                    longitude: val.longitude ?? prev.longitude,
                    address: val.address ?? prev.address,
                    city: val.city ?? prev.city,
                    state: val.state ?? prev.state,
                    postcode: val.postcode ?? prev.postcode,
                    country: val.country ?? prev.country,
                  }))}
                  height="360px"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter full address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <Input
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter state"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postcode *
                </label>
                <Input
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter postcode"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <Input
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                  placeholder="Australia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <Input
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="Enter latitude"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <Input
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="Enter longitude"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google Map Link
                </label>
                <Input
                  name="google_map_link"
                  value={formData.google_map_link}
                  onChange={handleInputChange}
                  placeholder="Enter Google Maps link"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="venue@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <Input
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  required
                  placeholder="+61 123 456 789"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <Input
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://www.venue.com"
                />
              </div>
            </div>
          </Card>

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
            <div className="flex items-center justify-between mb-4">
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
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleCourtImageUpload(court.id, e)}
                            className="hidden"
                            id={`court-images-${court.id}`}
                          />
                          <label
                            htmlFor={`court-images-${court.id}`}
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <svg className="w-6 h-6 mb-2 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                              </svg>
                              <p className="text-xs text-gray-500">Upload court images</p>
                            </div>
                          </label>
                        </div>
                        {court.gallery_images && court.gallery_images.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {court.gallery_images.map((fileOrUrl, index) => {
                              const src =
                                fileOrUrl instanceof File
                                  ? URL.createObjectURL(fileOrUrl)
                                  : (typeof fileOrUrl === 'string'
                                      ? fileOrUrl
                                      : (fileOrUrl && fileOrUrl.url) || '');
                              return (
                                <div key={index} className="relative">
                                  {src ? (
                                    <img
                                      src={src}
                                      alt={`Court ${index + 1}`}
                                      className="w-full h-20 object-cover rounded-lg"
                                    />
                                  ) : null}
                                  <button
                                    type="button"
                                    onClick={() => removeCourtImage(court.id, index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
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

            {/* Floating Add Court Button */}
            <div className="sticky bottom-2 flex justify-end mt-6">
              <Button type="button" onClick={addCourt} className="flex items-center space-x-2 shadow-lg">
                <Plus className="w-4 h-4" />
                <span>Add Court</span>
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
            <div className="space-y-4">
              {/* Cover Image */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Cover Image (used on landing/cards)</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-40 h-24 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                    {coverImage?.url ? (
                      <img 
                        src={coverImage.url} 
                        alt="Cover" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-xs text-gray-400">No cover</span>
                    )}
                  </div>
                  <div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleCoverUpload}
                      className="block w-full text-sm text-gray-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Existing Images */}
              {selectedImages.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Current Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image.url || image}
                            alt={`Venue ${index + 1}`}
                            className="w-full h-24 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index, true)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* New Images */}
              {newImages.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">New Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {newImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image.url}
                          alt={`New venue ${index + 1}`}
                          className="w-full h-24 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index, false)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload New Images */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Upload New Images</h3>
                <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
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
                </div>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/venues/my-venues')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateVenueMutation.isLoading}
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              {updateVenueMutation.isLoading ? 'Updating...' : 'Update Venue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VenueOwnerEditVenuePage;
