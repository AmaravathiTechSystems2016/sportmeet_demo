import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { eventsAPI } from '../services/api';
import Button from '../components/UI/Button';
import EmptyState from '../components/UI/EmptyState';
import { SkeletonCardGrid } from '../components/UI/Skeleton';
import PageMeta from '../components/SEO/PageMeta';
import {
  ArrowRight,
  Calendar,
  Clock,
  DollarSign,
  Grid,
  List,
  MapPin,
  Search,
  Trophy,
  Users,
} from 'lucide-react';

const API_ORIGIN = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '');
const fallbackEventImage = `${API_ORIGIN}/media/demo/generated-event.png`;

const mediaUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
};

const fallbackEvents = [
  { id: 'demo-tennis-ladder', title: 'Friday Night Tennis Ladder', sport_category: 'Tennis', event_type: 'tournament', start_date: '2026-06-12', start_time: '18:00:00', end_time: '21:00:00', city: 'Brisbane', venue_name: 'Brisbane Racquet Hub', currency: 'AUD', entry_fee: '18.00', max_participants: 32, participant_count: 18, cover_image_url: fallbackEventImage },
  { id: 'demo-basketball-cup', title: '3x3 Basketball Community Cup', sport_category: 'Basketball', event_type: 'competition', start_date: '2026-06-20', start_time: '17:30:00', end_time: '20:30:00', city: 'Melbourne', venue_name: 'Melbourne Sports Complex', currency: 'AUD', entry_fee: '25.00', max_participants: 48, participant_count: 26, cover_image_url: `${API_ORIGIN}/media/events/covers/3x3-basketball-community-cup.jpg` },
  { id: 'demo-cricket-social', title: 'Sunday Cricket Social', sport_category: 'Cricket', event_type: 'social', start_date: '2026-06-28', start_time: '09:00:00', end_time: '12:00:00', city: 'Sydney', venue_name: 'Sydney Athletic Centre', currency: 'AUD', entry_fee: '0.00', max_participants: 24, participant_count: 11, cover_image_url: fallbackEventImage },
];

const eventTypes = [
  { value: '', label: 'All types' },
  { value: 'tournament', label: 'Tournament' },
  { value: 'league', label: 'League' },
  { value: 'training', label: 'Training' },
  { value: 'social', label: 'Social' },
  { value: 'competition', label: 'Competition' },
];

const EventsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ event_type: '', sport_category: '', city: '', price: '' });
  const [viewMode, setViewMode] = useState('grid');

  const { data: eventsData, isLoading, error } = useQuery(
    ['events', searchTerm, filters],
    () => eventsAPI.getEvents({
      search: searchTerm || undefined,
      event_type: filters.event_type || undefined,
      sport_category: filters.sport_category || undefined,
      city: filters.city || undefined,
    }),
    { staleTime: 5 * 60 * 1000 }
  );

  const rawEvents = Array.isArray(eventsData?.data?.results) && eventsData.data.results.length > 0
    ? eventsData.data.results
    : Array.isArray(eventsData?.data) && eventsData.data.length > 0
    ? eventsData.data
    : fallbackEvents;

  const events = useMemo(() => rawEvents.filter((event) => {
    if (filters.price === 'free' && Number(event.entry_fee || 0) > 0) return false;
    if (filters.price === 'paid' && Number(event.entry_fee || 0) <= 0) return false;
    return true;
  }), [rawEvents, filters.price]);

  const sportOptions = Array.from(new Set(rawEvents.map((event) => event.sport_category).filter(Boolean))).sort();
  const cityOptions = Array.from(new Set(rawEvents.map((event) => event.city || event.venue_city).filter(Boolean))).sort();
  const freeCount = rawEvents.filter((event) => Number(event.entry_fee || 0) <= 0).length;

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({ event_type: '', sport_category: '', city: '', price: '' });
  };

  return (
    <div className="min-h-screen bg-[#F7FAF8]">
      <PageMeta
        title="Sports Events"
        description="Discover tournaments, leagues, socials, and community sports events near you."
      />

      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-end">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-lime-200">
                <Trophy className="h-4 w-4" />
                Tournaments, socials, training, and leagues
              </p>
              <h1 className="text-4xl font-extrabold sm:text-5xl">Join sports events near you</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Find local competitions, open games, training sessions, and community events with clear dates, pricing, and spots left.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/8 p-3 ring-1 ring-white/10">
              <Stat value={rawEvents.length} label="events" />
              <Stat value={sportOptions.length || 'Multi'} label="sports" />
              <Stat value={freeCount} label="free" />
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white p-3 text-slate-950 shadow-2xl">
            <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  placeholder="Search events, sports, venues, or cities"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-primary-500"
                />
              </div>
              <select value={filters.sport_category} onChange={(event) => setFilters((current) => ({ ...current, sport_category: event.target.value }))} className="h-12 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary-500">
                <option value="">All sports</option>
                {sportOptions.map((sport) => <option key={sport} value={sport}>{sport}</option>)}
              </select>
              <select value={filters.city} onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))} className="h-12 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary-500">
                <option value="">All cities</option>
                {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
              <select value={filters.price} onChange={(event) => setFilters((current) => ({ ...current, price: event.target.value }))} className="h-12 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary-500">
                <option value="">Any price</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
              <Button type="button" variant="outline" onClick={clearFilters} className="h-12 justify-center">
                Clear
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-primary-700">Event discovery</p>
            <h2 className="mt-1 text-3xl font-extrabold text-slate-950">{events.length} events available</h2>
            <p className="mt-2 text-sm text-slate-600">Use filters to narrow by sport, city, price, and event format.</p>
          </div>
          <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button type="button" onClick={() => setViewMode('grid')} aria-label="Grid view" className={`rounded-lg p-2 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Grid className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => setViewMode('list')} aria-label="List view" className={`rounded-lg p-2 ${viewMode === 'list' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
            Showing demo events while the API is unavailable.
          </div>
        )}

        {isLoading ? (
          <SkeletonCardGrid count={6} />
        ) : events.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No events found"
            description="Try clearing filters or check back for new tournaments and social sessions."
            action={<Button onClick={clearFilters}>Clear Filters</Button>}
          />
        ) : (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {events.map((event) => <EventCard key={event.id} event={event} list={viewMode === 'list'} />)}
          </div>
        )}
      </main>
    </div>
  );
};

