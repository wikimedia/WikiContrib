from . views import DisplayResult, GetUserCommits, GetUsers, MatchFullNames
from django.urls import path

urlpatterns = [
    # Check if usernames belong to the same user
    path('match-fullnames/',MatchFullNames.as_view(), name="match_fullnames"),

    # Fetch the User contributions with a given username.
    path('<hash>/', DisplayResult.as_view(), name="result"),

    # Get user commits.
    path('<hash>/commits/', GetUserCommits.as_view(), name="user_commits"),

    # Get users belong to a query.
    path('<hash>/users/', GetUsers.as_view(), name="query_users"),
]
