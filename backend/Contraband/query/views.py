from django.db import transaction
from rest_framework import status
from .models import Query, QueryFilter, QueryUser
from django.utils.crypto import get_random_string
from django.shortcuts import get_object_or_404
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
                        query = {
                            "hash_code": query_obj.hash_code,
                            "pk": query_obj.pk,
                            "csv_file_uri": query_obj.csv_file_uri
                        }
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

                        query = {
                            "hash_code": query_obj.hash_code,
                            "pk": query_obj.pk,
                            "csv_file_uri": query_obj.csv_file_uri
                        }

                if int(request.data['complete']) is 0:
                    return Response(query)
                else:
                    return Response({'message': query_obj.hash_code, "chunk": request.data['chunk'], 'error': 0})
            else:
                if len(request.data['users']) > 200:
                    return Response({
                        'message': 'At a maximum of 200 entities can be given for a query',
                        'error': 0
                    }, status=status.HTTP_400_BAD_REQUEST)
                request.data['hash_code'] = create_hash()
                with transaction.atomic():
                    # Add the Query
                    query = super(AddQueryUser, self).post(request, *args, **kwargs)

                    # Add the usernames & platforms to the query
                    temp = 1
                    for i in request.data['users']:
                        data = i.copy()

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
                        Query.objects.filter(hash_code=query.data['hash_code']).delete()
                        return Response({
                            'message': 'Please provide users data',
                            'error': 1
                        }, status=status.HTTP_400_BAD_REQUEST)

                return Response({
                        "hash_code": query.data['hash_code'],
                        "pk": query.data['pk'],
                        "csv_file_uri": query.data['csv_file_uri']
                        })
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
                    rename(file_path + ".part", file_path)
                    self.get_object().queryuser_set.all().delete()
                    query = self.get_object()
                    query.file = True
                    query.csv_file = file_path
                    query.save()

                    return Response({
                        "message": self.get_object().hash_code,
                        "chunk": request.data['chunk'],
                        "error": 0
                    })
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
                return Response({
                    "message": "Updated successfully",
                    "error": 0
                })

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


class QueryAddFilter(CreateAPIView):
    serializer_class = QueryFilterSerializer
    http_method_names = ['post']

    def create(self, request, *args, **kwargs):
        s = QueryFilterSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        QueryFilter.objects.create(query=get_object_or_404(Query, hash_code=self.kwargs['hash']), **s.validated_data)
        return Response({
            'message': 'Successfully added filters!',
            'error': 0
        })


class QueryFilterView(RetrieveUpdateDestroyAPIView):
    serializer_class = QueryFilterSerializer
    http_method_names = ['get', 'patch', 'delete']

    def get_object(self):
        return get_object_or_404(QueryFilter, query__hash_code=self.kwargs['hash'])

    def delete(self, request, *args, **kwargs):
        super(QueryFilterView, self).delete(request, *args, **kwargs)
        return Response({
            "message": "Successfully deleted filters",
            "error": 0
        })
