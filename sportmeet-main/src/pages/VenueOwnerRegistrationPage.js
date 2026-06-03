import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Card from '../components/UI/Card';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import SocialLogin from '../components/Auth/SocialLogin';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Building } from 'lucide-react';

const VenueOwnerRegistrationPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Set user type as venue_owner
      const { agree_terms, ...rest } = data;
      const userData = {
        ...rest,
        user_type: 'venue_owner'
      };
      
      const result = await registerUser(userData);
      if (result.success) {
        toast.success('Venue Owner account created successfully! You can now list your venues.');
        navigate('/venues/create');
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Become a Venue Owner
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account to start listing your sports venues
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <Card className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="First Name"
                  type="text"
                  autoComplete="given-name"
                  placeholder="John"
                  error={errors.first_name?.message}
                  {...register('first_name', {
                    required: 'First name is required',
                    minLength: {
                      value: 2,
                      message: 'First name must be at least 2 characters',
                    },
                  })}
                />
              </div>
              <div>
                <Input
                  label="Last Name"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Doe"
                  error={errors.last_name?.message}
                  {...register('last_name', {
                    required: 'Last name is required',
                    minLength: {
                      value: 2,
                      message: 'Last name must be at least 2 characters',
                    },
                  })}
                />
              </div>
            </div>

            <div>
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="john@example.com"
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

            {/* Username removed - backend will auto-generate from email */}

            <div>
              <Input
                label="Phone Number"
                type="tel"
                autoComplete="tel"
                placeholder="+61 4XX XXX XXX"
                error={errors.phone_number?.message}
                {...register('phone_number', {
                  required: 'Phone number is required for venue owners',
                  pattern: {
                    value: /^\+?[1-9][\d]{0,15}$/,
                    message: 'Invalid phone number',
                  },
                })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="City"
                  type="text"
                  placeholder="Sydney"
                  error={errors.city?.message}
                  {...register('city', {
                    required: 'City is required for venue owners',
                  })}
                />
              </div>
              <div>
                <Input
                  label="State"
                  type="text"
                  placeholder="NSW"
                  error={errors.state?.message}
                  {...register('state', {
                    required: 'State is required for venue owners',
                  })}
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  error={errors.password?.message}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
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

            <div>
              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  error={errors.password_confirm?.message}
                  {...register('password_confirm', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === password || 'Passwords do not match',
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                {...register('agree_terms', {
                  required: 'You must agree to the terms and conditions',
                })}
              />
              <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <Link
                  to="/terms"
                  className="text-primary-600 hover:text-primary-500"
                >
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link
                  to="/privacy"
                  className="text-primary-600 hover:text-primary-500"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.agree_terms && (
              <p className="text-sm text-accent-600">{errors.agree_terms.message}</p>
            )}

            {/* Social Login */}
            <SocialLogin 
              onSuccess={(data) => {
                // Set user type as venue_owner for social login
                if (data.user) {
                  data.user.user_type = 'venue_owner';
                }
                navigate('/venues/create');
              }}
              onError={(error) => {
                console.error('Social login error:', error);
              }}
            />

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
                    Creating account...
                  </>
                ) : (
                  <>
                    <Building className="w-4 h-4 mr-2" />
                    Create Venue Owner Account
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in here
            </Link>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Want to join as a player?{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Register as Player
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VenueOwnerRegistrationPage;
