import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { venuesAPI, eventsAPI } from '../services/api';
import { useSite } from '../contexts/SiteContext';
import FloatingMenu from '../components/Layout/FloatingMenu';
import PageMeta from '../components/SEO/PageMeta';
import { SkeletonCardGrid } from '../components/UI/Skeleton';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Heart,
  HelpCircle,
  MapPin,
  Phone,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap,
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
const popularCities = ['Melbourne', 'Sydney', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Gold Coast', 'Hobart'];

const fallbackVenues = [
  { id: 'demo-melbourne', name: 'Melbourne Sports Complex', city: 'Melbourne', state: 'VIC', average_rating: '5.0', total_reviews: 28, min_price: '25.00', court_count: 4, sport_categories: ['Basketball', 'Tennis'], cover_image_url: fallbackImage, is_verified: true, is_featured: true },
  { id: 'demo-sydney', name: 'Sydney Athletic Centre', city: 'Sydney', state: 'NSW', average_rating: '4.8', total_reviews: 34, min_price: '30.00', court_count: 5, sport_categories: ['Football', 'Cricket'], cover_image_url: `${API_ORIGIN}/media/venues/covers/sydney-athletic-centre.jpg`, is_verified: true },
  { id: 'demo-brisbane', name: 'Brisbane Racquet Hub', city: 'Brisbane', state: 'QLD', average_rating: '4.9', total_reviews: 19, min_price: '18.00', court_count: 3, sport_categories: ['Tennis', 'Badminton'], cover_image_url: `${API_ORIGIN}/media/venues/covers/brisbane-racquet-hub.jpg`, is_verified: true },
];

const fallbackEvents = [
  { id: 'demo-event-tennis', title: 'Friday Night Tennis Ladder', event_type: 'Social', sport_category: 'Tennis', start_date: '2026-06-12', start_time: '18:00:00', city: 'Brisbane', venue_name: 'Brisbane Racquet Hub', currency: 'AUD', entry_fee: '18.00', max_participants: 32, participant_count: 18, cover_image_url: fallbackEventImage },
  { id: 'demo-event-basketball', title: '3x3 Basketball Community Cup', event_type: 'Tournament', sport_category: 'Basketball', start_date: '2026-06-20', start_time: '17:30:00', city: 'Melbourne', venue_name: 'Melbourne Sports Complex', currency: 'AUD', entry_fee: '25.00', max_participants: 48, participant_count: 26, cover_image_url: `${API_ORIGIN}/media/events/covers/3x3-basketball-community-cup.jpg` },
  { id: 'demo-event-cricket', title: 'Sunday Cricket Social', event_type: 'Social', sport_category: 'Cricket', start_date: '2026-06-28', start_time: '09:00:00', city: 'Sydney', venue_name: 'Sydney Athletic Centre', currency: 'AUD', entry_fee: '0.00', max_participants: 24, participant_count: 11, cover_image_url: fallbackEventImage },
];

const fallbackSports = [
  'Football',
  'Cricket',
  'Badminton',
  'Tennis',
  'Basketball',
  'Swimming',
  'Volleyball',
  'Futsal',
  'Squash',
  'Yoga',
  'Boxing',
  'Hockey',
].map((name, index) => ({
  id: `fallback-${name}`,
  name,
  image_url: fallbackSportImage,
  venue_count: index + 3,
}));

const HomePage = () => {
  const { siteSettings } = useSite();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [coords, setCoords] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [recentVenues, setRecentVenues] = useState([]);
  const heroSectionRef = useRef(null);
  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';

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
  const heroImage = fallbackImage;

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('sportmeet_recent_venues') || '[]');
    setRecentVenues(Array.isArray(stored) ? stored : []);
  }, []);

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

  const buildVenueSearch = (extra = {}) => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedSport) params.set('sport_category', selectedSport);
    if (selectedDate) params.set('date', selectedDate);
    if (selectedTime) params.set('time', selectedTime);
    if (coords) {
      params.set('latitude', coords.latitude);
      params.set('longitude', coords.longitude);
      params.set('radius', '10');
    }
    Object.entries(extra).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return `/venues?${params.toString()}`;
  };

  const handleSearch = (event) => {
    event.preventDefault();
    window.location.href = buildVenueSearch();
  };

  const handleSelectSuggestion = (item) => {
    setSearchQuery(item.name);
    setCoords(item.center);
    setShowSuggestions(false);
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

  const cityStats = useMemo(() => popularCities.map((city) => {
    const cityVenues = venues.filter((venue) => String(venue.city || '').toLowerCase() === city.toLowerCase());
    const sportsSet = new Set(cityVenues.flatMap((venue) => venue.sport_categories || []));
    return {
      city,
      count: cityVenues.length || Math.max(1, Math.floor((city.length + venues.length) / 3)),
      sports: Array.from(sportsSet).slice(0, 3),
    };
  }), [venues]);

  return (
    <div className="min-h-screen bg-[#F7FAF8]">
      <PageMeta
        title="Book Courts, Join Events, and Play More"
        description="Find verified sports venues, compare courts, and reserve your next session in minutes."
        image={fallbackImage}
      />
      <FloatingMenu
        showSearch={isScrolled}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={() => { window.location.href = buildVenueSearch(); }}
      />

      <section ref={heroSectionRef} className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <img src={heroImage} alt={siteSettings.site_name || 'SportMeet'} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/82 to-slate-950/25" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 lg:px-8 lg:pb-20 lg:pt-24">
          <div className="max-w-4xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-lime-100 ring-1 ring-white/20">
              <Zap className="h-4 w-4 text-lime-200" />
              Find a place, book fast, play more
            </p>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Book Courts, Join Events, and Play More
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
              Find verified sports venues, compare courts, and reserve your next session in minutes.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {['Verified venues', 'Instant booking', 'Secure payments', 'Local events'].map((label) => (
                <span key={label} className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/15">
                  {label}
                </span>
              ))}
            </div>
          </div>

          <form onSubmit={handleSearch} className="mt-8 max-w-6xl rounded-2xl border border-white/20 bg-white p-3 text-slate-950 shadow-2xl">
            <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_0.9fr_0.8fr_auto]">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="City, area, or venue"
                  className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-primary-500"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-14 z-20 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                    {suggestions.map((item) => (
                      <button key={item.id} type="button" onClick={() => handleSelectSuggestion(item)} className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50">
                        {item.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <select
                value={selectedSport}
                onChange={(event) => setSelectedSport(event.target.value)}
                className="h-12 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary-500"
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
                className="h-12 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary-500"
              />
              <input
                type="time"
                value={selectedTime}
                onChange={(event) => setSelectedTime(event.target.value)}
                className="h-12 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary-500"
              />
              <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-bold text-white hover:bg-primary-600">
                <Search className="h-4 w-4" />
                Find Venues
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={useMyLocation} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                Near me
              </button>
              <Link to="/events" className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                Explore Events
              </Link>
              <Link to={buildVenueSearch({ date: new Date().toISOString().slice(0, 10) })} className="rounded-xl bg-lime-100 px-3 py-2 text-xs font-bold text-slate-900">
                Available today
              </Link>
              {quickSports.map((sport) => (
                <Link key={sport} to={`/venues?sport_category=${encodeURIComponent(sport)}`} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                  {sport}
                </Link>
              ))}
            </div>
          </form>
        </div>
      </section>

      <SectionWrap>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Book a Court', text: 'Reserve football, tennis, badminton, cricket, and more.', icon: CalendarDays, href: '/venues', cta: 'Find venues' },
            { title: 'Join an Event', text: 'Discover tournaments, training, socials, and community games.', icon: Trophy, href: '/events', cta: 'Explore events' },
            { title: 'Find Sports Near Me', text: 'Search by city, area, sport, and nearby locations.', icon: MapPin, href: '/venues', cta: 'Search nearby' },
            { title: 'List My Venue', text: 'Accept bookings, manage courts, and grow repeat customers.', icon: Building2, href: '/register-venue-owner', cta: 'Start listing' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} to={item.href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary-200 hover:shadow-lg">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary-700">
                  {item.cta}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </SectionWrap>

      <SectionWrap id="how-it-works" eyebrow="How it works" title="Book your next game in 3 simple steps" subtitle="SportMeet keeps the core booking path simple: search, compare, then book and play.">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ['Search', 'Choose your city, sport, date, and time.', Search],
            ['Compare', 'View courts, prices, ratings, and amenities.', Star],
            ['Book & Play', 'Confirm your slot and show up ready to play.', Play],
          ].map(([title, text, Icon], index) => (
            <div key={title} className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-4xl font-black text-slate-100">{index + 1}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </SectionWrap>

      <SectionWrap eyebrow="Verified venues" title="Featured Sports Venues" subtitle="Explore venues with courts, amenities, flexible booking options, and clear pricing." action={<SectionLink href="/venues" label="See all venues" />}>
        {venuesLoading ? <SkeletonCardGrid count={4} /> : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {venues.slice(0, 8).map((venue) => <VenueCard key={venue.id} venue={venue} />)}
          </div>
        )}
      </SectionWrap>

      <SectionWrap eyebrow="Book soon" title="Popular this week" subtitle="Availability search will power this section later; for now these highlighted venues are ready for demo browsing.">
        <div className="grid gap-4 md:grid-cols-3">
          {venues.slice(0, 3).map((venue, index) => (
            <Link key={venue.id} to={`/venues/${venue.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-primary-700">{['Today', 'This week', 'Weekend'][index] || 'Soon'}</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-950">{venue.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{venue.city || 'Location TBD'} - {venue.sport_categories?.[0] || 'Sport'}</p>
                </div>
                <Clock className="h-5 w-5 text-slate-400" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">{venue.min_price ? `$${venue.min_price}/slot` : 'Pricing by court'}</span>
                <span className="inline-flex items-center gap-1 text-sm font-bold text-primary-700">Book Now <ChevronRight className="h-4 w-4" /></span>
              </div>
            </Link>
          ))}
        </div>
      </SectionWrap>

      <SectionWrap eyebrow="Explore by sport" title="Popular Sports" subtitle="Find courts and events by the sport you want to play." action={<SectionLink href="/sports" label="All sports" />}>
        {sportsLoading ? <SkeletonCardGrid count={6} /> : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {sports.slice(0, 12).map((sport) => (
              <Link key={sport.id} to={`/venues?sport_category=${encodeURIComponent(sport.name)}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="relative aspect-[4/3]">
                  <img src={mediaUrl(sport.image_url) || fallbackSportImage} alt={sport.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 to-transparent" />
                  <span className="absolute bottom-3 left-3 text-sm font-extrabold text-white">{sport.name}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-3">
                  <span className="text-xs text-slate-600">{sport.venue_count || 0} venues</span>
                  <ArrowRight className="h-4 w-4 text-primary-600 transition group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionWrap>

      <SectionWrap eyebrow="Community games" title="Upcoming Sports Events" subtitle="Join tournaments, social games, training sessions, and local sports communities." action={<SectionLink href="/events" label="See all events" />}>
        {eventsLoading ? <SkeletonCardGrid count={3} /> : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.slice(0, 6).map((event) => <EventCard key={event.id} event={event} />)}
          </div>
        )}
      </SectionWrap>

      <SectionWrap eyebrow="Local discovery" title="Find sports venues by city" subtitle="Explore popular areas and future SEO-friendly city pages.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cityStats.map((city) => (
            <Link key={city.city} to={`/venues?city=${encodeURIComponent(city.city)}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary-200 hover:shadow-lg">
              <MapPin className="mb-4 h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-bold text-slate-950">{city.city}</h3>
              <p className="mt-1 text-sm text-slate-600">{city.count} venues nearby</p>
              <p className="mt-3 min-h-[20px] text-xs font-medium text-slate-500">{city.sports.length > 0 ? city.sports.join(', ') : 'Popular sports available'}</p>
            </Link>
          ))}
        </div>
      </SectionWrap>

      {recentVenues.length > 0 && (
        <SectionWrap eyebrow="Personalized" title="Continue where you left off" subtitle="Recently viewed venues are saved locally on this device.">
          <div className="grid gap-4 md:grid-cols-4">
            {recentVenues.slice(0, 4).map((venue) => (
              <Link key={venue.id} to={`/venues/${venue.id}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                  <img src={mediaUrl(venue.image) || fallbackImage} alt={venue.name} className="h-full w-full object-cover" />
                </div>
                <h3 className="mt-3 truncate text-sm font-bold text-slate-950">{venue.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{venue.city || 'Venue'} - View again</p>
              </Link>
            ))}
          </div>
        </SectionWrap>
      )}

      <SectionWrap>
        <div className="overflow-hidden rounded-3xl bg-slate-950 text-white">
          <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-lime-200">For venue owners</p>
              <h2 className="mt-3 text-3xl font-extrabold md:text-4xl">Run your sports venue online with SportMeet</h2>
              <p className="mt-4 max-w-2xl text-slate-300">Manage courts, accept bookings, track payments, and grow repeat customers from one dashboard.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ['Manage Courts', 'Add courts, prices, availability, and sports.'],
                  ['Accept Bookings', 'Let players book slots online anytime.'],
                  ['Track Revenue', 'Monitor bookings, reviews, and growth.'],
                  ['Build Trust', 'Show verified profiles, photos, and ratings.'],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-1 text-sm text-slate-300">{text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/register-venue-owner" className="inline-flex items-center justify-center rounded-xl bg-primary-500 px-5 py-3 text-sm font-bold text-white hover:bg-primary-600">List Your Venue</Link>
                <Link to="/venue-owner-guide" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">Read Owner Guide</Link>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white p-5 text-slate-950 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Today</p>
                  <h3 className="text-xl font-extrabold">Owner dashboard</h3>
                </div>
                <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">Live preview</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ['Bookings', '24'],
                  ['Revenue', '$1,280'],
                  ['Rating', '4.8'],
                  ['Reviews', '18'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-500">{label}</p>
                    <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">Next booking</p>
                <p className="mt-1 text-sm text-slate-600">Court 2 - Badminton - 6:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </SectionWrap>

      <SectionWrap eyebrow="Trust" title="Why players choose SportMeet" subtitle="The booking experience is designed around clarity, trust, and local sports access.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Verified Venues', 'Find venues with trust signals, photos, ratings, and policies.', ShieldCheck],
            ['Transparent Pricing', 'Compare court prices before booking.', CircleDollarSign],
            ['Local Events', 'Discover tournaments, social games, and training sessions.', Users],
            ['Secure Payments', 'Payment flow is designed for Stripe-backed checkout.', BadgeCheck],
            ['Reviews & Ratings', 'Use real player feedback to choose better venues.', Star],
            ['Easy Slot Booking', 'Choose court, date, time, and confirm in one flow.', CalendarDays],
          ].map(([title, text, Icon]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="h-6 w-6 text-primary-600" />
              <h3 className="mt-4 font-bold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </SectionWrap>

      <SectionWrap eyebrow="Help" title="Questions before you book?" subtitle="A compact help preview keeps new users confident before they choose a venue.">
        <div className="grid gap-3 md:grid-cols-2">
          {[
            'How do I book a venue?',
            'Can I cancel a booking?',
            'Are venues verified?',
            'Can venue owners list multiple courts?',
            'Are payments secure?',
          ].map((question) => (
            <Link key={question} to="/faq" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-900 hover:border-primary-200 hover:bg-primary-50">
              <span className="inline-flex items-center gap-3"><HelpCircle className="h-5 w-5 text-primary-600" />{question}</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
          ))}
        </div>
      </SectionWrap>

      <SectionWrap>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-primary-700">Coming soon</p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">SportMeet on the go</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">Save favorite venues, manage bookings, and discover nearby sports events from anywhere.</p>
            </div>
            <Link to="/support" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50">
              <Phone className="h-4 w-4" />
              Notify me
            </Link>
          </div>
        </div>
      </SectionWrap>
    </div>
  );
};

const SectionWrap = ({ eyebrow, title, subtitle, action, children, id }) => (
  <section id={id} className="py-12 md:py-16">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {(eyebrow || title || subtitle || action) && (
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            {eyebrow && <p className="mb-2 text-sm font-bold uppercase tracking-wide text-primary-700">{eyebrow}</p>}
            {title && <h2 className="text-3xl font-extrabold text-slate-950 md:text-4xl">{title}</h2>}
            {subtitle && <p className="mt-3 text-base leading-7 text-slate-600">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  </section>
);

const SectionLink = ({ href, label }) => (
  <Link to={href} className="inline-flex items-center gap-1 text-sm font-bold text-primary-700 hover:text-primary-900">
    {label}
    <ArrowRight className="h-4 w-4" />
  </Link>
);

const VenueCard = ({ venue }) => (
  <Link to={`/venues/${venue.id}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
    <div className="relative aspect-[4/3] overflow-hidden">
      <img src={mediaUrl(venue.cover_image_url) || mediaUrl(venue.gallery_images?.[0]?.image) || fallbackImage} alt={venue.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      <span aria-label="Save venue" className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm">
        <Heart className="h-4 w-4" />
      </span>
      {(venue.is_verified || venue.is_featured) && (
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-primary-700">
          <ShieldCheck className="h-3 w-3" />
          {venue.is_featured ? 'Featured' : 'Verified'}
        </span>
      )}
    </div>
    <div className="p-4">
      <h3 className="truncate text-lg font-extrabold text-slate-950">{venue.name}</h3>
      <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
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
          <span key={sport} className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700">{sport}</span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-sm font-extrabold text-slate-950">{venue.min_price ? `$${venue.min_price}/slot` : 'Pricing by court'}</span>
        <span className="inline-flex items-center gap-1 text-sm font-bold text-primary-700">View & Book <ArrowRight className="h-4 w-4" /></span>
      </div>
    </div>
  </Link>
);

const EventCard = ({ event }) => {
  const spotsLeft = Math.max(Number(event.max_participants || event.capacity || 0) - Number(event.participant_count || 0), 0);
  const capacity = Number(event.max_participants || event.capacity || 0);
  const filled = Number(event.participant_count || 0);
  const progress = capacity > 0 ? Math.min(100, Math.round((filled / capacity) * 100)) : 45;

  return (
    <Link to={`/events/${event.id}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-video overflow-hidden">
        <img src={mediaUrl(event.cover_image_url) || mediaUrl(event.gallery_images?.[0]?.image) || fallbackEventImage} alt={event.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-full bg-primary-500 px-3 py-1 text-xs font-bold text-white">
          {event.start_date ? new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Soon'}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-900">
          {Number(event.entry_fee || 0) > 0 ? `${event.currency || 'AUD'} $${Number(event.entry_fee).toFixed(0)}` : 'Free'}
        </span>
      </div>
      <div className="p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{event.sport_category || 'Sport'}</span>
          <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700">{event.event_type || 'Event'}</span>
        </div>
        <h3 className="text-lg font-extrabold text-slate-950">{event.title}</h3>
        <div className="mt-3 grid gap-2 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-primary-500" />{(event.start_time || '').slice(0, 5) || 'Time TBD'}</span>
          <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-red-500" />{event.city || event.venue_city || event.venue_name || 'Location TBD'}</span>
        </div>
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-600">
            <span>{filled} / {capacity || 'many'} spots filled</span>
            <span>{spotsLeft > 0 ? `${spotsLeft} left` : 'Limited'}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-primary-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary-700">
          Register Now
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
};

export default HomePage;
