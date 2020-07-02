from django.core.management.base import BaseCommand
from datetime import timedelta
from django.utils import timezone
from result.models import ListCommit


class Command(BaseCommand):
    """
    :Summary: Management Command to Automate the ListCommit deletion after the expiry time of the ListCommits.
    """
    help = 'Auto delete ListCommit'

    def handle(self, *args, **options):
        for i in ListCommit.objects.all():
            if i.created_on + timedelta(days=1) <= timezone.now():
                i.delete()
        self.stdout.write("Executed Auto ListCommit Delete Command.")
