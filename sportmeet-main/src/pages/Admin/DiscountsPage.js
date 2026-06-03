import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { discountsAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Modal from '../../components/UI/Modal';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  Calendar,
  Percent,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const DiscountsPage = () => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch discounts
  const { data: discountsData, isLoading } = useQuery(
    'discounts',
    discountsAPI.getDiscounts
  );

  // Delete discount mutation
  const deleteDiscountMutation = useMutation(
    (id) => discountsAPI.deleteDiscount(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('discounts');
        toast.success('Discount deleted successfully');
      },
      onError: (error) => {
        toast.error('Failed to delete discount');
      }
    }
  );

  // Normalize API response to an array regardless of shape
  const rawDiscounts = discountsData?.data;
  const discounts = Array.isArray(rawDiscounts)
    ? rawDiscounts
    : (Array.isArray(rawDiscounts?.results) ? rawDiscounts.results : []);

  // Filter discounts
  const filteredDiscounts = discounts.filter(discount => {
    const code = (discount?.code || '').toLowerCase();
    const name = (discount?.name || '').toLowerCase();
    const matchesSearch = code.includes(searchTerm.toLowerCase()) || name.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || discount?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateDiscount = () => {
    setSelectedDiscount(null);
    setIsCreateModalOpen(true);
  };

  const handleEditDiscount = (discount) => {
    setSelectedDiscount(discount);
    setIsEditModalOpen(true);
  };

  const handleViewDiscount = (discount) => {
    setSelectedDiscount(discount);
    setIsViewModalOpen(true);
  };

  const handleDeleteDiscount = (discount) => {
    if (window.confirm(`Are you sure you want to delete the discount "${discount.code}"?`)) {
      deleteDiscountMutation.mutate(discount.id);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      expired: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getDiscountTypeIcon = (type) => {
    return type === 'percentage' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />;
  };

  const formatValue = (discount) => {
    if (discount.discount_type === 'percentage') {
      return `${discount.value}%`;
    } else {
      return `$${discount.value}`;
    }
  };

  const getUsagePercentage = (discount) => {
    if (!discount.usage_limit) return null;
    return Math.round((discount.usage_count / discount.usage_limit) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discounts & Coupons</h1>
          <p className="text-gray-600">Manage discount codes and promotional offers</p>
        </div>
        <Button onClick={handleCreateDiscount} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create Discount</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search discounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Discounts List */}
      <div className="grid gap-4">
        {filteredDiscounts.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              <Percent className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No discounts found</h3>
              <p>Create your first discount code to get started.</p>
            </div>
          </Card>
        ) : (
          filteredDiscounts.map((discount) => (
            <Card key={discount.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{discount.code}</h3>
                    {getStatusBadge(discount.status)}
                    {discount.is_valid && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Valid
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-3">{discount.name}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      {getDiscountTypeIcon(discount.discount_type)}
                      <span>{formatValue(discount)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{discount.usage_count} / {discount.usage_limit || '∞'} uses</span>
                    </div>
                    
                    {discount.usage_limit && (
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${getUsagePercentage(discount)}%` }}
                          />
                        </div>
                        <span>{getUsagePercentage(discount)}%</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(discount.valid_from).toLocaleDateString()} - 
                        {discount.valid_until ? new Date(discount.valid_until).toLocaleDateString() : 'No expiry'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDiscount(discount)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditDiscount(discount)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(discount.code)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDiscount(discount)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <DiscountModal
          discount={selectedDiscount}
          isOpen={isCreateModalOpen || isEditModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedDiscount(null);
          }}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedDiscount(null);
            queryClient.invalidateQueries('discounts');
          }}
        />
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedDiscount && (
        <DiscountViewModal
          discount={selectedDiscount}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedDiscount(null);
          }}
        />
      )}
    </div>
  );
};

// Discount Modal Component
const DiscountModal = ({ discount, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    code: discount?.code || '',
    name: discount?.name || '',
    description: discount?.description || '',
    discount_type: discount?.discount_type || 'percentage',
    value: discount?.value || '',
    max_discount_amount: discount?.max_discount_amount || '',
    min_order_amount: discount?.min_order_amount || '0',
    valid_from: discount?.valid_from ? new Date(discount.valid_from).toISOString().slice(0, 16) : '',
    valid_until: discount?.valid_until ? new Date(discount.valid_until).toISOString().slice(0, 16) : '',
    status: discount?.status || 'active',
    usage_limit: discount?.usage_limit || '',
    user_limit: discount?.user_limit || '1',
    first_time_only: discount?.first_time_only || false,
    applicable_to_venues: discount?.applicable_to_venues !== false,
    applicable_to_events: discount?.applicable_to_events !== false,
  });

  const isEditing = !!discount;

  const createMutation = useMutation(
    (data) => discountsAPI.createDiscount(data),
    {
      onSuccess: () => {
        toast.success('Discount created successfully');
        onSuccess();
      },
      onError: (error) => {
        const apiErr = error?.response?.data;
        console.error('Create discount error:', apiErr || error);
        let message = 'Failed to create discount';
        if (apiErr) {
          if (typeof apiErr === 'string') message = apiErr;
          else if (apiErr.error) message = apiErr.error;
          else if (Array.isArray(apiErr)) message = apiErr.join(', ');
          else {
            const parts = Object.entries(apiErr).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`);
            if (parts.length) message = parts.join(' | ');
          }
        }
        toast.error(message);
      }
    }
  );

  const updateMutation = useMutation(
    (data) => discountsAPI.updateDiscount(discount.id, data),
    {
      onSuccess: () => {
        toast.success('Discount updated successfully');
        onSuccess();
      },
      onError: (error) => {
        const apiErr = error?.response?.data;
        console.error('Update discount error:', apiErr || error);
        let message = 'Failed to update discount';
        if (apiErr) {
          if (typeof apiErr === 'string') message = apiErr;
          else if (apiErr.error) message = apiErr.error;
          else if (Array.isArray(apiErr)) message = apiErr.join(', ');
          else {
            const parts = Object.entries(apiErr).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`);
            if (parts.length) message = parts.join(' | ');
          }
        }
        toast.error(message);
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      value: parseFloat(formData.value),
      max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
      min_order_amount: parseFloat(formData.min_order_amount),
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      user_limit: parseInt(formData.user_limit),
      valid_from: formData.valid_from || null,
      valid_until: formData.valid_until || null,
    };

    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Discount' : 'Create Discount'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code *
            </label>
            <Input
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="WELCOME10"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Welcome Discount"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Description of the discount"
          />
        </div>

        {/* Discount Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type *
            </label>
            <select
              name="discount_type"
              value={formData.discount_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Value *
            </label>
            <Input
              name="value"
              type="number"
              step="0.01"
              value={formData.value}
              onChange={handleChange}
              placeholder={formData.discount_type === 'percentage' ? '10' : '5.00'}
              required
            />
          </div>
          {formData.discount_type === 'percentage' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Discount Amount
              </label>
              <Input
                name="max_discount_amount"
                type="number"
                step="0.01"
                value={formData.max_discount_amount}
                onChange={handleChange}
                placeholder="50.00"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Order Amount
          </label>
          <Input
            name="min_order_amount"
            type="number"
            step="0.01"
            value={formData.min_order_amount}
            onChange={handleChange}
            placeholder="0.00"
          />
        </div>

        {/* Validity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valid From
            </label>
            <Input
              name="valid_from"
              type="datetime-local"
              value={formData.valid_from}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valid Until
            </label>
            <Input
              name="valid_until"
              type="datetime-local"
              value={formData.valid_until}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Usage Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usage Limit
            </label>
            <Input
              name="usage_limit"
              type="number"
              value={formData.usage_limit}
              onChange={handleChange}
              placeholder="Leave empty for unlimited"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Limit
            </label>
            <Input
              name="user_limit"
              type="number"
              value={formData.user_limit}
              onChange={handleChange}
              placeholder="1"
              required
            />
          </div>
        </div>

        {/* Restrictions */}
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="first_time_only"
              checked={formData.first_time_only}
              onChange={handleChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-700">
              First-time users only
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="applicable_to_venues"
                checked={formData.applicable_to_venues}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700">
                Applicable to venue bookings
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="applicable_to_events"
                checked={formData.applicable_to_events}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700">
                Applicable to event bookings
              </label>
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createMutation.isLoading || updateMutation.isLoading}
          >
            {isEditing ? 'Update Discount' : 'Create Discount'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Discount View Modal Component
const DiscountViewModal = ({ discount, isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Discount Details">
      <div className="space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Code</label>
              <p className="text-lg font-mono">{discount.code}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-lg">{discount.name}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="text-gray-700">{discount.description || 'No description'}</p>
            </div>
          </div>
        </div>

        {/* Discount Details */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Discount Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Type</label>
              <p className="capitalize">{discount.discount_type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Value</label>
              <p className="text-lg font-semibold">
                {discount.discount_type === 'percentage' ? `${discount.value}%` : `$${discount.value}`}
              </p>
            </div>
            {discount.max_discount_amount && (
              <div>
                <label className="text-sm font-medium text-gray-500">Max Discount</label>
                <p>${discount.max_discount_amount}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Min Order Amount</label>
              <p>${discount.min_order_amount}</p>
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Usage Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Times Used</label>
              <p className="text-2xl font-bold">{discount.usage_count}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Usage Limit</label>
              <p className="text-2xl font-bold">{discount.usage_limit || '∞'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">User Limit</label>
              <p className="text-2xl font-bold">{discount.user_limit}</p>
            </div>
          </div>
        </div>

        {/* Validity */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Validity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Valid From</label>
              <p>{new Date(discount.valid_from).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Valid Until</label>
              <p>{discount.valid_until ? new Date(discount.valid_until).toLocaleString() : 'No expiry'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="capitalize">{discount.status}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Currently Valid</label>
              <p className={discount.is_valid ? 'text-green-600' : 'text-red-600'}>
                {discount.is_valid ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>

        {/* Restrictions */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Restrictions</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 mr-4">First-time only:</span>
              <span className={discount.first_time_only ? 'text-red-600' : 'text-green-600'}>
                {discount.first_time_only ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 mr-4">Venue bookings:</span>
              <span className={discount.applicable_to_venues ? 'text-green-600' : 'text-red-600'}>
                {discount.applicable_to_venues ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 mr-4">Event bookings:</span>
              <span className={discount.applicable_to_events ? 'text-green-600' : 'text-red-600'}>
                {discount.applicable_to_events ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

export default DiscountsPage;
