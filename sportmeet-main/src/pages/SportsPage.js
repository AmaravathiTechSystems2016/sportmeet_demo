import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { venuesAPI } from '../services/api';
import EmptyState from '../components/UI/EmptyState';
import { SkeletonCardGrid } from '../components/UI/Skeleton';
import PageMeta from '../components/SEO/PageMeta';
import {
  ArrowRight,
  CalendarDays,
  Dumbbell,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';

const API_ORIGIN = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '');
const fallbackSportImage = `${API_ORIGIN}/media/demo/generated-sports.png`;

const fallbackSports = [
  'Badminton',
  'Cricket',
  'Football',
  'Basketball',
  'Tennis',
  'Swimming',
  'Volleyball',
  'Futsal',
  'Netball',
  'Squash',
  'Yoga',
  'Boxing',
].map((name, index) => ({
  id: `fallback-${name}`,
  name,
  image_url: fallbackSportImage,
  venue_count: index + 2,
}));

const mediaUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
};

const categoryMap = {
  all: () => true,
  team: (sport) => ['Football', 'Basketball', 'Volleyball', 'Cricket', 'Hockey', 'Netball', 'Futsal'].includes(sport.name),
  racquet: (sport) => ['Tennis', 'Badminton', 'Squash', 'Table Tennis'].includes(sport.name),
  fitness: (sport) => ['Yoga', 'Boxing', 'Martial Arts', 'Running'].includes(sport.name),
  water: (sport) => ['Swimming'].includes(sport.name),
};

const categories = [
  { key: 'all', label: 'All Sports', icon: Sparkles },
  { key: 'team', label: 'Team', icon: Users },
  { key: 'racquet', label: 'Racquet', icon: Trophy },
  { key: 'fitness', label: 'Fitness', icon: Dumbbell },
  { key: 'water', label: 'Water', icon: ShieldCheck },
];

const SportsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { data: sportsData, isLoading } = useQuery('sports', venuesAPI.getSports, { staleTime: 10 * 60 * 1000 });

  const sports = Array.isArray(sportsData?.data) && sportsData.data.length > 0 ? sportsData.data : fallbackSports;

  const filteredSports = useMemo(() => {
    const matcher = categoryMap[selectedCategory] || categoryMap.all;
    const query = searchTerm.trim().toLowerCase();
    return sports
      .filter(matcher)
      .filter((sport) => !query || sport.name.toLowerCase().includes(query));
  }, [searchTerm, selectedCategory, sports]);

  const popularSports = sports
    .slice()
    .sort((a, b) => Number(b.venue_count || 0) - Number(a.venue_count || 0))
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-[#F7FAF8]">
      <PageMeta
        title="Sports Categories"
        description="Browse SportMeet sports categories and find venues for badminton, football, tennis, cricket, basketball, and more."
      />

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <img src={fallbackSportImage} alt="Sports categories" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/50" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-lime-200">
              <Sparkles className="h-4 w-4" />
              Choose a sport and start with venues
            </p>
            <h1 className="text-4xl font-extrabold sm:text-5xl">Explore sports on SportMeet</h1>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Browse sports categories, find venues with available courts, and jump directly into booking or event discovery.
            </p>
            <div className="relative mt-8 max-w-2xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search badminton, cricket, football..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-white pl-11 pr-4 text-slate-950 outline-none focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category) => {
            const Icon = category.icon;
            const active = selectedCategory === category.key;
            return (
              <button
                key={category.key}
                type="button"
                onClick={() => setSelectedCategory(category.key)}
                className={`rounded-2xl border p-4 text-left transition ${
                  active
                    ? 'border-primary-500 bg-primary-500 text-white shadow-lg'
                    : 'border-slate-200 bg-white text-slate-800 shadow-sm hover:border-primary-200 hover:bg-primary-50'
                }`}
              >
                <Icon className={`mb-4 h-6 w-6 ${active ? 'text-white' : 'text-primary-600'}`} />
                <span className="block text-sm font-extrabold">{category.label}</span>
                <span className={`mt-1 block text-xs ${active ? 'text-white/80' : 'text-slate-500'}`}>
                  {sports.filter(categoryMap[category.key] || categoryMap.all).length} available
                </span>
              </button>
            );
          })}
        </div>

        <section>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-primary-700">Sports directory</p>
              <h2 className="mt-1 text-3xl font-extrabold text-slate-950">Sports Categories</h2>
              <p className="mt-2 text-sm text-slate-600">{filteredSports.length} categories match your selection.</p>
            </div>
            <Link to="/venues" className="inline-flex items-center gap-1 text-sm font-extrabold text-primary-700">
              View all venues
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <SkeletonCardGrid count={8} />
          ) : filteredSports.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredSports.map((sport) => <SportCard key={sport.id} sport={sport} />)}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title="No sports found"
              description="Clear search or category filters to browse all available sports."
              action={(
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="btn btn-primary"
                >
                  Clear Filters
                </button>
              )}
            />
          )}
        </section>

        <section className="mt-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-primary-700">Most active</p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-950">Popular Sports</h2>
            </div>
            <Link to="/events" className="inline-flex items-center gap-1 text-sm font-extrabold text-primary-700">
              Explore events
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {popularSports.map((sport) => <SportCard key={`popular-${sport.id}`} sport={sport} compact />)}
          </div>
        </section>

        <section className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            ['Find Venues', 'Search bookable courts by sport, city, date, and price.', MapPin, '/venues'],
            ['Join Events', 'Discover tournaments, training, and social games.', CalendarDays, '/events'],
            ['List a Sport Venue', 'Add your courts and accept online bookings.', ShieldCheck, '/register-venue-owner'],
          ].map(([title, text, Icon, href]) => (
            <Link key={title} to={href} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <Icon className="h-7 w-7 text-primary-600" />
              <h3 className="mt-4 text-lg font-extrabold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold text-primary-700">
                Continue
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
};

const SportCard = ({ sport, compact = false }) => (
  <Link
    to={`/venues?sport_category=${encodeURIComponent(sport.name)}`}
    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
  >
    <div className={compact ? 'relative h-32' : 'relative h-44'}>
      <img
        src={mediaUrl(sport.image_url) || fallbackSportImage}
        alt={sport.name}
        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
      <div className="absolute bottom-3 left-3 right-3">
        <h3 className="font-extrabold text-white">{sport.name}</h3>
      </div>
    </div>
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm font-semibold text-slate-600">{sport.venue_count || 0} venues</span>
      <span className="inline-flex items-center gap-1 text-sm font-extrabold text-primary-700">
        Find
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </div>
  </Link>
);

export default SportsPage;
