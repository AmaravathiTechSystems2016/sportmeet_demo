from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Discount, DiscountUsage


@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):
    """Admin configuration for Discount model."""
    
    list_display = (
        'code', 'name', 'discount_type', 'value', 'status', 
        'usage_count', 'usage_limit', 'is_valid_display', 'created_at'
    )
    list_filter = (
        'status', 'discount_type', 'applicable_to_venues', 
        'applicable_to_events', 'first_time_only', 'created_at'
    )
    search_fields = ('code', 'name', 'description', 'created_by__email')
    readonly_fields = ('usage_count', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'name', 'description', 'created_by')
        }),
        ('Discount Details', {
            'fields': (
                'discount_type', 'value', 'max_discount_amount', 
                'min_order_amount'
            )
        }),
        ('Validity', {
            'fields': ('valid_from', 'valid_until', 'status')
        }),
        ('Usage Limits', {
            'fields': ('usage_limit', 'usage_count', 'user_limit')
        }),
        ('Restrictions', {
            'fields': (
                'first_time_only', 'applicable_to_venues', 
                'applicable_to_events'
            )
        }),
        ('Specific Items', {
            'fields': ('specific_venues', 'specific_events'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def is_valid_display(self, obj):
        """Display if the discount is currently valid."""
        is_valid = obj.is_valid()
        if is_valid:
            return format_html('<span style="color: green;">✓ Valid</span>')
        else:
            return format_html('<span style="color: red;">✗ Invalid</span>')
    is_valid_display.short_description = 'Valid'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('created_by')
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new discount
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(DiscountUsage)
class DiscountUsageAdmin(admin.ModelAdmin):
    """Admin configuration for DiscountUsage model."""
    
    list_display = (
        'discount_code', 'user_name', 'booking_type', 'booking_id',
        'original_amount', 'discount_amount', 'final_amount', 'used_at'
    )
    list_filter = ('booking_type', 'used_at', 'discount')
    search_fields = (
        'discount__code', 'user__first_name', 'user__last_name', 
        'user__email', 'booking_id'
    )
    readonly_fields = ('used_at',)
    ordering = ['-used_at']
    
    fieldsets = (
        ('Usage Details', {
            'fields': ('discount', 'user', 'booking_type', 'booking_id')
        }),
        ('Amount Details', {
            'fields': ('original_amount', 'discount_amount', 'final_amount')
        }),
        ('Metadata', {
            'fields': ('used_at', 'ip_address'),
            'classes': ('collapse',)
        }),
    )
    
    def discount_code(self, obj):
        """Display discount code with link to discount detail."""
        url = reverse('admin:discounts_discount_change', args=[obj.discount.id])
        return format_html('<a href="{}">{}</a>', url, obj.discount.code)
    discount_code.short_description = 'Discount Code'
    
    def user_name(self, obj):
        """Display user name with link to user detail."""
        url = reverse('admin:accounts_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.full_name)
    user_name.short_description = 'User'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('discount', 'user')