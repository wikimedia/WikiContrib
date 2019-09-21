"""
Django settings for contraband project

"""

import os
import environ

env = environ.Env()
environ.Env.read_env()

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

DEBUG = True
ALLOWED_HOSTS = []
# STATIC_URL = '/static/'
BASE_URL = env('BASE_URL_LOCAL')

DATABASES = {
    'default': {
        'ENGINE': env('ENGINE_LOCAL'),
        'NAME': os.path.join(BASE_DIR, env('DB_NAME_LOCAL')),
    }
}
