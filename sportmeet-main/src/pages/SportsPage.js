import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { venuesAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { ArrowRight, Search, Sparkles } from 'lucide-react';

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
  color: ['#2eaf57', '#16A34A', '#F97316', '#0F766E', '#DC2626', '#0891B2'][index % 6],
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
  { key: 'all', label: 'All Sports' },
  { key: 'team', label: 'Team' },
  { key: 'racquet', label: 'Racquet' },
  { key: 'fitness', label: 'Fitness' },
  { key: 'water', label: 'Water' },
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

  if (isLoading && sports.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gray-950 py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1 text-sm font-medium text-green-200">
              <Sparkles className="h-4 w-4" />
              Choose a sport and start with venues
            </p>
            <h1 className="text-4xl font-bold sm:text-5xl">Explore Sports</h1>
            <p className="mt-4 text-lg text-gray-300">
              Browse categories, compare available venues, and jump straight into booking.
            </p>
            <div className="relative mt-8 max-w-2xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search sports"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-12 w-full rounded-md border border-white/10 bg-white pl-11 pr-4 text-gray-950 outline-none focus:border-green-500"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.key}
              type="button"
              onClick={() => setSelectedCategory(category.key)}
              className={`rounded-md px-4 py-2 text-sm font-semibold ${
                selectedCategory === category.key
                  ? 'bg-primary-500 text-white'
                  : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-950">Sports Categories</h2>
            <p className="mt-1 text-sm text-gray-600">{filteredSports.length} categories available</p>
          </div>
          <Link to="/venues" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700">
            View venues
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {filteredSports.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filteredSports.map((sport) => (
              <SportCard key={sport.id} sport={sport} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-gray-300 bg-white p-10 text-center">
            <h3 className="text-lg font-semibold text-gray-950">No sports found</h3>
            <p className="mt-2 text-sm text-gray-600">Clear the filters to browse every available sport.</p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="mt-4 rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Clear Filters
            </button>
          </div>
        )}

        <div className="mt-14">
          <h2 className="text-2xl font-bold text-gray-950">Popular Sports</h2>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {popularSports.map((sport) => (
              <SportCard key={`popular-${sport.id}`} sport={sport} compact />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const SportCard = ({ sport, compact = false }) => (
  <Link
    to={`/venues?sport_category=${encodeURIComponent(sport.name)}`}
    className="group overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
  >
    <div className={compact ? 'relative h-28' : 'relative h-40'}>
      <img
        src={mediaUrl(sport.image_url) || fallbackSportImage}
        alt={sport.name}
        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950/75 to-transparent" />
      <div className="absolute bottom-3 left-3 right-3">
        <h3 className="font-bold text-white">{sport.name}</h3>
      </div>
    </div>
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-gray-600">{sport.venue_count || 0} venues</span>
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700">
        Find
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </div>
  </Link>
);

export default SportsPage;
