from rest_framework import serializers
from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    """Serializer for Report model."""
    
    class Meta:
        model = Report
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'generated_at')
