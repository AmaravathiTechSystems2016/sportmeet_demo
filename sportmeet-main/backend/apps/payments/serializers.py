from rest_framework import serializers
from .models import Payment, Refund


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model."""
    
    booking_title = serializers.CharField(source='booking.venue.name', read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)
    
    class Meta:
        model = Payment
        fields = (
            'id', 'user', 'booking', 'event', 'amount', 'currency', 'payment_method',
            'status', 'transaction_id', 'gateway_transaction_id', 'booking_title',
            'event_title', 'created_at', 'updated_at', 'completed_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'completed_at')


class PaymentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating payments."""
    
    class Meta:
        model = Payment
        fields = ('booking', 'event', 'amount', 'currency', 'payment_method')
    
    def validate(self, data):
        if not data.get('booking') and not data.get('event'):
            raise serializers.ValidationError("Either booking or event must be provided")
        
        if data.get('booking') and data.get('event'):
            raise serializers.ValidationError("Cannot have both booking and event")
        
        return data


class PaymentIntentSerializer(serializers.Serializer):
    """Serializer for Stripe PaymentIntent creation."""
    
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField(max_length=3, default='AUD')
    booking_id = serializers.IntegerField(required=False, allow_null=True)
    event_id = serializers.IntegerField(required=False, allow_null=True)
    save_payment_method = serializers.BooleanField(default=False)


class RefundSerializer(serializers.ModelSerializer):
    """Serializer for Refund model."""
    
    payment_transaction_id = serializers.CharField(source='payment.transaction_id', read_only=True)
    
    class Meta:
        model = Refund
        fields = (
            'id', 'payment', 'amount', 'reason', 'status', 'gateway_refund_id',
            'payment_transaction_id', 'created_at', 'updated_at', 'completed_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'completed_at')


class RefundCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating refunds."""
    
    class Meta:
        model = Refund
        fields = ('amount', 'reason')
    
    def validate_amount(self, value):
        payment = self.context['payment']
        if value > payment.amount:
            raise serializers.ValidationError("Refund amount cannot exceed payment amount")
        return value
