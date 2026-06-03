from django.urls import path
from . import views, admin_views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('stats/', views.platform_stats, name='platform_stats'),
    path('site-settings/', views.site_settings, name='site_settings'),
    path('branding/update/', views.update_branding, name='update_branding'),
    path('slider-images/', views.slider_images, name='slider_images'),
    path('slider-images/public/', views.slider_images_public, name='slider_images_public'),
    path('slider-images/<int:pk>/', views.slider_image_detail, name='slider_image_detail'),
    
    # Admin dashboard endpoints
    path('admin/dashboard-stats/', admin_views.admin_dashboard_stats, name='admin_dashboard_stats'),
    path('admin/recent-activity/', admin_views.admin_recent_activity, name='admin_recent_activity'),
    path('admin/top-venues/', admin_views.admin_top_venues, name='admin_top_venues'),
]
