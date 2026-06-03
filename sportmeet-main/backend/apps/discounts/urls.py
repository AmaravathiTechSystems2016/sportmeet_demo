from django.urls import path
from . import views

urlpatterns = [
    # Admin endpoints
    path('', views.DiscountListView.as_view(), name='discount_list'),
    path('<int:pk>/', views.DiscountDetailView.as_view(), name='discount_detail'),
    path('usage/', views.DiscountUsageListView.as_view(), name='discount_usage_list'),
    path('stats/', views.discount_stats, name='discount_stats'),
    
    # User endpoints
    path('validate/', views.validate_discount, name='validate_discount'),
    path('apply/', views.apply_discount, name='apply_discount'),
    path('user-discounts/', views.user_discounts, name='user_discounts'),
]