from django.db import transaction, IntegrityError
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from .models import Query, QueryFilter, QueryUser
from datetime import timedelta, datetime
from django.utils.crypto import get_random_string
from django.shortcuts import get_object_or_404, redirect
from rest_framework.generics import CreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import QueryFilterSerializer, QuerySerializer, QueryUserSerializer
from contraband.settings import BASE_DIR
from os import rename, remove


def create_hash():
    hash_code = get_random_string(64)
    while Query.objects.filter(hash_code=hash_code).exists():
        hash_code = get_random_string(64)
    return hash_code


class CheckQuery(APIView):
    http_method_names = ['post']

    def post(self, request, *args, **kwargs):
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
    serializer_class = QuerySerializer

    def post(self, request, *args, **kwargs):
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

                    with open(filename, 'wb+') as destination:
                        destination.write(request.data['csv_file'].read())

                    if int(request.data['complete']) == 0:
                        query_obj.csv_file = query_obj.hash_code + ".csv"
                        query_obj.save()
                        QueryFilter.objects.create(
                            query=query_obj,
                            start_time=timezone.now().date() - timedelta(days=365),
                            end_time=timezone.now().date()
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
                        query_obj.save()
                        QueryFilter.objects.create(
                            query=query_obj,
                            start_time=timezone.now() - timedelta(days=365),
                            end_time=timezone.now()
                        )

                if int(request.data['complete']) is 0:
                    print("came here: " + str(request.data['chunk']))
                    return redirect('result', hash=query_obj.hash_code)
                else:
                    return Response({'message': query_obj.hash_code, "chunk": request.data['chunk'], 'error': 0})
            else:
                request.data['hash_code'] = create_hash()
                try:
                    with transaction.atomic():
                        # Add the Query
                        query = super(AddQueryUser, self).post(request, *args, **kwargs)
                        QueryFilter.objects.create(
                            query=get_object_or_404(Query, hash_code=query.data['hash_code']),
                            start_time=timezone.now().date() - timedelta(days=365),
                            end_time=timezone.now().date()
                        )

                        # Add the usernames & platforms to the query
                        temp = 1
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
    serializer_class = QuerySerializer
    http_method_names = ['get', 'patch', 'delete']

    def get_object(self):
        return get_object_or_404(Query, hash_code=self.kwargs['hash'])

    def get(self, request, *args, **kwargs):
        if self.get_object().file:
            return Response({"uri": self.get_object().csv_file_uri, 'file': 0})
        else:
            s = QueryUserSerializer(self.get_object().queryuser_set, many=True, context={'request': request})
            data = {}
            data['users'] = s.data.copy()
            data['file'] = -1
            return Response(data)

    def patch(self, request, *args, **kwargs):
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
                    query.csv_file = file_path
                    query.save()
                    rename(file_path + ".part", file_path)

                    return redirect('result', hash=self.get_object().hash_code)
                else:
                    return Response({
                        "message": "Successfully updated.",
                        "chunk": request.data['chunk'],
                        "error": 0
                    })
            else:
                # Update the users
                with transaction.atomic():
                    query = get_object_or_404(Query, hash_code=self.kwargs['hash'])
                    query.file = False
                    query.csv_file = ""
                    query.save()

                    query.queryuser_set.all().delete()

                    if "users" in request.data:
                        for i in request.data['users']:
                            data = i.copy()
                            data['query'] = self.get_object().pk
                            s = QueryUserSerializer(data=data)
                            s.is_valid(raise_exception=True)
                            s.save()
                return redirect('result', hash=self.get_object().hash_code)

        except KeyError:
            return Response({
                "message": "Fill form completely!",
                "error": 1
            }, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
        super(QueryRetrieveUpdateDeleteView, self).delete(request, *args, **kwargs)
        return Response({
            "message": "Successfully deleted the Query",
            "error": 0
        })


class QueryFilterView(RetrieveUpdateDestroyAPIView):
    serializer_class = QueryFilterSerializer
    http_method_names = ['get', 'patch']

    def get_object(self):
        return get_object_or_404(QueryFilter, query__hash_code=self.kwargs['hash'])

    def get(self, request, *args, **kwargs):
        query = get_object_or_404(Query, hash_code=self.kwargs['hash'])
        if QueryFilter.objects.filter(query=query).exists():
            return super(QueryFilterView, self).get(request, *args, **kwargs)
        else:
            return Response({
                "project": "",
                "status": "",
                "start_time": None,
                "end_time": None
            })

    def patch(self, request, *args, **kwargs):
        if QueryFilter.objects.filter(query__hash_code=self.kwargs['hash']).exists():
            commit_status = self.get_object().status
            commit_start = self.get_object().start_time
            commit_end = self.get_object().end_time
            if 'username' not in request.data:
                return Response({'message': 'Fill the form completely', 'error': 1},
                                status=status.HTTP_400_BAD_REQUEST)
            data = super(QueryFilterView, self).patch(request, *args, **kwargs).data
            request.session['data'] = {
                "username": request.data['username'],
                "query": self.get_object().query.hash_code
            }
            if data['status'] != commit_status:
                if commit_start != datetime.strptime(data['start_time'], "%Y-%m-%d").date()\
                        or commit_end != datetime.strptime(data['end_time'], "%Y-%m-%d").date():
                    return redirect('result-update')
                else:
                    return redirect('result-status-update')
            else:
                # User has changed the timestamp, perform the request again.
                return redirect('result-update')
        else:
            kwargs = request.data.copy()
            kwargs['query'] = get_object_or_404(Query, hash_code=self.kwargs['hash'])
            QueryFilter.objects.create(**kwargs)
            request.session['data'] = {
                "username": request.data['username'],
                "query": kwargs['query'].hash_code
            }
            return redirect('result-update')
