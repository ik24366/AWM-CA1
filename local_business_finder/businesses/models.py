from django.db import models
from django.contrib.gis.db import models as geomodels


class Business(models.Model):
    # Free-text business name
    name = models.CharField(max_length=100)

    # Category with fixed choices
    category = models.CharField(
        max_length=50,
        choices=[
            ('cafe', 'Cafe'),
            ('bakery', 'Bakery'),
            ('tea_house', 'Tea House'),
            ('dessert', 'Dessert Bar'),
        ]
    )

    # Spatial location (PostGIS)
    location = geomodels.PointField(srid=4326)

    # Optional descriptive fields
    description = models.TextField(blank=True)
    address = models.CharField(max_length=200, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)

    # Fields used by the recommendation engine
    rating = models.FloatField(
        default=0,
        help_text="Average rating from 1.0 to 5.0"
    )
    price_range = models.CharField(
        max_length=10,
        choices=[('€', '€'), ('€€', '€€'), ('€€€', '€€€')],
        default='€€'
    )
    tags = models.CharField(
        max_length=200,
        blank=True,
        help_text="Comma-separated traits, e.g. vegan,wifi,study-friendly"
    )

    def __str__(self):
        return self.name
