from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.accounts.models import User
from apps.venues.models import Venue


class Booking(models.Model):
    """Booking model for venue reservations - supports multi-court bookings."""
    
    BOOKING_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
        ('no_show', 'No Show'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('partially_refunded', 'Partially Refunded'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='bookings')
    
    # Booking details - for multi-court bookings, these represent the overall booking window
    booking_date = models.DateField()
    start_time = models.TimeField()  # Earliest start time across all courts
    end_time = models.TimeField()    # Latest end time across all courts
    duration_hours = models.DecimalField(max_digits=4, decimal_places=2)  # Total duration across all courts
    
    # Pricing - aggregated across all courts
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    price_per_hour = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=3, default='AUD')
    
    # Status
    status = models.CharField(max_length=20, choices=BOOKING_STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    
    # Additional information
    special_requests = models.TextField(blank=True)
    number_of_players = models.PositiveIntegerField(default=1)
    contact_phone = models.CharField(max_length=17, blank=True)
    contact_email = models.EmailField(blank=True)
    notes = models.TextField(blank=True)
    payment_intent_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Legacy field for backward compatibility - will be null for multi-court bookings
    court = models.ForeignKey('venues.Court', on_delete=models.SET_NULL, null=True, blank=True, related_name='legacy_bookings')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    # Cancellation
    cancellation_reason = models.TextField(blank=True)
    cancellation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    class Meta:
        db_table = 'bookings'
        verbose_name = 'Booking'
        verbose_name_plural = 'Bookings'
        ordering = ['-created_at']
        # Remove unique constraint for multi-court support
        # unique_together = ['venue', 'booking_date', 'start_time', 'court']
    
    def __str__(self):
        courts = self.booking_courts.all()
        if courts.count() > 1:
            court_names = ', '.join([court.court.name for court in courts])
            return f"{self.venue.name} - {self.booking_date} {self.start_time}-{self.end_time} ({court_names})"
        elif courts.count() == 1:
            return f"{self.venue.name} - {self.booking_date} {self.start_time}-{self.end_time} ({courts.first().court.name})"
        else:
            return f"{self.venue.name} - {self.booking_date} {self.start_time}-{self.end_time}"
    
    def save(self, *args, **kwargs):
        # Calculate totals using Decimal-safe arithmetic
        from decimal import Decimal, ROUND_HALF_UP
        # Coerce monetary and duration fields to Decimal
        price_per_hour = Decimal(str(self.price_per_hour)) if self.price_per_hour is not None else Decimal('0')
        duration_hours = Decimal(str(self.duration_hours)) if self.duration_hours is not None else Decimal('0')
        discount_amount = Decimal(str(self.discount_amount)) if self.discount_amount is not None else Decimal('0')

        self.total_amount = (price_per_hour * duration_hours).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.final_amount = (self.total_amount - discount_amount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        super().save(*args, **kwargs)


class BookingCourt(models.Model):
    """Individual court booking within a multi-court booking."""
    
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='booking_courts')
    court = models.ForeignKey('venues.Court', on_delete=models.CASCADE, related_name='booking_courts')
    
    # Court-specific timing
    booking_date = models.DateField()  # Same as parent booking
    start_time = models.TimeField()
    end_time = models.TimeField()
    duration_hours = models.DecimalField(max_digits=4, decimal_places=2)
    
    # Court-specific pricing
    price_per_hour = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'booking_courts'
        verbose_name = 'Booking Court'
        verbose_name_plural = 'Booking Courts'
        ordering = ['start_time', 'court__name']
        # Ensure no duplicate court bookings for the same time slot
        unique_together = ['court', 'booking_date', 'start_time']
    
    def __str__(self):
        return f"{self.booking.venue.name} - {self.court.name} - {self.booking.booking_date} {self.start_time}-{self.end_time}"
    
    def save(self, *args, **kwargs):
        # Calculate court-specific totals
        from decimal import Decimal, ROUND_HALF_UP
        price_per_hour = Decimal(str(self.price_per_hour)) if self.price_per_hour is not None else Decimal('0')
        duration_hours = Decimal(str(self.duration_hours)) if self.duration_hours is not None else Decimal('0')
        
        self.total_amount = (price_per_hour * duration_hours).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        super().save(*args, **kwargs)


class BookingTimeSlot(models.Model):
    """Available time slots for booking."""
    
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='time_slots')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    price_override = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    max_players = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'booking_time_slots'
        verbose_name = 'Booking Time Slot'
        verbose_name_plural = 'Booking Time Slots'
        unique_together = ['venue', 'date', 'start_time']
        ordering = ['date', 'start_time']
    
    def __str__(self):
        return f"{self.venue.name} - {self.date} {self.start_time}-{self.end_time}"


class BookingCancellation(models.Model):
    """Booking cancellation details."""
    
    CANCELLATION_REASON_CHOICES = [
        ('weather', 'Bad Weather'),
        ('emergency', 'Emergency'),
        ('venue_issue', 'Venue Issue'),
        ('personal', 'Personal Reason'),
        ('other', 'Other'),
    ]
    
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='cancellation')
    reason = models.CharField(max_length=20, choices=CANCELLATION_REASON_CHOICES)
    reason_description = models.TextField(blank=True)
    cancelled_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cancelled_bookings')
    cancellation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'booking_cancellations'
        verbose_name = 'Booking Cancellation'
        verbose_name_plural = 'Booking Cancellations'
    
    def __str__(self):
        return f"Cancellation for {self.booking}"


class BookingReview(models.Model):
    """Review for completed bookings."""
    
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='review')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='booking_reviews')
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='booking_reviews')
    
    # Rating (1-5 stars)
    overall_rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    cleanliness_rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True, blank=True
    )
    facility_rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True, blank=True
    )
    value_rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True, blank=True
    )
    
    # Review text
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField(blank=True)
    
    # Response from venue owner
    owner_response = models.TextField(blank=True)
    owner_response_date = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'booking_reviews'
        verbose_name = 'Booking Review'
        verbose_name_plural = 'Booking Reviews'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Review for {self.booking} by {self.user.full_name}"