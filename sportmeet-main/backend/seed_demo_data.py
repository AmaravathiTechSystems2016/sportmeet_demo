#!/usr/bin/env python
"""
Create demo-ready SportMeet data for local development.

This script is intentionally idempotent: run it again after code changes and it
will refresh the demo catalog without creating duplicate core records.
"""
import os
import sys
import urllib.request
from datetime import date, time, timedelta
from decimal import Decimal
from pathlib import Path

import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sportmeet.settings")
django.setup()

from django.conf import settings
from django.utils import timezone
from django.utils.text import slugify

from apps.accounts.models import User, UserProfile, VenueOwnerProfile
from apps.bookings.models import Booking, BookingCourt, BookingTimeSlot
from apps.core.models import HomeSliderImage, SiteSettings
from apps.discounts.models import Discount, DiscountUsage
from apps.events.models import Event, EventComment, EventImage, EventParticipant
from apps.payments.models import Payment
from apps.reports.models import Report
from apps.reviews.models import Review
from apps.venues.models import Court, Venue, VenueAvailability, VenueImage, VenuePricing
from apps.venues.sports_models import Amenity, CourtType, Sport


IMAGE_SOURCES = {
    "hero_1": "https://source.unsplash.com/1600x900/?sports,stadium",
    "hero_2": "https://source.unsplash.com/1600x900/?tennis,court",
    "hero_3": "https://source.unsplash.com/1600x900/?basketball,court",
    "who_we_are": "https://source.unsplash.com/1200x800/?sports,team",
    "venue_melbourne": "https://source.unsplash.com/1400x900/?indoor,sports,court",
    "venue_sydney": "https://source.unsplash.com/1400x900/?football,field",
    "venue_brisbane": "https://source.unsplash.com/1400x900/?badminton,court",
    "venue_perth": "https://source.unsplash.com/1400x900/?swimming,pool",
    "event_tennis": "https://source.unsplash.com/1400x900/?tennis,tournament",
    "event_basketball": "https://source.unsplash.com/1400x900/?basketball,game",
    "event_cricket": "https://source.unsplash.com/1400x900/?cricket,match",
}

FALLBACK_SOURCES = {
    key: f"https://picsum.photos/seed/sportmeet-{key}/1400/900"
    for key in IMAGE_SOURCES
}

LOCAL_ASSETS = {
    "hero_1": "homepage/slider/sportmeet-generated-hero.png",
    "venue_melbourne": "demo/generated-venue.png",
    "event_tennis": "demo/generated-event.png",
    "sport_category": "demo/generated-sports.png",
}


def media_path(relative_path):
    return Path(settings.MEDIA_ROOT) / relative_path


def download_image(key, relative_path):
    local_asset = LOCAL_ASSETS.get(key)
    if local_asset and media_path(local_asset).exists():
        return local_asset

    target = media_path(relative_path)
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() and target.stat().st_size > 1024:
        return relative_path.replace("\\", "/")

    source_url = IMAGE_SOURCES.get(key, f"https://picsum.photos/seed/sportmeet-{key}/1400/900")
    fallback_url = FALLBACK_SOURCES.get(key, f"https://picsum.photos/seed/sportmeet-{key}/1400/900")
    for url in (source_url, fallback_url):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "SportMeet local demo"})
            with urllib.request.urlopen(request, timeout=20) as response:
                data = response.read()
            if len(data) > 1024:
                target.write_bytes(data)
                return relative_path.replace("\\", "/")
        except Exception as exc:
            print(f"Image download failed for {key} from {url}: {exc}")
    return ""


def user(username, email, password, first_name, last_name, user_type, **flags):
    obj, _ = User.objects.get_or_create(
        email=email,
        defaults={
            "username": username,
            "first_name": first_name,
            "last_name": last_name,
            "user_type": user_type,
            "phone_number": flags.get("phone_number", ""),
            "city": flags.get("city", ""),
            "state": flags.get("state", ""),
            "country": "Australia",
            "is_staff": flags.get("is_staff", False),
            "is_superuser": flags.get("is_superuser", False),
            "is_verified": True,
        },
    )
    changed = False
    for field, value in {
        "username": username,
        "first_name": first_name,
        "last_name": last_name,
        "user_type": user_type,
        "is_staff": flags.get("is_staff", False),
        "is_superuser": flags.get("is_superuser", False),
        "is_verified": True,
    }.items():
        if getattr(obj, field) != value:
            setattr(obj, field, value)
            changed = True
    obj.set_password(password)
    obj.save()
    UserProfile.objects.get_or_create(user=obj)
    return obj


