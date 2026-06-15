import { useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { fetchSatellitePasses } from '../api/n2yoApi.js';
import { fetchNightSkyData, fetchMoonPhase } from '../api/astronomyApi.js';

/**
 * Custom hook: fetches pass predictions and night sky data for the observer.
 * - Fetches ISS passes (NORAD 25544) for next 24h
 * - Fetches tonight's visible planets and moon phase
 * - Re-fetches when location changes
 */
export function usePassPredictions() {
  const { state, actions } = useApp();
  const { location } = state;

  const fetchAll = useCallback(async () => {
    if (!location) return;
    
    try {
      // Fetch ISS passes
      const issPasses = await fetchSatellitePasses(25544, location.lat, location.lon);
      actions.setISSPasses(issPasses);
    } catch (err) {
      console.error('[usePassPredictions] ISS passes failed:', err);
    }

    try {
      // Fetch night sky data (planets etc.)
      const skyData = await fetchNightSkyData(location.lat, location.lon);
      actions.setNightSky(skyData);
    } catch (err) {
      console.error('[usePassPredictions] Night sky data failed:', err);
    }

    try {
      // Fetch moon phase
      const moon = await fetchMoonPhase(location.lat, location.lon);
      actions.setMoonPhase(moon);
    } catch (err) {
      console.error('[usePassPredictions] Moon phase failed:', err);
    }
  }, [location, actions]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    issNextPasses: state.issNextPasses,
    nightSkyData: state.nightSkyData,
    moonPhase: state.moonPhase,
  };
}
