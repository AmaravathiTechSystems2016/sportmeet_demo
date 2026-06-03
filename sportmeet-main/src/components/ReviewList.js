import React from 'react';
import { useQuery } from 'react-query';
import { reviewsAPI } from '../services/api';
import Card from './UI/Card';
import LoadingSpinner from './UI/LoadingSpinner';
import { Star, User } from 'lucide-react';

const ReviewList = ({ venueId }) => {
  const { data: reviews, isLoading, error } = useQuery(
    ['reviews', venueId],
    () => reviewsAPI.getVenueReviews(venueId),
    { enabled: !!venueId }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-600">Failed to load reviews</p>
      </Card>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-600">No reviews yet. Be the first to review this venue!</p>
      </Card>
    );
  }

  const StarRating = ({ rating }) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                {review.user_avatar ? (
                  <img
                    src={review.user_avatar}
                    alt={review.user_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-primary-600" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{review.user_name}</h4>
                <div className="flex items-center space-x-2">
                  <StarRating rating={review.overall_rating} />
                  <span className="text-sm text-gray-500">
                    {formatDate(review.created_at)}
                  </span>
                </div>
              </div>
            </div>
            {review.is_verified && (
              <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                Verified
              </span>
            )}
          </div>

          {review.title && (
            <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
          )}

          <p className="text-gray-700 mb-4">{review.comment}</p>

          {/* Detailed Ratings */}
          {(review.cleanliness_rating || review.facility_rating || review.value_rating) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
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
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-900 mb-1">
                Venue Owner Response
              </div>
              <p className="text-sm text-gray-700">{review.owner_response}</p>
              {review.owner_response_date && (
                <div className="text-xs text-gray-500 mt-2">
                  {formatDate(review.owner_response_date)}
                </div>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default ReviewList;
