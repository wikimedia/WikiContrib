from django.db import models
from query.models import Query


class ListCommit(models.Model):
    PLATFORMS = (
        ('pb', 'Phabricator'),
        ('gr', 'Gerrit'),
        ('gt', 'Git')
    )
    query = models.OneToOneField(Query, on_delete=models.CASCADE)
    heading = models.CharField(max_length=200)
    platform = models.CharField(max_length=2, choices=PLATFORMS)
    created_on = models.CharField(max_length=50)
    redirect = models.CharField(max_length=200)
    status = models.CharField(max_length=20)

    def __str__(self):
        return self.query.__str__()