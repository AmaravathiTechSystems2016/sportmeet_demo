from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator


class User(AbstractUser):
    """Custom User model for SportMeet platform."""
    
    USER_TYPE_CHOICES = [
        ('player', 'Player'),
        ('venue_owner', 'Venue Owner'),
        ('trainer', 'Trainer'),
        ('admin', 'Admin'),
    ]
    
    email = models.EmailField(unique=True)
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone_number = models.CharField(validators=[phone_regex], max_length=17, blank=True)
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='player')
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postcode = models.CharField(max_length=10, blank=True)
    country = models.CharField(max_length=100, default='Australia')
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class UserProfile(models.Model):
    """Extended user profile information."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)
    favorite_sports = models.JSONField(default=list, blank=True)
    skill_level = models.CharField(
        max_length=20,
        choices=[
            ('beginner', 'Beginner'),
            ('intermediate', 'Intermediate'),
            ('advanced', 'Advanced'),
            ('professional', 'Professional'),
        ],
        default='beginner'
    )
    availability = models.JSONField(default=dict, blank=True)  # Store availability schedule
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=17, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profiles'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
    
    def __str__(self):
        return f"{self.user.full_name} Profile"


class VenueOwnerProfile(models.Model):
    """Profile for venue owners."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='venue_owner_profile')
    business_name = models.CharField(max_length=200)
    abn = models.CharField(max_length=11, blank=True)  # Australian Business Number
    business_address = models.TextField()
    business_phone = models.CharField(max_length=17, blank=True)
    business_email = models.EmailField(blank=True)
    business_description = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    verification_documents = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'venue_owner_profiles'
        verbose_name = 'Venue Owner Profile'
        verbose_name_plural = 'Venue Owner Profiles'
    
    def __str__(self):
        return f"{self.business_name} - {self.user.full_name}"


class TrainerProfile(models.Model):
    """Profile for trainers/coaches."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='trainer_profile')
    specializations = models.JSONField(default=list, blank=True)
    certifications = models.JSONField(default=list, blank=True)
    experience_years = models.PositiveIntegerField(default=0)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    bio = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_reviews = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'trainer_profiles'
        verbose_name = 'Trainer Profile'
        verbose_name_plural = 'Trainer Profiles'
    
    def __str__(self):
        return f"{self.user.full_name} - Trainer"