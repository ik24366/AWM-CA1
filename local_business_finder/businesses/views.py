from django.shortcuts import render

# Create your views here.
from rest_framework import generics


from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Business
from .serializers import BusinessGeoSerializer
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.http import JsonResponse


@api_view(['GET'])
def business_geojson_list(request):
    businesses = Business.objects.all()
    serializer = BusinessGeoSerializer(businesses, many=True)
    return Response(serializer.data)

def map_view(request):
    return render(request, 'map.html')  

# local_business_finder/views.py


def search_by_proximity(request):
    try:
        lat = float(request.GET.get('lat'))
        lon = float(request.GET.get('lon'))
        radius_meters = float(request.GET.get('radius', 1000))  # Default 1000m radius
    except (TypeError, ValueError):
        return JsonResponse({'error': 'Invalid or missing parameters'}, status=400)

    user_location = Point(lon, lat, srid=4326)
    nearby_businesses = Business.objects.annotate(
        distance=Distance('location', user_location)
    ).filter(distance__lte=radius_meters).order_by('distance')

    results = [
        {
            'id': business.id,
            'name': business.name,
            'category': business.category,
            'address': business.address,
            'phone_number': business.phone_number,
            'description': business.description,
            'latitude': business.location.y,
            'longitude': business.location.x,
            'distance_m': round(business.distance.m, 2),
        }
        for business in nearby_businesses
    ]

    return JsonResponse({'results': results})