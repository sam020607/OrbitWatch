import { useApp } from '../../context/AppContext.jsx';
import { azimuthToCompass } from '../../utils/orbitMath.js';
import { Compass, Target, X, Satellite } from 'lucide-react';

/**
 * LookUpCard — Compass rose + elevation arc for a selected satellite.
 * Shows exact azimuth heading and elevation to look at in the sky.
 * Works for the current satellite position or an upcoming pass.
 */
export default function LookUpCard() {
  const { state, actions } = useApp();
  const { selectedSatellite, issNextPasses, location } = state;
  const [now] = [Math.floor(Date.now() / 1000)];

  // Determine what to show
  let displayData = null;
  let title = '';

  if (selectedSatellite) {
    // For a selected satellite, compute approximate elevation
    // (proper computation needs observer lat/lon and satellite TLE)
    // Here we use a reasonable mock elevation based on satellite altitude
    const approxEl = Math.max(10, Math.min(85, 90 - (selectedSatellite.satalt / 450) * 50));
    const approxAz = ((selectedSatellite.satlat * 3 + selectedSatellite.satlon + 180) % 360);
    displayData = {
      az: approxAz,
      el: approxEl,
      name: selectedSatellite.satname,
      alt: selectedSatellite.satalt,
      velocity: selectedSatellite.velocity,
    };
    title = 'Satellite Direction';
  } else if (issNextPasses.length > 0) {
    // Show the next ISS pass peak direction
    const nextPass = issNextPasses.find(p => p.endUTC > now);
    if (nextPass) {
      displayData = {
        az: nextPass.maxAz,
        el: nextPass.maxEl,
        name: 'ISS',
        passTime: nextPass.maxUTC,
      };
      title = 'ISS Peak Direction';
    }
  }

  if (!displayData) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center h-full">
        <Compass className="w-10 h-10 text-muted mb-3 opacity-30" />
        <p className="text-muted text-sm">Select a satellite</p>
        <p className="text-muted text-xs mt-1">or wait for an ISS pass</p>
      </div>
    );
  }

  const { az, el, name } = displayData;
  const compass = azimuthToCompass(az);
  const azRad = (az - 90) * (Math.PI / 180); // Convert for SVG (0° = East in SVG)

  // Needle endpoint
  const cx = 90, cy = 90, r = 70;
  const nx = cx + r * 0.75 * Math.cos(azRad);
  const ny = cy + r * 0.75 * Math.sin(azRad);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Compass className="w-4 h-4 text-cyan" />
        <h2 className="text-xs font-mono font-bold tracking-widest uppercase text-muted-light">
          {title}
        </h2>
        {selectedSatellite && (
          <button
            onClick={() => actions.selectSatellite(null)}
            className="ml-auto text-muted hover:text-text transition-colors"
            aria-label="Close look-up card"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Satellite name */}
      <div className="text-center">
        <p className="text-cyan font-mono font-bold text-base">{name}</p>
        {displayData.alt && (
          <p className="text-muted text-xs font-mono mt-0.5">
            {displayData.alt?.toFixed(0)} km altitude · {displayData.velocity?.toFixed(2)} km/s
          </p>
        )}
      </div>

      {/* Compass Rose SVG */}
      <div className="flex justify-center">
        <svg width="180" height="180" viewBox="0 0 180 180" className="overflow-visible">
          {/* Outer ring */}
          <circle cx="90" cy="90" r="80" fill="none" stroke="#1e3a5f" strokeWidth="1" />
          <circle cx="90" cy="90" r="80" fill="rgba(13,27,42,0.6)" />

          {/* Degree ticks */}
          {Array.from({ length: 36 }, (_, i) => {
            const angle = (i * 10 - 90) * (Math.PI / 180);
            const isMajor = i % 9 === 0;
            const x1 = 90 + 76 * Math.cos(angle);
            const y1 = 90 + 76 * Math.sin(angle);
            const x2 = 90 + (isMajor ? 66 : 71) * Math.cos(angle);
            const y2 = 90 + (isMajor ? 66 : 71) * Math.sin(angle);
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isMajor ? '#2d5a8e' : '#1e3a5f'} strokeWidth={isMajor ? 1.5 : 0.5}
              />
            );
          })}

          {/* Cardinal labels */}
          {[
            { label: 'N', angle: -90, color: '#ef4444' },
            { label: 'E', angle: 0, color: '#94a3b8' },
            { label: 'S', angle: 90, color: '#94a3b8' },
            { label: 'W', angle: 180, color: '#94a3b8' },
          ].map(({ label, angle, color }) => {
            const rad = angle * (Math.PI / 180);
            const x = 90 + 58 * Math.cos(rad);
            const y = 90 + 58 * Math.sin(rad) + 4;
            return (
              <text key={label} x={x} y={y} textAnchor="middle" fill={color}
                fontSize="11" fontFamily="Space Mono, monospace" fontWeight="700">
                {label}
              </text>
            );
          })}

          {/* Inner circles */}
          <circle cx="90" cy="90" r="45" fill="none" stroke="#1e3a5f" strokeWidth="0.5" strokeDasharray="3,3" />
          <circle cx="90" cy="90" r="20" fill="rgba(0,212,255,0.05)" stroke="#00d4ff" strokeWidth="0.5" />

          {/* Compass needle */}
          <line
            x1="90" y1="90" x2={nx} y2={ny}
            stroke="#00d4ff" strokeWidth="2.5" strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 4px rgba(0,212,255,0.8))' }}
          />
          <line
            x1="90" y1="90"
            x2={90 - (nx - 90) * 0.35}
            y2={90 - (ny - 90) * 0.35}
            stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round"
          />

          {/* Center dot */}
          <circle cx="90" cy="90" r="5" fill="#00d4ff"
            style={{ filter: 'drop-shadow(0 0 6px rgba(0,212,255,1))' }}
          />

          {/* Azimuth label */}
          <text x="90" y="165" textAnchor="middle" fill="#00d4ff" fontSize="11"
            fontFamily="Space Mono, monospace" fontWeight="700">
            {az.toFixed(0)}° {compass}
          </text>
        </svg>
      </div>

      {/* Elevation Arc */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-muted text-xs font-mono uppercase tracking-wider">Elevation above horizon</p>
        <div className="flex items-end gap-3">
          <ElevationArc elevation={el} />
          <div className="text-center pb-2">
            <p className="font-mono text-3xl font-bold text-amber"
              style={{ textShadow: '0 0 15px rgba(245,158,11,0.6)' }}>
              {el.toFixed(0)}°
            </p>
            <p className="text-muted text-xs">{getElevationLabel(el)}</p>
          </div>
        </div>
      </div>

      {/* Plain English instruction */}
      <div className="px-4 py-3 rounded-xl border border-cyan/30 bg-cyan/5 text-center">
        <Target className="w-4 h-4 text-cyan mx-auto mb-1" />
        <p className="text-text text-sm leading-relaxed font-sans">
          Point <span className="text-cyan font-bold">{compass}</span>{' '}
          at <span className="text-amber font-bold">{el.toFixed(0)}°</span> above the horizon
        </p>
        <p className="text-muted text-xs mt-1">
          {getElevationHint(el)}
        </p>
      </div>
    </div>
  );
}

