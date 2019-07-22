from rest_framework.serializers import ModelSerializer
from .models import ListCommit


class UserCommitSerializer(ModelSerializer):

    class Meta:
        model = ListCommit
        fields = ('heading', 'platform', 'redirect', 'owned', 'assigned', 'status')