def ensure_site_settings():
    settings_obj = SiteSettings.objects.first() or SiteSettings.objects.create()
    settings_obj.site_name = "SportMeet"
    settings_obj.site_description = (
        "Discover and book sports venues, join community events, and manage bookings "
        "from one local sports marketplace."
    )
    settings_obj.contact_email = "hello@sportmeet.local"
    settings_obj.contact_phone = "+61 2 5550 1200"
    settings_obj.address = "Demo HQ, Sydney NSW, Australia"
    settings_obj.currency = "AUD"
    settings_obj.timezone = "Australia/Sydney"
    settings_obj.faqs = (
        "### How do bookings work?\n"
        "Choose a venue, select an available court and time, then confirm the booking.\n\n"
        "### Can venue owners list courts?\n"
        "Yes. Venue owners can register, add venues, manage courts, and review bookings.\n\n"
        "### Are payments live in this demo?\n"
        "No. Stripe integration exists, but demo keys are required before live payment testing."
    )
    settings_obj.terms = "Demo terms: bookings, cancellations, and payments should be reviewed before production launch."
    settings_obj.privacy = "Demo privacy policy: personal data handling must be finalized before production."
    settings_obj.cookies = "Demo cookie policy: analytics and tracking tools are not finalized."
    settings_obj.support = "For demo support, contact hello@sportmeet.local."
    settings_obj.facebook_url = "https://facebook.com/"
    settings_obj.instagram_url = "https://instagram.com/"
    settings_obj.linkedin_url = "https://linkedin.com/"
    settings_obj.who_we_are_image = download_image("who_we_are", "branding/who-we-are.jpg")
    settings_obj.save()

    HomeSliderImage.objects.all().delete()
    slides = [
        ("hero_1", "Book Better Sports Venues", "Find courts, fields, pools, and community games near you.", "/venues"),
        ("hero_2", "Join Local Events", "Register for tournaments, training sessions, and social matches.", "/events"),
        ("hero_3", "Manage Venues With Ease", "A practical dashboard for venue owners and admins.", "/register-venue-owner"),
    ]
    for index, (key, title, subtitle, cta_url) in enumerate(slides):
        HomeSliderImage.objects.create(
            title=title,
            subtitle=subtitle,
            image=download_image(key, f"homepage/slider/{key}.jpg"),
            cta_text="Explore",
            cta_url=cta_url,
            order=index,
            is_active=True,
        )


