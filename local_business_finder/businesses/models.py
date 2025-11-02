from django.db import models

# Create your models here.
from django.contrib.gis.db import models

class Business(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50)
    location = models.PointField()
    description = models.TextField(blank=True)
    address = models.CharField(max_length=200, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.name
