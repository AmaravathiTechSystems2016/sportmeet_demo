import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Search, X } from 'lucide-react';

// Nearby search component for venue discovery
// Props:
// - onLocationSelect: (location) => void
// - onRadiusChange: (radius) => void
// - defaultRadius: number (in km)
// - accessToken: string
export default function NearbySearch({
  onLocationSelect,
  onRadiusChange,
  defaultRadius = 10,
  accessToken,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [radius, setRadius] = useState(defaultRadius);

  // Search for locations
  const searchLocations = useCallback(async (query) => {
    if (!query || query.length < 3 || !accessToken) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${accessToken}&country=au&types=place,locality,neighborhood,address&limit=5`
      );
      const data = await response.json();
      
      if (data.features) {
        setSuggestions(data.features.map(feature => ({
          id: feature.id,
          name: feature.place_name,
          coordinates: feature.center,
          context: feature.context || []
        })));
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchLocations(searchQuery);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchLocations]);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setSearchQuery(location.name);
    setSuggestions([]);
    
    if (onLocationSelect) {
      onLocationSelect({
        latitude: location.coordinates[1],
        longitude: location.coordinates[0],
        address: location.name,
        city: location.context.find(c => c.id.startsWith('place'))?.text || '',
        state: location.context.find(c => c.id.startsWith('region'))?.text || '',
        postcode: location.context.find(c => c.id.startsWith('postcode'))?.text || '',
        country: location.context.find(c => c.id.startsWith('country'))?.text || 'Australia'
      });
    }
  };

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
    if (onRadiusChange) {
      onRadiusChange(newRadius);
    }
  };

  const clearSelection = () => {
    setSelectedLocation(null);
    setSearchQuery('');
    setSuggestions([]);
    if (onLocationSelect) {
      onLocationSelect(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a location..."
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        {selectedLocation && (
          <button
            onClick={clearSelection}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Search Suggestions */}
      {suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleLocationSelect(suggestion)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
            >
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">{suggestion.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="text-center py-2">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-500">Searching...</span>
        </div>
      )}

      {/* Selected Location */}
      {selectedLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 text-blue-500 mr-2" />
              <span className="text-sm text-blue-900">{selectedLocation.name}</span>
            </div>
            <button
              onClick={clearSelection}
              className="text-blue-500 hover:text-blue-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Radius Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Search Radius: {radius} km
        </label>
        <input
          type="range"
          min="1"
          max="50"
          value={radius}
          onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>1 km</span>
          <span>50 km</span>
        </div>
      </div>
    </div>
  );
}
