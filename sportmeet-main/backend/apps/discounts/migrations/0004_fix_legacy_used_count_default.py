from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("discounts", "0003_sync_discount_columns_if_missing"),
    ]

    operations = [
        migrations.RunPython(migrations.RunPython.noop, migrations.RunPython.noop),
    ]

