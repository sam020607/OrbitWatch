import axios from 'axios';
import { recordSuccess, recordFailure, recordRetry, recordTLESync } from '../services/apiMonitor.js';

const SOURCE = 'celestrak';
const MAX_RETRIES = 1;

/**
 * Fetch ISS TLE from CelesTrak.
 * CelesTrak GP data endpoint. No key required.
 * @param {number} satId NORAD ID for ISS is 25544
 * @returns {Promise<string|null>} Raw TLE string
 */
export async function fetchCelesTrakTLE(satId = 25544) {
  const cacheKey = `orbitwatch_tle_cache_${satId}`;
  
  // Try loading from localStorage cache first
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { tleText, timestamp } = JSON.parse(cached);
      const isFresh = Date.now() - timestamp < 2 * 60 * 60 * 1000; // 2 hours
      if (isFresh && tleText) {
        console.log(`[CelesTrak API] Serving fresh TLE for ${satId} from local cache.`);
        recordSuccess(SOURCE, 0, { isLiveData: true, cached: true });
        recordTLESync({ source: 'LocalStorage Cache', count: 1 });
        return tleText;
      }
    }
  } catch (cacheErr) {
    console.warn('[CelesTrak API] Failed to parse TLE cache:', cacheErr.message);
  }

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    const t0 = Date.now();
    try {
      if (attempt > 1) recordRetry(SOURCE, attempt - 1);
      
      // Try fetching via local Vite proxy first to avoid browser CORS issues
      const localUrl = `/api/celestrak/NORAD/elements/gp.php?CATNR=${satId}&FORMAT=TLE`;
      const directUrl = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${satId}&FORMAT=TLE`;
      
      let response;
      let usedProxy = true;
      try {
        response = await axios.get(localUrl, { timeout: 8000 });
      } catch (proxyError) {
        console.warn('[CelesTrak API] Proxy fetch failed, trying direct fallback...', proxyError.message);
        response = await axios.get(directUrl, { timeout: 8000 });
        usedProxy = false;
      }
      
      const durationMs = Date.now() - t0;
      const tleText = response.data;
      if (tleText && typeof tleText === 'string' && tleText.includes(String(satId))) {
        recordSuccess(SOURCE, durationMs, { isLiveData: true });
        recordTLESync({ source: usedProxy ? 'CelesTrak (Vite Proxy)' : 'CelesTrak (Direct)', count: 1 });
        
        // Save to cache
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            tleText,
            timestamp: Date.now()
          }));
        } catch (saveErr) {
          console.warn('[CelesTrak API] Failed to save TLE cache:', saveErr.message);
        }
        
        return tleText;
      } else {
        throw new Error('CelesTrak returned empty or invalid TLE payload');
      }
    } catch (error) {
      lastError = error;
      const statusCode = error.response?.status;
      if (attempt > MAX_RETRIES) {
        recordFailure(SOURCE, error.message, { statusCode, fallbackUsed: true });
        console.warn('[CelesTrak API] Failed to fetch TLE:', error.message);
        
        // If we have an expired cache, use it as fallback rather than returning null!
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const { tleText } = JSON.parse(cached);
            if (tleText) {
              console.warn(`[CelesTrak API] Returning expired cached TLE for ${satId} as failover.`);
              return tleText;
            }
          }
        } catch (failoverErr) {
          // ignore
        }
        
        return null;
      }
    }
  }
  return null;
}
