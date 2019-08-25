from contraband.admin import admin_site as admin
from .models import Query, QueryFilter, QueryUser

admin.register(Query)
admin.register(QueryFilter)
admin.register(QueryUser)
