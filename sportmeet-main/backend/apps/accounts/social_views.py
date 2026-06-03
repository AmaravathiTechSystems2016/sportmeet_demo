from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from rest_framework.authtoken.models import Token
from allauth.socialaccount.models import SocialAccount
from allauth.socialaccount.providers.facebook.views import FacebookOAuth2Adapter
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from allauth.socialaccount.providers.oauth2.views import OAuth2LoginView, OAuth2CallbackView
from django.conf import settings
import requests
import json

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def facebook_login(request):
    """Handle Facebook OAuth login."""
    try:
        access_token = request.data.get('access_token')
        if not access_token:
            return Response({
                'error': 'Access token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify the access token with Facebook
        facebook_url = f"https://graph.facebook.com/me?access_token={access_token}&fields=id,name,email,first_name,last_name"
        response = requests.get(facebook_url)
        
        if response.status_code != 200:
            return Response({
                'error': 'Invalid Facebook access token'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user_data = response.json()
        
        # Get or create user
        user, created = User.objects.get_or_create(
            email=user_data.get('email'),
            defaults={
                'first_name': user_data.get('first_name', ''),
                'last_name': user_data.get('last_name', ''),
                'is_active': True,
            }
        )
        
        if created:
            user.set_unusable_password()
            user.save()
        
        # Create or get token
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
            },
            'created': created
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    """Handle Google OAuth login."""
    try:
        access_token = request.data.get('access_token')
        credential = request.data.get('credential')  # JWT credential from Google Identity Services
        
        if not access_token and not credential:
            return Response({
                'error': 'Access token or credential is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user_data = None
        
        if credential:
            # Handle JWT credential from Google Identity Services
            try:
                import base64
                import json
                
                # Decode JWT payload (middle part)
                parts = credential.split('.')
                if len(parts) != 3:
                    raise ValueError("Invalid JWT format")
                
                # Decode the payload
                payload = parts[1]
                # Add padding if needed
                payload += '=' * (4 - len(payload) % 4)
                decoded_payload = base64.urlsafe_b64decode(payload)
                user_data = json.loads(decoded_payload)
                
                # Verify the token is from Google (basic check)
                if user_data.get('iss') != 'https://accounts.google.com':
                    return Response({
                        'error': 'Invalid token issuer'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Map Google JWT fields to our expected format
                user_data = {
                    'email': user_data.get('email'),
                    'given_name': user_data.get('given_name', ''),
                    'family_name': user_data.get('family_name', ''),
                    'name': user_data.get('name', ''),
                }
                
            except Exception as e:
                return Response({
                    'error': f'Invalid credential format: {str(e)}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        elif access_token:
            # Handle traditional access token
            google_url = f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}"
            response = requests.get(google_url)
            
            if response.status_code != 200:
                return Response({
                    'error': 'Invalid Google access token'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user_data = response.json()
        
        if not user_data or not user_data.get('email'):
            return Response({
                'error': 'No valid user data received from Google'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create user
        user, created = User.objects.get_or_create(
            email=user_data.get('email'),
            defaults={
                'first_name': user_data.get('given_name', ''),
                'last_name': user_data.get('family_name', ''),
                'is_active': True,
            }
        )
        
        if created:
            user.set_unusable_password()
            user.save()
        
        # Create or get token
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
            },
            'created': created
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def social_providers(request):
    """Get available social providers and their configuration."""
    from apps.core.models import SocialMediaKeys
    
    providers = []
    social_keys = SocialMediaKeys.objects.filter(is_active=True)
    
    for key in SocialMediaKeys.objects.all():
        providers.append({
            'provider': key.provider,
            'name': key.get_provider_display(),
            'client_id': key.client_id or '',
            # Do NOT expose client_secret
            'is_active': key.is_active,
            'is_configured': bool(key.client_id and key.client_secret),
        })
    
    return Response({
        'providers': providers
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def social_login_urls(request):
    """Get social login URLs for frontend."""
    from apps.core.models import SocialMediaKeys
    
    urls = {}
    social_keys = SocialMediaKeys.objects.filter(is_active=True)
    frontend_base = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000').rstrip('/')
    
    for key in social_keys:
        if key.provider == 'facebook':
            urls['facebook'] = (
                f"https://www.facebook.com/v7.0/dialog/oauth?client_id={key.client_id}"
                f"&redirect_uri={frontend_base}/auth/facebook/callback&scope=email,public_profile"
            )
        elif key.provider == 'google':
            urls['google'] = (
                f"https://accounts.google.com/o/oauth2/v2/auth?client_id={key.client_id}"
                f"&redirect_uri={frontend_base}/auth/google/callback&scope=email%20profile&response_type=code&access_type=offline"
            )
    
    return Response({
        'urls': urls
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_social_keys(request):
    """Update social media keys (admin only)."""
    try:
        from apps.core.models import SocialMediaKeys
        
        if not request.user.is_staff:
            return Response({
                'error': 'Permission denied. Admin access required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        
        # Update Facebook keys
        if 'facebook' in data:
            facebook_data = data['facebook']
            facebook_keys, created = SocialMediaKeys.objects.get_or_create(
                provider='facebook',
                defaults={
                    'client_id': facebook_data.get('client_id') or facebook_data.get('app_id', ''),
                    'client_secret': facebook_data.get('client_secret') or facebook_data.get('app_secret', ''),
                    'is_active': bool(facebook_data.get('is_active', False)),
                    'created_by': request.user,
                }
            )
            if not created:
                facebook_keys.client_id = facebook_data.get('client_id', facebook_keys.client_id)
                if facebook_data.get('client_secret'):
                    facebook_keys.client_secret = facebook_data.get('client_secret')
                facebook_keys.is_active = bool(facebook_data.get('is_active', facebook_keys.is_active))
                facebook_keys.save()
        
        # Update Google keys
        if 'google' in data:
            google_data = data['google']
            google_keys, created = SocialMediaKeys.objects.get_or_create(
                provider='google',
                defaults={
                    'client_id': google_data.get('client_id', ''),
                    'client_secret': google_data.get('client_secret', ''),
                    'is_active': bool(google_data.get('is_active', False)),
                    'created_by': request.user,
                }
            )
            if not created:
                google_keys.client_id = google_data.get('client_id', google_keys.client_id)
                if google_data.get('client_secret'):
                    google_keys.client_secret = google_data.get('client_secret')
                google_keys.is_active = bool(google_data.get('is_active', google_keys.is_active))
                google_keys.save()
        
        return Response({
            'message': 'Social media keys updated successfully'
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
