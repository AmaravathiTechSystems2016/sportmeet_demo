import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { paymentsAPI } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';
import {
  CreditCard,
  DollarSign,
  Search,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

const PaymentsPage = () => {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    payment_method: '',
    booking: '',
    event: ''
  });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: paymentsData, isLoading, error, refetch } = useQuery(
    ['admin-payments', filters],
    () => paymentsAPI.getAdminPayments(filters),
    {
      staleTime: 0,
      cacheTime: 0,
      retry: 1
    }
  );

  const { data: statsData } = useQuery(
    'admin-payment-stats',
    () => paymentsAPI.getAdminPaymentStats(),
    { staleTime: 5 * 60 * 1000 }
  );

  const payments = paymentsData?.data?.results || paymentsData?.data || [];
  const stats = statsData?.data || {};

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatDateTime = (iso) => {
    if (!iso) return 'N/A';
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { cls: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      processing: { cls: 'bg-blue-100 text-blue-800', text: 'Processing' },
      completed: { cls: 'bg-green-100 text-green-800', text: 'Completed' },
      failed: { cls: 'bg-red-100 text-red-800', text: 'Failed' },
      cancelled: { cls: 'bg-gray-100 text-gray-800', text: 'Cancelled' },
      refunded: { cls: 'bg-purple-100 text-purple-800', text: 'Refunded' }
    };
    const cfg = map[status] || map.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
        {cfg.text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load payments</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Payments</h1>
              <p className="text-lg text-gray-600">Track and review all payment transactions.</p>
            </div>
            <Button onClick={() => refetch()} className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0"><CreditCard className="h-8 w-8 text-blue-600" /></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Payments</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total_payments || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0"><CheckCircle className="h-8 w-8 text-green-600" /></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completed_payments || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0"><DollarSign className="h-8 w-8 text-green-600" /></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">${stats.total_revenue ? parseFloat(stats.total_revenue).toFixed(2) : '0.00'}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0"><AlertTriangle className="h-8 w-8 text-red-600" /></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Failed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.failed_payments || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
              <select
                value={filters.payment_method}
                onChange={(e) => handleFilterChange('payment_method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Methods</option>
                <option value="stripe">Stripe</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="paypal">PayPal</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => setFilters({ search: '', status: '', payment_method: '', booking: '', event: '' })}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Payments List */}
        {payments.length === 0 ? (
          <Card className="p-12 text-center">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search criteria or check back later.</p>
            <Button onClick={() => refetch()}>Refresh</Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {payments.map((pmt) => (
              <Card key={pmt.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {pmt.booking_title || pmt.event_title || 'Payment'}
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Transaction: <span className="font-mono">{pmt.transaction_id}</span></div>
                      <div>Method: {pmt.payment_method?.toUpperCase?.() || pmt.payment_method}</div>
                      <div>Created: {formatDateTime(pmt.created_at)}</div>
                      {pmt.completed_at && (<div>Completed: {formatDateTime(pmt.completed_at)}</div>)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-semibold text-gray-900 mb-1">${parseFloat(pmt.amount).toFixed(2)} {pmt.currency}</div>
                    <div className="mb-2">{getStatusBadge(pmt.status)}</div>
                    <Button variant="outline" onClick={() => { setSelectedPayment(pmt); setIsDetailsOpen(true); }}>View Details</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Details Modal */}
        <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Payment Details" size="lg">
          {selectedPayment && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Overview</h4>
                  <div className="space-y-1">
                    <div><strong>Transaction ID:</strong> <span className="font-mono">{selectedPayment.transaction_id}</span></div>
                    {selectedPayment.gateway_transaction_id && (
                      <div><strong>Gateway ID:</strong> <span className="font-mono">{selectedPayment.gateway_transaction_id}</span></div>
                    )}
                    <div><strong>Status:</strong> {getStatusBadge(selectedPayment.status)}</div>
                    <div><strong>Amount:</strong> ${parseFloat(selectedPayment.amount).toFixed(2)} {selectedPayment.currency}</div>
                    <div><strong>Method:</strong> {selectedPayment.payment_method}</div>
                    <div><strong>Created:</strong> {formatDateTime(selectedPayment.created_at)}</div>
                    {selectedPayment.completed_at && (<div><strong>Completed:</strong> {formatDateTime(selectedPayment.completed_at)}</div>)}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Related</h4>
                  <div className="space-y-1">
                    {selectedPayment.booking_title && (<div><strong>Booking:</strong> {selectedPayment.booking_title}</div>)}
                    {selectedPayment.event_title && (<div><strong>Event:</strong> {selectedPayment.event_title}</div>)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default PaymentsPage;
