from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, UserProfile, VenueOwnerProfile, TrainerProfile


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = (
            'email', 'first_name', 'last_name', 'phone_number',
            'user_type', 'date_of_birth', 'address', 'city', 'state',
            'postcode', 'password', 'password_confirm'
        )
        extra_kwargs = {
            'first_name': { 'required': True },
            'last_name': { 'required': True },
            'email': { 'required': True },
            'phone_number': { 'required': False, 'allow_blank': True },
            'date_of_birth': { 'required': False, 'allow_null': True },
            'address': { 'required': False, 'allow_blank': True },
            'city': { 'required': False, 'allow_blank': True },
            'state': { 'required': False, 'allow_blank': True },
            'postcode': { 'required': False, 'allow_blank': True },
            'user_type': { 'required': False },
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        # Default user_type to venue_owner when not provided by client on this path
        if not attrs.get('user_type'):
            attrs['user_type'] = 'venue_owner'
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        # Auto-generate username from email if not provided by client
        email = validated_data.get('email')
        base_username = (email.split('@')[0] if email else 'user').lower()
        username = base_username
        suffix = 1
        while User.objects.filter(username=username).exists():
            suffix += 1
            username = f"{base_username}{suffix}"
        validated_data['username'] = username
        # Ensure user_type defaults if missing
        if not validated_data.get('user_type'):
            validated_data['user_type'] = 'venue_owner'
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            # Try to authenticate with email first, then with username
            user = authenticate(username=email, password=password)
            if not user:
                # Try to find user by email and authenticate with username
                try:
                    user_obj = User.objects.get(email=email)
                    user = authenticate(username=user_obj.username, password=password)
                except User.DoesNotExist:
                    pass
            
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include email and password')
        
        return attrs


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user details."""
    
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'phone_number', 'user_type', 'profile_picture', 'date_of_birth',
            'address', 'city', 'state', 'postcode', 'country', 'is_verified',
            'is_staff', 'is_superuser', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile."""
    
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = (
            'id', 'user', 'bio', 'favorite_sports', 'skill_level',
            'availability', 'emergency_contact_name', 'emergency_contact_phone',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class VenueOwnerProfileSerializer(serializers.ModelSerializer):
    """Serializer for venue owner profile."""
    
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = VenueOwnerProfile
        fields = (
            'id', 'user', 'business_name', 'abn', 'business_address',
            'business_phone', 'business_email', 'business_description',
            'is_verified', 'verification_documents', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class TrainerProfileSerializer(serializers.ModelSerializer):
    """Serializer for trainer profile."""
    
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = TrainerProfile
        fields = (
            'id', 'user', 'specializations', 'certifications', 'experience_years',
            'hourly_rate', 'bio', 'is_verified', 'rating', 'total_reviews',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change."""
    
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    new_password_confirm = serializers.CharField()
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs
