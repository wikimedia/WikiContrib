from . views import DisplayResult
from django.urls import path

urlpatterns = [
    path('<hash>/', DisplayResult.as_view()),
]