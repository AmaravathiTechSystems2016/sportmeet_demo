from django.urls import path
from . import views

urlpatterns = [
    path('', views.BookingListView.as_view(), name='booking_list'),
    path('admin/', views.AdminBookingListView.as_view(), name='admin_booking_list'),
    path('admin/stats/', views.admin_booking_stats, name='admin_booking_stats'),
    path('my-bookings/', views.UserBookingsView.as_view(), name='user_bookings'),
    path('venue-bookings/', views.VenueBookingsView.as_view(), name='venue_bookings'),
    path('time-slots/', views.BookingTimeSlotListView.as_view(), name='booking_time_slots'),
    path('venue-booked-slots/', views.venue_booked_slots, name='venue_booked_slots'),
    path('stats/', views.booking_stats, name='booking_stats'),
    path('venue/<int:venue_id>/stats/', views.venue_booking_stats, name='venue_booking_stats'),
    path('<int:pk>/', views.BookingDetailView.as_view(), name='booking_detail'),
    path('<int:booking_id>/cancel/', views.cancel_booking, name='cancel_booking'),
    path('<int:booking_id>/review/', views.create_review, name='create_review'),
    path('<int:booking_id>/update-status/', views.update_booking_status, name='update_booking_status'),
    path('multi-court/', views.create_multi_court_booking, name='create_multi_court_booking'),
    path('guest-multi-court/', views.create_guest_multi_court_booking, name='create_guest_multi_court_booking'),
]
