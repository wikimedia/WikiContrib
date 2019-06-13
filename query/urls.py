from django.urls import path
from .views import AddQueryUser

urlpatterns = [
    path('add/user/', AddQueryUser.as_view()),
]