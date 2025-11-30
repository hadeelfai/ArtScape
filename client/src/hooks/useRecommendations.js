
import { useState, useEffect } from 'react';
import { recommendationAPI } from '../services/api';

export const useRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await recommendationAPI.getForYou(20);
      setRecommendations(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  return { recommendations, loading, error, refetch: fetchRecommendations };
};