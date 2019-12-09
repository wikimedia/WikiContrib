"""
Django settings for WikiContrib project

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
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": "travis_db",
        "USER": "travis",
        "PASSWORD": "",
        "HOST": "127.0.0.1",
    }
}