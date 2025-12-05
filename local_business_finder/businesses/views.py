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


# ============ ADVANCED FILTERING (NEW FOR CA2) ============

class BusinessFilterSet(FilterSet):
    """Filter cafes by name, category, rating, price"""
    search = CharFilter(field_name='name', lookup_expr='icontains')  # Name search
    category = CharFilter(field_name='category', lookup_expr='exact')
    min_rating = NumberFilter(field_name='rating', lookup_expr='gte')
    price_range = CharFilter(field_name='price_range', lookup_expr='exact')

    class Meta:
        model = Business
        fields = ['category', 'rating', 'price_range']


class BusinessViewSet(viewsets.ReadOnlyModelViewSet):
    """Advanced filtering viewset for cafes
    
    Usage:
    /api/cafes/advanced/?search=aidan
    /api/cafes/advanced/?category=cafe&min_rating=4
    /api/cafes/advanced/?lat=53.35&lng=-6.26&radius=1000
    """
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


# ============ LEGACY PROXIMITY ENDPOINT (for backward compatibility) ============

def search_by_proximity(request):
    """Old endpoint: proximity search returning JSON (not GeoJSON)"""
    try:
        lat = float(request.GET.get('lat'))
        lon = float(request.GET.get('lon'))
        radius_meters = float(request.GET.get('radius', 1000))
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
