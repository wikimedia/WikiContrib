from django.test import TestCase
from django.urls import reverse, resolve
from .views import DisplayResult, GetUserCommits, GetUsers
from rest_framework.test import APIClient
from contraband.settings import COMMIT_STATUS, BASE_URL
from query.models import Query, QueryFilter, QueryUser
from django.utils import timezone
from query.views import create_hash
from datetime import timedelta
from json import loads


def create_query():
    hash = create_hash()
    query = Query.objects.create(hash_code=hash, file=False)
    data = [
        {
            "fullname": "rammanoj",
            "gerrit_username": "rammanoj",
            "phabricator_username": "Rammanojpotla"
        },
        {
            "fullname": "vasanth",
            "gerrit_username": "gopavasanth",
            "phabricator_username": "Gopavasanth"
        },

    ]
    for i in data:
        i['query'] = query
        QueryUser.objects.create(**i)

    # Add filters to the hash.
    start_time = timezone.now().date().replace(day=1)
    commits = ','.join(COMMIT_STATUS)
    qf = QueryFilter.objects.create(
        query=query,
        start_time=start_time - timedelta(days=365),
        end_time=start_time,
        status=commits
    )
    return query

class TestUrls(TestCase):

    def test_result_url(self):
        url = reverse('result', kwargs={"hash": "test_query"})
        self.assertEqual(resolve(url)._func_path, DisplayResult.__module__ + "." + DisplayResult.__name__)

    def test_commits_url(self):
        url = reverse('user_commits', kwargs={"hash": "test_query"})
        self.assertEqual(resolve(url)._func_path, GetUserCommits.__module__ + "." + GetUserCommits.__name__)

    def test_users_url(self):
        url = reverse('query_users', kwargs={"hash": "test_query"})
        self.assertEqual(resolve(url)._func_path, GetUsers.__module__ + "." + GetUsers.__name__)


class TestViews(TestCase):

    def test_get_users_GET(self):
        query = create_query()
        client = APIClient()
        url = BASE_URL + "result/" + query.hash_code + "/users/"
        response = client.get(url)

        # Check the response code.
        self.assertEqual(response.status_code, 200)

        # Check the Output JSON format.
        self.assertEqual(response.content, b'{"users":["rammanoj","vasanth"]}')

    def test_get_user_commits_GET(self):
        query = create_query()
        client = APIClient()
        url = BASE_URL + "result/" + query.hash_code + "/?user=vasanth"
        response = client.get(url)
        self.assertEqual(response.status_code, 200)

        url = BASE_URL + "result/" + query.hash_code + "/commits/?date=2019-01-01"
        response = client.get(url)

        self.assertEqual(response.status_code, 200)

        data = loads(response.content.decode())

        self.assertEqual("results" in data, True)

    def test_display_result_GET(self):
        query = create_query()
        client = APIClient()
        url = BASE_URL + "result/" + query.hash_code + "/?user=vasanth"
        response = client.get(url)

        # Check the response code.
        self.assertEqual(response.status_code, 200)

        data = loads(response.content.decode())

        # Check the output JSON format.
        self.assertEqual("current" in data, True)
        self.assertEqual("previous" in data, True)
        self.assertEqual("next" in data, True)
        self.assertEqual("filters" in data, True)
        self.assertEqual("current_gerrit" in data, True)
        self.assertEqual("current_phabricator" in data, True)
        self.assertEqual("query" in data, True)
        self.assertEqual("result" in data, True)

