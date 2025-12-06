from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Business

admin.site.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'rating', 'price_range')
    list_filter = ('category', 'price_range', 'rating')
    search_fields = ('name', 'address', 'tags')