from django.db import models
from apps.accounts.models import User


class Report(models.Model):
    """Report model for analytics and reporting."""
    
    REPORT_TYPE_CHOICES = [
        ('venue_performance', 'Venue Performance'),
        ('booking_analytics', 'Booking Analytics'),
        ('revenue_report', 'Revenue Report'),
        ('user_activity', 'User Activity'),
        ('event_analytics', 'Event Analytics'),
        ('custom', 'Custom Report'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    report_type = models.CharField(max_length=30, choices=REPORT_TYPE_CHOICES)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports')
    
    # Report configuration
    parameters = models.JSONField(default=dict, blank=True)
    filters = models.JSONField(default=dict, blank=True)
    
    # Report data
    data = models.JSONField(default=dict, blank=True)
    is_generated = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    generated_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'reports'
        verbose_name = 'Report'
        verbose_name_plural = 'Reports'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.report_type}"