import json
import os

from django.db import transaction, IntegrityError
from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
from pytz import utc
from rest_framework import status
from .models import Query, QueryFilter, QueryUser
from datetime import timedelta, datetime
from django.shortcuts import get_object_or_404, redirect
from rest_framework.generics import CreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import QueryFilterSerializer, QuerySerializer, QueryUserSerializer
from django.core.serializers import serialize
from collections import namedtuple
from WikiContrib.settings import BASE_DIR, DEBUG
from os import rename, remove
from WikiContrib.settings import COMMIT_STATUS
from result.views import UserUpdateStatus, UserUpdateTimeStamp
from result.helper import create_hash

class CheckQuery(APIView):
    """
    :Summary: Check if a query already exists.
    """
    http_method_names = ['post']

    def post(self, request, *args, **kwargs):
        print("calling post in checkquery-------------------")
        """
        :param request: request Object.
        :param args: arguments passed to the function.
        :param kwargs: Key, values passed to the function.
        :return: Response Object query: bool; filter: bool
        """
        query = Query.objects.filter(hash_code=self.kwargs['hash'])
        if query:
            filter_exist = QueryFilter.objects.filter(query=query[0]).exists()
        else:
            filter_exist = False
        return Response({
            'query': query.exists(),
            'filter': filter_exist
        })


class AddQueryUser(CreateAPIView):
    """
    :Summary: Create a query.
    """
    serializer_class = QuerySerializer

    def post(self, request, *args, **kwargs):
        print("calling post in AddQueryUser-------------------")
        """
        :param request: request Object.
        :param args: arguments passed to the function.
        :param kwargs: Key, values passed to the function.
        :return: redirect to '/result/<hash>/'
        """
        try:
            if int(request.data['file']) is 0:
                if int(request.data['chunk']) is 1:
                    # Create a new modal Object

                    request.data._mutable = True
                    request.data['hash_code'] = create_hash()
                    request.data._mutable = False

                    if "csv_file" not in request.data:
                        return Response({'message': 'Please provide a CSV file', 'error': 1},
                                        status=status.HTTP_400_BAD_REQUEST)

                    query = super(AddQueryUser, self).post(request, *args, **kwargs)
                    query_obj = get_object_or_404(Query, pk=query.data['pk'])
                    query_obj.file = True
                    query_obj.save()

                    if int(request.data['complete']) != 0:
                        filename = BASE_DIR + "/uploads/" + query_obj.hash_code + ".csv.part"
                    else:
                        filename = BASE_DIR + "/uploads/" + query_obj.hash_code + ".csv"

                    os.makedirs(os.path.dirname(filename), exist_ok=True)

                    with open(filename, 'wb+') as destination:
                        destination.write(request.data['csv_file'].read())

                    if int(request.data['complete']) == 0:
                        query_obj.csv_file = query_obj.hash_code + ".csv"
                        query_obj.save()
                        end_time = timezone.now().replace(minute=0, second=0, microsecond=0)
                        start_time = end_time - timedelta(days=365)

                        QueryFilter.objects.create(
                            query=query_obj,
                            start_time=start_time,
                            end_time=end_time,
                            status=','.join(COMMIT_STATUS)
                        )
                else:
                    # Append the file to the already created CSV file

                    query_obj = get_object_or_404(Query, hash_code=request.data['hash_code'])
                    with open(BASE_DIR + "/uploads/" + query_obj.hash_code + ".csv.part", "ab") as destination:
                        destination.write(request.data['csv_file'].read())

                    if int(request.data['complete']) is 0:
                        rename(BASE_DIR + "/uploads/" + query_obj.hash_code + ".csv.part",
                               BASE_DIR + "/uploads/" + query_obj.hash_code + ".csv")
                        query_obj.csv_file = query_obj.hash_code + ".csv"
                        end_time = timezone.now().replace(minute=0, second=0, microsecond=0)
                        start_time = end_time - timedelta(days=365)
                        query_obj.save()
                        QueryFilter.objects.create(
                            query=query_obj,
                            start_time=start_time,
                            end_time=end_time,
                            status=','.join(COMMIT_STATUS)
                        )

                if int(request.data['complete']) is 0:
                    return redirect('result', hash=query_obj.hash_code)
                else:
                    return Response({'message': query_obj.hash_code, "chunk": request.data['chunk'], 'error': 0})
            else:
                request.data['hash_code'] = create_hash(request.data['users'])
                print("request.data[hash_code] ",request.data["hash_code"])
                try:
                    with transaction.atomic():
                        query = ""
                        if Query.objects.filter(hash_code=request.data['hash_code']).exists():
                            query = Query.objects.filter(hash_code=request.data['hash_code'])
                            print("this is query after being fetched: ",query)
                            query[0].queryuser_set.all().delete()
                            query[0].queryfilter.delete()

                            query = json.loads(serialize("json",query))
                            query[0]["fields"]["pk"] = query[0]["pk"]
                            query = {"data":query[0]["fields"]}
                            query = namedtuple("query",query.keys())(*query.values())

                        else:
                            # Add the Query
                            query = super(AddQueryUser, self).post(request, *args, **kwargs)
                            print("this is query after being created through super: ",query)

                        end_time = timezone.now().replace(minute=0, second=0, microsecond=0)
                        start_time = end_time - timedelta(days=365)

                        QueryFilter.objects.create(
                            query=get_object_or_404(Query, hash_code=query.data['hash_code']),
                            start_time=start_time,
                            end_time=end_time,
                            status=','.join(COMMIT_STATUS)
                        )

                        # Add username's & platform's to the query
                        temp = 1
                        print("users in query -----------")
                        print(request.data['users'])
                        for i in request.data['users']:
                            data = i.copy()
                            if QueryUser.objects.filter(Q(query__pk=query.data['pk']), Q(fullname=data['fullname'])).exists():
                                raise IntegrityError
                            # Ignore if all the fields are empty
                            if not (data['fullname'] == "" and data['gerrit_username'] == ""
                                    and data['github_username'] == "" and data['phabricator_username'] == ""):
                                data['query'] = query.data['pk']
                                s = QueryUserSerializer(data=data)
                                s.is_valid(raise_exception=True)
                                s.save()
                                temp = 0

                        # If all the fields are empty all the times, delete the query
                        if temp == 1:
                            raise KeyError
                except KeyError:
                    Query.objects.filter(hash_code=query.data['hash_code']).delete()
                    return Response({
                        'message': 'Please provide users data',
                        'error': 1
                    }, status=status.HTTP_400_BAD_REQUEST)

                except IntegrityError:
                    Query.objects.filter(hash_code=query.data['hash_code']).delete()
                    return Response({
                        'message': 'Fullname\'s has to be unique!!',
                        'error': 1
                    }, status=status.HTTP_400_BAD_REQUEST)

                return redirect('result', hash=query.data['hash_code'])
        except KeyError:
            return Response({
                'message': 'Fill the form completely!',
                'error': 1
            }, status=status.HTTP_400_BAD_REQUEST)


