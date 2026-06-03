import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { venuesAPI, eventsAPI, coreAPI } from '../services/api';
import { useSite } from '../contexts/SiteContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import FloatingMenu from '../components/Layout/FloatingMenu';
import {
  ArrowRight,
  Building2,
  Clock,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
} from 'lucide-react';

const API_ORIGIN = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '');

const mediaUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
};

const fallbackImage = `${API_ORIGIN}/media/demo/generated-venue.png`;
const fallbackEventImage = `${API_ORIGIN}/media/demo/generated-event.png`;
const fallbackSportImage = `${API_ORIGIN}/media/demo/generated-sports.png`;

const quickSports = ['Badminton', 'Football', 'Tennis', 'Cricket', 'Basketball'];

const fallbackVenues = [
  { id: 'demo-melbourne', name: 'Melbourne Sports Complex', city: 'Melbourne', average_rating: '5.0', total_reviews: 28, min_price: '25.00', court_count: 4, sport_categories: ['Basketball', 'Tennis'], cover_image_url: fallbackImage },
  { id: 'demo-sydney', name: 'Sydney Athletic Centre', city: 'Sydney', average_rating: '4.8', total_reviews: 34, min_price: '30.00', court_count: 5, sport_categories: ['Football', 'Cricket'], cover_image_url: `${API_ORIGIN}/media/venues/covers/sydney-athletic-centre.jpg` },
  { id: 'demo-brisbane', name: 'Brisbane Racquet Hub', city: 'Brisbane', average_rating: '4.9', total_reviews: 19, min_price: '18.00', court_count: 3, sport_categories: ['Tennis', 'Badminton'], cover_image_url: `${API_ORIGIN}/media/venues/covers/brisbane-racquet-hub.jpg` },
];

const fallbackEvents = [
  { id: 'demo-event-tennis', title: 'Friday Night Tennis Ladder', sport_category: 'Tennis', start_date: '2026-06-03', start_time: '18:00:00', city: 'Brisbane', venue_name: 'Brisbane Racquet Hub', currency: 'AUD', entry_fee: '18.00', max_participants: 32, participant_count: 18, gallery_images: [{ image: fallbackEventImage }] },
  { id: 'demo-event-basketball', title: '3x3 Basketball Community Cup', sport_category: 'Basketball', start_date: '2026-06-10', start_time: '18:00:00', city: 'Melbourne', venue_name: 'Melbourne Sports Complex', currency: 'AUD', entry_fee: '25.00', max_participants: 48, participant_count: 26, gallery_images: [{ image: `${API_ORIGIN}/media/events/covers/3x3-basketball-community-cup.jpg` }] },
];

const fallbackSports = quickSports.map((name, index) => ({
  id: `fallback-${name}`,
  name,
  color: ['#2563EB', '#16A34A', '#F97316', '#7C3AED', '#DC2626'][index],
  image_url: fallbackSportImage,
  venue_count: index + 3,
}));

