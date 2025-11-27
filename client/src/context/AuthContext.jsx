import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isAdmin: false,        
  setUser: () => {},
  getUserById: () => null,
  login: async () => {},
  register: async () => {},
  logout: () => {}
});

const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('artscape:user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const persistUser = (user) => {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      window.localStorage.setItem('artscape:user', JSON.stringify(user));
    } else {
      window.localStorage.removeItem('artscape:user');
    }
  } catch {
    /* ignore persistence errors */
  }
};

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  if (import.meta.env.DEV) {
    return 'http://localhost:5500';
  }
  
  return '/api';
};

const API_BASE_URL = getApiUrl();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    persistUser(user);
  }, [user]);

  const getUserById = useMemo(() => {
    return (id) => {
      if (!id) return null;
      if (user && user.id === id) return user;
      return null;
    };
  }, [user]);

  const login = async (email, password) => {
    try {
      console.log('=== LOGIN DEBUG INFO ===');
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Full URL:', `${API_BASE_URL}/users/login`);
      console.log('Request payload:', { email, password: '***' });
      
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          console.log('Error data:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          console.log('Could not parse error response:', e);
          errorMessage = response.statusText || `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Login response data:', data);

      const userData = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        username: data.user.username,
        role: data.user.role || 'user',
        profileImage: data.user.profileImage || data.user.profile_image || null,
        artisticSpecialization: data.user.artisticSpecialization || data.user.artistic_specialization || null,
        bio: data.user.bio || null,
        followers: data.user.followers || 0,
        following: data.user.following || 0,
        bannerImage: data.user.bannerImage || data.user.banner_image || null,
        token: data.token
      };

      setUser(userData);
      console.log('Login successful!');
      return { success: true, user: userData };
    } catch (error) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { 
          success: false, 
          error: 'Unable to connect to server. Please check:\n1. Server is running on port 5500\n2. CORS is enabled on the server\n3. API URL is correct' 
        };
      }
      
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  const register = async (name, email, password, username, firstName = null, lastName = null, phoneNumber = null) => {
    try {
      console.log('=== REGISTER DEBUG INFO ===');
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Full URL:', `${API_BASE_URL}/users/register`);
      
      const payload = { name, email, password, username };
      // Always include firstName and lastName if provided (they're required fields)
      if (firstName !== null && firstName !== undefined) payload.firstName = firstName;
      if (lastName !== null && lastName !== undefined) payload.lastName = lastName;
      // Only include phoneNumber if it has a value
      if (phoneNumber && phoneNumber.trim() !== '') payload.phoneNumber = phoneNumber;
      
      console.log('Request payload:', { ...payload, password: '***' });
      
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = 'Registration failed';
        try {
          const errorData = await response.json();
          console.log('Error data:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          console.log('Could not parse error response:', e);
          errorMessage = response.statusText || `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Registration response data:', data);

      const userData = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        username: data.user.username,
        role: data.user.role || 'user',
        profileImage: data.user.profileImage || data.user.profile_image || null,
        artisticSpecialization: data.user.artisticSpecialization || data.user.artistic_specialization || null,
        bio: data.user.bio || null,
        followers: data.user.followers || 0,
        following: data.user.following || 0,
        bannerImage: data.user.bannerImage || data.user.banner_image || null,
        token: data.token
      };

      setUser(userData);
      console.log('Registration successful!');
      return { success: true, user: userData };
    } catch (error) {
      console.error('=== REGISTER ERROR ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { 
          success: false, 
          error: 'Unable to connect to server. Please check:\n1. Server is running on port 5500\n2. CORS is enabled on the server\n3. API URL is correct' 
        };
      }
      
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to log out');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      persistUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user && user.token),
      isAdmin: Boolean(user && user.role === 'admin'),
      setUser,
      getUserById,
      login,
      register,
      logout
    }),
    [user, getUserById]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);