from django.db import models
from query.models import Query


class ListCommit(models.Model):
    """
    :Summary: Store User commit details fetched.
    """
    query = models.ForeignKey(Query, on_delete=models.CASCADE)
    heading = models.CharField(max_length=200)
    platform = models.CharField(max_length=20)
    created_on = models.CharField(max_length=50)
    redirect = models.CharField(max_length=200)
    status = models.CharField(max_length=20)
    owned = models.BooleanField(default=False)
    assigned = models.BooleanField(default=False)

    def __str__(self):
        return self.query.__str__()