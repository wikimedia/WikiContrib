from django.contrib import admin
from .models import Query, QueryFilter, QueryUser

admin.site.register(Query)
admin.site.register(QueryFilter)
admin.site.register(QueryUser)