def ensure_master_data():
    sports = [
        ("Badminton", "Fast indoor racquet sport", "#14B8A6"),
        ("Cricket", "Outdoor bat and ball sport", "#22C55E"),
        ("Football", "Field sport for teams and leagues", "#2563EB"),
        ("Basketball", "Indoor and outdoor court sport", "#F97316"),
        ("Tennis", "Singles and doubles court sport", "#84CC16"),
        ("Swimming", "Pool lanes and aquatic sessions", "#06B6D4"),
        ("Volleyball", "Indoor or beach team sport", "#EAB308"),
        ("Futsal", "Indoor five-a-side football", "#EF4444"),
        ("Netball", "Fast team court sport", "#EC4899"),
        ("Table Tennis", "Compact indoor racquet sport", "#8B5CF6"),
        ("Squash", "Indoor racquet court sport", "#F59E0B"),
        ("Yoga", "Wellness, flexibility, and recovery sessions", "#10B981"),
        ("Boxing", "Fitness and combat training", "#DC2626"),
        ("Running", "Track, club, and endurance sessions", "#0EA5E9"),
        ("Hockey", "Field team sport", "#65A30D"),
        ("Martial Arts", "Structured combat and fitness classes", "#7C3AED"),
    ]
    for order, (name, description, color) in enumerate(sports, start=1):
        Sport.objects.update_or_create(
            slug=slugify(name),
            defaults={
                "name": name,
                "description": description,
                "icon": name.lower(),
                "image": download_image("sport_category", f"sports/{slugify(name)}.png"),
                "color": color,
                "is_active": True,
                "sort_order": order,
            },
        )

    court_types = [
        ("Badminton", "Indoor Wooden Court", "Wood", True),
        ("Basketball", "Indoor Hardwood Court", "Hardwood", True),
        ("Tennis", "Outdoor Hard Court", "Acrylic", False),
        ("Football", "Synthetic Turf Field", "Synthetic Turf", False),
        ("Cricket", "Turf Pitch", "Grass", False),
        ("Swimming", "Heated Indoor Pool", "Tile", True),
        ("Volleyball", "Indoor Multi-Sport Court", "Synthetic", True),
        ("Futsal", "Indoor Futsal Court", "Synthetic", True),
    ]
    for sport_name, name, surface, is_indoor in court_types:
        sport = Sport.objects.get(name=sport_name)
        CourtType.objects.update_or_create(
            sport=sport,
            name=name,
            defaults={"surface_type": surface, "is_indoor": is_indoor, "is_active": True},
        )

    amenities = [
        ("Parking", "facilities"),
        ("Changing Rooms", "facilities"),
        ("Showers", "facilities"),
        ("Equipment Rental", "services"),
        ("Cafeteria", "food"),
        ("First Aid", "safety"),
        ("Lighting", "facilities"),
        ("Scoreboard", "facilities"),
        ("WiFi", "services"),
        ("Accessible Entry", "accessibility"),
        ("Locker Rooms", "facilities"),
        ("Spectator Seating", "facilities"),
    ]
    for order, (name, category) in enumerate(amenities, start=1):
        Amenity.objects.update_or_create(
            slug=slugify(name),
            defaults={
                "name": name,
                "description": f"{name} available on site.",
                "category": category,
                "icon": slugify(name),
                "is_active": True,
                "sort_order": order,
            },
        )


