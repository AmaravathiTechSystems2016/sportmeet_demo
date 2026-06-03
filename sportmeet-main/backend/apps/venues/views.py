from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
# from django_filters.rest_framework import DjangoFilterBackend
# from django_filters import rest_framework as django_filters
from django.db import connection
from django.db.models import Q, Avg, Count, Min
from django.utils.text import slugify
from .models import Venue, VenueAvailability, VenueImage, VenuePricing, Court
from .sports_models import Sport, Amenity
from .serializers import (
    VenueListSerializer, VenueDetailSerializer, VenueCreateUpdateSerializer,
    VenueSearchSerializer, VenueAvailabilitySerializer, VenuePricingSerializer
)


# class VenueFilter(django_filters.FilterSet):
#     """Custom filter for venues with JSONField support."""
#     
#     sport_category = django_filters.CharFilter(method='filter_sport_category')
#     min_price = django_filters.NumberFilter(method='filter_min_court_price')
#     max_price = django_filters.NumberFilter(method='filter_max_court_price')
#     status = django_filters.CharFilter(field_name='status')
#     
#     class Meta:
#         model = Venue
#         fields = ['city', 'state', 'is_verified', 'is_featured', 'status']
#     
#     def filter_sport_category(self, queryset, name, value):
#         """Filter by sport category in JSONField."""
#         if value:
#             return queryset.filter(sport_categories__contains=[value])
#         return queryset


class VenueListView(generics.ListCreateAPIView):
    """List all venues or create a new venue."""
    
    queryset = Venue.objects.all().select_related('owner')
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'address', 'city', 'state']
    ordering_fields = ['created_at', 'average_rating', 'name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter venues based on user permissions and status."""
        queryset = super().get_queryset()
        
        # For non-authenticated users or non-admin users, only show approved venues
        if not self.request.user.is_authenticated or not self.request.user.is_staff:
            queryset = queryset.filter(status='approved')
        elif self.request.query_params.get('status'):
            queryset = queryset.filter(status=self.request.query_params.get('status'))
        
        # Apply filters
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(address__icontains=search) |
                Q(city__icontains=search) |
                Q(state__icontains=search)
            )
        
        # Sport category filter
        sport_category = self.request.query_params.get('sport_category')
        if sport_category:
            if connection.vendor == 'sqlite':
                queryset = queryset.filter(sport_categories__icontains=sport_category)
            else:
                queryset = queryset.filter(sport_categories__contains=[sport_category])
        
        # Price range filter
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(courts__price_per_duration__gte=min_price)
        if max_price:
            queryset = queryset.filter(courts__price_per_duration__lte=max_price)
        if min_price or max_price:
            queryset = queryset.distinct()
        
        # Location-based filtering
        latitude = self.request.query_params.get('latitude')
        longitude = self.request.query_params.get('longitude')
        radius = self.request.query_params.get('radius', 10)
        
        if latitude and longitude:
            try:
                lat = float(latitude)
                lng = float(longitude)
                radius_km = float(radius)
                
                # Simple distance calculation (for production, use PostGIS or similar)
                queryset = queryset.filter(
                    latitude__isnull=False,
                    longitude__isnull=False
                ).extra(
                    where=[
                        """
                        (6371 * acos(cos(radians(%s)) * cos(radians(latitude)) * 
                        cos(radians(longitude) - radians(%s)) + sin(radians(%s)) * 
                        sin(radians(latitude)))) <= %s
                        """
                    ],
                    params=[lat, lng, lat, radius_km]
                )
            except (ValueError, TypeError):
                pass  # Invalid coordinates, ignore location filter
        
        # Sort by distance if location is provided
        sort_by = self.request.query_params.get('sort_by', 'distance')
        if sort_by == 'distance' and latitude and longitude:
            try:
                lat = float(latitude)
                lng = float(longitude)
                queryset = queryset.extra(
                    select={
                        'distance': """
                        (6371 * acos(cos(radians(%s)) * cos(radians(latitude)) * 
                        cos(radians(longitude) - radians(%s)) + sin(radians(%s)) * 
                        sin(radians(latitude))))
                        """
                    },
                    select_params=[lat, lng, lat]
                ).order_by('distance')
            except (ValueError, TypeError):
                pass
        elif sort_by == 'price':
            queryset = queryset.annotate(min_court_price=Min('courts__price_per_duration')).order_by('min_court_price')
        elif sort_by == '-price':
            queryset = queryset.annotate(min_court_price=Min('courts__price_per_duration')).order_by('-min_court_price')
        elif sort_by == 'rating':
            queryset = queryset.order_by('-average_rating')
        elif sort_by == 'name':
            queryset = queryset.order_by('name')
        
        return queryset
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return VenueCreateUpdateSerializer
        return VenueListSerializer
    
    def perform_create(self, serializer):
        # Allow admin to assign owner explicitly via owner_id, otherwise default to current user
        owner = self.request.user
        if getattr(self.request.user, 'is_staff', False):
            owner_id = self.request.data.get('owner_id') or self.request.data.get('owner')
            if owner_id:
                try:
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    owner = User.objects.get(id=owner_id)
                except Exception:
                    pass
        serializer.save(owner=owner)


