from django.contrib import admin
from WikiContrib.admin import admin_site
from .models import Query, QueryFilter, QueryUser

class QueryAdmin(admin.ModelAdmin):  
    """
    Customize the presentation of the model Query
    """

    fields = (
        'hash_code', 
        'file', 
        'csv_file', 
        'created_on'
    )
    list_display = (
        'hash_code',
        'file',
        'created_on'
    )
    readonly_fields = [
        'hash_code'
    ]

admin_site.register(Query, QueryAdmin)
admin_site.register(QueryFilter)
admin_site.register(QueryUser)
