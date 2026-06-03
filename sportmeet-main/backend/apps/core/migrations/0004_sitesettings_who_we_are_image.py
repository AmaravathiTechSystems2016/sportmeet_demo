# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_homesliderimage'),
    ]

    operations = [
        migrations.AddField(
            model_name='sitesettings',
            name='who_we_are_image',
            field=models.ImageField(blank=True, help_text='Who We Are section image', null=True, upload_to='branding/'),
        ),
    ]