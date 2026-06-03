from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.accounts.models import User


class Event(models.Model):
    """Event model for sports events."""
    
    EVENT_STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]
    
    EVENT_TYPE_CHOICES = [
        ('tournament', 'Tournament'),
        ('league', 'League'),
        ('friendly', 'Friendly Match'),
        ('training', 'Training Session'),
        ('social', 'Social Event'),
        ('other', 'Other'),
    ]
    
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='organized_events')
    
    # Location details (replacing venue foreign key)
    venue_name = models.CharField(max_length=200, default='', help_text="Name of the venue or location")
    address = models.CharField(max_length=500, default='')
    city = models.CharField(max_length=100, default='')
    state = models.CharField(max_length=100, default='')
    postcode = models.CharField(max_length=20, default='')
    country = models.CharField(max_length=100, default='Australia')
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    
    # Event details
    title = models.CharField(max_length=200)
    description = models.TextField()
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES)
    sport_category = models.CharField(max_length=50)
    host_name = models.CharField(max_length=100, blank=True, help_text="Name of the event host/organizer")
    
    # Date and time
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    # Registration
    max_participants = models.PositiveIntegerField()
    min_participants = models.PositiveIntegerField(default=1)
    registration_deadline = models.DateTimeField(null=True, blank=True)
    is_registration_open = models.BooleanField(default=True)
    
    # Pricing
    entry_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=3, default='AUD')
    
    # Status and visibility
    status = models.CharField(max_length=20, choices=EVENT_STATUS_CHOICES, default='draft')
    is_public = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    # Additional information
    rules = models.TextField(blank=True)
    requirements = models.TextField(blank=True)
    prizes = models.TextField(blank=True)
    contact_info = models.TextField(blank=True)
    
    # Images
    cover_image = models.ImageField(upload_to='events/covers/', blank=True, null=True)
    gallery_images = models.JSONField(default=list, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'events'
        verbose_name = 'Event'
        verbose_name_plural = 'Events'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.start_date}"


class EventParticipant(models.Model):
    """Event participants."""
    
    PARTICIPANT_STATUS_CHOICES = [
        ('registered', 'Registered'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    ]
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_participations')
    status = models.CharField(max_length=20, choices=PARTICIPANT_STATUS_CHOICES, default='registered')
    registration_date = models.DateTimeField(auto_now_add=True)
    payment_status = models.CharField(max_length=20, default='pending')
    payment_intent_id = models.CharField(max_length=255, blank=True, null=True)
    special_requests = models.TextField(blank=True)
    
    class Meta:
        db_table = 'event_participants'
        verbose_name = 'Event Participant'
        verbose_name_plural = 'Event Participants'
        ordering = ['registration_date']
    
    def __str__(self):
        return f"{self.user.full_name} - {self.event.title}"


class EventComment(models.Model):
    """Event comments and discussions."""
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_comments')
    comment = models.TextField()
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'event_comments'
        verbose_name = 'Event Comment'
        verbose_name_plural = 'Event Comments'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.full_name} - {self.event.title}"


class EventImage(models.Model):
    """Event images."""
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='events/gallery/')
    caption = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'event_images'
        verbose_name = 'Event Image'
        verbose_name_plural = 'Event Images'
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return f"{self.event.title} - {self.caption or 'Image'}"