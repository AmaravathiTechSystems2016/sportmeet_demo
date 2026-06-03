from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Sum, Avg, Q, OuterRef, Subquery, Value, IntegerField, FloatField, DecimalField
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import timedelta, datetime
from django.contrib.auth import get_user_model
from apps.venues.models import Venue
from apps.bookings.models import Booking
from apps.reviews.models import Review
from apps.events.models import Event
from apps.payments.models import Payment
from apps.bookings.models import BookingReview

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard_stats(request):
    """Get comprehensive statistics for admin dashboard."""
    try:
        # User statistics
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        venue_owners = User.objects.filter(user_type='venue_owner').count()
        regular_users = total_users - venue_owners
        
        # Venue statistics
        total_venues = Venue.objects.count()
        active_venues = Venue.objects.filter(status='active').count()
        pending_venues = Venue.objects.filter(status='pending').count()
        
        # Booking statistics (combine venue bookings + event registrations)
        from apps.events.models import EventParticipant
        venue_total = Booking.objects.count()
        event_total = EventParticipant.objects.count()
        total_bookings = venue_total + event_total

        confirmed_bookings = (
            Booking.objects.filter(status='confirmed').count() +
            EventParticipant.objects.filter(status='confirmed').count()
        )
        completed_bookings = Booking.objects.filter(status='completed').count()
        cancelled_bookings = (
            Booking.objects.filter(status='cancelled').count() +
            EventParticipant.objects.filter(status='cancelled').count()
        )
        pending_bookings = (
            Booking.objects.filter(status='pending').count() +
            EventParticipant.objects.filter(status='registered').count()
        )
        
        # Revenue statistics
        revenue_data = Booking.objects.filter(
            status__in=['confirmed', 'completed'],
            payment_status='paid'
        ).aggregate(
            total_revenue=Sum('final_amount'),
            avg_booking_value=Avg('final_amount')
        )
        
        total_revenue = revenue_data['total_revenue'] or 0
        avg_booking_value = revenue_data['avg_booking_value'] or 0
        
        # Event statistics
        total_events = Event.objects.count()
        published_events = Event.objects.filter(status='published').count()
        draft_events = Event.objects.filter(status='draft').count()
        
        # Payment statistics
        total_payments = Payment.objects.count()
        completed_payments = Payment.objects.filter(status='completed').count()
        failed_payments = Payment.objects.filter(status='failed').count()
        
        # Review statistics
        from apps.reviews.models import Review
        total_reviews = Review.objects.count()
        avg_rating = Review.objects.aggregate(avg_rating=Avg('overall_rating'))['avg_rating'] or 0
        
        # Growth calculations (comparing last 30 days with previous 30 days)
        now = timezone.now()
        last_30_days = now - timedelta(days=30)
        previous_30_days = now - timedelta(days=60)
        
        # User growth
        users_last_30 = User.objects.filter(date_joined__gte=last_30_days).count()
        users_previous_30 = User.objects.filter(
            date_joined__gte=previous_30_days,
            date_joined__lt=last_30_days
        ).count()
        user_growth = ((users_last_30 - users_previous_30) / max(users_previous_30, 1)) * 100 if users_previous_30 > 0 else 0
        
        # Booking growth (venue + event participants)
        bookings_last_30 = (
            Booking.objects.filter(created_at__gte=last_30_days).count() +
            EventParticipant.objects.filter(registration_date__gte=last_30_days).count()
        )
        bookings_previous_30 = (
            Booking.objects.filter(created_at__gte=previous_30_days, created_at__lt=last_30_days).count() +
            EventParticipant.objects.filter(registration_date__gte=previous_30_days, registration_date__lt=last_30_days).count()
        )
        booking_growth = ((bookings_last_30 - bookings_previous_30) / max(bookings_previous_30, 1)) * 100 if bookings_previous_30 > 0 else 0
        
        # Revenue growth
        revenue_last_30 = Booking.objects.filter(
            created_at__gte=last_30_days,
            status__in=['confirmed', 'completed'],
            payment_status='paid'
        ).aggregate(total=Sum('final_amount'))['total'] or 0
        
        revenue_previous_30 = Booking.objects.filter(
            created_at__gte=previous_30_days,
            created_at__lt=last_30_days,
            status__in=['confirmed', 'completed'],
            payment_status='paid'
        ).aggregate(total=Sum('final_amount'))['total'] or 0
        
        revenue_growth = ((revenue_last_30 - revenue_previous_30) / max(revenue_previous_30, 1)) * 100 if revenue_previous_30 > 0 else 0
        
        # Monthly revenue data for chart (last 6 months)
        monthly_revenue = []
        for i in range(6):
            month_start = now.replace(day=1) - timedelta(days=30 * i)
            month_end = month_start + timedelta(days=30)
            
            month_revenue = Booking.objects.filter(
                created_at__gte=month_start,
                created_at__lt=month_end,
                status__in=['confirmed', 'completed'],
                payment_status='paid'
            ).aggregate(total=Sum('final_amount'))['total'] or 0
            
            monthly_revenue.append({
                'month': month_start.strftime('%b'),
                'revenue': float(month_revenue),
                'bookings': Booking.objects.filter(
                    created_at__gte=month_start,
                    created_at__lt=month_end
                ).count()
            })
        
        monthly_revenue.reverse()  # Show oldest to newest
        
        stats_data = {
            'users': {
                'total': total_users,
                'active': active_users,
                'venue_owners': venue_owners,
                'regular_users': regular_users,
                'growth_percentage': round(user_growth, 1)
            },
            'venues': {
                'total': total_venues,
                'active': active_venues,
                'pending': pending_venues
            },
            'bookings': {
                'total': total_bookings,
                'confirmed': confirmed_bookings,
                'completed': completed_bookings,
                'cancelled': cancelled_bookings,
                'pending': pending_bookings,
                'growth_percentage': round(booking_growth, 1)
            },
            'revenue': {
                'total': float(total_revenue),
                'average_booking_value': float(avg_booking_value),
                'growth_percentage': round(revenue_growth, 1)
            },
            'events': {
                'total': total_events,
                'published': published_events,
                'draft': draft_events
            },
            'payments': {
                'total': total_payments,
                'completed': completed_payments,
                'failed': failed_payments
            },
            'reviews': {
                'total': total_reviews,
                'average_rating': round(avg_rating, 1)
            },
            'monthly_data': monthly_revenue
        }
        
        return Response(stats_data)
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_recent_activity(request):
    """Get recent activity for admin dashboard."""
    try:
        activities = []
        
        # Get filter parameters
        activity_type = request.GET.get('type', '')
        status_filter = request.GET.get('status', '')
        search_term = request.GET.get('search', '')
        try:
            limit = int(request.GET.get('limit', 20))  # Default to 20 for activity log, 3 for dashboard
        except (ValueError, TypeError):
            limit = 20  # Default to 20 if invalid limit provided
        
        # Recent bookings
        recent_bookings = Booking.objects.select_related('user', 'venue').order_by('-created_at')[:limit]
        for booking in recent_bookings:
            activities.append({
                'id': f"booking_{booking.id}",
                'type': 'booking',
                'message': f"New booking created for {booking.venue.name}",
                'time': booking.created_at,
                'status': 'success' if booking.status == 'confirmed' else 'info',
                'user': booking.user.get_full_name() or booking.user.email
            })
        
        # Recent users
        recent_users = User.objects.filter(
            date_joined__gte=timezone.now() - timedelta(days=30)
        ).order_by('-date_joined')[:limit]
        for user in recent_users:
            activities.append({
                'id': f"user_{user.id}",
                'type': 'user',
                'message': f"New user registered: {user.get_full_name() or user.email}",
                'time': user.date_joined,
                'status': 'info',
                'user': user.get_full_name() or user.email
            })
        
        # Recent venue updates
        recent_venues = Venue.objects.filter(
            updated_at__gte=timezone.now() - timedelta(days=30)
        ).order_by('-updated_at')[:limit]
        for venue in recent_venues:
            activities.append({
                'id': f"venue_{venue.id}",
                'type': 'venue',
                'message': f"Venue '{venue.name}' was updated",
                'time': venue.updated_at,
                'status': 'info',
                'user': venue.owner.get_full_name() or venue.owner.email
            })
        
        # Recent payments
        recent_payments = Payment.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=30)
        ).select_related('user').order_by('-created_at')[:limit]
        for payment in recent_payments:
            activities.append({
                'id': f"payment_{payment.id}",
                'type': 'payment',
                'message': f"Payment of ${payment.amount:.2f} processed successfully",
                'time': payment.created_at,
                'status': 'success' if payment.status == 'completed' else 'warning',
                'user': payment.user.get_full_name() or payment.user.email
            })
        
        # Recent reviews
        from apps.reviews.models import Review
        recent_reviews = Review.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=30)
        ).select_related('user', 'venue').order_by('-created_at')[:limit]
        for review in recent_reviews:
            activities.append({
                'id': f"review_{review.id}",
                'type': 'review',
                'message': f"New {review.overall_rating}-star review received for {review.venue.name}",
                'time': review.created_at,
                'status': 'success',
                'user': review.user.get_full_name() or review.user.email
            })
        
        # Apply filters
        if activity_type:
            activities = [a for a in activities if a['type'] == activity_type]
        
        if status_filter:
            activities = [a for a in activities if a['status'] == status_filter]
        
        if search_term:
            search_lower = search_term.lower()
            activities = [a for a in activities if 
                search_lower in a['message'].lower() or 
                (a['user'] and search_lower in a['user'].lower())]
        
        # Sort all activities by time (most recent first)
        activities.sort(key=lambda x: x['time'], reverse=True)
        
        # Format time for display
        for activity in activities:
            time_diff = timezone.now() - activity['time']
            if time_diff.days > 0:
                activity['time_display'] = f"{time_diff.days} day{'s' if time_diff.days > 1 else ''} ago"
            elif time_diff.seconds > 3600:
                hours = time_diff.seconds // 3600
                activity['time_display'] = f"{hours} hour{'s' if hours > 1 else ''} ago"
            elif time_diff.seconds > 60:
                minutes = time_diff.seconds // 60
                activity['time_display'] = f"{minutes} minute{'s' if minutes > 1 else ''} ago"
            else:
                activity['time_display'] = "Just now"
        
        # Return activities (limit to 10 for dashboard, more for activity log)
        max_activities = 10 if limit <= 10 else limit
        return Response(activities[:max_activities])
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_top_venues(request):
    """Get top performing venues for admin dashboard."""
    try:
        # Subqueries to avoid multi-join aggregation pitfalls
        bookings_qs = Booking.objects.filter(
            venue=OuterRef('pk'),
            status__in=['confirmed', 'completed']
        )
        total_bookings_sq = bookings_qs.values('venue').annotate(c=Count('id')).values('c')[:1]

        revenue_qs = Booking.objects.filter(
            venue=OuterRef('pk'),
            status__in=['confirmed', 'completed'],
            payment_status='paid'
        )
        total_revenue_sq = revenue_qs.values('venue').annotate(s=Sum('final_amount')).values('s')[:1]

        reviews_qs = Review.objects.filter(
            venue=OuterRef('pk'),
            is_approved=True
        )
        avg_rating_sq = reviews_qs.values('venue').annotate(a=Avg('overall_rating')).values('a')[:1]
        review_count_sq = reviews_qs.values('venue').annotate(c=Count('id')).values('c')[:1]

        top_venues = Venue.objects.annotate(
            total_bookings=Coalesce(
                Subquery(total_bookings_sq, output_field=IntegerField()),
                Value(0, output_field=IntegerField())
            ),
            total_revenue=Coalesce(
                Subquery(total_revenue_sq, output_field=DecimalField(max_digits=12, decimal_places=2)),
                Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))
            ),
            avg_rating=Coalesce(
                Subquery(avg_rating_sq, output_field=FloatField()),
                Value(0.0, output_field=FloatField())
            ),
            review_count=Coalesce(
                Subquery(review_count_sq, output_field=IntegerField()),
                Value(0, output_field=IntegerField())
            ),
        ).filter(
            total_bookings__gt=0
        ).order_by('-total_revenue')[:10]
        
        venues_data = []
        for venue in top_venues:
            venues_data.append({
                'id': venue.id,
                'name': venue.name,
                'bookings': venue.total_bookings or 0,
                'revenue': float(venue.total_revenue or 0),
                'rating': round(venue.avg_rating or 0, 1),
                'total_reviews': venue.review_count or 0,
                'status': venue.status,
                'city': venue.city,
                'state': venue.state
            })
        
        return Response(venues_data)
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
