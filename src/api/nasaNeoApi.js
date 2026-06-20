import axios from 'axios';
import { getMockAsteroids } from '../data/mockAsteroids.js';

const NASA_NEO_API_URL = 'https://api.nasa.gov/neo/rest/v1/feed';

/**
 * Fetch Near-Earth Asteroids within a 4-day window starting today.
 * Falls back to local mock data if the API fails or is rate-limited.
 */
export async function fetchNearEarthAsteroids() {
  try {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    
    // Fetch 4 days total (today + 3 days in the future)
    const endDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const response = await axios.get(NASA_NEO_API_URL, {
      params: {
        start_date: startDate,
        end_date: endDate,
        api_key: 'DEMO_KEY',
      },
      timeout: 8000,
    });

    const neoData = response.data.near_earth_objects;
    const flattenedAsteroids = [];

    // Parse dynamic date keys (e.g. "2026-06-20")
    Object.keys(neoData).forEach(dateKey => {
      neoData[dateKey].forEach(neo => {
        const approach = neo.close_approach_data?.[0];
        if (!approach) return;

        // Extract velocity (km/s) and miss distance
        const velocity = parseFloat(approach.relative_velocity?.kilometers_per_second) || 12.0;
        const missDistanceKm = parseFloat(approach.miss_distance?.kilometers) || 5000000;
        const missDistanceLd = parseFloat(approach.miss_distance?.lunar) || 15;

        // Size in meters
        const minDia = neo.estimated_diameter?.meters?.estimated_diameter_min || 10;
        const maxDia = neo.estimated_diameter?.meters?.estimated_diameter_max || 50;

        // Generate deterministic RA/Dec based on its name/ID so it has stable coords
        const hash = parseInt(neo.id) || 12345;
        const ra = ((hash % 240) / 10); // 0 to 24 hours
        const dec = ((hash % 180) - 90); // -90 to +90 degrees

        flattenedAsteroids.push({
          id: neo.id,
          name: neo.name.replace(/\(|\)/g, ''), // clean name (e.g. "2024 JX1")
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

    // Sort by miss distance (closest first)
    flattenedAsteroids.sort((a, b) => a.miss_distance_km - b.miss_distance_km);

    return flattenedAsteroids;
  } catch (error) {
    console.warn('[NASA NeoWs API] Fetch failed or rate-limited. Falling back to mock database:', error.message);
    return getMockAsteroids();
  }
}
