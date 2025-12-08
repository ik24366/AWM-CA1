from django.urls import path
from . import views

urlpatterns = [
    path('geojson/', views.business_geojson_list, name='business_geojson_list'),
    path("irish-rail-stations/", views.irish_rail_stations, name="irish_rail_stations"),
    path("irish-rail-realtime/<str:station_code>/", views.irish_rail_realtime, name="irish_rail_realtime"),
]
