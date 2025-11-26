import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5500';

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
      console.log('Attempting login to:', `${API_BASE_URL}/users/login`);
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = response.statusText || `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Store user data including profile image
      const userData = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        profileImage: data.user.profileImage || data.user.profile_image || null, // Added this
        artisticSpecialization: data.user.artisticSpecialization || data.user.artistic_specialization || null,
        bio: data.user.bio || null,
        followers: data.user.followers || 0,
        following: data.user.following || 0,
        bannerImage: data.user.bannerImage || data.user.banner_image || null,
        token: data.token
      };

      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { 
          success: false, 
          error: 'Unable to connect to server. Please make sure the server is running on port 5500.' 
        };
      }
      
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  const register = async (name, email, password) => {
    try {
      console.log('Attempting registration to:', `${API_BASE_URL}/users/register`);
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        let errorMessage = 'Registration failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = response.statusText || `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Store user data including profile image
      const userData = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        profileImage: data.user.profileImage || data.user.profile_image || null, // Added this
        artisticSpecialization: data.user.artisticSpecialization || data.user.artistic_specialization || null,
        bio: data.user.bio || null,
        followers: data.user.followers || 0,
        following: data.user.following || 0,
        bannerImage: data.user.bannerImage || data.user.banner_image || null,
        token: data.token
      };

      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { 
          success: false, 
          error: 'Unable to connect to server. Please make sure the server is running on port 5500.' 
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