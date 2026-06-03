from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Review
from .serializers import ReviewSerializer


class AdminReviewListView(generics.ListAPIView):
    """Admin: list all reviews regardless of approval."""
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['venue', 'is_approved', 'overall_rating']

    def get_queryset(self):
        user = self.request.user
        if not user.is_staff:
            return Review.objects.none()
        return Review.objects.all().select_related('venue', 'user')

class ReviewListView(generics.ListCreateAPIView):
    """List all reviews or create a new review."""
    
    queryset = Review.objects.filter(is_approved=True).select_related('venue', 'user')
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['venue', 'is_approved', 'overall_rating']
    
    def get_queryset(self):
        # Start with all reviews, not just approved ones
        queryset = Review.objects.all().select_related('venue', 'user')
        
        # For venue owners, show their venues' reviews (both approved and pending)
        # For regular (non-owner) users, show only approved reviews
        user = self.request.user
        if not user.is_staff:
            if getattr(user, 'user_type', '') == 'venue_owner':
                queryset = queryset.filter(venue__owner=user)
            else:
                queryset = queryset.filter(is_approved=True)
        
        # Filter by venue owner if requested
        venue_owner = self.request.query_params.get('venue_owner')
        if venue_owner == 'me' and self.request.user.is_authenticated:
            queryset = queryset.filter(venue__owner=self.request.user)
        
        # Filter by search term
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(comment__icontains=search) |
                Q(title__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(venue__name__icontains=search)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        # Allow one review per user per venue: if exists, update it instead of 400
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        venue = serializer.validated_data.get('venue')
        user = request.user

        try:
            existing = Review.objects.get(venue=venue, user=user)
            update_serializer = self.get_serializer(existing, data=serializer.validated_data, partial=True)
            update_serializer.is_valid(raise_exception=True)
            self.perform_update(update_serializer)
            headers = self.get_success_headers(update_serializer.data)
            return Response(update_serializer.data, status=status.HTTP_200_OK, headers=headers)
        except Review.DoesNotExist:
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a review."""
    
    queryset = Review.objects.all().select_related('venue', 'user')
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return Review.objects.all().select_related('venue', 'user')
        return Review.objects.filter(user=self.request.user).select_related('venue', 'user')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_review(request):
    """Create a new review."""
    serializer = ReviewSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def venue_reviews(request, venue_id):
    """Get reviews for a specific venue."""
    reviews = Review.objects.filter(
        venue_id=venue_id,
        is_approved=True
    ).select_related('user')
    
    serializer = ReviewSerializer(reviews, many=True)
    return Response(serializer.data)
