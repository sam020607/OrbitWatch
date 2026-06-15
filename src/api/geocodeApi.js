/**
 * Geocoding API — City name or address → lat/lon
 * Source: Nominatim (OpenStreetMap) — https://nominatim.openstreetmap.org/
 * 
 * Free, no API key required. Rate limit: 1 request/second.
 * For production apps with high traffic, self-host or use a paid geocoding service.
 */
import axios from 'axios';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

/**
 * Search for a location by name or address.
 * Returns an array of matching results with lat/lon.
 * 
 * @param {string} query  City name, address, or "lat,lon" string
 * @returns {Promise<Array>} Array of location results
 */
export async function geocodeSearch(query) {
  // Check if query looks like "lat,lon" coordinates
  const coordMatch = query.trim().match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[2]);
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return [{
        lat: lat.toString(),
        lon: lon.toString(),
        display_name: `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`,
        name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
        type: 'coordinates',
      }];
    }
  }

  try {
    const response = await axios.get(`${NOMINATIM_BASE}/search`, {
      params: {
        q: query,
        format: 'json',
        limit: 5,
        addressdetails: 1,
      },
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'ProjectZenith/1.0 (satellite-tracker)',
      },
      timeout: 8000,
    });
    return response.data.map(item => ({
      lat: item.lat,
      lon: item.lon,
      display_name: item.display_name,
      name: item.address?.city
        || item.address?.town
        || item.address?.village
        || item.address?.county
        || item.name
        || query,
      country: item.address?.country,
      type: item.type,
    }));
  } catch (error) {
    console.error('[Geocode] Search failed:', error.message);
    // Return fallback popular locations
    return getFallbackLocations(query);
  }
}

/**
 * Reverse geocode: lat/lon → location name
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<string>} Location name
 */
export async function reverseGeocode(lat, lon) {
  try {
    const response = await axios.get(`${NOMINATIM_BASE}/reverse`, {
      params: { lat, lon, format: 'json' },
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'ProjectZenith/1.0',
      },
      timeout: 8000,
    });
    const addr = response.data.address;
    return addr?.city || addr?.town || addr?.village || addr?.country || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  } catch {
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  }
}

function getFallbackLocations(query) {
  const popular = [
    { name: 'New York', lat: '40.7128', lon: '-74.0060', country: 'United States', display_name: 'New York, USA' },
    { name: 'London', lat: '51.5074', lon: '-0.1278', country: 'United Kingdom', display_name: 'London, UK' },
    { name: 'Tokyo', lat: '35.6762', lon: '139.6503', country: 'Japan', display_name: 'Tokyo, Japan' },
    { name: 'Sydney', lat: '-33.8688', lon: '151.2093', country: 'Australia', display_name: 'Sydney, Australia' },
    { name: 'Mumbai', lat: '19.0760', lon: '72.8777', country: 'India', display_name: 'Mumbai, India' },
  ];
  const q = query.toLowerCase();
  const matches = popular.filter(p => p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q));
  return matches.length > 0 ? matches : [popular[0]]; // default to New York
}
