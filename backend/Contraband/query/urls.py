from django.urls import path
from .views import AddQueryUser, QueryRetrieveUpdateDeleteView, CheckQuery

urlpatterns = [
    # Query: Create,Read, Update, Delete
    path('add/user/', AddQueryUser.as_view(), name="query-create"),

    path('<hash>/update/user/', QueryRetrieveUpdateDeleteView.as_view(), name='query-detail'),

    # Check if Query and QueryFilter Exist
    path('<hash>/check/', CheckQuery.as_view(), name='check-query'),

]