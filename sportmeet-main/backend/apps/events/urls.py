from django.urls import path
from . import views

urlpatterns = [
    path('', views.EventListView.as_view(), name='event_list'),
    path('admin/', views.AdminEventListView.as_view(), name='admin_event_list'),
    path('my-events/', views.UserEventsView.as_view(), name='user_events'),
    path('my-participations/', views.UserParticipationsView.as_view(), name='user_participations'),
    path('stats/', views.event_stats, name='event_stats'),
    path('<int:pk>/', views.EventDetailView.as_view(), name='event_detail'),
    path('<int:event_id>/register/', views.register_event, name='register_event'),
    path('<int:event_id>/unregister/', views.unregister_event, name='unregister_event'),
    path('<int:event_id>/comment/', views.add_comment, name='add_comment'),
    path('bookings/', views.EventBookingsView.as_view(), name='event_bookings'),
]
