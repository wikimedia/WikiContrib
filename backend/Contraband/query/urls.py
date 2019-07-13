from django.urls import path
from .views import AddQueryUser, QueryFilterView, QueryRetrieveUpdateDeleteView, CheckQuery, test

urlpatterns = [
    # Query: Create,Read, Update, Delete
    path('add/user/', AddQueryUser.as_view()),
    path('<hash>/update/user/', QueryRetrieveUpdateDeleteView.as_view()),

    # Query Filter: Read, Update, Delete
    path('<hash>/update/filter/', QueryFilterView.as_view()),

    # Check if Query and QueryFilter Exist
    path('<hash>/check/', CheckQuery.as_view()),

    # Test
    path('test/', test.as_view()),

]