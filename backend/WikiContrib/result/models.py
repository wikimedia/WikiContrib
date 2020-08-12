from django.db import models
from django.utils import timezone
from query.models import Query


class ListCommit(models.Model):
    """
    :Summary: Store User commit details fetched.
    """
    query = models.ForeignKey(Query, on_delete=models.CASCADE)
    user_hash = models.CharField(max_length=64, blank=True ,null=True,  default="")
    heading = models.CharField(max_length=200, unique=True)
    platform = models.CharField(max_length=20)
    created_on = models.DateTimeField(default=timezone.now)
    createdStart = models.DateTimeField(default=timezone.now)
    createdEnd = models.DateTimeField(default=timezone.now)
    redirect = models.CharField(max_length=200)
    status = models.CharField(max_length=20)
    owned = models.BooleanField(default=False)
    assigned = models.BooleanField(default=False)

    def __str__(self):
        return self.query.__str__()
