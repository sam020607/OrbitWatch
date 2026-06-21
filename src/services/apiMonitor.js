/**
 * apiMonitor.js — Singleton in-memory API health telemetry store.
 *
 * Records every external API call made by the app:
 *   - success / failure / fallback-to-cache events
 *   - response time (ms)
 *   - HTTP status codes (when available)
 *   - timestamps of last success and last attempt
 *
 * Exposes a lightweight pub-sub so React components can subscribe
 * and re-render when telemetry changes, without needing a full
 * state management solution.
 *
 * DESIGN: This module is intentionally a plain JS singleton (not React state)
 * so it can be imported and written to from anywhere in the codebase —
 * API modules, hooks, etc. — without prop-drilling or context providers.
 */

// ─── Source definitions ────────────────────────────────────────────────────────
// Each source has:
//   id          - machine key
//   label       - human display name
//   description - what the app uses it for
//   staleAfterMs  - duration after which a successful call is considered DEGRADED
//   downAfterMs   - duration after which no success means DOWN

export const API_SOURCES = {
  'wheretheiss': {
    id: 'wheretheiss',
    label: 'Where the ISS at?',
    description: 'Real-time ISS position — polled every 5 s',
    staleAfterMs: 15_000,   // DEGRADED if no success in 15 s (3 missed polls)
    downAfterMs:  60_000,   // DOWN after 60 s (12 missed polls → on fallback)
  },
  'n2yo': {
    id: 'n2yo',
    label: 'N2YO Satellites',
    description: 'Overhead satellite catalogue — refreshed every 180 s',
    staleAfterMs: 270_000,  // DEGRADED if not refreshed in 4.5 min
    downAfterMs:  600_000,  // DOWN after 10 min
  },
  'nasa-neo': {
    id: 'nasa-neo',
    label: 'NASA NeoWs',
    description: 'Near-Earth Asteroid feed — refreshed every 60 s when active',
    staleAfterMs: 120_000,
    downAfterMs:  600_000,  // DOWN after 10 min (only fetched in asteroid mode)
  },
  'nasa-apod': {
    id: 'nasa-apod',
    label: 'NASA APOD',
    description: 'Astronomy Picture of the Day — fetched once per session',
    staleAfterMs: 3_600_000,  // DEGRADED after 1 hour
    downAfterMs:  86_400_000, // DOWN after 24 h (daily cadence)
  },
  'celestrak': {
    id: 'celestrak',
    label: 'CelesTrak (TLEs)',
    description: 'Two-Line Element orbit data — fetched on load',
    staleAfterMs: 24 * 60 * 60 * 1000, // 24 hours
    downAfterMs:  72 * 60 * 60 * 1000, // 72 hours
  },
  'spacetrack': {
    id: 'spacetrack',
    label: 'Space-Track (TLEs)',
    description: 'Space-Track TLE database — primary/fallback backup',
    staleAfterMs: 24 * 60 * 60 * 1000,
    downAfterMs:  72 * 60 * 60 * 1000,
  },
  'pollux-iss-passes': {
    id: 'pollux-iss-passes',
    label: 'Pollux ISS Passes',
    description: 'ISS pass predictions — fetched on location load',
    staleAfterMs: 3_600_000,
    downAfterMs:  86_400_000,
  },
  'wttr-moon': {
    id: 'wttr-moon',
    label: 'wttr.in Moon Phase',
    description: 'Moon phase & illumination — fetched on Tonight load',
    staleAfterMs: 3_600_000,
    downAfterMs:  86_400_000,
  },
};

// ─── TLE freshness config ───────────────────────────────────────────────────────
// TLE elements drift; reliable position accuracy degrades after ~2 days.
// Since we serve mock TLEs (no live CelesTrak call) unless N2YO key is set,
// we track a "TLE last synced" timestamp updated whenever live orbital data arrives.
export const TLE_THRESHOLDS = {
  freshMs:   24 * 60 * 60 * 1000,   // green  within 24 h
  staleMs:   72 * 60 * 60 * 1000,   // amber  within 72 h
  // beyond staleMs → red
};

// ─── State ─────────────────────────────────────────────────────────────────────

/** @type {Map<string, { lastSuccessAt: number|null, lastAttemptAt: number|null, lastResponseMs: number|null, errorMessage: string|null, isFallback: boolean, totalCalls: number, totalFailures: number }>} */
const _sources = new Map(
  Object.keys(API_SOURCES).map(id => [id, {
    lastSuccessAt: null,
    lastAttemptAt: null,
    lastResponseMs: null,
    errorMessage: null,
    isFallback: false,
    totalCalls: 0,
    totalFailures: 0,
  }])
);

/** @type {{ ts: number, level: 'info'|'warn'|'error', source: string, message: string }[]} */
const _eventLog = [];
const MAX_LOG_ENTRIES = 20;

/** TLE last synced timestamp */
let _tleLastSyncedAt = null;

// ─── Pub-sub ────────────────────────────────────────────────────────────────────
const _listeners = new Set();

