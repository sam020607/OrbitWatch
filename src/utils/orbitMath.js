/**
 * Utility functions for orbital math and formatting.
 */

/**
 * Convert degrees to compass direction string.
 */
export function azimuthToCompass(az) {
  const directions = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  const idx = Math.round(az / 22.5) % 16;
  return directions[idx];
}

/**
 * Format a Unix timestamp to local time string.
 */
export function formatTime(unixTs) {
  const d = new Date(unixTs * 1000);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Format seconds duration to "Xm Ys" string.
 */
export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

/**
 * Format countdown seconds to HH:MM:SS.
 */
export function formatCountdown(totalSeconds) {
  if (totalSeconds <= 0) return '00:00:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

/**
 * Calculate seconds until a Unix timestamp.
 */
export function secondsUntil(unixTs) {
  return Math.max(0, Math.floor(unixTs - Date.now() / 1000));
}

/**
 * Generate orbital arc points for a satellite path on Leaflet.
 * Uses a simple approximation: great-circle arc from current position
 * forward and backward by half an orbit.
 * 
 * @param {number} lat   Satellite current latitude
 * @param {number} lon   Satellite current longitude
 * @param {number} inc   Orbital inclination (degrees)
 * @returns {Array<[lat,lon]>} Array of [lat,lon] points
 */
export function generateOrbitalArc(lat, lon, inc = 51.6) {
  const points = [];
  const numPoints = 60;
  // Span ±45 degrees of orbit longitude
  for (let i = -numPoints / 2; i <= numPoints / 2; i++) {
    const angle = (i / numPoints) * 90; // degrees along orbit
    const arcLon = ((lon + angle * 2 + 180) % 360) - 180;
    const arcLat = inc * Math.sin((angle * Math.PI) / 45);
    // Clamp lat
    const clampedLat = Math.max(-85, Math.min(85, lat + arcLat * 0.3));
    points.push([clampedLat, arcLon]);
  }
  return points;
}

/**
 * Calculate ground footprint (cone of visibility) as a polygon.
 * The footprint is approximately circular on the ground.
 * 
 * @param {number} satLat   Satellite latitude
 * @param {number} satLon   Satellite longitude
 * @param {number} altKm    Altitude in km
 * @param {number} minEl    Minimum elevation angle (degrees)
 * @returns {Array<[lat,lon]>} Polygon points
 */
export function calculateConeFootprint(satLat, satLon, altKm, minEl = 5) {
  const R = 6371; // Earth radius km
  const rho = altKm; // altitude
  // Half-angle of visibility cone (Earth-central angle)
  const earthAngle = Math.acos(R / (R + rho)) * (180 / Math.PI) - minEl;
  const footprintRadiusDeg = earthAngle;

  const points = [];
  for (let azDeg = 0; azDeg <= 360; azDeg += 15) {
    const az = (azDeg * Math.PI) / 180;
    const dLat = footprintRadiusDeg * Math.cos(az);
    const dLon = footprintRadiusDeg * Math.sin(az) / Math.cos((satLat * Math.PI) / 180);
    const pLat = Math.max(-85, Math.min(85, satLat + dLat));
    const pLon = ((satLon + dLon + 180) % 360) - 180;
    points.push([pLat, pLon]);
  }
  return points;
}

/**
 * Magnitude to apparent brightness description.
 */
export function magnitudeToDescription(mag) {
  if (mag <= -3) return 'Brilliant';
  if (mag <= -1) return 'Very bright';
  if (mag <= 1)  return 'Bright';
  if (mag <= 3)  return 'Naked eye';
  return 'Binoculars';
}

/**
 * Get planet emoji for display.
 */
export function getPlanetEmoji(name) {
  const map = {
    'Mercury': '☿', 'Venus': '♀', 'Mars': '♂',
    'Jupiter': '♃', 'Saturn': '♄', 'Uranus': '⛢',
    'Neptune': '♆', 'Moon': '🌙', 'Sun': '☀',
  };
  return map[name] || '⭐';
}

/**
 * Get satellite type icon.
 */
export function getSatTypeIcon(type) {
  const map = {
    'space-station': '🛸',
    'weather': '🌦',
    'gps': '📡',
    'comms': '📻',
    'earth-obs': '🔭',
    'debris': '💫',
  };
  return map[type] || '🛰️';
}
