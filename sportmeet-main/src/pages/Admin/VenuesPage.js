import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import { venuesAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  Star,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  DollarSign,
  Building
} from 'lucide-react';
import toast from 'react-hot-toast';

const VenuesPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const { data: venuesData, isLoading, error, refetch } = useQuery(
    ['admin-venues', searchTerm, statusFilter, currentPage],
    () => venuesAPI.getAdminVenues({
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      page: currentPage,
      limit: itemsPerPage
    }),
    {
      keepPreviousData: false, // Disable cache to force fresh data
      staleTime: 0, // Data is immediately stale
      cacheTime: 0, // Don't cache data
      onError: (error) => {
        console.error('Venues API Error:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
      },
      onSuccess: (data) => {
        console.log('Venues loaded successfully:', data);
      }
    }
  );

  const venues = Array.isArray(venuesData?.data?.results) ? venuesData.data.results : 
                 Array.isArray(venuesData?.data) ? venuesData.data : 
                 Array.isArray(venuesData?.results) ? venuesData.results : [];
  const totalPages = Math.ceil((venuesData?.data?.count || venuesData?.count || 0) / itemsPerPage);
  
  // Debug: Log venue data structure
  console.log('Venues data structure:', venuesData);
  console.log('Venues array:', venues);
  console.log('First venue:', venues[0]);
  if (venues[0]) {
    console.log('First venue status:', venues[0].status);
  }


  const handleStatusChange = async (venueId, newStatus) => {
    try {
      console.log(`Updating venue ${venueId} status to ${newStatus}`);
      
      const response = await venuesAPI.updateVenueStatus(venueId, newStatus);
      console.log('Status update response:', response);
      console.log('Response data:', response.data);
      console.log('Updated venue status in response:', response.data?.status);
      toast.success(`Venue status updated to ${newStatus}`);
      
      // Clear all caches completely but preserve auth token
      queryClient.clear();
      // Don't clear localStorage completely - preserve auth token
      // localStorage.clear();
      
      // Force immediate refetch with fresh data
      const newData = await refetch();
      console.log('Refetch completed, new data:', newData);
      console.log('Updated venue in new data:', newData?.data?.results?.find(v => v.id === venueId));
      
      // Force another refetch after a short delay to ensure UI updates
      setTimeout(async () => {
        await refetch();
      }, 200);
      
    } catch (error) {
      console.error('Status update error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error(`Failed to update venue status: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleDelete = async (venueId) => {
    if (window.confirm('Are you sure you want to delete this venue? This action cannot be undone.')) {
      try {
        await venuesAPI.deleteVenue(venueId);
        toast.success('Venue deleted successfully');
        
        // Clear all venue-related cache and refetch
        queryClient.removeQueries(['admin-venues']);
        queryClient.removeQueries(['venue', venueId]);
        queryClient.removeQueries(['venues']);
        
        // Force immediate refetch with fresh data
        await refetch();
        
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete venue');
      }
    }
  };

  const handleView = (venueId) => {
    // Navigate to venue detail page or open in new tab
    window.open(`/venues/${venueId}`, '_blank');
  };

  const handleEdit = (venueId) => {
    // Navigate to edit venue page
    window.location.href = `/admin/venues/${venueId}/edit`;
  };

  const getStatusBadge = (status) => {
    console.log('getStatusBadge called with status:', status);
    if (!status) {
      console.log('Status is undefined, defaulting to pending');
      status = 'pending'; // Default to pending if status is undefined
    }
    
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      inactive: { color: 'bg-red-100 text-red-800', icon: XCircle },
      rejected: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Venues</h2>
        <p className="text-red-600 mb-2">Failed to load venues data</p>
        <p className="text-gray-600 mb-4">Error: {error.message}</p>
        <p className="text-sm text-gray-500 mb-4">
          Status: {error.response?.status} | 
          Response: {JSON.stringify(error.response?.data)}
        </p>
        <div className="space-x-4">
          <Button onClick={() => refetch()}>Try Again</Button>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Venues Management</h1>
          <p className="text-gray-600">Manage all venues and their details</p>
        </div>
        <div className="flex space-x-2">
          <Link to="/admin/venues/create">
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Create Venue</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search venues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="rejected">Rejected</option>
            </select>
            <Button variant="outline" className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Venues List */}
      <div className="grid gap-6">
        {venues.length === 0 ? (
          <Card className="p-12 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No venues found</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first venue</p>
            <Link to="/admin/venues/create">
              <Button>Create Venue</Button>
            </Link>
          </Card>
        ) : (
          venues.map((venue) => (
            <Card key={venue.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{venue.name || 'Unnamed Venue'}</h3>
                    <span className="text-sm text-gray-500 font-mono">#{venue.venue_id || 'N/A'}</span>
                    {console.log('Rendering venue:', venue.id, 'with status:', venue.status)}
                    {getStatusBadge(venue.status)}
                    {venue.is_featured && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Featured
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{venue.city || 'N/A'}, {venue.state || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Phone className="w-4 h-4" />
                      <span>{venue.phone_number || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Mail className="w-4 h-4" />
                      <span>{venue.email || 'N/A'}</span>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4 line-clamp-2">{venue.description || 'No description available'}</p>

                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>Owner: {venue.owner_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4" />
                      <span>Currency: {venue.currency || 'AUD'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>Rating: {venue.average_rating || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Building className="w-4 h-4" />
                      <span>Code: {venue.venue_id || 'N/A'}</span>
                    </div>
                  </div>

                  {(() => {
                    console.log('Venue sport_categories:', venue.sport_categories, 'Type:', typeof venue.sport_categories, 'Is Array:', Array.isArray(venue.sport_categories));
                    
                    // Handle different data types for sport_categories
                    let sportsArray = [];
                    if (Array.isArray(venue.sport_categories)) {
                      sportsArray = venue.sport_categories;
                    } else if (typeof venue.sport_categories === 'string') {
                      try {
                        sportsArray = JSON.parse(venue.sport_categories);
                      } catch (e) {
                        console.log('Failed to parse sport_categories string:', e);
                        sportsArray = [venue.sport_categories];
                      }
                    }
                    
                    return sportsArray && sportsArray.length > 0;
                  })() && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          let sportsArray = [];
                          if (Array.isArray(venue.sport_categories)) {
                            sportsArray = venue.sport_categories;
                          } else if (typeof venue.sport_categories === 'string') {
                            try {
                              sportsArray = JSON.parse(venue.sport_categories);
                            } catch (e) {
                              sportsArray = [venue.sport_categories];
                            }
                          }
                          return sportsArray.map((sport, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {sport}
                            </span>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(venue.id, 'approved')}
                    disabled={venue.status === 'approved'}
                    className="text-green-600 hover:text-green-700"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(venue.id, 'rejected')}
                    disabled={venue.status === 'rejected'}
                    className="text-red-600 hover:text-red-700"
                  >
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(venue.id, 'pending')}
                    disabled={venue.status === 'pending'}
                    className="text-yellow-600 hover:text-yellow-700"
                  >
                    Pending
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(venue.id)}
                    title="View venue details"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(venue.id)}
                    title="Edit venue"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(venue.id)}
                    className="text-red-600 hover:text-red-700"
                    title="Delete venue"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, venuesData?.count || 0)} of {venuesData?.count || 0} results
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenuesPage;
