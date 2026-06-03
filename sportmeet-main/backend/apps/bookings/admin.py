from django.contrib import admin
from .models import Booking, BookingTimeSlot, BookingCancellation, BookingReview


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    """Admin configuration for Booking model."""
    
    list_display = (
        'id', 'venue', 'user', 'booking_date', 'start_time', 'end_time',
        'status', 'payment_status', 'final_amount', 'created_at'
    )
    list_filter = ('status', 'payment_status', 'booking_date', 'created_at')
    search_fields = ('venue__name', 'user__first_name', 'user__last_name', 'user__email')
    raw_id_fields = ('venue', 'user')
    readonly_fields = ('created_at', 'updated_at', 'confirmed_at', 'cancelled_at')
    
    fieldsets = (
        ('Booking Details', {
            'fields': ('venue', 'user', 'booking_date', 'start_time', 'end_time', 'duration_hours')
        }),
        ('Pricing', {
            'fields': ('base_price', 'price_per_hour', 'total_amount', 'discount_amount', 'final_amount', 'currency')
        }),
        ('Status', {
            'fields': ('status', 'payment_status')
        }),
        ('Additional Information', {
            'fields': ('special_requests', 'number_of_players', 'contact_phone', 'contact_email')
        }),
        ('Cancellation', {
            'fields': ('cancellation_reason', 'cancellation_fee'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'confirmed_at', 'cancelled_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('venue', 'user')


@admin.register(BookingTimeSlot)
class BookingTimeSlotAdmin(admin.ModelAdmin):
    """Admin configuration for BookingTimeSlot model."""
    
    list_display = ('venue', 'date', 'start_time', 'end_time', 'is_available', 'price_override')
    list_filter = ('is_available', 'date', 'created_at')
    search_fields = ('venue__name',)
    raw_id_fields = ('venue',)
    ordering = ('venue', 'date', 'start_time')


@admin.register(BookingCancellation)
class BookingCancellationAdmin(admin.ModelAdmin):
    """Admin configuration for BookingCancellation model."""
    
    list_display = ('booking', 'reason', 'cancelled_by', 'cancellation_fee', 'refund_amount', 'created_at')
    list_filter = ('reason', 'created_at')
    search_fields = ('booking__venue__name', 'cancelled_by__first_name', 'cancelled_by__last_name')
    raw_id_fields = ('booking', 'cancelled_by')
    readonly_fields = ('created_at',)


@admin.register(BookingReview)
class BookingReviewAdmin(admin.ModelAdmin):
    """Admin configuration for BookingReview model."""
    
    list_display = (
        'id', 'venue', 'user', 'overall_rating', 'title', 'created_at'
    )
    list_filter = ('overall_rating', 'created_at')
    search_fields = ('venue__name', 'user__first_name', 'user__last_name', 'title')
    raw_id_fields = ('booking', 'user', 'venue')
    readonly_fields = ('created_at', 'updated_at', 'owner_response_date')
    
    fieldsets = (
        ('Review Details', {
            'fields': ('booking', 'user', 'venue', 'overall_rating', 'cleanliness_rating', 'facility_rating', 'value_rating')
        }),
        ('Review Content', {
            'fields': ('title', 'comment')
        }),
        ('Owner Response', {
            'fields': ('owner_response', 'owner_response_date'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('venue', 'user', 'booking')
