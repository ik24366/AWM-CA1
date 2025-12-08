from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import FilterSet, CharFilter, NumberFilter

from .models import Business
from .serializers import BusinessGeoSerializer
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance

import requests
import xml.etree.ElementTree as ET


# ============ ADVANCED FILTERING (NEW FOR CA2) ============

class BusinessFilterSet(FilterSet):
    """Filter cafes by name, category, rating, price"""
    search = CharFilter(field_name='name', lookup_expr='icontains')
    category = CharFilter(field_name='category', lookup_expr='exact')
    min_rating = NumberFilter(field_name='rating', lookup_expr='gte')
    price_range = CharFilter(field_name='price_range', lookup_expr='exact')

    class Meta:
        model = Business
        fields = ['category', 'rating', 'price_range']


class BusinessViewSet(viewsets.ReadOnlyModelViewSet):
    """Advanced filtering viewset for cafes"""
    queryset = Business.objects.all()
    serializer_class = BusinessGeoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = BusinessFilterSet
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'rating']

    def get_queryset(self):
        """Apply proximity filter if lat/lng/radius provided"""
        queryset = super().get_queryset()
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        radius = self.request.query_params.get('radius', 1000)

        if lat and lng:
            try:
                user_location = Point(float(lng), float(lat), srid=4326)
                radius_m = float(radius)
                queryset = queryset.annotate(
                    distance=Distance('location', user_location)
                ).filter(
                    distance__lte=radius_m
                ).order_by('distance')
            except (ValueError, TypeError):
                pass

        return queryset


# ============ BASIC VIEWS ============

@api_view(['GET'])
def business_geojson_list(request):
    """Old endpoint: returns ALL businesses as GeoJSON"""
    businesses = Business.objects.all()
    serializer = BusinessGeoSerializer(businesses, many=True)
    return Response(serializer.data)


def map_view(request):
    """Renders map.html template"""
    return render(request, 'map.html')


# ============ LEGACY PROXIMITY ENDPOINT ============

@api_view(['GET'])
def search_by_proximity(request):
    lat_raw = request.GET.get('lat')
    lon_raw = request.GET.get('lon')
    radius_raw = request.GET.get('radius', '1000')

    if not lat_raw or not lon_raw:
        return Response({"error": "Latitude and Longitude required"}, status=400)

    try:
        lat = float(lat_raw)
        lon = float(lon_raw)
        radius = float(radius_raw)
    except ValueError:
        return Response({"error": "Invalid numeric parameters"}, status=400)

    user_location = Point(lon, lat, srid=4326)
    
    # Simple functional proximity search
    nearby = Business.objects.annotate(
        distance=Distance('location', user_location)
    ).filter(distance__lte=radius).order_by('distance')

    results = []
    for b in nearby:
        results.append({
            'name': b.name,
            'distance_m': b.distance.m,
            'latitude': b.location.y,
            'longitude': b.location.x
        })

    return Response({'results': results})


# ============ RECOMMENDATION ENDPOINT ============

@api_view(['GET'])
def recommend_businesses(request):
    # Implementing a simple recommendation placeholder to avoid import errors if referenced
    lat = request.GET.get('lat')
    lon = request.GET.get('lon')
    
    if not lat or not lon:
         return Response({"error": "Location required"}, status=400)
         
    return Response({"message": "Recommendation logic placeholder"})


# ============ IRISH RAIL INTEGRATION (DRF) ============

@api_view(['GET'])
def irish_rail_stations(request):
    """Proxy + parser for Irish Rail station XML."""
    url = "https://api.irishrail.ie/realtime/realtime.asmx/getAllStationsXML"
    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
    except requests.RequestException as e:
        return Response({"error": f"Irish Rail API error: {e}"}, status=502)

    try:
        root = ET.fromstring(r.content)
    except ET.ParseError:
        return Response({"error": "Failed to parse XML from Irish Rail"}, status=502)

    ns = {"ir": "http://api.irishrail.ie/realtime/"}
    stations = []
    for s in root.findall("ir:objStation", ns):
        name_el = s.find("ir:StationDesc", ns)
        code_el = s.find("ir:StationCode", ns)
        lat_el = s.find("ir:StationLatitude", ns)
        lon_el = s.find("ir:StationLongitude", ns)

        try:
            lat = float(lat_el.text)
            lon = float(lon_el.text)
        except (TypeError, ValueError, AttributeError):
            continue

        stations.append({
            "name": name_el.text if name_el is not None else "",
            "code": code_el.text if code_el is not None else "",
            "latitude": lat,
            "longitude": lon,
        })

    return Response({"stations": stations})


@api_view(['GET'])
def irish_rail_realtime(request, station_code):
    """Fetch real-time train data for a given station code."""
    if not station_code:
        return Response({"error": "Missing station_code"}, status=400)

    url = f"http://api.irishrail.ie/realtime/realtime.asmx/getStationDataByCodeXML_WithNumMins?StationCode={station_code}&NumMins=90"
    
    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
    except requests.RequestException as e:
        return Response({"error": f"Irish Rail API error: {e}"}, status=502)

    try:
        root = ET.fromstring(r.content)
    except ET.ParseError:
        return Response({"error": "Failed to parse XML from Irish Rail"}, status=502)

    ns = {"ir": "http://api.irishrail.ie/realtime/"}
    trains = []
    for t in root.findall("ir:objStationData", ns):
        def get_text(elem, tag):
            node = elem.find(f"ir:{tag}", ns)
            return node.text if node is not None else ""

        trains.append({
            "Traincode": get_text(t, "Traincode"),
            "Stationfullname": get_text(t, "Stationfullname"),
            "Origin": get_text(t, "Origin"),
            "Destination": get_text(t, "Destination"),
            "Duein": get_text(t, "Duein"),
            "Late": get_text(t, "Late"),
            "Exparrival": get_text(t, "Exparrival"),
            "Expdepart": get_text(t, "Expdepart"),
            "Scharrival": get_text(t, "Scharrival"),
            "Schdepart": get_text(t, "Schdepart"),
            "Direction": get_text(t, "Direction"),
            "Traintype": get_text(t, "Traintype"),
            "Locationtype": get_text(t, "Locationtype"),
        })

    return Response({"trains": trains})


# ============ WEATHER API ============

@api_view(['GET'])
def met_eireann_forecast(request):
    """
    Proxy to Weather API (Open-Meteo).
    Usage: /api/weather/?lat=53.3&lon=-6.2
    """
    lat = request.GET.get('lat')
    lon = request.GET.get('lon') or request.GET.get('long')

    if not lat or not lon:
        return Response({"error": "Missing lat/lon parameters"}, status=400)

    # Using Open-Meteo as it provides simple JSON for coords
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current_weather": "true",
        "hourly": "weathercode",  # To match arrival time
        "timezone": "auto"
    }

    try:
        r = requests.get(url, params=params, timeout=10)
        r.raise_for_status()
        return Response(r.json())
    except requests.RequestException as e:
        return Response({"error": f"Weather API error: {e}"}, status=502)
    except ValueError:
        return Response({"error": "Invalid JSON from Weather API"}, status=502)