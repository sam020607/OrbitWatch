/**
 * N2YO Satellite API Integration
 * 
 * API docs: https://www.n2yo.com/api/
 * Get a free key at: https://www.n2yo.com/login/
 * 
 * TODO: Replace the empty string below with your N2YO API key:
 *   const N2YO_API_KEY = 'YOUR_KEY_HERE';
 * 
 * CORS: N2YO does not support browser CORS. In production, proxy these requests
 *       through a backend. In development, we use the Vite proxy (/api/n2yo).
 * 
 * Without a key, this module returns realistic mock data.
 */
import axios from 'axios';
import { MOCK_SATELLITES, MOCK_PASSES } from '../data/mockSatellites.js';

// TODO: Replace with your N2YO API key
const N2YO_API_KEY = '';

const USE_MOCK = !N2YO_API_KEY;

// Satellites above the observer within 90° elevation
const BASE_URL = '/api/n2yo/rest/v1/satellite';

/**
 * Fetch satellites currently above the observer.
 * N2YO endpoint: GET /above/{lat}/{lon}/{alt}/{radius}/{category_id}/&apiKey={key}
 * 
 * Category 0 = all satellites
 * @param {number} lat Observer latitude
 * @param {number} lon Observer longitude  
 * @param {number} alt Observer altitude in metres
 * @returns {Promise<Array>} Array of satellite objects
 */
export async function fetchAboveSatellites(lat, lon, alt = 0) {
  if (USE_MOCK) {
    console.info('[N2YO] Using mock satellite data. Set N2YO_API_KEY to use live data.');
    // Offset mock positions relative to observer
    return MOCK_SATELLITES.map(sat => ({
      ...sat,
      satlat: lat + sat._latOffset,
      satlon: lon + sat._lonOffset,
    }));
  }

  try {
    const radius = 70; // degrees search radius
    const category = 0; // all
    const url = `${BASE_URL}/above/${lat}/${lon}/${alt}/${radius}/${category}/&apiKey=${N2YO_API_KEY}`;
    const response = await axios.get(url, { timeout: 10000 });
    return response.data.above || [];
  } catch (error) {
    console.error('[N2YO] fetchAboveSatellites failed:', error.message);
    return MOCK_SATELLITES;
  }
}

/**
 * Fetch pass predictions for a satellite over the next 24 hours.
 * N2YO endpoint: GET /passes/{id}/{lat}/{lon}/{alt}/{days}/{min_elevation}/&apiKey={key}
 * 
 * @param {number} satId  N2YO satellite ID (25544 = ISS)
 * @param {number} lat    Observer latitude
 * @param {number} lon    Observer longitude
 * @param {number} alt    Observer altitude (m)
 * @returns {Promise<Array>} Array of pass prediction objects
 */
export async function fetchSatellitePasses(satId, lat, lon, alt = 0) {
  if (USE_MOCK) {
    const passes = MOCK_PASSES[satId] || MOCK_PASSES[25544]; // fall back to ISS passes
    return adjustPassTimesToNow(passes);
  }

  try {
    const days = 1;
    const minElevation = 10;
    const url = `${BASE_URL}/passes/${satId}/${lat}/${lon}/${alt}/${days}/${minElevation}/&apiKey=${N2YO_API_KEY}`;
    const response = await axios.get(url, { timeout: 10000 });
    return response.data.passes || [];
  } catch (error) {
    console.error('[N2YO] fetchSatellitePasses failed:', error.message);
    return adjustPassTimesToNow(MOCK_PASSES[25544]);
  }
}

/**
 * Shift mock pass timestamps to be relative to the current time.
 * This ensures mock countdowns always show plausible near-future passes.
 */
function adjustPassTimesToNow(passes) {
  if (!passes || passes.length === 0) return [];
  const now = Math.floor(Date.now() / 1000);
  const firstPass = passes[0];
  const offset = now + 900 - firstPass.startUTC; // first pass 15 min from now
  return passes.map((p, i) => ({
    ...p,
    startUTC: p.startUTC + offset + i * 5700, // ~95min orbital period
    endUTC:   p.endUTC   + offset + i * 5700,
    maxUTC:   p.maxUTC   + offset + i * 5700,
  }));
}

/**
 * Fetch TLE (Two-Line Element) data for a satellite.
 * N2YO endpoint: GET /tle/{id}&apiKey={key}
 * 
 * @param {number} satId Satellite NORAD ID
 * @returns {Promise<{line1: string, line2: string}>}
 */
export async function fetchTLE(satId) {
  if (USE_MOCK) return getMockTLE(satId);
  try {
    const url = `${BASE_URL}/tle/${satId}&apiKey=${N2YO_API_KEY}`;
    const response = await axios.get(url, { timeout: 10000 });
    const { line1, line2 } = response.data.tle ? parseTLEString(response.data.tle) : {};
    return { line1, line2 };
  } catch (error) {
    console.error('[N2YO] fetchTLE failed:', error.message);
    return getMockTLE(satId);
  }
}

function parseTLEString(tleString) {
  const lines = tleString.trim().split('\n');
  return { line1: lines[0], line2: lines[1] };
}

function getMockTLE(satId) {
  // ISS TLE (approximate — for real tracking use live TLE)
  return {
    line1: '1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9993',
    line2: '2 25544  51.6400 208.9163 0006317  86.9395 273.2641 15.49815691389451',
  };
}
