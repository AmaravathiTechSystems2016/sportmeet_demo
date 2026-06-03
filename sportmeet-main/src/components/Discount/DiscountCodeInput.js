import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { discountsAPI } from '../../services/api';
import Button from '../UI/Button';
import Input from '../UI/Input';
import { Percent, CheckCircle, XCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const DiscountCodeInput = ({ 
  bookingType, 
  venueId, 
  eventId, 
  amount, 
  onDiscountApplied,
  onDiscountRemoved,
  appliedDiscount = null 
}) => {
  const [discountCode, setDiscountCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Validate discount mutation
  const validateDiscountMutation = useMutation(
    (data) => discountsAPI.validateDiscount(data),
    {
      onSuccess: (response) => {
        if (response.data.valid) {
          onDiscountApplied(response.data);
          toast.success('Discount code applied successfully!');
        } else {
          toast.error(response.data.error || 'Invalid discount code');
        }
        setIsValidating(false);
      },
      onError: (error) => {
        toast.error('Failed to validate discount code');
        setIsValidating(false);
      }
    }
  );

  const handleValidateDiscount = async (e) => {
    e.preventDefault();
    
    if (!discountCode.trim()) {
      toast.error('Please enter a discount code');
      return;
    }

    setIsValidating(true);
    
    const validationData = {
      code: discountCode.trim(),
      booking_type: bookingType,
      venue_id: venueId,
      event_id: eventId,
      amount: amount
    };

    validateDiscountMutation.mutate(validationData);
  };

  const handleRemoveDiscount = () => {
    onDiscountRemoved();
    setDiscountCode('');
    toast.success('Discount removed');
  };

  const formatDiscountAmount = (discount) => {
    if (discount.discount_type === 'percentage') {
      return `${discount.value}%`;
    } else {
      return `$${discount.value}`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Discount Code Input */}
      {!appliedDiscount && (
        <form onSubmit={handleValidateDiscount} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Code
            </label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Enter discount code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  disabled={isValidating}
                />
              </div>
              <Button
                type="submit"
                disabled={isValidating || !discountCode.trim()}
                className="flex items-center space-x-2"
              >
                {isValidating ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Percent className="w-4 h-4" />
                )}
                <span>{isValidating ? 'Validating...' : 'Apply'}</span>
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Applied Discount Display */}
      {appliedDiscount && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-green-800">
                    {appliedDiscount.discount.code}
                  </span>
                  <span className="text-sm text-green-600">
                    ({formatDiscountAmount(appliedDiscount.discount)})
                  </span>
                </div>
                <p className="text-sm text-green-700">
                  {appliedDiscount.discount.name}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveDiscount}
              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="mt-3 pt-3 border-t border-green-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Original Amount:</span>
              <span className="font-medium">${appliedDiscount.original_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Discount:</span>
              <span className="font-medium text-green-600">
                -${appliedDiscount.discount_amount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-semibold pt-1 border-t border-green-200">
              <span>Final Amount:</span>
              <span className="text-green-800">
                ${appliedDiscount.final_amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Discount Info */}
      {!appliedDiscount && (
        <div className="text-xs text-gray-500">
          <p>• Enter a valid discount code to save on your booking</p>
          <p>• Discounts are applied before payment processing</p>
          <p>• Some discounts may have restrictions or expiry dates</p>
        </div>
      )}
    </div>
  );
};

export default DiscountCodeInput;
