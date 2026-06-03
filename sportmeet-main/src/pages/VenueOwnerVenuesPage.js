import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { venuesAPI } from '../services/api';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { 
  Building, 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  MapPin, 
  Star, 
  Calendar,
  DollarSign,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

const VenueOwnerVenuesPage = () => {
  const queryClient = useQueryClient();

  const { data: venuesData, isLoading: venuesLoading, error } = useQuery(
    'my-venues',
    venuesAPI.getUserVenues,
    { staleTime: 2 * 60 * 1000 }
  );

  const venues = Array.isArray(venuesData?.data?.results)
    ? venuesData.data.results
    : (Array.isArray(venuesData?.data) ? venuesData.data : []);

  const deleteVenueMutation = useMutation(
    (venueId) => venuesAPI.deleteVenue(venueId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('my-venues');
        toast.success('Venue deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete venue');
      },
    }
  );

  const handleDeleteVenue = async (venueId, venueName) => {
    if (window.confirm(`Are you sure you want to delete "${venueName}"? This action cannot be undone.`)) {
      await deleteVenueMutation.mutateAsync(venueId);
    }
  };

  if (venuesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Venues</h2>
          <p className="text-gray-600 mb-4">There was an error loading your venues.</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Venues</h1>
              <p className="text-lg text-gray-600">
                Manage your venues and track their performance.
              </p>
            </div>
            <Link to="/venues/create">
              <Button className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Create New Venue</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Venues</p>
                <p className="text-2xl font-semibold text-gray-900">{venues.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approved Venues</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {venues.filter(v => v.status === 'approved').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Rating</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {venues.length > 0 
                    ? (venues.reduce((sum, v) => sum + (v.average_rating || 0), 0) / venues.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${venues.reduce((sum, v) => sum + (v.total_revenue || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Venues List */}
        {venues.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No venues yet</h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first venue and start accepting bookings.
              </p>
              <Link to="/venues/create">
                <Button className="flex items-center space-x-2 mx-auto">
                  <Plus className="w-4 h-4" />
                  <span>Create Your First Venue</span>
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <Card key={venue.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {venue.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">ID: {venue.venue_id}</p>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{venue.city}, {venue.state}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    venue.status === 'approved' 
                      ? 'text-green-600 bg-green-100'
                      : venue.status === 'pending'
                      ? 'text-yellow-600 bg-yellow-100'
                      : 'text-gray-600 bg-gray-100'
                  }`}>
                    {venue.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="w-4 h-4 mr-2" />
                    <span>{venue.sport_categories?.join(', ') || 'No sports listed'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="w-4 h-4 mr-2" />
                    <span>Rating: {venue.average_rating || '0.0'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{venue.courts?.length || 0} courts</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link 
                    to={`/venues/${venue.id}`}
                    className="flex-1 bg-primary-50 hover:bg-primary-100 text-primary-700 px-3 py-2 rounded-lg text-sm font-medium text-center transition-colors"
                  >
                    <Eye className="w-4 h-4 inline mr-1" />
                    View
                  </Link>
                  <Link 
                    to={`/venues/${venue.id}/edit`}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium text-center transition-colors"
                  >
                    <Edit className="w-4 h-4 inline mr-1" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteVenue(venue.id, venue.name)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    disabled={deleteVenueMutation.isLoading}
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" />
                    Delete
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueOwnerVenuesPage;
