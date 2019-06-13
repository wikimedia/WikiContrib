from rest_framework.serializers import ModelSerializer
from .models import Query, QueryUser, QueryFilter


class QuerySerializer(ModelSerializer):

    class Meta:
        model = Query
        fields = ('pk', 'hash_code')


class QueryUserSerializer(ModelSerializer):

    class Meta:
        model = QueryUser
        fields = ('pk', 'query', 'fullname', 'gerrit_username', 'github_username', 'phabricator_username')
        read_only_fields = ('pk',)


class QueryFilterSerializer(ModelSerializer):

    class Meta:
        model = QueryFilter
        fields = ('pk', 'query', 'start_time', 'end_time', 'status', 'project')
        read_only_fields = ('pk', 'query')