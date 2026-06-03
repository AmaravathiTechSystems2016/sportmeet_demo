from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("discounts", "0001_initial"),
        ("events", "0005_remove_event_venue_event_address_event_city_and_more"),
        ("venues", "0006_add_court_to_availability"),
    ]

    operations = [
        migrations.RunSQL(
            sql=r'''
            CREATE TABLE IF NOT EXISTS discounts_specific_events (
                discount_id BIGINT NOT NULL,
                event_id BIGINT NOT NULL,
                UNIQUE (discount_id, event_id)
            );
            ''',
            reverse_sql=r'''
            DROP TABLE IF EXISTS discounts_specific_events;
            '''
        ),
        migrations.RunSQL(
            sql=r'''
            CREATE TABLE IF NOT EXISTS discounts_specific_venues (
                discount_id BIGINT NOT NULL,
                venue_id BIGINT NOT NULL,
                UNIQUE (discount_id, venue_id)
            );
            ''',
            reverse_sql=r'''
            DROP TABLE IF EXISTS discounts_specific_venues;
            '''
        ),
    ]


