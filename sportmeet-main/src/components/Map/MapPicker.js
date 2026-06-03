import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

// Enhanced Map picker with search, reverse geocoding, and location features
// Props:
// - accessToken (required)
// - value: { latitude, longitude, address, city, state, postcode, country }
// - onChange: (next) => void
// - height: CSS height (default 320px)
// - defaultCenter: [lng, lat]
// - defaultZoom: number
// - enableReverseGeocoding: boolean (default true)
export default function MapPicker({
  accessToken,
  value,
  onChange,
  height = '320px',
  defaultCenter = [151.2093, -33.8688], // Sydney fallback
  defaultZoom = 11,
  enableReverseGeocoding = true,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reverse geocoding function
  const reverseGeocode = async (lng, lat) => {
    if (!enableReverseGeocoding || !accessToken) return null;
    
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}&types=place,locality,neighborhood,address,poi`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const context = feature.context || [];
        
        // Extract address components
        let city = '';
        let state = '';
        let postcode = '';
        let country = '';
        
        context.forEach(item => {
          if (item.id.startsWith('place')) city = item.text;
          else if (item.id.startsWith('region')) state = item.text;
          else if (item.id.startsWith('postcode')) postcode = item.text;
          else if (item.id.startsWith('country')) country = item.text;
        });
        
        return {
          address: feature.place_name,
          city,
          state,
          postcode,
          country,
        };
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    } finally {
      setIsLoading(false);
    }
    
    return null;
  };

  useEffect(() => {
    if (!accessToken) {
      console.error('MapPicker: No access token provided');
      return;
    }
    if (!containerRef.current) {
      console.error('MapPicker: No container ref');
      return;
    }
    try {
      mapboxgl.accessToken = accessToken;

      const startLngLat = value?.longitude && value?.latitude
        ? [Number(value.longitude), Number(value.latitude)]
        : defaultCenter;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: startLngLat,
        zoom: defaultZoom,
      });
      mapRef.current = map;

      // Controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Geocoder
      const geocoder = new MapboxGeocoder({
        accessToken,
        mapboxgl,
        marker: false,
        placeholder: 'Search location',
        countries: 'au',
        types: 'place,locality,neighborhood,address,poi',
      });
      map.addControl(geocoder, 'top-left');

      geocoder.on('result', async (e) => {
        try {
          const center = e.result.center; // [lng, lat]
          placeMarker(center);
          if (onChange) {
            const baseData = {
              latitude: center[1],
              longitude: center[0],
              address: e.result.place_name,
            };
            if (enableReverseGeocoding) {
              const geoData = await reverseGeocode(center[0], center[1]);
              if (geoData) Object.assign(baseData, geoData);
            }
            onChange(baseData);
          }
        } catch (err) {
          console.error('MapPicker geocoder result error:', err);
        }
      });

      // Initial marker
      placeMarker(startLngLat);

      // Click to move marker
      map.on('click', async (e) => {
        try {
          const lngLat = [e.lngLat.lng, e.lngLat.lat];
          placeMarker(lngLat);
          if (onChange) {
            const baseData = { latitude: lngLat[1], longitude: lngLat[0] };
            if (enableReverseGeocoding) {
              const geoData = await reverseGeocode(lngLat[0], lngLat[1]);
              if (geoData) Object.assign(baseData, geoData);
            }
            onChange(baseData);
          }
        } catch (err) {
          console.error('MapPicker click handler error:', err);
        }
      });
    } catch (error) {
      console.error('MapPicker init error:', error);
    }

    function placeMarker(lngLat) {
      if (!lngLat) return;
      if (!markerRef.current) {
        markerRef.current = new mapboxgl.Marker({ draggable: true })
          .setLngLat(lngLat)
          .addTo(mapRef.current);
        markerRef.current.on('dragend', async () => {
          const pos = markerRef.current.getLngLat();
          const baseData = { latitude: pos.lat, longitude: pos.lng };
          
          if (onChange) {
            // Add reverse geocoding data
            if (enableReverseGeocoding) {
              const geoData = await reverseGeocode(pos.lng, pos.lat);
              if (geoData) {
                Object.assign(baseData, geoData);
              }
            }
            
            onChange(baseData);
          }
        });
      } else {
        markerRef.current.setLngLat(lngLat);
      }
      mapRef.current.flyTo({ center: lngLat, zoom: mapRef.current.getZoom() < 12 ? 12 : mapRef.current.getZoom() });
    }

    return () => {
      try {
        if (mapRef.current) {
          mapRef.current.remove();
        }
      } catch (err) {
        // ignore
      }
    };
  // Mapbox map lifecycle intentionally initializes only when the token changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return (
    <div className="relative">
      <div 
        style={{ 
          height, 
          width: '100%',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          backgroundColor: '#f9fafb'
        }} 
        ref={containerRef}
      />
      {isLoading && (
        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded shadow text-sm text-gray-600">
          Loading location details...
        </div>
      )}
      {!accessToken && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
          Mapbox token not found
        </div>
      )}
    </div>
  );
}
