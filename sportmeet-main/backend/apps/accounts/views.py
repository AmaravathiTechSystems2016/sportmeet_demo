from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from django.contrib.auth.hashers import check_password
from .models import User, UserProfile, VenueOwnerProfile, TrainerProfile
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserSerializer,
    UserProfileSerializer, VenueOwnerProfileSerializer, TrainerProfileSerializer,
    PasswordChangeSerializer
)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    """User registration endpoint."""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Force venue_owner type when requested from UI
        try:
            requested_type = request.data.get('user_type')
            if requested_type == 'venue_owner' and user.user_type != 'venue_owner':
                user.user_type = 'venue_owner'
                user.save(update_fields=['user_type', 'updated_at'])
        except Exception:
            pass
        # Create user profile
        UserProfile.objects.create(user=user)
        
        # Create specific profile based on user type
        if user.user_type == 'venue_owner':
            # Defer full business details; ensure profile record exists with minimal fields
            VenueOwnerProfile.objects.get_or_create(
                user=user,
                defaults={
                    'business_name': f"{user.full_name or user.email}",
                    'business_address': '',
                }
            )
        elif user.user_type == 'trainer':
            TrainerProfile.objects.create(user=user)
        
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """User login endpoint."""
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """User logout endpoint."""
    try:
        request.user.auth_token.delete()
    except:
        pass
    logout(request)
    return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile(request):
    """Get current user profile."""
    user = request.user
    user_data = UserSerializer(user).data
    
    # Get specific profile based on user type
    profile_data = None
    if user.user_type == 'venue_owner' and hasattr(user, 'venue_owner_profile'):
        profile_data = VenueOwnerProfileSerializer(user.venue_owner_profile).data
    elif user.user_type == 'trainer' and hasattr(user, 'trainer_profile'):
        profile_data = TrainerProfileSerializer(user.trainer_profile).data
    elif hasattr(user, 'profile'):
        profile_data = UserProfileSerializer(user.profile).data
    
    return Response({
        'user': user_data,
        'profile': profile_data
    })


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_profile(request):
    """Update user profile."""
    user = request.user
    user_serializer = UserSerializer(user, data=request.data, partial=True)
    
    if user_serializer.is_valid():
        user_serializer.save()
        
        # Update specific profile if data provided
        if user.user_type == 'venue_owner' and hasattr(user, 'venue_owner_profile'):
            profile_serializer = VenueOwnerProfileSerializer(
                user.venue_owner_profile, 
                data=request.data, 
                partial=True
            )
        elif user.user_type == 'trainer' and hasattr(user, 'trainer_profile'):
            profile_serializer = TrainerProfileSerializer(
                user.trainer_profile, 
                data=request.data, 
                partial=True
            )
        elif hasattr(user, 'profile'):
            profile_serializer = UserProfileSerializer(
                user.profile, 
                data=request.data, 
                partial=True
            )
        else:
            profile_serializer = None
        
        if profile_serializer and profile_serializer.is_valid():
            profile_serializer.save()
        
        return Response({
            'user': UserSerializer(user).data,
            'message': 'Profile updated successfully'
        })
    
    return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Change user password."""
    serializer = PasswordChangeSerializer(data=request.data)
    if serializer.is_valid():
        user = request.user
        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']
        
        if not check_password(old_password, user.password):
            return Response(
                {'error': 'Old password is incorrect'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password changed successfully'})
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserListView(generics.ListAPIView):
    """List all users (admin only)."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['user_type', 'is_verified', 'city', 'state']
    search_fields = ['first_name', 'last_name', 'email', 'username']


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a user (admin only)."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]
