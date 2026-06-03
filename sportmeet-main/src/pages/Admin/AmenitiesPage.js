import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { venuesAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Wrench,
  Eye,
  EyeOff,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

const AmenitiesPage = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    category: '',
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: amenitiesData, isLoading, error } = useQuery(
    'amenities',
    venuesAPI.getAmenities,
    {
      staleTime: 0,
      cacheTime: 0,
      onSuccess: (data) => {
        console.log('Amenities data fetched successfully:', data);
      },
      onError: (error) => {
        console.error('Error fetching amenities data:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
      }
    }
  );

  const createMutation = useMutation(
    (data) => venuesAPI.createAmenity(data),
    {
      onSuccess: (response) => {
        console.log('=== AMENITY CREATE SUCCESS ===');
        console.log('Response:', response);
        queryClient.invalidateQueries('amenities');
        toast.success('Amenity created successfully! Form closed. Click "Add Amenity" to create another.');
        setIsCreating(false);
        resetForm();
      },
      onError: (error) => {
        console.log('=== AMENITY CREATE ERROR ===');
        console.log('Error:', error);
        console.log('Error response:', error.response?.data);
        toast.error(error.response?.data?.error || 'Failed to create amenity');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => venuesAPI.updateAmenity(id, data),
    {
      onSuccess: (response) => {
        console.log('Amenity update success:', response);
        console.log('Updated amenity data:', response.data);
        
        // Simple cache invalidation and refetch
        queryClient.invalidateQueries('amenities');
        queryClient.refetchQueries('amenities');
        
        toast.success('Amenity updated successfully');
        setEditingId(null);
        resetForm();
      },
      onError: (error) => {
        console.error('Amenity update error:', error);
        console.error('Error details:', error.response?.data);
        toast.error(error.response?.data?.error || 'Failed to update amenity');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => venuesAPI.deleteAmenity(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('amenities');
        toast.success('Amenity deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete amenity');
      }
    }
  );

  const amenities = Array.isArray(amenitiesData?.data) ? amenitiesData.data : [];
  
  // Debug logging
  console.log('=== AMENITIES DATA DEBUG ===');
  console.log('Amenities data:', amenitiesData);
  console.log('Amenities array:', amenities);
  console.log('First amenity is_active:', amenities[0]?.is_active);
  console.log('Amenities data timestamp:', new Date().toISOString());
  const categories = [...new Set(amenities.map(amenity => amenity.category).filter(Boolean))];
  const filteredAmenities = categoryFilter === 'all' 
    ? amenities 
    : amenities.filter(amenity => amenity.category === categoryFilter);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      category: '',
      is_active: true
    });
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    resetForm();
  };

  const handleEdit = (amenity) => {
    setEditingId(amenity.id);
    setIsCreating(false);
    setFormData({
      name: amenity.name,
      description: amenity.description || '',
      icon: amenity.icon || '',
      category: amenity.category || '',
      is_active: amenity.is_active
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    resetForm();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('=== AMENITY FORM SUBMISSION DEBUG ===');
    console.log('Form submission data:', formData);
    console.log('isCreating:', isCreating);
    console.log('editingId:', editingId);
    console.log('Form data name:', formData.name);
    console.log('Form data category:', formData.category);
    console.log('Form data is_active:', formData.is_active, typeof formData.is_active);
    
    // Validate required fields
    if (!formData.name || formData.name.trim() === '') {
      toast.error('Amenity name is required');
      return;
    }
    
    if (!formData.category || formData.category.trim() === '') {
      toast.error('Category is required');
      return;
    }
    
    if (editingId) {
      console.log('Updating amenity with ID:', editingId);
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      console.log('Creating new amenity');
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this amenity?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (amenity) => {
    console.log('=== TOGGLE AMENITY DEBUG ===');
    console.log('Amenity object:', amenity);
    console.log('Current is_active:', amenity.is_active, typeof amenity.is_active);
    
    // Force the toggle - don't rely on the current value
    const newActiveState = !amenity.is_active;
    console.log('New is_active will be:', newActiveState, typeof newActiveState);
    
    const toggleData = { 
      name: amenity.name,
      description: amenity.description,
      icon: amenity.icon,
      category: amenity.category,
      is_active: newActiveState
    };
    
    console.log('Data to send:', toggleData);
    console.log('is_active value being sent:', toggleData.is_active, typeof toggleData.is_active);
    
    // Use the main updateMutation instead of creating a new one
    updateMutation.mutate({
      id: amenity.id,
      data: toggleData
    });
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
        <p className="text-red-600 mb-4">Failed to load amenities data</p>
        <p className="text-gray-600 mb-4">Error: {error.message}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Amenities Management</h1>
          <p className="text-gray-600">Manage venue amenities and facilities</p>
        </div>
        <Button 
          onClick={handleCreate} 
          className="flex items-center space-x-2"
          disabled={isCreating}
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'Creating...' : 'Add Amenity'}</span>
        </Button>
      </div>

      {/* Category Filter */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? 'Edit Amenity' : 'Create New Amenity'}
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600"
              title="Close form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amenity Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Parking, WiFi, Changing Rooms"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Facilities">Facilities</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Services">Services</option>
                  <option value="Safety">Safety</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon (Emoji or Unicode)
                </label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="🅿️ or parking"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the amenity"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isLoading || updateMutation.isLoading}
                className="flex items-center space-x-2"
              >
                {createMutation.isLoading || updateMutation.isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>
                  {createMutation.isLoading || updateMutation.isLoading
                    ? 'Saving...'
                    : editingId ? 'Update' : 'Create'}
                </span>
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Amenities List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAmenities.map((amenity) => (
          <Card key={amenity.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
                  {amenity.icon || <Wrench className="w-6 h-6 text-gray-500" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{amenity.name}</h3>
                  <p className="text-sm text-gray-600">{amenity.category}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleToggleActive(amenity)}
                  disabled={updateMutation.isLoading}
                  className={`p-2 rounded-lg ${
                    amenity.is_active
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-gray-400 hover:bg-gray-50'
                  } ${updateMutation.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={amenity.is_active ? 'Deactivate' : 'Activate'}
                >
                  {updateMutation.isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : amenity.is_active ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(amenity)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(amenity.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Category:</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {amenity.category}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  amenity.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {amenity.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {amenity.description && (
                <div className="text-sm text-gray-600 mt-2">
                  {amenity.description}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredAmenities.length === 0 && (
        <Card className="p-12 text-center">
          <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {categoryFilter === 'all' ? 'No amenities found' : `No amenities in ${categoryFilter} category`}
          </h3>
          <p className="text-gray-600 mb-6">
            {categoryFilter === 'all' 
              ? 'Get started by creating your first amenity'
              : 'Try selecting a different category or create a new amenity'
            }
          </p>
          <Button onClick={handleCreate}>Create Amenity</Button>
        </Card>
      )}
    </div>
  );
};

export default AmenitiesPage;
