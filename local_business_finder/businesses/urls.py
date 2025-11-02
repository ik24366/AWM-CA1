from django.urls import path
from .views import BusinessList

urlpatterns = [
    path('businesses/', BusinessList.as_view(), name='business-list'),
]