function _notify() {
  for (const fn of _listeners) {
    try { fn(); } catch (_) { /* silent */ }
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────────

/**
 * Subscribe to telemetry changes.
 * @param {() => void} fn  Callback fired on any state change.
 * @returns {() => void}   Unsubscribe function.
 */
export function subscribe(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

/**
 * Record a successful API call.
 * @param {string} sourceId  Key from API_SOURCES.
 * @param {number} durationMs  How long the request took.
 * @param {{ isFallback?: boolean, isLiveData?: boolean }} [opts]
 */
export function recordSuccess(sourceId, durationMs, opts = {}) {
  const rec = _sources.get(sourceId);
  if (!rec) return;
  const now = Date.now();
  rec.lastSuccessAt = now;
  rec.lastAttemptAt = now;
  rec.lastResponseMs = durationMs;
  rec.isFallback = opts.isLiveData === false;
  rec.errorMessage = null;
  rec.totalCalls++;

  const label = API_SOURCES[sourceId]?.label ?? sourceId;
  _pushLog('info', sourceId,
    `${label} — response in ${durationMs} ms${opts.isLiveData === false ? ' (cached)' : ''}`);
  _notify();
}

/**
 * Record a failed API call. Optionally record that the app fell back to cached/mock data.
 * @param {string} sourceId
 * @param {string} errorMessage
 * @param {{ statusCode?: number, fallbackUsed?: boolean }} [opts]
 */
export function recordFailure(sourceId, errorMessage, opts = {}) {
  const rec = _sources.get(sourceId);
  if (!rec) return;
  const now = Date.now();
  rec.lastAttemptAt = now;
  rec.errorMessage = errorMessage;
  rec.totalCalls++;
  rec.totalFailures++;

  const label = API_SOURCES[sourceId]?.label ?? sourceId;
  const statusStr = opts.statusCode ? ` [HTTP ${opts.statusCode}]` : '';
  const fallbackStr = opts.fallbackUsed ? ' — falling back to cached data' : '';
  const level = opts.statusCode === 429 ? 'warn' : 'error';
  _pushLog(level, sourceId,
    `${label} FAILED${statusStr}: ${errorMessage}${fallbackStr}`);

  if (opts.fallbackUsed) {
    rec.isFallback = true;
    _pushLog('warn', sourceId, `${label} — serving cached/mock data`);
  }
  _notify();
}

/**
 * Record a retry attempt.
 * @param {string} sourceId
 * @param {number} attempt  Which retry number (1-based).
 */
export function recordRetry(sourceId, attempt) {
  const label = API_SOURCES[sourceId]?.label ?? sourceId;
  _pushLog('warn', sourceId, `${label} — retry #${attempt}`);
  _notify();
}

/**
 * Record that fresh TLE/orbital elements were synced.
 * @param {{ source?: string, count?: number }} [opts]
 */
export function recordTLESync(opts = {}) {
  _tleLastSyncedAt = Date.now();
  const src = opts.source ?? 'N2YO / ephemeris';
  const cnt = opts.count ? ` (${opts.count} objects)` : '';
  _pushLog('info', opts.source ?? 'n2yo', `Orbital elements synced from ${src}${cnt}`);
  _notify();
}

// ─── Derived getters ────────────────────────────────────────────────────────────

/**
 * Derive health status for a single source.
 * @returns {'ok'|'degraded'|'down'|'unknown'}
 */
export function getSourceStatus(sourceId) {
  const rec = _sources.get(sourceId);
  const def = API_SOURCES[sourceId];
  if (!rec || !def) return 'unknown';

  if (rec.lastSuccessAt === null) {
    // Never succeeded → check if we've even tried
    if (rec.totalCalls === 0) return 'unknown';
    return 'down';
  }

  const age = Date.now() - rec.lastSuccessAt;
  if (age > def.downAfterMs) return 'down';
  if (age > def.staleAfterMs) return 'degraded';
  return 'ok';
}

/**
 * Get a snapshot of all source telemetry.
 * @returns {Array<{ id, label, description, status, lastSuccessAt, lastAttemptAt, lastResponseMs, errorMessage, isFallback, totalCalls, totalFailures }>}
 */
export function getAllSourceSnapshots() {
  return Object.keys(API_SOURCES).map(id => ({
    ...API_SOURCES[id],
    ...(_sources.get(id) ?? {}),
    status: getSourceStatus(id),
  }));
}

/**
 * Get TLE freshness info.
 * @returns {{ lastSyncedAt: number|null, status: 'fresh'|'stale'|'very-stale'|'unknown' }}
 */
export function getTLEFreshness() {
  if (_tleLastSyncedAt === null) return { lastSyncedAt: null, status: 'unknown' };
  const age = Date.now() - _tleLastSyncedAt;
  let status;
  if (age < TLE_THRESHOLDS.freshMs) status = 'fresh';
  else if (age < TLE_THRESHOLDS.staleMs) status = 'stale';
  else status = 'very-stale';
  return { lastSyncedAt: _tleLastSyncedAt, status };
}

/**
 * Get the event log, most-recent first.
 * @returns {Array<{ ts, level, source, message }>}
 */
export function getEventLog() {
  return [..._eventLog].reverse();
}

// ─── Internals ──────────────────────────────────────────────────────────────────

function _pushLog(level, source, message) {
  _eventLog.push({ ts: Date.now(), level, source, message });
  if (_eventLog.length > MAX_LOG_ENTRIES) {
    _eventLog.shift();
  }
}
