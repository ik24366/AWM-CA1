from django.urls import path
from .views import BusinessList
from businesses.views import business_geojson_list, map_view  



urlpatterns = [
    path('businesses/', BusinessList.as_view(), name='business-list'),
    path('map/', map_view, name='map'),

]
