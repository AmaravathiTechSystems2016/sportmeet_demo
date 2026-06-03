from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('venues', '0005_remove_venue_booking_duration_minutes_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='venueavailability',
            name='court',
            field=models.ForeignKey(null=True, blank=True, on_delete=models.deletion.CASCADE, related_name='availability', to='venues.court'),
        ),
        migrations.AlterUniqueTogether(
            name='venueavailability',
            unique_together={('venue', 'day_of_week', 'start_time', 'court')},
        ),
    ]


