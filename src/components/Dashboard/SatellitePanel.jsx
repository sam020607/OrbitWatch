import { useApp } from '../../context/AppContext.jsx';
import { SAT_TYPE_CONFIG, MOCK_SATELLITES } from '../../data/mockSatellites.js';
import { getSatTypeIcon } from '../../utils/orbitMath.js';
import { Satellite, ChevronRight, Radio, Gauge } from 'lucide-react';

/**
 * SatellitePanel — Sidebar list of tracked overhead satellites.
 * Clicking a satellite centres the map and opens the LookUpCard.
 */
export default function SatellitePanel() {
  const { state, actions } = useApp();
  const { satellites, selectedSatellite, satelliteFilter } = state;

  // Filter based on active selection
  const filtered = satellites.filter(sat => {
    if (satelliteFilter === 'all') return true;
    if (satelliteFilter === 'major') {
      return sat.type === 'space-station' || sat.type === 'weather' || sat.type === 'earth-obs' || sat.type === 'gps';
    }
    return sat.type === satelliteFilter;
  });

  // Sort: space stations first, then by altitude
  const sorted = [...filtered].sort((a, b) => {
    if (a.type === 'space-station') return -1;
    if (b.type === 'space-station') return 1;
    return a.satalt - b.satalt;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Satellite className="w-4 h-4 text-amber" />
        <h2 className="text-sm font-mono text-text font-bold tracking-wider uppercase">
          Overhead Objects
        </h2>
        <span className="ml-auto badge badge-amber text-xs">{sorted.length}</span>
      </div>

      {/* Filter Selector */}
      <div className="px-4 py-2 border-b border-border bg-navy/20 flex flex-col gap-1 shrink-0">
        <label className="text-[9px] font-mono text-muted uppercase tracking-wider">
          Filter Category
        </label>
        <select
          value={satelliteFilter}
          onChange={(e) => actions.setSatelliteFilter(e.target.value)}
          className="w-full text-xs font-mono bg-panel border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-cyan cursor-pointer transition-colors"
        >
          <option value="major">✨ Major & Brightest</option>
          <option value="space-station">🛸 Space Stations</option>
          <option value="tv">📺 TV & Broadcast</option>
          <option value="gps">🧭 GPS & Navigation</option>
          <option value="comms">📡 Comms & Internet</option>
          <option value="weather">🌦 Weather & Science</option>
          <option value="debris">💫 Space Debris</option>
          <option value="all">🌐 Show All Objects</option>
        </select>
      </div>

      {/* Satellite list */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted">
            <Satellite className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">Loading satellites...</p>
          </div>
        ) : (
          sorted.map((sat) => {
            const isSelected = selectedSatellite?.satid === sat.satid;
            const typeConf = SAT_TYPE_CONFIG[sat.type] || { label: 'Unknown', badgeClass: 'badge-amber', color: '#f59e0b' };
            const altBarWidth = Math.min(100, (sat.satalt / 40000) * 100);
            const speedBarWidth = Math.min(100, (sat.velocity / 10) * 100);

            return (
              <button
                key={sat.satid}
                onClick={() => actions.selectSatellite(isSelected ? null : sat)}
                className={`w-full text-left px-4 py-3 border-b border-border/50 transition-all duration-200 group
                  ${isSelected
                    ? 'bg-cyan/5 border-l-2 border-l-cyan'
                    : 'hover:bg-panel-light'
                  }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{getSatTypeIcon(sat.type)}</span>
                    <div className="min-w-0">
                      <p className={`text-xs font-mono font-bold truncate ${isSelected ? 'text-cyan' : 'text-text'}`}>
                        {sat.satname}
                      </p>
                      <p className="text-muted text-xs font-mono">#{sat.satid}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <span className={`badge ${typeConf.badgeClass}`} style={{ fontSize: 9 }}>
                      {typeConf.label}
                    </span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${isSelected ? 'text-cyan rotate-90' : 'text-muted group-hover:translate-x-0.5'}`} />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-muted" style={{ fontSize: 10 }}>ALT</span>
                      <span className="font-mono text-muted-light" style={{ fontSize: 10 }}>
                        {sat.satalt?.toFixed(0)} km
                      </span>
                    </div>
                    <div className="w-full h-0.5 bg-border rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${altBarWidth}%`,
                          background: typeConf.color || '#f59e0b',
                          boxShadow: `0 0 4px ${typeConf.color || '#f59e0b'}80`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-muted" style={{ fontSize: 10 }}>SPD</span>
                      <span className="font-mono text-muted-light" style={{ fontSize: 10 }}>
                        {sat.velocity?.toFixed(2)} km/s
                      </span>
                    </div>
                    <div className="w-full h-0.5 bg-border rounded-full">
                      <div
                        className="h-full rounded-full bg-cyan"
                        style={{
                          width: `${speedBarWidth}%`,
                          boxShadow: '0 0 4px rgba(0,212,255,0.5)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer: selected satellite info */}
      {selectedSatellite && (
        <div className="p-3 border-t border-border bg-cyan/5">
          <p className="text-cyan text-xs font-mono font-bold text-center">
            📡 Tracking: {selectedSatellite.satname}
          </p>
        </div>
      )}
    </div>
  );
}
