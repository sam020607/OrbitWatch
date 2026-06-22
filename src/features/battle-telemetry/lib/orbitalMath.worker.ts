import * as satellite from 'satellite.js';

self.onmessage = function (e: MessageEvent) {
  const { tleA, tleB, startTime } = e.data;

  if (!tleA || !tleB || !startTime) {
    self.postMessage({ error: 'Missing input data in worker' });
    return;
  }

  try {
    const linesA = tleA.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const linesB = tleB.split('\n').map((l: string) => l.trim()).filter(Boolean);
    if (linesA.length < 2 || linesB.length < 2) {
      self.postMessage({ error: 'Invalid TLE strings in worker' });
      return;
    }

    const satrecA = satellite.twoline2satrec(linesA[linesA.length - 2], linesA[linesA.length - 1]);
    const satrecB = satellite.twoline2satrec(linesB[linesB.length - 2], linesB[linesB.length - 1]);

    // Period in minutes: 2*pi / no
    const periodA = (2 * Math.PI) / satrecA.no;
    const periodB = (2 * Math.PI) / satrecB.no;

    const maxPeriod = Math.max(periodA, periodB);
    let windowSizeSecs = 3 * maxPeriod * 60; // 3 x period in seconds
    if (windowSizeSecs > 6 * 3600) {
      windowSizeSecs = 6 * 3600; // Cap lookahead window at 6 hours
    }

    let minDistance = Infinity;
    let minTimeSecs = 0;

    // Pass 1: Coarse search (10-second steps)
    for (let t = 0; t <= windowSizeSecs; t += 10) {
      const date = new Date(startTime + t * 1000);
      const posAndVelA = satellite.propagate(satrecA, date);
      const posAndVelB = satellite.propagate(satrecB, date);

      const posA = posAndVelA.position as satellite.EciVec3<number>;
      const posB = posAndVelB.position as satellite.EciVec3<number>;

      if (posA && posB) {
        const dist = Math.sqrt(
          Math.pow(posA.x - posB.x, 2) +
          Math.pow(posA.y - posB.y, 2) +
          Math.pow(posA.z - posB.z, 2)
        );
        if (dist < minDistance) {
          minDistance = dist;
          minTimeSecs = t;
        }
      }
    }

    // Pass 2: Refined search (0.5-second steps, ±30 seconds around coarse minimum)
    const startRefine = Math.max(0, minTimeSecs - 30);
    const endRefine = Math.min(windowSizeSecs, minTimeSecs + 30);

    for (let t = startRefine; t <= endRefine; t += 0.5) {
      const date = new Date(startTime + t * 1000);
      const posAndVelA = satellite.propagate(satrecA, date);
      const posAndVelB = satellite.propagate(satrecB, date);

      const posA = posAndVelA.position as satellite.EciVec3<number>;
      const posB = posAndVelB.position as satellite.EciVec3<number>;

      if (posA && posB) {
        const dist = Math.sqrt(
          Math.pow(posA.x - posB.x, 2) +
          Math.pow(posA.y - posB.y, 2) +
          Math.pow(posA.z - posB.z, 2)
        );
        if (dist < minDistance) {
          minDistance = dist;
          minTimeSecs = t;
        }
      }
    }

    const timestamp = startTime + minTimeSecs * 1000;
    const timeUntil = (timestamp - Date.now()) / 1000; // in seconds

    self.postMessage({
      distanceKm: minDistance,
      timeUntil: Math.max(0, timeUntil),
      timestamp
    });
  } catch (err: any) {
    self.postMessage({ error: 'Worker error: ' + err.message });
  }
};