def ensure_venues(owner):
    venue_data = [
        {
            "key": "venue_melbourne",
            "name": "Melbourne Sports Complex",
            "city": "Melbourne",
            "state": "VIC",
            "postcode": "3000",
            "address": "120 Olympic Boulevard",
            "sports": ["Badminton", "Basketball", "Volleyball"],
            "courts": [("Court 1", "Badminton", "Indoor", 40), ("Court 2", "Basketball", "Indoor", 70), ("Court 3", "Volleyball", "Indoor", 55)],
            "lat": Decimal("-37.821200"),
            "lng": Decimal("144.978900"),
        },
        {
            "key": "venue_sydney",
            "name": "Sydney Athletic Centre",
            "city": "Sydney",
            "state": "NSW",
            "postcode": "2000",
            "address": "88 Harbour Sports Drive",
            "sports": ["Football", "Cricket", "Futsal"],
            "courts": [("Field A", "Football", "Outdoor", 95), ("Cricket Nets", "Cricket", "Outdoor", 45), ("Futsal Court", "Futsal", "Indoor", 65)],
            "lat": Decimal("-33.868800"),
            "lng": Decimal("151.209300"),
        },
        {
            "key": "venue_brisbane",
            "name": "Brisbane Racquet Hub",
            "city": "Brisbane",
            "state": "QLD",
            "postcode": "4000",
            "address": "44 Riverside Court",
            "sports": ["Tennis", "Badminton"],
            "courts": [("Tennis Court 1", "Tennis", "Outdoor", 60), ("Tennis Court 2", "Tennis", "Outdoor", 60), ("Badminton Court", "Badminton", "Indoor", 35)],
            "lat": Decimal("-27.470500"),
            "lng": Decimal("153.026000"),
        },
        {
            "key": "venue_perth",
            "name": "Perth Aquatic & Fitness Arena",
            "city": "Perth",
            "state": "WA",
            "postcode": "6000",
            "address": "15 Arena Way",
            "sports": ["Swimming", "Basketball"],
            "courts": [("Lap Pool Lane 1", "Swimming", "Indoor", 30), ("Lap Pool Lane 2", "Swimming", "Indoor", 30), ("Training Court", "Basketball", "Indoor", 50)],
            "lat": Decimal("-31.952300"),
            "lng": Decimal("115.861300"),
        },
        {
            "key": "venue_adelaide",
            "name": "Adelaide Community Courts",
            "city": "Adelaide",
            "state": "SA",
            "postcode": "5000",
            "address": "22 Festival Drive",
            "sports": ["Netball", "Basketball", "Table Tennis"],
            "courts": [("Netball Court", "Netball", "Indoor", 45), ("Basketball Court", "Basketball", "Indoor", 58), ("Table Tennis Zone", "Table Tennis", "Indoor", 25)],
            "lat": Decimal("-34.928500"),
            "lng": Decimal("138.600700"),
        },
        {
            "key": "venue_canberra",
            "name": "Canberra Training Dome",
            "city": "Canberra",
            "state": "ACT",
            "postcode": "2601",
            "address": "9 Capital Circuit",
            "sports": ["Boxing", "Martial Arts", "Yoga"],
            "courts": [("Boxing Studio", "Boxing", "Indoor", 35), ("Dojo Room", "Martial Arts", "Indoor", 38), ("Recovery Studio", "Yoga", "Indoor", 28)],
            "lat": Decimal("-35.280900"),
            "lng": Decimal("149.130000"),
        },
        {
            "key": "venue_hobart",
            "name": "Hobart Racquet & Squash Club",
            "city": "Hobart",
            "state": "TAS",
            "postcode": "7000",
            "address": "31 Harbour Lane",
            "sports": ["Squash", "Tennis", "Badminton"],
            "courts": [("Squash Court 1", "Squash", "Indoor", 42), ("Squash Court 2", "Squash", "Indoor", 42), ("Tennis Court", "Tennis", "Outdoor", 52)],
            "lat": Decimal("-42.882100"),
            "lng": Decimal("147.327200"),
        },
        {
            "key": "venue_gold_coast",
            "name": "Gold Coast Beach Sports Park",
            "city": "Gold Coast",
            "state": "QLD",
            "postcode": "4217",
            "address": "5 Surf Parade",
            "sports": ["Volleyball", "Running", "Football"],
            "courts": [("Beach Volleyball 1", "Volleyball", "Outdoor", 40), ("Beach Volleyball 2", "Volleyball", "Outdoor", 40), ("Training Field", "Football", "Outdoor", 75)],
            "lat": Decimal("-28.016700"),
            "lng": Decimal("153.400000"),
        },
        {
            "key": "venue_newcastle",
            "name": "Newcastle Hockey & Field Centre",
            "city": "Newcastle",
            "state": "NSW",
            "postcode": "2300",
            "address": "72 Hunter Sports Road",
            "sports": ["Hockey", "Football", "Running"],
            "courts": [("Hockey Turf", "Hockey", "Outdoor", 80), ("Field B", "Football", "Outdoor", 70), ("Track Lane", "Running", "Outdoor", 25)],
            "lat": Decimal("-32.928300"),
            "lng": Decimal("151.781700"),
        },
        {
            "key": "venue_darwin",
            "name": "Darwin Indoor Sports Hall",
            "city": "Darwin",
            "state": "NT",
            "postcode": "0800",
            "address": "18 Top End Avenue",
            "sports": ["Futsal", "Badminton", "Table Tennis"],
            "courts": [("Futsal Hall", "Futsal", "Indoor", 62), ("Badminton Court 1", "Badminton", "Indoor", 34), ("Table Tennis Zone", "Table Tennis", "Indoor", 24)],
            "lat": Decimal("-12.463400"),
            "lng": Decimal("130.845600"),
        },
    ]

    approved_demo_names = [item["name"] for item in venue_data]
    Venue.objects.exclude(name__in=approved_demo_names).filter(cover_image="").update(
        status="pending",
        is_featured=False,
    )

    venues = []
    for item in venue_data:
        cover = download_image(item["key"], f"venues/covers/{slugify(item['name'])}.jpg")
        venue, _ = Venue.objects.update_or_create(
            name=item["name"],
            defaults={
                "owner": owner,
                "description": (
                    f"{item['name']} is a demo-ready sports venue with bookable courts, "
                    "clear amenities, realistic pricing, and public discovery content."
                ),
                "address": item["address"],
                "city": item["city"],
                "state": item["state"],
                "postcode": item["postcode"],
                "country": "Australia",
                "latitude": item["lat"],
                "longitude": item["lng"],
                "phone_number": "+61 2 5550 1000",
                "email": f"{slugify(item['name'])}@sportmeet.local",
                "website": "https://sportmeet.local",
                "sport_categories": item["sports"],
                "amenities": ["Parking", "Changing Rooms", "Showers", "Equipment Rental", "First Aid", "Lighting"],
                "rules": "Arrive 10 minutes before booking. Non-marking shoes required for indoor courts.",
                "cancellation_policy": "Free cancellation up to 24 hours before start time in this demo.",
                "google_map_link": "https://maps.google.com/",
                "currency": "AUD",
                "status": "approved",
                "is_verified": True,
                "is_featured": True,
                "cover_image": cover,
            },
        )
        VenueImage.objects.filter(venue=venue).delete()
        for gallery_index in range(2):
            VenueImage.objects.create(
                venue=venue,
                image=cover,
                caption=f"{item['name']} showcase {gallery_index + 1}",
                is_primary=gallery_index == 0,
                order=gallery_index,
            )
        VenueAvailability.objects.filter(venue=venue).delete()
        for day in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]:
            VenueAvailability.objects.create(
                venue=venue,
                day_of_week=day,
                start_time=time(6, 0),
                end_time=time(22, 0),
                is_available=True,
            )
        VenuePricing.objects.filter(venue=venue).delete()
        VenuePricing.objects.create(venue=venue, pricing_type="peak", day_of_week="friday", start_time=time(17, 0), end_time=time(22, 0), price_multiplier=Decimal("1.25"), is_active=True)
        VenuePricing.objects.create(venue=venue, pricing_type="weekend", day_of_week="saturday", price_multiplier=Decimal("1.15"), is_active=True)

        Court.objects.filter(venue=venue).delete()
        for name, sport, court_type, price in item["courts"]:
            court = Court.objects.create(
                venue=venue,
                name=name,
                sport=sport,
                court_type=court_type,
                description=f"{court_type} {sport.lower()} court for casual bookings and training sessions.",
                surface_type="Hard Court" if court_type == "Indoor" else "Turf",
                is_indoor=court_type == "Indoor",
                max_players=12 if sport in ["Football", "Cricket", "Volleyball"] else 4,
                booking_duration_minutes=60,
                price_per_duration=Decimal(str(price)),
                status="active",
                is_available=True,
                image=cover,
                gallery_images=[{"image": f"/media/{cover}", "caption": name}],
            )
            for day in ["monday", "wednesday", "friday", "saturday"]:
                VenueAvailability.objects.create(
                    venue=venue,
                    court=court,
                    day_of_week=day,
                    start_time=time(7, 0),
                    end_time=time(21, 0),
                    is_available=True,
                )
        venues.append(venue)
    return venues


