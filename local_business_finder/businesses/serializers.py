from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import Business

class BusinessGeoSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Business
        geo_field = "location"  # Change if your PointField is called something else!
        fields = ('id', 'name', 'category', 'description', 'address', 'phone_number')
