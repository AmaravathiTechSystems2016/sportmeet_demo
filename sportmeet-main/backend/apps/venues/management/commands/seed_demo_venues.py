from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import time

from apps.venues.models import Venue, Court, VenueAvailability, VenuePricing
from apps.venues.sports_models import Sport, Amenity


class Command(BaseCommand):
    help = "Seed demo venues with courts, availability, pricing, sports and amenities"

    def handle(self, *args, **options):
        User = get_user_model()
        admin = User.objects.filter(is_staff=True).first()
        if not admin:
            self.stderr.write("No admin user found. Create an admin/staff user first.")
            return

        # Ensure baseline sports and amenities exist
        sports = [
            ("Badminton", "🏸", "#E91E63"),
            ("Tennis", "🎾", "#4CAF50"),
            ("Basketball", "🏀", "#FF9800"),
            ("Football", "⚽", "#009688"),
            ("Swimming", "🏊", "#00BCD4"),
            ("Gym", "🏋", "#9C27B0"),
        ]
        amenities = [
            "Parking",
            "Change rooms",
            "Showers",
            "Cafe",
            "Water fountain",
            "Equipment rental",
        ]

        from django.utils.text import slugify
        sport_names = []
        for name, icon, color in sports:
            s_slug = slugify(name)
            sport = Sport.objects.filter(slug=s_slug).first() or Sport.objects.filter(name=name).first()
            if not sport:
                sport = Sport.objects.create(name=name, slug=s_slug, icon=icon, color=color)
            else:
                updated = False
                if not sport.slug:
                    sport.slug = s_slug; updated = True
                if not sport.icon:
                    sport.icon = icon; updated = True
                if updated:
                    sport.save()
            sport_names.append(name.lower())

        for a in amenities:
            a_slug = slugify(a)
            amenity = Amenity.objects.filter(slug=a_slug).first() or Amenity.objects.filter(name=a).first()
            if not amenity:
                amenity = Amenity.objects.create(name=a, slug=a_slug)
            elif not amenity.slug:
                amenity.slug = a_slug
                amenity.save(update_fields=["slug"])

        # Helper to create venue idempotently
        def upsert_venue(slug_name: str, **kwargs) -> Venue:
            v, created = Venue.objects.get_or_create(name=slug_name, defaults=kwargs)
            if not created:
                # update core fields to keep data fresh
                for k, vval in kwargs.items():
                    setattr(v, k, vval)
                v.save()
            return v

        # Venue 1: Central Sports Arena (Badminton/Tennis)
        v1 = upsert_venue(
            "Central Sports Arena",
            owner=admin,
            description="Multi-sport complex with quality courts",
            address="123 King St",
            city="Melbourne",
            state="VIC",
            postcode="3000",
            country="Australia",
            sport_categories=["badminton", "tennis"],
            amenities=["Parking", "Change rooms", "Showers"],
            status="approved",
            is_verified=True,
            is_featured=True,
            currency="AUD",
            average_rating=4.8,
            total_reviews=54,
        )

        # Courts for v1
        courts_v1 = [
            ("Court 1", "badminton", 60, 25),
            ("Court 2", "badminton", 60, 25),
            ("Tennis A", "tennis", 90, 35),
        ]
        for name, sport, duration, price in courts_v1:
            Court.objects.update_or_create(
                venue=v1, name=name,
                defaults={
                    "sport": sport,
                    "court_type": "Indoor" if sport == "badminton" else "Outdoor",
                    "max_players": 4,
                    "booking_duration_minutes": duration,
                    "price_per_duration": price,
                    "status": "active",
                }
            )

        # Availability (Mon–Fri: 06-10 and 17-22)
        days = ["monday", "tuesday", "wednesday", "thursday", "friday"]
        for d in days:
            VenueAvailability.objects.update_or_create(
                venue=v1, day_of_week=d, start_time=time(6, 0),
                defaults={"end_time": time(10, 0), "is_available": True}
            )
            VenueAvailability.objects.update_or_create(
                venue=v1, day_of_week=d, start_time=time(17, 0),
                defaults={"end_time": time(22, 0), "is_available": True}
            )

        # Pricing rules (peak/off-peak)
        VenuePricing.objects.update_or_create(
            venue=v1, pricing_type="off_peak", day_of_week="monday", start_time=time(6, 0),
            defaults={"end_time": time(10, 0), "price_multiplier": 0.80, "is_active": True}
        )
        VenuePricing.objects.update_or_create(
            venue=v1, pricing_type="peak", day_of_week="monday", start_time=time(17, 0),
            defaults={"end_time": time(22, 0), "price_multiplier": 1.20, "is_active": True}
        )

        # Venue 2: Riverside Aquatics (Swimming/Gym)
        v2 = upsert_venue(
            "Riverside Aquatics",
            owner=admin,
            description="Olympic pool and modern gym facilities",
            address="50 River Rd",
            city="Brisbane",
            state="QLD",
            postcode="4000",
            country="Australia",
            sport_categories=["swimming", "gym"],
            amenities=["Parking", "Showers", "Water fountain", "Cafe"],
            status="approved",
            is_verified=True,
            is_featured=True,
            currency="AUD",
            average_rating=4.5,
            total_reviews=25,
        )
        Court.objects.update_or_create(
            venue=v2, name="Lane 1", defaults={
                "sport": "swimming", "court_type": "Indoor", "max_players": 1,
                "booking_duration_minutes": 45, "price_per_duration": 12,
            }
        )
        Court.objects.update_or_create(
            venue=v2, name="Gym Zone A", defaults={
                "sport": "gym", "court_type": "Indoor", "max_players": 10,
                "booking_duration_minutes": 60, "price_per_duration": 15,
            }
        )

        for d in days:
            VenueAvailability.objects.update_or_create(
                venue=v2, day_of_week=d, start_time=time(6, 0),
                defaults={"end_time": time(21, 0), "is_available": True}
            )

        self.stdout.write(self.style.SUCCESS("Seeded demo venues, courts, availability, pricing, sports, amenities."))


