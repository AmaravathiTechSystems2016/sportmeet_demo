from django.urls import path
from . import views

urlpatterns = [
    path('', views.ReviewListView.as_view(), name='review_list'),
    path('admin/', views.AdminReviewListView.as_view(), name='admin_review_list'),
    path('create/', views.create_review, name='create_review'),
    path('<int:pk>/', views.ReviewDetailView.as_view(), name='review_detail'),
    path('venue/<int:venue_id>/', views.venue_reviews, name='venue_reviews'),
]
