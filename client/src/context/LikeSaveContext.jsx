import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

const LikeSaveContext = createContext();

export function useLikeSave() {
  return useContext(LikeSaveContext);
}

const KEY = (user, type) => `artscape-${user?.id || ''}-${type}`;

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5500';

export function LikeSaveProvider({ children }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch likes and saves from server when user is authenticated
  useEffect(() => {
    if (!user?.id) {
      setLiked([]);
      setSaved([]);
      return;
    }

    async function fetchLikesSaves() {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/artworks/user/${user.id}/likes-saves`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setLiked(data.liked || []);
          setSaved(data.saved || []);
          // Also update localStorage as backup
          if (user) {
            localStorage.setItem(KEY(user, 'liked'), JSON.stringify(data.liked || []));
            localStorage.setItem(KEY(user, 'saved'), JSON.stringify(data.saved || []));
          }
        } else {
          // Fallback to localStorage if server request fails
          const storedLiked = JSON.parse(localStorage.getItem(KEY(user, 'liked'))) || [];
          const storedSaved = JSON.parse(localStorage.getItem(KEY(user, 'saved'))) || [];
          setLiked(storedLiked);
          setSaved(storedSaved);
        }
      } catch (error) {
        console.error('Error fetching likes/saves:', error);
        // Fallback to localStorage if server request fails
        const storedLiked = JSON.parse(localStorage.getItem(KEY(user, 'liked'))) || [];
        const storedSaved = JSON.parse(localStorage.getItem(KEY(user, 'saved'))) || [];
        setLiked(storedLiked);
        setSaved(storedSaved);
      } finally {
        setLoading(false);
      }
    }

    fetchLikesSaves();
  }, [user?.id]);

  // Sync localStorage when state changes (as backup)
  useEffect(() => {
    if (user) {
      localStorage.setItem(KEY(user, 'liked'), JSON.stringify(liked));
    }
  }, [liked, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(KEY(user, 'saved'), JSON.stringify(saved));
    }
  }, [saved, user]);

  async function likeArtwork(id) {
    if (!user?.id) return;
    
    // Optimistic update
    const wasLiked = liked.includes(id);
    if (!wasLiked) {
      setLiked(l => [...l, id]);
    }

    try {
      const response = await fetch(`${API_BASE}/artworks/${id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token && { Authorization: `Bearer ${user.token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({})
      });

      if (!response.ok) {
        // Revert on error
        if (!wasLiked) {
          setLiked(l => l.filter(i => i !== id));
        }
        throw new Error('Failed to like artwork');
      }
    } catch (error) {
      console.error('Error liking artwork:', error);
      // Revert on error
      if (!wasLiked) {
        setLiked(l => l.filter(i => i !== id));
      }
    }
  }

  async function unlikeArtwork(id) {
    if (!user?.id) return;
    
    // Optimistic update
    const wasLiked = liked.includes(id);
    if (wasLiked) {
      setLiked(l => l.filter(i => i !== id));
    }

    try {
      const response = await fetch(`${API_BASE}/artworks/${id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token && { Authorization: `Bearer ${user.token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({})
      });

      if (!response.ok) {
        // Revert on error
        if (wasLiked) {
          setLiked(l => [...l, id]);
        }
        throw new Error('Failed to unlike artwork');
      }
    } catch (error) {
      console.error('Error unliking artwork:', error);
      // Revert on error
      if (wasLiked) {
        setLiked(l => [...l, id]);
      }
    }
  }

  async function saveArtwork(id) {
    if (!user?.id) return;
    
    // Optimistic update
    const wasSaved = saved.includes(id);
    if (!wasSaved) {
      setSaved(l => [...l, id]);
    }

    try {
      const response = await fetch(`${API_BASE}/artworks/${id}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token && { Authorization: `Bearer ${user.token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({})
      });

      if (!response.ok) {
        // Revert on error
        if (!wasSaved) {
          setSaved(l => l.filter(i => i !== id));
        }
        throw new Error('Failed to save artwork');
      }
    } catch (error) {
      console.error('Error saving artwork:', error);
      // Revert on error
      if (!wasSaved) {
        setSaved(l => l.filter(i => i !== id));
      }
    }
  }

  async function unsaveArtwork(id) {
    if (!user?.id) return;
    
    // Optimistic update
    const wasSaved = saved.includes(id);
    if (wasSaved) {
      setSaved(l => l.filter(i => i !== id));
    }

    try {
      const response = await fetch(`${API_BASE}/artworks/${id}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token && { Authorization: `Bearer ${user.token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({})
      });

      if (!response.ok) {
        // Revert on error
        if (wasSaved) {
          setSaved(l => [...l, id]);
        }
        throw new Error('Failed to unsave artwork');
      }
    } catch (error) {
      console.error('Error unsaving artwork:', error);
      // Revert on error
      if (wasSaved) {
        setSaved(l => [...l, id]);
      }
    }
  }

  return (
    <LikeSaveContext.Provider value={{ liked, saved, likeArtwork, unlikeArtwork, saveArtwork, unsaveArtwork, loading }}>
      {children}
    </LikeSaveContext.Provider>
  );
}
