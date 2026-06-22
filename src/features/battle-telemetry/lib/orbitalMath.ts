import * as satellite from 'satellite.js';

export interface GeodeticPos {
  lat: number;
  lon: number;
  alt: number;
}

export interface PropagationResult {
  positionEci: satellite.EciVec3<number>;
  velocityEci: satellite.EciVec3<number>;
  positionEcf: satellite.EcfVec3<number>;
  lat: number;
  lon: number;
  alt: number;
  satrec: satellite.SatRec;
}

/**
 * Parses raw TLE text and propagates the satellite to the specified date.
 */
export function propagateSatellite(tle: string, date: Date): PropagationResult | null {
  try {
    const lines = tle.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return null;
    const line1 = lines[lines.length - 2];
    const line2 = lines[lines.length - 1];

    const satrec = satellite.twoline2satrec(line1, line2);
    const positionAndVelocity = satellite.propagate(satrec, date);
    
    const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
    const velocityEci = positionAndVelocity.velocity as satellite.EciVec3<number>;
    
    if (!positionEci || !velocityEci) return null;

    const gmst = satellite.gstime(date);
    const positionEcf = satellite.eciToEcf(positionEci, gmst);
    const observerGeodetic = satellite.eciToGeodetic(positionEci, gmst);

    const latRad = observerGeodetic.latitude;
    const lonRad = observerGeodetic.longitude;
    const alt = observerGeodetic.height; // in km

    const latDeg = latRad * 180 / Math.PI;
    const lonDeg = lonRad * 180 / Math.PI;

    // Normalize longitude to [-180, 180]
    let lonNormalized = lonDeg;
    while (lonNormalized < -180) lonNormalized += 360;
    while (lonNormalized > 180) lonNormalized -= 360;

    return {
      positionEci,
      velocityEci,
      positionEcf,
      lat: latDeg,
      lon: lonNormalized,
      alt,
      satrec
    };
  } catch (err) {
    console.error('Error propagating satellite:', err);
    return null;
  }
}

/**
 * Computes Euclidean distance between two ECI vectors.
 */
export function currentSeparation(
  posA: satellite.EciVec3<number>,
  posB: satellite.EciVec3<number>
): number {
  return Math.sqrt(
    Math.pow(posA.x - posB.x, 2) +
    Math.pow(posA.y - posB.y, 2) +
    Math.pow(posA.z - posB.z, 2)
  );
}

/**
 * Calculates orbit parameters from satrec:
 * - Inclination (degrees)
 * - Semi-major axis & average altitude (km)
 * - Eccentricity
 * - Orbital period (minutes)
 */
export function getOrbitParams(satrec: satellite.SatRec) {
  const inc = satrec.inclo * 180 / Math.PI;
  const ecc = satrec.ecco;
  
  // Period in minutes
  const T = (2 * Math.PI) / satrec.no;
  
  // Average altitude calculation from mean motion
  const mu = 398600.4418; // Earth gravitational parameter km^3/s^2
  const n_rad_per_sec = satrec.no / 60; // mean motion in rad/s
  const a = Math.pow(mu / (n_rad_per_sec * n_rad_per_sec), 1 / 3);
  const alt = a - 6371; // km
  
  return { inc, ecc, T, alt };
}

/**
 * Calculates similarity score between two orbits on a scale of [0, 100].
 */
export function orbitSimilarity(satrecA: satellite.SatRec, satrecB: satellite.SatRec): number {
  const pA = getOrbitParams(satrecA);
  const pB = getOrbitParams(satrecB);

  const normInc = Math.abs(pA.inc - pB.inc) / 180;
  const maxAlt = Math.max(pA.alt, pB.alt) || 1;
  const normAlt = Math.abs(pA.alt - pB.alt) / maxAlt;
  const normEcc = Math.abs(pA.ecc - pB.ecc) / 0.25;
  const maxT = Math.max(pA.T, pB.T) || 1;
  const normPeriod = Math.abs(pA.T - pB.T) / maxT;

  const similarity = 100 * (1 - (0.25 * normInc + 0.25 * normAlt + 0.25 * normEcc + 0.25 * normPeriod));
  return Math.max(0, Math.min(100, similarity));
}

