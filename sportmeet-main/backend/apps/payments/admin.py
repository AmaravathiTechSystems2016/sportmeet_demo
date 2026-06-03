from django.contrib import admin
from .models import Payment, Refund


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin configuration for Payment model."""
    
    list_display = ('transaction_id', 'user', 'amount', 'currency', 'status', 'created_at')
    list_filter = ('status', 'payment_method', 'currency', 'created_at')
    search_fields = ('transaction_id', 'user__email', 'gateway_transaction_id')
    raw_id_fields = ('user', 'booking', 'event')
    readonly_fields = ('created_at', 'updated_at', 'completed_at')


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    """Admin configuration for Refund model."""
    
    list_display = ('payment', 'amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('payment__transaction_id', 'gateway_refund_id')
    raw_id_fields = ('payment',)
    readonly_fields = ('created_at', 'updated_at', 'completed_at')
