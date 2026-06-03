from django.contrib import admin
from .sports_models import Sport, CourtType, Amenity


@admin.register(Sport)
class SportAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'color', 'is_active', 'sort_order', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['is_active', 'sort_order', 'color']
    ordering = ['sort_order', 'name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description', 'is_active', 'sort_order')
        }),
        ('Visual', {
            'fields': ('icon', 'image', 'color')
        }),
        ('Court Specifications', {
            'fields': ('min_court_length', 'max_court_length', 'min_court_width', 'max_court_width'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CourtType)
class CourtTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'sport', 'surface_type', 'is_indoor', 'is_active', 'sort_order']
    list_filter = ['sport', 'is_indoor', 'is_active', 'surface_type']
    search_fields = ['name', 'description', 'sport__name']
    list_editable = ['is_active', 'sort_order']
    ordering = ['sport', 'sort_order', 'name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('sport', 'name', 'description', 'is_active', 'sort_order')
        }),
        ('Physical Specifications', {
            'fields': ('length', 'width', 'surface_type', 'is_indoor')
        }),
    )


@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'category', 'is_active', 'sort_order']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['is_active', 'sort_order']
    ordering = ['category', 'sort_order', 'name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description', 'category', 'is_active', 'sort_order')
        }),
        ('Visual', {
            'fields': ('icon',)
        }),
    )
