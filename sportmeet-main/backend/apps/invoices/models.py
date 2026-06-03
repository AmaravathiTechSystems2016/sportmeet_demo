from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
import uuid

User = get_user_model()


class Invoice(models.Model):
    """Invoice model for billing and payments"""
    
    INVOICE_TYPES = [
        ('booking', 'Venue Booking'),
        ('event', 'Event Registration'),
        ('membership', 'Membership'),
        ('subscription', 'Subscription'),
        ('other', 'Other'),
    ]
    
    INVOICE_STATUS = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=50, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='invoices')
    
    # Invoice details
    invoice_type = models.CharField(max_length=20, choices=INVOICE_TYPES)
    status = models.CharField(max_length=20, choices=INVOICE_STATUS, default='draft')
    
    # Amounts
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=10.0)  # GST for Australia
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default='AUD')
    
    # Dates
    invoice_date = models.DateField()
    due_date = models.DateField()
    paid_date = models.DateField(blank=True, null=True)
    
    # Related objects
    booking = models.ForeignKey('bookings.Booking', on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    event_registration = models.ForeignKey('events.EventRegistration', on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    
    # Billing information
    billing_address = models.JSONField(default=dict, blank=True)
    
    # Additional details
    notes = models.TextField(blank=True, null=True)
    terms_and_conditions = models.TextField(blank=True, null=True)
    
    # Payment information
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    payment_reference = models.CharField(max_length=100, blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    sent_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.user.username}"
    
    @property
    def is_overdue(self):
        from django.utils import timezone
        return self.status == 'sent' and self.due_date < timezone.now().date()
    
    def calculate_tax(self):
        """Calculate GST for Australia"""
        self.tax_amount = (self.subtotal * self.tax_rate) / 100
        self.total_amount = self.subtotal + self.tax_amount
        self.save()


class InvoiceItem(models.Model):
    """Items within an invoice"""
    
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=200)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    total_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    
    # Additional details
    item_type = models.CharField(max_length=50, blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    def __str__(self):
        return f"{self.invoice.invoice_number} - {self.description}"
    
    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)


class InvoiceTemplate(models.Model):
    """Templates for invoice generation"""
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    
    # Template content
    header_html = models.TextField(blank=True, null=True)
    footer_html = models.TextField(blank=True, null=True)
    css_styles = models.TextField(blank=True, null=True)
    
    # Default settings
    default_terms = models.TextField(blank=True, null=True)
    default_notes = models.TextField(blank=True, null=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_invoice_templates')
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class InvoicePayment(models.Model):
    """Payment records for invoices"""
    
    PAYMENT_METHODS = [
        ('card', 'Credit/Debit Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('paypal', 'PayPal'),
        ('stripe', 'Stripe'),
        ('cash', 'Cash'),
        ('other', 'Other'),
    ]
    
    PAYMENT_STATUS = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    
    # Payment details
    payment_reference = models.CharField(max_length=100, blank=True, null=True)
    external_payment_id = models.CharField(max_length=200, blank=True, null=True)
    
    # Additional information
    notes = models.TextField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payment for {self.invoice.invoice_number} - ${self.amount}"


class InvoiceReminder(models.Model):
    """Reminder system for overdue invoices"""
    
    REMINDER_TYPES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('phone', 'Phone Call'),
    ]
    
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='reminders')
    reminder_type = models.CharField(max_length=20, choices=REMINDER_TYPES)
    days_overdue = models.PositiveIntegerField()
    
    # Reminder content
    subject = models.CharField(max_length=200, blank=True, null=True)
    message = models.TextField(blank=True, null=True)
    
    # Status
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    scheduled_for = models.DateTimeField()
    
    class Meta:
        ordering = ['scheduled_for']
    
    def __str__(self):
        return f"Reminder for {self.invoice.invoice_number} - {self.get_reminder_type_display()}"


class TaxRate(models.Model):
    """Tax rates for different regions and types"""
    
    name = models.CharField(max_length=100)
    rate = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0)])
    description = models.TextField(blank=True, null=True)
    
    # Applicability
    state = models.CharField(max_length=50, blank=True, null=True)
    country = models.CharField(max_length=50, default='Australia')
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} - {self.rate}%"
