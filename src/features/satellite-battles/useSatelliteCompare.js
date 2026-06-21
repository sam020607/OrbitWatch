import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.jsx';

export function useSatelliteCompare() {
  const { state } = useApp();
  const { satellites } = state;

  const [satA, setSatA] = useState(null);
  const [satB, setSatB] = useState(null);

  // Derive comparison metrics
  const comparison = useMemo(() => {
    if (!satA || !satB) return null;

    const altDiff = satA.satalt - satB.satalt;
    const velDiff = satA.velocity - satB.velocity;

    // We can also infer orbital period approx from altitude using Kepler's third law.
    // T = 2 * PI * sqrt(a^3 / mu)
    const mu = 398600.4418; // Earth's standard gravitational parameter (km^3/s^2)
    const getPeriodMins = (alt) => {
      const a = 6371 + alt;
      const tSecs = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / mu);
      return tSecs / 60;
    };

    const periodA = getPeriodMins(satA.satalt);
    const periodB = getPeriodMins(satB.satalt);
    const periodDiff = periodA - periodB;

    return {
      altitude: {
        valA: satA.satalt,
        valB: satB.satalt,
        diff: altDiff,
        winner: altDiff > 0 ? 'A' : (altDiff < 0 ? 'B' : 'TIE'),
        label: 'Altitude (km)',
        unit: 'km',
        higherIsBetter: true
      },
      velocity: {
        valA: satA.velocity,
        valB: satB.velocity,
        diff: velDiff,
        winner: velDiff > 0 ? 'A' : (velDiff < 0 ? 'B' : 'TIE'),
        label: 'Velocity (km/s)',
        unit: 'km/s',
        higherIsBetter: true
      },
      period: {
        valA: periodA,
        valB: periodB,
        diff: periodDiff,
        winner: periodDiff > 0 ? 'A' : (periodDiff < 0 ? 'B' : 'TIE'),
        label: 'Orbital Period (min)',
        unit: 'min',
        higherIsBetter: false 
      }
    };
  }, [satA, satB]);

  return {
    satellites,
    satA,
    satB,
    setSatA,
    setSatB,
    comparison
  };
}
