from django.urls import path
from . import views

urlpatterns = [
    path('', views.UserListView.as_view(), name='user_list'),
    path('<int:pk>/', views.UserDetailView.as_view(), name='user_detail'),
    path('venue-owners/', views.VenueOwnerListView.as_view(), name='venue_owner_list'),
    path('venue-owners/<int:pk>/', views.VenueOwnerDetailView.as_view(), name='venue_owner_detail'),
    path('stats/', views.user_stats, name='user_stats'),
]
