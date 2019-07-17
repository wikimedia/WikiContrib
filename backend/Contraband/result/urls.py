from . views import DisplayResult, UserUpdateTimeStamp, UserUpdateStatus, GetUserCommits
from django.urls import path

urlpatterns = [
    path('<hash>/', DisplayResult.as_view(), name="result"),
    path('update/', UserUpdateTimeStamp.as_view(), name='result-update'),
    path('status/update/', UserUpdateStatus.as_view(), name='result-status-update'),
    path('<hash>/commits/<created>/', GetUserCommits.as_view()),

]