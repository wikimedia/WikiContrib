from . views import DisplayResult
from . views import Sync
from django.urls import path

urlpatterns = [
    path('<hash>/', DisplayResult.as_view()),
    path('he/<hash>/', Sync.as_view()),
]