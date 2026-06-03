from django.urls import path
from . import views

urlpatterns = [
    path('', views.PaymentListView.as_view(), name='payment_list'),
    path('admin/', views.AdminPaymentListView.as_view(), name='admin_payment_list'),
    path('admin/stats/', views.admin_payment_stats, name='admin_payment_stats'),
    path('<int:pk>/', views.PaymentDetailView.as_view(), name='payment_detail'),
    path('create-intent/', views.create_payment_intent, name='create_payment_intent'),
    path('confirm/', views.confirm_payment, name='confirm_payment'),
    path('<int:payment_id>/refund/', views.create_refund, name='create_refund'),
    path('webhook/', views.payment_webhook, name='payment_webhook'),
    path('methods/', views.payment_methods, name='payment_methods'),
    path('setup-method/', views.setup_payment_method, name='setup_payment_method'),
]
