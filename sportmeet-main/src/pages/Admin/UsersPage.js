import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { venuesAPI } from '../../services/api';
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Mail, 
  Phone, 
  Calendar,
  Shield,
  UserCheck,
  UserX,
  Users,
  Save
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';
import Input from '../../components/UI/Input';
import toast from 'react-hot-toast';

const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userTypeFilter, setUserTypeFilter] = useState('all'); // 'all' | 'venue_owners'
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
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

  // Fetch users or venue owners based on userTypeFilter
  const { data: usersData, isLoading, error, refetch } = useQuery(
    ['users', currentPage, searchTerm, statusFilter, userTypeFilter],
    () => {
      if (userTypeFilter === 'venue_owners') {
        return venuesAPI.getVenueOwners({
          page: currentPage,
          search: searchTerm,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        });
      }
      return venuesAPI.getUsers({
        page: currentPage,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        exclude_venue_owners: true
      });
    },
    {
      onError: (error) => {
        console.error('Error fetching users:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
      },
      onSuccess: (data) => {
        console.log('Users loaded successfully:', data);
      }
    }
  );

  const users = Array.isArray(usersData?.data?.results) ? usersData.data.results : 
               Array.isArray(usersData?.data) ? usersData.data : 
               Array.isArray(usersData?.results) ? usersData.results : [];
  const totalPages = Math.ceil((usersData?.data?.count || usersData?.count || 0) / itemsPerPage);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleView = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setIsViewModalOpen(true);
    }
  };

  const handleEdit = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setEditForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        is_active: user.is_active,
        is_staff: user.is_staff,
        is_verified: user.is_verified
      });
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) {
      console.error('No selected user');
      return;
    }
    
    // Check if current user has admin privileges
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('Current user:', currentUser);
    console.log('Is staff:', currentUser.is_staff);
    console.log('Is superuser:', currentUser.is_superuser);
    
    // Basic validation: allow empty first/last names; require valid email only
    if (!editForm.email.trim()) {
      toast.error('Email is required');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // Phone number validation relaxed: let backend enforce if needed
    
    try {
      console.log('Saving user:', selectedUser.id, editForm);
      console.log('API URL:', `/api/users/${selectedUser.id}/`);
      console.log('Token from localStorage:', localStorage.getItem('token'));
      console.log('Request headers:', {
        'Authorization': `Token ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      });
      
      // Test with a simple GET request first
      console.log('Testing GET request first...');
      const testResponse = await venuesAPI.getUser(selectedUser.id);
      console.log('GET test response:', testResponse);
      
      console.log('Now trying PUT request...');
      const response = await venuesAPI.updateUser(selectedUser.id, editForm);
      console.log('Update response:', response);
      toast.success('User updated successfully');
      setIsEditModalOpen(false);
      setSelectedUser(null);
      refetch();
    } catch (error) {
      console.error('Error updating user:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error config:', error.config);
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('Permission denied. You do not have admin access.');
      } else if (error.response?.status === 404) {
        toast.error('User not found.');
      } else {
        toast.error(`Failed to update user: ${error.response?.data?.detail || error.message}`);
      }
    }
  };

  const handleStatusToggle = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      const newStatus = !user.is_active;
      try {
        await venuesAPI.updateUserStatus(userId, newStatus ? 'active' : 'inactive');
        toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
        refetch();
      } catch (error) {
        console.error('Error updating user status:', error);
        toast.error('Failed to update user status');
      }
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await venuesAPI.deleteUser(userId);
        toast.success('User deleted successfully');
        
        // Clear cache and refetch
        queryClient.removeQueries(['users']);
        await refetch();
        
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: UserCheck },
      inactive: { color: 'bg-red-100 text-red-800', icon: UserX },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Shield }
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
          <UserX className="w-12 h-12 mx-auto mb-2" />
          <h3 className="text-lg font-medium">Error Loading Users</h3>
          <p className="text-sm text-gray-600 mt-1">Failed to load users data</p>
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
          <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
          <p className="text-gray-600">Manage regular users and their accounts</p>
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
                placeholder="Search users by name, email, or phone..."
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
              <UserCheck className="w-3 h-3 mr-1" />
              Active
            </Button>
            <Button
              variant={statusFilter === 'inactive' ? 'default' : 'outline'}
              onClick={() => handleStatusFilter('inactive')}
              size="sm"
              className="min-w-[60px]"
            >
              <UserX className="w-3 h-3 mr-1" />
              Inactive
            </Button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Type:</span>
            </div>
            <Button
              variant={userTypeFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setUserTypeFilter('all')}
              size="sm"
              className="min-w-[120px]"
            >
              All Users
            </Button>
            <Button
              variant={userTypeFilter === 'venue_owners' ? 'default' : 'outline'}
              onClick={() => setUserTypeFilter('venue_owners')}
              size="sm"
              className="min-w-[120px]"
            >
              Venue Owners
            </Button>
          </div>
        </div>
      </Card>

      {/* Users List */}
      {users.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'No users match your current filters.' 
              : 'No users have been registered yet.'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {users.map((user) => (
            <Card key={user.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{user.full_name}</h3>
                    {getStatusBadge(user.is_active ? 'active' : 'inactive')}
                    {user.is_verified && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Joined: {new Date(user.date_joined).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Last Active: {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>Venues: {user.venues_count || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Shield className="w-4 h-4" />
                      <span>Role: {user.is_staff ? 'Admin' : 'User'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(user.id)}
                    title="View user details"
                    className="hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(user.id)}
                    title="Edit user"
                    className="hover:bg-green-50 hover:text-green-600"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusToggle(user.id)}
                    title={`${user.is_active ? 'Deactivate' : 'Activate'} user`}
                    className={`hover:bg-yellow-50 hover:text-yellow-600 ${
                      user.is_active ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Delete user"
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
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, usersData?.data?.count || usersData?.count || 0)} of {usersData?.data?.count || usersData?.count || 0} results
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
          setSelectedUser(null);
        }}
        title="User Details"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {selectedUser.first_name?.charAt(0)}{selectedUser.last_name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedUser.first_name} {selectedUser.last_name}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusBadge(selectedUser.is_active ? 'active' : 'inactive')}
                  {selectedUser.is_verified && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified
                    </span>
                  )}
                  {selectedUser.is_staff && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
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
                    <p className="text-gray-900">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-gray-900">{selectedUser.phone_number || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Joined</p>
                    <p className="text-gray-900">{new Date(selectedUser.date_joined).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Venues</p>
                    <p className="text-gray-900">{selectedUser.venues_count || 0}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Role</p>
                    <p className="text-gray-900">{selectedUser.is_staff ? 'Admin' : 'User'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Active</p>
                    <p className="text-gray-900">
                      {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        title="Edit User"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <Input
                value={editForm.first_name}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <Input
                value={editForm.last_name}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
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
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <Input
                value={editForm.phone_number}
                onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
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
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
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
                  onChange={(e) => setEditForm({ ...editForm, is_staff: e.target.checked })}
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
                  onChange={(e) => setEditForm({ ...editForm, is_verified: e.target.checked })}
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
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                console.log('Save Changes button clicked');
                console.log('Current editForm:', editForm);
                console.log('Selected user:', selectedUser);
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

export default UsersPage;
