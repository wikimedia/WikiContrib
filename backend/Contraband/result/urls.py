from . views import DisplayResult, UserUpdateTimeStamp, UserUpdateStatus, GetUserCommits
from django.urls import path

urlpatterns = [
    path('update/', UserUpdateTimeStamp.as_view(), name='result-update'),
    path('<hash>/', DisplayResult.as_view(), name="result"),
    path('status/update/', UserUpdateStatus.as_view(), name='result-status-update'),
    path('<hash>/commits/<created>/', GetUserCommits.as_view()),

]