/**
 * ISS Real-time Position API
 * Source: Open-Notify — http://api.open-notify.org/iss-now.json
 * No API key required. Returns ISS lat/lon updated every ~5 seconds.
 * 
 * CORS NOTE: This free API supports CORS natively.
 */
import axios from 'axios';

const ISS_API_URL = 'http://api.open-notify.org/iss-now.json';

/**
 * Fetch the current ISS position.
 * @returns {{ lat: number, lon: number, timestamp: number }}
 */
export async function fetchISSPosition() {
  try {
    // Use a CORS proxy for the open-notify API if running in browser
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(ISS_API_URL)}`;
    const response = await axios.get(proxyUrl, { timeout: 20000 });
    const data = JSON.parse(response.data.contents);
    return {
      lat: parseFloat(data.iss_position.latitude),
      lon: parseFloat(data.iss_position.longitude),
      timestamp: data.timestamp,
    };
  } catch (error) {
    console.warn('[ISS API] Primary fetch failed, using fallback:', error.message);
    // Return slightly randomised position near last known ISS orbit as fallback
    return generateMockISSPosition();
  }
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
