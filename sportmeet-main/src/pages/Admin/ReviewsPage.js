import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { reviewsAPI } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { Star, Search, Check, X, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ReviewsPage = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: '',
    is_approved: '',
    venue: '',
    rating: '',
    venue_owner: ''
  });
  // const [selectedReview, setSelectedReview] = useState(null);
  // const [showFilters, setShowFilters] = useState(false);

  const { data: reviews, isLoading, error } = useQuery(
    ['admin-reviews', filters],
    () => {
      const params = { _t: Date.now(), ...filters };
      console.log('Admin Reviews params:', params);
      if (params.rating) {
        params.overall_rating = params.rating;
      }
      delete params.rating;
      return reviewsAPI
        .getReviews(params)
        .then((data) => {
          console.log('Admin Reviews response:', data);
          return data?.results || data || [];
        })
        .catch((e) => {
          console.error('Admin Reviews fetch error:', e);
          return [];
        });
    },
    { 
      keepPreviousData: false,
      onError: (error) => {
        console.error('Reviews query error:', error);
      },
      onSuccess: (data) => {
        console.log('Reviews query success:', data);
      }
    }
  );
  
  // Initialize filters from query params (e.g., ?venue=42 or ?venue_owner=me)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const venue = params.get('venue');
    const approved = params.get('is_approved');
    const rating = params.get('rating');
    const search = params.get('search');
    const venueOwner = params.get('venue_owner');
    setFilters(prev => ({
      ...prev,
      venue: venue || prev.venue,
      is_approved: approved !== null ? approved : prev.is_approved,
      rating: rating || prev.rating,
      search: search || prev.search,
      venue_owner: venueOwner || prev.venue_owner,
    }));
  }, []);


  const approveReviewMutation = useMutation(
    (id) => reviewsAPI.updateReview(id, { is_approved: true }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-reviews');
        toast.success('Review approved successfully');
      },
      onError: (error) => {
        console.error('Error approving review:', error);
        toast.error('Failed to approve review');
      }
    }
  );

  const rejectReviewMutation = useMutation(
    (id) => reviewsAPI.updateReview(id, { is_approved: false }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-reviews');
        toast.success('Review rejected successfully');
      },
      onError: (error) => {
        console.error('Error rejecting review:', error);
        toast.error('Failed to reject review');
      }
    }
  );

  const deleteReviewMutation = useMutation(
    (id) => reviewsAPI.deleteReview(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-reviews');
        toast.success('Review deleted successfully');
      },
      onError: (error) => {
        console.error('Error deleting review:', error);
        toast.error('Failed to delete review');
      }
    }
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      is_approved: '',
      venue: '',
      rating: ''
    });
  };

  const StarRating = ({ rating, size = 'sm' }) => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (isApproved) => {
    if (isApproved) {
      return (
        <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
          Approved
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
          Pending
        </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Reviews</h2>
          <p className="text-gray-600 mb-2">Failed to load reviews. Please try again.</p>
          <p className="text-xs text-gray-400 mb-6">{String(error?.message || '')}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const items = Array.isArray(reviews) ? reviews : [];

  // Guard: if empty and filters are clean, show hint to broaden filters
  if (items.length === 0 && Object.values(filters).every(f => !f)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reviews Management</h1>
            <p className="text-gray-600">Manage and moderate venue reviews</p>
          </div>

          {/* Filters */}
          <Card className="p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search reviews..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={filters.is_approved}
                    onChange={(e) => handleFilterChange('is_approved', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="true">Approved</option>
                    <option value="false">Pending</option>
                  </select>

                  <select
                    value={filters.rating}
                    onChange={(e) => handleFilterChange('rating', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                    <option value="2">2+ Stars</option>
                    <option value="1">1+ Stars</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="flex items-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Star className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Found</h3>
            <p className="text-gray-600">
              {Object.values(filters).some(f => f) 
                ? 'No reviews match your current filters.' 
                : 'There are no reviews yet.'}
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reviews Management</h1>
          <p className="text-gray-600">Manage and moderate venue reviews</p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filters.is_approved}
                  onChange={(e) => handleFilterChange('is_approved', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="true">Approved</option>
                  <option value="false">Pending</option>
                </select>

                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="1">1+ Stars</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </Card>

        {/* Reviews List */}
        <div className="space-y-4">
          {Array.isArray(items) && items.length > 0 ? (
            items.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {review.user_name}
                      </h3>
                      {getStatusBadge(review.is_approved)}
                      {review.is_verified && (
                        <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-2">
                        <StarRating rating={review.overall_rating} />
                        <span className="text-sm text-gray-600">
                          {review.overall_rating}/5
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(review.created_at)}
                      </span>
                      <span className="text-sm text-gray-500">
                        for {review.venue_name || 'Unknown Venue'}
                      </span>
                    </div>

                    {review.title && (
                      <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                    )}

                    <p className="text-gray-700 mb-4">{review.comment}</p>

                    {/* Detailed Ratings */}
                    {(review.cleanliness_rating || review.facility_rating || review.value_rating) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                        {review.cleanliness_rating && (
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Cleanliness</div>
                            <StarRating rating={review.cleanliness_rating} />
                          </div>
                        )}
                        {review.facility_rating && (
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Facilities</div>
                            <StarRating rating={review.facility_rating} />
                          </div>
                        )}
                        {review.value_rating && (
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Value</div>
                            <StarRating rating={review.value_rating} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Owner Response */}
                    {review.owner_response && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm font-medium text-blue-900 mb-1">
                          Venue Owner Response
                        </div>
                        <p className="text-sm text-blue-800">{review.owner_response}</p>
                        {review.owner_response_date && (
                          <div className="text-xs text-blue-600 mt-2">
                            {formatDate(review.owner_response_date)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {!review.is_approved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => approveReviewMutation.mutate(review.id)}
                        disabled={approveReviewMutation.isLoading}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    )}
                    
                    {review.is_approved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rejectReviewMutation.mutate(review.id)}
                        disabled={rejectReviewMutation.isLoading}
                        className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteReviewMutation.mutate(review.id)}
                      disabled={deleteReviewMutation.isLoading}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Star className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Found</h3>
              <p className="text-gray-600">
                {Object.values(filters).some(f => f) 
                  ? 'No reviews match your current filters.' 
                  : 'There are no reviews yet.'}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsPage;
