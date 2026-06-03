# SportMeet Frontend

A modern React application for the SportMeet platform, built with React 18, Tailwind CSS, and modern web technologies.

## Features

- 🎨 **Modern UI/UX** - Clean, responsive design with Tailwind CSS
- ⚡ **Fast Performance** - Optimized with React 18 and modern patterns
- 🔐 **Authentication** - Secure user authentication and authorization
- 📱 **Responsive Design** - Works perfectly on all devices
- 🌙 **Dark Mode** - Theme switching support
- 🎯 **Type Safety** - Built with TypeScript support
- 🚀 **Modern Patterns** - React Query, Context API, and custom hooks

## Tech Stack

- **React 18** - UI library
- **React Router 6** - Client-side routing
- **React Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **React Hook Form** - Form handling
- **React Hot Toast** - Notifications
- **Axios** - HTTP client

## Project Structure

```
frontend/
├── public/                 # Static files
│   ├── index.html         # HTML template
│   └── manifest.json      # PWA manifest
├── src/
│   ├── components/        # Reusable components
│   │   ├── UI/           # Basic UI components
│   │   └── Layout/       # Layout components
│   ├── pages/            # Page components
│   ├── contexts/         # React contexts
│   ├── services/         # API services
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Utility functions
│   ├── App.js            # Main app component
│   ├── index.js          # Entry point
│   └── index.css         # Global styles
├── package.json          # Dependencies
├── tailwind.config.js    # Tailwind configuration
└── README.md            # This file
```

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn package manager

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env.local
   ```

   Set the values you need in `.env.local`, especially:
   - `REACT_APP_MAPBOX_TOKEN`
   - `REACT_APP_STRIPE_PUBLISHABLE_KEY`
   - `REACT_APP_API_URL` if your backend is not available at `/api`

3. **Start development server**
   ```bash
   npm start
   ```

The app will open at `http://localhost:3000`

## Local Dev Auth/CORS & Proxy

- API base defaults to relative `/api` (see `src/services/api.js`).
- Dev proxy in `package.json` points to `http://127.0.0.1:8000` to bypass CORS in development.
- Axios sends `Authorization: Token <token>` for all requests except:
  - `/auth/login`, `/auth/register`, `/auth/social/*`.
- After successful login, the app fetches `/auth/profile/` with the token to hydrate user state.

### Troubleshooting
- Stuck redirecting to `/login`:
  - Check Network → `/api/auth/profile/` returns 200 and has `Authorization` header.
- CORS error:
  - Restart both servers and hard refresh (Ctrl+Shift+R).
  - Ensure proxy present and API base is `/api`.

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Features Overview

### 🏠 Landing Page
- Hero section with call-to-action
- Featured venues and events
- Statistics and testimonials
- Responsive design

### 🏟️ Venues
- Browse and search venues
- Advanced filtering
- Venue details and booking
- Image galleries

### 🎯 Events
- Discover sports events
- Event registration
- Event details and comments
- Community features

### 📅 Bookings
- Booking management
- Calendar integration
- Payment processing
- Booking history

### 👤 User Dashboard
- Personal dashboard
- Profile management
- Booking history
- Settings and preferences

### 🔧 Admin Dashboard
- Comprehensive admin panel
- User management
- Venue management
- Analytics and reporting

## State Management

### Context API
- **AuthContext** - User authentication state
- **ThemeContext** - Theme and UI preferences

### React Query
- Data fetching and caching
- Background updates
- Error handling
- Loading states

## Styling

### Tailwind CSS
- Utility-first CSS framework
- Custom color palette
- Responsive design
- Dark mode support

### Custom Classes
- Component-specific styles
- Animation utilities
- Layout helpers
- Theme variants

## API Integration

### Services
- **authAPI** - Authentication endpoints
- **venuesAPI** - Venue management
- **bookingsAPI** - Booking system
- **eventsAPI** - Event management
- **reportsAPI** - Analytics and reporting

### Error Handling
- Global error boundary
- API error handling
- User-friendly error messages
- Retry mechanisms

## Performance Optimization

### Code Splitting
- Route-based code splitting
- Lazy loading
- Dynamic imports

### Caching
- React Query caching
- Browser caching
- Optimistic updates

### Bundle Optimization
- Tree shaking
- Minification
- Compression

## Testing

### Test Setup
- Jest testing framework
- React Testing Library
- Custom test utilities

### Test Coverage
- Component testing
- Integration testing
- API mocking
- User interaction testing

## Deployment

### Build Process
```bash
npm run build
```

### Environment Variables
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_MAPBOX_TOKEN` - Mapbox public token for maps and geocoding
- `REACT_APP_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `REACT_APP_ENVIRONMENT` - Environment (development/production)

### Production Optimization
- Minified bundles
- Optimized images
- CDN integration
- Performance monitoring

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Submit pull requests

## License

This project is licensed under the MIT License.
