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
        return tleText;
      } else {
        throw new Error('CelesTrak returned empty or invalid TLE payload');
      }
    } catch (error) {
      lastError = error;
      const statusCode = error.response?.status;
      if (attempt > MAX_RETRIES) {
        recordFailure(SOURCE, error.message, { statusCode, fallbackUsed: true });
        console.warn('[CelesTrak API] Failed to fetch TLE, using mock/cache:', error.message);
        return null;
      }
    }
  }
  return null;
}