const Stat = ({ value, label }) => (
  <div className="rounded-xl bg-white/10 px-3 py-4 text-center">
    <div className="text-2xl font-black text-white">{value}</div>
    <div className="text-xs font-bold uppercase tracking-wide text-slate-300">{label}</div>
  </div>
);

const EventCard = ({ event, list = false }) => {
  const capacity = Number(event.max_participants || event.capacity || 0);
  const participants = Number(event.participant_count || event.participants_count || 0);
  const spotsLeft = capacity > 0 ? Math.max(capacity - participants, 0) : null;
  const progress = capacity > 0 ? Math.min(100, Math.round((participants / capacity) * 100)) : 35;
  const image = mediaUrl(event.gallery_images?.[0]?.image) || mediaUrl(event.cover_image_url || event.cover_image) || fallbackEventImage;
  const dateLabel = event.start_date ? new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBD';

  return (
    <Link to={`/events/${event.id}`} className={`group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${list ? 'md:grid md:grid-cols-[300px_1fr]' : ''}`}>
      <div className={`relative ${list ? 'h-64 md:h-full' : 'aspect-video'}`}>
        <img src={image} alt={event.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-full bg-primary-500 px-3 py-1 text-xs font-bold text-white shadow-sm">{dateLabel}</span>
        <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-900 shadow-sm">
          {Number(event.entry_fee || 0) > 0 ? `${event.currency || 'AUD'} $${Number(event.entry_fee).toFixed(0)}` : 'Free'}
        </span>
      </div>

      <div className="p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700">{event.sport_category || 'Sport'}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize text-slate-700">{event.event_type || 'Event'}</span>
        </div>
        <h3 className="text-xl font-extrabold text-slate-950 group-hover:text-primary-700">{event.title}</h3>
        <div className="mt-4 grid gap-2 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-primary-600" />{(event.start_time || 'TBD').slice(0, 5)} - {(event.end_time || 'TBD').slice(0, 5)}</span>
          <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-red-500" />{event.venue_name || 'Venue TBD'}{(event.city || event.venue_city) ? `, ${event.city || event.venue_city}` : ''}</span>
          <span className="inline-flex items-center gap-2"><DollarSign className="h-4 w-4 text-amber-500" />{Number(event.entry_fee || 0) > 0 ? `${event.currency || 'AUD'} $${Number(event.entry_fee).toFixed(2)}` : 'Free registration'}</span>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-600">
            <span>{participants} joined{capacity ? ` / ${capacity}` : ''}</span>
            <span>{spotsLeft === null ? 'Open capacity' : spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full soon'}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-primary-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mt-5 inline-flex items-center gap-1 text-sm font-extrabold text-primary-700">
          Register Now
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
};

export default EventsPage;
