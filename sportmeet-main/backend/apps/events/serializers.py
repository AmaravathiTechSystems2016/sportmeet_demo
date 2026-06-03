from rest_framework import serializers
from .models import Event, EventParticipant, EventComment, EventImage
from apps.accounts.serializers import UserSerializer
from apps.payments.models import Payment


class EventImageSerializer(serializers.ModelSerializer):
    """Serializer for event images."""
    
    class Meta:
        model = EventImage
        fields = ('id', 'image', 'caption', 'is_primary', 'order', 'created_at')
        read_only_fields = ('id', 'created_at')


class EventCommentSerializer(serializers.ModelSerializer):
    """Serializer for event comments."""
    
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = EventComment
        fields = ('id', 'user', 'user_name', 'user_avatar', 'comment', 'is_approved', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')
    
    def get_user_avatar(self, obj):
        if obj.user.profile_picture:
            return obj.user.profile_picture.url
        return None


class EventParticipantSerializer(serializers.ModelSerializer):
    """Serializer for event participants."""
    
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = EventParticipant
        fields = ('id', 'user', 'user_name', 'user_avatar', 'status', 'registration_date', 'payment_status', 'special_requests')
        read_only_fields = ('id', 'user', 'registration_date')
    
    def get_user_avatar(self, obj):
        if obj.user.profile_picture:
            return obj.user.profile_picture.url
        return None


class EventListSerializer(serializers.ModelSerializer):
    """Serializer for event list view."""
    
    organizer_name = serializers.CharField(source='organizer.full_name', read_only=True)
    cover_image_url = serializers.SerializerMethodField()
    participant_count = serializers.SerializerMethodField()
    gallery_images = EventImageSerializer(source='images', many=True, read_only=True)
    is_registered = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = (
            'id', 'title', 'description', 'event_type', 'sport_category', 'host_name',
            'start_date', 'end_date', 'start_time', 'end_time', 'max_participants',
            'min_participants', 'entry_fee', 'currency', 'status', 'is_public',
            'is_featured', 'organizer_name', 'venue_name', 'address', 'city', 'state',
            'cover_image_url', 'gallery_images', 'participant_count', 'is_registered', 'created_at'
        )
        read_only_fields = ('id', 'created_at')
    
    def get_cover_image_url(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return None
    
    def get_participant_count(self, obj):
        return obj.participants.filter(status__in=['registered', 'confirmed']).count()
    
    def get_is_registered(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.participants.filter(user=request.user).exists()
        return False


class EventDetailSerializer(serializers.ModelSerializer):
    """Serializer for event detail view."""
    
    organizer = UserSerializer(read_only=True)
    cover_image_url = serializers.SerializerMethodField()
    gallery_images = EventImageSerializer(source='images', many=True, read_only=True)
    participants = EventParticipantSerializer(many=True, read_only=True)
    comments = EventCommentSerializer(many=True, read_only=True)
    participant_count = serializers.SerializerMethodField()
    is_registered = serializers.SerializerMethodField()
    can_register = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = (
            'id', 'organizer', 'venue_name', 'address', 'city', 'state', 'postcode', 'country',
            'latitude', 'longitude', 'title', 'description', 'event_type',
            'sport_category', 'host_name', 'start_date', 'end_date', 'start_time', 'end_time',
            'max_participants', 'min_participants', 'registration_deadline',
            'is_registration_open', 'entry_fee', 'currency', 'status', 'is_public',
            'is_featured', 'rules', 'requirements', 'prizes', 'contact_info',
            'cover_image_url', 'gallery_images', 'participants', 'comments',
            'participant_count', 'is_registered', 'can_register', 'created_at',
            'updated_at', 'published_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_cover_image_url(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return None
    
    def get_participant_count(self, obj):
        return obj.participants.filter(status__in=['registered', 'confirmed']).count()
    
    def get_is_registered(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.participants.filter(user=request.user).exists()
        return False
    
    def get_can_register(self, obj):
        from django.utils import timezone
        
        if not obj.is_registration_open:
            return False
        
        if obj.registration_deadline and timezone.now() > obj.registration_deadline:
            return False
        
        participant_count = obj.participants.filter(status__in=['registered', 'confirmed']).count()
        return participant_count < obj.max_participants


class EventCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating events."""
    
    class Meta:
        model = Event
        fields = (
            'venue_name', 'address', 'city', 'state', 'postcode', 'country',
            'latitude', 'longitude', 'title', 'description', 'event_type', 'sport_category', 'host_name',
            'start_date', 'end_date', 'start_time', 'end_time', 'max_participants',
            'min_participants', 'registration_deadline', 'is_registration_open',
            'entry_fee', 'currency', 'status', 'is_public', 'is_featured', 'rules',
            'requirements', 'prizes', 'contact_info', 'cover_image'
        )
    
    def create(self, validated_data):
        # Handle gallery images from request files
        request = self.context.get('request')
        
        # Ensure is_public is True for new events (unless explicitly set to False)
        if 'is_public' not in validated_data:
            validated_data['is_public'] = True
        # Default status to published for newly created events unless provided
        if 'status' not in validated_data or not validated_data.get('status'):
            validated_data['status'] = 'published'
        
        event = Event.objects.create(**validated_data)
        
        # Process gallery images from request files
        if request and hasattr(request, 'FILES'):
            # cover image (optional)
            cover_file = request.FILES.get('cover_image')
            if cover_file:
                event.cover_image = cover_file
                event.save(update_fields=['cover_image'])
            gallery_files = request.FILES.getlist('gallery_images')
            for i, file in enumerate(gallery_files):
                EventImage.objects.create(
                    event=event,
                    image=file,
                    order=i
                )
        
        return event
    
    def update(self, instance, validated_data):
        # Update event fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Handle gallery images from request files
        request = self.context.get('request')
        if request and hasattr(request, 'FILES'):
            # Update cover image if provided
            cover_file = request.FILES.get('cover_image')
            if cover_file:
                instance.cover_image = cover_file
                instance.save(update_fields=['cover_image'])
            gallery_files = request.FILES.getlist('gallery_images')
            # Delete removed images if any were specified
            removed_ids = request.data.getlist('removed_image_ids') if hasattr(request.data, 'getlist') else []
            if removed_ids:
                instance.images.filter(id__in=removed_ids).delete()
            # Append new images without wiping existing unless explicitly replaced
            for i, file in enumerate(gallery_files):
                EventImage.objects.create(
                    event=instance,
                    image=file,
                    order=i
                )
        
        return instance


class EventRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for event registration."""
    
    class Meta:
        model = EventParticipant
        fields = ('special_requests', 'payment_status', 'status', 'payment_intent_id')
    
    def create(self, validated_data):
        event = self.context['event']
        user = self.context['user']
        
        # Allow multiple registrations per user for the same event
        
        # Check if registration is open
        if not event.is_registration_open:
            raise serializers.ValidationError("Registration is closed for this event")
        
        # Check if event is full
        participant_count = event.participants.filter(status__in=['registered', 'confirmed']).count()
        if participant_count >= event.max_participants:
            raise serializers.ValidationError("Event is full")
        
        # For paid events, check if payment was made
        if event.entry_fee > 0:
            payment_intent_id = self.initial_data.get('payment_intent_id')
            if payment_intent_id:
                # Try to find payment but don't fail if not found
                try:
                    payment = Payment.objects.get(
                        gateway_transaction_id=payment_intent_id,
                        status='completed'
                    )
                    # Basic verification
                    if payment.user == user:
                        validated_data['payment_status'] = 'paid'
                        validated_data['status'] = 'confirmed'
                        validated_data['payment_intent_id'] = payment_intent_id
                    else:
                        # Payment exists but wrong user - treat as unpaid
                        validated_data['payment_status'] = 'pending'
                        validated_data['status'] = 'registered'
                except Payment.DoesNotExist:
                    # Payment not found - treat as unpaid
                    validated_data['payment_status'] = 'pending'
                    validated_data['status'] = 'registered'
            else:
                # No payment_intent_id provided - treat as unpaid
                validated_data['payment_status'] = 'pending'
                validated_data['status'] = 'registered'
        else:
            validated_data['payment_status'] = 'free'
            validated_data['status'] = 'confirmed'
        
        return EventParticipant.objects.create(
            event=event,
            user=user,
            **validated_data
        )


class EventBookingSerializer(serializers.ModelSerializer):
    """Serializer for event bookings list."""
    
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)
    event_start_date = serializers.DateField(source='event.start_date', read_only=True)
    event_start_time = serializers.TimeField(source='event.start_time', read_only=True)
    event_end_time = serializers.TimeField(source='event.end_time', read_only=True)
    event_entry_fee = serializers.DecimalField(source='event.entry_fee', max_digits=10, decimal_places=2, read_only=True)
    event_currency = serializers.CharField(source='event.currency', read_only=True)
    venue_name = serializers.CharField(source='event.venue_name', read_only=True)
    venue_city = serializers.CharField(source='event.city', read_only=True)
    organizer_name = serializers.CharField(source='event.organizer.full_name', read_only=True)
    
    class Meta:
        model = EventParticipant
        fields = (
            'id', 'user', 'user_name', 'user_email', 'event', 'event_title',
            'event_start_date', 'event_start_time', 'event_end_time',
            'event_entry_fee', 'event_currency', 'venue_name', 'venue_city',
            'organizer_name', 'status', 'registration_date', 'payment_status',
            'special_requests'
        )
        read_only_fields = ('id', 'registration_date')
    
    def create(self, validated_data):
        event = self.context['event']
        user = self.context['user']
        
        # Allow multiple registrations per user for the same event
        
        # Check if registration is open
        if not event.is_registration_open:
            raise serializers.ValidationError("Registration is closed for this event")
        
        # Check if event is full
        participant_count = event.participants.filter(status__in=['registered', 'confirmed']).count()
        if participant_count >= event.max_participants:
            raise serializers.ValidationError("Event is full")
        
        return EventParticipant.objects.create(
            event=event,
            user=user,
            **validated_data
        )
