import { useEffect, useState } from 'react';
import { normalizeTagList } from '../utils/tagDefinitions';
import { getApiBaseUrl } from '../config.js';

export const useGalleryData = () => {
  const [users, setUsers] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const apiBase = getApiBaseUrl();
        const [usersRes, artworksRes] = await Promise.all([
          fetch(`${apiBase}/users`),
          fetch(`${apiBase}/artworks`)
        ]);
        
        // Handle HTTP errors properly
        if (!usersRes.ok) {
          console.error('Failed to fetch users:', usersRes.status);
          setUsers([]);
        } else {
          try {
            const responseText = await usersRes.text();
            const usersData = JSON.parse(responseText);
            setUsers(Array.isArray(usersData) ? usersData : []);
          } catch (jsonError) {
            console.error('Failed to parse users response as JSON:', jsonError);
            setUsers([]);
          }
        }

        if (!artworksRes.ok) {
          console.error('Failed to fetch artworks:', artworksRes.status);
          setArtworks([]);
        } else {
          try {
            const responseText = await artworksRes.text();
            const artworksData = JSON.parse(responseText);
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
          } catch (jsonError) {
            console.error('Failed to parse artworks response as JSON:', jsonError);
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

    const validateArtworkId = (artworkId) => {
      if (!artworkId || typeof artworkId !== 'string') {
        console.error('Invalid artworkId provided:', artworkId);
        return false;
      }
      return true;
    };

    const fetchRecommendations = async (artworkId) => {
      if (!validateArtworkId(artworkId)) return;

      try {
        const apiBase = getApiBaseUrl();
        const response = await fetch(`${apiBase}/api/recommendations/similar?artworkId=${artworkId}&topK=10`);
        if (!response.ok) {
          console.error('Failed to fetch recommendations:', response.status);
          return;
        }
        const data = await response.json();
        console.log('Recommendations received:', data.recommendations);
        return data.recommendations;
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      }
    };

    fetchData();
  }, []);

  return { users, artworks, loading };
};

