import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { venuesAPI } from '../services/api';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import EmptyState from '../components/UI/EmptyState';
import { SkeletonCardGrid } from '../components/UI/Skeleton';
import NearbySearch from '../components/Map/NearbySearch';
import PageMeta from '../components/SEO/PageMeta';
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  DollarSign,
  Filter,
  Map,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Users,
  X,
} from 'lucide-react';

const API_ORIGIN = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '');
const fallbackVenueImage = `${API_ORIGIN}/media/demo/generated-venue.png`;

const mediaUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
};

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

const fallbackSports = ['Badminton', 'Cricket', 'Football', 'Basketball', 'Tennis', 'Swimming'].map((name, index) => ({
  id: `fallback-${name}`,
  name,
  venue_count: index + 4,
}));

const VenueDiscoveryPage = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [userLocation, setUserLocation] = useState(null);
  const [radius, setRadius] = useState(10);
  const [sortBy, setSortBy] = useState('distance');
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';

  const { data: venuesData, isLoading, error } = useQuery(
    ['venues', searchTerm, selectedSport, selectedDate, priceRange, userLocation, radius, sortBy],
    () => venuesAPI.getVenues({
      search: searchTerm || undefined,
      sport_category: selectedSport || undefined,
      date: selectedDate || undefined,
      min_price: priceRange.min || undefined,
      max_price: priceRange.max || undefined,
      latitude: userLocation?.latitude,
      longitude: userLocation?.longitude,
      radius,
      sort_by: sortBy,
    }),
    { staleTime: 3 * 60 * 1000 }
  );

  const { data: sportsData } = useQuery('sports', venuesAPI.getSports, { staleTime: 10 * 60 * 1000 });

  const venues = Array.isArray(venuesData?.data)
    ? venuesData.data
    : Array.isArray(venuesData?.results)
    ? venuesData.results
    : Array.isArray(venuesData?.data?.results)
    ? venuesData.data.results
    : [];
  const sports = Array.isArray(sportsData?.data) && sportsData.data.length > 0 ? sportsData.data : fallbackSports;

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchParam = urlParams.get('search') || urlParams.get('city') || '';
    const sportParam = urlParams.get('sport_category') || urlParams.get('sport') || '';
    const dateParam = urlParams.get('date') || '';
    const lat = urlParams.get('latitude');
    const lng = urlParams.get('longitude');

    setSearchTerm(searchParam);
    setSelectedSport(sportParam);
    setSelectedDate(dateParam);
    if (lat && lng) {
      setUserLocation({ latitude: Number(lat), longitude: Number(lng) });
    }
  }, [location.search]);

  const activeFilters = useMemo(() => {
    const filters = [];
    if (searchTerm) filters.push(['Search', searchTerm]);
    if (selectedSport) filters.push(['Sport', selectedSport]);
    if (selectedDate) filters.push(['Date', selectedDate]);
    if (priceRange.min || priceRange.max) filters.push(['Price', `${priceRange.min || '0'} - ${priceRange.max || 'any'}`]);
    if (userLocation) filters.push(['Location', `Within ${radius} km`]);
    return filters;
  }, [searchTerm, selectedSport, selectedDate, priceRange, userLocation, radius]);

  const featuredCount = venues.filter((venue) => venue.is_featured || venue.is_verified).length;

  const handleSearch = (event) => {
    event.preventDefault();
    setShowMobileFilters(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSport('');
    setSelectedDate('');
    setPriceRange({ min: '', max: '' });
    setUserLocation(null);
    setRadius(10);
    setSortBy('distance');
    setShowLocationSearch(false);
  };

  const getDistance = (venue) => {
    if (!userLocation || !venue.latitude || !venue.longitude) return null;
    const R = 6371;
    const dLat = (venue.latitude - userLocation.latitude) * Math.PI / 180;
    const dLon = (venue.longitude - userLocation.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(venue.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  return (
    <div className="min-h-screen bg-[#F7FAF8]">
      <PageMeta
        title="Find Sports Venues"
        description="Search and filter SportMeet venues by city, sport, price, rating, and nearby location."
      />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-sm font-bold text-primary-700">
                <ShieldCheck className="h-4 w-4" />
                Verified venues and bookable courts
              </p>
              <h1 className="text-4xl font-extrabold text-slate-950">Find the right sports venue</h1>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Compare courts, sports, pricing, distance, amenities, and availability before you choose where to play.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
              <Stat value={venues.length} label="venues" />
              <Stat value={featuredCount || 'Live'} label="verified" />
              <Stat value={sports.length} label="sports" />
            </div>
          </div>

          <form onSubmit={handleSearch} className="mt-7 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:grid-cols-[1.4fr_1fr_0.9fr_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search venue, city, area, or sport"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-primary-500"
              />
            </div>
            <select
              value={selectedSport}
              onChange={(event) => setSelectedSport(event.target.value)}
              className="h-12 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary-500"
            >
              <option value="">All sports</option>
              {sports.map((sport) => <option key={sport.id} value={sport.name}>{sport.name}</option>)}
            </select>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="h-12 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary-500"
            />
            <Button type="submit" className="h-12 justify-center">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {sports.slice(0, 8).map((sport) => (
              <button
                key={sport.id}
                type="button"
                onClick={() => setSelectedSport(sport.name)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  selectedSport === sport.name
                    ? 'bg-primary-500 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:bg-primary-50'
                }`}
              >
                {sport.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
          <p className="text-sm font-semibold text-slate-700">{venues.length} venues found</p>
          <Button variant="outline" onClick={() => setShowMobileFilters((value) => !value)}>
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className={`${showMobileFilters ? 'block' : 'hidden'} lg:block`}>
            <Card className="sticky top-24 p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="inline-flex items-center gap-2 text-lg font-extrabold text-slate-950">
                  <Filter className="h-5 w-5 text-primary-600" />
                  Filters
                </h2>
                <button type="button" onClick={clearFilters} className="text-sm font-bold text-primary-700">
                  Reset
                </button>
              </div>

              <div className="space-y-5">
                <Field label="Price Range (AUD/slot)">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(event) => setPriceRange({ ...priceRange, min: event.target.value })}
                      className="input"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(event) => setPriceRange({ ...priceRange, max: event.target.value })}
                      className="input"
                    />
                  </div>
                </Field>

                <Field label="Location">
                  {userLocation ? (
                    <div className="rounded-xl border border-primary-200 bg-primary-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-2 text-sm text-primary-900">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{userLocation.address || `${userLocation.latitude?.toFixed(4)}, ${userLocation.longitude?.toFixed(4)}`}</span>
                        </div>
                        <button type="button" onClick={() => setUserLocation(null)} className="text-primary-700">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : showLocationSearch ? (
                    <NearbySearch
                      accessToken={MAPBOX_TOKEN}
                      onLocationSelect={(nextLocation) => {
                        setUserLocation(nextLocation);
                        setShowLocationSearch(false);
                      }}
                      onRadiusChange={setRadius}
                      defaultRadius={radius}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowLocationSearch(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 hover:border-primary-300 hover:bg-primary-50"
                    >
                      <MapPin className="h-5 w-5 text-primary-600" />
                      Set nearby location
                    </button>
                  )}
                </Field>

                {userLocation && (
                  <Field label="Distance">
                    <select value={radius} onChange={(event) => setRadius(Number(event.target.value))} className="input">
                      <option value={5}>Within 5 km</option>
                      <option value={10}>Within 10 km</option>
                      <option value={25}>Within 25 km</option>
                      <option value={50}>Within 50 km</option>
                      <option value={100}>Within 100 km</option>
                    </select>
                  </Field>
                )}

                <Field label="Sort By">
                  <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="input">
                    <option value="distance">Distance</option>
                    <option value="price">Price Low to High</option>
                    <option value="-price">Price High to Low</option>
                    <option value="rating">Rating</option>
                    <option value="name">Name</option>
                  </select>
                </Field>
              </div>
            </Card>
          </aside>

          <section>
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-950">{venues.length} venues found</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedSport ? `Showing ${selectedSport} venues` : userLocation ? 'Showing venues near your selected location' : 'Showing approved SportMeet venues'}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600">
                <Map className="h-4 w-4 text-primary-600" />
                Map view will connect here later
              </div>
            </div>

            {activeFilters.length > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                {activeFilters.map(([label, value]) => (
                  <span key={`${label}-${value}`} className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                    {label}: {value}
                  </span>
                ))}
                <button type="button" onClick={clearFilters} className="text-sm font-bold text-primary-700">
                  Clear all
                </button>
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                Venue API had trouble loading. Showing the best available local state.
              </div>
            )}

            {isLoading ? (
              <SkeletonCardGrid count={4} />
            ) : venues.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="No venues found"
                description="Try another city, remove price filters, or browse all available sports venues."
                action={<Button onClick={clearFilters}>Clear Filters</Button>}
              />
            ) : (
              <div className="grid gap-5">
                {venues.map((venue) => (
                  <VenueResultCard key={venue.id} venue={venue} distance={getDistance(venue)} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

const Stat = ({ value, label }) => (
  <div className="min-w-[86px] rounded-xl bg-white px-4 py-3 shadow-sm">
    <div className="text-2xl font-black text-slate-950">{value}</div>
    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="mb-2 block text-sm font-bold text-slate-800">{label}</label>
    {children}
  </div>
);

const VenueResultCard = ({ venue, distance }) => {
  const sports = toArray(venue.sport_categories);
  const amenities = toArray(venue.amenities);

  return (
    <Link to={`/venues/${venue.id}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="grid gap-0 md:grid-cols-[280px_1fr]">
        <div className="relative h-64 md:h-full">
          <img
            src={mediaUrl(venue.cover_image_url) || mediaUrl(venue.gallery_images?.[0]?.image) || fallbackVenueImage}
            alt={venue.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          {(venue.is_featured || venue.is_verified) && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-primary-700 shadow-sm">
              <BadgeCheck className="h-3.5 w-3.5" />
              {venue.is_featured ? 'Featured' : 'Verified'}
            </span>
          )}
        </div>

        <div className="p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h3 className="text-xl font-extrabold text-slate-950 group-hover:text-primary-700">{venue.name}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary-600" />
                  {venue.city || 'Location TBD'}{venue.state ? `, ${venue.state}` : ''}
                </span>
                {distance && (
                  <span className="inline-flex items-center gap-1">
                    <Navigation className="h-4 w-4 text-primary-600" />
                    {distance} km away
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {venue.average_rating || 'New'}
                </span>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-left lg:text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">From</p>
              <p className="text-lg font-black text-slate-950">
                {venue.min_price ? `${venue.currency || 'AUD'} $${venue.min_price}` : 'Court pricing'}
              </p>
            </div>
          </div>

          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
            {venue.description || 'A SportMeet venue ready for court bookings, local sessions, and community sports activity.'}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {sports.slice(0, 4).map((sport) => (
              <span key={sport} className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700">{sport}</span>
            ))}
            {amenities.slice(0, 3).map((amenity) => (
              <span key={amenity} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{amenity}</span>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" />{sports.length || 1} sports</span>
              <span className="inline-flex items-center gap-1"><DollarSign className="h-4 w-4" />Transparent pricing</span>
              <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" />Book slots</span>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-extrabold text-primary-700">
              View & Book
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VenueDiscoveryPage;
