from django.core.management.base import BaseCommand
from apps.events.models import Event

class Command(BaseCommand):
    help = 'Add host names to existing events'

    def handle(self, *args, **options):
        events = Event.objects.all()
        host_names = ['Vishnu', 'Phillip', 'Sam', 'Alex', 'Maria', 'John', 'Sarah', 'Mike']
        
        for i, event in enumerate(events):
            event.host_name = host_names[i % len(host_names)]
            event.save()
            self.stdout.write(
                self.style.SUCCESS(f'Updated {event.title} with host: {event.host_name}')
            )
