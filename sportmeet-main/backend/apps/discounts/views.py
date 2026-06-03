from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from .models import Discount, DiscountUsage
from django.db.models import Q, F, Sum, Count
from .serializers import (
    DiscountSerializer, DiscountDetailSerializer, DiscountCreateUpdateSerializer,
    DiscountUsageSerializer, DiscountValidationSerializer
)


class DiscountListView(generics.ListCreateAPIView):
    """List all discounts or create a new discount (admin only)."""
    
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'discount_type', 'applicable_to_venues', 'applicable_to_events']
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['created_at', 'valid_from', 'valid_until', 'usage_count']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DiscountCreateUpdateSerializer
        return DiscountSerializer
    
    def get_queryset(self):
        return Discount.objects.all().prefetch_related('specific_venues', 'specific_events')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class DiscountDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a discount (admin only)."""
    
    permission_classes = [IsAdminUser]
    queryset = Discount.objects.all().prefetch_related('specific_venues', 'specific_events')
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return DiscountCreateUpdateSerializer
        return DiscountDetailSerializer


class DiscountUsageListView(generics.ListAPIView):
    """List discount usage records (admin only)."""
    
    serializer_class = DiscountUsageSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['discount', 'user', 'booking_type']
    search_fields = ['discount__code', 'user__first_name', 'user__last_name', 'user__email']
    ordering_fields = ['used_at', 'discount_amount', 'final_amount']
    ordering = ['-used_at']
    
    def get_queryset(self):
        return DiscountUsage.objects.select_related('discount', 'user').all()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_discount(request):
    """Validate a discount code and calculate discount amount."""
    serializer = DiscountValidationSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        validation_data = serializer.validated_data
        discount = validation_data['discount']
        
        return Response({
            'valid': True,
            'discount': {
                'id': discount.id,
                'code': discount.code,
                'name': discount.name,
                'description': discount.description,
                'discount_type': discount.discount_type,
                'value': discount.value,
            },
            'discount_amount': float(validation_data['discount_amount']),
            'final_amount': float(validation_data['final_amount']),
            'original_amount': float(validation_data['original_amount']),
        })
    
    return Response({
        'valid': False,
        'error': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_discount(request):
    """Apply a discount to a booking and record usage."""
    serializer = DiscountValidationSerializer(data=request.data, context={'request': request})
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    validation_data = serializer.validated_data
    discount = validation_data['discount']
    booking_type = validation_data['booking_type']
    booking_id = request.data.get('booking_id')
    
    if not booking_id:
        return Response({
            'success': False,
            'error': 'Booking ID is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Record the discount usage
    usage_record = DiscountUsage.objects.create(
        discount=discount,
        user=request.user,
        booking_type=booking_type,
        booking_id=booking_id,
        original_amount=validation_data['original_amount'],
        discount_amount=validation_data['discount_amount'],
        final_amount=validation_data['final_amount'],
        ip_address=request.META.get('REMOTE_ADDR')
    )
    
    # Update discount usage count
    discount.usage_count += 1
    discount.save(update_fields=['usage_count'])
    
    return Response({
        'success': True,
        'usage_record': DiscountUsageSerializer(usage_record).data,
        'discount_amount': float(validation_data['discount_amount']),
        'final_amount': float(validation_data['final_amount']),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_discounts(request):
    """Get discounts available to the current user."""
    user = request.user
    
    # Get active discounts that are applicable
    discounts = Discount.objects.filter(
        status='active',
        valid_from__lte=timezone.now()
    ).filter(
        Q(valid_until__isnull=True) | Q(valid_until__gt=timezone.now())
    ).filter(
        Q(usage_limit__isnull=True) | Q(usage_count__lt=F('usage_limit'))
    )
    
    # Filter by applicable types
    applicable_discounts = []
    for discount in discounts:
        # Check if user can use this discount
        can_use, _ = discount.can_be_used_by_user(user)
        if can_use:
            applicable_discounts.append(discount)
    
    serializer = DiscountSerializer(applicable_discounts, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def discount_stats(request):
    """Get discount statistics for admin dashboard."""
    total_discounts = Discount.objects.count()
    active_discounts = Discount.objects.filter(status='active').count()
    expired_discounts = Discount.objects.filter(status='expired').count()
    
    # Usage statistics
    total_usage = DiscountUsage.objects.count()
    total_savings = DiscountUsage.objects.aggregate(
        total=Sum('discount_amount')
    )['total'] or 0
    
    # Most used discounts
    most_used = Discount.objects.annotate(
        usage_count=Count('usage_records')
    ).order_by('-usage_count')[:5]
    
    # Recent usage
    recent_usage = DiscountUsage.objects.select_related(
        'discount', 'user'
    ).order_by('-used_at')[:10]
    
    return Response({
        'total_discounts': total_discounts,
        'active_discounts': active_discounts,
        'expired_discounts': expired_discounts,
        'total_usage': total_usage,
        'total_savings': float(total_savings),
        'most_used_discounts': DiscountSerializer(most_used, many=True).data,
        'recent_usage': DiscountUsageSerializer(recent_usage, many=True).data,
    })