from django.urls import path, include
from . import views
from .views import BusinessViewSet
from rest_framework.routers import SimpleRouter

router = SimpleRouter()
router.register(r'cafes/advanced', BusinessViewSet, basename='cafe-advanced')
router.register(r'businesses', BusinessViewSet, basename='businesses')

urlpatterns = [
    path('weather/', views.met_eireann_forecast, name='met_eireann_forecast'),
    path('search/proximity/', views.search_by_proximity, name='search_by_proximity'),
    path('geojson/', views.business_geojson_list, name='business_geojson_list'),
    path("irish-rail-stations/", views.irish_rail_stations, name="irish_rail_stations"),
    path("irish-rail-realtime/<str:station_code>/", views.irish_rail_realtime, name="irish_rail_realtime"),
    path('', include(router.urls)),
]
