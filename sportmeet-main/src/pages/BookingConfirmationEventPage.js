import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { CheckCircle, Calendar, MapPin, DollarSign } from 'lucide-react';

const BookingConfirmationEventPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const evt = location.state?.event || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">You're booked!</h1>
            <p className="text-gray-600 mb-8">Your event registration was successful.</p>

            <div className="w-full text-left bg-gray-50 p-6 rounded-lg mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Event</div>
                  <div className="font-medium text-gray-900">{evt.title || 'Event'}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div className="text-gray-900">{evt.start_date || ''} {evt.start_time || ''}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div className="text-gray-900">{evt.venue_name || 'Venue'}</div>
                </div>
                {evt.entry_fee > 0 && (
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <div className="text-gray-900">Paid: ${evt.entry_fee} {evt.currency}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <Button onClick={() => navigate('/events')} className="sm:w-auto w-full">Back to Events</Button>
              <Button variant="outline" onClick={() => navigate(`/events/${evt.id || ''}`)} className="sm:w-auto w-full">View Event</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BookingConfirmationEventPage;


