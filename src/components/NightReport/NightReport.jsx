import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { formatTime, formatDuration, azimuthToCompass, magnitudeToDescription, getPlanetEmoji } from '../../utils/orbitMath.js';
import { MOCK_METEOR_SHOWERS } from '../../data/mockSatellites.js';
import { Moon, Star, Satellite, Zap, ChevronDown } from 'lucide-react';
import SunCalc from 'suncalc';
import ThreeMoon from './ThreeMoon.jsx';

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
          <Star className="w-4 h-4 text-cyan" />
          <h2 className="text-sm font-crimson font-bold tracking-wider uppercase text-text">
            What's Visible Tonight?
          </h2>
        </div>
        {location && (
          <p className="text-muted text-xs font-crimson">
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
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-crimson font-semibold transition-all duration-200
                ${activeTab === tab.id ? 'tab-active' : 'text-muted hover:text-muted-light'}`}
            >
              <Icon className="w-3.5 h-3.5" />
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
      <div className="p-6 text-center text-muted font-crimson">
        <Satellite className="w-8 h-8 mx-auto mb-2 opacity-30 text-cyan" />
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
                  <span className="font-crimson text-sm text-text font-bold">ISS</span>
                  {isVisible && <span className="badge badge-green animate-pulse" style={{ fontSize: 9 }}>VISIBLE</span>}
                  {secsAway < 900 && !isVisible && <span className="badge badge-cyan animate-pulse" style={{ fontSize: 9 }}>SOON</span>}
                </div>
                <p className="text-muted text-xs font-crimson mt-0.5">
                  {pass.startAzCompass} → {pass.maxAzCompass} → {pass.endAzCompass}
                </p>
              </div>

              {/* Max elevation */}
              <div className="shrink-0 text-right">
                <p className="font-mono text-base font-bold text-cyan">{pass.maxEl}°</p>
                <p className="font-crimson text-xs text-muted">max el</p>
              </div>

              <ChevronDown className={`w-4 h-4 text-muted shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            {/* Expanded details */}
            {isExpanded && (
              <div className="px-4 pb-3 grid grid-cols-2 gap-2 bg-navy/20">
                <Detail label="AOS" value={<span><span className="font-mono">{formatTime(pass.startUTC)}</span> <span className="font-crimson">from</span> {pass.startAzCompass} (<span className="font-mono">{pass.startAz}°</span>)</span>} />
                <Detail label="MAX" value={<span><span className="font-mono">{formatTime(pass.maxUTC)}</span> — <span className="font-mono">{pass.maxEl}°</span> <span className="font-crimson">at</span> {pass.maxAzCompass}</span>} />
                <Detail label="LOS" value={<span><span className="font-mono">{formatTime(pass.endUTC)}</span> <span className="font-crimson">to</span> {pass.endAzCompass} (<span className="font-mono">{pass.endAz}°</span>)</span>} />
                <Detail label="Brightness" value={pass.mag != null ? <span><span className="font-crimson">{magnitudeToDescription(pass.mag)}</span> (<span className="font-mono">{pass.mag > 0 ? '+' : ''}{pass.mag?.toFixed(1)}</span> <span className="font-crimson">mag</span>)</span> : 'N/A'} />
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
                <p className="font-crimson text-sm font-bold text-text">{name}</p>
                {isVisible
                  ? <span className="badge badge-green" style={{ fontSize: 9 }}>VISIBLE</span>
                  : <span className="badge badge-red" style={{ fontSize: 9 }}>BELOW HORIZON</span>
                }
              </div>
              <p className="text-muted text-xs font-crimson mt-0.5">
                <span className="font-mono">{az.toFixed(0)}°</span> {azimuthToCompass(az)} · <span className="font-mono">{Math.abs(alt).toFixed(1)}°</span> {alt >= 0 ? 'above' : 'below'} horizon
              </p>
              {(rise || set) && (
                <p className="text-muted text-xs font-crimson">
                  {rise && <span>↑ <span className="font-mono">{rise}</span></span>} {set && <span> ↓ <span className="font-mono">{set}</span></span>}
                </p>
              )}
            </div>
            {mag != null && (
              <div className="text-right shrink-0">
                <p className="font-mono text-sm text-cyan">{mag > 0 ? '+' : ''}{mag.toFixed(1)}</p>
                <p className="text-muted text-xs font-crimson">mag</p>
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
  if (!data || !data.phase) return <LoadingPlaceholder label="Loading moon data..." />;

  const illumination = typeof data.illumination === 'number' ? data.illumination : 0;
  const phaseName = data.phase;
  
  // Use SunCalc to calculate precise moon age
  const sunCalcMoon = SunCalc.getMoonIllumination(new Date());
  const age = (sunCalcMoon.phase * 29.530588).toFixed(1);
  
  const phaseEmojis = {
    'new moon': '🌑',
    'waxing crescent': '🌒',
    'first quarter': '🌓',
    '1st quarter': '🌓',
    'waxing gibbous': '🌔',
    'full moon': '🌕',
    'waning gibbous': '🌖',
    'last quarter': '🌗',
    '3rd quarter': '🌗',
    'waning crescent': '🌘',
  };
  const emoji = phaseEmojis[phaseName.toLowerCase()] || '🌙';

  const isWaxing = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous'].includes(phaseName);

  return (
    <div className="p-4 flex flex-col items-center gap-5">
      {/* Moon Graphic */}
      <div className="w-full relative flex justify-center mt-2 mb-4">
        <ThreeMoon illumination={illumination} phaseName={phaseName} />
        <div className="absolute top-0 right-4 text-2xl drop-shadow-md z-10">{emoji}</div>
      </div>

      {/* Phase info */}
      <div className="text-center z-10">
        <p className="font-crimson text-lg font-bold text-text">{phaseName}</p>
        <p className="text-cyan font-crimson text-sm mt-1">
          <span className="font-mono text-base font-bold">{illumination}%</span> illuminated
        </p>
        {age && (
          <p className="text-muted text-xs mt-1 font-crimson">
            Day <span className="font-mono font-bold">{age}</span> of lunar cycle
          </p>
        )}
      </div>

      {/* Illumination bar */}
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-xs font-crimson text-muted mb-1">
          <span>New Moon</span>
          <span>Full Moon</span>
        </div>
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
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
        <p className="text-muted-light text-sm font-crimson">
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
                <p className="font-crimson text-sm font-bold text-text">{shower.name}</p>
                {shower.active
                  ? <span className="badge badge-green" style={{ fontSize: 9 }}>ACTIVE NOW</span>
                  : <span className="badge badge-amber" style={{ fontSize: 9 }}>UPCOMING</span>
                }
              </div>
              <p className="text-muted text-xs mb-1 font-crimson">
                Peak: <span className="text-muted-light">{shower.peak}</span>
              </p>
              <p className="text-muted text-xs mb-2 font-crimson">
                Rate: <span className="text-cyan font-mono font-bold">~{shower.rate}</span><span className="text-muted-light">/hour at peak</span>
              </p>
              <p className="text-muted text-xs leading-relaxed font-crimson">{shower.description}</p>
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
      <p className="text-muted text-[10px] font-crimson uppercase">{label}</p>
      <p className="text-muted-light text-xs font-crimson">{value}</p>
    </div>
  );
}

function LoadingPlaceholder({ label }) {
  return (
    <div className="flex flex-col items-center justify-center h-32 text-muted">
      <div className="spinner mb-3" />
      <p className="text-sm font-crimson">{label}</p>
    </div>
  );
}
