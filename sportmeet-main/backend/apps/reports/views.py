from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Avg
from django.utils import timezone
from datetime import timedelta
from .models import Report
from .serializers import ReportSerializer


class ReportListView(generics.ListCreateAPIView):
    """List and create reports."""
    
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Report.objects.filter(created_by=self.request.user)


class ReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a report."""
    
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Report.objects.filter(created_by=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics."""
    from apps.venues.models import Venue
    from apps.bookings.models import Booking
    from apps.events.models import Event
    from apps.reviews.models import Review
    
    # Basic stats
    total_venues = Venue.objects.filter(owner=request.user).count()
    total_bookings = Booking.objects.filter(venue__owner=request.user).count()
    total_events = Event.objects.filter(organizer=request.user).count()
    
    # Revenue stats
    revenue_data = Booking.objects.filter(
        venue__owner=request.user,
        status__in=['confirmed', 'completed']
    ).aggregate(
        total_revenue=Sum('final_amount'),
        avg_booking_value=Avg('final_amount')
    )
    
    # Reviews stats for venues owned by this user
    owner_reviews = Review.objects.filter(venue__owner=request.user, is_approved=True)
    reviews_count = owner_reviews.count()
    avg_rating = owner_reviews.aggregate(avg=Avg('overall_rating'))['avg'] or 0

    return Response({
        'total_venues': total_venues,
        'total_bookings': total_bookings,
        'total_events': total_events,
        'total_revenue': revenue_data['total_revenue'] or 0,
        'avg_booking_value': revenue_data['avg_booking_value'] or 0,
        'reviews': {
            'count': reviews_count,
            'average_rating': avg_rating
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def venue_analytics(request):
    """Get venue analytics."""
    from apps.venues.models import Venue
    from apps.bookings.models import Booking
    
    venues = Venue.objects.filter(owner=request.user)
    
    # Venue performance
    venue_stats = []
    for venue in venues:
        bookings = Booking.objects.filter(venue=venue)
        stats = {
            'venue_name': venue.name,
            'total_bookings': bookings.count(),
            'confirmed_bookings': bookings.filter(status='confirmed').count(),
            'revenue': bookings.filter(status__in=['confirmed', 'completed']).aggregate(
                total=Sum('final_amount')
            )['total'] or 0,
            'average_rating': venue.average_rating
        }
        venue_stats.append(stats)
    
    return Response(venue_stats)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def booking_analytics(request):
    """Get booking analytics."""
    from apps.bookings.models import Booking
    
    # Monthly bookings
    from django.db.models.functions import TruncMonth
    monthly_bookings = Booking.objects.filter(
        venue__owner=request.user,
        created_at__gte=timezone.now() - timedelta(days=365)
    ).annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    return Response({
        'monthly_bookings': list(monthly_bookings)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def revenue_report(request):
    """Get revenue report."""
    from apps.bookings.models import Booking
    
    # Revenue by month
    from django.db.models.functions import TruncMonth
    monthly_revenue = Booking.objects.filter(
        venue__owner=request.user,
        status__in=['confirmed', 'completed'],
        created_at__gte=timezone.now() - timedelta(days=365)
    ).annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        revenue=Sum('final_amount')
    ).order_by('month')
    
    return Response({
        'monthly_revenue': list(monthly_revenue)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_activity_report(request):
    """Get user activity report."""
    from apps.accounts.models import User
    
    # User registration by month
    from django.db.models.functions import TruncMonth
    user_registrations = User.objects.filter(
        created_at__gte=timezone.now() - timedelta(days=365)
    ).annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    return Response({
        'user_registrations': list(user_registrations)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_report(request, pk):
    """Generate a specific report."""
    try:
        report = Report.objects.get(id=pk, created_by=request.user)
    except Report.DoesNotExist:
        return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Generate report data based on type
    # This is a simplified implementation
    report.is_generated = True
    report.generated_at = timezone.now()
    report.save()
    
    return Response({'message': 'Report generated successfully'})
