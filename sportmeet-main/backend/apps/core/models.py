from django.db import models
from django.conf import settings


class SocialMediaKeys(models.Model):
    """Model to store social media API keys for OAuth authentication."""
    
    PROVIDER_CHOICES = [
        ('facebook', 'Facebook'),
        ('google', 'Google'),
    ]
    
    provider = models.CharField(
        max_length=20,
        choices=PROVIDER_CHOICES,
        unique=True,
        help_text="Social media provider"
    )
    
    client_id = models.CharField(
        max_length=500,
        help_text="Client ID or App ID from the social media provider"
    )
    
    client_secret = models.CharField(
        max_length=500,
        help_text="Client Secret or App Secret from the social media provider"
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this provider is enabled for login"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_social_keys'
    )
    
    class Meta:
        verbose_name = "Social Media Keys"
        verbose_name_plural = "Social Media Keys"
        ordering = ['provider']
    
    def __str__(self):
        return f"{self.get_provider_display()} Keys"
    
    @property
    def is_configured(self):
        """Check if both client_id and client_secret are set."""
        return bool(self.client_id and self.client_secret)


class SiteSettings(models.Model):
    """Model to store general site settings."""
    
    site_name = models.CharField(
        max_length=100,
        default="SportMeet",
        help_text="Name of the website"
    )
    
    site_description = models.TextField(
        blank=True,
        help_text="Brief description of the website"
    )
    
    contact_email = models.EmailField(
        blank=True,
        help_text="Contact email for the website"
    )
    
    contact_phone = models.CharField(
        max_length=20,
        blank=True,
        help_text="Contact phone number"
    )
    
    address = models.TextField(
        blank=True,
        help_text="Physical address"
    )
    
    currency = models.CharField(
        max_length=3,
        default="AUD",
        help_text="Default currency code"
    )
    
    timezone = models.CharField(
        max_length=50,
        default="Australia/Sydney",
        help_text="Default timezone"
    )

    # Branding assets
    logo_main = models.ImageField(upload_to='branding/', null=True, blank=True, help_text='Landing page main logo')
    logo_admin = models.ImageField(upload_to='branding/', null=True, blank=True, help_text='Admin dashboard logo')
    logo_auth = models.ImageField(upload_to='branding/', null=True, blank=True, help_text='Login/Register form logo')
    who_we_are_image = models.ImageField(upload_to='branding/', null=True, blank=True, help_text='Who We Are section image')
    # Dynamic pages content
    faqs = models.TextField(blank=True, help_text='Markdown/HTML content for FAQs page')
    terms = models.TextField(blank=True, help_text='Markdown/HTML content for Terms & Conditions')
    privacy = models.TextField(blank=True, help_text='Markdown/HTML content for Privacy Policy')
    cookies = models.TextField(blank=True, help_text='Markdown/HTML content for Cookies Policy')
    support = models.TextField(blank=True, help_text='Markdown/HTML content for Support page')
    
    # Social Media Links
    facebook_url = models.URLField(blank=True, help_text='Facebook page URL')
    twitter_url = models.URLField(blank=True, help_text='Twitter profile URL')
    instagram_url = models.URLField(blank=True, help_text='Instagram profile URL')
    linkedin_url = models.URLField(blank=True, help_text='LinkedIn profile URL')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Site Settings"
        verbose_name_plural = "Site Settings"
    
    def __str__(self):
        return f"Settings for {self.site_name}"
    
    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        if not self.pk and SiteSettings.objects.exists():
            raise ValueError("Only one SiteSettings instance is allowed")
        super().save(*args, **kwargs)


class HomeSliderImage(models.Model):
    """Images shown on the homepage hero/slider."""
    title = models.CharField(max_length=200, blank=True)
    subtitle = models.CharField(max_length=255, blank=True)
    image = models.ImageField(upload_to='homepage/slider/')
    cta_text = models.CharField(max_length=100, blank=True)
    cta_url = models.URLField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.title or f"Slide #{self.pk}"