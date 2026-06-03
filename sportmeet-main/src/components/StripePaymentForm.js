import React, { useState } from 'react';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import Button from './UI/Button';
import LoadingSpinner from './UI/LoadingSpinner';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import getStripe from '../config/stripe';

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

const PaymentForm = ({ event, onSuccess, onError, isLoading }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    if (!event) {
      setError('Event details are missing. Please reload the page.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const response = await fetch((process.env.REACT_APP_API_URL || 'http://16.50.106.43:8082/api') + '/payments/create-intent/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: parseFloat(event?.entry_fee || 0),
          currency: event?.currency || 'AUD',
          event_id: event?.id,
          metadata: {
            event_title: event?.title || 'Event',
            event_date: event?.start_date || ''
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        data.client_secret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: 'Event Participant',
            },
          }
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        setProcessing(false);
      } else if (paymentIntent.status === 'succeeded') {
        setSucceeded(true);
        setProcessing(false);
        
        // Confirm payment on backend
      const confirmResponse = await fetch((process.env.REACT_APP_API_URL || 'http://16.50.106.43:8082/api') + '/payments/confirm/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            payment_intent_id: paymentIntent.id,
          event_id: event?.id
          })
        });

        if (confirmResponse.ok) {
          onSuccess(paymentIntent);
        } else {
          throw new Error('Failed to confirm payment');
        }
      }
    } catch (err) {
      setError(err.message);
      setProcessing(false);
      onError(err);
    }
  };

  if (succeeded) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Successful!</h3>
        <p className="text-gray-600">You have been registered for this event.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Event:</span>
            <span className="font-medium">{event.title}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Amount:</span>
            <span className="font-medium">${event.entry_fee} {event.currency}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Card Information
        </label>
        <div className="p-4 border border-gray-300 rounded-lg">
          <CardElement options={cardElementOptions} />
        </div>
        {error && (
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={!stripe || processing || isLoading}
        className="w-full flex items-center justify-center space-x-2"
      >
        {processing ? (
          <>
            <LoadingSpinner size="sm" />
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            <span>Pay ${event.entry_fee} {event.currency}</span>
          </>
        )}
      </Button>
    </form>
  );
};

const StripePaymentForm = ({ event, onSuccess, onError, isLoading }) => {
  const stripePromise = getStripe();
  
  if (!stripePromise) {
    return (
      <div className="p-4 border border-red-200 rounded bg-red-50 text-red-800 text-sm">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>Stripe is not configured. Please check your environment variables.</span>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm
        event={event}
        onSuccess={onSuccess}
        onError={onError}
        isLoading={isLoading}
      />
    </Elements>
  );
};

export default StripePaymentForm;
