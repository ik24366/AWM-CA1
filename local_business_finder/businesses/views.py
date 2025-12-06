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

from django.http import JsonResponse
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance

def search_by_proximity(request):
    # 1. Extract raw params
    lat_raw = request.GET.get('lat')
    lon_raw = request.GET.get('lon')
    radius_raw = request.GET.get('radius', '1000')

    errors = {}

    # 2. Validate presence
    if lat_raw is None:
        errors['lat'] = 'Latitude (lat) is required.'
    if lon_raw is None:
        errors['lon'] = 'Longitude (lon) is required.'

    # 3. Validate numeric + ranges
    try:
        lat = float(lat_raw) if lat_raw is not None else None
        if lat is not None and not (-90 <= lat <= 90):
            errors['lat'] = 'Latitude must be between -90 and 90.'
    except (TypeError, ValueError):
        errors['lat'] = 'Latitude must be a valid number.'

    try:
        lon = float(lon_raw) if lon_raw is not None else None
        if lon is not None and not (-180 <= lon <= 180):
            errors['lon'] = 'Longitude must be between -180 and 180.'
    except (TypeError, ValueError):
        errors['lon'] = 'Longitude must be a valid number.'

    try:
        radius_meters = float(radius_raw)
        if radius_meters <= 0 or radius_meters > 5000:
            errors['radius'] = 'Radius must be between 1 and 5000 meters.'
    except (TypeError, ValueError):
        errors['radius'] = 'Radius must be a valid number.'

    # 4. If any validation errors, return 400 JSON
    if errors:
        return JsonResponse(
            {
                'success': False,
                'errors': errors
            },
            status=400
        )

    # 5. Perform spatial query
    user_location = Point(lon, lat, srid=4326)

    nearby_businesses = (
        Business.objects
        .annotate(distance=Distance('location', user_location))
        .filter(distance__lte=radius_meters)
        .order_by('distance')
    )

    results = [
        {
            'id': b.id,
            'name': b.name,
            'category': b.category,
            'address': b.address,
            'phone_number': b.phone_number,
            'description': b.description,
            'latitude': b.location.y,
            'longitude': b.location.x,
            'distance_m': round(b.distance.m, 2),
        }
        for b in nearby_businesses
    ]

    return JsonResponse(
        {
            'success': True,
            'count': len(results),
            'results': results,
        }
    )
def recommend_businesses(request):
    lat_raw = request.GET.get('lat')
    lon_raw = request.GET.get('lon')
    category = request.GET.get('category')  # optional
    errors = {}

    # basic validation (simpler than proximity one)
    try:
        lat = float(lat_raw)
        lon = float(lon_raw)
    except (TypeError, ValueError):
        errors['location'] = 'Valid lat and lon are required for recommendations.'

    if errors:
        return JsonResponse({'success': False, 'errors': errors}, status=400)

    user_location = Point(lon, lat, srid=4326)

    qs = Business.objects.annotate(
        distance=Distance('location', user_location)
    )

    if category:
        qs = qs.filter(category__iexact=category)

    # scoring: closer + higher rating is better
    recommendations = []
    for b in qs:
        rating = float(b.rating) if b.rating is not None else 3.0
        distance_m = b.distance.m
        # simple score: rating minus distance penalty
        score = rating - (distance_m / 1000.0)  # 1 point per km
        recommendations.append((score, b, distance_m))

    # sort best first and take top 10
    recommendations.sort(key=lambda t: t[0], reverse=True)
    top = recommendations[:10]

    results = []
    price_str = getattr(b, 'price_range', '€€') or '€€'
    price_score = {'€': 1, '€€': 2, '€€€': 3}.get(price_str, 2)
    score = rating * 2 - (distance_m / 500.0) - price_score
    for score, b, distance_m in top:
        results.append({
            'id': b.id,
            'name': b.name,
            'category': b.category,
            'address': b.address,
            'rating': float(b.rating) if b.rating is not None else None,
            'price_level': price_str,
            'latitude': b.location.y,
            'longitude': b.location.x,
            'distance_m': round(distance_m, 1),
            'score': round(score, 2),
        })

    return JsonResponse({
        'success': True,
        'count': len(results),
        'results': results,
        })
