import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { SAT_TYPE_CONFIG } from '../../data/mockSatellites.js';
import { getSatTypeIcon, azimuthToCompass } from '../../utils/orbitMath.js';
import { CONSTELLATIONS, getLocalCoordinates } from '../../data/constellations.js';
import { Satellite, ChevronRight, Star, ChevronDown, Flame, Search, X } from 'lucide-react';

const SATELLITE_CATEGORIES = [
  { value: 'major', label: 'Major & Brightest', icon: '✨' },
  { value: 'space-station', label: 'Space Stations', icon: '🛸' },
  { value: 'tv', label: 'TV & Broadcast', icon: '📺' },
  { value: 'gps', label: 'GPS & Navigation', icon: '🧭' },
  { value: 'comms', label: 'Comms & Internet', icon: '📡' },
  { value: 'weather', label: 'Weather & Science', icon: '🌦' },
  { value: 'debris', label: 'Space Debris', icon: '💫' },
  { value: 'all', label: 'Show All Objects', icon: '🌐' },
];

const ASTEROID_FILTERS = [
  { value: 'all', label: 'All NEAs', icon: '🌐' },
  { value: 'phas', label: 'Hazardous (PHAs)', icon: '⚠️' },
  { value: 'close', label: 'Close Approaches', icon: '⏰' },
];

function getFilterLabel(value) {
  const cat = SATELLITE_CATEGORIES.find(c => c.value === value);
  return cat ? cat.label : 'Major & Brightest';
}

/**
 * SatellitePanel — Sidebar list of tracked overhead satellites or constellations.
 * Clicking an item centres the map and opens the LookUpCard.
 */
