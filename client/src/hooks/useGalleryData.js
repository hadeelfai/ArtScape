import { useEffect, useState } from 'react';
import { normalizeTagList } from '../utils/tagDefinitions';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5500';

export const useGalleryData = () => {
  const [users, setUsers] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, artworksRes] = await Promise.all([
          fetch(`${API_BASE_URL}/users`),
          fetch(`${API_BASE_URL}/artworks`)
        ]);
        
        // ✅ FIX: Handle HTTP errors properly
        if (!usersRes.ok) {
          console.error('Failed to fetch users:', usersRes.status);
          setUsers([]);
        } else {
          const usersData = await usersRes.json();
          // Ensure usersData is an array
          setUsers(Array.isArray(usersData) ? usersData : []);
        }

        if (!artworksRes.ok) {
          console.error('Failed to fetch artworks:', artworksRes.status);
          setArtworks([]);
        } else {
          const artworksData = await artworksRes.json();
          // Ensure artworksData is an array
          if (Array.isArray(artworksData)) {
            const normalizedArtworks = artworksData.map(artwork => ({
              ...artwork,
              tags: normalizeTagList(artwork.tags)
            }));
            setArtworks(normalizedArtworks);
          } else {
            setArtworks([]);
          }
        }
      } catch (error) {
        console.error('Gallery data fetch failed', error);
        setUsers([]);
        setArtworks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { users, artworks, loading };
};

