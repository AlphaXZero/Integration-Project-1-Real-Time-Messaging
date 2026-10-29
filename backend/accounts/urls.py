from django.urls import path
from . import views

urlpatterns = [
    path("register/", views.register_view_api),
    path("me/", views.delete_account_view_api),
]
