import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  timeout: 20000,
});

// Request interceptor to add auth token and cache busting
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const url = config.url || '';
    const isAuthLoginOrRegister = url.startsWith('/auth/login') || url.startsWith('/auth/register');
    // Allow token for admin social updates; skip only for public social login endpoints
    const isPublicSocial = (
      url === '/auth/social/facebook/' ||
      url === '/auth/social/google/' ||
      url === '/auth/social/providers/' ||
      url === '/auth/social/urls/'
    );
    const skipAuthHeader = isAuthLoginOrRegister || isPublicSocial;
    if (token && !skipAuthHeader) {
      config.headers.Authorization = `Token ${token}`;
      console.log('API Request with token:', config.url, 'Token:', token.substring(0, 10) + '...');
    } else {
      console.log('API Request without token:', config.url);
    }
    
    // Add cache busting only for specific GET requests (not for auth, events, venues, users, bookings, payments)
    if (config.method === 'get' && 
        !config.url.includes('/auth/') && 
        !config.url.includes('/events/') &&
        !config.url.includes('/venues/') &&
        !config.url.includes('/users/') &&
        !config.url.includes('/bookings/') &&
        !config.url.includes('/payments/') &&
        !config.url.includes('/reviews/') &&
        !config.url.includes('/venues/sports/') &&
        !config.url.includes('/venues/amenities/')) {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
      
      // Add cache-busting headers only for specific GET requests
      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      config.headers['Pragma'] = 'no-cache';
      config.headers['Expires'] = '0';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Error:', error.response?.status, error.response?.data, error.message);
    if (error.response?.status === 401) {
      console.log('401 Unauthorized - redirecting to login');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials) => {
    console.log('API Login request:', credentials);
    console.log('API Base URL:', API_BASE_URL);
    console.log('Full URL:', `${API_BASE_URL}/auth/login/`);
    try {
      const response = await api.post('/auth/login/', credentials);
      console.log('API Login response:', response);
      return response;
    } catch (error) {
      console.error('API Login error:', error);
      throw error;
    }
  },
  register: (userData) => api.post('/auth/register/', userData),
  logout: () => api.post('/auth/logout/'),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (profileData) => api.put('/auth/profile/update/', profileData),
  changePassword: (passwordData) => api.post('/auth/change-password/', passwordData),
  
  // Social authentication
  facebookLogin: (accessToken) => api.post('/auth/social/facebook/', { access_token: accessToken }),
  googleLogin: (data) => api.post('/auth/social/google/', data), // Can be { access_token: token } or { credential: jwt }
  getSocialProviders: () => api.get('/auth/social/providers/'),
  getSocialLoginUrls: () => api.get('/auth/social/urls/'),
  updateSocialKeys: (data) => api.post('/auth/social/update-keys/', data),
};

