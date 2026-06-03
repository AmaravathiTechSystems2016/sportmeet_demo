from datetime import date, time, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.events.models import Event
from apps.venues.models import Venue


class PublicApiSmokeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.User = get_user_model()
        self.owner = self.User.objects.create_user(
            username='owner',
            email='owner@example.com',
            password='owner12345',
            first_name='Owner',
            last_name='User',
            user_type='venue_owner',
        )
        self.player = self.User.objects.create_user(
            username='player',
            email='player@example.com',
            password='player12345',
            first_name='Player',
            last_name='User',
            user_type='player',
        )

    def test_login_and_profile_with_token(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'player@example.com',
            'password': 'player12345',
        }, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertIn('token', response.data)

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {response.data['token']}")
        profile = self.client.get('/api/auth/profile/')

        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.data['user']['email'], 'player@example.com')

    def test_public_venues_only_show_approved(self):
        Venue.objects.create(
            owner=self.owner,
            name='Approved Courts',
            description='Public venue',
            address='1 Test Street',
            city='Melbourne',
            state='VIC',
            postcode='3000',
            sport_categories=['Tennis'],
            status='approved',
        )
        Venue.objects.create(
            owner=self.owner,
            name='Pending Courts',
            description='Hidden venue',
            address='2 Test Street',
            city='Melbourne',
            state='VIC',
            postcode='3000',
            sport_categories=['Tennis'],
            status='pending',
        )

        response = self.client.get('/api/venues/')
        names = [item['name'] for item in response.data['results']]

        self.assertEqual(response.status_code, 200)
        self.assertIn('Approved Courts', names)
        self.assertNotIn('Pending Courts', names)

    def test_public_events_only_show_published_events(self):
        Event.objects.create(
            organizer=self.owner,
            title='Published Tennis Social',
            description='Open event',
            event_type='social',
            sport_category='Tennis',
            venue_name='Approved Courts',
            address='1 Test Street',
            city='Melbourne',
            state='VIC',
            postcode='3000',
            start_date=date.today() + timedelta(days=7),
            start_time=time(18, 0),
            end_time=time(20, 0),
            max_participants=20,
            registration_deadline=timezone.now() + timedelta(days=6),
            status='published',
            is_public=True,
        )
        Event.objects.create(
            organizer=self.owner,
            title='Draft Tennis Social',
            description='Hidden event',
            event_type='social',
            sport_category='Tennis',
            venue_name='Approved Courts',
            address='1 Test Street',
            city='Melbourne',
            state='VIC',
            postcode='3000',
            start_date=date.today() + timedelta(days=7),
            start_time=time(18, 0),
            end_time=time(20, 0),
            max_participants=20,
            registration_deadline=timezone.now() + timedelta(days=6),
            status='draft',
            is_public=True,
        )

        response = self.client.get('/api/events/')
        titles = [item['title'] for item in response.data['results']]

        self.assertEqual(response.status_code, 200)
        self.assertIn('Published Tennis Social', titles)
        self.assertNotIn('Draft Tennis Social', titles)
