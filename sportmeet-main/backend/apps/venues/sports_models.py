from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.text import slugify


class Sport(models.Model):
    """Master data for sports categories."""
    
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True)  # Icon class or name
    image = models.ImageField(upload_to='sports/', blank=True, null=True)
    color = models.CharField(max_length=7, default='#3B82F6')  # Hex color code
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    
    # Court requirements
    min_court_length = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    max_court_length = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    min_court_width = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    max_court_width = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['sort_order', 'name']
        verbose_name = 'Sport'
        verbose_name_plural = 'Sports'
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name


class CourtType(models.Model):
    """Different types of courts for each sport."""
    
    sport = models.ForeignKey(Sport, on_delete=models.CASCADE, related_name='court_types')
    name = models.CharField(max_length=100)  # e.g., "Indoor Court", "Outdoor Court", "Grass Field"
    description = models.TextField(blank=True)
    length = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    width = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    surface_type = models.CharField(max_length=50, blank=True)  # e.g., "Hard Court", "Grass", "Clay"
    is_indoor = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['sport', 'sort_order', 'name']
        unique_together = ['sport', 'name']
        verbose_name = 'Court Type'
        verbose_name_plural = 'Court Types'
    
    def __str__(self):
        return f"{self.sport.name} - {self.name}"


class Amenity(models.Model):
    """Master data for venue amenities."""
    
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True)  # Icon class or name
    category = models.CharField(max_length=50, default='general')  # e.g., 'parking', 'food', 'equipment'
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['category', 'sort_order', 'name']
        verbose_name = 'Amenity'
        verbose_name_plural = 'Amenities'
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name
