from django.urls import path, include
#from .views import BusinessList
from businesses.views import business_geojson_list, map_view  
from . import views
#from .views import BusinessList
from .views import search_by_proximity, business_geojson_list, map_view
from rest_framework.routers import SimpleRouter
from .views import BusinessViewSet, map_view, search_by_proximity, business_geojson_list


router = SimpleRouter()
router.register(r'cafes/advanced', BusinessViewSet, basename='cafe-advanced')

urlpatterns = [
    #path('businesses/', BusinessList.as_view(), name='business-list'),
    path('map/', map_view, name='map'),
    path('search/proximity/', views.search_by_proximity, name='search_by_proximity'),
    path('search/recommend/', views.recommend_businesses, name='recommend_businesses'),
    path('geojson/', views.business_geojson_list, name='business_geojson_list'),
    path('', include(router.urls)),
    path("api/irish-rail-stations/", views.irish_rail_stations, name="irish_rail_stations"),
    path("api/irish-rail-realtime/<str:station_code>/", views.irish_rail_realtime, name="irish_rail_realtime"),



]
