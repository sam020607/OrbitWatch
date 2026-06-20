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
import { azimuthToCompass } from '../utils/orbitMath.js';
import { recordSuccess, recordFailure, recordRetry, recordTLESync } from '../services/apiMonitor.js';

// TODO: Replace with your N2YO API key
const N2YO_API_KEY = import.meta.env.VITE_N2YO_API_KEY ?? '';
const USE_MOCK = !N2YO_API_KEY;

// Satellites above the observer within 90° elevation
const BASE_URL = '/api/n2yo/rest/v1/satellite';

/**
 * Enriches raw N2YO satellite objects with missing properties and maps satlng to satlon.
 */
function enrichSatelliteData(sat) {
  const satlon = sat.satlng !== undefined ? parseFloat(sat.satlng) : parseFloat(sat.satlon);
  const satlat = parseFloat(sat.satlat);
  
  // Set reasonable default altitude and velocity based on satname or satid
  let satalt = parseFloat(sat.satalt) || 550.0;
  let velocity = parseFloat(sat.velocity) || 7.59;
  let type = sat.type || 'comms';
  let intDesignator = sat.intDesignator || 'Unknown';
  let launchDate = sat.launchDate || 'Unknown';
  
  const name = (sat.satname || '').toUpperCase();
  if (name.includes('ISS') || name.includes('SPACE STATION') || name.includes('TIANGONG') || name.includes('CSS')) {
    type = 'space-station';
    satalt = 408.0;
    velocity = 7.66;
  } else if (name.includes('SES') || name.includes('EUTELSAT') || name.includes('DIRECTV') || name.includes('ASTRA') || name.includes('ECHOSTAR') || name.includes('GALAXY') || name.includes('INTELSAT') || name.includes('ANIK') || name.includes('BRASILSAT') || name.includes('VIASAT') || name.includes('SATMEX') || name.includes('SKYNET') || name.includes('THAICOM') || name.includes('ASIASAT') || name.includes('TELKOM') || name.includes('MEASAT')) {
    type = 'tv';
    satalt = 35786.0;
    velocity = 3.07;
  } else if (name.includes('NOAA') || name.includes('METEOR') || name.includes('GOES') || name.includes('FENGYUN')) {
    type = 'weather';
    satalt = 830.0;
    velocity = 7.45;
  } else if (name.includes('GPS') || name.includes('GLONASS') || name.includes('GALILEO') || name.includes('BEIDOU')) {
    type = 'gps';
    satalt = 20200.0;
    velocity = 3.87;
  } else if (name.includes('STARLINK') || name.includes('ONEWEB') || name.includes('IRIDIUM')) {
    type = 'comms';
    satalt = 550.0;
    velocity = 7.59;
  } else if (name.includes('DEBRIS') || name.includes('R/B') || name.includes('DEB')) {
    type = 'debris';
    satalt = 600.0;
    velocity = 7.55;
  } else if (name.includes('AQUA') || name.includes('TERRA') || name.includes('LANDSAT') || name.includes('SENTINEL')) {
    type = 'earth-obs';
    satalt = 705.0;
    velocity = 7.50;
  }
  
  return {
    ...sat,
    satlat,
    satlon,
    satalt,
    velocity,
    type,
    intDesignator,
    launchDate
  };
}

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
    recordSuccess('n2yo', 12, { isLiveData: false });
    recordTLESync({ source: 'Mock N2YO', count: MOCK_SATELLITES.length });
    // Offset mock positions relative to observer
    return MOCK_SATELLITES.map(sat => ({
      ...sat,
      satlat: lat + sat._latOffset,
      satlon: lon + sat._lonOffset,
    }));
  }

  const t0 = Date.now();
  try {
    const radius = 70; // degrees search radius
    const category = 0; // all
    const url = `${BASE_URL}/above/${lat}/${lon}/${alt}/${radius}/${category}/&apiKey=${N2YO_API_KEY}`;
    const response = await axios.get(url, { timeout: 10000 });
    const above = response.data.above || [];
    const durationMs = Date.now() - t0;
    recordSuccess('n2yo', durationMs, { isLiveData: true });
    recordTLESync({ source: 'N2YO Above API', count: above.length });
    return above.map(enrichSatelliteData);
  } catch (error) {
    const statusCode = error.response?.status;
    recordFailure('n2yo', error.message, { statusCode, fallbackUsed: true });
    console.error('[N2YO] fetchAboveSatellites failed:', error.message);
    return MOCK_SATELLITES;
  }
}

