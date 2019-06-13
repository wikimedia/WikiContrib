from django.db import transaction
from rest_framework import status
from .models import Query, QueryFilter
from django.utils.crypto import get_random_string
from django.shortcuts import get_object_or_404
from rest_framework.generics import CreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.response import Response
from . import serializers
from Contraband.settings import BASE_DIR


def create_hash():
    hash_code = get_random_string(64)
    while Query.objects.filter(hash_code=hash_code).exists():
        hash_code = get_random_string(64)
    return hash_code


class AddQueryUser(CreateAPIView):
    serializer_class = serializers.QuerySerializer

    def post(self, request, *args, **kwargs):
        if int(request.data['file']) is 0:
            if int(request.data['chunk']) is 1:
                # Create a new modal Object

                request.data._mutable = True
                request.data['hash_code'] = create_hash()
                request.data['file'] = True
                request.data._mutable = False

                if "csv_file" not in request.data:
                    return Response({'message': 'Please provide a CSV file', 'error': 1},
                                    status=status.HTTP_400_BAD_REQUEST)

                query = super(AddQueryUser, self).post(request, *args, **kwargs)
                query_obj = get_object_or_404(Query, pk=query.data['pk'])

                with open(BASE_DIR + "/uploads/" + query_obj.hash_code + ".csv", 'wb+') as destination:
                    destination.write(request.data['csv_file'].read())
            else:
                # Append the file to the already created CSV file

                query_obj = get_object_or_404(Query, hash_code=request.data['hash_code'])
                with open(BASE_DIR + "/uploads/" + query_obj.hash_code + ".csv", "ab") as destination:
                    destination.write(request.data['csv_file'].read())

                query_obj.csv_file = query_obj.hash_code + ".csv"
                query_obj.save()

                query = {
                    "hash_code": query_obj.hash_code,
                    "pk": query_obj.pk,
                    "csv_file_uri": query_obj.csv_file_uri
                }

            if int(request.data['complete']) is 0:
                return Response({'message': query, 'error': 0})
            else:
                return Response({'message': query_obj.hash_code, 'error': 0})
        else:
            request.data._mutable = True
            request.data['hash_code'] = create_hash()
            request.data._mutable = False
            with transaction.atomic():
                # Add the Query
                query = super(AddQueryUser, self).post(request, *args, **kwargs)

                # Add the usernames & platforms to the query
                for i in request.data['users']:
                    data = i.copy()
                    data['query'] = query.data.pk
                    s = serializers.QueryUserSerializer(data=data)
                    s.is_valid(raise_exception=True)
                    s.save()

            return Response({
                'message': {
                    "hash_code": query.data.hash_code,
                    "pk": query.data.pk,
                    "csv_file_uri": query.csv_file_uri
                },
                "error": 0
            })


class QueryAddFilter(CreateAPIView):
    serializer_class = serializers.QueryFilterSerializer
    http_method_names = ['post']

    def create(self, request, *args, **kwargs):
        s = serializers.QueryFilterSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        QueryFilter.objects.create(query=get_object_or_404(Query, hash_code=self.kwargs['hash']), **s.validated_data)
        return Response({
            'message': 'Successfully added filters!',
            'error': 0
        })


class QueryFilterView(RetrieveUpdateDestroyAPIView):
    serializer_class = serializers.QueryFilterSerializer
    http_method_names = ['get', 'patch', 'delete']

    def get_object(self):
        return get_object_or_404(QueryFilter, query__hash_code=self.kwargs['query'])
