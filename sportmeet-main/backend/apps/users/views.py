from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Q, Count, Avg
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from .serializers import UserSerializer, VenueOwnerSerializer
from apps.venues.models import Venue

User = get_user_model()


class UserListView(generics.ListAPIView):
    """List all users for admin."""
    
    queryset = User.objects.all().select_related('profile').prefetch_related('venues')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'email', 'username']
    ordering_fields = ['date_joined', 'last_login', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Exclude venue owners if requested (by user_type, not by having venues)
        exclude_venue_owners = self.request.query_params.get('exclude_venue_owners', 'false').lower() == 'true'
        if exclude_venue_owners:
            queryset = queryset.exclude(user_type='venue_owner')
        
        # Filter by status (active/inactive)
        status_param = (self.request.query_params.get('status') or '').lower()
        if status_param == 'active':
            queryset = queryset.filter(is_active=True)
        elif status_param == 'inactive':
            queryset = queryset.filter(is_active=False)
        
        # Add venue count
        queryset = queryset.annotate(venues_count=Count('venues'))
        
        return queryset


class VenueOwnerListView(generics.ListAPIView):
    """List all venue owners for admin."""
    
    queryset = User.objects.filter(user_type='venue_owner').distinct().select_related('profile').prefetch_related('venues')
    serializer_class = VenueOwnerSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'email', 'username']
    ordering_fields = ['date_joined', 'last_login', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by status (active/inactive)
        status_param = (self.request.query_params.get('status') or '').lower()
        if status_param == 'active':
            queryset = queryset.filter(is_active=True)
        elif status_param == 'inactive':
            queryset = queryset.filter(is_active=False)

        # Add venue count and other stats
        queryset = queryset.annotate(
            venues_count=Count('venues'),
            average_rating=Avg('venues__average_rating'),
            total_revenue=Count('venues') * 1000  # Placeholder calculation
        )
        
        return queryset


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a user."""
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.annotate(venues_count=Count('venues'))
        return queryset
    
    def update(self, request, *args, **kwargs):
        print(f"UserDetailView update called by user: {request.user}")
        print(f"User is admin: {request.user.is_staff}")
        print(f"User is superuser: {request.user.is_superuser}")
        print(f"Request data: {request.data}")
        return super().update(request, *args, **kwargs)


class VenueOwnerDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a venue owner.

    Important: Use the same scoping criteria as VenueOwnerListView so that
    owners who have not yet created venues can still be edited. Previously this
    view filtered to users with at least one venue (venues__isnull=False),
    which caused 404 on PATCH when editing a venue owner who had zero venues.
    """
    
    queryset = User.objects.filter(user_type='venue_owner').distinct()
    serializer_class = VenueOwnerSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.annotate(
            venues_count=Count('venues'),
            average_rating=Avg('venues__average_rating'),
            total_revenue=Count('venues') * 1000  # Placeholder calculation
        )
        return queryset
    
    def update(self, request, *args, **kwargs):
        print(f"VenueOwnerDetailView update called by user: {request.user}")
        print(f"User is admin: {request.user.is_staff}")
        print(f"User is superuser: {request.user.is_superuser}")
        print(f"Request data: {request.data}")
        return super().update(request, *args, **kwargs)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_stats(request):
    """Get user statistics for admin dashboard."""
    try:
        total_users = User.objects.count()
        total_venue_owners = User.objects.filter(venues__isnull=False).distinct().count()
        active_users = User.objects.filter(is_active=True).count()
        inactive_users = User.objects.filter(is_active=False).count()
        
        return Response({
            'total_users': total_users,
            'total_venue_owners': total_venue_owners,
            'active_users': active_users,
            'inactive_users': inactive_users,
            'regular_users': total_users - total_venue_owners
        })
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
