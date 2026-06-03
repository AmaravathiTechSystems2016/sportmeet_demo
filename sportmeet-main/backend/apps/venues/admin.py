from django.contrib import admin
from .models import Venue, VenueAvailability, VenueImage, VenuePricing, Court
from .sports_models import Sport, CourtType, Amenity


@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    """Admin configuration for Venue model."""
    
    list_display = ('name', 'venue_id', 'owner', 'city', 'state', 'status', 'is_verified', 'average_rating', 'created_at')
    list_filter = ('status', 'is_verified', 'city', 'state', 'sport_categories', 'created_at')
    search_fields = ('name', 'venue_id', 'description', 'address', 'city', 'state', 'owner__first_name', 'owner__last_name')
    raw_id_fields = ('owner',)
    readonly_fields = ('venue_id', 'created_at', 'updated_at', 'average_rating', 'total_reviews')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('owner', 'name', 'description', 'status', 'is_verified')
        }),
        ('Location', {
            'fields': ('address', 'city', 'state', 'postcode', 'country', 'latitude', 'longitude', 'google_map_link')
        }),
        ('Contact', {
            'fields': ('phone_number', 'email', 'website')
        }),
        ('Venue Details', {
            'fields': ('venue_id', 'sport_categories', 'amenities', 'rules', 'cancellation_policy')
        }),
        ('Pricing', {
            'fields': ('currency',)
        }),
        ('Images', {
            'fields': ('cover_image',)
        }),
        ('Statistics', {
            'fields': ('average_rating', 'total_reviews'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('owner')


@admin.register(VenueAvailability)
class VenueAvailabilityAdmin(admin.ModelAdmin):
    """Admin configuration for VenueAvailability model."""
    
    list_display = ('venue', 'day_of_week', 'start_time', 'end_time', 'is_available', 'price_override')
    list_filter = ('day_of_week', 'is_available', 'created_at')
    search_fields = ('venue__name',)
    raw_id_fields = ('venue',)
    ordering = ('venue', 'day_of_week', 'start_time')


@admin.register(VenueImage)
class VenueImageAdmin(admin.ModelAdmin):
    """Admin configuration for VenueImage model."""
    
    list_display = ('venue', 'caption', 'is_primary', 'order', 'created_at')
    list_filter = ('is_primary', 'created_at')
    search_fields = ('venue__name', 'caption')
    raw_id_fields = ('venue',)
    ordering = ('venue', 'order', 'created_at')


@admin.register(VenuePricing)
class VenuePricingAdmin(admin.ModelAdmin):
    """Admin configuration for VenuePricing model."""
    
    list_display = ('venue', 'pricing_type', 'day_of_week', 'start_time', 'end_time', 'price_multiplier', 'is_active')
    list_filter = ('pricing_type', 'day_of_week', 'is_active', 'created_at')
    search_fields = ('venue__name',)
    raw_id_fields = ('venue',)
    ordering = ('venue', 'pricing_type', 'day_of_week')


class CourtInline(admin.TabularInline):
    """Inline admin for Court model."""
    model = Court
    extra = 1
    fields = ('name', 'sport', 'court_type', 'surface_type', 'is_indoor', 'max_players', 'booking_duration_minutes', 'price_per_duration', 'status', 'is_available')


@admin.register(Court)
class CourtAdmin(admin.ModelAdmin):
    """Admin configuration for Court model."""
    
    list_display = ('name', 'venue', 'sport', 'court_type', 'surface_type', 'is_indoor', 'booking_duration_minutes', 'price_per_duration', 'status', 'is_available')
    list_filter = ('sport', 'court_type', 'surface_type', 'is_indoor', 'status', 'is_available')
    search_fields = ('name', 'venue__name', 'description')
    raw_id_fields = ('venue',)
    ordering = ('venue', 'name')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('venue', 'name', 'sport', 'court_type', 'description')
        }),
        ('Physical Specifications', {
            'fields': ('length', 'width', 'surface_type', 'is_indoor')
        }),
        ('Capacity & Pricing', {
            'fields': ('max_players', 'booking_duration_minutes', 'price_per_duration')
        }),
        ('Status', {
            'fields': ('status', 'is_available')
        }),
        ('Images', {
            'fields': ('image', 'gallery_images')
        }),
    )


# Update VenueAdmin to include courts inline
VenueAdmin.inlines = [CourtInline]
