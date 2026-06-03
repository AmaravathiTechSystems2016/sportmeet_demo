from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from apps.accounts.models import User


class Discount(models.Model):
    """Discount/Coupon model for venue and event bookings."""
    
    DISCOUNT_TYPE_CHOICES = [
        ('fixed', 'Fixed Amount'),
        ('percentage', 'Percentage'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('expired', 'Expired'),
    ]
    
    # Basic Information
    code = models.CharField(max_length=50, unique=True, help_text="Coupon code (e.g., WELCOME10)")
    name = models.CharField(max_length=200, help_text="Display name for the discount")
    description = models.TextField(blank=True, help_text="Description of the discount")
    
    # Discount Details
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES, default='percentage')
    value = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(0)],
        help_text="Fixed amount or percentage value"
    )
    max_discount_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Maximum discount amount (for percentage discounts)"
    )
    min_order_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        help_text="Minimum order amount required to use this discount"
    )
    
    # Validity
    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Usage Limits
    usage_limit = models.PositiveIntegerField(
        null=True, 
        blank=True,
        help_text="Maximum number of times this discount can be used (null = unlimited)"
    )
    usage_count = models.PositiveIntegerField(default=0)
    user_limit = models.PositiveIntegerField(
        default=1,
        help_text="Maximum number of times a single user can use this discount"
    )
    
    # Restrictions
    first_time_only = models.BooleanField(
        default=False,
        help_text="Can only be used by first-time users"
    )
    applicable_to_venues = models.BooleanField(default=True)
    applicable_to_events = models.BooleanField(default=True)
    
    # Specific Venues/Events (optional)
    specific_venues = models.ManyToManyField(
        'venues.Venue', 
        blank=True,
        help_text="Specific venues this discount applies to (empty = all venues)"
    )
    specific_events = models.ManyToManyField(
        'events.Event', 
        blank=True,
        help_text="Specific events this discount applies to (empty = all events)"
    )
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_discounts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'discounts'
        verbose_name = 'Discount'
        verbose_name_plural = 'Discounts'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.code} - {self.name}"
    
    def is_valid(self):
        """Check if the discount is currently valid."""
        now = timezone.now()
        
        # Check status
        if self.status != 'active':
            return False
        
        # Check date validity
        if self.valid_from and now < self.valid_from:
            return False
        if self.valid_until and now > self.valid_until:
            return False
        
        # Check usage limit
        if self.usage_limit and self.usage_count >= self.usage_limit:
            return False
        
        return True
    
    def can_be_used_by_user(self, user, booking_type=None, venue=None, event=None, amount=None):
        """Check if a user can use this discount."""
        if not self.is_valid():
            return False, "Discount is not valid"
        
        # Check if user has exceeded usage limit
        user_usage_count = DiscountUsage.objects.filter(
            discount=self,
            user=user
        ).count()
        
        if user_usage_count >= self.user_limit:
            return False, f"You have already used this discount {user_usage_count} times"
        
        # Check first-time user restriction
        if self.first_time_only:
            has_previous_booking = False
            if booking_type == 'venue' and venue:
                has_previous_booking = Booking.objects.filter(
                    user=user,
                    venue=venue,
                    status__in=['confirmed', 'completed']
                ).exists()
            elif booking_type == 'event' and event:
                has_previous_booking = EventParticipant.objects.filter(
                    user=user,
                    event=event,
                    status__in=['confirmed', 'registered']
                ).exists()
            
            if has_previous_booking:
                return False, "This discount is only for first-time users"
        
        # Check minimum order amount
        # Prefer explicit 'amount' if provided (total to charge for this booking)
        if amount is not None:
            try:
                if amount < self.min_order_amount:
                    return False, f"Minimum order amount of ${self.min_order_amount} required"
            except Exception:
                pass
        else:
            # Fallback heuristics when amount isn't provided
            if booking_type == 'event' and event and hasattr(event, 'entry_fee'):
                if event.entry_fee < self.min_order_amount:
                    return False, f"Minimum order amount of ${self.min_order_amount} required"
        
        # Check specific venues/events
        if self.specific_venues.exists() and venue and venue not in self.specific_venues.all():
            return False, "This discount is not valid for this venue"
        
        if self.specific_events.exists() and event and event not in self.specific_events.all():
            return False, "This discount is not valid for this event"
        
        return True, "Valid"
    
    def calculate_discount(self, amount):
        """Calculate the discount amount for a given order amount."""
        if self.discount_type == 'fixed':
            return min(self.value, amount)
        elif self.discount_type == 'percentage':
            discount = (self.value / 100) * amount
            if self.max_discount_amount:
                discount = min(discount, self.max_discount_amount)
            return discount
        return 0


class DiscountUsage(models.Model):
    """Track discount usage by users."""
    
    discount = models.ForeignKey(Discount, on_delete=models.CASCADE, related_name='usage_records')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='discount_usage')
    
    # Booking details
    booking_type = models.CharField(max_length=20, choices=[
        ('venue', 'Venue Booking'),
        ('event', 'Event Booking'),
    ])
    booking_id = models.PositiveIntegerField(help_text="ID of the booking/event participation")
    
    # Amount details
    original_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Metadata
    used_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        db_table = 'discount_usage'
        verbose_name = 'Discount Usage'
        verbose_name_plural = 'Discount Usage Records'
        ordering = ['-used_at']
        unique_together = ['discount', 'user', 'booking_id', 'booking_type']
    
    def __str__(self):
        return f"{self.user.email} used {self.discount.code} on {self.used_at}"