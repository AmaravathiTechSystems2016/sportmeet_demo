import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { venuesAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Modal from '../../components/UI/Modal';
import { 
  Building, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar,
  Star,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';

const VenueOwnersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    is_active: true,
    is_staff: false,
    is_verified: false
  });
  const itemsPerPage = 10;
  const queryClient = useQueryClient();

  // Fetch venue owners (users who own venues)
  const { data: venueOwnersData, isLoading, error, refetch } = useQuery(
    ['venue-owners', currentPage, searchTerm, statusFilter],
    () => venuesAPI.getVenueOwners({
      page: currentPage,
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }),
    {
      onError: (error) => {
        console.error('Error fetching venue owners:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
      },
      onSuccess: (data) => {
        console.log('Venue owners loaded successfully:', data);
      }
    }
  );

  const venueOwners = Array.isArray(venueOwnersData?.data?.results) ? venueOwnersData.data.results : 
                     Array.isArray(venueOwnersData?.data) ? venueOwnersData.data : 
                     Array.isArray(venueOwnersData?.results) ? venueOwnersData.results : [];
  const totalPages = Math.ceil((venueOwnersData?.data?.count || venueOwnersData?.count || 0) / itemsPerPage);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleView = (ownerId) => {
    const owner = venueOwners.find(o => o.id === ownerId);
    if (owner) {
      setSelectedOwner(owner);
      setIsViewModalOpen(true);
    }
  };

  const handleEdit = (ownerId) => {
    const owner = venueOwners.find(o => o.id === ownerId);
    if (owner) {
      setSelectedOwner(owner);
      setEditForm({
        first_name: owner.first_name || '',
        last_name: owner.last_name || '',
        email: owner.email || '',
        phone_number: owner.phone_number || '',
        is_active: owner.is_active,
        is_staff: owner.is_staff,
        is_verified: owner.is_verified
      });
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedOwner) {
      console.error('No selected owner');
      return;
    }
    
    // Basic validation
    if (!editForm.first_name.trim() || !editForm.last_name.trim() || !editForm.email.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    console.log('Saving venue owner:', selectedOwner.id, editForm);
    
    try {
      const response = await venuesAPI.updateVenueOwner(selectedOwner.id, editForm);
      console.log('Update response:', response);
      toast.success('Venue owner updated successfully');
      setIsEditModalOpen(false);
      setSelectedOwner(null);
      refetch();
    } catch (error) {
      console.error('Error updating venue owner:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error(`Failed to update venue owner: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleStatusToggle = async (ownerId) => {
    const owner = venueOwners.find(o => o.id === ownerId);
    if (owner) {
      const newStatus = !owner.is_active;
      try {
        await venuesAPI.updateVenueOwner(ownerId, { is_active: newStatus });
        toast.success(`Venue owner ${newStatus ? 'activated' : 'deactivated'} successfully`);
        refetch();
      } catch (error) {
        console.error('Error updating venue owner status:', error);
        toast.error('Failed to update venue owner status');
      }
    }
  };

  const handleDelete = async (ownerId) => {
    if (window.confirm('Are you sure you want to delete this venue owner? This action cannot be undone.')) {
      try {
        await venuesAPI.deleteVenueOwner(ownerId);
        toast.success('Venue owner deleted successfully');
        
        // Clear cache and refetch
        queryClient.removeQueries(['venue-owners']);
        await refetch();
        
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete venue owner');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      inactive: { color: 'bg-red-100 text-red-800', icon: XCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      suspended: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <XCircle className="w-12 h-12 mx-auto mb-2" />
          <h3 className="text-lg font-medium">Error Loading Venue Owners</h3>
          <p className="text-sm text-gray-600 mt-1">Failed to load venue owners data</p>
          <p className="text-xs text-gray-500 mt-1">Error: {error.message}</p>
          <p className="text-xs text-gray-500">Status: {error.response?.status}</p>
          <p className="text-xs text-gray-500">Response: {JSON.stringify(error.response?.data)}</p>
        </div>
        <div className="space-x-2">
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Venue Owners</h1>
          <p className="text-gray-600">Manage venue owners and their accounts</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search venue owners by name, email, or phone..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Status:</span>
            </div>
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => handleStatusFilter('all')}
              size="sm"
              className="min-w-[60px]"
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              onClick={() => handleStatusFilter('active')}
              size="sm"
              className="min-w-[60px]"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </Button>
            <Button
              variant={statusFilter === 'inactive' ? 'default' : 'outline'}
              onClick={() => handleStatusFilter('inactive')}
              size="sm"
              className="min-w-[60px]"
            >
              <XCircle className="w-3 h-3 mr-1" />
              Inactive
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              onClick={() => handleStatusFilter('pending')}
              size="sm"
              className="min-w-[60px]"
            >
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </Button>
          </div>
        </div>
      </Card>

      {/* Venue Owners List */}
      {venueOwners.length === 0 ? (
        <Card className="p-12 text-center">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Venue Owners Found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'No venue owners match your current filters.' 
              : 'No venue owners have been registered yet.'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {venueOwners.map((owner) => (
            <Card key={owner.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{owner.first_name} {owner.last_name}</h3>
                    {getStatusBadge(owner.status)}
                    {owner.is_verified && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{owner.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{owner.phone_number || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Joined: {new Date(owner.date_joined).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Building className="w-4 h-4" />
                      <span>Venues: {owner.venues_count || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>Rating: {owner.average_rating || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4" />
                      <span>Revenue: ${owner.total_revenue || '0'}</span>
                    </div>
                  </div>

                  {owner.bio && (
                    <p className="text-gray-700 mt-3 line-clamp-2">{owner.bio}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(owner.id)}
                    title="View venue owner details"
                    className="hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(owner.id)}
                    title="Edit venue owner"
                    className="hover:bg-green-50 hover:text-green-600"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusToggle(owner.id)}
                    title={`${owner.is_active ? 'Deactivate' : 'Activate'} venue owner`}
                    className={`hover:bg-yellow-50 hover:text-yellow-600 ${
                      owner.is_active ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {owner.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(owner.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Delete venue owner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, venueOwnersData?.data?.count || venueOwnersData?.count || 0)} of {venueOwnersData?.data?.count || venueOwnersData?.count || 0} results
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedOwner(null);
        }}
        title="Venue Owner Details"
        size="lg"
      >
        {selectedOwner && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {selectedOwner.first_name?.charAt(0)}{selectedOwner.last_name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedOwner.first_name} {selectedOwner.last_name}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusBadge(selectedOwner.is_active ? 'active' : 'inactive')}
                  {selectedOwner.is_verified && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900">{selectedOwner.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-gray-900">{selectedOwner.phone_number || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Joined</p>
                    <p className="text-gray-900">{new Date(selectedOwner.date_joined).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Venues</p>
                    <p className="text-gray-900">{selectedOwner.venues_count || 0}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Average Rating</p>
                    <p className="text-gray-900">{selectedOwner.average_rating || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-gray-900">${selectedOwner.total_revenue || '0'}</p>
                  </div>
                </div>
              </div>
            </div>

            {selectedOwner.bio && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Bio</p>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedOwner.bio}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedOwner(null);
        }}
        title="Edit Venue Owner"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <Input
                value={editForm.first_name}
                onChange={(e) => {
                  console.log('First name changed:', e.target.value);
                  setEditForm({ ...editForm, first_name: e.target.value });
                }}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <Input
                value={editForm.last_name}
                onChange={(e) => {
                  console.log('Last name changed:', e.target.value);
                  setEditForm({ ...editForm, last_name: e.target.value });
                }}
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => {
                  console.log('Email changed:', e.target.value);
                  setEditForm({ ...editForm, email: e.target.value });
                }}
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <Input
                value={editForm.phone_number}
                onChange={(e) => {
                  console.log('Phone number changed:', e.target.value);
                  setEditForm({ ...editForm, phone_number: e.target.value });
                }}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => {
                    console.log('Active account changed:', e.target.checked);
                    setEditForm({ ...editForm, is_active: e.target.checked });
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Active Account</span>
              </label>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.is_staff}
                  onChange={(e) => {
                    console.log('Admin access changed:', e.target.checked);
                    setEditForm({ ...editForm, is_staff: e.target.checked });
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Admin Access</span>
              </label>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.is_verified}
                  onChange={(e) => {
                    console.log('Verified account changed:', e.target.checked);
                    setEditForm({ ...editForm, is_verified: e.target.checked });
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Verified Account</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedOwner(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                console.log('Save Changes button clicked');
                console.log('Current editForm:', editForm);
                console.log('Selected owner:', selectedOwner);
                handleSaveEdit();
              }} 
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VenueOwnersPage;
