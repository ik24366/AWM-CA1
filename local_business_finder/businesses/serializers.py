from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import Business

class BusinessSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Business
        geo_field = "location"  # This connects to PointField for GeoJSON geometry
        fields = ('id', 'name', 'category', 'description', 'address', 'phone_number')
