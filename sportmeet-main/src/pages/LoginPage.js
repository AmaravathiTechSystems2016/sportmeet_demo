import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useSite } from '../contexts/SiteContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Card from '../components/UI/Card';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import SocialLogin from '../components/Auth/SocialLogin';
import toast from 'react-hot-toast';
import { AlertCircle, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const { login } = useAuth();
  const { siteSettings } = useSite();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectParam = new URLSearchParams(location.search).get('redirect');
  const statePath = location.state?.from
    ? `${location.state.from.pathname || ''}${location.state.from.search || ''}`
    : '';
  const from = statePath || redirectParam || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const fillDemoCredentials = (email, password) => {
    setAuthError('');
    setValue('email', email, { shouldValidate: true, shouldDirty: true });
    setValue('password', password, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setAuthError('');
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast.success('Login successful!');
        const userType = result.user?.user_type;
        const target = userType === 'admin' && from === '/dashboard' ? '/admin' : from;
        navigate(target, { replace: true });
      } else {
        const message = result.error || 'Login failed. Please check the email and password.';
        setAuthError(message);
        toast.error(message);
      }
    } catch (error) {
      const message = 'An unexpected login error occurred. Please try again.';
      setAuthError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            {siteSettings.logo_auth ? (
              <img 
                src={siteSettings.logo_auth} 
                alt={siteSettings.site_name} 
                className="h-12 w-auto"
              />
            ) : (
              <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">SM</span>
              </div>
            )}
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        <Card className="p-8">
          <div className="mb-6 rounded-lg border border-primary-100 bg-primary-50 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-primary-600" />
              <div>
                <p className="text-sm font-semibold text-primary-900">Local demo access</p>
                <p className="mt-1 text-sm text-primary-800">
                  Use admin demo credentials to open the SportMeet admin dashboard.
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('admin@sportmeet.com', 'admin123')}
                    className="rounded-md border border-primary-200 bg-white px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('owner@sportmeet.com', 'owner123')}
                    className="rounded-md border border-primary-200 bg-white px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100"
                  >
                    Owner
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('player@sportmeet.com', 'player123')}
                    className="rounded-md border border-primary-200 bg-white px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100"
                  >
                    Player
                  </button>
                </div>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                error={errors.email?.message}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
            </div>

            <div>
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  error={errors.password?.message}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Social Login */}
            <SocialLogin 
              onSuccess={(data) => {
                navigate(from, { replace: true });
              }}
              onError={(error) => {
                console.error('Social login error:', error);
              }}
            />

            {authError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Sign in
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
