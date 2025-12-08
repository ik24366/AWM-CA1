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
from django.http import JsonResponse


# ============ BASIC VIEWS (keep from CA1) ============

@api_view(['GET'])
def business_geojson_list(request):
    """Old endpoint: returns ALL businesses as GeoJSON"""
    businesses = Business.objects.all()
    serializer = BusinessGeoSerializer(businesses, many=True)
    return Response(serializer.data)


def map_view(request):
    """Renders map.html template"""
    return render(request, 'map.html')



# ============ IRISH RAIL INTEGRATION (DRF) ============

@api_view(['GET'])
def irish_rail_stations(request):
    """
    Proxy + parser for Irish Rail station XML.
    Returns simple JSON: [{name, code, lat, lon}, ...]
    """
    url = "https://api.irishrail.ie/realtime/realtime.asmx/getAllStationsXML"
    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
    except requests.RequestException as e:
        return Response({"error": f"Irish Rail API error: {e}"}, status=502)

    # Parse XML
    try:
        root = ET.fromstring(r.content)
    except ET.ParseError:
        return Response({"error": "Failed to parse XML from Irish Rail"}, status=502)

    # Namespace used in the XML
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
            continue  # skip stations with invalid coords (e.g. 0,0 or None)

        stations.append({
            "name": name_el.text if name_el is not None else "",
            "code": code_el.text if code_el is not None else "",
            "latitude": lat,
            "longitude": lon,
        })

    return Response({"stations": stations})


@api_view(['GET'])
def irish_rail_realtime(request, station_code):
    """
    Fetch real-time train data for a given station code.
    """
    if not station_code:
        return Response({"error": "Missing station_code"}, status=400)

    url = f"http://api.irishrail.ie/realtime/realtime.asmx/getStationDataByCodeXML_WithNumMins?StationCode={station_code}&NumMins=90"
    
    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
    except requests.RequestException as e:
        return Response({"error": f"Irish Rail API error: {e}"}, status=502)

    # Parse XML
    try:
        root = ET.fromstring(r.content)
    except ET.ParseError:
        return Response({"error": "Failed to parse XML from Irish Rail"}, status=502)

    # Namespace
    ns = {"ir": "http://api.irishrail.ie/realtime/"}
    
    trains = []
    for t in root.findall("ir:objStationData", ns):
        # Helper to safely get text
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