import { useEffect, useRef } from 'react';
import { interactionAPI } from '../services/api';

export const useViewTracking = (artworkId, source = 'gallery') => {
  const startTimeRef = useRef(null);
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    startTimeRef.current = Date.now();

    return () => {
      // Track view when component unmounts
      if (startTimeRef.current && !hasTrackedRef.current) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        
        // Only track if viewed for more than 1 second
        if (duration > 1) {
          interactionAPI.trackView(artworkId, duration, source)
            .catch(err => console.error('Error tracking view:', err));
          hasTrackedRef.current = true;
        }
      }
    };
  }, [artworkId, source]);
};