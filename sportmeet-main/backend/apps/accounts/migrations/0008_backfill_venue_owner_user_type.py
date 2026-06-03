from django.db import migrations


def backfill_venue_owner_user_type(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    VenueOwnerProfile = apps.get_model("accounts", "VenueOwnerProfile")
    owner_user_ids = VenueOwnerProfile.objects.values_list("user_id", flat=True)
    User.objects.filter(id__in=owner_user_ids).exclude(user_type="venue_owner").update(
        user_type="venue_owner"
    )


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(backfill_venue_owner_user_type, migrations.RunPython.noop),
    ]

