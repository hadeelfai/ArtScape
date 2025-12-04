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
        const [usersData, artworksData] = await Promise.all([
          usersRes.json(),
          artworksRes.json()
        ]);
        setUsers(usersData);
        const normalizedArtworks = artworksData.map(artwork => ({
          ...artwork,
          tags: normalizeTagList(artwork.tags)
        }));
        setArtworks(normalizedArtworks);
      } catch (error) {
        console.error('Gallery data fetch failed', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { users, artworks, loading };
};

