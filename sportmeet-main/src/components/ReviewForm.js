import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { reviewsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Button from './UI/Button';
import Input from './UI/Input';
import Card from './UI/Card';
import { Star, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ReviewForm = ({ venueId, onClose, onSuccess }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    overall_rating: 0,
    cleanliness_rating: 0,
    facility_rating: 0,
    value_rating: 0,
    title: user ? (user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim()) : '',
    comment: ''
  });
  const [hoveredRating, setHoveredRating] = useState(0);

  const createReviewMutation = useMutation(
    (reviewData) => reviewsAPI.createReview(reviewData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['venue', venueId]);
        queryClient.invalidateQueries(['reviews', venueId]);
        toast.success('Review submitted successfully!');
        onSuccess?.();
        onClose();
      },
      onError: (error) => {
        console.error('Error creating review:', error);
        const data = error.response?.data;
        let message = 'Failed to submit review';
        if (typeof data === 'string') message = data;
        else if (data?.detail) message = data.detail;
        else if (data) {
          const firstKey = Object.keys(data)[0];
          if (firstKey) {
            const val = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
            message = `${firstKey}: ${val}`;
          }
        }
        toast.error(message);
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.overall_rating === 0) {
      toast.error('Please provide an overall rating');
      return;
    }

    if (!formData.comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    const payload = {
      venue: venueId,
      ...formData,
      title: formData.title && formData.title.trim().length > 0
        ? formData.title
        : (user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim()),
    };
    createReviewMutation.mutate(payload);
  };

  const handleRatingChange = (rating, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: rating
    }));
  };

  const StarRating = ({ rating, onRatingChange, field, label }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`w-6 h-6 transition-colors ${
              star <= (hoveredRating || rating)
                ? 'text-yellow-400'
                : 'text-gray-300'
            }`}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => onRatingChange(star, field)}
          >
            <Star className="w-full h-full fill-current" />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {rating > 0 ? `${rating}/5` : 'Rate'}
        </span>
      </div>
    </div>
  );

  if (!user) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Write a Review</h3>
        <p className="text-gray-600 mb-4">Please log in to write a review</p>
        <Button variant="primary" onClick={() => window.location.href = '/login'}>
          Log In
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Write a Review</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <StarRating
          rating={formData.overall_rating}
          onRatingChange={handleRatingChange}
          field="overall_rating"
          label="Overall Rating *"
        />

        {/* Detailed Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StarRating
            rating={formData.cleanliness_rating}
            onRatingChange={handleRatingChange}
            field="cleanliness_rating"
            label="Cleanliness"
          />
          <StarRating
            rating={formData.facility_rating}
            onRatingChange={handleRatingChange}
            field="facility_rating"
            label="Facilities"
          />
          <StarRating
            rating={formData.value_rating}
            onRatingChange={handleRatingChange}
            field="value_rating"
            label="Value for Money"
          />
        </div>

        {/* Review Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Title
          </label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Summarize your experience"
            maxLength={200}
          />
        </div>

        {/* Review Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Review *
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="Tell others about your experience at this venue..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={4}
            required
          />
          <div className="text-right text-sm text-gray-500 mt-1">
            {formData.comment.length}/500
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={createReviewMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={createReviewMutation.isLoading}
          >
            {createReviewMutation.isLoading ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ReviewForm;
