from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Count
from apps.accounts.models import User
from apps.venues.models import Venue
from apps.bookings.models import Booking
from apps.events.models import Event
from .models import SiteSettings, HomeSliderImage
from apps.accounts.serializers import UserSerializer


def get_site_settings() -> SiteSettings:
    obj = SiteSettings.objects.first()
    if obj is None:
        obj = SiteSettings.objects.create()
    return obj


def build_absolute_url(request, file_field):
    """Build absolute URL for file field, works with DRF Request objects."""
    if not file_field:
        return None
    return f'{request.scheme}://{request.get_host()}{file_field.url}'


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint."""
    return Response({'status': 'healthy', 'message': 'SportMeet API is running'})


@api_view(['GET'])
@permission_classes([AllowAny])
def platform_stats(request):
    """Get platform statistics."""
    stats = {
        'total_users': User.objects.count(),
        'total_venues': Venue.objects.filter(status='approved').count(),
        'total_bookings': Booking.objects.count(),
        'total_events': Event.objects.filter(status='published').count(),
    }
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([AllowAny])
def site_settings(request):
    settings = get_site_settings()
    data = {
        'site_name': settings.site_name,
        'site_description': settings.site_description,
        'contact_email': settings.contact_email,
        'contact_phone': settings.contact_phone,
        'address': settings.address,
        'currency': settings.currency,
        'timezone': settings.timezone,
        'logo_main': build_absolute_url(request, settings.logo_main),
        'logo_admin': build_absolute_url(request, settings.logo_admin),
        'logo_auth': build_absolute_url(request, settings.logo_auth),
        'who_we_are_image': build_absolute_url(request, settings.who_we_are_image),
        'faqs': settings.faqs,
        'terms': settings.terms,
        'privacy': settings.privacy,
        'cookies': settings.cookies,
        'support': settings.support,
        'facebook_url': settings.facebook_url,
        'twitter_url': settings.twitter_url,
        'instagram_url': settings.instagram_url,
        'linkedin_url': settings.linkedin_url,
    }
    return Response(data)


@api_view(['PUT'])
@permission_classes([permissions.IsAdminUser])
@parser_classes([MultiPartParser, FormParser])
def update_branding(request):
    try:
        settings = get_site_settings()
        # Update text fields if present
        for field in ['site_name', 'site_description', 'faqs', 'terms', 'privacy', 'cookies', 'support', 'facebook_url', 'twitter_url', 'instagram_url', 'linkedin_url']:
            if field in request.data and request.data.get(field) is not None:
                setattr(settings, field, request.data.get(field))

        # Update logos only from actual uploaded files
        for field in ['logo_main', 'logo_admin', 'logo_auth', 'who_we_are_image']:
            if field in request.FILES:
                setattr(settings, field, request.FILES[field])

        settings.save()
        # Return updated settings data directly instead of calling site_settings
        data = {
            'site_name': settings.site_name,
            'site_description': settings.site_description,
            'contact_email': settings.contact_email,
            'contact_phone': settings.contact_phone,
            'address': settings.address,
            'currency': settings.currency,
            'timezone': settings.timezone,
            'logo_main': build_absolute_url(request, settings.logo_main),
            'logo_admin': build_absolute_url(request, settings.logo_admin),
            'logo_auth': build_absolute_url(request, settings.logo_auth),
            'who_we_are_image': build_absolute_url(request, settings.who_we_are_image),
            'faqs': settings.faqs,
            'terms': settings.terms,
            'privacy': settings.privacy,
            'cookies': settings.cookies,
            'support': settings.support,
            'facebook_url': settings.facebook_url,
            'twitter_url': settings.twitter_url,
            'instagram_url': settings.instagram_url,
            'linkedin_url': settings.linkedin_url,
        }
        return Response(data)
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAdminUser])
@parser_classes([MultiPartParser, FormParser])
def slider_images(request):
    if request.method == 'GET':
        items = HomeSliderImage.objects.order_by('order')
        data = [
            {
                'id': i.id,
                'title': i.title,
                'subtitle': i.subtitle,
                'image': build_absolute_url(request, i.image),
                'cta_text': i.cta_text,
                'cta_url': i.cta_url,
                'order': i.order,
                'is_active': i.is_active,
            }
            for i in items
        ]
        return Response(data)

    # POST create
    image = request.data.get('image')
    if not image:
        return Response({'error': 'image is required'}, status=status.HTTP_400_BAD_REQUEST)
    item = HomeSliderImage.objects.create(
        title=request.data.get('title', ''),
        subtitle=request.data.get('subtitle', ''),
        image=image,
        cta_text=request.data.get('cta_text', ''),
        cta_url=request.data.get('cta_url', ''),
        order=int(request.data.get('order', 0)),
        is_active=request.data.get('is_active', 'true') in ['true', '1', True],
    )
    return Response({'id': item.id}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def slider_images_public(request):
    items = HomeSliderImage.objects.filter(is_active=True).order_by('order')
    data = [
        {
            'id': i.id,
            'title': i.title,
            'subtitle': i.subtitle,
            'image': build_absolute_url(request, i.image),
            'cta_text': i.cta_text,
            'cta_url': i.cta_url,
            'order': i.order,
        }
        for i in items
    ]
    return Response(data)


@api_view(['PUT', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAdminUser])
@parser_classes([MultiPartParser, FormParser])
def slider_image_detail(request, pk: int):
    try:
        item = HomeSliderImage.objects.get(pk=pk)
    except HomeSliderImage.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method in ['PUT', 'PATCH']:
        for field in ['title', 'subtitle', 'cta_text', 'cta_url', 'order']:
            if field in request.data:
                setattr(item, field, request.data.get(field))
        if 'is_active' in request.data:
            item.is_active = request.data.get('is_active') in ['true', '1', True]
        if 'image' in request.data:
            item.image = request.data.get('image')
        item.save()
        return Response({'status': 'updated'})

    # DELETE
    item.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
