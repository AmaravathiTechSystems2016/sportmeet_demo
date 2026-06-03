import React from 'react';
import PaymentForm from './PaymentForm';
import { X } from 'lucide-react';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  amount, 
  currency = 'AUD', 
  bookingId, 
  eventId, 
  onSuccess,
  courtsSummary = []
}) => {
  if (!isOpen) return null;

  const handleSuccess = (paymentIntent) => {
    onSuccess?.(paymentIntent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Complete Payment
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {Array.isArray(courtsSummary) && courtsSummary.length > 0 && (
              <div className="mb-4 text-sm text-gray-800">
                <div className="font-medium mb-1">Courts</div>
                <ul className="list-disc ml-5">
                  {courtsSummary.map((c, idx) => (
                    <li key={idx}>{c.name}{c.sport ? ` • ${c.sport}` : ''} ({c.slots} slot{c.slots>1?'s':''} • ${c.price}/slot)</li>
                  ))}
                </ul>
              </div>
            )}
            <PaymentForm
              amount={amount}
              currency={currency}
              bookingId={bookingId}
              eventId={eventId}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
