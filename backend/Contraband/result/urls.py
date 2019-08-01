from . views import DisplayResult, UserUpdateTimeStamp, UserUpdateStatus, GetUserCommits, GetUsers
from django.urls import path

urlpatterns = [
    path('update/', UserUpdateTimeStamp.as_view(), name='result-update'),
    path('<hash>/', DisplayResult.as_view(), name="result"),
    path('status/update/', UserUpdateStatus.as_view(), name='result-status-update'),
    path('<hash>/commits/', GetUserCommits.as_view()),
    path('<hash>/users/', GetUsers.as_view()),
]