const HomePage = () => {
  const { siteSettings } = useSite();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [coords, setCoords] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const heroSectionRef = useRef(null);
  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';

  const { data: statsData } = useQuery('platform-stats', coreAPI.getPlatformStats, { staleTime: 5 * 60 * 1000 });
  const { data: venuesData, isLoading: venuesLoading } = useQuery(
    'approved-venues',
    () => venuesAPI.getVenues({ status: 'approved', limit: 8 }),
    { staleTime: 5 * 60 * 1000 }
  );
  const { data: eventsData, isLoading: eventsLoading } = useQuery(
    'upcoming-events',
    () => eventsAPI.getEvents({ limit: 6 }),
    { staleTime: 5 * 60 * 1000 }
  );
  const { data: sportsData, isLoading: sportsLoading } = useQuery('sports', venuesAPI.getSports, { staleTime: 10 * 60 * 1000 });

  const venues = Array.isArray(venuesData?.data?.results) && venuesData.data.results.length > 0 ? venuesData.data.results : fallbackVenues;
  const events = Array.isArray(eventsData?.data?.results) && eventsData.data.results.length > 0 ? eventsData.data.results : fallbackEvents;
  const sports = Array.isArray(sportsData?.data) && sportsData.data.length > 0 ? sportsData.data : fallbackSports;
  const stats = statsData?.data || {};

  const heroImage = fallbackImage;

  useEffect(() => {
    const controller = new AbortController();
    const q = searchQuery.trim();
    if (!MAPBOX_TOKEN || q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return undefined;
    }
    const timeout = setTimeout(async () => {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?autocomplete=true&types=place,region,locality,neighborhood,postcode&limit=5&access_token=${MAPBOX_TOKEN}`;
        const response = await fetch(url, { signal: controller.signal });
        const data = await response.json();
        setSuggestions((data?.features || []).map((item) => ({
          id: item.id,
          name: item.place_name,
          center: { latitude: item.center?.[1], longitude: item.center?.[0] },
        })));
        setShowSuggestions(true);
      } catch (_) {
        setSuggestions([]);
      }
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [searchQuery, MAPBOX_TOKEN]);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroSectionRef.current) return;
      setIsScrolled(window.scrollY > heroSectionRef.current.offsetHeight - 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSelectSuggestion = (item) => {
    setSearchQuery(item.name);
    setCoords(item.center);
    setShowSuggestions(false);
  };

  const buildVenueSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedSport) params.set('sport_category', selectedSport);
    if (selectedDate) params.set('date', selectedDate);
    if (coords) {
      params.set('latitude', coords.latitude);
      params.set('longitude', coords.longitude);
      params.set('radius', '10');
    }
    return `/venues?${params.toString()}`;
  };

  const handleSearch = (event) => {
    event.preventDefault();
    window.location.href = buildVenueSearch();
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setCoords({ latitude, longitude });
      if (!MAPBOX_TOKEN) return;
      try {
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`);
        const data = await response.json();
        const place = data?.features?.[0]?.place_name;
        if (place) setSearchQuery(place);
      } catch (_) {
        /* location is still usable without reverse geocoding */
      }
    });
  };

  const statCards = [
    { label: 'Venues Listed', value: stats.total_venues || venues.length, icon: Building2 },
    { label: 'Bookings Completed', value: stats.total_bookings || 'Demo', icon: ShieldCheck },
    { label: 'Events Hosted', value: stats.total_events || events.length, icon: Trophy },
    { label: 'Active Sports', value: sports.length, icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-white">
      <FloatingMenu
        showSearch={isScrolled}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={() => { window.location.href = buildVenueSearch(); }}
      />

      <section ref={heroSectionRef} className="relative overflow-hidden bg-gray-950 text-white">
        <div className="absolute inset-0">
          <img src={heroImage} alt={siteSettings.site_name || 'SportMeet'} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-gray-950/30" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center rounded-md bg-white/10 px-3 py-1 text-sm font-medium text-green-200 ring-1 ring-white/20">
              Discover, Book & Play
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Book Sports Venues & Join Events Near You
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-gray-200">
              Find courts, local events, and sports communities in minutes.
            </p>

            <form onSubmit={handleSearch} className="mt-8 max-w-5xl rounded-md bg-white p-3 text-gray-900 shadow-2xl">
              <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_auto]">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="City, area, or venue"
                    className="h-12 w-full rounded-md border border-gray-200 pl-10 pr-3 text-sm outline-none focus:border-primary-500"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-14 z-20 max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                      {suggestions.map((item) => (
                        <button key={item.id} type="button" onClick={() => handleSelectSuggestion(item)} className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50">
                          {item.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <select
                  value={selectedSport}
                  onChange={(event) => setSelectedSport(event.target.value)}
                  className="h-12 rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-primary-500"
                >
                  <option value="">Any sport</option>
                  {sports.slice(0, 16).map((sport) => (
                    <option key={sport.id} value={sport.name}>{sport.name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="h-12 rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-primary-500"
                />
                <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary-500 px-5 text-sm font-semibold text-white hover:bg-primary-600">
                  <Search className="h-4 w-4" />
                  Find Venues
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" onClick={useMyLocation} className="rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  Locate me
                </button>
                {quickSports.map((sport) => (
                  <Link key={sport} to={`/venues?sport_category=${encodeURIComponent(sport)}`} className="rounded-md bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200">
                    {sport}
                  </Link>
                ))}
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-gray-200 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          {statCards.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="bg-white py-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-50 text-green-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-950">{item.value}</div>
                    <div className="text-sm text-gray-600">{item.label}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-gray-50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Book Venues" link="/venues" linkText="See all venues" />
          {venuesLoading ? (
            <LoadingBlock />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {venues.slice(0, 8).map((venue) => (
                <Link key={venue.id} to={`/venues/${venue.id}`} className="group overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative h-48 overflow-hidden">
                    <img src={mediaUrl(venue.cover_image_url) || mediaUrl(venue.gallery_images?.[0]?.image) || fallbackImage} alt={venue.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    {venue.is_verified && (
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-green-700">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="truncate text-lg font-semibold text-gray-950">{venue.name}</h3>
                    <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{venue.city || 'Location TBD'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {venue.average_rating || 'New'}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {(venue.sport_categories || []).slice(0, 2).map((sport) => (
                        <span key={sport} className="rounded-md bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700">{sport}</span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-950">{venue.min_price ? `$${venue.min_price}/slot` : 'Pricing by court'}</span>
                      <span className="text-xs text-gray-500">{venue.court_count || venue.courts?.length || 1} courts</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Upcoming Events" link="/events" linkText="See all events" />
          {eventsLoading ? (
            <LoadingBlock />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.slice(0, 6).map((event) => {
                const spotsLeft = Number(event.max_participants || event.capacity || 0) - Number(event.participant_count || 0);
                return (
                  <Link key={event.id} to={`/events/${event.id}`} className="group overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <div className="relative h-44 overflow-hidden">
                      <img src={mediaUrl(event.cover_image_url) || mediaUrl(event.gallery_images?.[0]?.image) || fallbackEventImage} alt={event.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      <span className="absolute left-3 top-3 rounded-md bg-primary-500 px-2 py-1 text-xs font-semibold text-white">
                        {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-950">{event.title}</h3>
                      <div className="mt-3 grid gap-2 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-2"><Trophy className="h-4 w-4 text-orange-500" />{event.sport_category || 'Sport'}</span>
                        <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-primary-500" />{(event.start_time || '').slice(0, 5) || 'Time TBD'}</span>
                        <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-red-500" />{event.city || event.venue_city || event.venue_name || 'Location TBD'}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-950">{Number(event.entry_fee || 0) > 0 ? `${event.currency || 'AUD'} $${Number(event.entry_fee).toFixed(2)}` : 'Free'}</span>
                        <span className="text-xs text-gray-500">{spotsLeft > 0 ? `${spotsLeft} spots left` : 'Limited spots'}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="bg-gray-50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Select Sport" link="/sports" linkText="See all sports" />
          {sportsLoading ? (
            <LoadingBlock />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {sports.slice(0, 12).map((sport) => (
                <Link key={sport.id} to={`/venues?sport_category=${encodeURIComponent(sport.name)}`} className="group overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative h-32">
                    <img src={mediaUrl(sport.image_url) || fallbackSportImage} alt={sport.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950/70 to-transparent" />
                    <span className="absolute bottom-3 left-3 text-sm font-bold text-white">{sport.name}</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-3">
                    <span className="text-xs text-gray-600">{sport.venue_count || 0} venues</span>
                    <ArrowRight className="h-4 w-4 text-primary-600 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-primary-500 py-12 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h2 className="text-3xl font-bold">Own a sports venue?</h2>
            <p className="mt-2 max-w-2xl text-primary-50">Start receiving bookings online and manage courts, events, pricing, and customer activity from SportMeet.</p>
          </div>
          <Link to="/register-venue-owner" className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-primary-700 hover:bg-primary-50">
            List Your Venue
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-950">Who We Are</h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              SportMeet connects players, venue owners, and event organizers through one practical booking marketplace. The goal is simple: help communities find places to play and help venues operate with less manual work.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

const SectionHeader = ({ title, link, linkText }) => (
  <div className="mb-8 flex items-end justify-between gap-4">
    <div>
      <h2 className="text-3xl font-bold text-gray-950">{title}</h2>
      <div className="mt-2 h-1 w-14 rounded-full bg-green-500" />
    </div>
    <Link to={link} className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-900">
      {linkText}
      <ArrowRight className="h-4 w-4" />
    </Link>
  </div>
);

const LoadingBlock = () => (
  <div className="flex justify-center py-12">
    <LoadingSpinner size="lg" />
  </div>
);

export default HomePage;
