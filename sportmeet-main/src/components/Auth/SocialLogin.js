import React, { useState, useEffect } from 'react';
import { useMutation } from 'react-query';
import { authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Facebook, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../UI/LoadingSpinner';

const SocialLogin = ({ onSuccess, onError }) => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const { loginWithToken } = useAuth();

  // Facebook login mutation
  const facebookMutation = useMutation(
    (accessToken) => authAPI.facebookLogin(accessToken),
    {
      onSuccess: (response) => {
        loginWithToken(response.data.token, response.data.user);
        toast.success('Logged in with Facebook successfully!');
        onSuccess?.(response.data);
      },
      onError: (error) => {
        console.error('Facebook login error:', error);
        toast.error('Facebook login failed. Please try again.');
        onError?.(error);
      }
    }
  );

  // Google login mutation
  const googleMutation = useMutation(
    (data) => {
      console.log('Google login mutation called with data:', data);
      return authAPI.googleLogin(data);
    },
    {
      onSuccess: (response) => {
        console.log('Google login success:', response);
        loginWithToken(response.data.token, response.data.user);
        toast.success('Logged in with Google successfully!');
        onSuccess?.(response.data);
      },
      onError: (error) => {
        console.error('Google login error:', error);
        toast.error('Google login failed. Please try again.');
        onError?.(error);
      }
    }
  );

  // Load available providers
  useEffect(() => {
    const loadProviders = async () => {
      try {
        console.log('Loading social providers...');
        const response = await authAPI.getSocialProviders();
        console.log('Social providers loaded:', response.data.providers);
        setProviders(response.data.providers || []);
      } catch (error) {
        console.error('Error loading social providers:', error);
      }
    };
    loadProviders();
  }, []);

  // Facebook login handler
  const handleFacebookLogin = () => {
    setLoading(true);
    
    // Ensure providers are loaded first
    if (providers.length === 0) {
      toast.error('Social login providers not loaded yet. Please try again.');
      setLoading(false);
      return;
    }
    
    // Load Facebook SDK
    if (!window.FB) {
      loadFacebookSDK().then(() => {
        // Wait a bit for FB to be ready
        setTimeout(() => {
          if (window.FB && window.FB.login) {
            window.FB.login(facebookLoginCallback, { scope: 'email,public_profile' });
          } else {
            toast.error('Facebook SDK not ready. Please try again.');
            setLoading(false);
          }
        }, 100);
      });
    } else {
      // Check if FB is ready
      if (window.FB && window.FB.login) {
        window.FB.login(facebookLoginCallback, { scope: 'email,public_profile' });
      } else {
        toast.error('Facebook SDK not ready. Please try again.');
        setLoading(false);
      }
    }
  };

  // Google login handler
  const handleGoogleLogin = () => {
    setLoading(true);
    
    // Ensure providers are loaded first
    if (providers.length === 0) {
      toast.error('Social login providers not loaded yet. Please try again.');
      setLoading(false);
      return;
    }
    
    // Get Google Client ID from providers
    const googleProvider = providers.find(p => p.provider === 'google');
    const clientId = googleProvider?.client_id;
    
    if (!clientId) {
      toast.error('Google Client ID not configured. Please contact administrator.');
      setLoading(false);
      return;
    }
    
    // Use the new Google Identity Services library
    loadGoogleIdentityServices().then(() => {
      initGoogleIdentityServices(clientId);
    }).catch((error) => {
      console.error('Error loading Google Identity Services:', error);
      toast.error('Failed to load Google authentication. Please try again.');
      setLoading(false);
    });
  };

  // Facebook login callback
  const facebookLoginCallback = (response) => {
    if (response.authResponse) {
      const accessToken = response.authResponse.accessToken;
      facebookMutation.mutate(accessToken);
    } else {
      setLoading(false);
      toast.error('Facebook login was cancelled.');
    }
  };

  // Load Facebook SDK
  const loadFacebookSDK = () => {
    return new Promise((resolve) => {
      if (window.FB) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        // Get Facebook App ID from providers
        const facebookProvider = providers.find(p => p.provider === 'facebook');
        const appId = facebookProvider?.client_id || process.env.REACT_APP_FACEBOOK_APP_ID || 'your-facebook-app-id';
        
        console.log('Initializing Facebook SDK with App ID:', appId);
        
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v7.0'
        });
        resolve();
      };
      
      document.head.appendChild(script);
    });
  };

  // Load Google Identity Services
  const loadGoogleIdentityServices = () => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.accounts) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Google Identity Services script loaded');
        resolve();
      };
      
      script.onerror = (error) => {
        console.error('Error loading Google Identity Services script:', error);
        reject(error);
      };
      
      document.head.appendChild(script);
    });
  };

  // Initialize Google Identity Services
  const initGoogleIdentityServices = (clientId) => {
    try {
      console.log('Initializing Google Identity Services with Client ID:', clientId);
      
      if (!window.google || !window.google.accounts) {
        console.error('Google Identity Services not loaded properly');
        toast.error('Google Identity Services not loaded. Please try again.');
        setLoading(false);
        return;
      }
      
      // Initialize the Google Identity Services
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          console.log('Google Identity Services callback:', response);
          if (response.credential) {
            // Decode the JWT token to get user info
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            console.log('Google user info:', payload);
            
            // Send the credential to our backend
            googleMutation.mutate({ credential: response.credential });
          } else {
            console.error('No credential received from Google');
            toast.error('Google login failed: No credential received');
            setLoading(false);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });
      
      // Trigger the Google sign-in popup
      window.google.accounts.id.prompt((notification) => {
        console.log('Google prompt notification:', notification);
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Google prompt was not displayed or skipped');
          setLoading(false);
        }
      });
      
    } catch (error) {
      console.error('Google Identity Services initialization error:', error);
      setLoading(false);
      toast.error('Google authentication error: ' + error.message);
    }
  };

  const isLoading = loading || facebookMutation.isLoading || googleMutation.isLoading;

  return (
    <div className="space-y-4">
      {/* Social Login Buttons */}
      <div className="space-y-3">
        {providers.some(p => p.provider === 'facebook' && p.is_configured) && (
          <button
            onClick={handleFacebookLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading && facebookMutation.isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Facebook className="w-5 h-5 mr-3 text-blue-600" />
            )}
            Continue with Facebook
          </button>
        )}

        {providers.some(p => p.provider === 'google' && p.is_configured) && (
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading && googleMutation.isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Mail className="w-5 h-5 mr-3 text-red-600" />
            )}
            Continue with Google
          </button>
        )}
      </div>

      {/* Divider */}
      {providers.some(p => p.is_configured) && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialLogin;
