from django import forms
from django.contrib.auth import admin as auth_admin
from django.contrib.auth import forms as auth_forms
from django.contrib.admin import AdminSite
from django.utils.translation import ugettext_lazy as _
from django.contrib.auth.models import User, Group


# Create a Custom Site.
class CustomAdminSite(AdminSite):
    site_header = _('WikiContrib')


admin_site = CustomAdminSite()

# Register Auth models
admin_site.register(Group)

class UserChangeForm(forms.ModelForm):
    """
    Replicate the form shown when the user model supplied by Django is not
    replaced with our own by copying most of the code
    """

    password = auth_forms.ReadOnlyPasswordHashField(
        help_text="Raw passwords are not stored, so there is no way to see "
                  "this user's password, but you can change the password "
                  "using <a href=\"../password/\">this form</a>.",
    )

    class Meta:
        """
        Meta class for UserChangeForm
        """

        model = User
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super(UserChangeForm, self).__init__(*args, **kwargs)
        f = self.fields.get('user_permissions', None)
        if f is not None:
            f.queryset = f.queryset.select_related('content_type')

    def clean_password(self):
        return self.initial["password"]


class UserAdmin(auth_admin.UserAdmin):
    """
    Customize the presentation of the model User
    """

    form = UserChangeForm

    fieldsets = (
        ('Authentication', {
            'fields': (
                'username',
                'password',
            )
        }),
        ('Important dates', {
            'fields': (
                'last_login',
                'date_joined'
            )
        }),
        ('Permissions', {
            'fields': (
                'is_superuser',
                'groups',
                'user_permissions',
            )
        }),
        ('Information', {
            'fields': (
                'first_name',
                'last_name',
                'email'
            )
        })
    )

    list_display = (
        'username',
        'last_login',
        'is_superuser',
    )
    list_filter = tuple()

    search_fields = ['id', 'username' ]

admin_site.register(User, UserAdmin)