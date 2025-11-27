import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5500';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!email) {
      setError('Please enter your email.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('A password reset link has been generated. Check your email (or server console in dev).');
        setError('');
        console.log('Reset URL:', data.url);
      } else {
        if (res.status === 404) {
          setError('Invalid email. This email is not registered. Please try again.');
        } else {
          setError(data.message || data.error || 'Failed to send reset link. Please try again.');
        }
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Unable to connect to server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-24">
        <div className="w-full max-w-md bg-white shadow-md rounded-xl p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Forgot Password</h1>
          <p className="text-sm text-gray-600 mb-6">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                  setMessage('');
                }}
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                placeholder="example@email.com"
              />
            </div>

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-3 rounded-lg text-sm font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link
                to="/signin"
                className="font-semibold text-gray-900 hover:text-gray-700 transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
