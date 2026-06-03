from rest_framework import serializers
from .models import Review
from apps.accounts.serializers import UserSerializer


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for Review model."""
    
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_avatar = serializers.SerializerMethodField()
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    
    class Meta:
        model = Review
        fields = (
            'id', 'venue', 'venue_name', 'user', 'user_name', 'user_avatar',
            'overall_rating', 'cleanliness_rating', 'facility_rating',
            'value_rating', 'title', 'comment', 'owner_response',
            'owner_response_date', 'is_approved', 'is_verified',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')
    
    def get_user_avatar(self, obj):
        if obj.user.profile_picture:
            return obj.user.profile_picture.url
        return None
    
    def create(self, validated_data):
        review = super().create(validated_data)
        # Update venue rating stats
        review.venue.update_rating_stats()
        return review
    
    def update(self, instance, validated_data):
        review = super().update(instance, validated_data)
        # Update venue rating stats
        review.venue.update_rating_stats()
        return review