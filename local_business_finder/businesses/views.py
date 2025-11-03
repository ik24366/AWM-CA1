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