/**
 * Fetch ISS pass predictions for an observer location.
 *
 * PRIORITY CHAIN for ISS (satId 25544):
 *   1. Pollux Labs (PRIMARY)  — https://iss-api.polluxlabs.io
 *      Free, CORS-enabled, uses CelesTrak TLEs refreshed every 6 h.
 *      Returns up to 20 passes with visibility flag, rise/set/peak times,
 *      azimuth, and elevation. No auth required.
 *   2. Mock data (FALLBACK)   — time-adjusted relative to now.
 *      Used only when Pollux fails or returns an empty set.
 *
 * NOTE: wheretheiss.at does NOT have a pass-prediction endpoint (404).
 *       It is used exclusively for real-time ISS position (lat/lon/alt/vel)
 *       in issApi.js, polled every 5 s.
 *
 * For non-ISS satellites, N2YO is used if an API key is configured,
 * otherwise mock data.
 *
 * @param {number} satId  NORAD satellite ID (25544 = ISS)
 * @param {number} lat    Observer latitude
 * @param {number} lon    Observer longitude
 * @param {number} alt    Observer altitude (m)
 * @returns {Promise<Array>} Array of normalised pass objects
 */
export async function fetchSatellitePasses(satId, lat, lon, alt = 0) {
  // ── PRIORITY 1: Pollux Labs (ISS only) ────────────────────────────────────
  if (satId === 25544) {
    const t0 = Date.now();
    try {
      const url = `https://iss-api.polluxlabs.io/iss-pass?lat=${lat}&lon=${lon}`;
      const response = await axios.get(url, { timeout: 10000 });
      const passes = response.data.passes || [];
      const durationMs = Date.now() - t0;

      if (passes.length > 0) {
        recordSuccess('pollux-iss-passes', durationMs, { isLiveData: true });
        console.info(`[Pollux] Got ${passes.length} ISS passes in ${durationMs} ms`);
        return passes.map(p => ({
          startUTC:       new Date(p.rise.time).getTime() / 1000,
          maxUTC:         new Date(p.culmination.time).getTime() / 1000,
          endUTC:         new Date(p.set.time).getTime() / 1000,
          startAz:        p.rise.azimuth_deg,
          startAzCompass: p.rise.compass,
          maxAz:          0,
          maxAzCompass:   'Peak',
          endAz:          p.set.azimuth_deg,
          endAzCompass:   p.set.compass,
          maxEl:          p.culmination.elevation_deg,
          duration:       p.duration_sec,
          mag:            p.visible ? -2.5 : null,
        }));
      }

      // Pollux returned 0 passes (e.g. no passes in next window) — still a success
      recordSuccess('pollux-iss-passes', durationMs, { isLiveData: true });
      console.info('[Pollux] 0 passes returned — using mock for demo');
    } catch (error) {
      const statusCode = error.response?.status;
      recordFailure('pollux-iss-passes', error.message, { statusCode, fallbackUsed: true });
      console.error('[Pollux] ISS passes failed, using mock fallback:', error.message);
    }

    // ── FALLBACK: Mock data (ISS) ────────────────────────────────────────────
    recordSuccess('pollux-iss-passes', 0, { isLiveData: false });
    return adjustPassTimesToNow(MOCK_PASSES[25544]);
  }

  // ── Non-ISS satellites: N2YO (primary) → mock (fallback) ──────────────────
  if (USE_MOCK) {
    const passes = MOCK_PASSES[satId] || MOCK_PASSES[25544];
    recordSuccess('n2yo', 8, { isLiveData: false });
    return adjustPassTimesToNow(passes);
  }

  const t0 = Date.now();
  try {
    const days = 10;
    const minElevation = 10;
    const url = `${BASE_URL}/radiopasses/${satId}/${lat}/${lon}/${alt}/${days}/${minElevation}/&apiKey=${N2YO_API_KEY}`;
    const response = await axios.get(url, { timeout: 10000 });
    const passes = response.data.passes || [];
    const durationMs = Date.now() - t0;
    recordSuccess('n2yo', durationMs, { isLiveData: true });
    return passes.map(p => ({
      ...p,
      startAzCompass: p.startAzCompass || p.startAzTxt || azimuthToCompass(p.startAz),
      maxAzCompass:   p.maxAzCompass   || p.maxAzTxt   || azimuthToCompass(p.maxAz),
      endAzCompass:   p.endAzCompass   || p.endAzTxt   || azimuthToCompass(p.endAz),
    }));
  } catch (error) {
    const statusCode = error.response?.status;
    recordFailure('n2yo', error.message, { statusCode, fallbackUsed: true });
    console.error('[N2YO] fetchSatellitePasses failed:', error.message);
    return adjustPassTimesToNow(MOCK_PASSES[satId] || MOCK_PASSES[25544]);
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
