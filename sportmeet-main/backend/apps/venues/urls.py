from django.urls import path
from . import views

urlpatterns = [
    path('', views.VenueListView.as_view(), name='venue_list'),
    path('admin/', views.AdminVenueListView.as_view(), name='admin_venue_list'),
    path('create/', views.create_venue, name='create_venue'),
    path('<int:venue_id>/update/', views.update_venue, name='update_venue'),
    path('search/', views.VenueSearchView.as_view(), name='venue_search'),
    path('nearby/', views.nearby_venues, name='nearby_venues'),
    path('stats/', views.venue_stats, name='venue_stats'),
    path('my-venues/', views.UserVenuesView.as_view(), name='user_venues'),
    path('bookings/', views.get_venue_bookings, name='venue_bookings'),
    path('sports/', views.get_sports, name='get_sports'),
    path('sports/create/', views.create_sport, name='create_sport'),
    path('sports/<int:sport_id>/update/', views.update_sport, name='update_sport'),
    path('sports/<int:sport_id>/delete/', views.delete_sport, name='delete_sport'),
    path('amenities/', views.get_amenities, name='get_amenities'),
    path('amenities/create/', views.create_amenity, name='create_amenity'),
    path('amenities/<int:amenity_id>/update/', views.update_amenity, name='update_amenity'),
    path('amenities/<int:amenity_id>/delete/', views.delete_amenity, name='delete_amenity'),
    path('<int:pk>/', views.VenueDetailView.as_view(), name='venue_detail'),
    path('<int:venue_id>/availability/', views.venue_availability, name='venue_availability'),
    path('<int:venue_id>/pricing/', views.venue_pricing, name='venue_pricing'),
]
