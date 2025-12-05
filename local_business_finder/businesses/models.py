from django.db import models

# Create your models here.
from django.contrib.gis.db import models as geomodels

class Business(models.Model):
    name = models.CharField(max_length=50,
        choices=[
            ('cafe', 'Cafe'),
            ('bakery', 'Bakery'),
            ('tea_house', 'Tea House'),
            ('dessert', 'Dessert Bar'),
        ])
    category = models.CharField(max_length=50)
    location = geomodels.CharField(srid=4326)
    description = models.TextField(blank=True)
    address = models.CharField(max_length=200, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    rating = models.FloatField(default=0, help_text="1-5 stars")
    price_range = models.CharField(
        max_length=10,
        choices=[('€', '€'), ('€€', '€€'), ('€€€', '€€€')],
        default='€€'
    )
    tags = models.CharField(max_length=200, blank=True, help_text="e.g., vegan,wifi,study-friendly")

    def __str__(self):
        return self.name
