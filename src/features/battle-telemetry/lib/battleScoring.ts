import * as satellite from 'satellite.js';
import { getOrbitParams, footprintRadius, predictPasses } from './orbitalMath';

export interface ScoreCategory {
  label: string;
  name: string;
  valA: number;
  valB: number;
  displayA: string;
  displayB: string;
  winner: 'A' | 'B' | 'TIE';
  description: string;
}

export interface ScoreResult {
  categories: ScoreCategory[];
  scoreA: number;
  scoreB: number;
  ties: number;
  overallWinner: 'A' | 'B' | 'TIE';
}

export function computeBattleScore(
  satrecA: satellite.SatRec,
  satrecB: satellite.SatRec,
  referenceLocation: { lat: number; lon: number } | null
): ScoreResult {
  const refLoc = referenceLocation || { lat: 0, lon: 0 };
  const pA = getOrbitParams(satrecA);
  const pB = getOrbitParams(satrecB);

  // 1. Coverage (radius from 10° elevation)
  const rA = footprintRadius(pA.alt, 10);
  const rB = footprintRadius(pB.alt, 10);
  let coverageWinner: 'A' | 'B' | 'TIE' = 'TIE';
  const diffPct = Math.abs(rA - rB) / Math.max(rA, rB || 1);
  if (diffPct >= 0.02) {
    coverageWinner = rA > rB ? 'A' : 'B';
  }

  // 2. Revisit Rate (shorter period wins)
  let revisitWinner: 'A' | 'B' | 'TIE' = 'TIE';
  if (pA.T < pB.T) revisitWinner = 'A';
  else if (pB.T < pA.T) revisitWinner = 'B';

  // 3. Visibility (longer pass duration at reference location)
  const passA = predictPasses(satrecA, refLoc.lat, refLoc.lon);
  const passB = predictPasses(satrecB, refLoc.lat, refLoc.lon);
  const durationA = passA.visibility || 0;
  const durationB = passB.visibility || 0;
  let visibilityWinner: 'A' | 'B' | 'TIE' = 'TIE';
  if (durationA > durationB) visibilityWinner = 'A';
  else if (durationB > durationA) visibilityWinner = 'B';

  // 4. Orbit Stability (lower eccentricity wins, fallback to higher perigee)
  let stabilityWinner: 'A' | 'B' | 'TIE' = 'TIE';
  if (Math.abs(pA.ecc - pB.ecc) >= 0.01) {
    stabilityWinner = pA.ecc < pB.ecc ? 'A' : 'B';
  } else {
    // Fallback: perigee altitude (higher = less drag)
    const mu = 398600.4418;
    const nA_rad_sec = satrecA.no / 60;
    const nB_rad_sec = satrecB.no / 60;
    const aA = Math.pow(mu / (nA_rad_sec * nA_rad_sec), 1 / 3);
    const aB = Math.pow(mu / (nB_rad_sec * nB_rad_sec), 1 / 3);
    const perigeeA = aA * (1 - pA.ecc) - 6371;
    const perigeeB = aB * (1 - pB.ecc) - 6371;
    if (perigeeA > perigeeB) stabilityWinner = 'A';
    else if (perigeeB > perigeeA) stabilityWinner = 'B';
  }

  // 5. Ground Coverage ( swept area = pi * r^2 * orbitsPerDay )
  const orbitsDayA = 1440 / pA.T;
  const orbitsDayB = 1440 / pB.T;
  const sweptA = Math.PI * rA * rA * orbitsDayA;
  const sweptB = Math.PI * rB * rB * orbitsDayB;
  let groundCoverageWinner: 'A' | 'B' | 'TIE' = 'TIE';
  if (sweptA > sweptB) groundCoverageWinner = 'A';
  else if (sweptB > sweptA) groundCoverageWinner = 'B';

  const categories: ScoreCategory[] = [
    {
      label: 'Coverage Footprint',
      name: 'coverage',
      valA: rA,
      valB: rB,
      displayA: `${rA.toFixed(0)} km`,
      displayB: `${rB.toFixed(0)} km`,
      winner: coverageWinner,
      description: 'Radius of ground coverage footprint visible from the satellite at 10° elevation'
    },
    {
      label: 'Revisit Rate',
      name: 'revisit',
      valA: pA.T,
      valB: pB.T,
      displayA: `${pA.T.toFixed(1)} min`,
      displayB: `${pB.T.toFixed(1)} min`,
      winner: revisitWinner,
      description: 'Orbital period duration. A shorter period enables more frequent sweeps over the Earth'
    },
    {
      label: 'Visibility Duration',
      name: 'visibility',
      valA: durationA,
      valB: durationB,
      displayA: durationA > 0 ? `${Math.floor(durationA / 60)}m ${durationA % 60}s` : 'No Pass',
      displayB: durationB > 0 ? `${Math.floor(durationB / 60)}m ${durationB % 60}s` : 'No Pass',
      winner: visibilityWinner,
      description: `First contiguous pass duration above 10° elevation at target location (${refLoc.lat.toFixed(1)}°N, ${refLoc.lon.toFixed(1)}°E)`
    },
    {
      label: 'Orbit Stability',
      name: 'stability',
      valA: pA.ecc,
      valB: pB.ecc,
      displayA: pA.ecc.toFixed(4),
      displayB: pB.ecc.toFixed(4),
      winner: stabilityWinner,
      description: 'Orbital eccentricity. A lower value indicates a circular, highly stable orbit'
    },
    {
      label: 'Ground Swept Area',
      name: 'groundCoverage',
      valA: sweptA,
      valB: sweptB,
      displayA: `${(sweptA / 1e6).toFixed(1)}M km²/d`,
      displayB: `${(sweptB / 1e6).toFixed(1)}M km²/d`,
      winner: groundCoverageWinner,
      description: 'Estimated total daily ground footprint swept area (footprint area multiplied by orbits per day)'
    }
  ];

  let scoreA = 0;
  let scoreB = 0;
  let ties = 0;

  categories.forEach(c => {
    if (c.winner === 'A') scoreA++;
    else if (c.winner === 'B') scoreB++;
    else ties++;
  });

  let overallWinner: 'A' | 'B' | 'TIE' = 'TIE';
  if (scoreA > scoreB) overallWinner = 'A';
  else if (scoreB > scoreA) overallWinner = 'B';

  return {
    categories,
    scoreA,
    scoreB,
    ties,
    overallWinner
  };
}
