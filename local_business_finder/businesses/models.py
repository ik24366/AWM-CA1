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


class TrainLog(models.Model):
    """
    Log of historical train arrivals to calculate delay tendencies.
    """
    train_code = models.CharField(max_length=20)   # e.g. A123
    origin = models.CharField(max_length=50)       # e.g. CORK
    destination = models.CharField(max_length=50)  # e.g. HEUSTON
    minutes_late = models.IntegerField()           # e.g. 5
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.train_code} ({self.origin}->{self.destination}): {self.minutes_late}m late"
