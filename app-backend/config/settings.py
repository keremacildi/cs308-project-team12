import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
# The parent.parent moves two levels up: (config -> app-backend)
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'replace-this-with-your-own-secret-key'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['127.0.0.1', 'localhost']

# Application definition
INSTALLED_APPS = [
    # Django's default apps for admin/auth/contenttypes/sessions/messages/static
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',

    # Third-party apps
    'corsheaders',

    # Your Django app
    'app_backend',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',  # Required by admin/auth
    'django.contrib.messages.middleware.MessageMiddleware',      # Required by admin/messages
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'app_backend.middleware.APIErrorMiddleware',
]

# Points to your project's root URL configuration file
ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        # If you have global templates outside of your apps, place them in a templates/ folder at BASE_DIR
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,  # Automatically look for templates in each installed app
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',  # Needed for admin
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Reference to your WSGI application
WSGI_APPLICATION = 'config.wsgi.application'

# Database configuration - default is SQLite for local dev
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization and timezone
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS settings
CORS_ALLOW_ALL_ORIGINS = True  # Only for development
CORS_ALLOW_CREDENTIALS = True

# Add these headers
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# CSRF settings
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
]

CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = False  # Set to True in production with HTTPS
CSRF_USE_SESSIONS = False
CSRF_COOKIE_HTTPONLY = False

# Session settings
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
SESSION_COOKIE_HTTPONLY = True
