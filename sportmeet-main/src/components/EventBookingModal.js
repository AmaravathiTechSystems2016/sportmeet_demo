import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from './UI/Button';
import Input from './UI/Input';
import PaymentForm from './Payment/PaymentForm';
import { paymentsAPI } from '../services/api';
import DiscountCodeInput from './Discount/DiscountCodeInput';
import { 
  X, 
  Calendar, 
  MapPin, 
  DollarSign, 
} from 'lucide-react';

const EventBookingModal = ({ event, onClose, onSubmit, isLoading }) => {
  const [paymentStep, setPaymentStep] = useState(1); // 1: Details, 2: Payment
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const handleFormSubmit = (data) => {
    if (paymentStep === 1) {
      setPaymentStep(2);
    } else {
      onSubmit(data);
    }
  };

  const handleBackToDetails = () => {
    setPaymentStep(1);
  };

  const handleDiscountApplied = (discountData) => {
    setAppliedDiscount(discountData);
  };

  const handleDiscountRemoved = () => {
    setAppliedDiscount(null);
  };

  const calculateTotalPrice = () => {
    const basePrice = parseFloat(event.entry_fee);
    
    if (appliedDiscount) {
      return appliedDiscount.final_amount;
    }
    
    return basePrice;
  };

  const calculateOriginalPrice = () => {
    return parseFloat(event.entry_fee);
  };

  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0 overflow-y-auto">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-lg">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Book Event: {event.title}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Event Summary */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{event.title}</h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(event.start_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {event.venue?.name}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {appliedDiscount ? (
                  <div>
                    <p className="text-sm text-gray-500 line-through">
                      ${event.entry_fee} {event.currency}
                    </p>
                    <p className="text-lg font-semibold text-green-600">
                      ${calculateTotalPrice().toFixed(2)} {event.currency}
                    </p>
                  </div>
                ) : (
                  <p className="text-lg font-semibold text-gray-900">
                    ${event.entry_fee} {event.currency}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 py-6 max-h-[80vh] overflow-y-auto">
            {paymentStep === 1 ? (
              <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                <h4 className="font-medium text-gray-900 mb-4">Your Details</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <Input
                    {...register('name', { required: 'Name is required' })}
                    placeholder="Enter your full name"
                    error={errors.name?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    placeholder="Enter your email"
                    error={errors.email?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <Input
                    {...register('phone', { required: 'Phone number is required' })}
                    placeholder="Enter your phone number"
                    error={errors.phone?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests
                  </label>
                  <textarea
                    {...register('special_requests')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any special requirements or requests..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex items-center space-x-2"
                  >
                    <span>Continue to Payment</span>
                    <DollarSign className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Payment Details</h4>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToDetails}
                    className="text-sm"
                  >
                    Back
                  </Button>
                </div>
                
                {/* Discount Code Input */}
                <div className="mb-6">
                  <DiscountCodeInput
                    bookingType="event"
                    eventId={event.id}
                    amount={calculateOriginalPrice()}
                    onDiscountApplied={handleDiscountApplied}
                    onDiscountRemoved={handleDiscountRemoved}
                    appliedDiscount={appliedDiscount}
                  />
                </div>
                
                {/* Price Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  {appliedDiscount ? (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Original Price:</span>
                        <span className="font-medium">${calculateOriginalPrice().toFixed(2)} {event.currency}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2 text-green-600">
                        <span>Discount ({appliedDiscount.discount.discount_type === 'percentage' ? `${appliedDiscount.discount.value}%` : `$${appliedDiscount.discount.value}`}):</span>
                        <span className="font-medium">-${(calculateOriginalPrice() - appliedDiscount.final_amount).toFixed(2)} {event.currency}</span>
                      </div>
                      <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
                        <span>Total:</span>
                        <span className="text-green-600">${calculateTotalPrice().toFixed(2)} {event.currency}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total:</span>
                      <span>${calculateTotalPrice().toFixed(2)} {event.currency}</span>
                    </div>
                  )}
                </div>
                
                <PaymentForm
                  amount={calculateTotalPrice()}
                  currency={event.currency}
                  eventId={event.id}
                  onSuccess={async (paymentIntent) => {
                    try {
                      // First, confirm payment on backend with event context to auto-confirm participation
                      await paymentsAPI.confirmPayment({
                        payment_intent_id: paymentIntent.payment_intent_id,
                        event_id: event.id
                      });
                    } catch (e) {
                      // Even if this fails, proceed to register; serializer may still confirm if payment exists later
                      // eslint-disable-next-line no-console
                      console.warn('Event payment confirm failed (continuing to register):', e?.message || e);
                    }
                    // Proceed to register with intent reference
                    onSubmit({
                      payment_intent_id: paymentIntent.payment_intent_id,
                      special_requests: ''
                    });
                  }}
                  onCancel={() => {
                    console.log('Payment cancelled');
                  }}
                  showAmount={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventBookingModal;
