import { useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { fetchNearEarthAsteroids } from '../api/nasaNeoApi.js';
import { getGMST } from '../data/constellations.js';

const REFRESH_INTERVAL_MS = 60 * 1000; // refresh asteroid list every 60s
const ANIMATION_INTERVAL_MS = 1000;    // animate positions every 1s

/**
 * Custom hook: fetches, updates, and animates Near-Earth Asteroids.
 */
export function useAsteroids() {
  const { state, actions } = useApp();
  const { viewMode } = state;

  const loadAsteroids = useCallback(async () => {
    try {
      const data = await fetchNearEarthAsteroids();
      // Animate positions right after fetch
      const animated = data.map(ast => updateAsteroidPosition(ast));
      actions.setAsteroids(animated);
    } catch (err) {
      console.error('[useAsteroids] fetch failed:', err);
    }
  }, [actions]);

  // Fetch on mount or viewMode change
  useEffect(() => {
    if (viewMode === 'asteroids') {
      loadAsteroids();
      const interval = setInterval(loadAsteroids, REFRESH_INTERVAL_MS);
      return () => clearInterval(interval);
    }
  }, [viewMode, loadAsteroids]);

  // Periodic animation: updates asteroid positions on the map/globe
  useEffect(() => {
    if (state.asteroids.length === 0 || viewMode !== 'asteroids') return;

    const timer = setInterval(() => {
      const animated = state.asteroids.map(ast => updateAsteroidPosition(ast));
      actions.setAsteroids(animated);
    }, ANIMATION_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [state.asteroids, viewMode, actions]);

  return { asteroids: state.asteroids };
}

/**
 * Calculates current coordinates (latitude/longitude) along the fly-by path.
 * The path is centered on the closest approach timestamp.
 */
export function updateAsteroidPosition(ast) {
  const now = Date.now();
  const timeWindow = 4 * 3600 * 1000; // 4 hours total window for visible movement

  // Calculate t between -1.0 and +1.0
  const timeDiff = now - ast.close_approach_timestamp;
  const t = Math.max(-1.0, Math.min(1.0, timeDiff / (timeWindow / 2)));

  // Generate a deterministic slope vector based on asteroid ID
  const hash = parseInt(ast.id) || 54321;
  const latSlope = Math.sin(hash) * 20; // latitude range: -20 to +20
  const lonSlope = Math.cos(hash) * 50; // longitude range: -50 to +50

  // base substellar coordinates at closest approach (t = 0)
  const gmst = getGMST(now);
  const baseLat = ast.dec;
  
  // Convert Right Ascension (hours) to degrees
  const raDeg = ast.ra * 15;
  let baseLon = raDeg - gmst;
  baseLon = baseLon % 360;
  if (baseLon > 180) baseLon -= 360;
  if (baseLon < -180) baseLon += 360;

  // Calculate current coordinates along the trajectory vector
  const lat = Math.max(-90, Math.min(90, baseLat + t * latSlope));
  let lon = baseLon + t * lonSlope;
  
  // Wrap longitude
  lon = lon % 360;
  if (lon > 180) lon -= 360;
  if (lon < -180) lon += 360;

  return {
    ...ast,
    lat,
    lon,
    progress: t, // expose t to draw lines/markers
  };
}
