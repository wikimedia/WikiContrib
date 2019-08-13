from django.test import TestCase
from django.urls import reverse, resolve
from .views import DisplayResult, GetUserCommits, GetUsers


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


# class TestViews(TestCase):
#
#     def test_display_result_GET(self):
#         response = self.client.get(reverse())