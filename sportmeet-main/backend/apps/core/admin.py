from django.contrib import admin
from django.utils.html import format_html
from .models import SocialMediaKeys, SiteSettings, HomeSliderImage


@admin.register(SocialMediaKeys)
class SocialMediaKeysAdmin(admin.ModelAdmin):
    list_display = [
        'provider',
        'is_configured_display',
        'is_active',
        'created_at',
        'updated_at'
    ]
    
    list_filter = ['provider', 'is_active', 'created_at']
    
    search_fields = ['provider']
    
    fieldsets = (
        ('Provider Information', {
            'fields': ('provider', 'is_active')
        }),
        ('API Credentials', {
            'fields': ('client_id', 'client_secret'),
            'description': 'Enter the API credentials from your social media provider dashboard.'
        }),
        ('Metadata', {
            'fields': ('created_by',),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def is_configured_display(self, obj):
        if obj.is_configured:
            return format_html(
                '<span style="color: green;">✓ Configured</span>'
            )
        else:
            return format_html(
                '<span style="color: red;">✗ Not Configured</span>'
            )
    is_configured_display.short_description = 'Status'
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    def has_add_permission(self, request):
        # Only allow adding if there are less than 2 providers (Facebook and Google)
        return SocialMediaKeys.objects.count() < 2
    
    def has_delete_permission(self, request, obj=None):
        return True


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = [
        'site_name',
        'contact_email',
        'currency',
        'timezone',
        'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('site_name', 'site_description')
        }),
        ('Contact Information', {
            'fields': ('contact_email', 'contact_phone', 'address')
        }),
        ('Regional Settings', {
            'fields': ('currency', 'timezone')
        }),
        ('Branding', {
            'fields': ('logo_main', 'logo_admin', 'logo_auth', 'who_we_are_image'),
            'description': 'Upload PNG/SVG logos and images used across the platform.'
        }),
        ('Legal Pages', {
            'fields': ('faqs', 'terms', 'privacy', 'cookies', 'support'),
            'description': 'Dynamic content for public pages (supports HTML/Markdown).'
        }),
        ('Social Media Links', {
            'fields': ('facebook_url', 'twitter_url', 'instagram_url', 'linkedin_url'),
            'description': 'Social media profile URLs for footer links.'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def has_add_permission(self, request):
        # Only allow one instance
        return not SiteSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        return False  # Prevent deletion of site settings


@admin.register(HomeSliderImage)
class HomeSliderImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'order', 'is_active', 'created_at')
    list_editable = ('order', 'is_active')
    search_fields = ('title', 'subtitle', 'cta_text')
