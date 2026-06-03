#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sportmeet.settings')
django.setup()

from apps.events.models import Event

def add_host_names():
    events = Event.objects.all()
    host_names = ['Vishnu', 'Phillip', 'Sam', 'Alex', 'Maria', 'John', 'Sarah', 'Mike']
    
    for i, event in enumerate(events):
        event.host_name = host_names[i % len(host_names)]
        event.save()
        print(f'Updated {event.title} with host: {event.host_name}')

if __name__ == '__main__':
    add_host_names()
