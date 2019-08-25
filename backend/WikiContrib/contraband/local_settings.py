import os
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

DEBUG = True
ALLOWED_HOSTS = []
# STATIC_URL = '/static/'
BASE_URL = 'http://127.0.0.1:8000/'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}