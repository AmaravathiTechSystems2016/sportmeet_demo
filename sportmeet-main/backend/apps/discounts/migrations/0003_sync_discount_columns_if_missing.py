from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("discounts", "0002_create_m2m_tables_if_missing"),
    ]

    operations = [
        migrations.RunPython(migrations.RunPython.noop, migrations.RunPython.noop),
    ]

