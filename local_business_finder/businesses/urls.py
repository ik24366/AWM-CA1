from django.urls import path
from .views import BusinessList
from businesses.views import business_geojson_list, map_view  
from . import views
from .views import BusinessList, search_by_proximity



urlpatterns = [
    path('businesses/', BusinessList.as_view(), name='business-list'),
    path('map/', map_view, name='map'),
    path('search/proximity/', views.search_by_proximity, name='search_by_proximity'),
    path('geojson/', views.business_geojson_list, name='business_geojson_list'),


]
