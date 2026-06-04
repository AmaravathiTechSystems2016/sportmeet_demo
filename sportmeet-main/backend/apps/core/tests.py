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


class AdminApiSmokeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.User = get_user_model()
        self.admin = self.User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='admin12345',
            first_name='Admin',
            last_name='User',
            user_type='admin',
            is_staff=True,
            is_superuser=True,
        )
        self.owner = self.User.objects.create_user(
            username='owner-admin-smoke',
            email='owner-admin-smoke@example.com',
            password='owner12345',
            first_name='Owner',
            last_name='User',
            user_type='venue_owner',
        )
        self.client.force_authenticate(user=self.admin)

    def test_admin_dashboard_counts_approved_venues_as_active(self):
        Venue.objects.create(
            owner=self.owner,
            name='Approved Admin Venue',
            description='Approved venue',
            address='1 Test Street',
            city='Sydney',
            state='NSW',
            postcode='2000',
            sport_categories=['Tennis'],
            status='approved',
        )
        Venue.objects.create(
            owner=self.owner,
            name='Pending Admin Venue',
            description='Pending venue',
            address='2 Test Street',
            city='Sydney',
            state='NSW',
            postcode='2000',
            sport_categories=['Tennis'],
            status='pending',
        )

        response = self.client.get('/api/core/admin/dashboard-stats/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['venues']['total'], 2)
        self.assertEqual(response.data['venues']['active'], 1)
        self.assertEqual(response.data['venues']['pending'], 1)

    def test_admin_can_create_event_with_json_payload(self):
        payload = {
            'title': 'JSON Tennis Social',
            'description': 'Created through JSON payload',
            'event_type': 'social',
            'sport_category': 'Tennis',
            'venue_name': 'Approved Admin Venue',
            'address': '1 Test Street',
            'city': 'Sydney',
            'state': 'NSW',
            'postcode': '2000',
            'country': 'Australia',
            'latitude': '-33.8688',
            'longitude': '151.2093',
            'start_date': str(date.today() + timedelta(days=7)),
            'end_date': str(date.today() + timedelta(days=7)),
            'start_time': '18:00',
            'end_time': '20:00',
            'max_participants': 16,
            'min_participants': 2,
            'entry_fee': '0.00',
            'currency': 'AUD',
            'status': 'published',
            'is_public': True,
            'is_registration_open': True,
        }

        response = self.client.post('/api/events/', payload, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['title'], 'JSON Tennis Social')
        self.assertEqual(Event.objects.filter(title='JSON Tennis Social').count(), 1)
