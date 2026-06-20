/**
 * ISS Real-time Position API
 * Source: Where the ISS at? — https://api.wheretheiss.at/v1/satellites/25544
 * No API key required. Returns ISS lat/lon/alt/vel updated every second.
 *
 * CORS NOTE: Supports CORS natively.
 */
import axios from 'axios';
import { recordSuccess, recordFailure, recordRetry } from '../services/apiMonitor.js';

const ISS_API_URL = 'https://api.wheretheiss.at/v1/satellites/25544';
const SOURCE = 'wheretheiss';
const MAX_RETRIES = 2;

/**
 * Fetch the current ISS position.
 * Retries up to MAX_RETRIES times before falling back to mock.
 * @returns {{ lat: number, lon: number, timestamp: number }}
 */
export async function fetchISSPosition() {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    const t0 = Date.now();
    try {
      if (attempt > 1) recordRetry(SOURCE, attempt - 1);
      const response = await axios.get(ISS_API_URL, { timeout: 10000 });
      const data = response.data;
      const durationMs = Date.now() - t0;
      recordSuccess(SOURCE, durationMs, { isLiveData: true });
      return {
        lat: parseFloat(data.latitude),
        lon: parseFloat(data.longitude),
        timestamp: data.timestamp,
      };
    } catch (error) {
      lastError = error;
      const statusCode = error.response?.status;
      if (attempt > MAX_RETRIES) {
        // Final failure — log and fall back
        recordFailure(SOURCE, error.message, { statusCode, fallbackUsed: true });
        console.warn('[ISS API] Primary fetch failed, using fallback:', error.message);
        return generateMockISSPosition();
      }
    }
  }
  // Unreachable but satisfies linter
  return generateMockISSPosition();
}

/**
 * Generate a realistic mock ISS position.
 * The ISS orbits at ~51.6° inclination at ~7.66 km/s.
 * This creates a plausible position that updates over time.
 */
let _mockISSState = {
  lat: 28.5,
  lon: -80.5,
  direction: 1,
};

export function generateMockISSPosition() {
  const now = Date.now() / 1000;
  // ISS completes one orbit every ~92 minutes = 5520 seconds
  // Latitude oscillates between -51.6° and +51.6°
  const lat = 51.6 * Math.sin((2 * Math.PI * now) / 5520);
  const lon = ((now * (360 / 5520)) % 360) - 180;
  return {
    lat: parseFloat(lat.toFixed(4)),
    lon: parseFloat(lon.toFixed(4)),
    timestamp: Math.floor(now),
  };
}
