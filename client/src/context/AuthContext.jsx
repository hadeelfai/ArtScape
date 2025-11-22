import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const DEFAULT_USER = {
  id: 'user-1',
  name: 'Sara Alshareef',
  artisticSpecialization: 'Oil Painter | Landscape Artist',
  bio: 'Sara Alshareef is a passionate oil painter specializing in capturing the serene beauty of landscapes.',
  followers: 385,
  following: 512,
  profileImage: '/assets/images/profilepicture.jpg',
  bannerImage: '/assets/images/profileheader.jpg',
  
};

const MOCK_USERS = {
  [DEFAULT_USER.id]: DEFAULT_USER,
  'user-2': {
    id: 'user-2',
    name: 'Layla Ibrahim',
    artisticSpecialization: 'Digital Illustrator | Concept Artist',
    bio: 'Layla blends vibrant color palettes with futuristic forms to tell visual stories.',
    followers: 742,
    following: 301,
    profileImage: '/assets/images/profilepicture2.jpg',
    bannerImage: '/assets/images/profileheader2.jpg',
    
  }
};

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
  const [user, setUser] = useState(() => getStoredUser() || DEFAULT_USER);

  useEffect(() => {
    persistUser(user);
  }, [user]);

  const getUserById = useMemo(() => {
    return (id) => {
      if (!id) return null;
      if (user && user.id === id) return user;
      return MOCK_USERS[id] || null;
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
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ email, password }),
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Store user data
      const userData = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        token: data.token
      };

      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle network errors specifically
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

      // Store user data
      const userData = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
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

  const logout = () => {
    setUser(null);
    persistUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user && user.token), // Authenticated if user has a token
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