/**
 * Calculates the ground footprint radius of a satellite at altitude h and minimum elevation angle epsilon.
 */
export function footprintRadius(altKm: number, minElDeg = 10): number {
  const Re = 6371; // Earth radius in km
  const epsilon = minElDeg * Math.PI / 180; // convert to radians
  const val = (Re / (Re + altKm)) * Math.cos(epsilon);
  const clampedVal = Math.max(-1, Math.min(1, val));
  const lambda = Math.acos(clampedVal) - epsilon;
  return Re * lambda;
}

/**
 * Computes great-circle distance between two geodetic coordinates using Haversine formula.
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const Re = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Re * c;
}

/**
 * Calculates the overlap percentage of two circular footprints on Earth's surface relative to the smaller circle.
 */
export function coverageOverlapPercent(d: number, r1: number, r2: number): number {
  if (d >= r1 + r2) return 0;
  const minR = Math.min(r1, r2);
  if (d <= Math.abs(r1 - r2)) return 100;

  const r1Sq = r1 * r1;
  const r2Sq = r2 * r2;
  const dSq = d * d;

  const arg1 = (dSq + r1Sq - r2Sq) / (2 * d * r1);
  const arg2 = (dSq + r2Sq - r1Sq) / (2 * d * r2);

  const angle1 = Math.acos(Math.max(-1, Math.min(1, arg1)));
  const angle2 = Math.acos(Math.max(-1, Math.min(1, arg2)));

  const term1 = r1Sq * angle1;
  const term2 = r2Sq * angle2;

  const sqrtVal = (-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2);
  const term3 = 0.5 * Math.sqrt(Math.max(0, sqrtVal));

  const overlapArea = term1 + term2 - term3;
  const smallerArea = Math.PI * minR * minR;

  const pct = (overlapArea / smallerArea) * 100;
  return Math.max(0, Math.min(100, pct));
}

/**
 * Predicts the next pass and visibility window for a satellite relative to an observer location.
 */
export function predictPasses(
  satrec: satellite.SatRec,
  observerLat: number,
  observerLon: number,
  durationHours = 24
) {
  const observerGeodetic = {
    latitude: observerLat * Math.PI / 180,
    longitude: observerLon * Math.PI / 180,
    height: 0
  };

  const startTime = Date.now();
  const stepSizeSecs = 20; // 20s step resolution
  const totalSteps = (durationHours * 3600) / stepSizeSecs;

  let inPass = false;
  let passStartSecs: number | null = null;
  let passEndSecs: number | null = null;

  for (let i = 0; i < totalSteps; i++) {
    const tSecs = i * stepSizeSecs;
    const date = new Date(startTime + tSecs * 1000);
    const gmst = satellite.gstime(date);
    const positionAndVelocity = satellite.propagate(satrec, date);
    const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;

    if (!positionEci) continue;

    const positionEcf = satellite.eciToEcf(positionEci, gmst);
    const lookAngles = satellite.ecfToLookAngles(observerGeodetic, positionEcf);
    const elevationDeg = lookAngles.elevation * 180 / Math.PI;

    if (elevationDeg >= 10) {
      if (!inPass) {
        inPass = true;
        passStartSecs = tSecs;
      }
    } else {
      if (inPass) {
        passEndSecs = tSecs;
        break; // Stop at end of the first contiguous pass
      }
    }
  }

  if (inPass && passEndSecs === null) {
    passEndSecs = durationHours * 3600;
  }

  if (passStartSecs !== null && passEndSecs !== null) {
    const nextPass = passStartSecs; // seconds from now
    const visibility = passEndSecs - passStartSecs; // duration in seconds
    const passStartTimestamp = startTime + passStartSecs * 1000;
    return { nextPass, visibility, passStartTimestamp };
  }

  return { nextPass: null, visibility: null, passStartTimestamp: null };
}
