import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function SignInPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Allow login using email OR username (at least one is required)
      if (!formData.email && !formData.username) {
        setError('Please enter your email or username.');
        setIsLoading(false);
        return;
      }

      const result = await login(
        formData.email,
        formData.username,
        formData.password
      );

      if (!result.success) {
        setError(result.error || 'Login failed. Please check your credentials.');
        return;
      }

      const loggedInUser = result.user;
      const isAdmin =
        loggedInUser?.role?.toLowerCase() === 'admin' ||
        loggedInUser?.isAdmin === true;

      if (isAdmin) {
        navigate('/admin');
      } else if (loggedInUser?.id) {
        navigate(`/profile/${loggedInUser.id}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
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
              Welcome Back!
            </h1>

            <form onSubmit={handleLogin} className="space-y-4 lg:space-y-5">
              {/* Username (optional, you can log in with email instead) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="@sara_alshareef"
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 lg:py-3 text-sm lg:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Sara.Alshareef1@Gmail.com"
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 lg:py-3 text-sm lg:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can sign in with either your email or your username.
                </p>
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
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 lg:py-3 text-sm lg:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm whitespace-pre-line">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white py-3 lg:py-4 rounded-lg font-semibold text-sm lg:text-base hover:bg-gray-800 transition-colors mt-6 lg:mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="text-center mt-6 lg:mt-8">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="font-semibold text-gray-900 hover:text-gray-700 transition-colors"
                  >
                    Sign Up
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
