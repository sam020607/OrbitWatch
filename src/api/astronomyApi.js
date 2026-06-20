/**
 * Astronomy API Integration — Planets, Moon Phase, Stars
 * 
 * API docs: https://docs.astronomyapi.com/
 * Get a key at: https://astronomyapi.com/
 * 
 * TODO: Replace with your credentials:
 *   const APP_ID = 'YOUR_APP_ID';
 *   const APP_SECRET = 'YOUR_APP_SECRET';
 * 
 * Without credentials, this module returns realistic mock astronomy data.
 */
import axios from 'axios';
import { recordSuccess, recordFailure } from '../services/apiMonitor.js';

// TODO: Add your AstronomyAPI credentials
const APP_ID = import.meta.env.VITE_ASTRONOMY_APP_ID ?? '';
const APP_SECRET = import.meta.env.VITE_ASTRONOMY_APP_SECRET ?? '';
const USE_MOCK = !APP_ID || !APP_SECRET;

const BASE_URL = '/api/astronomy';

/**
 * Get tonight's visible planets, moon phase, and star info for a given location.
 * AstronomyAPI endpoint: GET /api/v2/bodies/positions
 * 
 * @param {number} lat     Observer latitude
 * @param {number} lon     Observer longitude
 * @param {number} alt     Observer altitude (m)
 * @param {string} date    Date string YYYY-MM-DD
 * @returns {Promise<Object>} Astronomy data object
 */
export async function fetchNightSkyData(lat, lon, alt = 0, date = null) {
  if (USE_MOCK) {
    console.info('[AstronomyAPI] Using mock data. Set APP_ID/APP_SECRET to use live data.');
    return getMockAstronomyData(lat, lon, date);
  }

  try {
    const today = date || new Date().toISOString().split('T')[0];
    const credentials = btoa(`${APP_ID}:${APP_SECRET}`);
    const url = `${BASE_URL}/api/v2/bodies/positions`;
    const response = await axios.get(url, {
      headers: { Authorization: `Basic ${credentials}` },
      params: {
        latitude: lat,
        longitude: lon,
        elevation: alt,
        from_date: today,
        to_date: today,
        time: '21:00:00',
      },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('[AstronomyAPI] fetchNightSkyData failed:', error.message);
    return getMockAstronomyData(lat, lon, date);
  }
}

/**
 * Get moon phase data using wttr.in API.
 * 
 * @param {number} lat   Observer latitude 
 * @param {number} lon   Observer longitude 
 * @param {string|Date} date  Date object or string
 * @returns {Promise<Object>}
 */
export async function fetchMoonPhase(lat, lon, date = null) {
  const t0 = Date.now();
  try {
    const url = `https://wttr.in/${lat},${lon}?format=j1`;
    const response = await axios.get(url, { timeout: 10000 });
    const durationMs = Date.now() - t0;
    
    const astronomy = response.data?.weather?.[0]?.astronomy?.[0];
    
    if (astronomy) {
      recordSuccess('wttr-moon', durationMs, { isLiveData: true });
      return {
        phase: astronomy.moon_phase,           
        illumination: parseInt(astronomy.moon_illumination, 10) || 0, 
        date: date ? new Date(date).toISOString() : new Date().toISOString()
      };
    }
    
    throw new Error('wttr.in response missing astronomy payload');
  } catch (error) {
    const statusCode = error.response?.status;
    recordFailure('wttr-moon', error.message, { statusCode, fallbackUsed: true });
    console.error('[AstronomyAPI] fetchMoonPhase failed:', error.message);
    return {
      phase: 'Data Unavailable',
      illumination: 0,
      date: new Date().toISOString()
    };
  }
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

function getMockAstronomyData(lat, lon, date) {
  return {
    data: {
      observer: { location: { latitude: lat, longitude: lon } },
      table: {
        header: ['id', 'name', 'rise', 'set', 'altitude', 'azimuth', 'magnitude'],
        rows: [
          {
            entry: { id: 'venus', name: 'Venus' },
            cells: [
              { date: date || today(), id: 'venus', name: 'Venus',
                position: { horizontal: { altitude: { degrees: '32.5', string: '32° 30\' 00"' }, azimuth: { degrees: '245.3', string: '245° 18\' 00"' } } },
                extraInfo: { rise: { time: '19:42' }, set: { time: '00:15' }, magnitude: { raw: -4.2 } }
              }
            ]
          },
          {
            entry: { id: 'mars', name: 'Mars' },
            cells: [
              { date: date || today(), id: 'mars', name: 'Mars',
                position: { horizontal: { altitude: { degrees: '58.2', string: '58° 12\' 00"' }, azimuth: { degrees: '172.0', string: '172° 00\' 00"' } } },
                extraInfo: { rise: { time: '21:05' }, set: { time: '04:30' }, magnitude: { raw: -0.4 } }
              }
            ]
          },
          {
            entry: { id: 'jupiter', name: 'Jupiter' },
            cells: [
              { date: date || today(), id: 'jupiter', name: 'Jupiter',
                position: { horizontal: { altitude: { degrees: '41.7', string: '41° 42\' 00"' }, azimuth: { degrees: '118.5', string: '118° 30\' 00"' } } },
                extraInfo: { rise: { time: '22:18' }, set: { time: '06:45' }, magnitude: { raw: -2.8 } }
              }
            ]
          },
          {
            entry: { id: 'saturn', name: 'Saturn' },
            cells: [
              { date: date || today(), id: 'saturn', name: 'Saturn',
                position: { horizontal: { altitude: { degrees: '23.1', string: '23° 06\' 00"' }, azimuth: { degrees: '93.4', string: '93° 24\' 00"' } } },
                extraInfo: { rise: { time: '23:50' }, set: { time: '08:15' }, magnitude: { raw: 0.7 } }
              }
            ]
          },
        ]
      }
    }
  };
}

function getMockMoonPhase() {
  const phases = [
    { name: 'Waxing Crescent', illumination: 23, emoji: '🌒', age: 5.2 },
    { name: 'First Quarter', illumination: 50, emoji: '🌓', age: 7.4 },
    { name: 'Waxing Gibbous', illumination: 78, emoji: '🌔', age: 10.1 },
    { name: 'Full Moon', illumination: 100, emoji: '🌕', age: 14.8 },
    { name: 'Waning Gibbous', illumination: 72, emoji: '🌖', age: 18.3 },
    { name: 'Last Quarter', illumination: 49, emoji: '🌗', age: 21.9 },
    { name: 'Waning Crescent', illumination: 18, emoji: '🌘', age: 25.6 },
    { name: 'New Moon', illumination: 2, emoji: '🌑', age: 29.1 },
  ];
  const idx = Math.floor(Date.now() / 86400000) % phases.length;
  return {
    data: {
      phase: {
        id: phases[idx].name.toLowerCase().replace(' ', '_'),
        name: phases[idx].name,
        illumination: phases[idx].illumination,
        emoji: phases[idx].emoji,
        age: { days: phases[idx].age },
      }
    }
  };
}

function today() {
  return new Date().toISOString().split('T')[0];
}
