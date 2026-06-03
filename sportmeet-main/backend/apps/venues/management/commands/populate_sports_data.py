from django.core.management.base import BaseCommand
from apps.venues.sports_models import Sport, CourtType, Amenity


class Command(BaseCommand):
    help = 'Populate initial sports, court types, and amenities data'

    def handle(self, *args, **options):
        self.stdout.write('Populating sports data...')
        
        # Create Sports
        sports_data = [
            {
                'name': 'Football',
                'slug': 'football',
                'description': 'Association football/soccer',
                'icon': '⚽',
                'color': '#10B981',
                'min_court_length': 90,
                'max_court_length': 120,
                'min_court_width': 45,
                'max_court_width': 90,
                'sort_order': 1
            },
            {
                'name': 'Basketball',
                'slug': 'basketball',
                'description': 'Basketball court',
                'icon': '🏀',
                'color': '#F59E0B',
                'min_court_length': 28,
                'max_court_length': 28,
                'min_court_width': 15,
                'max_court_width': 15,
                'sort_order': 2
            },
            {
                'name': 'Tennis',
                'slug': 'tennis',
                'description': 'Tennis court',
                'icon': '🎾',
                'color': '#3B82F6',
                'min_court_length': 23.77,
                'max_court_length': 23.77,
                'min_court_width': 8.23,
                'max_court_width': 10.97,
                'sort_order': 3
            },
            {
                'name': 'Cricket',
                'slug': 'cricket',
                'description': 'Cricket ground',
                'icon': '🏏',
                'color': '#8B5CF6',
                'min_court_length': 137,
                'max_court_length': 150,
                'min_court_width': 137,
                'max_court_width': 150,
                'sort_order': 4
            },
            {
                'name': 'Badminton',
                'slug': 'badminton',
                'description': 'Badminton court',
                'icon': '🏸',
                'color': '#EF4444',
                'min_court_length': 13.4,
                'max_court_length': 13.4,
                'min_court_width': 6.1,
                'max_court_width': 6.1,
                'sort_order': 5
            },
            {
                'name': 'Volleyball',
                'slug': 'volleyball',
                'description': 'Volleyball court',
                'icon': '🏐',
                'color': '#06B6D4',
                'min_court_length': 18,
                'max_court_length': 18,
                'min_court_width': 9,
                'max_court_width': 9,
                'sort_order': 6
            },
            {
                'name': 'Swimming',
                'slug': 'swimming',
                'description': 'Swimming pool',
                'icon': '🏊',
                'color': '#0EA5E9',
                'min_court_length': 25,
                'max_court_length': 50,
                'min_court_width': 12.5,
                'max_court_width': 25,
                'sort_order': 7
            },
            {
                'name': 'Gym',
                'slug': 'gym',
                'description': 'Gymnasium',
                'icon': '💪',
                'color': '#84CC16',
                'sort_order': 8
            }
        ]

        for sport_data in sports_data:
            sport, created = Sport.objects.get_or_create(
                slug=sport_data['slug'],
                defaults=sport_data
            )
            if created:
                self.stdout.write(f'Created sport: {sport.name}')
            else:
                self.stdout.write(f'Sport already exists: {sport.name}')

        # Create Court Types
        court_types_data = [
            # Football
            {'sport': 'football', 'name': 'Grass Field', 'surface_type': 'Grass', 'is_indoor': False, 'length': 105, 'width': 68},
            {'sport': 'football', 'name': 'Artificial Turf', 'surface_type': 'Artificial Turf', 'is_indoor': False, 'length': 105, 'width': 68},
            {'sport': 'football', 'name': 'Indoor Court', 'surface_type': 'Hard Court', 'is_indoor': True, 'length': 40, 'width': 20},
            
            # Basketball
            {'sport': 'basketball', 'name': 'Indoor Court', 'surface_type': 'Hard Court', 'is_indoor': True, 'length': 28, 'width': 15},
            {'sport': 'basketball', 'name': 'Outdoor Court', 'surface_type': 'Concrete', 'is_indoor': False, 'length': 28, 'width': 15},
            
            # Tennis
            {'sport': 'tennis', 'name': 'Hard Court', 'surface_type': 'Hard Court', 'is_indoor': False, 'length': 23.77, 'width': 10.97},
            {'sport': 'tennis', 'name': 'Clay Court', 'surface_type': 'Clay', 'is_indoor': False, 'length': 23.77, 'width': 10.97},
            {'sport': 'tennis', 'name': 'Indoor Court', 'surface_type': 'Hard Court', 'is_indoor': True, 'length': 23.77, 'width': 10.97},
            
            # Badminton
            {'sport': 'badminton', 'name': 'Indoor Court', 'surface_type': 'Wood', 'is_indoor': True, 'length': 13.4, 'width': 6.1},
            
            # Volleyball
            {'sport': 'volleyball', 'name': 'Indoor Court', 'surface_type': 'Wood', 'is_indoor': True, 'length': 18, 'width': 9},
            {'sport': 'volleyball', 'name': 'Beach Court', 'surface_type': 'Sand', 'is_indoor': False, 'length': 18, 'width': 9},
            
            # Swimming
            {'sport': 'swimming', 'name': '25m Pool', 'surface_type': 'Water', 'is_indoor': True, 'length': 25, 'width': 12.5},
            {'sport': 'swimming', 'name': '50m Pool', 'surface_type': 'Water', 'is_indoor': True, 'length': 50, 'width': 25},
            {'sport': 'swimming', 'name': 'Outdoor Pool', 'surface_type': 'Water', 'is_indoor': False, 'length': 25, 'width': 12.5},
        ]

        for court_data in court_types_data:
            sport = Sport.objects.get(slug=court_data['sport'])
            # Remove sport from court_data since we're passing it separately
            court_data_copy = court_data.copy()
            del court_data_copy['sport']
            
            court_type, created = CourtType.objects.get_or_create(
                sport=sport,
                name=court_data['name'],
                defaults=court_data_copy
            )
            if created:
                self.stdout.write(f'Created court type: {sport.name} - {court_type.name}')
            else:
                self.stdout.write(f'Court type already exists: {sport.name} - {court_type.name}')

        # Create Amenities
        amenities_data = [
            {'name': 'Parking', 'slug': 'parking', 'category': 'parking', 'icon': '🅿️', 'sort_order': 1},
            {'name': 'Changing Rooms', 'slug': 'changing-rooms', 'category': 'facilities', 'icon': '🚿', 'sort_order': 2},
            {'name': 'Cafeteria', 'slug': 'cafeteria', 'category': 'food', 'icon': '🍽️', 'sort_order': 3},
            {'name': 'Equipment Rental', 'slug': 'equipment-rental', 'category': 'equipment', 'icon': '🎾', 'sort_order': 4},
            {'name': 'WiFi', 'slug': 'wifi', 'category': 'general', 'icon': '📶', 'sort_order': 5},
            {'name': 'Air Conditioning', 'slug': 'air-conditioning', 'category': 'facilities', 'icon': '❄️', 'sort_order': 6},
            {'name': 'Lighting', 'slug': 'lighting', 'category': 'facilities', 'icon': '💡', 'sort_order': 7},
            {'name': 'First Aid', 'slug': 'first-aid', 'category': 'safety', 'icon': '🏥', 'sort_order': 8},
            {'name': 'Water Fountains', 'slug': 'water-fountains', 'category': 'facilities', 'icon': '🚰', 'sort_order': 9},
            {'name': 'Seating Area', 'slug': 'seating-area', 'category': 'facilities', 'icon': '🪑', 'sort_order': 10},
            {'name': 'Shower Facilities', 'slug': 'shower-facilities', 'category': 'facilities', 'icon': '🚿', 'sort_order': 11},
            {'name': 'Locker Rooms', 'slug': 'locker-rooms', 'category': 'facilities', 'icon': '🔒', 'sort_order': 12},
        ]

        for amenity_data in amenities_data:
            amenity, created = Amenity.objects.get_or_create(
                slug=amenity_data['slug'],
                defaults=amenity_data
            )
            if created:
                self.stdout.write(f'Created amenity: {amenity.name}')
            else:
                self.stdout.write(f'Amenity already exists: {amenity.name}')

        self.stdout.write(
            self.style.SUCCESS('Successfully populated sports data!')
        )
