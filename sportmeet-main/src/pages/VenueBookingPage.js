import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { venuesAPI, bookingsAPI, paymentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import PaymentForm from '../components/Payment/PaymentForm';
import ReviewForm from '../components/ReviewForm';
import DiscountCodeInput from '../components/Discount/DiscountCodeInput';
import ImageSlider from '../components/ImageSlider';
import PageMeta from '../components/SEO/PageMeta';
import {
  MapPin,
  Phone,
  Mail,
  Star,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  X,
  Share2,
  CalendarDays,
  Clock,
  CreditCard,
  Dumbbell,
  Map,
  ShieldCheck
} from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import toast from 'react-hot-toast';

const VenueBookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]); // array of { time }
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedCourts, setSelectedCourts] = useState([]); // multiple courts
  const [notes, setNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentModalKey, setPaymentModalKey] = useState(0);
  const [guestMode, setGuestMode] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';
  const API_ORIGIN = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '');
  const mediaUrl = (url) => {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
  };
  const fallbackVenueImage = `${API_ORIGIN}/media/demo/generated-venue.png`;

  const { data: venueData, isLoading: venueLoading } = useQuery(
    ['venue', id],
    () => venuesAPI.getVenue(id),
    {
      enabled: !!id
    }
  );

  // Pull raw availability windows from DB and build slots per court duration
  const { data: availabilityData, isLoading: availabilityLoading, refetch: refetchSlots } = useQuery(
    ['venue-availability', id, selectedDate, selectedCourt?.id],
    () => venuesAPI.getVenueAvailability(id, {
      start_date: selectedDate.toISOString().split('T')[0],
      end_date: selectedDate.toISOString().split('T')[0],
      court: selectedCourt?.id
    }),
    { enabled: !!id && !!selectedDate }
  );

  // Fetch existing bookings for the venue/day to disable occupied slots (best practice)
  const { data: bookedData } = useQuery(
    ['venue-booked-slots', id, selectedDate, (selectedCourts || []).map(c => c.id).join(',')],
    () => bookingsAPI.getVenueBookedSlots({
      venue: id,
      booking_date: selectedDate.toISOString().split('T')[0],
      courts: (selectedCourts && selectedCourts.length > 0) ? selectedCourts.map(c => c.id).join(',') : (selectedCourt ? selectedCourt.id : undefined),
    }),
    { enabled: !!id && !!selectedDate }
  );


  const venue = venueData?.data;
  const windows = Array.isArray(availabilityData?.data?.availability)
    ? availabilityData.data.availability
    : [];

  useEffect(() => {
    if (!venue?.id) return;
    const key = 'sportmeet_recent_venues';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const entry = {
      id: venue.id,
      name: venue.name,
      city: venue.city,
      image: venue.cover_image_url,
      viewed_at: new Date().toISOString(),
    };
    const next = [entry, ...current.filter((item) => item.id !== venue.id)].slice(0, 8);
    localStorage.setItem(key, JSON.stringify(next));
  }, [venue?.id, venue?.name, venue?.city, venue?.cover_image_url]);

  // Get available sports from venue
  const getAvailableSports = useCallback(() => {
    if (!venue?.courts) return [];
    const sports = [...new Set(venue.courts.map(court => court.sport))];
    return sports.sort();
  }, [venue?.courts]);

  // Filter courts based on selected sport
  const getFilteredCourts = useCallback(() => {
    if (!venue?.courts) return [];
    if (!selectedSport) return venue.courts;
    return venue.courts.filter(court => court.sport === selectedSport);
  }, [selectedSport, venue?.courts]);

  // Auto-select the first sport when venue data loads
  useEffect(() => {
    if (venue?.courts && venue.courts.length > 0 && !selectedSport) {
      const sports = getAvailableSports();
      if (sports.length > 0) {
        setSelectedSport(sports[0]);
      }
    }
  }, [venue?.courts, selectedSport, getAvailableSports]);

  // Auto-select the first court when sport is selected
  useEffect(() => {
    if (selectedSport && venue?.courts) {
      const filteredCourts = getFilteredCourts();
      if (filteredCourts.length > 0 && (!selectedCourt || selectedCourt.sport !== selectedSport)) {
        setSelectedCourt(filteredCourts[0]);
        setSelectedCourts([filteredCourts[0]]);
        setSelectedTimeSlots([]); // Reset time selection when court changes
      }
    }
  }, [selectedSport, venue?.courts, selectedCourt, getFilteredCourts]);

  // Refetch availability when selected court changes
  useEffect(() => {
    if (selectedCourt) {
      refetchSlots();
    }
  }, [selectedCourt, refetchSlots]);

  // Generate time slots for the day (deduplicated per selected court windows)
  const generateTimeSlots = () => {
    const slots = [];
    const step = selectedCourt?.booking_duration_minutes || 60;
    const seen = new Set();
    // Normalize bookings into comparable intervals
    const existingBookings = Array.isArray(bookedData?.data) ? bookedData.data : (Array.isArray(bookedData?.data?.results) ? bookedData.data.results : []);
    const bookings = (existingBookings || []).map((b) => {
      const start = (b.start_time || b.start || '').slice(0,5);
      const end = (b.end_time || b.end || '').slice(0,5);
      const courtId = b.courtId ?? b.court_id ?? b.court ?? (b.court && b.court.id);
      return { start, end, courtId };
    });
    const selectedCourtIds = (selectedCourts && selectedCourts.length > 0) ? new Set(selectedCourts.map(c => c.id)) : (selectedCourt ? new Set([selectedCourt.id]) : new Set());
    const toMinutes = (t) => { const [h,m]=(t||'00:00').split(':').map(Number); return h*60+m; };
    
    // Check if a time slot is available for ALL selected courts
    const isSlotAvailableForAllCourts = (startTime) => {
      const startM = toMinutes(startTime);
      const endM = startM + step;
      
      // For each selected court, check if this time slot is available
      for (const courtId of selectedCourtIds) {
        const hasConflict = bookings.some((bk) => {
          // Only check bookings for this specific court
          if (bk.courtId !== courtId) return false;
          const bs = toMinutes(bk.start);
          const be = toMinutes(bk.end);
          return Math.max(startM, bs) < Math.min(endM, be);
        });
        
        // If any court has a conflict, the slot is not available
        if (hasConflict) return false;
      }
      
      return true;
    };
    (windows || [])
      .filter((w) => w && w.is_available !== false)
      .forEach((w) => {
        const [sh, sm] = (w.start_time || '00:00').split(':').map(Number);
        const [eh, em] = (w.end_time || '00:00').split(':').map(Number);
        let minutes = sh * 60 + sm;
        const end = eh * 60 + em;
        while (minutes + step <= end) {
          const h = Math.floor(minutes / 60).toString().padStart(2, '0');
          const m = (minutes % 60).toString().padStart(2, '0');
          const time = `${h}:${m}`;
          if (!seen.has(time)) {
            seen.add(time);
            const isAvailable = isSlotAvailableForAllCourts(time);
            slots.push({
              time,
              available: isAvailable,
              price: selectedCourt?.price_per_duration || 0
            });
          }
          minutes += step;
        }
      });
    return slots.sort((a, b) => (a.time > b.time ? 1 : a.time < b.time ? -1 : 0));
  };

  const timeSlotsList = generateTimeSlots();

  const handleDateChange = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
    setSelectedTimeSlots([]);
  };

  const handleSportSelect = (sport) => {
    setSelectedSport(sport);
    setSelectedCourt(null);
    setSelectedTimeSlots([]);
  };

  const handleCourtSelect = (court) => {
    // Toggle selection for multi-court
    setSelectedCourts((prev) => {
      const exists = prev.find((c) => c.id === court.id);
      if (exists) {
        const next = prev.filter((c) => c.id !== court.id);
        // Keep a primary selected court for slot rendering
        if (selectedCourt && selectedCourt.id === court.id) {
          setSelectedCourt(next[0] || null);
          setSelectedTimeSlots([]);
        }
        return next;
      }
      // Add new court
      const next = [...prev, court];
      if (!selectedCourt) {
        setSelectedCourt(court);
        setSelectedTimeSlots([]);
      }
      return next;
    });
  };

  const handleTimeSlotSelect = (slot) => {
    if (!slot.available) return;
    const step = selectedCourt?.booking_duration_minutes || 60;
    const toMinutes = (t) => { const [h,m]=t.split(':').map(Number); return h*60+m; };
    const sortTimes = (arr) => arr.slice().sort((a,b)=> toMinutes(a.time)-toMinutes(b.time));
    // If empty, start selection
    if (selectedTimeSlots.length === 0) { setSelectedTimeSlots([slot]); return; }
    const sorted = sortTimes(selectedTimeSlots);
    const first = sorted[0];
    const last = sorted[sorted.length-1];
    const clickedMin = toMinutes(slot.time);
    const firstMin = toMinutes(first.time);
    const lastMin = toMinutes(last.time);
    // Toggle if already selected (shrink from ends only)
    const exists = selectedTimeSlots.find(s=>s.time===slot.time);
    if (exists) {
      // remove clicked; if middle removal would break contiguity, reset to just clicked
      const remaining = selectedTimeSlots.filter(s=>s.time!==slot.time);
      // ensure remaining are contiguous
      const remSorted = sortTimes(remaining);
      let contiguous = true;
      for (let i=1;i<remSorted.length;i++){
        if (toMinutes(remSorted[i].time) - toMinutes(remSorted[i-1].time) !== step){ contiguous=false; break; }
      }
      setSelectedTimeSlots(contiguous ? remaining : [slot]);
      return;
    }
    // Extend only if adjacent to either end; otherwise start a new selection from clicked
    if (clickedMin === firstMin - step) {
      setSelectedTimeSlots(sortTimes([...selectedTimeSlots, slot]));
    } else if (clickedMin === lastMin + step) {
      setSelectedTimeSlots(sortTimes([...selectedTimeSlots, slot]));
    } else {
      setSelectedTimeSlots([slot]);
    }
  };

  const handleBookingSubmit = async () => {
    if (!isAuthenticated && !guestMode) {
      setGuestMode(true);
      setIsGuestCheckout(false);
    }

    if (!selectedSport || selectedTimeSlots.length === 0 || !selectedCourt) {
      toast.error('Please select a sport, one or more time slots, and a court');
      return;
    }

    const minutesPerSlot = selectedCourt?.booking_duration_minutes || 60;
    const startTimeStr = selectedTimeSlots.map(s=>s.time).sort()[0];
    const [sh, sm] = startTimeStr.split(':').map(Number);
    const endMinutesTotal = sh * 60 + sm + minutesPerSlot * selectedTimeSlots.length;
    const endH = Math.floor(endMinutesTotal / 60) % 24;
    const endM = endMinutesTotal % 60;
    const endTimeStr = `${endH.toString().padStart(2, '0')}:${endM
      .toString()
      .padStart(2, '0')}`;

    // Preflight availability check (prevent paying for already-booked slots)
    try {
      const existing = Array.isArray(bookedData?.data) ? bookedData.data : (Array.isArray(bookedData?.data?.results) ? bookedData.data.results : []);
      const toMinutes = (t) => { const [h,m]=(t||'00:00').split(':').map(Number); return h*60+m; };
      const startM = toMinutes(startTimeStr);
      const endM = startM + minutesPerSlot * selectedTimeSlots.length;
      const selectedIds = (selectedCourts && selectedCourts.length > 0) ? new Set(selectedCourts.map(c=>c.id)) : new Set([selectedCourt.id]);
      const hasConflict = (existing || []).some((bk) => {
        const courtId = bk.courtId || bk.court_id || bk.court || bk.court?.id;
        if (!selectedIds.has(courtId)) return false;
        const bs = toMinutes(bk.start || bk.start_time);
        const be = toMinutes(bk.end || bk.end_time);
        return Math.max(startM, bs) < Math.min(endM, be);
      });
      if (hasConflict) {
        toast.error('Selected time overlaps with an existing booking. Please choose another time.');
        await refetchSlots();
        return;
      }
    } catch (e) {
      // If preflight fails, proceed but log it
      console.warn('Preflight availability check failed:', e);
    }

    // Prepare courts data for multi-court booking
    const courtsRaw = (selectedCourts && selectedCourts.length > 0) ? selectedCourts : (selectedCourt ? [selectedCourt] : []);
    const courts = Array.from(new Map((courtsRaw || []).map(c => [c.id, c])).values());
    
    const courtsData = courts.map(court => ({
      court_id: court.id,
      booking_date: selectedDate.toISOString().split('T')[0],
      start_time: startTimeStr,
      end_time: endTimeStr,
      duration_hours: (court.booking_duration_minutes || 60) * selectedTimeSlots.length / 60,
      price_per_hour: court.price_per_duration || 0,
      total_amount: (court.price_per_duration || 0) * selectedTimeSlots.length
    }));

    const bookingDataToStore = {
      venue: venue.id,
      booking_date: selectedDate.toISOString().split('T')[0],
      start_time: startTimeStr,
      end_time: endTimeStr,
      duration_hours: (selectedCourt?.booking_duration_minutes || 60) * selectedTimeSlots.length / 60,
      number_of_players: 1,
      total_amount: calculateTotalPrice(),
      notes: notes,
      special_requests: '',
      contact_phone: '',
      contact_email: '',
      courts: courtsData
    };

    const total = Number(calculateTotalPrice());
    if (!Number.isFinite(total) || total <= 0) {
      // Warn but do not block, in case venue/court pricing is 0 for testing
      toast.error('Total amount seems to be $0. Proceeding to payment for debugging.');
    }
    setBookingData(bookingDataToStore);
    // Force remount so PaymentForm useEffect runs reliably
    setPaymentModalKey((k) => k + 1);
    // Ensure modal opens after state commit (double trigger fallback)
    setTimeout(() => setShowPaymentModal(true), 0);
    setTimeout(() => setShowPaymentModal(true), 150);
  };

  const handlePaymentSuccess = async (paymentData) => {
    setIsBooking(true);
    try {
      const finalBookingData = {
        ...bookingData,
        payment_intent_id: paymentData.payment_intent_id,
        payment_status: 'paid'
      };
      
      let bookingResult;
      if ((isGuestCheckout || guestMode) && !isAuthenticated) {
        // Guest flow (no auth): include guest contact details
        const payload = {
          ...finalBookingData,
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone,
        };
        const res = await bookingsAPI.createGuestMultiCourtBooking(payload);
        bookingResult = res.data;
        // Confirm payment on backend to create Payment record
        try {
          await paymentsAPI.confirmPayment({ payment_intent_id: paymentData.payment_intent_id, booking_id: bookingResult.id });
        } catch (e) {
          console.warn('Guest confirmPayment warning:', e);
        }
      } else {
        // Authenticated flow
        const token = localStorage.getItem('token') || localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Authentication token not found. Please log in again.');
        }
        const response = await bookingsAPI.createMultiCourtBooking(finalBookingData);
        bookingResult = response.data;
        // Confirm payment to create Payment record for admin
        try {
          await paymentsAPI.confirmPayment({ payment_intent_id: paymentData.payment_intent_id, booking_id: bookingResult.id });
        } catch (e) {
          console.warn('ConfirmPayment warning:', e);
        }
      }
      console.log('Multi-court booking created:', bookingResult);

      // No extra confirm call needed; backend auto-confirms on create when payment is paid
      
      setShowPaymentModal(false);
      
      // Navigate to booking confirmation; pass booking in state for guest flow
      if ((isGuestCheckout || guestMode) && !isAuthenticated) {
        navigate(`/booking-confirmation/${bookingResult.id}` , { state: { booking: bookingResult, isGuest: true } });
      } else {
        navigate(`/booking-confirmation/${bookingResult.id}`);
      }
      
      // Refresh slots so the just-booked start becomes unavailable
      refetchSlots();
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const calculateTotalPrice = () => {
    if (selectedTimeSlots.length > 0 && (selectedCourt || (selectedCourts && selectedCourts.length > 0))) {
      const courts = (selectedCourts && selectedCourts.length > 0) ? selectedCourts : (selectedCourt ? [selectedCourt] : []);
      const baseSum = courts.reduce((sum, court) => {
        const price = Number(court?.price_per_duration || 0);
        return sum + price * selectedTimeSlots.length;
      }, 0);

      if (appliedDiscount) {
        return Number(appliedDiscount.final_amount);
      }
      return baseSum;
    }
    return 0;
  };

  const calculateOriginalPrice = () => {
    if (selectedTimeSlots.length > 0 && (selectedCourt || (selectedCourts && selectedCourts.length > 0))) {
      const courts = (selectedCourts && selectedCourts.length > 0) ? selectedCourts : (selectedCourt ? [selectedCourt] : []);
      return courts.reduce((sum, court) => sum + (Number(court?.price_per_duration || 0) * selectedTimeSlots.length), 0);
    }
    return 0;
  };

  const handleDiscountApplied = (discountData) => {
    setAppliedDiscount(discountData);
  };

  const handleDiscountRemoved = () => {
    setAppliedDiscount(null);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const bookingSteps = [
    { label: 'Sport', icon: Dumbbell, done: Boolean(selectedSport) },
    { label: 'Court', icon: Map, done: Boolean(selectedCourt) },
    { label: 'Time', icon: Clock, done: selectedTimeSlots.length > 0 },
    { label: 'Details', icon: CalendarDays, done: Boolean(selectedCourt && selectedTimeSlots.length > 0) },
    { label: 'Payment', icon: CreditCard, done: false },
  ];

  const selectedCourtNames = selectedCourts && selectedCourts.length > 0
    ? selectedCourts.map((court) => court.name).join(', ')
    : selectedCourt?.name || 'Choose a court';
  // Initialize map when venue data is loaded
  useEffect(() => {
    if (MAPBOX_TOKEN && venue && mapRef.current && !mapInstanceRef.current) {
      const { latitude, longitude } = venue || {};
      if (latitude && longitude) {
        mapboxgl.accessToken = MAPBOX_TOKEN;
        const map = new mapboxgl.Map({
          container: mapRef.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [longitude, latitude],
          zoom: 15
        });
        mapInstanceRef.current = map;
        const marker = new mapboxgl.Marker({ color: '#ef4444' })
          .setLngLat([longitude, latitude])
          .addTo(map);
        markerRef.current = marker;
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        return () => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          }
        };
      }
    }
  }, [venue, MAPBOX_TOKEN]);
  const handleViewOnMap = () => {
    if (venue?.latitude && venue?.longitude) {
      const url = `https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`;
      window.open(url, '_blank');
    }
  };

  if (venueLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Venue not found</p>
        <Button onClick={() => navigate('/venues')}>Back to Venues</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAF8]">
      <PageMeta
        title={venue?.name || 'Venue Booking'}
        description={venue?.description || 'View venue details, courts, availability, pricing, and book sports courts online.'}
        image={venue?.cover_image_url || undefined}
        type="place"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate('/venues')}
          className="mb-6 flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Venues</span>
        </Button>

        <section className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-[320px]">
              <img
                src={mediaUrl(venue.cover_image_url) || mediaUrl(venue.gallery_images?.[0]?.image) || fallbackVenueImage}
                alt={venue.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-bold ring-1 ring-white/20">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified venue
                  </span>
                  {venue.average_rating && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-bold ring-1 ring-white/20">
                      <Star className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300" />
                      {venue.average_rating}
                    </span>
                  )}
                </div>
                <h1 className="max-w-3xl text-3xl font-extrabold md:text-4xl">{venue.name}</h1>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-200">
                  <MapPin className="h-4 w-4" />
                  {venue.address}, {venue.city}, {venue.state} {venue.postcode}
                </p>
              </div>
            </div>
            <div className="p-6 lg:p-8">
              <p className="text-sm font-bold uppercase tracking-wide text-primary-700">Booking flow</p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">Choose your court and time</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Select a sport, one or more courts, adjacent time slots, then confirm payment.
              </p>
              <div className="mt-6 grid gap-3">
                {bookingSteps.map((step, index) => {
                  const Icon = step.icon;
                  const active = !step.done && bookingSteps.slice(0, index).every((item) => item.done);
                  return (
                    <div key={step.label} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${step.done ? 'border-primary-200 bg-primary-50' : active ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50'}`}>
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${step.done ? 'bg-primary-500 text-white' : active ? 'bg-slate-950 text-white' : 'bg-white text-slate-400'}`}>
                        {step.done ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-950">{index + 1}. {step.label}</p>
                        <p className="text-xs text-slate-500">{step.done ? 'Completed' : active ? 'Current step' : 'Pending'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Venue Information */}
          <div className="lg:col-span-1">
            {Array.isArray(venue?.gallery_images) && venue.gallery_images.length > 0 && (
              <Card className="p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Photos</h2>
                <ImageSlider images={venue.gallery_images} className="w-full" />
              </Card>
            )}
            <Card className="p-6 sticky top-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{venue.name}</h1>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{venue.address}, {venue.city}, {venue.state} {venue.postcode}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{venue.phone_number}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{venue.email}</span>
                </div>
                {/* Removed Capacity and From $/hour as requested */}
                <div className="flex items-center space-x-2 text-gray-600">
                  <Star className="w-4 h-4" />
                  <span>Rating: {venue.average_rating || 'N/A'}</span>
                </div>
              </div>

              <p className="text-gray-700 mb-6">{venue.description}</p>

              <div className="mb-6">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: venue.name,
                        text: venue.description,
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Venue link copied to clipboard!');
                    }
                  }}
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </Button>
              </div>

              {/* Write a Review entry */}
              <div className="mb-6">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => (isAuthenticated ? setShowReviewForm(true) : navigate('/login'))}
                >
                  Write a Review
                </Button>
              </div>

              {(() => {
                let sportsArray = [];
                if (Array.isArray(venue.sport_categories)) {
                  sportsArray = venue.sport_categories;
                } else if (typeof venue.sport_categories === 'string') {
                  try {
                    const parsed = JSON.parse(venue.sport_categories);
                    sportsArray = Array.isArray(parsed) ? parsed : [];
                  } catch (e) {
                    sportsArray = [];
                  }
                }
                return sportsArray.length > 0;
              })() && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Sports Available</h3>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      let sportsArray = [];
                      if (Array.isArray(venue.sport_categories)) {
                        sportsArray = venue.sport_categories;
                      } else if (typeof venue.sport_categories === 'string') {
                        try {
                          const parsed = JSON.parse(venue.sport_categories);
                          sportsArray = Array.isArray(parsed) ? parsed : [];
                        } catch (e) {
                          sportsArray = [];
                        }
                      }
                      return sportsArray.map((sport, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                      >
                        {sport}
                      </span>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {(() => {
                // Handle different data types for amenities
                let amenitiesArray = [];
                if (Array.isArray(venue.amenities)) {
                  amenitiesArray = venue.amenities;
                } else if (typeof venue.amenities === 'string') {
                  try {
                    amenitiesArray = JSON.parse(venue.amenities);
                  } catch (e) {
                    amenitiesArray = [venue.amenities];
                  }
                }
                return amenitiesArray && amenitiesArray.length > 0;
              })() && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      let amenitiesArray = [];
                      if (Array.isArray(venue.amenities)) {
                        amenitiesArray = venue.amenities;
                      } else if (typeof venue.amenities === 'string') {
                        try {
                          amenitiesArray = JSON.parse(venue.amenities);
                        } catch (e) {
                          amenitiesArray = [venue.amenities];
                        }
                      }
                      return amenitiesArray.map((amenity, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {amenity}
                        </span>
                      ));
                    })()}
                  </div>
                </div>
              )}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Location</h3>
                <div ref={mapRef} className="h-64 bg-gray-200 rounded-lg" style={{ minHeight: '256px' }}>
                  {(!MAPBOX_TOKEN || !venue?.latitude) && (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">{MAPBOX_TOKEN ? 'Map View' : 'Map unavailable until Mapbox is configured'}</p>
                      </div>
                    </div>
                  )}
                </div>
                <Button variant="outline" className="w-full mt-4" onClick={handleViewOnMap} disabled={!venue?.latitude}>
                  <MapPin className="w-4 h-4 mr-2" />
                  View on Map
                </Button>
              </div>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="border-b border-slate-100 bg-white p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-primary-700">Reserve your slot</p>
                    <h2 className="mt-1 text-2xl font-extrabold text-slate-950">Book Your Session</h2>
                    <p className="mt-2 text-sm text-slate-600">Selections update the summary and payment amount automatically.</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    <p className="font-bold text-slate-950">{selectedCourtNames}</p>
                    <p className="mt-1 text-slate-500">
                      {selectedTimeSlots.length > 0 ? `${selectedTimeSlots.length} selected slot(s)` : 'No time selected yet'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">

              {/* Date Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select Date</h3>
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => handleDateChange(-1)}
                    disabled={selectedDate <= new Date()}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-900">{formatDate(selectedDate)}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleDateChange(1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Sport Selection */}
              {getAvailableSports().length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Select Sport</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {getAvailableSports().map((sport) => (
                      <button
                        key={sport}
                        onClick={() => handleSportSelect(sport)}
                        className={`p-3 border-2 rounded-lg text-center transition-colors ${
                          selectedSport === sport
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <span className="font-medium">{sport}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Court Selection - Only show when sport is selected (multi-select) */}
              {selectedSport && getFilteredCourts().length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Select Court for {selectedSport}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getFilteredCourts().map((court) => (
                      <button
                        key={court.id}
                        onClick={() => handleCourtSelect(court)}
                        className={`p-4 border-2 rounded-lg text-left transition-colors ${
                          (selectedCourts.find(c => c.id === court.id))
                          ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <h4 className="font-medium text-gray-900">{court.name}</h4>
                        <p className="text-sm text-gray-600">{court.sport}</p>
                        <p className="text-sm text-gray-600">
                          {court.is_indoor ? 'Indoor' : 'Outdoor'} - Max {court.max_players} players
                        </p>
                        <p className="text-sm text-gray-600">Duration: {court.booking_duration_minutes || 60} min</p>
                        <p className="text-sm font-medium text-gray-900">${court.price_per_duration || 0}/slot</p>
                        {(selectedCourts.find(c => c.id === court.id)) && (
                          <div className="mt-2 inline-block px-2 py-0.5 text-xs rounded-full bg-primary-100 text-primary-700">Selected</div>
                        )}
                      </button>
                    ))}
                  </div>
                  {selectedCourts.length > 1 && (
                    <p className="mt-2 text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded px-2 py-1">Selected {selectedCourts.length} courts. Time slots below will be applied to all selected courts.</p>
                  )}
                </div>
              )}

              {/* Time Slot Selection - Only show when a court is selected */}
              {selectedCourt && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Select Time</h3>
                  <p className="text-xs text-gray-500 mb-3">Select multiple adjacent slots to extend your session.</p>
                  {timeSlotsList.length > 0 ? (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {timeSlotsList.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => handleTimeSlotSelect(slot)}
                          disabled={!slot.available}
                          className={`p-3 text-sm rounded-lg border transition-colors ${
                            selectedTimeSlots.find(s=>s.time===slot.time)
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : slot.available
                              ? 'border-gray-200 hover:border-gray-300 text-gray-700'
                              : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      No slots are published for this court and date yet. Try another date or court, or contact the venue from the details panel.
                    </div>
                  )}
                  {availabilityLoading && (
                    <div className="flex items-center justify-center py-4">
                      <LoadingSpinner size="sm" />
                      <span className="ml-2 text-sm text-gray-600">Loading availability...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Duration Selection - Only show when a court is selected */}
              {selectedCourt && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Duration</h3>
                  <div className="text-lg font-medium text-gray-900">
                    {selectedTimeSlots.length} x {selectedCourt?.booking_duration_minutes || 60} min
                  </div>
                </div>
              )}

              {/* Notes - Only show when a court is selected */}
              {selectedCourt && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Any special requirements or notes..."
                  />
                </div>
              )}

              {/* Booking Summary - Only show when a court is selected */}
              {selectedCourt && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Booking Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="text-gray-900">{formatDate(selectedDate)}</span>
                    </div>
                    {selectedSport && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sport:</span>
                        <span className="text-gray-900">{selectedSport}</span>
                      </div>
                    )}
                    {selectedTimeSlots.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="text-gray-900">{selectedTimeSlots.map(s=>s.time).sort().join(', ')}</span>
                      </div>
                    )}
                    {selectedCourt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Court:</span>
                        <span className="text-gray-900">{selectedCourt.name}</span>
                      </div>
                    )}
                    {selectedCourts && selectedCourts.length > 1 && (
                      <div>
                        <div className="text-gray-600">Additional Courts:</div>
                        <ul className="list-disc ml-5 text-gray-900">
                          {selectedCourts
                            .filter((c) => !selectedCourt || c.id !== selectedCourt.id)
                            .map((c) => (
                              <li key={c.id}>{c.name} {c.sport ? `- ${c.sport}` : ''} (${c.price_per_duration || 0}/slot)</li>
                            ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex justify-between"><span className="text-gray-600">Duration:</span><span className="text-gray-900">{selectedTimeSlots.length} x {selectedCourt?.booking_duration_minutes || 60} min</span></div>
                    
                    {/* Discount Display */}
                    {appliedDiscount && (
                      <>
                        <div className="flex justify-between text-green-600">
                          <span>Discount ({appliedDiscount.discount.discount_type === 'percentage' ? `${appliedDiscount.discount.value}%` : `$${appliedDiscount.discount.value}`}):</span>
                          <span>-${(calculateOriginalPrice() - appliedDiscount.final_amount).toFixed(2)} AUD</span>
                        </div>
                        <div className="flex justify-between font-medium text-green-600">
                          <span>Total Price:</span>
                          <span>${calculateTotalPrice().toFixed(2)} AUD</span>
                        </div>
                      </>
                    )}
                    
                    {!appliedDiscount && (
                      <div className="flex justify-between font-medium">
                        <span className="text-gray-900">Total Price:</span>
                        <span className="text-gray-900">${calculateTotalPrice().toFixed(2)} AUD</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Discount Code Input */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <DiscountCodeInput
                      bookingType="venue"
                      venueId={venue?.id}
                      amount={calculateOriginalPrice()}
                      onDiscountApplied={handleDiscountApplied}
                      onDiscountRemoved={handleDiscountRemoved}
                      appliedDiscount={appliedDiscount}
                    />
                  </div>
                </div>
              )}

              {/* No sport/court selected message */}
              {!selectedSport && (
                <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-primary-600" />
                    <span className="text-sm text-primary-800">
                      Please select a sport above to see available courts and proceed with booking.
                    </span>
                  </div>
                </div>
              )}

              {selectedSport && !selectedCourt && (
                <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-primary-600" />
                    <span className="text-sm text-primary-800">
                      Please select a court for {selectedSport} to see available time slots and proceed with booking.
                    </span>
                  </div>
                </div>
              )}

              {/* Book Button - Only show when a court is selected */}
              {selectedCourt && (
                <Button
                  onClick={handleBookingSubmit}
                  disabled={selectedTimeSlots.length === 0 || !selectedCourt || isBooking}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  {isBooking ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>
                    {isBooking ? 'Creating Booking...' : 'Book Now - $' + calculateTotalPrice().toFixed(2) + ' AUD'}
                  </span>
                </Button>
              )}

              {!isAuthenticated && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      Login to save this booking to your dashboard, or continue as a guest when you click Book Now.
                    </span>
                  </div>
                </div>
              )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {selectedCourt && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white p-3 shadow-lg lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{venue?.name}</p>
              <p className="text-xs text-gray-600">
                {selectedTimeSlots.length > 0
                  ? `${selectedTimeSlots.length} slot(s) - $${calculateTotalPrice().toFixed(2)} ${venue?.currency || 'AUD'}`
                  : 'Select a time slot to book'}
              </p>
            </div>
            <Button
              onClick={handleBookingSubmit}
              disabled={selectedTimeSlots.length === 0 || isBooking}
              className="shrink-0"
            >
              Book
            </Button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="flex items-center justify-center min-h-screen p-4 overflow-y-auto">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Complete Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Venue:</span>
                <span className="font-medium">{venue?.name}</span>
              </div>
              {selectedSport && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Sport:</span>
                  <span className="font-medium">{selectedSport}</span>
                </div>
              )}
              {selectedCourts && selectedCourts.length > 1 ? (
                <div className="mb-2">
                  <div className="text-gray-600">Courts:</div>
                  <ul className="list-disc ml-5">
                    {selectedCourts.map((c) => (
                      <li key={c.id} className="font-medium">{c.name}{c.sport ? ` - ${c.sport}` : ''} (${c.price_per_duration || 0}/slot)</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Court:</span>
                  <span className="font-medium">{selectedCourt?.name}</span>
                </div>
              )}
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{selectedDate.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">{selectedTimeSlots.map(s=>s.time).sort().join(', ')}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{selectedTimeSlots.length} slot(s)</span>
              </div>
              
              {/* Discount Code Input */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <DiscountCodeInput
                  bookingType="venue"
                  venueId={venue?.id}
                  amount={calculateOriginalPrice()}
                  onDiscountApplied={handleDiscountApplied}
                  onDiscountRemoved={handleDiscountRemoved}
                  appliedDiscount={appliedDiscount}
                />
              </div>
              
              {/* Guest/Login choice modal (only when not authenticated) */}
              {!isAuthenticated && guestMode && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">How would you like to continue?</h3>
                    <p className="text-sm text-gray-600 mb-4 text-center">Login to book, or continue as guest.</p>
                    <div className="grid grid-cols-1 gap-3 mb-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => { setIsGuestCheckout(false); setGuestMode(false); navigate('/login'); }}
                      >
                        Login to Book
                      </Button>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Full Name</label>
                          <input
                            type="text"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Your name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="you@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={guestPhone}
                            onChange={(e) => setGuestPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="+61..."
                          />
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        className="w-full"
                        disabled={!(guestName && guestEmail && guestPhone)}
                        onClick={() => { setIsGuestCheckout(true); setGuestMode(false); }}
                      >
                        Continue as Guest
                      </Button>
                    </div>
                    <Button variant="ghost" className="w-full" onClick={() => setGuestMode(false)}>Close</Button>
                  </div>
                </div>
              )}

              {/* Block payment until guest details are filled */}
              {(!isAuthenticated && guestMode) && !(guestName && guestEmail && guestPhone) && (
                <div className="mt-4 text-sm text-red-600">
                  Please enter guest name, email and phone to enable payment.
                </div>
              )}
              {/* Price Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                {appliedDiscount ? (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Original Price:</span>
                      <span className="font-medium">${calculateOriginalPrice().toFixed(2)} AUD</span>
                    </div>
                    <div className="flex justify-between items-center mb-2 text-green-600">
                      <span>Discount ({appliedDiscount.discount.discount_type === 'percentage' ? `${appliedDiscount.discount.value}%` : `$${appliedDiscount.discount.value}`}):</span>
                      <span className="font-medium">-${(calculateOriginalPrice() - appliedDiscount.final_amount).toFixed(2)} AUD</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-green-600">${calculateTotalPrice().toFixed(2)} AUD</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    <span>${calculateTotalPrice().toFixed(2)} AUD</span>
                  </div>
                )}
              </div>
            </div>

            <PaymentForm
              key={paymentModalKey}
              amount={calculateTotalPrice()}
              currency={venue?.currency || 'AUD'}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPaymentModal(false)}
              showAmount={false}
            />
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <ReviewForm
              venueId={venue?.id}
              onClose={() => setShowReviewForm(false)}
              onSuccess={() => setShowReviewForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueBookingPage;
