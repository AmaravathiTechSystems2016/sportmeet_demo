import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { authAPI } from '../../services/api';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Card from '../../components/UI/Card';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';
import { Save, Eye, EyeOff, Facebook, Mail, CheckCircle, XCircle } from 'lucide-react';

const SocialKeysPage = () => {
  const [showSecrets, setShowSecrets] = useState({});
  const [formData, setFormData] = useState({
    facebook: {
      app_id: '',
      app_secret: '',
      is_active: false
    },
    google: {
      client_id: '',
      client_secret: '',
      redirect_uri: '',
      is_active: false
    }
  });
  
  const queryClient = useQueryClient();

  // Fetch social media keys
  const { data: keysData, isLoading, error } = useQuery(
    'socialKeys',
    () => authAPI.getSocialProviders()
  );

  // Update form data when API data changes
  useEffect(() => {
    if (keysData?.data && Array.isArray(keysData.data.providers)) {
      const providers = keysData.data.providers;
      console.log('=== LOAD DEBUG ===');
      console.log('Loading social providers data:', providers);
      
      const facebookProvider = providers.find(p => p.provider === 'facebook');
      const googleProvider = providers.find(p => p.provider === 'google');
      
      console.log('Facebook provider data:', facebookProvider);
      console.log('Google provider data:', googleProvider);
      
      // Check if providers are configured (have secrets)
      const facebookConfigured = facebookProvider?.is_configured || false;
      const googleConfigured = googleProvider?.is_configured || false;
      
      console.log('Facebook configured:', facebookConfigured);
      console.log('Google configured:', googleConfigured);
      
      setFormData(prev => {
        const newData = {
          facebook: {
            app_id: facebookProvider?.client_id || '',
            app_secret: prev.facebook.app_secret || (facebookConfigured ? '***EXISTING_SECRET***' : ''),
            is_active: facebookProvider?.is_active || false,
            is_configured: facebookConfigured
          },
          google: {
            client_id: googleProvider?.client_id || '',
            client_secret: prev.google.client_secret || (googleConfigured ? '***EXISTING_SECRET***' : ''),
            redirect_uri: prev.google.redirect_uri || '',
            is_active: googleProvider?.is_active || false,
            is_configured: googleConfigured
          }
        };
        console.log('New form data being set:', newData);
        return newData;
      });
    }
  }, [keysData]);

  // Update social media keys mutation
  const updateMutation = useMutation(
    (data) => authAPI.updateSocialKeys(data),
    {
      onSuccess: () => {
        toast.success('Social media keys updated successfully!');
        queryClient.invalidateQueries('socialKeys');
      },
      onError: (error) => {
        console.error('Update error:', error);
        toast.error('Failed to update social media keys. Please try again.');
      }
    }
  );

  const handleInputChange = (provider, field, value) => {
    setFormData(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const handleToggleActive = (provider) => {
    console.log(`Toggling ${provider} active state from ${formData[provider].is_active} to ${!formData[provider].is_active}`);
    setFormData(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        is_active: !prev[provider].is_active
      }
    }));
  };

  const handleSave = () => {
    console.log('=== SAVE DEBUG ===');
    console.log('Form data before processing:', formData);
    
    const dataToSave = {};
    
    // Facebook data - only send secret if it's been changed (not empty)
    dataToSave.facebook = {
      provider: 'facebook',
      client_id: formData.facebook.app_id,
      is_active: formData.facebook.is_active
    };
    
    console.log('Facebook app_secret value:', formData.facebook.app_secret);
    console.log('Facebook app_secret type:', typeof formData.facebook.app_secret);
    console.log('Facebook app_secret length:', formData.facebook.app_secret?.length);
    console.log('Facebook app_secret trimmed:', formData.facebook.app_secret?.trim());
    console.log('Facebook app_secret truthy check:', !!formData.facebook.app_secret);
    console.log('Facebook app_secret trim check:', formData.facebook.app_secret && formData.facebook.app_secret.trim() !== '');
    
    // Only include secret if user has entered something new (not the placeholder)
    if (formData.facebook.app_secret && 
        formData.facebook.app_secret.trim() !== '' && 
        formData.facebook.app_secret !== '***EXISTING_SECRET***') {
      dataToSave.facebook.client_secret = formData.facebook.app_secret;
      console.log('Adding Facebook secret to save data');
    } else {
      console.log('NOT adding Facebook secret (empty, whitespace, or placeholder)');
    }
    
    // Google data - only send secret if it's been changed (not empty)
    dataToSave.google = {
      provider: 'google',
      client_id: formData.google.client_id,
      is_active: formData.google.is_active
    };
    
    console.log('Google client_secret value:', formData.google.client_secret);
    console.log('Google client_secret type:', typeof formData.google.client_secret);
    console.log('Google client_secret length:', formData.google.client_secret?.length);
    console.log('Google client_secret trimmed:', formData.google.client_secret?.trim());
    console.log('Google client_secret truthy check:', !!formData.google.client_secret);
    console.log('Google client_secret trim check:', formData.google.client_secret && formData.google.client_secret.trim() !== '');
    
    // Only include secret if user has entered something new (not the placeholder)
    if (formData.google.client_secret && 
        formData.google.client_secret.trim() !== '' && 
        formData.google.client_secret !== '***EXISTING_SECRET***') {
      dataToSave.google.client_secret = formData.google.client_secret;
      console.log('Adding Google secret to save data');
    } else {
      console.log('NOT adding Google secret (empty, whitespace, or placeholder)');
    }
    
    console.log('Final data being sent to API:', JSON.stringify(dataToSave, null, 2));
    updateMutation.mutate(dataToSave);
  };

  const toggleSecretVisibility = (provider, field) => {
    setShowSecrets(prev => ({
      ...prev,
      [`${provider}_${field}`]: !prev[`${provider}_${field}`]
    }));
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
      <div className="text-center py-8">
        <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600">Failed to load social media keys</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Social Media Keys</h1>
          <p className="text-gray-600">Configure Facebook and Google OAuth settings for social login</p>
        </div>
        <Button
          onClick={handleSave}
          loading={updateMutation.isLoading}
          disabled={updateMutation.isLoading}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Facebook Configuration */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Facebook className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Facebook</h3>
              <p className="text-sm text-gray-600">Configure Facebook OAuth settings</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => handleToggleActive('facebook')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.facebook.is_active ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.facebook.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Input
                label="App ID"
                value={formData.facebook.app_id}
                onChange={(e) => handleInputChange('facebook', 'app_id', e.target.value)}
                placeholder="Enter Facebook App ID"
                disabled={!formData.facebook.is_active}
              />
            </div>

            <div>
              <div className="relative">
                <Input
                  label="App Secret"
                  type={showSecrets.facebook_app_secret ? 'text' : 'password'}
                  value={formData.facebook.app_secret}
                  onChange={(e) => handleInputChange('facebook', 'app_secret', e.target.value)}
                  placeholder={
                    formData.facebook.app_secret === '***EXISTING_SECRET***' 
                      ? "Secret is already saved - enter new secret to update" 
                      : formData.facebook.app_secret 
                        ? "Enter new secret to update" 
                        : "Enter Facebook App Secret"
                  }
                  disabled={!formData.facebook.is_active}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => toggleSecretVisibility('facebook', 'app_secret')}
                >
                  {showSecrets.facebook_app_secret ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {formData.facebook.app_secret === '***EXISTING_SECRET***' && (
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Secret is already saved
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              {formData.facebook.is_active ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className={formData.facebook.is_active ? 'text-green-600' : 'text-gray-500'}>
                {formData.facebook.is_active ? 'Facebook login enabled' : 'Facebook login disabled'}
              </span>
            </div>
          </div>
        </Card>

        {/* Google Configuration */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Google</h3>
              <p className="text-sm text-gray-600">Configure Google OAuth settings</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => handleToggleActive('google')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.google.is_active ? 'bg-red-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.google.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Input
                label="Client ID"
                value={formData.google.client_id}
                onChange={(e) => handleInputChange('google', 'client_id', e.target.value)}
                placeholder="Enter Google Client ID"
                disabled={!formData.google.is_active}
              />
            </div>

            <div>
              <div className="relative">
                <Input
                  label="Client Secret"
                  type={showSecrets.google_client_secret ? 'text' : 'password'}
                  value={formData.google.client_secret}
                  onChange={(e) => handleInputChange('google', 'client_secret', e.target.value)}
                  placeholder={
                    formData.google.client_secret === '***EXISTING_SECRET***' 
                      ? "Secret is already saved - enter new secret to update" 
                      : formData.google.client_secret 
                        ? "Enter new secret to update" 
                        : "Enter Google Client Secret"
                  }
                  disabled={!formData.google.is_active}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => toggleSecretVisibility('google', 'client_secret')}
                >
                  {showSecrets.google_client_secret ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {formData.google.client_secret === '***EXISTING_SECRET***' && (
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Secret is already saved
                </p>
              )}
            </div>

            <div>
              <Input
                label="Redirect URI"
                value={formData.google.redirect_uri}
                onChange={(e) => handleInputChange('google', 'redirect_uri', e.target.value)}
                placeholder="http://localhost:3000/auth/google/callback"
                disabled={!formData.google.is_active}
              />
            </div>

            <div className="flex items-center gap-2 text-sm">
              {formData.google.is_active ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className={formData.google.is_active ? 'text-green-600' : 'text-gray-500'}>
                {formData.google.is_active ? 'Google login enabled' : 'Google login disabled'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="p-6 bg-blue-50">
        <h4 className="text-lg font-semibold text-blue-900 mb-4">Setup Instructions</h4>
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Secret fields are hidden for security. If you need to update a secret, 
            enter the new value in the secret field. Leave empty to keep the existing secret unchanged.
          </p>
        </div>
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            <strong>Important:</strong> Facebook login requires HTTPS in production. For localhost development, 
            make sure your Facebook app is configured for "localhost" domain. For production, use HTTPS URLs.
          </p>
        </div>
        <div className="space-y-4 text-sm text-blue-800">
          <div>
            <h5 className="font-semibold">Facebook Setup:</h5>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Go to <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="underline">Facebook Developers</a></li>
              <li>Create a new app or select existing app</li>
              <li>Add "Facebook Login" product</li>
              <li>Copy App ID and App Secret</li>
              <li>Add redirect URI: <code className="bg-blue-100 px-1 rounded">http://localhost:3000/auth/facebook/callback</code></li>
            </ol>
          </div>
          <div>
            <h5 className="font-semibold">Google Setup:</h5>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Go to <a href="https://console.developers.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
              <li>Create a new project or select existing project</li>
              <li>Enable Google+ API</li>
              <li>Create OAuth 2.0 credentials</li>
              <li>Add redirect URI: <code className="bg-blue-100 px-1 rounded">http://localhost:3000/auth/google/callback</code></li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SocialKeysPage;
