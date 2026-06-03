from django.contrib import admin
from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    """Admin configuration for Report model."""
    
    list_display = ('name', 'report_type', 'created_by', 'is_generated', 'created_at')
    list_filter = ('report_type', 'is_generated', 'created_at')
    search_fields = ('name', 'description', 'created_by__email')
    raw_id_fields = ('created_by',)
    readonly_fields = ('created_at', 'updated_at', 'generated_at')
