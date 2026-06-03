from django.urls import path
from . import views

urlpatterns = [
    path('', views.ReportListView.as_view(), name='report_list'),
    path('dashboard/', views.dashboard_stats, name='dashboard_stats'),
    path('venue-analytics/', views.venue_analytics, name='venue_analytics'),
    path('booking-analytics/', views.booking_analytics, name='booking_analytics'),
    path('revenue-report/', views.revenue_report, name='revenue_report'),
    path('user-activity/', views.user_activity_report, name='user_activity_report'),
    path('<int:pk>/', views.ReportDetailView.as_view(), name='report_detail'),
    path('<int:pk>/generate/', views.generate_report, name='generate_report'),
]