def ensure_events(admin, owner, players):
    today = timezone.localdate()
    event_rows = [
        ("event_tennis", "Friday Night Tennis Ladder", "friendly", "Tennis", "Brisbane Racquet Hub", "Brisbane", 7, 24, 18),
        ("event_basketball", "3x3 Basketball Community Cup", "tournament", "Basketball", "Melbourne Sports Complex", "Melbourne", 14, 48, 25),
        ("event_cricket", "Weekend Cricket Skills Clinic", "training", "Cricket", "Sydney Athletic Centre", "Sydney", 21, 30, 15),
        ("event_netball", "Mixed Netball Social Night", "social", "Netball", "Adelaide Community Courts", "Adelaide", 9, 28, 12),
        ("event_boxing", "Beginner Boxing Bootcamp", "training", "Boxing", "Canberra Training Dome", "Canberra", 11, 18, 20),
        ("event_squash", "Squash Round Robin", "tournament", "Squash", "Hobart Racquet & Squash Club", "Hobart", 16, 20, 16),
        ("event_volleyball", "Beach Volleyball Pairs Cup", "tournament", "Volleyball", "Gold Coast Beach Sports Park", "Gold Coast", 19, 32, 22),
        ("event_hockey", "Junior Hockey Skills Day", "training", "Hockey", "Newcastle Hockey & Field Centre", "Newcastle", 23, 36, 10),
        ("event_futsal", "Friday Futsal League Trial", "league", "Futsal", "Darwin Indoor Sports Hall", "Darwin", 26, 40, 18),
        ("event_yoga", "Athlete Recovery Yoga", "training", "Yoga", "Canberra Training Dome", "Canberra", 5, 22, 8),
    ]
    events = []
    for key, title, event_type, sport, venue_name, city, days_out, max_people, fee in event_rows:
        cover = download_image(key, f"events/covers/{slugify(title)}.jpg")
        event, _ = Event.objects.update_or_create(
            title=title,
            defaults={
                "organizer": owner,
                "venue_name": venue_name,
                "address": "Demo sports precinct",
                "city": city,
                "state": "Australia",
                "postcode": "0000",
                "country": "Australia",
                "title": title,
                "description": f"A demo {sport.lower()} event with registration, participants, comments, and admin visibility.",
                "event_type": event_type,
                "sport_category": sport,
                "host_name": owner.full_name or "SportMeet Host",
                "start_date": today + timedelta(days=days_out),
                "end_date": today + timedelta(days=days_out),
                "start_time": time(18, 0),
                "end_time": time(21, 0),
                "max_participants": max_people,
                "min_participants": 4,
                "registration_deadline": timezone.now() + timedelta(days=days_out - 1),
                "is_registration_open": True,
                "entry_fee": Decimal(str(fee)),
                "currency": "AUD",
                "status": "published",
                "is_public": True,
                "is_featured": True,
                "rules": "Fair play, punctual arrival, and respect for venue staff are required.",
                "requirements": "Bring suitable shoes, water bottle, and booking confirmation.",
                "prizes": "Demo prizes and leaderboard recognition.",
                "contact_info": "events@sportmeet.local",
                "cover_image": cover,
                "published_at": timezone.now(),
            },
        )
        EventImage.objects.filter(event=event).delete()
        EventImage.objects.create(event=event, image=cover, caption=title, is_primary=True, order=0)
        EventParticipant.objects.filter(event=event).delete()
        for player in players[:2]:
            EventParticipant.objects.create(event=event, user=player, status="confirmed", payment_status="paid" if fee else "free")
        EventComment.objects.filter(event=event).delete()
        EventComment.objects.create(event=event, user=players[0], comment="Looking forward to this session. Great venue choice!", is_approved=True)
        events.append(event)
    return events


