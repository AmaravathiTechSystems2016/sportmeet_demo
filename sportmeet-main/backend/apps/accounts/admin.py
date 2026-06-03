from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile, VenueOwnerProfile, TrainerProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model."""
    
    list_display = ('email', 'username', 'first_name', 'last_name', 'user_type', 'is_verified', 'is_active', 'created_at')
    list_filter = ('user_type', 'is_verified', 'is_active', 'is_staff', 'created_at')
    search_fields = ('email', 'username', 'first_name', 'last_name', 'phone_number')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone_number', 'date_of_birth', 'profile_picture')}),
        ('Location', {'fields': ('address', 'city', 'state', 'postcode', 'country')}),
        ('Account Type', {'fields': ('user_type', 'is_verified')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'first_name', 'last_name', 'user_type', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'date_joined', 'last_login')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Admin configuration for UserProfile model."""
    
    list_display = ('user', 'skill_level', 'created_at')
    list_filter = ('skill_level', 'created_at')
    search_fields = ('user__first_name', 'user__last_name', 'user__email')
    raw_id_fields = ('user',)


@admin.register(VenueOwnerProfile)
class VenueOwnerProfileAdmin(admin.ModelAdmin):
    """Admin configuration for VenueOwnerProfile model."""
    
    list_display = ('business_name', 'user', 'is_verified', 'created_at')
    list_filter = ('is_verified', 'created_at')
    search_fields = ('business_name', 'user__first_name', 'user__last_name', 'user__email')
    raw_id_fields = ('user',)


@admin.register(TrainerProfile)
class TrainerProfileAdmin(admin.ModelAdmin):
    """Admin configuration for TrainerProfile model."""
    
    list_display = ('user', 'experience_years', 'hourly_rate', 'rating', 'is_verified', 'created_at')
    list_filter = ('is_verified', 'experience_years', 'created_at')
    search_fields = ('user__first_name', 'user__last_name', 'user__email')
    raw_id_fields = ('user',)
