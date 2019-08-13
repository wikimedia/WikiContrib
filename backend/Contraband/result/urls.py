from . views import DisplayResult, GetUserCommits, GetUsers
from django.urls import path

urlpatterns = [
    path('<hash>/', DisplayResult.as_view(), name="result"),
    path('<hash>/commits/', GetUserCommits.as_view(), name="user_commits"),
    path('<hash>/users/', GetUsers.as_view(), name="query_users"),
]