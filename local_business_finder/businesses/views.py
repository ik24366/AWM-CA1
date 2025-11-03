from django.shortcuts import render

# Create your views here.
from rest_framework import generics


from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Business
from .serializers import BusinessGeoSerializer



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
        radius_meters = float(request.GET.get('radius', 1000))  # default radius 1000 meters
    except (TypeError, ValueError):
        return JsonResponse({'error': 'Invalid or missing parameters'}, status=400)

    user_location = Point(lon, lat, srid=4326)
    nearby_businesses = Business.objects.annotate(
        distance=Distance('location', user_location)
    ).filter(distance__lte=radius_meters).order_by('distance')

    results = [
        {
            'id': b.id,
            'name': b.name,
            'distance_m': b.distance.m
        }
        for b in nearby_businesses
    ]

    return JsonResponse(results, safe=False)
