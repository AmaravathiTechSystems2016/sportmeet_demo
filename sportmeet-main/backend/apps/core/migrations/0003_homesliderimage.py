from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_site_logos'),
    ]

    operations = [
        migrations.CreateModel(
            name='HomeSliderImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(blank=True, max_length=200)),
                ('subtitle', models.CharField(blank=True, max_length=255)),
                ('image', models.ImageField(upload_to='homepage/slider/')),
                ('cta_text', models.CharField(blank=True, max_length=100)),
                ('cta_url', models.URLField(blank=True)),
                ('order', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'ordering': ['order', '-created_at']},
        ),
    ]


