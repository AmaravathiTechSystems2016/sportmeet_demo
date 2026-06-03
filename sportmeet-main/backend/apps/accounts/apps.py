from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'

    def ready(self):
        # Import signals
        from . import signals  # noqa: F401
    verbose_name = 'User Accounts'