// Venues API
export const venuesAPI = {
  getVenues: (params) => {
    const clean = { ...(params || {}) };
    // Public venues default to approved only
    if (clean.status === undefined) clean.status = 'approved';
    return api.get('/venues/', { params: clean });
  },
  getAdminVenues: (params) => api.get('/venues/admin/', { params }),
  getVenue: (id) => api.get(`/venues/${id}/`),
  updateVenue: (id, venueData) => {
    // Always target backend update endpoint
    const url = `/venues/${id}/update/`;
    if (venueData instanceof FormData) {
      return api.put(url, venueData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.put(url, venueData);
  },
  deleteVenue: (id) => api.delete(`/venues/${id}/`),
  updateVenueStatus: (id, status) => api.patch(`/venues/${id}/`, { status }),
  createVenue: (venueData) => {
    // Check if it's FormData (for file uploads)
    if (venueData instanceof FormData) {
      return api.post('/venues/create/', venueData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    // Regular JSON data
    return api.post('/venues/create/', venueData);
  },
  searchVenues: (params) => api.get('/venues/search/', { params }),
  getNearbyVenues: (params) => api.get('/venues/nearby/', { params }),
  getVenueStats: () => api.get('/venues/stats/'),
  getUserVenues: () => api.get('/venues/my-venues/'),
  getVenueBookings: (params) => api.get('/bookings/venue-bookings/', { params }),
  getVenueAvailability: (id, params) => api.get(`/venues/${id}/availability/`, { params }),
  getVenuePricing: (id) => api.get(`/venues/${id}/pricing/`),
  getSports: () => api.get('/venues/sports/'),
  createSport: (data) => api.post('/venues/sports/create/', data),
  
  // Users API
  getUsers: (params) => api.get('/users/', { params }),
  getUser: (id) => api.get(`/users/${id}/`),
  updateUser: (id, data) => api.patch(`/users/${id}/`, data),
  updateUserStatus: (id, status) => api.patch(`/users/${id}/`, { is_active: status === 'active' }),
  deleteUser: (id) => api.delete(`/users/${id}/`),
  
  // Venue Owners API
  getVenueOwners: (params) => api.get('/users/venue-owners/', { params }),
  getVenueOwner: (id) => api.get(`/users/venue-owners/${id}/`),
  updateVenueOwner: (id, data) => api.patch(`/users/venue-owners/${id}/`, data),
  deleteVenueOwner: (id) => api.delete(`/users/venue-owners/${id}/`),
  updateSport: (id, data) => api.put(`/venues/sports/${id}/update/`, data),
  deleteSport: (id) => api.delete(`/venues/sports/${id}/delete/`),
  getAmenities: () => api.get('/venues/amenities/'),
  createAmenity: (data) => api.post('/venues/amenities/create/', data),
  updateAmenity: (id, data) => api.put(`/venues/amenities/${id}/update/`, data),
  deleteAmenity: (id) => api.delete(`/venues/amenities/${id}/delete/`),
};

// Bookings API
export const bookingsAPI = {
  // Admin APIs
  getAdminBookings: (params) => api.get('/bookings/admin/', { params }),
  getAdminBookingStats: () => api.get('/bookings/admin/stats/'),
  updateBookingStatus: (id, status) => api.patch(`/bookings/${id}/update-status/`, { status }),
  
  // User APIs
  getBookings: (params) => api.get('/bookings/', { params }),
  getBooking: (id) => api.get(`/bookings/${id}/`),
  createBooking: (bookingData) => api.post('/bookings/', bookingData),
  updateBooking: (id, bookingData) => api.put(`/bookings/${id}/`, bookingData),
  cancelBooking: (id, cancellationData) => api.post(`/bookings/${id}/cancel/`, cancellationData),
  getUserBookings: (params) => api.get('/bookings/my-bookings/', { params }),
  // Owner's venue bookings list
  getVenueBookings: (params) => api.get('/bookings/venue-bookings/', { params }),
  // For slot disabling per court/date
  getVenueBookedSlots: (params) => api.get('/bookings/venue-booked-slots/', { params }),
  getBookingStats: () => api.get('/bookings/stats/'),
  getVenueBookingStats: (venueId) => api.get(`/bookings/venue/${venueId}/stats/`),
  getTimeSlots: (params) => api.get('/bookings/time-slots/', { params }),
  createMultiCourtBooking: (bookingData) => api.post('/bookings/multi-court/', bookingData),
  createReview: (bookingId, reviewData) => api.post(`/bookings/${bookingId}/review/`, reviewData),
  // Guest booking (no auth required)
  createGuestMultiCourtBooking: (bookingData) => axios.post(`${API_BASE_URL}/bookings/guest-multi-court/`, bookingData, { headers: { 'Content-Type': 'application/json' } }),
};

// Events API
export const eventsAPI = {
  getEvents: (params) => api.get('/events/', { params }),
  getAdminEvents: (params) => api.get('/events/admin/', { params }),
  getEvent: (id) => api.get(`/events/${id}/`),
  createEvent: (eventData) => {
    // Handle FormData for file uploads
    if (eventData instanceof FormData) {
      return api.post('/events/', eventData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    // Regular JSON data
    return api.post('/events/', eventData);
  },
  updateEvent: (id, eventData) => {
    if (eventData instanceof FormData) {
      return api.put(`/events/${id}/`, eventData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.put(`/events/${id}/`, eventData);
  },
  deleteEvent: (id) => api.delete(`/events/${id}/`),
  getUserEvents: (params) => api.get('/events/my-events/', { params }),
  getUserParticipations: (params) => api.get('/events/my-participations/', { params }),
  registerEvent: (id, registrationData) => api.post(`/events/${id}/register/`, registrationData),
  unregisterEvent: (id) => api.post(`/events/${id}/unregister/`),
  addComment: (id, commentData) => api.post(`/events/${id}/comment/`, commentData),
  getEventStats: () => api.get('/events/stats/'),
  getEventBookings: (params) => api.get('/events/bookings/', { params }),
};

// Reviews API
export const reviewsAPI = {
  getReviews: (params) => {
    const clean = {};
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) clean[k] = v;
    });
    // Default to approved=true only when not scoped to a specific venue or venue_owner
    if (clean.is_approved === undefined && !clean.venue && !clean.venue_owner) clean.is_approved = true;
    if (clean.is_approved === 'true') clean.is_approved = true;
    if (clean.is_approved === 'false') clean.is_approved = false;
    if (typeof clean.overall_rating === 'string' && clean.overall_rating !== '') {
      const n = Number(clean.overall_rating);
      if (!Number.isNaN(n)) clean.overall_rating = n;
    }
    // Important: for venue owners (venue_owner=me) use the public endpoint which supports owner scoping
    if (clean.venue_owner) {
      return api.get('/reviews/', { params: clean }).then(r => r.data);
    }
    // Otherwise try admin endpoint first (for staff), fall back to public
    return api
      .get('/reviews/admin/', { params: clean })
      .then(r => r.data)
      .catch(() => api.get('/reviews/', { params: clean }).then(r => r.data));
  },
  getReview: (id) => api.get(`/reviews/${id}/`).then(r => r.data),
  createReview: (reviewData) => api.post('/reviews/', reviewData).then(r => r.data),
  updateReview: (id, reviewData) => api.put(`/reviews/${id}/`, reviewData).then(r => r.data),
  deleteReview: (id) => api.delete(`/reviews/${id}/`).then(r => r.data),
  getVenueReviews: (venueId) => api.get(`/reviews/venue/${venueId}/`).then(r => r.data),
};

// Payments API
export const paymentsAPI = {
  // Admin APIs
  getAdminPayments: (params) => api.get('/payments/admin/', { params }),
  getAdminPaymentStats: () => api.get('/payments/admin/stats/'),
  
  // User APIs
  getPayments: (params) => api.get('/payments/', { params }),
  getPayment: (id) => api.get(`/payments/${id}/`),
  createPaymentIntent: (data) => api.post('/payments/create-intent/', data),
  confirmPayment: (data) => api.post('/payments/confirm/', data),
  createRefund: (id, refundData) => api.post(`/payments/${id}/refund/`, refundData),
  getPaymentMethods: () => api.get('/payments/methods/'),
  setupPaymentMethod: () => api.post('/payments/setup-method/'),
};

// Reports API
export const reportsAPI = {
  getReports: (params) => api.get('/reports/', { params }),
  getReport: (id) => api.get(`/reports/${id}/`),
  createReport: (reportData) => api.post('/reports/', reportData),
  updateReport: (id, reportData) => api.put(`/reports/${id}/`, reportData),
  deleteReport: (id) => api.delete(`/reports/${id}/`),
  getDashboardStats: () => api.get('/reports/dashboard/'),
  getVenueAnalytics: () => api.get('/reports/venue-analytics/'),
  getBookingAnalytics: () => api.get('/reports/booking-analytics/'),
  getRevenueReport: () => api.get('/reports/revenue-report/'),
  getUserActivityReport: () => api.get('/reports/user-activity/'),
  generateReport: (id) => api.post(`/reports/${id}/generate/`),
};

// Discounts API
export const discountsAPI = {
  getDiscounts: (params) => api.get('/discounts/', { params }),
  getDiscount: (id) => api.get(`/discounts/${id}/`),
  createDiscount: (data) => api.post('/discounts/', data),
  updateDiscount: (id, data) => api.put(`/discounts/${id}/`, data),
  deleteDiscount: (id) => api.delete(`/discounts/${id}/`),
  validateDiscount: (discountData) => api.post('/discounts/validate/', discountData),
  applyDiscount: (discountData) => api.post('/discounts/apply/', discountData),
  getUserDiscounts: () => api.get('/discounts/user-discounts/'),
  getDiscountStats: () => api.get('/discounts/stats/'),
  getDiscountUsage: (params) => api.get('/discounts/usage/', { params }),
};

// Core API
export const coreAPI = {
  healthCheck: () => api.get('/core/health/'),
  getPlatformStats: () => api.get('/core/stats/'),
  getSiteSettings: () => api.get('/core/site-settings/'),
  updateBranding: (formData) => api.put('/core/branding/update/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getSliderImages: () => api.get('/core/slider-images/'),
  getPublicSliderImages: () => api.get('/core/slider-images/public/'),
  createSliderImage: (formData) => api.post('/core/slider-images/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateSliderImage: (id, formData) => api.put(`/core/slider-images/${id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteSliderImage: (id) => api.delete(`/core/slider-images/${id}/`),
  
  // Admin dashboard APIs
  getAdminDashboardStats: () => api.get('/core/admin/dashboard-stats/'),
  getAdminRecentActivity: (params) => {
    const clean = {};
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) clean[k] = v;
    });
    return api.get('/core/admin/recent-activity/', { params: clean });
  },
  getAdminTopVenues: () => api.get('/core/admin/top-venues/'),
};

export default api;
