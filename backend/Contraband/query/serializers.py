from django.shortcuts import get_object_or_404
from rest_framework.serializers import ModelSerializer, CharField, DateField
from .models import Query, QueryUser, QueryFilter


class QuerySerializer(ModelSerializer):
    """
    :Summary: Serialize data of Query Model
    """
    class Meta:
        model = Query
        fields = ('pk', 'hash_code', 'csv_file_uri')


class QueryUserSerializer(ModelSerializer):
    """
    :Summary: Serialize data of QueryUser Model
    """
    fullname = CharField(required=False, allow_blank=False)
    gerrit_username = CharField(required=False, allow_blank=True)
    github_username = CharField(required=False, allow_blank=True)
    phabricator_username = CharField(required=False, allow_blank=True)

    class Meta:
        model = QueryUser
        fields = ('pk', 'query', 'fullname', 'gerrit_username', 'github_username', 'phabricator_username')
        read_only_fields = ('pk',)


class QueryFilterSerializer(ModelSerializer):
    """
    :Summary: Serialize data of QueryFilter Model
    """
    start_time = DateField(required=False, allow_null=True)
    end_time = DateField(required=False, allow_null=True)
    status = CharField(required=False, allow_blank=True)
    project = CharField(required=False, allow_blank=True)

    def to_representation(self, instance):
        data = super(QueryFilterSerializer, self).to_representation(instance)
        data['query'] = get_object_or_404(Query, pk=data['query']).hash_code
        return data

    class Meta:
        model = QueryFilter
        fields = ('pk', 'query', 'start_time', 'end_time', 'status', 'project')
        read_only_fields = ('pk', 'query')
