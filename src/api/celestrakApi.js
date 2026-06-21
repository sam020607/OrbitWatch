import axios from 'axios';
import { recordSuccess, recordFailure, recordRetry, recordTLESync } from '../services/apiMonitor.js';

const SOURCE = 'celestrak';
const MAX_RETRIES = 1;

// Realistic hardcoded ISS TLE as final fallback
const DEFAULT_ISS_TLE = `ISS (ZARYA)
1 25544U 98067A   26170.83410214  .00008787  00000+0  16559-3 0  9997
2 25544  51.6327 286.9925 0004571 206.3214 153.7542 15.49322400572160`;

/**
 * Fetch ISS TLE from Where The ISS At or CelesTrak.
 * @param {number} satId NORAD ID for ISS is 25544
 * @returns {Promise<string|null>} Raw TLE string
 */
export async function fetchCelesTrakTLE(satId = 25544) {
  const cacheKey = `orbitwatch_tle_cache_${satId}`;
  const blockKey = 'orbitwatch_celestrak_blocked_until';
  
  // 1. Check if Celestrak requests are currently backed off due to a 403 Forbidden block
  try {
    const blockedUntil = localStorage.getItem(blockKey);
    if (blockedUntil && Date.now() < Number(blockedUntil)) {
      const timeLeftMinutes = Math.ceil((Number(blockedUntil) - Date.now()) / 60000);
      console.warn(`[CelesTrak API] Backing off. Celestrak requests blocked due to previous 403. Retrying in ${timeLeftMinutes}m.`);
      
      // Serve from cache (even if expired) to avoid sending network requests
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { tleText } = JSON.parse(cached);
        if (tleText) {
          console.log(`[CelesTrak API] Serving cached TLE for ${satId} during backoff window.`);
          recordSuccess(SOURCE, 0, { isLiveData: false, cached: true, note: 'Blocked backoff fallback' });
          recordTLESync({ source: 'LocalStorage Cache (Failover)', count: 1 });
          return tleText;
        }
      }
      
      // Serve hardcoded fallback if ISS
      if (satId === 25544) {
        console.warn(`[CelesTrak API] Serving hardcoded fallback TLE during backoff window.`);
        recordSuccess(SOURCE, 0, { isLiveData: false, cached: true, note: 'Backoff hardcoded fallback' });
        recordTLESync({ source: 'Hardcoded Fallback', count: 1 });
        return DEFAULT_ISS_TLE;
      }
      return null;
    }
  } catch (blockErr) {
    console.warn('[CelesTrak API] Failed to check block status:', blockErr.message);
  }

  // 2. Try loading from localStorage cache first if it's fresh (24 hours cache)
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { tleText, timestamp } = JSON.parse(cached);
      const isFresh = Date.now() - timestamp < 24 * 60 * 60 * 1000; // 24 hours
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

  const t0 = Date.now();

  // 3. Try CORS-friendly Where The ISS At API first (for ISS NORAD 25544)
  if (satId === 25544) {
    try {
      console.log('[CelesTrak API] Fetching ISS TLE from CORS-friendly wheretheiss.at endpoint...');
      const wtiaUrl = 'https://api.wheretheiss.at/v1/satellites/25544/tles';
      const response = await axios.get(wtiaUrl, { timeout: 8000 });
      const data = response.data;
      if (data && data.line1 && data.line2) {
        const tleText = `${data.header || 'ISS (ZARYA)'}\n${data.line1}\n${data.line2}`;
        const durationMs = Date.now() - t0;
        
        recordSuccess(SOURCE, durationMs, { isLiveData: true });
        recordTLESync({ source: 'Where The ISS At (CORS-friendly)', count: 1 });
        
        // Save to cache
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            tleText,
            timestamp: Date.now()
          }));
          localStorage.removeItem(blockKey);
        } catch (saveErr) {
          console.warn('[CelesTrak API] Failed to save TLE cache:', saveErr.message);
        }
        
        return tleText;
      }
    } catch (wtiaErr) {
      console.warn('[CelesTrak API] Where The ISS At TLE fetch failed, falling back to CelesTrak...', wtiaErr.message);
    }
  }

  // 4. Fallback to CelesTrak (for other satellites or as secondary backup)
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    const tStart = Date.now();
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
      
      const durationMs = Date.now() - tStart;
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
          // Clear any previous block status on success
          localStorage.removeItem(blockKey);
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
        
        // If we got a 403 (Forbidden) indicating rate limiting or IP block, set the block status for 12 hours
        if (statusCode === 403) {
          try {
            console.warn('[CelesTrak API] 403 Forbidden detected. Caching block status for 12 hours to cease excessive requests.');
            localStorage.setItem(blockKey, String(Date.now() + 12 * 60 * 60 * 1000));
          } catch (saveBlockErr) {
            // ignore
          }
        }
        
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
        
        // Hardcoded default fallback for ISS
        if (satId === 25544) {
          console.warn('[CelesTrak API] Returning hardcoded default ISS TLE.');
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              tleText: DEFAULT_ISS_TLE,
              timestamp: Date.now()
            }));
          } catch (e) {}
          recordTLESync({ source: 'Hardcoded Fallback', count: 1 });
          return DEFAULT_ISS_TLE;
        }
        
        return null;
      }
    }
  }
  return null;
}
