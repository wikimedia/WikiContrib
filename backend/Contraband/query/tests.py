from django.test import TestCase
from django.urls import resolve, reverse
from django.utils import timezone
from datetime import timedelta
from .views import AddQueryUser, QueryRetrieveUpdateDeleteView as QueryDetailView, QueryFilterView, CheckQuery, create_hash
from test_data import query_create_url as create_url, query_create_csv as create_csv,\
    query_create_data as create_data, query_update_url as update_url, \
    query_update_data as update_data, query_filter_data as filter_data, \
    query_filter_url as filter_url
from rest_framework.test import APIRequestFactory, APIClient
from .models import Query, QueryUser, QueryFilter
from os import remove
from contraband.settings import COMMIT_STATUS, BASE_URL


class TestUrls(TestCase):
    """
    :Summary: Perform URL Testing.
    """

    def test_query_create_url(self):
        """
        :Summary: Test '/query/add/user/` URL.
        """
        url = reverse('query-create')
        self.assertEqual(resolve(url)._func_path, AddQueryUser.__module__ + "." + AddQueryUser.__name__)

    def test_query_detail_url(self):
        """
        :Summary: Test '/query/<hash>/update/user/` URL.
        """
        url = reverse('query-detail', kwargs={"hash": "test_query"})
        self.assertEqual(resolve(url)._func_path, QueryDetailView.__module__ + "." + QueryDetailView.__name__)

    def test_query_filter_detail_url(self):
        """
        :Summary: Test '/query/<hash>/update/filter/` URL.
        """
        url = reverse('query-filter-detail', kwargs={"hash": "test_query"})
        self.assertEqual(resolve(url)._func_path, QueryFilterView.__module__ + "." + QueryFilterView.__name__)

    def test_query_check_url(self):
        """
        :Summary: Test '/query/<hash>/check/` URL.
        """
        url = reverse('check-query', kwargs={"hash": "test_query"})
        self.assertEqual(resolve(url)._func_path, CheckQuery.__module__ + "." + CheckQuery.__name__)


class TestViews(TestCase):
    """
    :Summary: Perform View Testing.
    """

    def test_query_create_DATA(self):
        """
        :Summary: Test AddQueryUser View (i.e Create Query View) by providing JSON data.
        """
        factory = APIRequestFactory()
        request = factory.post(create_url, create_data, format='json')
        response = AddQueryUser.as_view()(request)

        # Check the response code
        self.assertEqual(response.status_code, 302)

        # Check if the URL is returned properly
        query = Query.objects.all()[0]
        self.assertEqual('/result/' + query.hash_code + "/", response.url)

    def test_query_create_CSV(self):
        """
        :Summary: Test AddQueryUser View (i.e Create Query View) by providing data through CSV file.
        """
        with open('test_data/test_csv_upload.csv') as fp:
            create_csv['csv_file'] = fp
            response = self.client.post(create_url, create_csv)
        self.assertEqual(response.status_code, 302)
        path = 'uploads/' + response.url.split("/")[2] + ".csv"
        remove(path)

    def test_query_update_DATA(self):
        """
        :Summary: Test QueryRetrieveUpdateDeleteView View (i.e Update Query View) by providing JSON data.
        """
        hash = create_hash()
        query = Query.objects.create(hash_code=hash, file=False)
        for i in create_data['users']:
            i['query'] = query
            QueryUser.objects.create(**i)

        # Update the Query
        client = APIClient()
        url = update_url.replace('<hash>', query.hash_code)
        response = client.patch(url, update_data, format='json')

        # Check the response code
        self.assertEqual(response.status_code, 303)

        # Check the redirect location
        self.assertEqual(response.has_header('location'), True)

        # Check the value of redirect location
        headers = response.serialize_headers().decode().split('location: ')[1].split('\r\n')[0]
        self.assertEqual(headers, '/result/' + query.hash_code + '/')

    def test_query_update_CSV(self):
        """
        :Summary: Test QueryRetrieveUpdateDeleteView View (i.e Update Query View) by providing data through CSV file.
        """
        hash = create_hash()
        query = Query.objects.create(hash_code=hash, file=False)
        for i in create_data['users']:
            i['query'] = query
            QueryUser.objects.create(**i)

        # Update the Query with csv file
        client = APIClient()
        url = update_url.replace('<hash>', query.hash_code)
        update_data = create_csv
        with open('test_data/test_csv_update.csv') as fp:
            update_data['csv_file'] = fp
            response = client.patch(url, update_data)

        # Check the response code
        self.assertEqual(response.status_code, 303)

        # Check the redirect location
        self.assertEqual(response.has_header('location'), True)

        # Check the value of redirect location
        headers = response.serialize_headers().decode().split('location: ')[1].split('\r\n')[0]
        self.assertEqual(headers, '/result/' + query.hash_code + '/')

        path = 'uploads/' + query.hash_code + ".csv"
        remove(path)

class TestModels(TestCase):
    """
    :Summary: Perform Modal Testing.
    """

    def test_query_model(self):
        """
        :Summary: Test Query Model csv_file_uri attribute.
        """
        with open('test_data/test_csv_upload.csv') as fp:
            create_csv['csv_file'] = fp
            response = self.client.post(create_url, create_csv)

        path = 'uploads/' + response.url.split("/")[2] + ".csv"
        remove(path)
        query = Query.objects.all()[0]
        uri = BASE_URL + path

        self.assertEqual(query.csv_file_uri, uri)
