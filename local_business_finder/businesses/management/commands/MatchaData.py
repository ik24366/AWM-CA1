from django.core.management.base import BaseCommand
from businesses.models import Business
from django.contrib.gis.geos import Point

class Command(BaseCommand):
    help = 'Load sample matcha cafes data into database'

    def handle(self, *args, **kwargs):
        cafes = [
            {
                "name": "Aidan's Matcha Cafe",
                "category": "Cafe",
                "description": "A chill spot serving specialty matcha and homemade cakes",
                "address": "1A Matcha Lane, Dublin",
                "phone_number": "+353 1 234 5678",
                "location": Point(-6.2634, 53.3498),
            },
            {
                "name": "The Matcha Bar",
                "category": "Cafe",
                "description": "AT THE MATCHA BAR, we're serving up the real deal.",
                "address": "Powerscourt Townhouse Centre, 59 William St South, Dublin 2",
                "phone_number": "+353 1 234 5679",
                "location": Point(-6.2432, 53.3449),
            },
            {
                "name": "Maneki Tea Talk",
                "category": "Cafe",
                "description": "",
                "address": "14 Anne St S, Dublin 2",
                "phone_number": "(01) 598 7019",
                "location": Point(-6.2591, 53.3481),
            },
            {
                "name": "Matcha & Morsels",
                "category": "Cafe",
                "description": "Fresh matcha and delightful bites",
                "address": "42 Dawson St, Dublin",
                "phone_number": "+353 1 234 5680",
                "location": Point(-6.2644, 53.3407),
            },
            {
                "name": "Green Spoon",
                "category": "Cafe",
                "description": "Organic matcha and smoothies",
                "address": "21 South Great George's St, Dublin",
                "phone_number": "+353 1 234 5681",
                "location": Point(-6.2642, 53.3410),
            },
            {
                "name": "Matcha Moments",
                "category": "Cafe",
                "description": "Relax with quality matcha",
                "address": "35 Wexford St, Dublin",
                "phone_number": "+353 1 234 5682",
                "location": Point(-6.2537, 53.3354),
            },
            {
                "name": "Zen Matcha Lounge",
                "category": "Cafe",
                "description": "Quiet place for tea lovers",
                "address": "13 Camden St, Dublin",
                "phone_number": "+353 1 234 5683",
                "location": Point(-6.2670, 53.3377),
            },
            {
                "name": "Chillcha Cafe",
                "category": "Cafe",
                "description": "Trendy matcha spot",
                "address": "22 Parliament St, Dublin",
                "phone_number": "+353 1 234 5684",
                "location": Point(-6.2655, 53.3453),
            },
            {
                "name": "Matcha & Co.",
                "category": "Cafe",
                "description": "Fresh matcha and light meals",
                "address": "7 Wicklow St, Dublin",
                "phone_number": "+353 1 234 5685",
                "location": Point(-6.2607, 53.3422),
            },
            {
                "name": "Emerald Matcha",
                "category": "Cafe",
                "description": "Premium matcha drinks",
                "address": "50 Aungier St, Dublin",
                "phone_number": "+353 1 234 5686",
                "location": Point(-6.2600, 53.3370),
            },
        ]

        for cafe in cafes:
            Business.objects.create(**cafe)

        self.stdout.write(self.style.SUCCESS('Sample matcha cafes loaded into the database.'))