def ensure_bookings_payments_reviews(venues, players):
    today = timezone.localdate()
    Booking.objects.filter(contact_email__endswith="@demo.sportmeet.local").delete()
    Review.objects.all().delete()
    Payment.objects.filter(transaction_id__startswith="DEMO-").delete()

    booking_specs = [
        (players[0], venues[0], 2, time(10, 0), time(11, 0), "confirmed", "paid"),
        (players[1], venues[1], 4, time(18, 0), time(20, 0), "confirmed", "paid"),
        (players[2], venues[2], 6, time(9, 0), time(10, 0), "completed", "paid"),
        (players[0], venues[3], 8, time(7, 0), time(8, 0), "pending", "pending"),
    ]
    for index, (player, venue, days_out, start, end, status, payment_status) in enumerate(booking_specs, start=1):
        court = venue.courts.first()
        hours = Decimal(str((end.hour * 60 + end.minute - start.hour * 60 - start.minute) / 60))
        booking = Booking.objects.create(
            user=player,
            venue=venue,
            court=court,
            booking_date=today + timedelta(days=days_out),
            start_time=start,
            end_time=end,
            duration_hours=hours,
            base_price=court.price_per_duration,
            price_per_hour=court.price_per_duration,
            discount_amount=Decimal("0.00"),
            currency="AUD",
            status=status,
            payment_status=payment_status,
            special_requests="Demo booking created for showcase.",
            number_of_players=2,
            contact_phone="+61 2 5550 2000",
            contact_email=f"booking{index}@demo.sportmeet.local",
            confirmed_at=timezone.now() if status in ["confirmed", "completed"] else None,
        )
        BookingCourt.objects.create(
            booking=booking,
            court=court,
            booking_date=booking.booking_date,
            start_time=start,
            end_time=end,
            duration_hours=hours,
            price_per_hour=court.price_per_duration,
            total_amount=court.price_per_duration * hours,
        )
        if payment_status == "paid":
            Payment.objects.create(
                user=player,
                booking=booking,
                amount=booking.final_amount,
                currency="AUD",
                payment_method="stripe",
                status="completed",
                transaction_id=f"DEMO-BOOKING-{index}",
                gateway_transaction_id=f"pi_demo_booking_{index}",
                gateway_response={"mode": "demo"},
                completed_at=timezone.now(),
            )

    for venue, rating, player, title in [
        (venues[0], 5, players[0], "Excellent indoor courts"),
        (venues[1], 4, players[1], "Great field lighting"),
        (venues[2], 5, players[2], "Smooth booking experience"),
        (venues[3], 4, players[0], "Clean pool and friendly staff"),
    ]:
        Review.objects.create(
            venue=venue,
            user=player,
            overall_rating=rating,
            cleanliness_rating=rating,
            facility_rating=rating,
            value_rating=max(1, rating - 1),
            title=title,
            comment="Demo review for showcasing venue trust signals and rating cards.",
            is_approved=True,
            is_verified=True,
        )
        venue.update_rating_stats()

    for venue in venues:
        for offset in range(1, 8):
            BookingTimeSlot.objects.update_or_create(
                venue=venue,
                date=today + timedelta(days=offset),
                start_time=time(17, 0),
                defaults={"end_time": time(18, 0), "is_available": True, "price_override": Decimal("55.00"), "max_players": 8},
            )


