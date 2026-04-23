import axios from 'axios';

let cachedRate = 0.2666; 
let lastFetched = null;

export const getSarToUsdRate = async () => {
  const API_KEY = '4d064090edd72eadf5a3cb24'; // API key
  const now = Date.now();

  // If we haven't fetched today, get the fresh rate
  if (!lastFetched || (now - lastFetched) > 86400000) {
    try {
      const response = await axios.get(
        `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/SAR/USD`
      );
      if (response.data && response.data.conversion_rate) {
        cachedRate = response.data.conversion_rate;
        lastFetched = now;
        console.log(`[SUCCESS] Fresh rate fetched: ${cachedRate}`);
      }
    } catch (error) {
      console.error("[ERROR] API failed, using cached/fallback rate:", error.message);
    }
  }
  return cachedRate;
};