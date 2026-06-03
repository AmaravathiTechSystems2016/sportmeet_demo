from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.text import slugify
import random
import string
from apps.accounts.models import User

# Import sports models
from .sports_models import Sport, CourtType, Amenity


class Venue(models.Model):
    """Venue model for sports facilities."""
    
    VENUE_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('suspended', 'Suspended'),
    ]
    
    SPORT_CATEGORIES = [
        ('football', 'Football'),
        ('basketball', 'Basketball'),
        ('tennis', 'Tennis'),
        ('cricket', 'Cricket'),
        ('soccer', 'Soccer'),
        ('badminton', 'Badminton'),
        ('volleyball', 'Volleyball'),
        ('swimming', 'Swimming'),
        ('gym', 'Gym'),
        ('other', 'Other'),
    ]
    
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='venues')
    name = models.CharField(max_length=200)
    description = models.TextField()
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postcode = models.CharField(max_length=10)
    country = models.CharField(max_length=100, default='Australia')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    phone_number = models.CharField(max_length=17, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    
    # Venue details
    sport_categories = models.JSONField(default=list)  # List of supported sports
    amenities = models.JSONField(default=list)  # List of amenities
    rules = models.TextField(blank=True)
    cancellation_policy = models.TextField(blank=True)
    
    # Location details
    google_map_link = models.URLField(blank=True, help_text="Google Maps link to the venue")
    venue_id = models.CharField(max_length=6, unique=True, blank=True, help_text="6-digit unique venue identifier")
    
    # Currency
    currency = models.CharField(max_length=3, default='AUD')
    
    # Status and verification
    status = models.CharField(max_length=20, choices=VENUE_STATUS_CHOICES, default='pending')
    is_verified = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    verification_documents = models.JSONField(default=list, blank=True)
    
    # Images
    cover_image = models.ImageField(upload_to='venues/covers/', blank=True, null=True)
    gallery_images = models.JSONField(default=list, blank=True)  # List of image URLs
    
    # Rating and reviews
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_reviews = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'venues'
        verbose_name = 'Venue'
        verbose_name_plural = 'Venues'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.city}, {self.state}"
    
    @property
    def full_address(self):
        return f"{self.address}, {self.city}, {self.state} {self.postcode}, {self.country}"
    
    def generate_venue_id(self):
        """Generate a unique 6-digit venue ID."""
        while True:
            venue_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not Venue.objects.filter(venue_id=venue_id).exists():
                return venue_id
    
    def update_rating_stats(self):
        """Update average rating and total reviews count from reviews."""
        from apps.reviews.models import Review
        
        reviews = Review.objects.filter(venue=self, is_approved=True)
        total_reviews = reviews.count()
        
        if total_reviews > 0:
            avg_rating = reviews.aggregate(
                avg_rating=models.Avg('overall_rating')
            )['avg_rating']
            self.average_rating = round(avg_rating, 2)
        else:
            self.average_rating = 0.00
            
        self.total_reviews = total_reviews
        self.save(update_fields=['average_rating', 'total_reviews'])
    
    def save(self, *args, **kwargs):
        if not self.venue_id:
            self.venue_id = self.generate_venue_id()
        super().save(*args, **kwargs)


class VenueAvailability(models.Model):
    """Venue availability schedule."""
    
    DAY_CHOICES = [
        ('monday', 'Monday'),
        ('tuesday', 'Tuesday'),
        ('wednesday', 'Wednesday'),
        ('thursday', 'Thursday'),
        ('friday', 'Friday'),
        ('saturday', 'Saturday'),
        ('sunday', 'Sunday'),
    ]
    
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='availability')
    court = models.ForeignKey('Court', on_delete=models.CASCADE, related_name='availability', null=True, blank=True)
    day_of_week = models.CharField(max_length=10, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    price_override = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'venue_availability'
        verbose_name = 'Venue Availability'
        verbose_name_plural = 'Venue Availabilities'
        unique_together = ['venue', 'day_of_week', 'start_time', 'court']
    
    def __str__(self):
        prefix = f"{self.venue.name}"
        if self.court:
            prefix += f" / {self.court.name}"
        return f"{prefix} - {self.day_of_week} {self.start_time}-{self.end_time}"


class VenueImage(models.Model):
    """Venue images."""
    
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='venues/gallery/')
    caption = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'venue_images'
        verbose_name = 'Venue Image'
        verbose_name_plural = 'Venue Images'
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return f"{self.venue.name} - {self.caption or 'Image'}"


class VenuePricing(models.Model):
    """Dynamic pricing for venues."""
    
    PRICING_TYPE_CHOICES = [
        ('peak', 'Peak Hours'),
        ('off_peak', 'Off-Peak Hours'),
        ('weekend', 'Weekend'),
        ('holiday', 'Holiday'),
        ('special', 'Special Event'),
    ]
    
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='pricing')
    pricing_type = models.CharField(max_length=20, choices=PRICING_TYPE_CHOICES)
    day_of_week = models.CharField(max_length=10, choices=VenueAvailability.DAY_CHOICES, blank=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    price_multiplier = models.DecimalField(max_digits=3, decimal_places=2, default=1.00)
    fixed_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    valid_from = models.DateField(null=True, blank=True)
    valid_until = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'venue_pricing'
        verbose_name = 'Venue Pricing'
        verbose_name_plural = 'Venue Pricing'
    
    def __str__(self):
        return f"{self.venue.name} - {self.pricing_type} Pricing"


class Court(models.Model):
    """Individual courts within a venue."""
    
    COURT_STATUS_CHOICES = [
        ('active', 'Active'),
        ('maintenance', 'Under Maintenance'),
        ('inactive', 'Inactive'),
    ]
    
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='courts')
    name = models.CharField(max_length=100)  # e.g., "Court 1", "Field A"
    sport = models.CharField(max_length=50)  # Sport category
    court_type = models.CharField(max_length=100, blank=True)  # e.g., "Indoor", "Outdoor"
    description = models.TextField(blank=True)
    
    # Physical specifications
    length = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    width = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    surface_type = models.CharField(max_length=50, blank=True)  # e.g., "Hard Court", "Grass"
    is_indoor = models.BooleanField(default=False)
    
    # Capacity and pricing
    max_players = models.PositiveIntegerField(default=2)
    booking_duration_minutes = models.PositiveIntegerField(default=60, help_text="Duration of each court booking in minutes")
    price_per_duration = models.DecimalField(max_digits=10, decimal_places=2, default=50.00, help_text="Price per booking duration")
    
    # Status and availability
    status = models.CharField(max_length=20, choices=COURT_STATUS_CHOICES, default='active')
    is_available = models.BooleanField(default=True)
    
    # Images
    image = models.ImageField(upload_to='courts/', blank=True, null=True)
    gallery_images = models.JSONField(default=list, blank=True, help_text="List of additional court images")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'courts'
        verbose_name = 'Court'
        verbose_name_plural = 'Courts'
        ordering = ['venue', 'name']
        unique_together = ['venue', 'name']
    
    def __str__(self):
        return f"{self.venue.name} - {self.name} ({self.sport})"