def ensure_discounts_reports(admin, players):
    discount, _ = Discount.objects.update_or_create(
        code="WELCOME10",
        defaults={
            "name": "Welcome 10% Off",
            "description": "Demo coupon for first booking checkout flows.",
            "discount_type": "percentage",
            "value": Decimal("10.00"),
            "max_discount_amount": Decimal("25.00"),
            "min_order_amount": Decimal("20.00"),
            "valid_from": timezone.now() - timedelta(days=1),
            "valid_until": timezone.now() + timedelta(days=60),
            "status": "active",
            "usage_limit": 500,
            "usage_count": 1,
            "user_limit": 1,
            "first_time_only": False,
            "applicable_to_venues": True,
            "applicable_to_events": True,
            "created_by": admin,
        },
    )
    if players:
        DiscountUsage.objects.get_or_create(
            discount=discount,
            user=players[0],
            booking_type="venue",
            booking_id=1,
            defaults={
                "original_amount": Decimal("60.00"),
                "discount_amount": Decimal("6.00"),
                "final_amount": Decimal("54.00"),
                "ip_address": "127.0.0.1",
            },
        )

    Report.objects.update_or_create(
        name="Demo Venue Performance",
        defaults={
            "description": "Pre-generated demo analytics summary.",
            "report_type": "venue_performance",
            "created_by": admin,
            "parameters": {"period": "next_30_days"},
            "filters": {"status": "approved"},
            "data": {"bookings": 4, "revenue": 260, "top_sport": "Basketball"},
            "is_generated": True,
            "generated_at": timezone.now(),
        },
    )


def main():
    print("Seeding SportMeet demo data...")
    admin = user("admin", "admin@sportmeet.com", "admin123", "Admin", "User", "admin", is_staff=True, is_superuser=True, city="Sydney", state="NSW")
    owner = user("venueowner", "owner@sportmeet.com", "owner123", "John", "Smith", "venue_owner", city="Melbourne", state="VIC")
    players = [
        user("player1", "player@sportmeet.com", "player123", "Alice", "Johnson", "player", city="Sydney", state="NSW"),
        user("player2", "sam.player@sportmeet.com", "player123", "Sam", "Taylor", "player", city="Brisbane", state="QLD"),
        user("player3", "mia.player@sportmeet.com", "player123", "Mia", "Chen", "player", city="Perth", state="WA"),
    ]
    VenueOwnerProfile.objects.update_or_create(
        user=owner,
        defaults={
            "business_name": "SportMeet Demo Venues",
            "abn": "12345678901",
            "business_address": "120 Olympic Boulevard, Melbourne VIC",
            "business_phone": "+61 2 5550 1000",
            "business_email": "owner@sportmeet.com",
            "business_description": "Demo venue-owner profile for local testing.",
            "is_verified": True,
        },
    )

    ensure_site_settings()
    ensure_master_data()
    venues = ensure_venues(owner)
    events = ensure_events(admin, owner, players)
    ensure_bookings_payments_reviews(venues, players)
    ensure_discounts_reports(admin, players)

    print(f"Demo users: {User.objects.count()}")
    print(f"Demo venues: {Venue.objects.count()}")
    print(f"Demo courts: {Court.objects.count()}")
    print(f"Demo events: {Event.objects.count()} ({len(events)} refreshed)")
    print(f"Demo bookings: {Booking.objects.count()}")
    print("Done.")


if __name__ == "__main__":
    main()
