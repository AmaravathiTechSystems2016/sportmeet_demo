import json
import uuid
from django.conf import settings
from django.utils import timezone
from rest_framework import generics, status, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.db.models import Sum, Avg, Count
from datetime import timedelta
from .models import Payment, Refund
from .serializers import (
    PaymentSerializer, PaymentCreateSerializer, PaymentIntentSerializer,
    RefundSerializer, RefundCreateSerializer
)
from .stripe_service import StripeService
from apps.bookings.models import Booking
from apps.events.models import Event, EventParticipant


class PaymentListView(generics.ListAPIView):
    """List payments for the current user."""
    
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user).select_related('booking', 'event')


class PaymentDetailView(generics.RetrieveAPIView):
    """Retrieve payment details."""
    
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user).select_related('booking', 'event')


@api_view(['POST'])
@permission_classes([AllowAny])
def create_payment_intent(request):
    """Create a Stripe PaymentIntent."""
    serializer = PaymentIntentSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    amount = data['amount']
    currency = data.get('currency', 'AUD')
    booking_id = data.get('booking_id')
    event_id = data.get('event_id')
    
    # Prepare metadata
    metadata = {}
    if getattr(request, 'user', None) and getattr(request.user, 'is_authenticated', False):
        metadata['user_id'] = str(request.user.id)
        metadata['user_email'] = request.user.email
    
    if booking_id:
        try:
            if getattr(request, 'user', None) and getattr(request.user, 'is_authenticated', False):
                booking = Booking.objects.get(id=booking_id, user=request.user)
            else:
                booking = Booking.objects.get(id=booking_id)
            metadata['booking_id'] = str(booking_id)
            metadata['venue_name'] = booking.venue.name
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    if event_id:
        try:
            event = Event.objects.get(id=event_id)
            metadata['event_id'] = str(event_id)
            metadata['event_title'] = event.title
        except Event.DoesNotExist:
            return Response(
                {'error': 'Event not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    # Create Stripe PaymentIntent
    stripe_service = StripeService()
    result = stripe_service.create_payment_intent(
        amount=float(amount),
        currency=currency,
        metadata=metadata
    )
    
    if result['success']:
        return Response({
            'client_secret': result['client_secret'],
            'payment_intent_id': result['payment_intent_id'],
            'amount': result['amount'],
            'currency': result['currency']
        })
    else:
        return Response(
            {'error': result['error']}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def confirm_payment(request):
    """Confirm a payment after successful Stripe payment."""
    payment_intent_id = request.data.get('payment_intent_id')
    booking_id = request.data.get('booking_id')
    event_id = request.data.get('event_id')
    
    if not payment_intent_id:
        return Response(
            {'error': 'Payment intent ID is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Retrieve payment intent from Stripe
    stripe_service = StripeService()
    result = stripe_service.retrieve_payment_intent(payment_intent_id)
    
    if not result['success']:
        return Response(
            {'error': result['error']}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    intent = result['intent']
    
    if intent.status != 'succeeded':
        return Response(
            {'error': 'Payment not completed'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create payment record
    # Determine user for payment record: use authenticated user if available, otherwise fallback to booking.user
    payment_owner = request.user if getattr(request, 'user', None) and getattr(request.user, 'is_authenticated', False) else None

    payment_data = {
        'user': None,  # set below after resolving booking/user
        'amount': intent.amount / 100,  # Convert from cents
        'currency': intent.currency.upper(),
        'payment_method': 'stripe',
        'status': 'completed',
        'transaction_id': str(uuid.uuid4()),
        'gateway_transaction_id': payment_intent_id,
        'gateway_response': intent,
        'completed_at': timezone.now()
    }
    
    if booking_id:
        try:
            if payment_owner is not None:
                booking = Booking.objects.get(id=booking_id, user=payment_owner)
            else:
                booking = Booking.objects.get(id=booking_id)
            payment_data['booking'] = booking
            # Assign user for payment (guest or authenticated)
            payment_data['user'] = payment_owner or booking.user
            # Update booking status
            booking.payment_status = 'paid'
            booking.status = 'confirmed'
            booking.save()
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    if event_id:
        try:
            event = Event.objects.get(id=event_id)
            payment_data['event'] = event
            # Auto-confirm event participation on successful payment
            from apps.events.models import EventParticipant
            participant = EventParticipant.objects.filter(event=event, user=request.user).order_by('-registration_date').first()
            if participant:
                participant.payment_status = 'paid'
                participant.status = 'confirmed'
                participant.payment_intent_id = payment_intent_id
                participant.save()
            else:
                EventParticipant.objects.create(
                    event=event,
                    user=request.user,
                    status='confirmed',
                    payment_status='paid',
                    payment_intent_id=payment_intent_id
                )
        except Event.DoesNotExist:
            return Response(
                {'error': 'Event not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    # If not tied to a booking above and authenticated, still set user
    if not payment_data.get('user') and payment_owner is not None:
        payment_data['user'] = payment_owner

    payment = Payment.objects.create(**payment_data)
    serializer = PaymentSerializer(payment)
    
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_refund(request, payment_id):
    """Create a refund for a payment."""
    try:
        payment = Payment.objects.get(id=payment_id, user=request.user)
    except Payment.DoesNotExist:
        return Response(
            {'error': 'Payment not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    if payment.status != 'completed':
        return Response(
            {'error': 'Can only refund completed payments'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = RefundCreateSerializer(
        data=request.data, 
        context={'payment': payment}
    )
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Create Stripe refund
    stripe_service = StripeService()
    refund_amount = serializer.validated_data['amount']
    reason = serializer.validated_data['reason']
    
    result = stripe_service.create_refund(
        payment_intent_id=payment.gateway_transaction_id,
        amount=float(refund_amount),
        reason=reason
    )
    
    if not result['success']:
        return Response(
            {'error': result['error']}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create refund record
    refund = Refund.objects.create(
        payment=payment,
        amount=refund_amount,
        reason=reason,
        status='completed' if result['status'] == 'succeeded' else 'processing',
        gateway_refund_id=result['refund_id'],
        gateway_response=result
    )
    
    # Update payment status if fully refunded
    if refund_amount >= payment.amount:
        payment.status = 'refunded'
        payment.save()
    
    serializer = RefundSerializer(refund)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(['POST'])
@permission_classes([])
def payment_webhook(request):
    """Handle Stripe webhooks."""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    stripe_service = StripeService()
    result = stripe_service.verify_webhook_signature(payload, sig_header)
    
    if not result['success']:
        return JsonResponse({'error': result['error']}, status=400)
    
    event = result['event']
    
    # Handle different event types
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        # Update payment status if needed
        try:
            payment = Payment.objects.get(
                gateway_transaction_id=payment_intent['id']
            )
            if payment.status == 'pending':
                payment.status = 'completed'
                payment.completed_at = timezone.now()
                payment.save()
        except Payment.DoesNotExist:
            pass
    
    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        try:
            payment = Payment.objects.get(
                gateway_transaction_id=payment_intent['id']
            )
            payment.status = 'failed'
            payment.save()
        except Payment.DoesNotExist:
            pass
    
    return JsonResponse({'status': 'success'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_methods(request):
    """Get user's saved payment methods."""
    # This would require implementing customer management
    # For now, return empty list
    return Response({'payment_methods': []})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def setup_payment_method(request):
    """Create a SetupIntent for saving payment methods."""
    stripe_service = StripeService()
    
    # Create or get customer
    customer_result = stripe_service.create_customer(
        email=request.user.email,
        name=f"{request.user.first_name} {request.user.last_name}".strip()
    )
    
    if not customer_result['success']:
        return Response(
            {'error': customer_result['error']}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create setup intent
    setup_result = stripe_service.create_setup_intent(
        customer_result['customer_id']
    )
    
    if not setup_result['success']:
        return Response(
            {'error': setup_result['error']}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    return Response({
        'client_secret': setup_result['client_secret'],
        'setup_intent_id': setup_result['setup_intent_id']
    })


class AdminPaymentListView(generics.ListAPIView):
    """Admin view to list all payments."""
    
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_method', 'booking', 'event']
    search_fields = ['user__first_name', 'user__last_name', 'transaction_id', 'gateway_transaction_id']
    ordering_fields = ['created_at', 'amount', 'completed_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        # Only admin users can access this view
        if not self.request.user.is_staff:
            return Payment.objects.none()
        
        return Payment.objects.all().select_related('user', 'booking', 'event')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_payment_stats(request):
    """Get payment statistics for admin dashboard."""
    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Basic stats
    total_payments = Payment.objects.count()
    completed_payments = Payment.objects.filter(status='completed').count()
    pending_payments = Payment.objects.filter(status='pending').count()
    failed_payments = Payment.objects.filter(status='failed').count()
    refunded_payments = Payment.objects.filter(status='refunded').count()
    
    # Revenue stats
    revenue_data = Payment.objects.filter(
        status='completed'
    ).aggregate(
        total_revenue=Sum('amount'),
        avg_payment_value=Avg('amount')
    )
    
    total_revenue = revenue_data['total_revenue'] or 0
    avg_payment_value = revenue_data['avg_payment_value'] or 0
    
    # Payment method stats
    payment_methods = Payment.objects.values('payment_method').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Recent payments (last 30 days)
    recent_payments = Payment.objects.filter(
        created_at__gte=timezone.now() - timedelta(days=30)
    ).count()
    
    # Monthly revenue (last 12 months)
    from django.db.models.functions import TruncMonth
    monthly_revenue = Payment.objects.filter(
        status='completed',
        created_at__gte=timezone.now() - timedelta(days=365)
    ).annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        revenue=Sum('amount')
    ).order_by('month')
    
    stats_data = {
        'total_payments': total_payments,
        'completed_payments': completed_payments,
        'pending_payments': pending_payments,
        'failed_payments': failed_payments,
        'refunded_payments': refunded_payments,
        'total_revenue': total_revenue,
        'average_payment_value': avg_payment_value,
        'payment_methods': list(payment_methods),
        'recent_payments': recent_payments,
        'monthly_revenue': list(monthly_revenue)
    }
    
    return Response(stats_data)
