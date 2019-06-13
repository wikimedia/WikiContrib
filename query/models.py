from django.db import models
from Contraband.settings import BASE_URL
from django.utils.crypto import get_random_string
from django.utils import timezone


class Query(models.Model):
    hash_code = models.CharField(default=get_random_string(64), unique=True, max_length=64)
    file = models.BooleanField(default=False)
    csv_file = models.FileField(upload_to='uploads/', null=True, blank=True)
    created_on = models.DateTimeField(default=timezone.now)

    @property
    def csv_file_uri(self):
        if self.csv_file is not None:
            return BASE_URL[:-1] + self.csv_file.url
        return ""

    def __str__(self):
        return self.hash_code


class QueryUser(models.Model):
    query = models.ForeignKey(Query, on_delete=models.CASCADE)
    fullname = models.CharField(max_length=100, default="")
    gerrit_username = models.CharField(max_length=40, default="")
    github_username = models.CharField(max_length=40, default="")
    phabricator_username = models.CharField(max_length=40, default="")

    def __str__(self):
        return self.query.__str__() + "--" + self.fullname


class QueryFilter(models.Model):
    query = models.ForeignKey(Query, on_delete=models.CASCADE)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=40, null=True, blank=True)
    project = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return self.query.__str__()
