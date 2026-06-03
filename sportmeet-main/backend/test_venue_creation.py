#!/usr/bin/env python
"""
Test script to verify venue creation with new fields
"""
import os
import sys
import django
import requests

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sportmeet.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from apps.venues.models import Venue

User = get_user_model()

def test_venue_creation():
    """Test venue creation with new fields"""
    client = Client()
    
    print("Testing Venue Creation with New Fields...")
    print("=" * 50)
    
    # Create a test user
    user, created = User.objects.get_or_create(
        email='test@example.com',
        defaults={
            'first_name': 'Test',
            'last_name': 'User',
            'is_staff': True
        }
    )
    
    if created:
        user.set_password('testpass123')
        user.save()
        print(f"Created test user: {user.email}")
    else:
        print(f"Using existing test user: {user.email}")
    
    # Login
    login_response = client.post('/api/auth/login/', {
        'email': 'test@example.com',
        'password': 'testpass123'
    }, HTTP_HOST='localhost')
    
    if login_response.status_code == 200:
        token = login_response.json()['token']
        print("✓ Login successful")
    else:
        print(f"✗ Login failed: {login_response.status_code}")
        return
    
    # Test venue creation with new fields
    venue_data = {
        'name': 'Test Sports Complex',
        'description': 'A modern sports facility with multiple courts',
        'address': '123 Sports Street',
        'city': 'Melbourne',
        'state': 'VIC',
        'postcode': '3000',
        'country': 'Australia',
        'latitude': -37.8136,
        'longitude': 144.9631,
        'phone_number': '+61 123 456 789',
        'email': 'info@testsports.com',
        'google_map_link': 'https://maps.google.com/?q=-37.8136,144.9631',
        'booking_duration_minutes': 60,
        'price_per_duration': 50.00,
        'currency': 'AUD',
        'sport_categories': '["tennis", "basketball"]',
        'amenities': '["parking", "changing_rooms"]',
        'rules': 'No smoking, proper sports attire required',
        'cancellation_policy': '24 hours notice required',
        'courts': [
            {
                'name': 'Court 1',
                'sport': 'tennis',
                'court_type': 'Standard',
                'surface_type': 'Hard Court',
                'is_indoor': False,
                'max_players': 4
            },
            {
                'name': 'Court 2',
                'sport': 'basketball',
                'court_type': 'Standard',
                'surface_type': 'Wooden Floor',
                'is_indoor': True,
                'max_players': 10
            }
        ]
    }
    
    # Create venue
    headers = {'Authorization': f'Token {token}'}
    response = client.post('/api/venues/create/', venue_data, HTTP_AUTHORIZATION=f'Token {token}', HTTP_HOST='localhost')
    
    print(f"\nVenue Creation Response:")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 201:
        data = response.json()
        print("✓ Venue created successfully!")
        print(f"Venue ID: {data['venue']['venue_id']}")
        print(f"Name: {data['venue']['name']}")
        print(f"Booking Duration: {data['venue']['booking_duration_minutes']} minutes")
        print(f"Price per Duration: ${data['venue']['price_per_duration']}")
        print(f"Google Map Link: {data['venue']['google_map_link']}")
        
        # Verify venue was saved with correct fields
        venue = Venue.objects.get(name='Test Sports Complex')
        print(f"\n✓ Venue saved to database:")
        print(f"  - Venue ID: {venue.venue_id}")
        print(f"  - Booking Duration: {venue.booking_duration_minutes}")
        print(f"  - Price per Duration: {venue.price_per_duration}")
        print(f"  - Google Map Link: {venue.google_map_link}")
        print(f"  - Latitude: {venue.latitude}")
        print(f"  - Longitude: {venue.longitude}")
        print(f"  - Courts created: {venue.courts.count()}")
        
    else:
        print(f"✗ Venue creation failed:")
        print(f"Response: {response.content}")
    
    print("\n" + "=" * 50)
    print("Venue creation test completed!")

if __name__ == '__main__':
    test_venue_creation()
