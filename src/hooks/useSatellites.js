import { useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { fetchAboveSatellites } from '../api/n2yoApi.js';

const REFRESH_INTERVAL_MS = 60 * 1000; // refresh satellite list every 60s

/**
 * Custom hook: fetches and refreshes satellites overhead for the observer.
 * - Fetches on location change
 * - Refreshes every 60 seconds (satellite positions move)
 * - Animates satellite positions between updates using linear interpolation
 */
export function useSatellites() {
  const { state, actions } = useApp();
  const { location } = state;

  const fetchSats = useCallback(async () => {
    if (!location) return;
    try {
      const sats = await fetchAboveSatellites(location.lat, location.lon);
      // Animate positions over time using velocity
      const animated = sats.map(sat => animateSatellite(sat, location));
      actions.setSatellites(animated);
    } catch (err) {
      console.error('[useSatellites] fetch failed:', err);
    }
  }, [location, actions]);

  useEffect(() => {
    if (!location) return;
    fetchSats();
    const interval = setInterval(fetchSats, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [location, fetchSats]);

  // Animate satellite marker positions every 5 seconds
  useEffect(() => {
    if (!location || state.satellites.length === 0) return;
    const interval = setInterval(() => {
      actions.setSatellites(prev =>
        prev.map(sat => animateSatellite(sat, location))
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [location, state.satellites.length, actions]);

  return { satellites: state.satellites };
}

/**
 * Advance satellite position based on velocity and elapsed time.
 * Approximation only — proper propagation requires SGP4/SDP4.
 * 
 * @param {Object} sat  Satellite object
 * @param {Object} loc  Observer location {lat, lon}
 */
function animateSatellite(sat, loc) {
  const now = Date.now() / 1000;
  // Earth rotation correction: ~0.004167°/s
  const earthRot = 0.004167;
  // Satellite orbital angular velocity (approx): v/r converted to deg/s
  // At 550km alt, ~0.065 deg/s eastward component
  const speed = sat.velocity || 7.5;
  const alt = sat.satalt || 550;
  const angVel = (speed / (6371 + alt)) * (180 / Math.PI); // deg/s
  
  // Small time-based perturbation for animation
  const t = (now % 600) / 600; // normalise to 0-1 over 10 minutes
  const latShift = Math.sin(t * Math.PI * 2) * 0.5;
  const lonShift = angVel * 5 * (now % 5); // advance by velocity × elapsed

  return {
    ...sat,
    satlat: Math.max(-90, Math.min(90, sat.satlat + latShift * 0.1)),
    satlon: ((sat.satlon + lonShift * 0.05 + 180) % 360) - 180,
  };
}
