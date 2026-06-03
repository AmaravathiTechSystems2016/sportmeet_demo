import React, { useState, useEffect, useCallback } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { paymentsAPI } from '../../services/api';
import Button from '../UI/Button';
import Card from '../UI/Card';
import LoadingSpinner from '../UI/LoadingSpinner';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';
import getStripe from '../../config/stripe';

const PaymentFormComponent = ({ 
  amount, 
  currency = 'AUD', 
  bookingId, 
  eventId, 
  onSuccess, 
  onCancel,
  showAmount = true
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState(null);

  const createPaymentIntent = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await paymentsAPI.createPaymentIntent({
        amount: amount,
        currency: currency,
        booking_id: bookingId,
        event_id: eventId
      });
      
      setClientSecret(response.data.client_secret);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create payment intent');
      toast.error('Payment initialization failed');
    } finally {
      setIsLoading(false);
    }
  }, [amount, bookingId, currency, eventId]);

  useEffect(() => {
    createPaymentIntent();
  }, [createPaymentIntent]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Cardholder Name', // You can get this from user profile
          },
        },
      });

      if (error) {
        // Handle case where intent is already confirmed/succeeded
        const alreadySucceeded =
          (error.code === 'payment_intent_unexpected_state' &&
           error.payment_intent && error.payment_intent.status === 'succeeded');
        if (alreadySucceeded) {
          // Payment already succeeded, just call onSuccess without confirming here
          toast.success('Payment already completed successfully!');
          onSuccess?.({
            id: error.payment_intent.id,
            payment_intent_id: error.payment_intent.id,
            client_secret: error.payment_intent.client_secret,
            status: 'succeeded'
          });
          return;
        }
        setError(error.message);
        toast.error(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        // Do not confirm here; parent handles confirmation after creating booking
        toast.success('Payment successful!');
        onSuccess?.({
          id: paymentIntent.id,
          payment_intent_id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          status: paymentIntent.status
        });
      }
    } catch (error) {
      setError('Payment failed. Please try again.');
      toast.error('Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

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

  if (isLoading) {
    return (
      <Card className="p-6 text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Initializing payment...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      {showAmount && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Details</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Amount</span>
            <span className="text-2xl font-bold text-gray-900">
              ${amount} {currency}
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="border border-gray-300 rounded-md p-3 min-h-[48px]">
            <CardElement options={cardElementOptions} />
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <Lock className="w-4 h-4 mr-2" />
          <span>Your payment information is secure and encrypted</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            variant="primary"
            className="w-full sm:flex-1"
            disabled={!stripe || isProcessing}
            loading={isProcessing}
          >
            {isProcessing ? 'Processing...' : `Pay $${amount} ${currency}`}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};

const PaymentForm = (props) => {
  const stripePromise = getStripe();
  
  if (!stripePromise) {
    return (
      <Card className="p-6 text-center">
        <div className="text-red-600 mb-4">
          <Lock className="w-12 h-12 mx-auto mb-2" />
          <h3 className="text-lg font-medium">Payment Unavailable</h3>
          <p className="text-sm text-gray-600 mt-1">
            Stripe configuration is missing. Please contact support.
          </p>
        </div>
      </Card>
    );
  }
  
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormComponent {...props} />
    </Elements>
  );
};

export default PaymentForm;
