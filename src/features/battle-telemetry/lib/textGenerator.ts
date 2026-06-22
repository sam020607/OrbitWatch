import * as satellite from 'satellite.js';
import { getOrbitParams, footprintRadius, predictPasses } from './orbitalMath';
import { ScoreResult } from './battleScoring';

export interface SummaryOutput {
  lines: string[];
  verdict: string;
}

export function generateBattleSummary(
  satA: any,
  satB: any,
  satrecA: satellite.SatRec,
  satrecB: satellite.SatRec,
  scoreResult: ScoreResult,
  referenceLocation: { lat: number; lon: number } | null
): SummaryOutput {
  const pA = getOrbitParams(satrecA);
  const pB = getOrbitParams(satrecB);

  const rA = footprintRadius(pA.alt, 10);
  const rB = footprintRadius(pB.alt, 10);

  const lines: string[] = [];

  // Line 1: Coverage / Footprint comparison
  if (Math.abs(rA - rB) / Math.max(rA, rB || 1) >= 0.02) {
    if (rA > rB) {
      lines.push(`${satA.satname} maintains a wider coverage footprint (${rA.toFixed(0)} km), giving it broader visibility per pass compared to ${satB.satname}.`);
    } else {
      lines.push(`${satB.satname} maintains a wider coverage footprint (${rB.toFixed(0)} km), giving it broader visibility per pass compared to ${satA.satname}.`);
    }
  } else {
    lines.push(`Both satellites project nearly identical ground footprints of approximately ${rA.toFixed(0)} km.`);
  }

  // Line 2: Revisit Rate / Period comparison
  if (Math.abs(pA.T - pB.T) > 0.1) {
    if (pA.T < pB.T) {
      lines.push(`${satA.satname} benefits from a shorter orbital period (${pA.T.toFixed(1)} mins), enabling more frequent revisits and sweeps.`);
    } else {
      lines.push(`${satB.satname} benefits from a shorter orbital period (${pB.T.toFixed(1)} mins), enabling more frequent revisits and sweeps.`);
    }
  } else {
    lines.push(`Both platforms operate on matching orbital periods, resulting in identical revisit frequencies.`);
  }

  // Line 3: Orbit Stability / Eccentricity comparison
  if (Math.abs(pA.ecc - pB.ecc) >= 0.01) {
    if (pA.ecc < pB.ecc) {
      lines.push(`${satA.satname} operates in a highly circularized orbit (e = ${pA.ecc.toFixed(4)}), minimizing drag decay and adjustment fuel consumption.`);
    } else {
      lines.push(`${satB.satname} operates in a highly circularized orbit (e = ${pB.ecc.toFixed(4)}), minimizing drag decay and adjustment fuel consumption.`);
    }
  } else {
    lines.push(`Both platforms maintain highly stable, circular orbits with low drag decay rates.`);
  }

  // Line 4: Observer location pass prediction context (if a location was clicked)
  if (referenceLocation) {
    const passA = predictPasses(satrecA, referenceLocation.lat, referenceLocation.lon);
    const passB = predictPasses(satrecB, referenceLocation.lat, referenceLocation.lon);
    const durA = passA.visibility || 0;
    const durB = passB.visibility || 0;

    if (durA > 0 || durB > 0) {
      if (durA > durB) {
        lines.push(`At the target observer location, ${satA.satname} offers a longer pass window (${Math.floor(durA / 60)}m ${durA % 60}s) than ${satB.satname}.`);
      } else if (durB > durA) {
        lines.push(`At the target observer location, ${satB.satname} offers a longer pass window (${Math.floor(durB / 60)}m ${durB % 60}s) than ${satA.satname}.`);
      } else {
        lines.push(`Both satellites provide comparable visibility duration from the reference location.`);
      }
    }
  }

  // Verdict (must align with overallWinner)
  let verdict = '';
  if (scoreResult.overallWinner === 'A') {
    verdict = `VERDICT: ${satA.satname} maintains the tactical advantage with a ${scoreResult.scoreA} — ${scoreResult.scoreB} lead.`;
  } else if (scoreResult.overallWinner === 'B') {
    verdict = `VERDICT: ${satB.satname} maintains the tactical advantage with a ${scoreResult.scoreB} — ${scoreResult.scoreA} lead.`;
  } else {
    verdict = `VERDICT: Technical Draw. Both satellites maintain equal tactical standing (${scoreResult.scoreA} — ${scoreResult.scoreB}).`;
  }

  return { lines, verdict };
}
