from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import VenueOwnerProfile


@receiver(post_save, sender=VenueOwnerProfile)
def ensure_user_marked_as_venue_owner(sender, instance: VenueOwnerProfile, created: bool, **kwargs):
    user = instance.user
    if user.user_type != 'venue_owner':
        user.user_type = 'venue_owner'
        user.save(update_fields=['user_type', 'updated_at'])


