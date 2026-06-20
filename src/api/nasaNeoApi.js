import axios from 'axios';
import { getMockAsteroids } from '../data/mockAsteroids.js';
import { recordSuccess, recordFailure, recordRetry } from '../services/apiMonitor.js';

const NASA_NEO_API_URL = 'https://api.nasa.gov/neo/rest/v1/feed';
const SOURCE = 'nasa-neo';
const MAX_RETRIES = 1;

/**
 * Fetch Near-Earth Asteroids within a 4-day window starting today.
 * Falls back to local mock data if the API fails or is rate-limited.
 */
export async function fetchNearEarthAsteroids() {
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  const endDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const cacheKey = 'orbitwatch_neows_cache';
  const blockKey = 'orbitwatch_neows_blocked_until';

  // 1. Check if NASA NeoWs is currently backed off due to rate-limiting/429
  try {
    const blockedUntil = localStorage.getItem(blockKey);
    if (blockedUntil && Date.now() < Number(blockedUntil)) {
      console.warn(`[NASA NeoWs API] Backing off due to previous rate limit. Serving from cache.`);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { asteroids } = JSON.parse(cached);
        if (asteroids && asteroids.length > 0) {
          recordSuccess(SOURCE, 0, { isLiveData: false, cached: true, note: 'Blocked backoff fallback' });
          return asteroids;
        }
      }
      return getMockAsteroids();
    }
  } catch (blockErr) {
    console.warn('[NASA NeoWs API] Failed to check block status:', blockErr.message);
  }

  // 2. Try loading from localStorage cache first if it's fresh (same day and less than 4 hours old)
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { asteroids, date, timestamp } = JSON.parse(cached);
      const isFresh = date === startDate && (Date.now() - timestamp < 4 * 60 * 60 * 1000); // 4 hours
      if (isFresh && asteroids && asteroids.length > 0) {
        console.log('[NASA NeoWs API] Serving fresh asteroids from local cache.');
        recordSuccess(SOURCE, 0, { isLiveData: true, cached: true });
        return asteroids;
      }
    }
  } catch (cacheErr) {
    console.warn('[NASA NeoWs API] Failed to parse NeoWs cache:', cacheErr.message);
  }

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    const t0 = Date.now();
    try {
      if (attempt > 1) recordRetry(SOURCE, attempt - 1);
      
      const apiKey = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';
      const response = await axios.get(NASA_NEO_API_URL, {
        params: {
          start_date: startDate,
          end_date: endDate,
          api_key: apiKey,
        },
        timeout: 8000,
      });

      const neoData = response.data.near_earth_objects;
      const flattenedAsteroids = [];

      Object.keys(neoData).forEach(dateKey => {
        neoData[dateKey].forEach(neo => {
          const approach = neo.close_approach_data?.[0];
          if (!approach) return;

          const velocity = parseFloat(approach.relative_velocity?.kilometers_per_second) || 12.0;
          const missDistanceKm = parseFloat(approach.miss_distance?.kilometers) || 5000000;
          const missDistanceLd = parseFloat(approach.miss_distance?.lunar) || 15;
          const minDia = neo.estimated_diameter?.meters?.estimated_diameter_min || 10;
          const maxDia = neo.estimated_diameter?.meters?.estimated_diameter_max || 50;
          const hash = parseInt(neo.id) || 12345;
          const ra = ((hash % 240) / 10);
          const dec = ((hash % 180) - 90);

          flattenedAsteroids.push({
            id: neo.id,
            name: neo.name.replace(/\(|\)/g, ''),
            nasa_jpl_url: neo.nasa_jpl_url || `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${neo.id}`,
            absolute_magnitude: neo.absolute_magnitude_h || 22.0,
            is_potentially_hazardous: !!neo.is_potentially_hazardous_asteroid,
            diameter_min: minDia,
            diameter_max: maxDia,
            velocity_kms: velocity,
            miss_distance_km: missDistanceKm,
            miss_distance_ld: missDistanceLd,
            close_approach_timestamp: approach.epoch_date_close_approach || Date.now(),
            ra,
            dec,
          });
        });
      });

      flattenedAsteroids.sort((a, b) => a.miss_distance_km - b.miss_distance_km);
      const durationMs = Date.now() - t0;
      recordSuccess(SOURCE, durationMs, { isLiveData: true });

      // Save to cache
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          asteroids: flattenedAsteroids,
          date: startDate,
          timestamp: Date.now()
        }));
        // Clear any previous block status on success
        localStorage.removeItem(blockKey);
      } catch (saveErr) {
        console.warn('[NASA NeoWs API] Failed to save NeoWs cache:', saveErr.message);
      }

      return flattenedAsteroids;
    } catch (error) {
      lastError = error;
      const statusCode = error.response?.status;
      if (attempt > MAX_RETRIES) {
        recordFailure(SOURCE, error.message, { statusCode, fallbackUsed: true });
        console.warn('[NASA NeoWs API] Fetch failed or rate-limited. Falling back to cache or mock:', error.message);
        
        // If we got a 429 or 403, set a 1-hour backoff status
        if (statusCode === 429 || statusCode === 403) {
          try {
            console.warn('[NASA NeoWs API] Rate limit or access denied. Backing off for 1 hour.');
            localStorage.setItem(blockKey, String(Date.now() + 1 * 60 * 60 * 1000));
          } catch (saveBlockErr) {
            // ignore
          }
        }

        // Return expired cache if we have it
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const { asteroids } = JSON.parse(cached);
            if (asteroids && asteroids.length > 0) {
              console.warn('[NASA NeoWs API] Returning expired cached asteroid data as failover.');
              return asteroids;
            }
          }
        } catch (failoverErr) {
          // ignore
        }

        return getMockAsteroids();
      }
    }
  }
  return getMockAsteroids();
}
