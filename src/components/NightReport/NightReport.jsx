import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
export default function NightReport({ activeSubItem = 'satellites', onSubItemChange }) {
  const { state } = useApp();
  const { issNextPasses, nightSkyData, moonPhase, location } = state;
  const [expandedPass, setExpandedPass] = useState(null);

  const now = Math.floor(Date.now() / 1000);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Location/Date Line */}
      {location && (
        <div className="px-4 pt-2 mb-[24px] shrink-0">
          <p className="text-muted text-[10px] font-sans uppercase tracking-[0.08em] font-bold">
            {location.name} — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}
          </p>
        </div>
      )}

      {/* Tabs (Hidden on desktop, shown only on mobile where sidebar nav rail is absent) */}
      <div className="lg:hidden flex items-center justify-center gap-[30px] border-b border-white/[0.02] bg-panel mb-5 shrink-0">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onSubItemChange && onSubItemChange(tab.id)}
              className={`flex items-center justify-center gap-1.5 pt-[10px] pb-[14px] text-[11px] font-sans uppercase tracking-wider font-bold transition-all duration-200
                ${activeSubItem === tab.id ? 'tab-active' : 'text-muted hover:text-muted-light'}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content with crossfade transition */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubItem}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="h-full overflow-y-auto"
          >
            {activeSubItem === 'satellites' && (
              <SatellitePasses passes={issNextPasses} now={now} expandedPass={expandedPass} onExpand={setExpandedPass} />
            )}
            {activeSubItem === 'planets' && (
              <PlanetsTab data={nightSkyData} />
            )}
            {activeSubItem === 'moon' && (
              <MoonTab data={moonPhase} />
            )}
            {activeSubItem === 'meteors' && (
              <MeteorTab showers={MOCK_METEOR_SHOWERS} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Tab: Satellite Passes ────────────────────────────────────────────────────

function SatellitePasses({ passes, now, expandedPass, onExpand }) {
  const upcoming = passes.filter(p => p.endUTC > now);

  if (upcoming.length === 0) {
    return (
      <div className="p-6 text-center text-muted font-sans uppercase tracking-wider font-semibold">
        <Satellite className="w-8 h-8 mx-auto mb-2 opacity-30 text-cyan" />
        <p className="text-xs font-bold text-text">No ISS passes found</p>
        <p className="text-[10px] mt-1">Select a location to load pass data</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-2">
      {upcoming.map((pass, i) => {
        const isExpanded = expandedPass === i;
        const isVisible = now >= pass.startUTC && now <= pass.endUTC;
        const secsAway = Math.max(0, pass.startUTC - now);

        return (
          <div 
            key={i}
            className="rounded-2xl overflow-hidden transition-all duration-200"
            style={{
              background: isVisible ? 'rgba(15, 55, 38, 0.55)' : 'rgba(15, 22, 38, 0.55)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: isVisible ? '1px solid rgba(74, 222, 128, 0.15)' : '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)',
            }}
          >
            <button
              onClick={() => onExpand(isExpanded ? null : i)}
              className="w-full flex items-center justify-between gap-6 px-4 py-5 hover:bg-panel-light/30 text-left"
            >
              {/* Left side: Time + Main Info */}
              <div className="flex items-center gap-6 min-w-0 flex-1">
                {/* Time */}
                <div className="shrink-0 text-center w-14" style={{ lineHeight: 1.4 }}>
                  <p className="font-mono text-sm font-bold text-text">{formatTime(pass.startUTC)}</p>
                  <p className="font-mono text-xs text-muted mt-0.5">{formatDuration(pass.duration)}</p>
                </div>

                {/* Main info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base mr-2.5">🚀</span>
                    <span className="font-sans text-xs uppercase tracking-wider font-bold text-text">ISS</span>
                    {isVisible && <span className="badge badge-green" style={{ fontSize: 9 }}>VISIBLE</span>}
                    {secsAway < 900 && !isVisible && <span className="badge badge-cyan" style={{ fontSize: 9 }}>SOON</span>}
                  </div>
                  <p className="text-muted text-xs font-sans uppercase tracking-wider font-semibold mt-0.5">
                    {pass.startAzCompass} → {pass.maxAzCompass} → {pass.endAzCompass}
                  </p>
                </div>
              </div>

              {/* Right side: Max Elevation + Chevron */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="font-mono text-base font-bold text-cyan leading-tight">{pass.maxEl}°</p>
                  <p className="font-sans text-[10px] uppercase tracking-wider font-semibold text-muted leading-tight mt-0.5">max el</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Expanded details */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-3 grid grid-cols-2 gap-2 bg-transparent border-t border-white/[0.02]">
                <Detail label="AOS" value={<span><span className="font-mono">{formatTime(pass.startUTC)}</span> <span className="font-sans uppercase tracking-wider text-[9px] text-muted">from</span> {pass.startAzCompass} (<span className="font-mono">{pass.startAz}°</span>)</span>} />
                <Detail label="MAX" value={<span><span className="font-mono">{formatTime(pass.maxUTC)}</span> — <span className="font-mono">{pass.maxEl}°</span> <span className="font-sans uppercase tracking-wider text-[9px] text-muted">at</span> {pass.maxAzCompass}</span>} />
                <Detail label="LOS" value={<span><span className="font-mono">{formatTime(pass.endUTC)}</span> <span className="font-sans uppercase tracking-wider text-[9px] text-muted">to</span> {pass.endAzCompass} (<span className="font-mono">{pass.endAz}°</span>)</span>} />
                <Detail label="Brightness" value={pass.mag != null ? <span><span className="font-sans uppercase tracking-wider text-[10px] text-cyan font-bold">{magnitudeToDescription(pass.mag)}</span> (<span className="font-mono">{pass.mag > 0 ? '+' : ''}{pass.mag?.toFixed(1)}</span> <span className="font-sans uppercase tracking-wider text-[9px] text-muted">mag</span>)</span> : 'N/A'} />
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
    <div className="flex flex-col gap-3 px-4 pb-4">
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
          <div 
            key={i}
            className={`flex items-center gap-[12px] px-4 py-[18px] rounded-2xl transition-all duration-200
              ${!isVisible ? 'opacity-50' : ''}`}
            style={{
              background: 'rgba(15, 22, 38, 0.55)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)',
            }}
          >
            <div className="text-[21px] shrink-0 leading-none select-none">{getPlanetEmoji(name)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-[12px] mb-1.5">
                <p className="font-sans text-xs uppercase tracking-wider font-bold text-text leading-none">{name}</p>
                {isVisible
                  ? <span className="badge badge-green px-3 py-1.5" style={{ fontSize: 9 }}>VISIBLE</span>
                  : <span className="badge badge-red px-3 py-1.5" style={{ fontSize: 9 }}>BELOW HORIZON</span>
                }
              </div>
              <p className="text-muted text-xs font-sans uppercase tracking-wider font-semibold leading-normal">
                <span className="font-mono text-text font-bold">{az.toFixed(0)}°</span> {azimuthToCompass(az)} · <span className="font-mono text-text font-bold">{Math.abs(alt).toFixed(1)}°</span> {alt >= 0 ? 'above' : 'below'} horizon
              </p>
              {(rise || set) && (
                <p className="text-muted text-xs font-sans uppercase tracking-wider font-semibold leading-normal mt-0.5">
                  {rise && <span>↑ <span className="font-mono text-text font-bold">{rise}</span></span>} {set && <span> ↓ <span className="font-mono text-text font-bold">{set}</span></span>}
                </p>
              )}
            </div>
            {mag != null && (
              <div className="text-right shrink-0 ml-2">
                <p className="font-mono text-sm text-cyan">{mag > 0 ? '+' : ''}{mag.toFixed(1)}</p>
                <p className="text-muted text-xs font-sans uppercase tracking-wider font-semibold">mag</p>
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
        <p className="font-sans text-xs uppercase tracking-wider font-bold text-text">{phaseName}</p>
        <p className="text-cyan font-sans uppercase tracking-wider font-bold text-sm mt-1">
          <span className="font-mono text-base font-bold">{illumination}%</span> illuminated
        </p>
        {age && (
          <p className="text-muted text-[11px] font-sans uppercase tracking-wider font-semibold mt-1">
            Day <span className="font-mono font-bold text-text">{age}</span> of lunar cycle
          </p>
        )}
      </div>

      {/* Illumination bar */}
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-xs font-sans uppercase tracking-wider font-semibold text-muted mb-1">
          <span>New Moon</span>
          <span>Full Moon</span>
        </div>
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${illumination}%`,
              background: 'linear-gradient(90deg, #64748b, #e2e8f0)',
            }}
          />
        </div>
      </div>

      {/* Visibility note */}
      <div
        className="px-4 py-3 rounded-2xl text-center w-full max-w-xs"
        style={{
          background: 'rgba(15, 22, 38, 0.55)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.10)',
        }}
      >
        <p className="text-muted text-xs font-sans uppercase tracking-wider font-semibold">
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
    <div className="flex flex-col gap-3 px-4 py-2 pb-4">
      {showers.map((shower, i) => (
        <div
          key={i}
          className="px-4 py-4 rounded-2xl"
          style={{
            background: 'rgba(15, 22, 38, 0.55)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.10)',
          }}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">☄️</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-sans text-xs uppercase tracking-wider font-bold text-text">{shower.name}</p>
                {shower.active
                  ? <span className="badge badge-green" style={{ fontSize: 9 }}>ACTIVE NOW</span>
                  : <span className="badge badge-amber" style={{ fontSize: 9 }}>UPCOMING</span>
                }
              </div>
              <p className="text-muted text-xs mb-1 font-sans uppercase tracking-wider font-semibold">
                Peak: <span className="text-text font-bold">{shower.peak}</span>
              </p>
              <p className="text-muted text-xs mb-2 font-sans uppercase tracking-wider font-semibold">
                Rate: <span className="text-cyan font-mono font-bold">~{shower.rate}</span> <span className="text-muted">/ hour at peak</span>
              </p>
              <p className="text-muted text-xs leading-relaxed font-sans mt-1">{shower.description}</p>
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
      <p className="text-muted text-[10px] font-sans uppercase tracking-wider font-bold">{label}</p>
      <p className="text-text text-xs font-sans mt-0.5">{value}</p>
    </div>
  );
}

function LoadingPlaceholder({ label }) {
  return (
    <div className="flex flex-col items-center justify-center h-32 text-muted">
      <div className="spinner mb-3" />
      <p className="text-sm font-sans uppercase tracking-wider font-semibold">{label}</p>
    </div>
  );
}
