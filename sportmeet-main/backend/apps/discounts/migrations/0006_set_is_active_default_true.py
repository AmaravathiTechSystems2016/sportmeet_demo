from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("discounts", "0005_allow_null_valid_dates"),
    ]

    operations = [
        migrations.RunPython(migrations.RunPython.noop, migrations.RunPython.noop),
    ]

