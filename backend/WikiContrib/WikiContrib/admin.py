from django.contrib.admin import AdminSite
from django.utils.translation import ugettext_lazy as _
from django.contrib.auth.models import User, Group


# Create a Custom Site.
class CustomAdminSite(AdminSite):
    site_header = _('WikiContrib')


admin_site = CustomAdminSite()

# Register Auth models
admin_site.register(User)
admin_site.register(Group)


