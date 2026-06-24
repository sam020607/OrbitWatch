import axios from 'axios';
import { recordSuccess, recordFailure, recordRetry, recordTLESync } from '../services/apiMonitor.js';

const NASA_APOD_API_URL = 'https://api.nasa.gov/planetary/apod';
const SOURCE = 'nasa-apod';
const MAX_RETRIES = 1;

/**
 * Fetch NASA's Astronomy Picture of the Day.
 * Falls back to a local mock if the API fails or is rate-limited.
 */
export async function fetchAstronomyPictureOfTheDay() {
  const todayStr = new Date().toISOString().split('T')[0];

  // Serve from localStorage cache without hitting the network
  try {
    const cached = localStorage.getItem('orbitwatch_apod_data');
    if (cached) {
      const parsed = JSON.parse(cached);
      // Bust cache if missing media_type (stale entry) so we get fresh data with all fields
      const hasMediaType = parsed && typeof parsed.media_type === 'string';
      if (parsed && parsed.date === todayStr && parsed.explanation && hasMediaType) {
        recordSuccess(SOURCE, 0, { isLiveData: false }); // cache hit
        return parsed;
      } else if (!hasMediaType) {
        localStorage.removeItem('orbitwatch_apod_data'); // force re-fetch
      }
    }
  } catch (e) {
    console.warn('[NASA APOD API] Failed to read from localStorage:', e);
  }

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    const t0 = Date.now();
    try {
      if (attempt > 1) recordRetry(SOURCE, attempt - 1);
      const key = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';
      const response = await axios.get(NASA_APOD_API_URL, {
        params: { api_key: key },
        timeout: 20000,
      });
      const data = response.data;
      const durationMs = Date.now() - t0;
      if (data && data.url) {
        try { localStorage.setItem('orbitwatch_apod_data', JSON.stringify(data)); } catch (_) {}
      }
      recordSuccess(SOURCE, durationMs, { isLiveData: true });
      return data;
    } catch (error) {
      lastError = error;
      const statusCode = error.response?.status;
      if (attempt > MAX_RETRIES) {
        recordFailure(SOURCE, error.message, { statusCode, fallbackUsed: true });
        console.warn('[NASA APOD API] Fetch failed. Using fallback APOD data:', error.message);
        return {
          title: "Pillars of Creation",
          url: "https://images-assets.nasa.gov/image/PIA18919/PIA18919~orig.jpg",
          explanation: "This composite image combines data from Hubble and the James Webb Space Telescope to reveal the famous Pillars of Creation in stellar detail. The towering structures are columns of cool interstellar gas and dust, reflecting light from a cluster of nearby hot, young stars.",
          date: todayStr,
          copyright: "NASA, ESA, CSA, STScI"
        };
      }
    }
  }
  // Unreachable
  return null;
}
