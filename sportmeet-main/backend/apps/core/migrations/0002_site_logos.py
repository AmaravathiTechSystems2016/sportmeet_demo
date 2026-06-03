from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='sitesettings',
            name='logo_main',
            field=models.ImageField(blank=True, null=True, upload_to='branding/', help_text='Landing page main logo'),
        ),
        migrations.AddField(
            model_name='sitesettings',
            name='logo_admin',
            field=models.ImageField(blank=True, null=True, upload_to='branding/', help_text='Admin dashboard logo'),
        ),
        migrations.AddField(
            model_name='sitesettings',
            name='logo_auth',
            field=models.ImageField(blank=True, null=True, upload_to='branding/', help_text='Login/Register form logo'),
        ),
    ]


