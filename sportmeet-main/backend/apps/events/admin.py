from django.contrib import admin
from .models import Event, EventParticipant, EventComment, EventImage


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """Admin configuration for Event model."""
    
    list_display = (
        'title', 'organizer', 'venue_name', 'city', 'event_type', 'sport_category',
        'start_date', 'start_time', 'status', 'is_public', 'is_featured', 'created_at'
    )
    list_filter = ('status', 'event_type', 'sport_category', 'is_public', 'is_featured', 'city', 'state', 'created_at')
    search_fields = ('title', 'description', 'organizer__first_name', 'organizer__last_name', 'venue_name', 'city', 'address')
    raw_id_fields = ('organizer',)
    readonly_fields = ('created_at', 'updated_at', 'published_at')
    
    fieldsets = (
        ('Event Details', {
            'fields': ('organizer', 'title', 'description', 'event_type', 'sport_category')
        }),
        ('Location', {
            'fields': ('venue_name', 'address', 'city', 'state', 'postcode', 'country', 'latitude', 'longitude')
        }),
        ('Date & Time', {
            'fields': ('start_date', 'end_date', 'start_time', 'end_time')
        }),
        ('Registration', {
            'fields': ('max_participants', 'min_participants', 'registration_deadline', 'is_registration_open')
        }),
        ('Pricing', {
            'fields': ('entry_fee', 'currency')
        }),
        ('Status & Visibility', {
            'fields': ('status', 'is_public', 'is_featured')
        }),
        ('Additional Information', {
            'fields': ('rules', 'requirements', 'prizes', 'contact_info'),
            'classes': ('collapse',)
        }),
        ('Images', {
            'fields': ('cover_image',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'published_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('organizer')


@admin.register(EventParticipant)
class EventParticipantAdmin(admin.ModelAdmin):
    """Admin configuration for EventParticipant model."""
    
    list_display = ('event', 'user', 'status', 'payment_status', 'registration_date')
    list_filter = ('status', 'payment_status', 'registration_date')
    search_fields = ('event__title', 'user__first_name', 'user__last_name', 'user__email')
    raw_id_fields = ('event', 'user')
    readonly_fields = ('registration_date',)


@admin.register(EventComment)
class EventCommentAdmin(admin.ModelAdmin):
    """Admin configuration for EventComment model."""
    
    list_display = ('event', 'user', 'is_approved', 'created_at')
    list_filter = ('is_approved', 'created_at')
    search_fields = ('event__title', 'user__first_name', 'user__last_name', 'comment')
    raw_id_fields = ('event', 'user')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(EventImage)
class EventImageAdmin(admin.ModelAdmin):
    """Admin configuration for EventImage model."""
    
    list_display = ('event', 'caption', 'is_primary', 'order', 'created_at')
    list_filter = ('is_primary', 'created_at')
    search_fields = ('event__title', 'caption')
    raw_id_fields = ('event',)
    ordering = ('event', 'order', 'created_at')
