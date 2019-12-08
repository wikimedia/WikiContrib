from django.db import models
from WikiContrib.settings import BASE_URL
from django.utils import timezone
from WikiContrib.settings import DEBUG


class Query(models.Model):
    """
    :Summary: Store details of Query.
    """
    hash_code = models.CharField(unique=True, max_length=64)
    file = models.BooleanField(default=False)
    csv_file = models.FileField(upload_to='uploads/', null=True, blank=True)
    created_on = models.DateTimeField(default=timezone.now)

    @property
    def csv_file_uri(self):
        base_url = BASE_URL[:-1]
        if not DEBUG:
            base_url += "/src"
        if self.file is not False and self.csv_file != "":
            return base_url + self.csv_file.url
        return ""

    def __str__(self):
        return self.hash_code


class QueryUser(models.Model):
    """
    :Summary: Store username's of Users in a specific Query.
    """
    query = models.ForeignKey(Query, on_delete=models.CASCADE)
    fullname = models.CharField(max_length=100, default="")
    gerrit_username = models.CharField(max_length=40, default="")
    github_username = models.CharField(max_length=40, default="")
    phabricator_username = models.CharField(max_length=40, default="")

    def __str__(self):
        return self.query.__str__() + "--" + self.fullname


class QueryFilter(models.Model):
    """
    :Summary: Store filters of a Query.
    """
    query = models.OneToOneField(Query, on_delete=models.CASCADE)
    start_time = models.DateField(null=True, blank=True)
    end_time = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return self.query.__str__()
