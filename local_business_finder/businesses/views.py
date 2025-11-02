from django.shortcuts import render

# Create your views here.
from rest_framework import generics
from .models import Business
from .serializers import BusinessSerializer

class BusinessList(generics.ListAPIView):
    queryset = Business.objects.all()
    serializer_class = BusinessSerializer

# Optional: Add filtering, distance queries, etc. later for advanced features
def map_view(request):
    return render(request, 'map.html')  # Adjust path if needed