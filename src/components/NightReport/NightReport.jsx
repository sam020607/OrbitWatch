import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { formatTime, formatDuration, azimuthToCompass, magnitudeToDescription, getPlanetEmoji } from '../../utils/orbitMath.js';
import { MOCK_METEOR_SHOWERS } from '../../data/mockSatellites.js';
import { Moon, Star, Satellite, Zap, ChevronDown, ChevronUp } from 'lucide-react';

const TABS = [
  { id: 'satellites', label: 'Satellites', icon: Satellite },
  { id: 'planets', label: 'Planets', icon: Star },
  { id: 'moon', label: 'Moon', icon: Moon },
  { id: 'meteors', label: 'Meteors', icon: Zap },
];

/**
 * NightReport — Tonight's sky visibility personalised report.
 * Tabbed: ISS/satellite passes | Visible planets | Moon phase | Meteor showers
 */
export default function NightReport() {
  const { state } = useApp();
  const { issNextPasses, nightSkyData, moonPhase, location } = state;
  const [activeTab, setActiveTab] = useState('satellites');
  const [expandedPass, setExpandedPass] = useState(null);

  const now = Math.floor(Date.now() / 1000);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <Star className="w-4 h-4 text-amber" />
          <h2 className="text-sm font-mono font-bold tracking-wider uppercase text-text">
            What's Visible Tonight?
          </h2>
        </div>
        {location && (
          <p className="text-muted text-xs font-mono">
            📍 {location.name} — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-navy/30">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-mono transition-all duration-200
                ${activeTab === tab.id ? 'tab-active' : 'text-muted hover:text-muted-light'}`}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'satellites' && (
          <SatellitePasses passes={issNextPasses} now={now} expandedPass={expandedPass} onExpand={setExpandedPass} />
        )}
        {activeTab === 'planets' && (
          <PlanetsTab data={nightSkyData} />
        )}
        {activeTab === 'moon' && (
          <MoonTab data={moonPhase} />
        )}
        {activeTab === 'meteors' && (
          <MeteorTab showers={MOCK_METEOR_SHOWERS} />
        )}
      </div>
    </div>
  );
}

// ─── Tab: Satellite Passes ────────────────────────────────────────────────────

function SatellitePasses({ passes, now, expandedPass, onExpand }) {
  const upcoming = passes.filter(p => p.endUTC > now);

  if (upcoming.length === 0) {
    return (
      <div className="p-6 text-center text-muted">
        <Satellite className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No ISS passes found</p>
        <p className="text-xs mt-1">Select a location to load pass data</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {upcoming.map((pass, i) => {
        const isExpanded = expandedPass === i;
        const isVisible = now >= pass.startUTC && now <= pass.endUTC;
        const secsAway = Math.max(0, pass.startUTC - now);

        return (
          <div key={i} className={`transition-colors ${isVisible ? 'bg-success/5' : ''}`}>
            <button
              onClick={() => onExpand(isExpanded ? null : i)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-panel-light text-left"
            >
              {/* Time */}
              <div className="shrink-0 text-center w-14">
                <p className="font-mono text-sm font-bold text-text">{formatTime(pass.startUTC)}</p>
                <p className="font-mono text-xs text-muted">{formatDuration(pass.duration)}</p>
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base">🛸</span>
                  <span className="font-mono text-sm text-text font-bold">ISS</span>
                  {isVisible && <span className="badge badge-green" style={{ fontSize: 9 }}>VISIBLE</span>}
                  {secsAway < 900 && !isVisible && <span className="badge badge-cyan animate-pulse" style={{ fontSize: 9 }}>SOON</span>}
                </div>
                <p className="text-muted text-xs font-mono mt-0.5">
                  {pass.startAzCompass} → {pass.maxAzCompass} → {pass.endAzCompass}
                </p>
              </div>

              {/* Max elevation */}
              <div className="shrink-0 text-right">
                <p className="font-mono text-base font-bold text-cyan">{pass.maxEl}°</p>
                <p className="font-mono text-xs text-muted">max el</p>
              </div>

              <ChevronDown className={`w-4 h-4 text-muted shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            {/* Expanded details */}
            {isExpanded && (
              <div className="px-4 pb-3 grid grid-cols-2 gap-2 bg-navy/20">
                <Detail label="AOS" value={`${formatTime(pass.startUTC)} from ${pass.startAzCompass} (${pass.startAz}°)`} />
                <Detail label="MAX" value={`${formatTime(pass.maxUTC)} — ${pass.maxEl}° at ${pass.maxAzCompass}`} />
                <Detail label="LOS" value={`${formatTime(pass.endUTC)} to ${pass.endAzCompass} (${pass.endAz}°)`} />
                <Detail label="Brightness" value={pass.mag != null ? `${magnitudeToDescription(pass.mag)} (mag ${pass.mag > 0 ? '+' : ''}${pass.mag?.toFixed(1)})` : 'N/A'} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Planets ────────────────────────────────────────────────────────────

function PlanetsTab({ data }) {
  const planets = data?.data?.table?.rows || [];

  if (planets.length === 0) {
    return <LoadingPlaceholder label="Loading planet data..." />;
  }

  return (
    <div className="divide-y divide-border/50">
      {planets.map((row, i) => {
        const cell = row.cells?.[0];
        if (!cell) return null;
        const name = cell.name || row.entry?.name;
        const horiz = cell.position?.horizontal || cell.position?.horizonal;
        const alt = parseFloat(horiz?.altitude?.degrees || 0);
        const az = parseFloat(horiz?.azimuth?.degrees || 0);
        const rise = cell.extraInfo?.rise?.time;
        const set = cell.extraInfo?.set?.time;
        const mag = cell.extraInfo?.magnitude?.raw;
        const isVisible = alt > 0;

        return (
          <div key={i} className={`flex items-center gap-3 px-4 py-3 ${!isVisible ? 'opacity-50' : ''}`}>
            <div className="text-2xl">{getPlanetEmoji(name)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm font-bold text-text">{name}</p>
                {isVisible
                  ? <span className="badge badge-green" style={{ fontSize: 9 }}>VISIBLE</span>
                  : <span className="badge badge-red" style={{ fontSize: 9 }}>BELOW HORIZON</span>
                }
              </div>
              <p className="text-muted text-xs font-mono mt-0.5">
                {az.toFixed(0)}° {azimuthToCompass(az)} · {Math.abs(alt).toFixed(1)}° {alt >= 0 ? 'above' : 'below'} horizon
              </p>
              {(rise || set) && (
                <p className="text-muted text-xs font-mono">
                  {rise && `↑ ${rise}`} {set && `↓ ${set}`}
                </p>
              )}
            </div>
            {mag != null && (
              <div className="text-right shrink-0">
                <p className="font-mono text-sm text-amber">{mag > 0 ? '+' : ''}{mag.toFixed(1)}</p>
                <p className="text-muted text-xs">mag</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Moon ───────────────────────────────────────────────────────────────

function MoonTab({ data }) {
  const phase = data?.data?.phase;
  if (!phase) return <LoadingPlaceholder label="Loading moon data..." />;

  const rawIllum = phase.illumination;
  const illumination = typeof rawIllum === 'string'
    ? parseFloat(rawIllum.replace('%', ''))
    : (rawIllum || 0);
  const phaseName = phase.name;
  const emoji = phase.emoji || '🌙';
  const age = phase.age?.days?.toFixed(1);

  // Draw moon illumination arc
  const moonR = 45;
  const isWaxing = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous'].includes(phaseName);
  const illum = illumination / 100;

  return (
    <div className="p-4 flex flex-col items-center gap-5">
      {/* Moon graphic */}
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <defs>
            <clipPath id="moonClip">
              <circle cx="60" cy="60" r={moonR} />
            </clipPath>
          </defs>
          {/* Dark side */}
          <circle cx="60" cy="60" r={moonR} fill="#1a2535" />
          {/* Lit side */}
          <ellipse
            cx="60" cy="60"
            rx={moonR * illum} ry={moonR}
            fill="#e2e8f0"
            clipPath="url(#moonClip)"
            style={{ transform: isWaxing ? 'translateX(0)' : `translateX(${moonR * (1 - illum * 2)}px)`, }}
          />
          {/* Glow */}
          <circle cx="60" cy="60" r={moonR} fill="none"
            stroke="#e2e8f0" strokeWidth="0.5" opacity="0.4" />
        </svg>
        <div className="absolute top-1 right-1 text-2xl">{emoji}</div>
      </div>

      {/* Phase info */}
      <div className="text-center">
        <p className="font-mono text-xl font-bold text-text">{phaseName}</p>
        <p className="text-amber font-mono text-lg mt-1">{illumination}% illuminated</p>
        {age && <p className="text-muted text-sm mt-1 font-mono">Day {age} of lunar cycle</p>}
      </div>

      {/* Illumination bar */}
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-xs font-mono text-muted mb-1">
          <span>New Moon</span>
          <span>Full Moon</span>
        </div>
        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${illumination}%`,
              background: 'linear-gradient(90deg, #64748b, #e2e8f0)',
              boxShadow: '0 0 8px rgba(226,232,240,0.4)',
            }}
          />
        </div>
      </div>

      {/* Visibility note */}
      <div className="px-4 py-3 rounded-lg border border-border bg-navy/50 text-center w-full max-w-xs">
        <p className="text-muted-light text-sm font-sans">
          {illumination > 50
            ? '🌙 Bright moon tonight — may reduce faint satellite visibility'
            : illumination < 20
              ? '✨ Dark sky — excellent viewing conditions'
              : '🔭 Moderate lighting — good conditions'}
        </p>
      </div>
    </div>
  );
}

// ─── Tab: Meteors ────────────────────────────────────────────────────────────

function MeteorTab({ showers }) {
  return (
    <div className="divide-y divide-border/50">
      {showers.map((shower, i) => (
        <div key={i} className="px-4 py-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">☄️</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-mono text-sm font-bold text-text">{shower.name}</p>
                {shower.active
                  ? <span className="badge badge-green" style={{ fontSize: 9 }}>ACTIVE NOW</span>
                  : <span className="badge badge-amber" style={{ fontSize: 9 }}>UPCOMING</span>
                }
              </div>
              <p className="text-muted text-xs mb-2">Peak: <span className="text-muted-light">{shower.peak}</span></p>
              <p className="text-muted text-xs mb-2">
                Rate: <span className="text-amber font-mono">~{shower.rate}/hour</span> at peak
              </p>
              <p className="text-muted text-xs leading-relaxed">{shower.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Detail({ label, value }) {
  return (
    <div className="mt-1">
      <p className="text-muted text-xs font-mono uppercase">{label}</p>
      <p className="text-muted-light text-xs font-mono">{value}</p>
    </div>
  );
}

function LoadingPlaceholder({ label }) {
  return (
    <div className="flex flex-col items-center justify-center h-32 text-muted">
      <div className="spinner mb-3" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
