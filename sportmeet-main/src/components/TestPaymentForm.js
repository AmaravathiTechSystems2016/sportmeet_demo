import React, { useState } from 'react';
import Button from './UI/Button';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

const TestPaymentForm = ({ event, amount, currency = 'AUD', title, onSuccess, onError, isLoading }) => {
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState(null);

  const handleTestPayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1200));

      // If event provided, hit event test endpoint; else, just simulate success for venue booking
      if (event && event.id) {
        const response = await fetch('http://localhost:8000/api/payments/confirm-test/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ event_id: event.id })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to confirm test payment');
        }
        const paymentData = await response.json();
        setSucceeded(true);
        setProcessing(false);
        onSuccess({
          payment_intent_id: paymentData.gateway_transaction_id,
          status: 'succeeded',
        });
        return;
      }

      // Simulated venue booking payment success
      setSucceeded(true);
      setProcessing(false);
      onSuccess({
        payment_intent_id: `test_pi_${Date.now()}`,
        status: 'succeeded'
      });
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
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
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Test Mode:</strong> This was a simulated payment for development purposes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
        
        <div className="space-y-4">
          {(event || title) && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{event ? 'Event' : 'Item'}:</span>
              <span className="font-medium">{event ? event.title : (title || 'Booking')}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Amount:</span>
            <span className="font-medium">${(event ? event.entry_fee : amount) || 0} {(event ? event.currency : currency) || 'AUD'}</span>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Test Mode</h4>
            <p className="text-sm text-yellow-700 mt-1">
              This is a development environment. Click "Pay Now" to simulate a successful payment.
              No real money will be charged.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <Button
        onClick={handleTestPayment}
        disabled={processing || isLoading}
        className="w-full flex items-center justify-center space-x-2"
      >
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            <span>Pay ${(event ? event.entry_fee : amount) || 0} {(event ? event.currency : currency) || 'AUD'} (Test)</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default TestPaymentForm;
