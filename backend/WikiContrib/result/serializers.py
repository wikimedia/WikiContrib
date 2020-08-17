from rest_framework.serializers import ModelSerializer
from .models import ListCommit


class UserCommitSerializer(ModelSerializer):
    """
    :Summary: Serialize the data of ListCommit model
    """
    class Meta:
        model = ListCommit
        fields = ('heading', 'platform', 'redirect', 'authored', 'assigned', 'status')