class AdminVenueListView(generics.ListAPIView):
    """Admin view to list all venues regardless of status."""
    
    queryset = Venue.objects.all().select_related('owner')
    permission_classes = [IsAuthenticated]
    # Temporarily disable django-filter backend to avoid missing import issues
    # filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    # filterset_class = VenueFilter
    search_fields = ['name', 'description', 'address', 'city', 'state']
    ordering_fields = ['created_at', 'average_rating', 'name', 'status']
    ordering = ['-created_at']
    serializer_class = VenueListSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status')
        if status and status != 'all':
            queryset = queryset.filter(status=status)
        return queryset


class VenueDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a venue."""
    
    queryset = Venue.objects.all().select_related('owner').prefetch_related(
        'images', 'availability', 'pricing', 'courts'
    )
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return VenueCreateUpdateSerializer
        return VenueDetailSerializer
    
    def get_queryset(self):
        # Users can only edit their own venues unless they're admin
        if self.request.user.is_authenticated and not self.request.user.is_staff:
            return Venue.objects.filter(
                Q(owner=self.request.user) | Q(status='approved')
            ).select_related('owner').prefetch_related('images', 'availability', 'pricing')
        return super().get_queryset()


class VenueSearchView(generics.ListAPIView):
    """Advanced venue search with filters."""
    
    serializer_class = VenueListSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    # Temporarily disable django-filter backend to avoid missing import issues
    # filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    # filterset_class = VenueFilter
    search_fields = ['name', 'description', 'address', 'city', 'state']
    ordering_fields = ['created_at', 'average_rating', 'name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Venue.objects.filter(status='approved').select_related('owner')


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def venue_availability(request, venue_id):
    """Get venue availability for a specific date range."""
    try:
        venue = Venue.objects.get(id=venue_id, status='approved')
    except Venue.DoesNotExist:
        return Response({'error': 'Venue not found'}, status=status.HTTP_404_NOT_FOUND)
    
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    court_id = request.query_params.get('court')
    
    if not start_date or not end_date:
        return Response({'error': 'start_date and end_date are required'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Get availability schedule (court-specific takes precedence if provided)
    if court_id:
        # Try to get court-specific availability first
        court_availability = venue.availability.filter(court_id=court_id, is_available=True)
        if court_availability.exists():
            availability = court_availability
        else:
            # Fall back to venue-level availability if no court-specific availability
            availability = venue.availability.filter(court__isnull=True, is_available=True)
    else:
        # Get venue-level availability
        availability = venue.availability.filter(court__isnull=True, is_available=True)
    
    serializer = VenueAvailabilitySerializer(availability, many=True)
    
    return Response({
        'venue': VenueListSerializer(venue).data,
        'availability': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def venue_pricing(request, venue_id):
    """Get venue pricing information."""
    try:
        venue = Venue.objects.get(id=venue_id, status='approved')
    except Venue.DoesNotExist:
        return Response({'error': 'Venue not found'}, status=status.HTTP_404_NOT_FOUND)
    
    pricing = venue.pricing.filter(is_active=True)
    serializer = VenuePricingSerializer(pricing, many=True)
    
    min_court_price = venue.courts.aggregate(min_price=Min('price_per_duration'))['min_price']

    return Response({
        'venue': VenueListSerializer(venue).data,
        'base_price': min_court_price,
        'currency': venue.currency,
        'pricing_rules': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def nearby_venues(request):
    """Find venues near a specific location."""
    latitude = request.query_params.get('latitude')
    longitude = request.query_params.get('longitude')
    radius = request.query_params.get('radius', 10)  # Default 10km radius
    
    if not latitude or not longitude:
        return Response({'error': 'latitude and longitude are required'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        lat = float(latitude)
        lng = float(longitude)
        radius_km = float(radius)
    except ValueError:
        return Response({'error': 'Invalid coordinates or radius'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Simple distance calculation (for production, use PostGIS or similar)
    venues = Venue.objects.filter(
        status='approved',
        latitude__isnull=False,
        longitude__isnull=False
    ).extra(
        where=[
            """
            (6371 * acos(cos(radians(%s)) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(%s)) + sin(radians(%s)) * 
            sin(radians(latitude)))) <= %s
            """
        ],
        params=[lat, lng, lat, radius_km]
    ).select_related('owner')
    
    serializer = VenueListSerializer(venues, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def venue_stats(request):
    """Get venue statistics."""
    total_venues = Venue.objects.filter(status='approved').count()
    verified_venues = Venue.objects.filter(status='approved', is_verified=True).count()
    avg_rating = Venue.objects.filter(status='approved').aggregate(
        avg_rating=Avg('average_rating')
    )['avg_rating'] or 0
    
    # Venues by sport category
    sport_stats = {}
    for venue in Venue.objects.filter(status='approved'):
        for sport in venue.sport_categories:
            sport_stats[sport] = sport_stats.get(sport, 0) + 1
    
    # Venues by state
    state_stats = Venue.objects.filter(status='approved').values('state').annotate(
        count=Count('id')
    ).order_by('-count')
    
    return Response({
        'total_venues': total_venues,
        'verified_venues': verified_venues,
        'average_rating': round(avg_rating, 2),
        'sport_categories': sport_stats,
        'venues_by_state': list(state_stats)
    })


class UserVenuesView(generics.ListAPIView):
    """Get venues owned by the current user."""
    
    serializer_class = VenueListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Venue.objects.filter(owner=self.request.user).select_related('owner')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_venue(request):
    """Create a new venue with courts."""
    try:
        data = request.data.copy()

        # Normalize JSON fields if posted as strings
        if isinstance(data.get('availability'), str):
            import json
            try:
                data['availability'] = json.loads(data['availability'])
            except Exception:
                pass
        if isinstance(data.get('courts'), str):
            import json
            try:
                data['courts'] = json.loads(data['courts'])
            except Exception:
                pass
        # Normalize sport_categories and amenities (can arrive as JSON strings in multipart)
        if isinstance(data.get('sport_categories'), str):
            import json
            try:
                parsed = json.loads(data['sport_categories'])
                data['sport_categories'] = parsed if isinstance(parsed, list) else [data['sport_categories']]
            except Exception:
                # Fallback: comma-separated
                data['sport_categories'] = [s.strip() for s in data['sport_categories'].split(',') if s.strip()]
        elif data.get('sport_categories') is None:
            data['sport_categories'] = []
        if isinstance(data.get('amenities'), str):
            import json
            try:
                parsed = json.loads(data['amenities'])
                data['amenities'] = parsed if isinstance(parsed, list) else [data['amenities']]
            except Exception:
                data['amenities'] = [s.strip() for s in data['amenities'].split(',') if s.strip()]
        elif data.get('amenities') is None:
            data['amenities'] = []
        # Default values enforced server-side
        if not data.get('status'):
            data['status'] = 'pending'
        
        # Collect venue images separately; don't push raw files through serializer
        venue_images = request.FILES.getlist('gallery_images')
        
        # Extract complex nested fields so serializer only handles flat Venue fields
        venue_level_availability = data.pop('availability', None)
        pricing_data = data.pop('pricing', None)
        courts_data = data.pop('courts', [])
        # Also capture multi-value submissions like courts, courts[]
        try:
            courts_list_mv = request.data.getlist('courts')
        except Exception:
            courts_list_mv = []
        try:
            courts_list_mv_ext = request.data.getlist('courts[]')
        except Exception:
            courts_list_mv_ext = []
        if (not courts_data) and (courts_list_mv or courts_list_mv_ext):
            raw_list = [*courts_list_mv, *courts_list_mv_ext]
            try:
                print("DEBUG: Received multi-value courts entries count:", len(raw_list))
                if raw_list:
                    print("DEBUG: First courts entry prefix:", str(raw_list[0])[:200])
            except Exception:
                pass
            parsed_list = []
            import json
            import ast
            for entry in raw_list:
                if isinstance(entry, (dict, list)):
                    # If the framework already parsed it
                    if isinstance(entry, dict):
                        parsed_list.append(entry)
                    elif isinstance(entry, list):
                        for it in entry:
                            if isinstance(it, dict):
                                parsed_list.append(it)
                    continue
                if not isinstance(entry, str):
                    continue
                # Try JSON first
                try:
                    obj = json.loads(entry)
                except Exception:
                    # Then Python-like literal
                    try:
                        obj = ast.literal_eval(entry)
                    except Exception:
                        obj = None
                if isinstance(obj, dict):
                    parsed_list.append(obj)
                elif isinstance(obj, list):
                    for it in obj:
                        if isinstance(it, dict):
                            parsed_list.append(it)
            if parsed_list:
                courts_data = parsed_list
        # DEBUG: Log raw incoming keys to understand courts payload shape
        try:
            print("DEBUG: Incoming create_venue keys:", list(request.data.keys()))
        except Exception:
            pass

        # Log raw 'courts' value if present
        try:
            if 'courts' in request.data:
                raw_courts_val = request.data.get('courts')
                print("DEBUG: Raw 'courts' value prefix:", str(raw_courts_val)[:200])
        except Exception:
            pass

        # Try extracting courts directly from request.data in multiple ways
        direct_courts_single = request.data.get('courts')
        try:
            direct_courts_list = request.data.getlist('courts')
        except Exception:
            direct_courts_list = []
        # Prefer explicitly parsed value when courts_data is empty
        if not courts_data:
            candidate_values = []
            if isinstance(direct_courts_single, (str, bytes)):
                candidate_values.append(direct_courts_single)
            if direct_courts_list:
                # If list has one JSON string, prefer it
                candidate_values.extend([v for v in direct_courts_list if isinstance(v, (str, bytes))])
            parsed_from_direct = None
            import json, ast
            for raw in candidate_values:
                try:
                    raw_s = raw.decode() if isinstance(raw, (bytes, bytearray)) else raw
                    obj = json.loads(raw_s)
                    if isinstance(obj, str):
                        obj = json.loads(obj)
                except Exception:
                    try:
                        obj = ast.literal_eval(raw_s)
                        if isinstance(obj, str):
                            obj = ast.literal_eval(obj)
                    except Exception:
                        obj = None
                if isinstance(obj, list):
                    parsed_from_direct = obj
                    break
                if isinstance(obj, dict):
                    parsed_from_direct = [obj]
                    break
            if parsed_from_direct is not None:
                courts_data = parsed_from_direct

        # If courts not provided as a single JSON field, reconstruct from multipart-style keys
        if (not courts_data) and any(k.startswith('courts[') or k.startswith('courts.') for k in request.data.keys()):
            import re
            courts_by_index = {}
            # Handle keys like courts[0][name] and courts.0.name
            bracket_re = re.compile(r'^courts\[(\d+)\]\[(.+?)\]$')
            dot_re = re.compile(r'^courts\.(\d+)\.(.+)$')
            for key in request.data.keys():
                m = bracket_re.match(key) or dot_re.match(key)
                if not m:
                    continue
                idx = int(m.group(1))
                field_name = m.group(2)
                if idx not in courts_by_index:
                    courts_by_index[idx] = {}
                value = request.data.getlist(key)
                value = value if len(value) > 1 else (value[0] if value else None)
                courts_by_index[idx][field_name] = value
            # Convert dict to ordered list
            if courts_by_index:
                courts_data = [courts_by_index[i] for i in sorted(courts_by_index.keys())]
                try:
                    print("DEBUG: Reconstructed courts_data from multipart keys:", courts_data)
                except Exception:
                    pass
        
        # Ensure courts_data is a list
        if isinstance(courts_data, list):
            try:
                print("DEBUG: courts_data initial type=list, len=", len(courts_data))
                if len(courts_data) > 0:
                    print("DEBUG: courts_data[0] prefix:", str(courts_data[0])[:120])
            except Exception:
                pass
            # Special case: single JSON string entry in list
            if len(courts_data) == 1 and isinstance(courts_data[0], (str, bytes)):
                try:
                    import json
                    raw0 = courts_data[0].decode() if isinstance(courts_data[0], (bytes, bytearray)) else courts_data[0]
                    parsed0 = json.loads(raw0)
                    if isinstance(parsed0, list):
                        courts_data = parsed0
                    elif isinstance(parsed0, dict):
                        courts_data = [parsed0]
                except Exception:
                    try:
                        import ast
                        raw0 = courts_data[0].decode() if isinstance(courts_data[0], (bytes, bytearray)) else courts_data[0]
                        parsed0 = ast.literal_eval(raw0)
                        if isinstance(parsed0, list):
                            courts_data = parsed0
                        elif isinstance(parsed0, dict):
                            courts_data = [parsed0]
                    except Exception:
                        pass
            # Special case: single nested list entry -> flatten
            if len(courts_data) == 1 and isinstance(courts_data[0], list):
                courts_data = courts_data[0]
        if isinstance(courts_data, str):
            import json
            parsed = None
            # Try multiple JSON passes (to handle double-encoded strings)
            try:
                parsed = json.loads(courts_data)
                if isinstance(parsed, str):
                    parsed = json.loads(parsed)
            except Exception:
                parsed = None
            if parsed is None:
                # Fallback: try Python literal eval for non-strict JSON (single quotes, etc.)
                try:
                    import ast
                    parsed = ast.literal_eval(courts_data)
                    if isinstance(parsed, str):
                        parsed = ast.literal_eval(parsed)
                except Exception:
                    parsed = None
            if isinstance(parsed, list):
                courts_data = parsed
            elif isinstance(parsed, dict):
                courts_data = [parsed]
            else:
                try:
                    print("DEBUG: Failed to parse 'courts' string; value prefix:", str(courts_data)[:200])
                except Exception:
                    pass
                courts_data = []
        elif not isinstance(courts_data, list):
            courts_data = []

        # In some multipart submissions, each court may arrive as a JSON string entry; normalize
        normalized_courts = []
        for item in courts_data:
            if isinstance(item, dict):
                normalized_courts.append(item)
            elif isinstance(item, str):
                try:
                    obj = json.loads(item)
                    if isinstance(obj, dict):
                        normalized_courts.append(obj)
                    elif isinstance(obj, list):
                        # The value was a JSON array string – extend with its dict items
                        for entry in obj:
                            if isinstance(entry, dict):
                                normalized_courts.append(entry)
                except Exception:
                    # Try Python literal for non-strict strings
                    try:
                        import ast
                        obj = ast.literal_eval(item)
                        if isinstance(obj, dict):
                            normalized_courts.append(obj)
                        elif isinstance(obj, list):
                            for entry in obj:
                                if isinstance(entry, dict):
                                    normalized_courts.append(entry)
                    except Exception:
                        pass
        courts_data = normalized_courts
        try:
            print("DEBUG: Normalized courts_data count:", len(courts_data))
        except Exception:
            pass

        # Normalize common alias keys for courts before validation
        def _normalize_court_keys(court: dict) -> dict:
            if not isinstance(court, dict):
                return court
            # Aliases mapping
            if 'booking_duration_minutes' not in court and 'duration' in court:
                court['booking_duration_minutes'] = court.get('duration')
            if 'booking_duration_minutes' not in court and 'bookingDuration' in court:
                court['booking_duration_minutes'] = court.get('bookingDuration')
            if 'booking_duration_minutes' not in court and 'booking_duration' in court:
                court['booking_duration_minutes'] = court.get('booking_duration')
            if 'price_per_duration' not in court and 'price' in court:
                court['price_per_duration'] = court.get('price')
            if 'price_per_duration' not in court and 'pricePerDuration' in court:
                court['price_per_duration'] = court.get('pricePerDuration')
            if 'sport' not in court and 'sport_category' in court:
                court['sport'] = court.get('sport_category')
            if 'name' not in court and 'court_name' in court:
                court['name'] = court.get('court_name')
            # Coerce numeric strings
            try:
                if court.get('booking_duration_minutes') not in [None, '']:
                    court['booking_duration_minutes'] = int(court['booking_duration_minutes'])
            except Exception:
                pass
            try:
                if court.get('price_per_duration') not in [None, '']:
                    court['price_per_duration'] = float(court['price_per_duration'])
            except Exception:
                pass
            return court

        courts_data = [_normalize_court_keys(c) for c in courts_data]

        # HARD VALIDATION: require at least one court with a positive price_per_duration
        if not courts_data or len(courts_data) == 0:
            return Response(
                {'error': "At least one court is required during venue creation."},
                status=status.HTTP_400_BAD_REQUEST
            )
        for i, c in enumerate(courts_data):
            if not isinstance(c, dict):
                return Response(
                    {'error': f"Court {i+1}: invalid format."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            price_val = c.get('price_per_duration')
            if price_val in [None, '', '0', 0, '0.0', 0.0]:
                return Response(
                    {'error': f"Court {i+1}: 'price_per_duration' is required and must be greater than 0."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not c.get('name') or not c.get('sport'):
                return Response(
                    {'error': f"Court {i+1}: 'name' and 'sport' are required."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Build clean payload with only allowed fields
        allowed_fields = [
            'name','description','address','city','state','postcode','country',
            'latitude','longitude','phone_number','email','website','sport_categories',
            'amenities','rules','cancellation_policy','google_map_link','currency',
            'cover_image','status'
        ]
        payload = {}
        for field in allowed_fields:
            if field in data:
                payload[field] = data.get(field)
        # Ensure parsed arrays for JSON fields
        if isinstance(payload.get('sport_categories'), str):
            import json
            try:
                parsed = json.loads(payload['sport_categories'])
                payload['sport_categories'] = parsed if isinstance(parsed, list) else [payload['sport_categories']]
            except Exception:
                payload['sport_categories'] = [s.strip() for s in payload['sport_categories'].split(',') if s.strip()]
        if isinstance(payload.get('amenities'), str):
            import json
            try:
                parsed = json.loads(payload['amenities'])
                payload['amenities'] = parsed if isinstance(parsed, list) else [payload['amenities']]
            except Exception:
                payload['amenities'] = [s.strip() for s in payload['amenities'].split(',') if s.strip()]
        # Defaults
        if not payload.get('status'):
            payload['status'] = 'pending'

        # Create venue (set owner explicitly; allow admin to assign)
        venue_serializer = VenueCreateUpdateSerializer(data=payload)
        if venue_serializer.is_valid():
            owner_to_use = request.user
            try:
                if getattr(request.user, 'is_staff', False) or getattr(request.user, 'is_superuser', False):
                    incoming_owner_id = request.data.get('owner_id') or request.data.get('owner') or payload.get('owner_id') or payload.get('owner')
                    if incoming_owner_id:
                        from django.contrib.auth import get_user_model
                        User = get_user_model()
                        owner_to_use = User.objects.get(id=incoming_owner_id)
            except Exception:
                pass
            venue = venue_serializer.save(owner=owner_to_use)
            
            # Attach venue images
            if venue_images:
                for img in venue_images:
                    VenueImage.objects.create(venue=venue, image=img)
            
        # Create courts if provided
            created_courts = []
            for i, court_data in enumerate(courts_data):
                try:
                    # Ensure court_data is a dictionary
                    if not isinstance(court_data, dict):
                        print(f"ERROR: Court data at index {i} is not a dictionary: {court_data}")
                        continue
                        
                    # Associate venue instance explicitly
                    court_payload = {k: v for k, v in court_data.items() if k not in ['gallery_images', 'availability', 'venue', 'base_price_per_hour']}
                    # Ensure essential defaults (do not override user-entered price)
                    if not court_payload.get('booking_duration_minutes'):
                        court_payload['booking_duration_minutes'] = 60
                    # VALIDATE: price per duration is required when courts are provided
                    price_value = court_payload.get('price_per_duration')
                    if price_value in [None, '', '0', 0, '0.0', 0.0]:
                        return Response(
                            {
                                'error': f"Court {i+1}: 'price_per_duration' is required and must be greater than 0"
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    # Coerce numeric types
                    try:
                        if 'booking_duration_minutes' in court_payload and court_payload['booking_duration_minutes'] not in [None, '']:
                            court_payload['booking_duration_minutes'] = int(court_payload['booking_duration_minutes'])
                    except Exception:
                        court_payload['booking_duration_minutes'] = 60
                    try:
                        if 'price_per_duration' in court_payload and court_payload['price_per_duration'] not in [None, '']:
                            court_payload['price_per_duration'] = float(court_payload['price_per_duration'])
                    except Exception:
                        pass
                    court_payload['venue'] = venue
                    # Handle court images
                    court_images = request.FILES.getlist(f'courts[{i}][gallery_images]')
                    created_court = Court.objects.create(**court_payload)
                    created_courts.append(created_court.id)
                    
                    # Handle court-level availability or seed from venue-level
                    if isinstance(court_data.get('availability'), dict) and court_data['availability']:
                        for day, schedule in court_data['availability'].items():
                            VenueAvailability.objects.create(
                                venue=venue,
                                court=created_court,
                                day_of_week=day,
                                start_time=schedule.get('start_time', '08:00'),
                                end_time=schedule.get('end_time', '20:00'),
                                is_available=schedule.get('is_available', True),
                            )
                    else:
                        # Seed from venue-level availability
                        for vav in venue.availability.filter(court__isnull=True):
                            VenueAvailability.objects.create(
                                venue=venue,
                                court=created_court,
                                day_of_week=vav.day_of_week,
                                start_time=vav.start_time,
                                end_time=vav.end_time,
                                is_available=vav.is_available,
                            )
                except Exception as e:
                    print(f"ERROR creating court {i}: {e}")
                    # Do not abort entire create; continue with other courts
                    continue

            # Post-condition: courts created are guaranteed by validation above
            try:
                print(f"DEBUG: Courts created count: {len(created_courts)} -> {created_courts}")
            except Exception:
                pass
            if len(created_courts) == 0:
                return Response({
                    'error': 'Courts were provided but none were created due to invalid fields.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
        # Handle venue-level availability
            if isinstance(venue_level_availability, dict) and venue_level_availability:
                for day, schedule in venue_level_availability.items():
                    VenueAvailability.objects.create(
                        venue=venue,
                        court=None,  # Venue-level availability
                        day_of_week=day,
                        start_time=schedule.get('start_time', '08:00'),
                        end_time=schedule.get('end_time', '20:00'),
                        is_available=schedule.get('is_available', True),
                    )
            else:
                # Create a sensible default availability when none provided
                default_days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
                for day in default_days:
                    VenueAvailability.objects.create(
                        venue=venue,
                        court=None,
                        day_of_week=day,
                        start_time='06:00',
                        end_time='22:00',
                        is_available=True,
                    )
            
            return Response({
                'message': 'Venue created successfully. It will be reviewed and approved soon.',
                'venue': VenueDetailSerializer(venue).data
            }, status=status.HTTP_201_CREATED)
        else:
            # Debug logging for serializer errors
            try:
                print('VENUE CREATE VALIDATION FAILED')
                print('Incoming fields:', list(request.data.keys()))
                print('Serializer errors:', venue_serializer.errors)
            except Exception:
                pass
            return Response(venue_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_venue(request, venue_id):
    """Update a venue with courts."""
    try:
        venue = Venue.objects.get(id=venue_id)
        
        # Check if user can update this venue
        if not (request.user.is_staff or request.user.is_superuser or venue.owner == request.user):
            return Response(
                {'error': 'You do not have permission to update this venue'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        data = request.data.copy()
        
        # Allow admin to reassign owner
        if request.user.is_staff or request.user.is_superuser:
            new_owner_id = data.get('owner_id') or data.get('owner')
            if new_owner_id:
                try:
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    new_owner = User.objects.get(id=new_owner_id)
                    venue.owner = new_owner
                    venue.save(update_fields=['owner'])
                except Exception:
                    pass

        # Update venue basic info
        venue_serializer = VenueCreateUpdateSerializer(venue, data=data, partial=request.method == 'PATCH')
        if venue_serializer.is_valid():
            venue = venue_serializer.save()
            
            # Handle courts update
            courts_data = data.get('courts', [])
            print(f"DEBUG: Original courts_data: {courts_data}")
            print(f"DEBUG: Type of courts_data: {type(courts_data)}")
            
            # Clear existing venue availability (not court-specific)
            VenueAvailability.objects.filter(venue=venue, court__isnull=True).delete()
            
            # Always clear existing courts and their availability first
            existing_courts_count = venue.courts.count()
            for c in venue.courts.all():
                c.availability.all().delete()
            venue.courts.all().delete()
            
            # Parse courts data if it's a JSON string
            if isinstance(courts_data, str):
                import json
                try:
                    courts_data = json.loads(courts_data)
                    print(f"DEBUG: Parsed courts_data from JSON: {courts_data}")
                except json.JSONDecodeError as e:
                    print(f"DEBUG: JSON decode error: {e}")
                    courts_data = []
            
            print(f"DEBUG: Final courts_data to create: {courts_data}")
            print(f"DEBUG: Length of courts_data: {len(courts_data) if courts_data else 0}")
            
            # Create new courts if provided
            if courts_data and len(courts_data) > 0:
                for i, court_data in enumerate(courts_data):
                    print(f"DEBUG: Creating court {i}: {court_data}")
                    try:
                        # Build payload and assign venue instance
                        court_payload = {k: v for k, v in court_data.items() if k not in ['gallery_images', 'availability', 'venue']}
                        court_payload['venue'] = venue
                        # Handle court images
                        court_images = request.FILES.getlist(f'courts[{i}][gallery_images]')
                        created_court = Court.objects.create(**court_payload)
                        
                        # Save court images
                        if court_images:
                            court_image_urls = []
                            for img in court_images:
                                # Save the image file and get the URL
                                court_image = VenueImage.objects.create(
                                    venue=venue,
                                    image=img,
                                    caption=f"Court {created_court.name} image"
                                )
                                court_image_urls.append(court_image.image.url)
                            created_court.gallery_images = court_image_urls
                            created_court.save()
                        # Handle per-court availability
                        court_availability = court_data.get('availability')
                        if isinstance(court_availability, dict) and court_availability:
                            # Use provided availability data
                            for day, schedule in court_availability.items():
                                VenueAvailability.objects.create(
                                    venue=venue,
                                    court=created_court,
                                    day_of_week=day,
                                    start_time=schedule.get('start_time', '08:00'),
                                    end_time=schedule.get('end_time', '20:00'),
                                    is_available=schedule.get('is_available', True),
                                )
                        print(f"DEBUG: Court {i} created successfully")
                    except Exception as e:
                        print(f"ERROR creating court on update {i}: {e}")
                        raise
            else:
                print("DEBUG: No courts to create")
            
            # Handle venue-level availability
            venue_availability = data.get('availability')
            if isinstance(venue_availability, str):
                import json
                try:
                    venue_availability = json.loads(venue_availability)
                except json.JSONDecodeError:
                    venue_availability = None
            
            if isinstance(venue_availability, dict) and venue_availability:
                # Use provided venue availability data
                for day, schedule in venue_availability.items():
                    VenueAvailability.objects.create(
                        venue=venue,
                        court=None,  # Venue-level availability
                        day_of_week=day,
                        start_time=schedule.get('start_time', '08:00'),
                        end_time=schedule.get('end_time', '20:00'),
                        is_available=schedule.get('is_available', True),
                    )
            else:
                # Create default venue-level availability if none provided
                default_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                for day in default_days:
                    VenueAvailability.objects.create(
                        venue=venue,
                        court=None,  # Venue-level availability
                        day_of_week=day,
                        start_time='08:00',
                        end_time='20:00',
                        is_available=True,
                    )
            
            # Handle venue images
            new_images = request.FILES.getlist('images')
            existing_image_ids = data.getlist('existing_images')
            
            # Remove images that are not in the existing list
            if existing_image_ids:
                VenueImage.objects.filter(venue=venue).exclude(id__in=existing_image_ids).delete()
            else:
                # If no existing images specified, remove all
                VenueImage.objects.filter(venue=venue).delete()
            
            # Add new images
            for image_file in new_images:
                VenueImage.objects.create(
                    venue=venue,
                    image=image_file,
                    caption=f"Uploaded image for {venue.name}"
                )
            
            return Response({
                'message': 'Venue updated successfully',
                'venue': VenueDetailSerializer(venue).data
            }, status=status.HTTP_200_OK)
        else:
            return Response(venue_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except Venue.DoesNotExist:
        return Response(
            {'error': 'Venue not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def get_sports(request):
    """Get all available sports."""
    # For admin users, return all sports (active and inactive)
    # For regular users, return only active sports
    if request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser):
        sports = Sport.objects.all().order_by('sort_order', 'name')
    else:
        sports = Sport.objects.filter(is_active=True).order_by('sort_order', 'name')
    
    approved_sport_lists = Venue.objects.filter(status='approved').values_list('sport_categories', flat=True)

    def venue_count_for(sport_name):
        count = 0
        for sport_categories in approved_sport_lists:
            if isinstance(sport_categories, list) and sport_name in sport_categories:
                count += 1
            elif isinstance(sport_categories, str) and sport_name.lower() in sport_categories.lower():
                count += 1
        return count

    return Response([{
        'id': sport.id,
        'name': sport.name,
        'slug': sport.slug,
        'icon': sport.icon,
        'image_url': request.build_absolute_uri(sport.image.url) if sport.image else None,
        'color': sport.color,
        'description': sport.description,
        'is_active': sport.is_active,
        'venue_count': venue_count_for(sport.name)
    } for sport in sports])


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def get_amenities(request):
    """Get all available amenities."""
    # For admin users, return all amenities (active and inactive)
    # For regular users, return only active amenities
    if request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser):
        amenities = Amenity.objects.all().order_by('category', 'sort_order', 'name')
    else:
        amenities = Amenity.objects.filter(is_active=True).order_by('category', 'sort_order', 'name')
    
    return Response([{
        'id': amenity.id,
        'name': amenity.name,
        'slug': amenity.slug,
        'icon': amenity.icon,
        'category': amenity.category,
        'description': amenity.description,
        'is_active': amenity.is_active
    } for amenity in amenities])


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_sport(request):
    """Create a new sport."""
    try:
        data = request.data
        print(f"Creating sport with data: {data}")
        
        # Validate required fields
        if not data.get('name'):
            return Response({'error': 'Name is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate slug from name
        slug = slugify(data.get('name'))
        
        # Ensure slug is unique
        original_slug = slug
        counter = 1
        while Sport.objects.filter(slug=slug).exists():
            slug = f"{original_slug}-{counter}"
            counter += 1
        
        sport = Sport.objects.create(
            name=data.get('name'),
            slug=slug,
            description=data.get('description', ''),
            icon=data.get('icon', ''),
            color=data.get('color', '#3B82F6'),
            is_active=data.get('is_active', True)
        )
        
        print(f"Sport created successfully: {sport.id} - {sport.name}")
        
        return Response({
            'id': sport.id,
            'name': sport.name,
            'slug': sport.slug,
            'icon': sport.icon,
            'color': sport.color,
            'description': sport.description,
            'is_active': sport.is_active
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        print(f"Error creating sport: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_sport(request, sport_id):
    """Update a sport."""
    try:
        sport = Sport.objects.get(id=sport_id)
        data = request.data
        
        print(f"Updating sport {sport_id} with data: {data}")
        print(f"Current is_active: {sport.is_active}")
        
        sport.name = data.get('name', sport.name)
        sport.description = data.get('description', sport.description)
        sport.icon = data.get('icon', sport.icon)
        sport.color = data.get('color', sport.color)
        
        # Handle boolean conversion properly
        is_active_value = data.get('is_active', sport.is_active)
        if isinstance(is_active_value, str):
            sport.is_active = is_active_value.lower() in ['true', '1', 'yes', 'on']
        else:
            sport.is_active = bool(is_active_value)
        
        print(f"New is_active: {sport.is_active}")
        sport.save()
        
        return Response({
            'id': sport.id,
            'name': sport.name,
            'slug': sport.slug,
            'icon': sport.icon,
            'color': sport.color,
            'description': sport.description,
            'is_active': sport.is_active
        })
    except Sport.DoesNotExist:
        return Response({'error': 'Sport not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_sport(request, sport_id):
    """Delete a sport."""
    try:
        sport = Sport.objects.get(id=sport_id)
        sport.delete()
        return Response({'message': 'Sport deleted successfully'})
    except Sport.DoesNotExist:
        return Response({'error': 'Sport not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_amenity(request):
    """Create a new amenity."""
    try:
        data = request.data
        print(f"Creating amenity with data: {data}")
        
        # Validate required fields
        if not data.get('name'):
            return Response({'error': 'Name is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not data.get('category'):
            return Response({'error': 'Category is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate slug from name
        slug = slugify(data.get('name'))
        
        # Ensure slug is unique
        original_slug = slug
        counter = 1
        while Amenity.objects.filter(slug=slug).exists():
            slug = f"{original_slug}-{counter}"
            counter += 1
        
        amenity = Amenity.objects.create(
            name=data.get('name'),
            slug=slug,
            description=data.get('description', ''),
            icon=data.get('icon', ''),
            category=data.get('category', ''),
            is_active=data.get('is_active', True)
        )
        
        print(f"Amenity created successfully: {amenity.id} - {amenity.name}")
        
        return Response({
            'id': amenity.id,
            'name': amenity.name,
            'slug': amenity.slug,
            'icon': amenity.icon,
            'category': amenity.category,
            'description': amenity.description,
            'is_active': amenity.is_active
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        print(f"Error creating amenity: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_amenity(request, amenity_id):
    """Update an amenity."""
    try:
        amenity = Amenity.objects.get(id=amenity_id)
        data = request.data
        
        print(f"Updating amenity {amenity_id} with data: {data}")
        print(f"Current is_active: {amenity.is_active}")
        
        amenity.name = data.get('name', amenity.name)
        amenity.description = data.get('description', amenity.description)
        amenity.icon = data.get('icon', amenity.icon)
        amenity.category = data.get('category', amenity.category)
        
        # Handle boolean conversion properly
        is_active_value = data.get('is_active', amenity.is_active)
        if isinstance(is_active_value, str):
            amenity.is_active = is_active_value.lower() in ['true', '1', 'yes', 'on']
        else:
            amenity.is_active = bool(is_active_value)
        
        print(f"New is_active: {amenity.is_active}")
        amenity.save()
        
        return Response({
            'id': amenity.id,
            'name': amenity.name,
            'slug': amenity.slug,
            'icon': amenity.icon,
            'category': amenity.category,
            'description': amenity.description,
            'is_active': amenity.is_active
        })
    except Amenity.DoesNotExist:
        return Response({'error': 'Amenity not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_amenity(request, amenity_id):
    """Delete an amenity."""
    try:
        amenity = Amenity.objects.get(id=amenity_id)
        amenity.delete()
        return Response({'message': 'Amenity deleted successfully'})
    except Amenity.DoesNotExist:
        return Response({'error': 'Amenity not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_venue_bookings(request):
    """Get bookings for venues owned by the current user."""
    try:
        # Get venues owned by the current user
        user_venues = Venue.objects.filter(owner=request.user)
        venue_ids = user_venues.values_list('id', flat=True)
        
        # Get bookings for these venues
        from apps.bookings.models import Booking
        bookings = Booking.objects.filter(
            venue_id__in=venue_ids
        ).select_related('venue', 'user').order_by('-created_at')
        
        # Apply pagination
        from django.core.paginator import Paginator
        page = request.GET.get('page', 1)
        limit = request.GET.get('limit', 10)
        
        paginator = Paginator(bookings, limit)
        page_obj = paginator.get_page(page)
        
        # Serialize bookings
        from apps.bookings.serializers import BookingSerializer
        serializer = BookingSerializer(page_obj, many=True)
        
        return Response({
            'results': serializer.data,
            'count': paginator.count,
            'next': page_obj.next_page_number() if page_obj.has_next() else None,
            'previous': page_obj.previous_page_number() if page_obj.has_previous() else None,
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
