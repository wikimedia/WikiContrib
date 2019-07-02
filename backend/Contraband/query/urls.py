from django.urls import path
from .views import AddQueryUser, QueryAddFilter, QueryFilterView, QueryRetrieveUpdateDeleteView, CheckQuery, test

urlpatterns = [
    # Query: Create,Read, Update, Delete
    path('add/user/', AddQueryUser.as_view()),
    path('<hash>/update/user/', QueryRetrieveUpdateDeleteView.as_view()),

    # Query Filter: Create, Read, Update, Delete
    path('<hash>/add/filter/', QueryAddFilter.as_view()),
    path('<hash>/update/filter/', QueryFilterView.as_view()),

    # Check if Query and QueryFilter Exist
    path('<hash>/check/', CheckQuery.as_view()),

    # Test
    path('test/', test.as_view()),

]