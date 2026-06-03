from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.db.models import Q, Sum, Avg, Count
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Booking, BookingTimeSlot, BookingCancellation, BookingReview, BookingCourt
from .serializers import (
    BookingListSerializer, BookingDetailSerializer, BookingCreateSerializer,
    BookingTimeSlotSerializer, BookingCancellationSerializer, BookingReviewSerializer,
    BookingStatsSerializer, MultiCourtBookingCreateSerializer
)


class BookingListView(generics.ListCreateAPIView):
    """List bookings or create a new booking."""
    
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status', 'venue', 'booking_date', 'payment_intent_id']
    search_fields = ['venue__name', 'special_requests']
    ordering_fields = ['created_at', 'booking_date', 'total_amount']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookingCreateSerializer
        return BookingListSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            booking = serializer.save(user=request.user)
            return Response(BookingDetailSerializer(booking).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get_queryset(self):
        # Users can only see their own bookings unless they're admin
        if self.request.user.is_staff:
            return Booking.objects.all().select_related('venue', 'user')
        return Booking.objects.filter(user=self.request.user).select_related('venue', 'user')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a booking."""
    
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return BookingCreateSerializer
        return BookingDetailSerializer
    
    def get_queryset(self):
        # Admins can view all bookings
        if self.request.user.is_staff:
            return Booking.objects.all().select_related('venue', 'user').prefetch_related('booking_courts__court')
        # Venue owners can view bookings for their venues
        if getattr(self.request.user, 'user_type', None) == 'venue_owner':
            from apps.venues.models import Venue
            owned_venue_ids = Venue.objects.filter(owner=self.request.user).values_list('id', flat=True)
            return Booking.objects.filter(venue_id__in=owned_venue_ids).select_related('venue', 'user').prefetch_related('booking_courts__court')
        # Regular users can only view their own bookings
        return Booking.objects.filter(user=self.request.user).select_related('venue', 'user').prefetch_related('booking_courts__court')


class BookingTimeSlotListView(generics.ListAPIView):
    """List available time slots for a venue."""
    
    serializer_class = BookingTimeSlotSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['venue', 'date', 'is_available']
    
    def get_queryset(self):
        queryset = BookingTimeSlot.objects.filter(
            is_available=True,
            date__gte=timezone.now().date()
        ).select_related('venue')
        
        venue_id = self.request.query_params.get('venue')
        if venue_id:
            queryset = queryset.filter(venue_id=venue_id)
        
        return queryset


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_booking(request, booking_id):
    """Cancel a booking."""
    try:
        booking = Booking.objects.get(id=booking_id, user=request.user)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if booking.status not in ['pending', 'confirmed']:
        return Response(
            {'error': 'Booking cannot be cancelled'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if cancellation is allowed (more than 24 hours before start)
    booking_datetime = timezone.datetime.combine(booking.booking_date, booking.start_time)
    booking_datetime = timezone.make_aware(booking_datetime)
    
    if booking_datetime <= timezone.now() + timedelta(hours=24):
        return Response(
            {'error': 'Booking cannot be cancelled within 24 hours of start time'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create cancellation
    cancellation_data = request.data
    cancellation_serializer = BookingCancellationSerializer(
        data=cancellation_data,
        context={'booking': booking, 'user': request.user}
    )
    
    if cancellation_serializer.is_valid():
        cancellation = cancellation_serializer.save()
        
        # Update booking status
        booking.status = 'cancelled'
        booking.cancelled_at = timezone.now()
        booking.cancellation_reason = cancellation.reason_description
        booking.cancellation_fee = cancellation.cancellation_fee
        booking.save()
        
        return Response({
            'message': 'Booking cancelled successfully',
            'cancellation': cancellation_serializer.data
        })
    
    return Response(cancellation_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_review(request, booking_id):
    """Create a review for a completed booking."""
    try:
        booking = Booking.objects.get(id=booking_id, user=request.user)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if booking.status != 'completed':
        return Response(
            {'error': 'Can only review completed bookings'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if hasattr(booking, 'review'):
        return Response(
            {'error': 'Review already exists for this booking'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = BookingReviewSerializer(
        data=request.data,
        context={'booking': booking, 'user': request.user}
    )
    
    if serializer.is_valid():
        review = serializer.save()
        
        # Update venue rating
        venue = booking.venue
        venue_reviews = BookingReview.objects.filter(venue=venue)
        avg_rating = venue_reviews.aggregate(avg_rating=Avg('overall_rating'))['avg_rating']
        venue.average_rating = avg_rating or 0
        venue.total_reviews = venue_reviews.count()
        venue.save()
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def booking_stats(request):
    """Get booking statistics for the current user."""
    user = request.user
    
    # Basic stats
    total_bookings = Booking.objects.filter(user=user).count()
    confirmed_bookings = Booking.objects.filter(user=user, status='confirmed').count()
    cancelled_bookings = Booking.objects.filter(user=user, status='cancelled').count()
    completed_bookings = Booking.objects.filter(user=user, status='completed').count()
    
    # Revenue stats
    revenue_data = Booking.objects.filter(
        user=user, 
        status__in=['confirmed', 'completed']
    ).aggregate(
        total_revenue=Sum('final_amount'),
        avg_booking_value=Avg('final_amount')
    )
    
    total_revenue = revenue_data['total_revenue'] or 0
    avg_booking_value = revenue_data['avg_booking_value'] or 0
    
    # Monthly bookings (last 12 months)
    from django.db.models.functions import TruncMonth
    monthly_bookings = Booking.objects.filter(
        user=user,
        created_at__gte=timezone.now() - timedelta(days=365)
    ).annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    # Popular venues
    popular_venues = Booking.objects.filter(user=user).values(
        'venue__name', 'venue__city'
    ).annotate(
        booking_count=Count('id')
    ).order_by('-booking_count')[:5]
    
    stats_data = {
        'total_bookings': total_bookings,
        'confirmed_bookings': confirmed_bookings,
        'cancelled_bookings': cancelled_bookings,
        'completed_bookings': completed_bookings,
        'total_revenue': total_revenue,
        'average_booking_value': avg_booking_value,
        'bookings_by_month': list(monthly_bookings),
        'popular_venues': list(popular_venues)
    }
    
    serializer = BookingStatsSerializer(stats_data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def venue_booking_stats(request, venue_id):
    """Get booking statistics for a specific venue (venue owner only)."""
    try:
        from apps.venues.models import Venue
        venue = Venue.objects.get(id=venue_id, owner=request.user)
    except Venue.DoesNotExist:
        return Response({'error': 'Venue not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Basic stats
    total_bookings = Booking.objects.filter(venue=venue).count()
    confirmed_bookings = Booking.objects.filter(venue=venue, status='confirmed').count()
    cancelled_bookings = Booking.objects.filter(venue=venue, status='cancelled').count()
    completed_bookings = Booking.objects.filter(venue=venue, status='completed').count()
    
    # Revenue stats
    revenue_data = Booking.objects.filter(
        venue=venue,
        status__in=['confirmed', 'completed']
    ).aggregate(
        total_revenue=Sum('final_amount'),
        avg_booking_value=Avg('final_amount')
    )
    
    total_revenue = revenue_data['total_revenue'] or 0
    avg_booking_value = revenue_data['avg_booking_value'] or 0
    
    # Monthly bookings
    from django.db.models.functions import TruncMonth
    monthly_bookings = Booking.objects.filter(
        venue=venue,
        created_at__gte=timezone.now() - timedelta(days=365)
    ).annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    # Peak hours analysis
    peak_hours = Booking.objects.filter(
        venue=venue,
        status__in=['confirmed', 'completed']
    ).extra(
        select={'hour': 'EXTRACT(hour FROM start_time)'}
    ).values('hour').annotate(
        booking_count=Count('id')
    ).order_by('-booking_count')[:5]
    
    stats_data = {
        'venue_name': venue.name,
        'total_bookings': total_bookings,
        'confirmed_bookings': confirmed_bookings,
        'cancelled_bookings': cancelled_bookings,
        'completed_bookings': completed_bookings,
        'total_revenue': total_revenue,
        'average_booking_value': avg_booking_value,
        'bookings_by_month': list(monthly_bookings),
        'peak_hours': list(peak_hours)
    }
    
    return Response(stats_data)


class UserBookingsView(generics.ListAPIView):
    """Get bookings for the current user."""
    
    serializer_class = BookingListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status', 'venue', 'payment_intent_id']
    ordering_fields = ['created_at', 'booking_date', 'total_amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).select_related('venue', 'user')


class VenueBookingsView(generics.ListAPIView):
    """Get bookings for venues owned by the current user."""
    
    serializer_class = BookingListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status', 'venue']
    ordering_fields = ['created_at', 'booking_date', 'total_amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        # Get venues owned by the current user
        from apps.venues.models import Venue
        user_venues = Venue.objects.filter(owner=self.request.user)
        venue_ids = user_venues.values_list('id', flat=True)
        
        # Get bookings for these venues
        return Booking.objects.filter(
            venue_id__in=venue_ids
        ).select_related('venue', 'user')


class AdminBookingListView(generics.ListAPIView):
    """Admin view to list all bookings."""
    
    serializer_class = BookingListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status', 'venue', 'booking_date']
    search_fields = ['venue__name', 'user__first_name', 'user__last_name', 'special_requests']
    ordering_fields = ['created_at', 'booking_date', 'total_amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        # Only admin users can access this view
        if not self.request.user.is_staff:
            return Booking.objects.none()
        
        return Booking.objects.all().select_related('venue', 'user')


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def venue_booked_slots(request):
    """Return booked time ranges for a venue on a given date, optionally filtered by courts.

    Response shape (list): [{ courtId, start, end }]
    """
    venue_id = request.GET.get('venue')
    booking_date = request.GET.get('booking_date')
    courts_param = request.GET.get('courts')

    if not venue_id or not booking_date:
        return Response({ 'error': 'venue and booking_date are required' }, status=status.HTTP_400_BAD_REQUEST)

    try:
        qs = BookingCourt.objects.select_related('booking').filter(
            booking__venue_id=venue_id,
            booking_date=booking_date,
            booking__status='confirmed'
        )

        if courts_param:
            try:
                court_ids = [int(x) for x in str(courts_param).split(',') if str(x).strip().isdigit()]
                if court_ids:
                    qs = qs.filter(court_id__in=court_ids)
            except Exception:
                pass

        data = [
            {
                'courtId': bc.court_id,
                'start': bc.start_time.strftime('%H:%M'),
                'end': bc.end_time.strftime('%H:%M'),
            }
            for bc in qs
        ]

        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({ 'error': str(e) }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_booking_status(request, booking_id):
    """Update booking status (admin only)."""
    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
    
    new_status = request.data.get('status')
    if not new_status:
        return Response({'error': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if new_status not in [choice[0] for choice in Booking.BOOKING_STATUS_CHOICES]:
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Update booking status
    booking.status = new_status
    if new_status == 'confirmed':
        booking.confirmed_at = timezone.now()
    elif new_status == 'cancelled':
        booking.cancelled_at = timezone.now()
    booking.save()
    
    serializer = BookingDetailSerializer(booking)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_booking_stats(request):
    """Get booking statistics for admin dashboard."""
    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Basic stats
    total_bookings = Booking.objects.count()
    confirmed_bookings = Booking.objects.filter(status='confirmed').count()
    cancelled_bookings = Booking.objects.filter(status='cancelled').count()
    completed_bookings = Booking.objects.filter(status='completed').count()
    pending_bookings = Booking.objects.filter(status='pending').count()
    
    # Revenue stats
    revenue_data = Booking.objects.filter(
        status__in=['confirmed', 'completed']
    ).aggregate(
        total_revenue=Sum('final_amount'),
        avg_booking_value=Avg('final_amount')
    )
    
    total_revenue = revenue_data['total_revenue'] or 0
    avg_booking_value = revenue_data['avg_booking_value'] or 0
    
    # Payment status stats
    paid_bookings = Booking.objects.filter(payment_status='paid').count()
    pending_payments = Booking.objects.filter(payment_status='pending').count()
    failed_payments = Booking.objects.filter(payment_status='failed').count()
    
    # Recent bookings (last 30 days)
    recent_bookings = Booking.objects.filter(
        created_at__gte=timezone.now() - timedelta(days=30)
    ).count()
    
    stats_data = {
        'total_bookings': total_bookings,
        'confirmed_bookings': confirmed_bookings,
        'cancelled_bookings': cancelled_bookings,
        'completed_bookings': completed_bookings,
        'pending_bookings': pending_bookings,
        'paid_bookings': paid_bookings,
        'pending_payments': pending_payments,
        'failed_payments': failed_payments,
        'total_revenue': total_revenue,
        'average_booking_value': avg_booking_value,
        'recent_bookings': recent_bookings
    }
    
    return Response(stats_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_multi_court_booking(request):
    """Create a multi-court booking."""
    with transaction.atomic():
        serializer = MultiCourtBookingCreateSerializer(data=request.data)
        if serializer.is_valid():
            booking = serializer.save(user=request.user)
            return Response(BookingDetailSerializer(booking).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def create_guest_multi_court_booking(request):
    """Create a multi-court booking for a guest user (no login required)."""
    from django.utils.crypto import get_random_string
    from apps.accounts.models import User

    data = request.data.copy()

    # Extract guest contact fields
    guest_name = data.get('guest_name') or data.get('name')
    guest_email = data.get('guest_email') or data.get('email') or data.get('contact_email')
    guest_phone = data.get('guest_phone') or data.get('phone') or data.get('contact_phone')

    # Ensure booking contact fields are set for downstream serializers and records
    if guest_email and not data.get('contact_email'):
        data['contact_email'] = guest_email
    if guest_phone and not data.get('contact_phone'):
        data['contact_phone'] = guest_phone

    if not guest_email:
        return Response({'error': 'guest_email is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Resolve or create a lightweight user for this guest email
    try:
        user = User.objects.filter(email__iexact=guest_email).first()
        if not user:
            # Generate a unique username, split name if provided
            base_username = 'guest_' + get_random_string(8)
            first_name = ''
            last_name = ''
            if guest_name and isinstance(guest_name, str):
                parts = guest_name.strip().split(' ', 1)
                first_name = parts[0]
                if len(parts) > 1:
                    last_name = parts[1]
            user = User(
                email=guest_email,
                username=base_username,
                first_name=first_name,
                last_name=last_name,
                user_type='player',
            )
            # Set phone if model supports it
            try:
                if guest_phone:
                    user.phone_number = guest_phone
            except Exception:
                pass
            user.set_unusable_password()
            user.save()
    except Exception as e:
        return Response({'error': f'Failed to prepare guest user: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        serializer = MultiCourtBookingCreateSerializer(data=data)
        if serializer.is_valid():
            try:
                booking = serializer.save(user=user)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            return Response(BookingDetailSerializer(booking).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
