from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("discounts", "0004_fix_legacy_used_count_default"),
    ]

    operations = [
        migrations.RunPython(migrations.RunPython.noop, migrations.RunPython.noop),
    ]

