from django.urls import path
from . import views
from . import social_views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile, name='profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('change-password/', views.change_password, name='change_password'),
    path('users/', views.UserListView.as_view(), name='user_list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user_detail'),
    
    # Social authentication
    path('social/facebook/', social_views.facebook_login, name='facebook_login'),
    path('social/google/', social_views.google_login, name='google_login'),
    path('social/providers/', social_views.social_providers, name='social_providers'),
    path('social/urls/', social_views.social_login_urls, name='social_login_urls'),
    path('social/update-keys/', social_views.update_social_keys, name='update_social_keys'),
]
