from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    """Admin configuration for Review model."""
    
    list_display = ('venue', 'user', 'overall_rating', 'is_approved', 'created_at')
    list_filter = ('overall_rating', 'is_approved', 'is_verified', 'created_at')
    search_fields = ('venue__name', 'user__first_name', 'user__last_name', 'title')
    raw_id_fields = ('venue', 'user')
    readonly_fields = ('created_at', 'updated_at', 'owner_response_date')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('venue', 'user')
