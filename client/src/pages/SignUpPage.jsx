import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    email: '',
    countryCode: '+966',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('=== FORM SUBMISSION ===');
    console.log('Form data:', { ...formData, password: '***' });

    const name = `${formData.firstName} ${formData.lastName}`.trim();

    if (!name) {
      setError('Please enter both first name and last name');
      setIsLoading(false);
      return;
    }

    if (!formData.username.trim()) {
      setError('Username is required');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Calling register function with:', { 
        name, 
        email: formData.email, 
        username: formData.username 
      });

      const result = await register(
        name,
        formData.email,
        formData.password,
        formData.username
      );

      console.log('Register result:', result);

      if (result.success) {
        console.log('Registration successful, navigating to home...');
        navigate('/');
      } else {
        console.log('Registration failed:', result.error);
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Unexpected registration error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex flex-col lg:flex-row pt-20 lg:pt-20">
        <div className="w-full lg:w-1/2 h-64 sm:h-80 lg:h-screen lg:min-h-screen">
          <img 
            src="/ducks.jpg" 
            alt="Artistic floral arrangement" 
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Image failed to load');
              e.target.style.display = 'none';
            }}
          />
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 lg:py-12 pt-24 lg:pt-24">
          <div className="w-full max-w-md lg:max-w-lg">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8 lg:mb-12">
              Create Account
            </h1>

            <form onSubmit={handleCreateAccount} className="space-y-4 lg:space-y-5">
              {/* Username (Required) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="@sara_alshareef"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 lg:py-3 text-sm lg:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* First + Last name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Sara"
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 lg:py-3 text-sm lg:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Alshareef"
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 lg:py-3 text-sm lg:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Sara.Alshareef1@Gmail.com"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 lg:py-3 text-sm lg:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••••"
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 lg:py-3 text-sm lg:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <select
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="px-3 py-2.5 lg:py-3 text-sm lg:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="+966">+966</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                    <option value="+971">+971</option>
                  </select>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="597423586"
                    disabled={isLoading}
                    className="col-span-2 w-full px-4 py-2.5 lg:py-3 text-sm lg:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm whitespace-pre-line">
                  {error}
                </div>
              )}

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white py-3 lg:py-4 rounded-lg font-semibold text-sm lg:text-base hover:bg-gray-800 transition-colors mt-6 lg:mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>

              {/* Already have account */}
              <div className="text-center mt-6 lg:mt-8">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to="/signin" className="font-semibold text-gray-900 hover:text-gray-700 transition-colors">
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
