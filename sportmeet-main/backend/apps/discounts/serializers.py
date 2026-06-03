from rest_framework import serializers
from .models import Discount, DiscountUsage
from apps.venues.serializers import VenueListSerializer
from apps.events.serializers import EventListSerializer
from apps.accounts.serializers import UserSerializer


class DiscountSerializer(serializers.ModelSerializer):
    """Serializer for discount list view."""
    
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    is_valid = serializers.SerializerMethodField()
    remaining_uses = serializers.SerializerMethodField()
    
    class Meta:
        model = Discount
        fields = [
            'id', 'code', 'name', 'description', 'discount_type', 'value',
            'max_discount_amount', 'min_order_amount', 'valid_from', 'valid_until',
            'status', 'usage_limit', 'usage_count', 'user_limit', 'first_time_only',
            'applicable_to_venues', 'applicable_to_events', 'created_by_name',
            'is_valid', 'remaining_uses', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'usage_count', 'created_at', 'updated_at']
    
    def get_is_valid(self, obj):
        return obj.is_valid()
    
    def get_remaining_uses(self, obj):
        if obj.usage_limit:
            return max(0, obj.usage_limit - obj.usage_count)
        return None


class DiscountDetailSerializer(serializers.ModelSerializer):
    """Serializer for discount detail view."""
    
    created_by = UserSerializer(read_only=True)
    specific_venues = VenueListSerializer(many=True, read_only=True)
    specific_events = EventListSerializer(many=True, read_only=True)
    is_valid = serializers.SerializerMethodField()
    remaining_uses = serializers.SerializerMethodField()
    
    class Meta:
        model = Discount
        fields = [
            'id', 'code', 'name', 'description', 'discount_type', 'value',
            'max_discount_amount', 'min_order_amount', 'valid_from', 'valid_until',
            'status', 'usage_limit', 'usage_count', 'user_limit', 'first_time_only',
            'applicable_to_venues', 'applicable_to_events', 'specific_venues',
            'specific_events', 'created_by', 'is_valid', 'remaining_uses',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'usage_count', 'created_at', 'updated_at']


class DiscountCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating discounts."""
    
    class Meta:
        model = Discount
        fields = [
            'code', 'name', 'description', 'discount_type', 'value',
            'max_discount_amount', 'min_order_amount', 'valid_from', 'valid_until',
            'status', 'usage_limit', 'user_limit', 'first_time_only',
            'applicable_to_venues', 'applicable_to_events', 'specific_venues',
            'specific_events'
        ]
        extra_kwargs = {
            'valid_from': { 'required': False, 'allow_null': True },
            'valid_until': { 'required': False, 'allow_null': True },
            'description': { 'required': False, 'allow_null': True },
        }
    
    def validate_code(self, value):
        """Validate that the code is unique and properly formatted."""
        if self.instance and self.instance.code == value:
            return value
        
        if Discount.objects.filter(code__iexact=value).exists():
            raise serializers.ValidationError("A discount with this code already exists.")
        
        # Basic validation for code format
        if not value.replace('-', '').replace('_', '').isalnum():
            raise serializers.ValidationError("Code can only contain letters, numbers, hyphens, and underscores.")
        
        return value.upper()
    
    def validate_value(self, value):
        """Validate the discount value based on type."""
        if value <= 0:
            raise serializers.ValidationError("Discount value must be greater than 0.")
        
        return value
    
    def validate_max_discount_amount(self, value):
        """Validate max discount amount for percentage discounts."""
        if value is not None and value <= 0:
            raise serializers.ValidationError("Max discount amount must be greater than 0.")
        
        return value
    
    def validate_min_order_amount(self, value):
        """Validate minimum order amount."""
        if value < 0:
            raise serializers.ValidationError("Minimum order amount cannot be negative.")
        
        return value
    
    def validate_usage_limit(self, value):
        """Validate usage limit."""
        if value is not None and value <= 0:
            raise serializers.ValidationError("Usage limit must be greater than 0.")
        
        return value
    
    def validate_user_limit(self, value):
        """Validate user limit."""
        if value <= 0:
            raise serializers.ValidationError("User limit must be greater than 0.")
        
        return value
    
    def validate(self, data):
        """Cross-field validation."""
        # Normalize empty strings to None
        if data.get('valid_from') in ['', None]:
            data.pop('valid_from', None)
        if data.get('valid_until') in ['', None]:
            data['valid_until'] = None

        discount_type = data.get('discount_type')
        value = data.get('value')
        max_discount_amount = data.get('max_discount_amount')
        
        # Validate percentage discounts
        if discount_type == 'percentage':
            if value > 100:
                raise serializers.ValidationError("Percentage discount cannot exceed 100%.")
            
            if max_discount_amount is not None and max_discount_amount <= 0:
                raise serializers.ValidationError("Max discount amount must be greater than 0 for percentage discounts.")
        
        # Validate date range
        valid_from = data.get('valid_from')
        valid_until = data.get('valid_until')
        
        if valid_from and valid_until and valid_from >= valid_until:
            raise serializers.ValidationError("Valid until date must be after valid from date.")
        
        return data


class DiscountUsageSerializer(serializers.ModelSerializer):
    """Serializer for discount usage records."""
    
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    discount_code = serializers.CharField(source='discount.code', read_only=True)
    
    class Meta:
        model = DiscountUsage
        fields = [
            'id', 'discount', 'discount_code', 'user', 'user_name',
            'booking_type', 'booking_id', 'original_amount', 'discount_amount',
            'final_amount', 'used_at', 'ip_address'
        ]
        read_only_fields = ['id', 'used_at']


class DiscountValidationSerializer(serializers.Serializer):
    """Serializer for validating discount codes."""
    
    code = serializers.CharField(max_length=50)
    booking_type = serializers.ChoiceField(choices=['venue', 'event'])
    venue_id = serializers.IntegerField(required=False, allow_null=True)
    event_id = serializers.IntegerField(required=False, allow_null=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    def validate(self, data):
        """Validate the discount code and calculate discount."""
        code = data.get('code')
        booking_type = data.get('booking_type')
        venue_id = data.get('venue_id')
        event_id = data.get('event_id')
        amount = data.get('amount')
        
        try:
            discount = Discount.objects.get(code__iexact=code)
        except Discount.DoesNotExist:
            raise serializers.ValidationError("Invalid discount code.")
        
        # Get venue or event objects if provided
        venue = None
        event = None
        
        if booking_type == 'venue' and venue_id:
            try:
                from apps.venues.models import Venue
                venue = Venue.objects.get(id=venue_id)
            except Venue.DoesNotExist:
                raise serializers.ValidationError("Invalid venue ID.")
        
        if booking_type == 'event' and event_id:
            try:
                from apps.events.models import Event
                event = Event.objects.get(id=event_id)
            except Event.DoesNotExist:
                raise serializers.ValidationError("Invalid event ID.")
        
        # Check if user can use this discount
        user = self.context.get('request').user
        can_use, message = discount.can_be_used_by_user(
            user=user,
            booking_type=booking_type,
            venue=venue,
            event=event,
            amount=amount
        )
        
        if not can_use:
            raise serializers.ValidationError(message)
        
        # Calculate discount amount
        discount_amount = discount.calculate_discount(amount)
        final_amount = amount - discount_amount
        
        return {
            'discount': discount,
            'discount_amount': discount_amount,
            'final_amount': final_amount,
            'original_amount': amount
        }