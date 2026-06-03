from rest_framework import serializers
from django.db.models import Min
from .models import Venue, Court, VenueAvailability, VenueImage, VenuePricing


class VenueImageSerializer(serializers.ModelSerializer):
    """Serializer for venue images."""
    
    class Meta:
        model = VenueImage
        fields = ('id', 'image', 'caption', 'is_primary', 'order', 'created_at')
        read_only_fields = ('id', 'created_at')


class VenueAvailabilitySerializer(serializers.ModelSerializer):
    """Serializer for venue availability."""
    
    class Meta:
        model = VenueAvailability
        fields = (
            'id', 'day_of_week', 'start_time', 'end_time', 'is_available',
            'price_override', 'court', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class VenuePricingSerializer(serializers.ModelSerializer):
    """Serializer for venue pricing."""
    
    class Meta:
        model = VenuePricing
        fields = (
            'id', 'pricing_type', 'day_of_week', 'start_time', 'end_time',
            'price_multiplier', 'fixed_price', 'is_active', 'valid_from',
            'valid_until', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class VenueListSerializer(serializers.ModelSerializer):
    """Serializer for venue list view."""
    
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    cover_image_url = serializers.SerializerMethodField()
    full_address = serializers.ReadOnlyField()
    min_price = serializers.SerializerMethodField()
    court_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Venue
        fields = (
            'id', 'name', 'description', 'city', 'state', 'postcode',
            'sport_categories', 'amenities', 'venue_id', 'currency', 'average_rating', 
            'total_reviews', 'cover_image_url', 'owner_name', 'full_address', 'is_verified', 
            'status', 'min_price', 'court_count', 'created_at'
        )
        read_only_fields = ('id', 'created_at')
    
    def get_cover_image_url(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return None

    def get_min_price(self, obj):
        annotated = getattr(obj, 'min_court_price', None)
        if annotated is not None:
            return annotated
        return obj.courts.aggregate(min_price=Min('price_per_duration'))['min_price']

    def get_court_count(self, obj):
        annotated = getattr(obj, 'court_count', None)
        if annotated is not None:
            return annotated
        return obj.courts.count()


class CourtSerializer(serializers.ModelSerializer):
    """Serializer for Court model."""
    
    availability = serializers.SerializerMethodField()
    
    class Meta:
        model = Court
        fields = (
            'id', 'name', 'sport', 'court_type', 'description', 'length', 'width',
            'surface_type', 'is_indoor', 'max_players', 'booking_duration_minutes',
            'price_per_duration', 'status', 'is_available', 'image', 'gallery_images',
            'availability', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_availability(self, obj):
        """Convert availability records to dictionary format expected by frontend."""
        availability_dict = {}
        for av in obj.availability.all():
            availability_dict[av.day_of_week] = {
                'start_time': av.start_time,
                'end_time': av.end_time,
                'is_available': av.is_available
            }
        return availability_dict


class VenueDetailSerializer(serializers.ModelSerializer):
    """Serializer for venue detail view."""
    
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    owner_id = serializers.IntegerField(source='owner.id', read_only=True)
    owner_email = serializers.CharField(source='owner.email', read_only=True)
    owner_phone = serializers.CharField(source='owner.phone_number', read_only=True)
    cover_image_url = serializers.SerializerMethodField()
    gallery_images = VenueImageSerializer(source='images', many=True, read_only=True)
    availability = serializers.SerializerMethodField()
    pricing = VenuePricingSerializer(many=True, read_only=True)
    courts = CourtSerializer(many=True, read_only=True)
    full_address = serializers.ReadOnlyField()
    min_price = serializers.SerializerMethodField()
    court_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Venue
        fields = (
            'id', 'name', 'description', 'address', 'city', 'state', 'postcode',
            'country', 'latitude', 'longitude', 'phone_number', 'email', 'website',
            'sport_categories', 'amenities', 'rules', 'cancellation_policy',
            'google_map_link', 'venue_id', 'currency', 'status', 'is_verified', 
            'cover_image_url', 'gallery_images', 'average_rating', 'total_reviews', 
            'owner_id', 'owner_name', 'owner_email', 'owner_phone', 'availability', 'pricing',
            'courts', 
            'full_address', 'min_price', 'court_count', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_cover_image_url(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return None

    def get_min_price(self, obj):
        annotated = getattr(obj, 'min_court_price', None)
        if annotated is not None:
            return annotated
        return obj.courts.aggregate(min_price=Min('price_per_duration'))['min_price']

    def get_court_count(self, obj):
        annotated = getattr(obj, 'court_count', None)
        if annotated is not None:
            return annotated
        return obj.courts.count()
    
    def get_availability(self, obj):
        """Convert venue-level availability records to dictionary format expected by frontend."""
        availability_dict = {}
        for av in obj.availability.filter(court__isnull=True):
            availability_dict[av.day_of_week] = {
                'start_time': av.start_time,
                'end_time': av.end_time,
                'is_available': av.is_available
            }
        return availability_dict


class VenueCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating venues."""
    
    gallery_images = VenueImageSerializer(many=True, required=False)
    availability = VenueAvailabilitySerializer(many=True, required=False)
    pricing = VenuePricingSerializer(many=True, required=False)
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Venue
        fields = (
            'owner', 'name', 'description', 'address', 'city', 'state', 'postcode',
            'country', 'latitude', 'longitude', 'phone_number', 'email', 'website',
            'sport_categories', 'amenities', 'rules', 'cancellation_policy',
            'google_map_link', 'currency', 'cover_image', 'gallery_images', 
            'availability', 'pricing', 'status'
        )
    
    def create(self, validated_data):
        gallery_images_data = validated_data.pop('gallery_images', [])
        availability_data = validated_data.pop('availability', [])
        pricing_data = validated_data.pop('pricing', [])
        
        venue = Venue.objects.create(**validated_data)
        
        # Create gallery images
        for image_data in gallery_images_data:
            VenueImage.objects.create(venue=venue, **image_data)
        
        # Create availability schedule
        for availability_item in availability_data:
            VenueAvailability.objects.create(venue=venue, **availability_item)
        
        # Create pricing rules
        for pricing_item in pricing_data:
            VenuePricing.objects.create(venue=venue, **pricing_item)
        
        return venue
    
    def update(self, instance, validated_data):
        gallery_images_data = validated_data.pop('gallery_images', None)
        availability_data = validated_data.pop('availability', None)
        pricing_data = validated_data.pop('pricing', None)
        
        # Update venue fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update gallery images if provided
        if gallery_images_data is not None:
            instance.images.all().delete()
            for image_data in gallery_images_data:
                VenueImage.objects.create(venue=instance, **image_data)
        
        # Update availability if provided
        if availability_data is not None:
            instance.availability.all().delete()
            for availability_item in availability_data:
                VenueAvailability.objects.create(venue=instance, **availability_item)
        
        # Update pricing if provided
        if pricing_data is not None:
            instance.pricing.all().delete()
            for pricing_item in pricing_data:
                VenuePricing.objects.create(venue=instance, **pricing_item)
        
        return instance


class VenueSearchSerializer(serializers.Serializer):
    """Serializer for venue search filters."""
    
    city = serializers.CharField(required=False)
    state = serializers.CharField(required=False)
    sport_category = serializers.CharField(required=False)
    min_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    max_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    min_capacity = serializers.IntegerField(required=False)
    amenities = serializers.ListField(child=serializers.CharField(), required=False)
    rating_min = serializers.DecimalField(max_digits=3, decimal_places=2, required=False)
    is_verified = serializers.BooleanField(required=False)
    search = serializers.CharField(required=False)
