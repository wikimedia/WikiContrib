from django.core.management.base import BaseCommand
from datetime import timedelta
from django.utils import timezone
from query.models import Query


class Command(BaseCommand):
    help = 'Auto delete Query'

    def handle(self, *args, **options):
        for i in Query.objects.all():
            if i.created_on + timedelta(days=30) <= timezone.now():
                i.delete()
        self.stdout.write("Executed Auto Query Delete Command.")