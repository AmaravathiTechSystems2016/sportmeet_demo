from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone
from .models import Event, EventParticipant, EventComment
from apps.payments.models import Payment
from .serializers import (
    EventListSerializer, EventDetailSerializer, EventCreateUpdateSerializer,
    EventRegistrationSerializer, EventCommentSerializer, EventBookingSerializer
)


class EventListView(generics.ListCreateAPIView):
    """List all events or create a new event."""
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    queryset = Event.objects.filter(status='published', is_public=True).select_related('organizer')
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['event_type', 'sport_category', 'is_featured']
    search_fields = ['title', 'description', 'venue_name', 'city']
    ordering_fields = ['start_date', 'created_at', 'entry_fee']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return EventCreateUpdateSerializer
        return EventListSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)


class AdminEventListView(generics.ListAPIView):
    """List all events for admin (including drafts)."""
    
    serializer_class = EventListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['event_type', 'sport_category', 'is_featured', 'status']
    search_fields = ['title', 'description', 'venue_name', 'city']
    ordering_fields = ['start_date', 'created_at', 'entry_fee']
    ordering = ['-created_at']
    
    def get_queryset(self):
        # Only show all events if user is staff/admin
        if self.request.user.is_staff:
            return Event.objects.all().select_related('organizer')
        else:
            # Regular users only see their own events
            return Event.objects.filter(organizer=self.request.user).select_related('organizer')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete an event."""
    
    queryset = Event.objects.all().select_related('organizer').prefetch_related(
        'participants__user', 'comments__user', 'images'
    )
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return EventCreateUpdateSerializer
        return EventDetailSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_update(self, serializer):
        # Only allow the organizer or admin to update
        if self.request.user.is_staff or serializer.instance.organizer == self.request.user:
            serializer.save()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to update this event.")

    def perform_destroy(self, instance):
        """Safely delete an event and its related objects to avoid integrity errors."""
        try:
            # Explicitly delete related objects to avoid any unexpected constraints
            instance.participants.all().delete()
            instance.comments.all().delete()
            instance.images.all().delete()
            Payment.objects.filter(event=instance).delete()
        except Exception as e:
            # Log and re-raise to return proper 500 with details in debug
            print(f"Error while deleting related objects for event {instance.id}: {e}")
        finally:
            instance.delete()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_event(request, event_id):
    """Register for an event."""
    try:
        event = Event.objects.get(id=event_id, status='published', is_public=True)
    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = EventRegistrationSerializer(
        data=request.data,
        context={'event': event, 'user': request.user}
    )
    
    if serializer.is_valid():
        participant = serializer.save()
        return Response({
            'message': 'Successfully registered for the event',
            'participant': {
                'id': participant.id,
                'status': participant.status,
                'registration_date': participant.registration_date
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unregister_event(request, event_id):
    """Unregister from an event."""
    try:
        participant = EventParticipant.objects.get(
            event_id=event_id,
            user=request.user
        )
    except EventParticipant.DoesNotExist:
        return Response({'error': 'Not registered for this event'}, status=status.HTTP_404_NOT_FOUND)
    
    participant.delete()
    return Response({'message': 'Successfully unregistered from the event'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_comment(request, event_id):
    """Add a comment to an event."""
    try:
        event = Event.objects.get(id=event_id, status='published', is_public=True)
    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = EventCommentSerializer(data=request.data)
    if serializer.is_valid():
        comment = serializer.save(event=event, user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def event_stats(request):
    """Get event statistics."""
    total_events = Event.objects.filter(status='published', is_public=True).count()
    upcoming_events = Event.objects.filter(
        status='published',
        is_public=True,
        start_date__gte=timezone.now().date()
    ).count()
    
    # Events by sport category
    sport_stats = Event.objects.filter(status='published', is_public=True).values(
        'sport_category'
    ).annotate(count=Count('id')).order_by('-count')
    
    # Events by type
    type_stats = Event.objects.filter(status='published', is_public=True).values(
        'event_type'
    ).annotate(count=Count('id')).order_by('-count')
    
    return Response({
        'total_events': total_events,
        'upcoming_events': upcoming_events,
        'events_by_sport': list(sport_stats),
        'events_by_type': list(type_stats)
    })


class UserEventsView(generics.ListAPIView):
    """Get events organized by the current user."""
    
    serializer_class = EventListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'event_type', 'sport_category']
    ordering_fields = ['start_date', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Event.objects.filter(organizer=self.request.user).select_related('organizer')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class UserParticipationsView(generics.ListAPIView):
    """Get events the current user is participating in."""
    
    serializer_class = EventListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['event_type', 'sport_category']
    ordering_fields = ['start_date', 'created_at']
    ordering = ['-start_date']
    
    def get_queryset(self):
        return Event.objects.filter(
            participants__user=self.request.user,
            status='published'
        ).select_related('organizer').distinct()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class EventBookingsView(generics.ListAPIView):
    """List all event bookings for admin."""
    
    serializer_class = EventBookingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['event', 'status', 'payment_status']
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'event__title']
    ordering_fields = ['registration_date', 'status']
    ordering = ['-registration_date']
    
    def get_queryset(self):
        # Only show bookings for events organized by the current user (for venue owners)
        # or all bookings if user is admin
        if self.request.user.is_staff:
            return EventParticipant.objects.select_related(
                'user', 'event', 'event__organizer'
            ).all()
        else:
            return EventParticipant.objects.filter(
                event__organizer=self.request.user
            ).select_related(
                'user', 'event', 'event__organizer'
            )