class QueryRetrieveUpdateDeleteView(RetrieveUpdateDestroyAPIView):
    """
    :Summary: View, Update or Delete a Query.
    """
    serializer_class = QuerySerializer
    http_method_names = ['get', 'patch', 'delete']

    def get_object(self):
        print("calling get_object in QueryRetrieveUpdateDeleteView-------------------")
        """
        :return: ModalObject of Query
        """
        return get_object_or_404(Query, hash_code=self.kwargs['hash'])

    def get(self, request, *args, **kwargs):
        print("calling get in QueryRetrieveUpdateDeleteView-------------------")
        """
        :Summary: GET request to view the query.
        :param request: request Object.
        :param args: arguments passed to the function.
        :param kwargs: Key, values passed to the function.
        :return: Response Object containing the data of of all the users in the Query.
        """
        if self.get_object().file:
            return Response({"uri": self.get_object().csv_file_uri, 'file': 0})
        else:
            s = QueryUserSerializer(self.get_object().queryuser_set, many=True, context={'request': request})
            data = {}
            data['users'] = s.data.copy()
            data['file'] = -1
            return Response(data)

    def patch(self, request, *args, **kwargs):
        print("calling patch in QueryRetrieveUpdateDeleteView-------------------")
        """
        :Summary: PATCH request to update the query.
        :param request: request Object.
        :param args: arguments passed to the function.
        :param kwargs: Key, values passed to the function.
        :return: HTTPRedirect with redirect location (to /result/<hash>/)
        """
        try:
            if int(request.data['file']) is 0:
                # Update the CSV file
                try:
                    file_path = self.get_object().csv_file.path
                except ValueError:
                    file_path = BASE_DIR + "/uploads/" + self.kwargs['hash'] + ".csv"
                if int(request.data['chunk']) is 1:
                    with open(file_path + ".part", 'wb+') as destination:
                        destination.write(request.data['csv_file'].read())
                else:
                    # Append the file to the already created CSV file
                    with open(file_path + ".part", "ab") as destination:
                        destination.write(request.data['csv_file'].read())

                if int(request.data['complete']) == 0:
                    try:
                        remove(file_path)
                    except FileNotFoundError:
                        pass
                    self.get_object().queryuser_set.all().delete()
                    query = self.get_object()
                    query.file = True
                    query.csv_file = self.kwargs['hash'] + ".csv"
                    query.save()
                    rename(file_path + ".part", file_path)

                    response = HttpResponse(content="", status=303)
                    response['location'] = '/result/' + self.get_object().hash_code + '/'
                    return response
                else:
                    return Response({
                        "message": "Successfully updated.",
                        "chunk": request.data['chunk'],
                        "error": 0
                    })
            else:
                # Update the users
                try:
                    with transaction.atomic():
                        query = get_object_or_404(Query, hash_code=self.kwargs['hash'])
                        query.file = False
                        query.csv_file = ""
                        query.save()
                        query.queryuser_set.all().delete()
                        temp = 0
                        if "users" in request.data:
                            query.hash_code = create_hash(request.data['users'])
                            query.save()
                            for i in request.data['users']:
                                data = i.copy()
                                if not (data['fullname'] == "" and data['gerrit_username'] == ""
                                        and data['github_username'] == "" and data['phabricator_username'] == ""):
                                    data['query'] = self.get_object().pk
                                    s = QueryUserSerializer(data=data)
                                    s.is_valid(raise_exception=True)
                                    s.save()
                                    temp = 1
                            if temp == 0:
                                raise IntegrityError
                except IntegrityError:
                    return Response({
                        'message': 'Cannot update with the empty fields',
                        'error': 1
                    }, status=status.HTTP_400_BAD_REQUEST)
                response = HttpResponse(content="", status=303)
                response['location'] = '/result/' + self.get_object().hash_code + '/'
                return response

        except KeyError:
            return Response({
                "message": "Fill the form completely!",
                "error": 1
            }, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
        print("calling delete in QueryRetrieveUpdateDeleteView-------------------")
        """
         :Summary: DELETE request to delete the query.
         :param request: request Object.
         :param args: arguments passed to the function.
         :param kwargs: Key, values passed to the function.
         :return: Success Response.
         """
        super(QueryRetrieveUpdateDeleteView, self).delete(request, *args, **kwargs)
        return Response({
            "message": "Successfully deleted the Query",
            "error": 0
        })


class QueryFilterView(RetrieveUpdateDestroyAPIView):
    """
    :Summary: View, Update Filters to the Query.
    """
    serializer_class = QueryFilterSerializer
    http_method_names = ['get', 'patch']

    def get_object(self):
        print("calling get_object in queryfilterview----------------------")
        return get_object_or_404(QueryFilter, query__hash_code=self.kwargs['hash'])

    def get(self, request, *args, **kwargs):
        print("calling get in queryfilterview--------------------")
        """
        :Summary: GET request to view the query filters.
        :param request: request Object.
        :param args: arguments passed to the function.
        :param kwargs: Key, values passed to the function.
        :return: Query filters of the given query.
        """
        query = get_object_or_404(Query, hash_code=self.kwargs['hash'])
        if QueryFilter.objects.filter(query=query).exists():
            if "start_time" in request.data:
                request.data['start_time'] = utc.localize(datetime.strptime(
                       request.data["start_time"].split(".")[0],"%Y-%m-%dT%H:%M:%S"))

            if "end_time" in request.data:
                request.data['end_time'] = utc.localize(datetime.strptime(
                       request.data["end_time"].split(".")[0],"%Y-%m-%dT%H:%M:%S"))

            return super(QueryFilterView, self).get(request, *args, **kwargs)
        else:
            return Response({
                "project": "",
                "status": "",
                "start_time": None,
                "end_time": None
            })

    def patch(self, request, *args, **kwargs):
        print("calling patch in query filter view---------------------")
        """
        :Summary: PATCH request to Update the query filters.
        :param request: request Object.
        :param args: arguments passed to the function.
        :param kwargs: Key, values passed to the function.
        :return: response of UserUpdateStatus() (or) UserUpdateTimeStamp() function
         depending upon the filters user updated.
        """

        rv = {
            "username": request.data['username'],
            "query": self.get_object().query.hash_code
        }
        if QueryFilter.objects.filter(query__hash_code=self.kwargs['hash']).exists():
            commit_status = self.get_object().status
            commit_start = self.get_object().start_time
            commit_end = self.get_object().end_time
            if 'username' not in request.data:
                return Response({'message': 'Fill the form completely', 'error': 1},
                                status=status.HTTP_400_BAD_REQUEST)

            if "start_time" in request.data:
                request.data['start_time'] = utc.localize(datetime.strptime(
                       request.data["start_time"].split(".")[0],"%Y-%m-%dT%H:%M:%S"))

            if "end_time" in request.data:
                request.data['end_time'] = utc.localize(datetime.strptime(
                       request.data["end_time"].split(".")[0],"%Y-%m-%dT%H:%M:%S"))

            data = super(QueryFilterView, self).patch(request, *args, **kwargs).data#an inconsistency with the how this method patches filters
            # and how AddQueryUsers creates the first queryfilter still needs to be investigated as it might still exist and it causes the
            # application to make network requests when it is supposed to fetch
            # from the cache. this might have something to do with the way we handle time in the whole application. We might have to handle time
            # properly before this issue can be solved

            if data['status'] != commit_status:
                if commit_start != data['start_time']\
                        or commit_end != data['end_time']:
                    return UserUpdateTimeStamp(rv)
                else:
                    return UserUpdateStatus(rv)
            else:
                # User has changed the timestamp, perform the request again.
                return UserUpdateTimeStamp(rv)
        else:
            kwargs = request.data.copy()
            kwargs['query'] = get_object_or_404(Query, hash_code=self.kwargs['hash'])
            QueryFilter.objects.create(**kwargs)
            return UserUpdateTimeStamp(rv)
