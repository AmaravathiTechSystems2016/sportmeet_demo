#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sportmeet.settings')
django.setup()

from django.utils.text import slugify
from apps.venues.sports_models import Sport, Amenity

def fix_empty_slugs():
    """Fix empty slugs in Sport and Amenity models."""
    
    # Fix Sport slugs
    sports_with_empty_slugs = Sport.objects.filter(slug='')
    print(f"Found {sports_with_empty_slugs.count()} sports with empty slugs")
    
    for sport in sports_with_empty_slugs:
        original_slug = slugify(sport.name)
        slug = original_slug
        counter = 1
        
        # Ensure slug is unique
        while Sport.objects.filter(slug=slug).exclude(id=sport.id).exists():
            slug = f"{original_slug}-{counter}"
            counter += 1
        
        sport.slug = slug
        sport.save()
        print(f"Fixed sport: {sport.name} -> {sport.slug}")
    
    # Fix Amenity slugs
    amenities_with_empty_slugs = Amenity.objects.filter(slug='')
    print(f"Found {amenities_with_empty_slugs.count()} amenities with empty slugs")
    
    for amenity in amenities_with_empty_slugs:
        original_slug = slugify(amenity.name)
        slug = original_slug
        counter = 1
        
        # Ensure slug is unique
        while Amenity.objects.filter(slug=slug).exclude(id=amenity.id).exists():
            slug = f"{original_slug}-{counter}"
            counter += 1
        
        amenity.slug = slug
        amenity.save()
        print(f"Fixed amenity: {amenity.name} -> {amenity.slug}")
    
    print("All empty slugs have been fixed!")

if __name__ == '__main__':
    fix_empty_slugs()
