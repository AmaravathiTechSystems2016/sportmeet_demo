#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sportmeet.settings')
django.setup()

from apps.events.models import EventParticipant
from apps.accounts.models import User

def test_bookings():
    print("Testing Event Bookings API...")
    
    # Check if we have participants
    participants = EventParticipant.objects.select_related(
        'user', 'event', 'event__venue', 'event__organizer'
    ).all()
    
    print(f"Total participants: {participants.count()}")
    
    for participant in participants[:3]:
        print(f"Participant: {participant.user.full_name} - Event: {participant.event.title} - Status: {participant.status}")
    
    # Check if we have admin users
    admin_users = User.objects.filter(user_type='admin')
    print(f"Admin users: {admin_users.count()}")
    
    # Check if we have regular users
    regular_users = User.objects.filter(user_type='player')
    print(f"Regular users: {regular_users.count()}")

if __name__ == "__main__":
    test_bookings()
