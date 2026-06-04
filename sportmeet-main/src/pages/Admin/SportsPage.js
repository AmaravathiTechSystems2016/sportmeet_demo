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
  Gamepad2,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

const SportsPage = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#3B82F6',
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: sportsData, isLoading, error } = useQuery(
    'sports',
    venuesAPI.getSports,
    {
      staleTime: 0,
      cacheTime: 0,
      onSuccess: (data) => {
        console.log('Sports data fetched successfully:', data);
      },
      onError: (error) => {
        console.error('Error fetching sports data:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
      }
    }
  );

  const createMutation = useMutation(
    (data) => venuesAPI.createSport(data),
    {
      onSuccess: (response) => {
        console.log('=== SPORT CREATE SUCCESS ===');
        console.log('Response:', response);
        queryClient.invalidateQueries('sports');
        toast.success('Sport created successfully! Form closed. Click "Add Sport" to create another.');
        setIsCreating(false);
        resetForm();
      },
      onError: (error) => {
        console.log('=== SPORT CREATE ERROR ===');
        console.log('Error:', error);
        console.log('Error response:', error.response?.data);
        toast.error(error.response?.data?.error || 'Failed to create sport');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => venuesAPI.updateSport(id, data),
    {
      onSuccess: (response) => {
        console.log('Sport update success:', response);
        console.log('Updated sport data:', response.data);
        
        // Simple cache invalidation and refetch
        queryClient.invalidateQueries('sports');
        queryClient.refetchQueries('sports');
        
        console.log('Cache invalidated and refetched');
        
        toast.success('Sport updated successfully');
        setEditingId(null);
        resetForm();
      },
      onError: (error) => {
        console.error('Sport update error:', error);
        console.error('Error details:', error.response?.data);
        toast.error(error.response?.data?.error || 'Failed to update sport');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => venuesAPI.deleteSport(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sports');
        toast.success('Sport deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete sport');
      }
    }
  );

  const sports = Array.isArray(sportsData?.data) ? sportsData.data : [];
  
  // Debug logging
  console.log('=== SPORTS DATA DEBUG ===');
  console.log('Sports data:', sportsData);
  console.log('Sports array:', sports);
  console.log('First sport is_active:', sports[0]?.is_active);
  console.log('Sports data timestamp:', new Date().toISOString());

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      color: '#3B82F6',
      is_active: true
    });
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    resetForm();
  };

  const handleEdit = (sport) => {
    setEditingId(sport.id);
    setIsCreating(false);
    setFormData({
      name: sport.name,
      description: sport.description || '',
      icon: sport.icon || '',
      color: sport.color || '#3B82F6',
      is_active: sport.is_active
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    resetForm();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('=== FORM SUBMISSION DEBUG ===');
    console.log('Form submission data:', formData);
    console.log('isCreating:', isCreating);
    console.log('editingId:', editingId);
    console.log('Form data name:', formData.name);
    console.log('Form data is_active:', formData.is_active, typeof formData.is_active);
    
    // Validate required fields
    if (!formData.name || formData.name.trim() === '') {
      toast.error('Sport name is required');
      return;
    }
    
    if (editingId) {
      console.log('Updating sport with ID:', editingId);
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      console.log('Creating new sport');
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this sport?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (sport) => {
    console.log('=== TOGGLE SPORT DEBUG ===');
    console.log('Sport object:', sport);
    console.log('Current is_active:', sport.is_active, typeof sport.is_active);
    
    // Force the toggle - don't rely on the current value
    const newActiveState = !sport.is_active;
    console.log('New is_active will be:', newActiveState, typeof newActiveState);
    
    const toggleData = { 
      name: sport.name,
      description: sport.description,
      icon: sport.icon,
      color: sport.color,
      is_active: newActiveState
    };
    
    console.log('Data to send:', toggleData);
    console.log('is_active value being sent:', toggleData.is_active, typeof toggleData.is_active);
    
    // Use the main updateMutation instead of creating a new one
    updateMutation.mutate({
      id: sport.id,
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
        <p className="text-red-600 mb-4">Failed to load sports data</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Sports Management</h1>
          <p className="text-gray-600">Manage sports and their configurations</p>
        </div>
        <Button 
          onClick={handleCreate} 
          className="flex items-center space-x-2"
          disabled={isCreating}
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'Creating...' : 'Add Sport'}</span>
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? 'Edit Sport' : 'Create New Sport'}
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
                  Sport Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Football, Basketball"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon (Emoji or Unicode)
                </label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="football or ball"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
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
                placeholder="Brief description of the sport"
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

      {/* Sports List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sports.map((sport) => (
          <Card key={sport.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                  style={{ backgroundColor: sport.color + '20', color: sport.color }}
                >
                  {sport.icon || <Gamepad2 className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{sport.name}</h3>
                  <p className="text-sm text-gray-600">{sport.description || 'No description'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleToggleActive(sport)}
                  disabled={updateMutation.isLoading}
                  className={`p-2 rounded-lg ${
                    sport.is_active
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-gray-400 hover:bg-gray-50'
                  } ${updateMutation.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={sport.is_active ? 'Deactivate' : 'Activate'}
                >
                  {updateMutation.isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : sport.is_active ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(sport)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(sport.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Color:</span>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: sport.color }}
                  ></div>
                  <span className="font-mono text-xs">{sport.color}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  sport.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {sport.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {sports.length === 0 && (
        <Card className="p-12 text-center">
          <Gamepad2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sports found</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first sport</p>
          <Button onClick={handleCreate}>Create Sport</Button>
        </Card>
      )}
    </div>
  );
};

export default SportsPage;