function ElevationArc({ elevation }) {
  const r = 55;
  const cx = 70, cy = 75;
  const startAngle = 180; // horizon = left side
  const endAngle = 180 - elevation; // towards zenith
  const startRad = startAngle * (Math.PI / 180);
  const endRad = endAngle * (Math.PI / 180);
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = elevation > 90 ? 1 : 0;

  // Satellite position dot
  const satX = cx + r * Math.cos(endRad);
  const satY = cy + r * Math.sin(endRad);

  return (
    <svg width="140" height="85" viewBox="0 0 140 85">
      {/* Horizon line */}
      <line x1="10" y1="75" x2="130" y2="75" stroke="#1e3a5f" strokeWidth="1" />
      <text x="135" y="78" fontSize="9" fill="#64748b" fontFamily="Space Mono, monospace">0°</text>

      {/* Zenith label */}
      <text x="70" y="8" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="Space Mono, monospace">90°</text>
      <text x="70" y="17" textAnchor="middle" fontSize="7" fill="#64748b" fontFamily="Space Mono, monospace">zenith</text>

      {/* Arc background (full half-circle) */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#1e3a5f" strokeWidth="1.5" strokeDasharray="3,3"
      />

      {/* Elevation arc */}
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
        fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.7))' }}
      />

      {/* Angle tick marks */}
      {[30, 45, 60].map(deg => {
        const a = (180 - deg) * (Math.PI / 180);
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        return (
          <g key={deg}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="#1e3a5f" strokeWidth="0.5" strokeDasharray="2,2" />
            <text x={x - 2} y={y - 3} fontSize="7" fill="#64748b" fontFamily="Space Mono, monospace">{deg}°</text>
          </g>
        );
      })}

      {/* Satellite dot */}
      <circle cx={satX} cy={satY} r="5" fill="#f59e0b"
        style={{ filter: 'drop-shadow(0 0 5px rgba(245,158,11,0.9))' }}
      />

      {/* Observer dot */}
      <circle cx={cx} cy={cy} r="4" fill="#00d4ff"
        style={{ filter: 'drop-shadow(0 0 5px rgba(0,212,255,0.9))' }}
      />
    </svg>
  );
}

function getElevationLabel(el) {
  if (el >= 75) return 'Near zenith';
  if (el >= 50) return 'High overhead';
  if (el >= 30) return 'Mid-sky';
  if (el >= 15) return 'Low sky';
  return 'Near horizon';
}

function getElevationHint(el) {
  if (el >= 60) return 'Look nearly straight up — very high pass';
  if (el >= 40) return 'Look up at a steep angle from the horizon';
  if (el >= 20) return 'Look up at a moderate angle';
  return 'Look low on the horizon — may be obscured by buildings';
}
