import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  setUser: () => {},
  login: async () => {},
  register: async () => {},
  logout: () => {}
});

// Read user from localStorage
const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('artscape:user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Save / clear user in localStorage
const persistUser = (user) => {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      window.localStorage.setItem('artscape:user', JSON.stringify(user));
    } else {
      window.localStorage.removeItem('artscape:user');
    }
  } catch {
    // ignore storage errors
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

  // Keep localStorage in sync with state
  useEffect(() => {
    persistUser(user);
  }, [user]);

  /**
   * Login with email OR username + password
   */
  const login = async (email, username, password) => {
    try {
      const payload = { password };
      if (email) payload.email = email;
      if (username) payload.username = username;

      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          errorData.error ||
          response.statusText ||
          'Login failed';
        throw new Error(errorMessage);
      }

      const data = await response.json();

      const userData = {
        id: data.user.id || data.user._id,
        name: data.user.name,
        email: data.user.email,
        username: data.user.username,
        role: (data.user.role || 'user').toLowerCase(),
        profileImage: data.user.profileImage || data.user.profile_image || '/Profileimages/User.jpg',
        artisticSpecialization:
          data.user.artisticSpecialization || data.user.artistic_specialization || null,
        bio: data.user.bio || null,
        followers: data.user.followers || 0,
        following: data.user.following || 0,
        bannerImage: data.user.bannerImage || data.user.banner_image || '/Profileimages/Cover.jpg',
        token: data.token
      };

      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return {
          success: false,
          error:
            'Unable to connect to server. Please check:\n1. Server is running\n2. API URL is correct'
        };
      }
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  /**
   * Register a new user
   */
  const register = async (
    name,
    email,
    password,
    username,
    firstName = null,
    lastName = null,
    phoneNumber = null
  ) => {
    try {
      const payload = { name, email, password, username };

      if (firstName !== null && firstName !== undefined) payload.firstName = firstName;
      if (lastName !== null && lastName !== undefined) payload.lastName = lastName;
      if (phoneNumber && phoneNumber.trim() !== '') payload.phoneNumber = phoneNumber;

      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          errorData.error ||
          response.statusText ||
          'Registration failed';
        throw new Error(errorMessage);
      }

      const data = await response.json();

      const userData = {
        id: data.user.id || data.user._id,
        name: data.user.name,
        email: data.user.email,
        username: data.user.username,
        role: (data.user.role || 'user').toLowerCase(),
        profileImage: data.user.profileImage || data.user.profile_image || '/Profileimages/User.jpg',
        artisticSpecialization:
          data.user.artisticSpecialization || data.user.artistic_specialization || null,
        bio: data.user.bio || null,
        followers: data.user.followers || 0,
        following: data.user.following || 0,
        bannerImage: data.user.bannerImage || data.user.banner_image || '/Profileimages/Cover.jpg',
        token: data.token
      };

      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return {
          success: false,
          error:
            'Unable to connect to server. Please check:\n1. Server is running\n2. API URL is correct'
        };
      }
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  /**
   * Logout: call server, then clear local user
   */
  const logout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message || errorData.error || 'Failed to log out';
        console.error(errorMessage);
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
      isAdmin: Boolean(
        user && user.role && user.role.toLowerCase() === 'admin'
      ),
      setUser,
      login,
      register,
      logout
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
