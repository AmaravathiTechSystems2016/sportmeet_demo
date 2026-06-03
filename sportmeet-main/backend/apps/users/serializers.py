from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.venues.models import Venue

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    venues_count = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'first_name', 'last_name', 'email', 'phone_number',
            'is_active', 'is_staff', 'is_superuser', 'is_verified', 'date_joined', 
            'last_login', 'venues_count', 'full_name'
        )
        read_only_fields = ('id', 'date_joined', 'last_login')
    
    def get_venues_count(self, obj):
        return obj.venues.count()
    
    def get_full_name(self, obj):
        return obj.full_name or obj.username
    
    def update(self, instance, validated_data):
        """Custom update method with better error handling."""
        print(f"Updating user {instance.id} with data: {validated_data}")
        
        # Handle phone number validation
        phone_number = validated_data.get('phone_number')
        if phone_number and phone_number.strip():
            # Ensure phone number starts with + if it doesn't already
            if not phone_number.startswith('+'):
                validated_data['phone_number'] = '+' + phone_number
        elif phone_number == '':
            # Allow empty phone number
            validated_data['phone_number'] = ''
        
        try:
            return super().update(instance, validated_data)
        except Exception as e:
            print(f"Error updating user: {e}")
            raise serializers.ValidationError(f"Failed to update user: {str(e)}")


class VenueOwnerSerializer(serializers.ModelSerializer):
    """Serializer for Venue Owner (User with venues)."""
    
    venues_count = serializers.IntegerField(read_only=True)
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2, read_only=True)
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    full_name = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'first_name', 'last_name', 'email', 'phone_number',
            'is_active', 'is_staff', 'is_superuser', 'is_verified', 'date_joined', 
            'last_login', 'venues_count', 'average_rating', 'total_revenue',
            'full_name', 'bio', 'status'
        )
        read_only_fields = ('id', 'date_joined', 'last_login')
    
    def get_full_name(self, obj):
        return obj.full_name or obj.username
    
    def get_bio(self, obj):
        # Get bio from user profile if it exists
        if hasattr(obj, 'profile') and obj.profile:
            return getattr(obj.profile, 'bio', '')
        return ''
    
    def get_status(self, obj):
        if obj.is_active:
            return 'active'
        else:
            return 'inactive'
    
    def update(self, instance, validated_data):
        """Custom update method with better error handling."""
        print(f"Updating venue owner {instance.id} with data: {validated_data}")
        
        # Handle phone number validation
        phone_number = validated_data.get('phone_number')
        if phone_number and phone_number.strip():
            # Ensure phone number starts with + if it doesn't already
            if not phone_number.startswith('+'):
                validated_data['phone_number'] = '+' + phone_number
        elif phone_number == '':
            # Allow empty phone number
            validated_data['phone_number'] = ''
        
        try:
            return super().update(instance, validated_data)
        except Exception as e:
            print(f"Error updating venue owner: {e}")
            raise serializers.ValidationError(f"Failed to update venue owner: {str(e)}")