export default function SatellitePanel() {
  const { state, actions } = useApp();
  const {
    satellites,
    selectedSatellite,
    satelliteFilter,
    viewMode,
    selectedConstellation,
    location,
    asteroids,
    selectedAsteroid,
    asteroidFilter
  } = state;

  const [isOpen, setIsOpen] = useState(false);
  const [isSatellitesSubOpen, setIsSatellitesSubOpen] = useState(false);
  const [isAsteroidsSubOpen, setIsAsteroidsSubOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter satellites based on active selection and search query
  const filteredSats = useMemo(() => {
    return satellites.filter(sat => {
      let matchesCategory = true;
      if (satelliteFilter === 'all') matchesCategory = true;
      else if (satelliteFilter === 'major') {
        matchesCategory = sat.type === 'space-station' || sat.type === 'weather' || sat.type === 'earth-obs' || sat.type === 'gps';
      } else {
        matchesCategory = sat.type === satelliteFilter;
      }

      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        matchesSearch = sat.satname.toLowerCase().includes(q) || sat.satid.toString().includes(q);
      }

      return matchesCategory && matchesSearch;
    });
  }, [satellites, satelliteFilter, searchQuery]);

  // Filter asteroids based on active selection and search query
  const filteredAsteroids = useMemo(() => {
    return asteroids.filter(ast => {
      let matchesFilter = true;
      if (asteroidFilter === 'phas') matchesFilter = ast.is_potentially_hazardous;
      else if (asteroidFilter === 'close') {
        const timeDiff = Math.abs(Date.now() - ast.close_approach_timestamp);
        matchesFilter = timeDiff < 24 * 3600 * 1000; // within 24 hours
      }

      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        matchesSearch = ast.name.toLowerCase().includes(q) || ast.id.toLowerCase().includes(q);
      }

      return matchesFilter && matchesSearch;
    });
  }, [asteroids, asteroidFilter, searchQuery]);

  // Sort satellites: space stations first, then by altitude
  const sortedSats = useMemo(() => {
    return [...filteredSats].sort((a, b) => {
      if (a.type === 'space-station') return -1;
      if (b.type === 'space-station') return 1;
      return a.satalt - b.satalt;
    });
  }, [filteredSats]);

  // Dynamic calculations of visible constellations and search query
  const visibleConstellations = useMemo(() => {
    if (!location) return [];
    const now = Date.now();
    return CONSTELLATIONS.map(c => {
      const coords = getLocalCoordinates(c.ra, c.dec, location.lat, location.lon, now);
      return { ...c, coords };
    })
    .filter(c => {
      const isVisible = c.coords.el > 0;
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        matchesSearch = c.name.toLowerCase().includes(q) || c.abbr.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      }
      return isVisible && matchesSearch;
    })
    .sort((a, b) => b.coords.el - a.coords.el);
  }, [location, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        {viewMode === 'constellations' ? (
          <Star className="w-4 h-4 text-cyan" />
        ) : viewMode === 'asteroids' ? (
          <Flame className="w-4 h-4 text-red" />
        ) : (
          <Satellite className="w-4 h-4 text-cyan" />
        )}
        <h2 className="text-sm font-crimson font-bold tracking-wider uppercase text-text">
          {viewMode === 'constellations' 
            ? 'Visible Constellations' 
            : viewMode === 'asteroids' 
              ? 'Near-Earth Asteroids' 
              : 'Overhead Objects'}
        </h2>
        <span className={`ml-auto badge ${viewMode === 'constellations' ? 'badge-cyan' : viewMode === 'asteroids' ? 'badge-red' : 'badge-cyan'} text-xs`}>
          {viewMode === 'constellations' 
            ? visibleConstellations.length 
            : viewMode === 'asteroids' 
              ? filteredAsteroids.length 
              : sortedSats.length}
        </span>
      </div>

      {/* Filter / Mode Dropdown Selector */}
      <div className="px-4 py-2 border-b border-border bg-navy/20 flex flex-col gap-1 shrink-0 relative z-[200]">
        <label className="text-[9px] font-crimson text-muted uppercase tracking-wider">
          Tracking Target
        </label>
        
        {/* Custom Dropdown Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between text-xs font-crimson bg-panel border border-border rounded px-2.5 py-1.5 text-text hover:border-border-light transition-all focus:outline-none"
        >
          <span className="flex items-center gap-1.5">
            {viewMode === 'satellites' ? (
              <>
                <Satellite className="w-3.5 h-3.5 text-cyan" />
                <span>Satellites: {getFilterLabel(satelliteFilter)}</span>
              </>
            ) : viewMode === 'constellations' ? (
              <>
                <Star className="w-3.5 h-3.5 text-cyan" />
                <span>Constellations</span>
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5 text-red" />
                <span>Asteroids: {asteroidFilter === 'all' ? 'All NEAs' : asteroidFilter === 'phas' ? 'Hazardous (PHAs)' : 'Close Approaches'}</span>
              </>
            )}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-muted" />
        </button>

        {/* Custom Dropdown Menu */}
        {isOpen && (
          <>
            {/* Click-away backdrop */}
            <div className="fixed inset-0 z-40 cursor-default" onClick={() => { setIsOpen(false); setIsSatellitesSubOpen(false); setIsAsteroidsSubOpen(false); }} />
            
            <div className="absolute top-full left-4 right-4 mt-1 bg-panel border border-border rounded-lg shadow-xl z-50 py-1 font-crimson text-xs">
              {!isSatellitesSubOpen && !isAsteroidsSubOpen ? (
                <>
                  {/* Satellites option (Hover/click opens subcategories) */}
                  <button
                    onMouseEnter={() => { setIsSatellitesSubOpen(true); setIsAsteroidsSubOpen(false); }}
                    onClick={() => { setIsSatellitesSubOpen(true); setIsAsteroidsSubOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-panel-light transition-colors
                      ${viewMode === 'satellites' ? 'text-cyan font-bold bg-cyan/5' : 'text-text'}`}
                  >
                    <span className="flex items-center gap-2">
                      <Satellite className="w-3.5 h-3.5 text-cyan" />
                      Satellites
                    </span>
                    <ChevronRight className="w-3 h-3 text-muted" />
                  </button>

                  {/* Constellations option */}
                  <button
                    onClick={() => {
                      actions.setViewMode('constellations');
                      setSearchQuery('');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-panel-light transition-colors
                      ${viewMode === 'constellations' ? 'text-amber font-bold bg-amber/5' : 'text-text'}`}
                  >
                    <span className="flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-amber" />
                      Constellations
                    </span>
                  </button>

                  {/* Asteroids option */}
                  <button
                    onMouseEnter={() => { setIsAsteroidsSubOpen(true); setIsSatellitesSubOpen(false); }}
                    onClick={() => { setIsAsteroidsSubOpen(true); setIsSatellitesSubOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-panel-light transition-colors
                      ${viewMode === 'asteroids' ? 'text-red font-bold bg-red/5' : 'text-text'}`}
                  >
                    <span className="flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-red" />
                      Asteroids
                    </span>
                    <ChevronRight className="w-3 h-3 text-muted" />
                  </button>
                </>
              ) : isSatellitesSubOpen ? (
                <div onMouseLeave={() => setIsSatellitesSubOpen(false)}>
                  {/* Back button */}
                  <button
                    onClick={() => setIsSatellitesSubOpen(false)}
                    className="w-full flex items-center gap-1.5 px-3 py-1 text-left text-muted hover:text-text border-b border-border/30 font-semibold"
                  >
                    <span>← Back</span>
                  </button>
                  {/* Categories list */}
                  {SATELLITE_CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => {
                        actions.setViewMode('satellites');
                        actions.setSatelliteFilter(cat.value);
                        setSearchQuery('');
                        setIsOpen(false);
                        setIsSatellitesSubOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-panel-light transition-colors
                        ${viewMode === 'satellites' && satelliteFilter === cat.value ? 'text-cyan font-bold bg-cyan/5' : 'text-text'}`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div onMouseLeave={() => setIsAsteroidsSubOpen(false)}>
                  {/* Back button */}
                  <button
                    onClick={() => setIsAsteroidsSubOpen(false)}
                    className="w-full flex items-center gap-1.5 px-3 py-1 text-left text-muted hover:text-text border-b border-border/30 font-semibold"
                  >
                    <span>← Back</span>
                  </button>
                  {/* Asteroid Filters list */}
                  {ASTEROID_FILTERS.map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => {
                        actions.setViewMode('asteroids');
                        actions.setAsteroidFilter(filter.value);
                        setSearchQuery('');
                        setIsOpen(false);
                        setIsAsteroidsSubOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-panel-light transition-colors
                        ${viewMode === 'asteroids' && asteroidFilter === filter.value ? 'text-red font-bold bg-red/5' : 'text-text'}`}
                    >
                      <span>{filter.icon}</span>
                      <span>{filter.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2 border-b border-border bg-navy/10 shrink-0">
        <div className="relative">
          <input
            type="text"
            placeholder={
              viewMode === 'constellations' 
                ? 'Search constellations...' 
                : viewMode === 'asteroids' 
                  ? 'Search asteroids...' 
                  : 'Search satellites (ISS, Starlink...)'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-crimson bg-panel border border-border rounded pl-8 pr-7 py-1.5 text-text placeholder-muted/50 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/30 transition-all"
          />
          <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'constellations' ? (
          visibleConstellations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted text-center px-4">
              <Star className="w-8 h-8 mb-2 opacity-30 text-amber" />
              <p className="text-sm font-crimson">No visible constellations</p>
              <p className="text-xs text-muted font-crimson mt-0.5">Wait or select a different location</p>
            </div>
          ) : (
            visibleConstellations.map((constell) => {
              const isSelected = selectedConstellation?.id === constell.id;
              const { az, el } = constell.coords;
              const compass = azimuthToCompass(az);
              const elBarWidth = Math.min(100, (el / 90) * 100);

              return (
                <button
                  key={constell.id}
                  onClick={() => actions.selectConstellation(isSelected ? null : constell)}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 transition-all duration-200 group
                    ${isSelected
                      ? 'bg-amber/5 border-l-2 border-l-amber'
                      : 'hover:bg-panel-light'
                    }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">🌌</span>
                      <div className="min-w-0">
                        <p className={`text-xs font-crimson font-bold truncate ${isSelected ? 'text-amber' : 'text-text'}`}>
                          {constell.name}
                        </p>
                        <p className="text-muted text-[10px] font-crimson truncate">
                          {constell.abbr} · {constell.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <ChevronRight className={`w-3 h-3 transition-transform ${isSelected ? 'text-amber rotate-90' : 'text-muted group-hover:translate-x-0.5'}`} />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-muted font-crimson text-[9px]">EL</span>
                        <span className="font-mono text-muted-light text-[9px]">
                          {el.toFixed(0)}°
                        </span>
                      </div>
                      <div className="w-full h-0.5 bg-border rounded-full">
                        <div
                          className="h-full rounded-full bg-amber"
                          style={{
                            width: `${elBarWidth}%`,
                            boxShadow: '0 0 4px rgba(245,158,11,0.5)',
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-muted font-crimson text-[9px]">AZ</span>
                        <span className="font-mono text-muted-light text-[9px]">
                          {az.toFixed(0)}° {compass}
                        </span>
                      </div>
                      <div className="w-full h-0.5 bg-border rounded-full">
                        <div
                          className="h-full rounded-full bg-cyan"
                          style={{
                            width: `${(az / 360) * 100}%`,
                            boxShadow: '0 0 4px rgba(0,212,255,0.5)',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )
        ) : viewMode === 'asteroids' ? (
          filteredAsteroids.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted text-center px-4">
              <Flame className="w-8 h-8 mb-2 opacity-30 text-red animate-pulse" />
              <p className="text-sm font-crimson">No asteroids found</p>
              <p className="text-xs text-muted font-crimson mt-0.5">Adjust filter or wait for updates</p>
            </div>
          ) : (
            filteredAsteroids.map((ast) => {
              const isSelected = selectedAsteroid?.id === ast.id;
              
              // Miss distance bar width (max 20 million km)
              const distBarWidth = Math.min(100, (ast.miss_distance_km / 20000000) * 100);
              
              // Speed bar width (max 30 km/s)
              const speedBarWidth = Math.min(100, (ast.velocity_kms / 30) * 100);
              
              // Countdown time
              const isPassed = Date.now() > ast.close_approach_timestamp;
              const timeDiff = Math.abs(Date.now() - ast.close_approach_timestamp);
              const hours = Math.floor(timeDiff / 3600000);
              const mins = Math.floor((timeDiff % 3600000) / 60000);
              const timeStr = hours > 0 
                ? `${hours}h ${mins}m` 
                : `${mins}m`;

              return (
                <button
                  key={ast.id}
                  onClick={() => actions.selectAsteroid(isSelected ? null : ast)}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 transition-all duration-200 group
                    ${isSelected
                      ? 'bg-red/5 border-l-2 border-l-red'
                      : 'hover:bg-panel-light'
                    }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">☄️</span>
                      <div className="min-w-0">
                        <p className={`text-xs font-crimson font-bold truncate ${isSelected ? 'text-red' : 'text-text'}`}>
                          {ast.name}
                        </p>
                        <p className="text-muted text-[10px] font-crimson truncate">
                          Size: {ast.diameter_min.toFixed(0)} - {ast.diameter_max.toFixed(0)} m
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span className={`badge ${ast.is_potentially_hazardous ? 'badge-red' : 'badge-amber'}`} style={{ fontSize: 9 }}>
                        {ast.is_potentially_hazardous ? 'PHA' : 'NEA'}
                      </span>
                      <ChevronRight className={`w-3 h-3 transition-transform ${isSelected ? 'text-red rotate-90' : 'text-muted group-hover:translate-x-0.5'}`} />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-muted font-crimson text-[9px]">DISTANCE</span>
                        <span className="font-mono text-muted-light text-[9px]">
                          {ast.miss_distance_ld.toFixed(1)} LD
                        </span>
                      </div>
                      <div className="w-full h-0.5 bg-border rounded-full">
                        <div
                          className="h-full rounded-full bg-cyan"
                          style={{
                            width: `${distBarWidth}%`,
                            boxShadow: '0 0 4px rgba(0,212,255,0.5)',
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-muted font-crimson text-[9px]">{isPassed ? 'PASSED' : 'APPROACH'}</span>
                        <span className="font-mono text-muted-light text-[9px]">
                          {isPassed ? '-' : ''}{timeStr}
                        </span>
                      </div>
                      <div className="w-full h-0.5 bg-border rounded-full">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${speedBarWidth}%`,
                            background: ast.is_potentially_hazardous ? '#ef4444' : '#f59e0b',
                            boxShadow: `0 0 4px ${ast.is_potentially_hazardous ? '#ef4444' : '#f59e0b'}80`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )
        ) : (
          sortedSats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted">
              <Satellite className="w-8 h-8 mb-2 opacity-30 text-cyan" />
              <p className="text-sm font-crimson">No overhead objects found</p>
            </div>
          ) : (
            sortedSats.map((sat) => {
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
                        <p className={`text-xs font-crimson font-bold truncate ${isSelected ? 'text-cyan' : 'text-text'}`}>
                          {sat.satname}
                        </p>
                        <p className="text-muted text-[10px] font-mono">#{sat.satid}</p>
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
                        <span className="text-muted font-crimson text-[9px]">ALT</span>
                        <span className="font-mono text-muted-light text-[9px]">
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
                        <span className="text-muted font-crimson text-[9px]">SPD</span>
                        <span className="font-mono text-muted-light text-[9px]">
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
          )
        )}
      </div>

      {/* Footer: selected object info */}
      {viewMode === 'constellations' && selectedConstellation && (
        <div className="p-3 border-t border-border bg-amber/5">
          <p className="text-amber text-xs font-crimson font-bold text-center">
            🌌 Tracking: {selectedConstellation.name}
          </p>
        </div>
      )}
      {viewMode === 'asteroids' && selectedAsteroid && (
        <div className="p-3 border-t border-border bg-red/5">
          <p className="text-red text-xs font-crimson font-bold text-center">
            ☄️ Tracking: {selectedAsteroid.name}
          </p>
        </div>
      )}
      {viewMode === 'satellites' && selectedSatellite && (
        <div className="p-3 border-t border-border bg-cyan/5">
          <p className="text-cyan text-xs font-crimson font-bold text-center">
            📡 Tracking: {selectedSatellite.satname}
          </p>
        </div>
      )}
    </div>
  );
}
