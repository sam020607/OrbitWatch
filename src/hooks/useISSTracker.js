import { useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { fetchISSPosition, generateMockISSPosition } from '../api/issApi.js';

const POLL_INTERVAL_MS = 5000; // 5 seconds
const FALLBACK_INTERVAL_MS = 1000; // smooth mock updates every 1s

/**
 * Custom hook: tracks the ISS in real-time.
 * - Attempts live Where the ISS at? API fetch every 5 seconds
 * - Falls back to computed mock position (smooth animation) if API fails
 * - Stores trail of last 30 positions for path rendering
 */
export function useISSTracker(enabled = true) {
  const { state, actions } = useApp();
  const intervalRef = useRef(null);
  const fallbackRef = useRef(null);
  const liveFailCount = useRef(0);

  const fetchPosition = useCallback(async () => {
    try {
      const pos = await fetchISSPosition();
      actions.setISSPosition(pos);
      liveFailCount.current = 0;
      // Clear any running fallback interval
      if (fallbackRef.current) {
        clearInterval(fallbackRef.current);
        fallbackRef.current = null;
      }
    } catch (err) {
      liveFailCount.current++;
      console.warn('[useISSTracker] Live fetch failed, count:', liveFailCount.current);
      // After 2 consecutive failures, switch to smooth mock animation
      if (liveFailCount.current >= 2 && !fallbackRef.current) {
        fallbackRef.current = setInterval(() => {
          actions.setISSPosition(generateMockISSPosition());
        }, FALLBACK_INTERVAL_MS);
      }
    }
  }, [actions]);

  useEffect(() => {
    if (!enabled) return;

    // Load TLE once from CelesTrak to populate freshness telemetry
    import('../api/celestrakApi.js').then(({ fetchCelesTrakTLE }) => {
      fetchCelesTrakTLE(25544);
    });

    // Immediate first fetch
    fetchPosition();

    // Poll every 5 seconds
    intervalRef.current = setInterval(fetchPosition, POLL_INTERVAL_MS);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(fallbackRef.current);
    };
  }, [enabled, fetchPosition]);

  return {
    issPosition: state.issPosition,
    issTrail: state.issTrail,
  };
}
