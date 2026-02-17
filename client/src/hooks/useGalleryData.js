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
            console.log('Raw users response:', responseText); // Debug raw response
            const usersData = JSON.parse(responseText);
            console.log('Users data received:', usersData); // Debug log
            setUsers(Array.isArray(usersData) ? usersData : []);
          } catch (jsonError) {
            console.error('Failed to parse users response as JSON:', jsonError);
            console.error('Response status:', usersRes.status);
            console.error('Response headers:', Object.fromEntries(usersRes.headers.entries()));
            setUsers([]);
          }
        }

        if (!artworksRes.ok) {
          console.error('Failed to fetch artworks:', artworksRes.status);
          setArtworks([]);
        } else {
          try {
            const responseText = await artworksRes.text();
            console.log('Raw artworks response:', responseText); // Debug raw response
            const artworksData = JSON.parse(responseText);
            console.log('Artworks data received:', artworksData);
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
            console.error('Response status:', artworksRes.status);
            console.error('Response headers:', Object.fromEntries(artworksRes.headers.entries()));
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

