# SportMeet Backend

A comprehensive Django REST API for the SportMeet platform, providing robust backend services for venue booking, event management, and user interactions.

## Features

- 🏟️ **Venue Management** - Complete venue CRUD operations
- 📅 **Booking System** - Advanced booking and scheduling
- 🎯 **Event Management** - Event creation and participation
- 👥 **User Management** - Multi-role user system
- 💳 **Payment Processing** - Secure payment handling
- ⭐ **Reviews & Ratings** - User feedback system
- 📊 **Analytics** - Comprehensive reporting
- 🔐 **Authentication** - OAuth2 and session-based auth
- 📱 **Mobile Ready** - RESTful API for mobile apps

## Tech Stack

- **Django 4.2.7** - Web framework
- **Django REST Framework** - API development
- **PostgreSQL** - Primary database
- **Redis** - Caching and task queue
- **Celery** - Background tasks
- **OAuth2** - Authentication
- **Django CORS Headers** - Cross-origin requests
- **Django Filter** - API filtering
- **Pillow** - Image processing

## Project Structure

```
backend/
├── sportmeet/              # Main Django project
│   ├── settings.py         # Django settings
│   ├── urls.py            # URL configuration
│   ├── wsgi.py            # WSGI configuration
│   └── asgi.py            # ASGI configuration
├── apps/                   # Django applications
│   ├── accounts/          # User management
│   │   ├── models.py      # User models
│   │   ├── views.py       # User views
│   │   ├── serializers.py # User serializers
│   │   └── admin.py       # Admin configuration
│   ├── venues/            # Venue management
│   ├── bookings/          # Booking system
│   ├── events/            # Event management
│   ├── payments/          # Payment processing
│   ├── reviews/           # Reviews and ratings
│   ├── reports/           # Analytics and reporting
│   ├── discounts/         # Promotions and discounts
│   └── core/              # Core utilities
├── requirements.txt        # Python dependencies
├── manage.py              # Django management script
└── README.md              # This file
```

## Installation

### Prerequisites

- Python 3.9+
- PostgreSQL 12+
- Redis 6+

### Setup

1. **Clone and navigate to backend**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment configuration**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Database setup**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

6. **Run development server**
   ```bash
   python manage.py runserver
   ```

## API Endpoints

### Authentication
```
POST /api/auth/register/          # User registration
POST /api/auth/login/             # User login
POST /api/auth/logout/            # User logout
GET  /api/auth/profile/           # Get user profile
PUT  /api/auth/profile/update/    # Update user profile
POST /api/auth/change-password/   # Change password
```

### Venues
```
GET    /api/venues/               # List venues
GET    /api/venues/{id}/          # Get venue details
POST   /api/venues/               # Create venue
PUT    /api/venues/{id}/          # Update venue
DELETE /api/venues/{id}/          # Delete venue
GET    /api/venues/search/        # Search venues
GET    /api/venues/nearby/        # Find nearby venues
GET    /api/venues/stats/         # Venue statistics
```

### Bookings
```
GET    /api/bookings/             # List bookings
GET    /api/bookings/{id}/        # Get booking details
POST   /api/bookings/             # Create booking
PUT    /api/bookings/{id}/        # Update booking
POST   /api/bookings/{id}/cancel/ # Cancel booking
GET    /api/bookings/my-bookings/ # User bookings
GET    /api/bookings/stats/       # Booking statistics
```

### Events
```
GET    /api/events/               # List events
GET    /api/events/{id}/          # Get event details
POST   /api/events/               # Create event
PUT    /api/events/{id}/          # Update event
DELETE /api/events/{id}/          # Delete event
POST   /api/events/{id}/register/ # Register for event
POST   /api/events/{id}/unregister/ # Unregister from event
```

### Payments
```
GET    /api/payments/             # List payments
GET    /api/payments/{id}/        # Get payment details
POST   /api/payments/create/      # Create payment
POST   /api/payments/{id}/refund/ # Create refund
```

### Reviews
```
GET    /api/reviews/              # List reviews
GET    /api/reviews/{id}/         # Get review details
POST   /api/reviews/create/       # Create review
PUT    /api/reviews/{id}/         # Update review
DELETE /api/reviews/{id}/         # Delete review
```

## Models

### User Models
- **User** - Custom user model with extended fields
- **UserProfile** - Extended user profile information
- **VenueOwnerProfile** - Venue owner specific profile
- **TrainerProfile** - Trainer specific profile

### Venue Models
- **Venue** - Main venue model
- **VenueAvailability** - Venue availability schedule
- **VenueImage** - Venue images
- **VenuePricing** - Dynamic pricing rules

### Booking Models
- **Booking** - Main booking model
- **BookingTimeSlot** - Available time slots
- **BookingCancellation** - Cancellation details
- **BookingReview** - Booking reviews

### Event Models
- **Event** - Main event model
- **EventParticipant** - Event participants
- **EventComment** - Event comments
- **EventImage** - Event images

## Authentication

### OAuth2
- Token-based authentication
- Refresh token support
- Scope-based permissions

### Session Authentication
- Django session backend
- CSRF protection
- Secure cookie settings

## Database

### PostgreSQL Configuration
- Optimized for performance
- Full-text search support
- JSON field support
- Connection pooling

### Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

## Caching

### Redis Configuration
- Session storage
- Cache backend
- Celery broker
- Real-time features

## Background Tasks

### Celery Setup
- Async task processing
- Scheduled tasks
- Email notifications
- Report generation

## Admin Interface

### Django Admin
- Custom admin configurations
- Advanced filtering
- Bulk actions
- Export functionality

### Admin Features
- User management
- Venue approval
- Booking oversight
- Analytics dashboard

## Security

### Security Features
- CSRF protection
- XSS prevention
- SQL injection protection
- Rate limiting
- CORS configuration

### Data Protection
- Password hashing
- Token encryption
- Secure headers
- Input validation

## Testing

### Test Setup
```bash
python manage.py test
```

### Test Coverage
- Unit tests
- Integration tests
- API tests
- Model tests

## Deployment

### Production Settings
- Debug mode disabled
- Secure secret key
- Production database
- Static file serving
- Email configuration

### Environment Variables
- Database credentials
- Redis configuration
- Email settings
- API keys

## Monitoring

### Logging
- Application logs
- Error tracking
- Performance monitoring
- Security logs

### Health Checks
- Database connectivity
- Redis availability
- External services
- API endpoints

## Performance

### Optimization
- Database queries
- Caching strategies
- Static file serving
- API response times

### Scaling
- Horizontal scaling
- Load balancing
- Database sharding
- CDN integration

## API Documentation

### Swagger/OpenAPI
- Interactive API docs
- Request/response examples
- Authentication guide
- Error codes

### Postman Collection
- Pre-configured requests
- Environment variables
- Test scripts
- Documentation

## Contributing

1. Follow PEP 8 style guide
2. Write comprehensive tests
3. Update documentation
4. Submit pull requests

## License

This project is licensed under the MIT License.
