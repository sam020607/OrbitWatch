import { useEffect, useRef, useCallback, Fragment, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Polygon, Circle, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../../context/AppContext.jsx';
import { generateOrbitalArc, calculateConeFootprint, azimuthToCompass } from '../../utils/orbitMath.js';
import { SAT_TYPE_CONFIG } from '../../data/mockSatellites.js';
import { CONSTELLATIONS, getSubStellarPoint, getLocalCoordinates, getConstellationShape } from '../../data/constellations.js';

// Fix Leaflet default icon path issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ISS custom icon
function createISSIcon() {
  return L.divIcon({
    className: 'iss-marker-icon',
    html: '<div class="iss-dot"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  });
}

// Satellite custom icon
function createSatIcon(type, selected = false) {
  const color = SAT_TYPE_CONFIG[type]?.color || '#f59e0b';
  const size = selected ? 12 : 8;
  return L.divIcon({
    className: 'sat-marker-icon',
    html: `<div class="sat-dot${selected ? ' selected' : ''}" style="width:${size}px;height:${size}px;background:${selected ? '#00d4ff' : color};box-shadow:0 0 ${selected ? 12 : 6}px ${selected ? 'rgba(0,212,255,1)' : color}80;border-radius:50%;"></div>`,
    iconSize: [size + 4, size + 4],
    iconAnchor: [(size + 4) / 2, (size + 4) / 2],
    popupAnchor: [0, -8],
  });
}

// Observer location icon
function createObserverIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 14px; height: 14px;
      border-radius: 50%;
      border: 2px solid #f59e0b;
      background: rgba(245,158,11,0.3);
      box-shadow: 0 0 10px rgba(245,158,11,0.8), 0 0 20px rgba(245,158,11,0.4);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

/** Map auto-panner to observer location */
function MapController({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.setView([location.lat, location.lon], 4, { animate: true, duration: 1.5 });
    }
  }, [location, map]);
  return null;
}

/**
 * GlobeMap — Leaflet map component.
 * Shows: ISS moving dot + trail, satellite markers, orbital arcs, cone of visibility, observer location.
 * Now supports Constellations view mode showing visible constellations at their sub-stellar coordinates.
 */
export default function GlobeMap({ className = '' }) {
  const { state, actions } = useApp();
  const { 
    location, 
    issPosition, 
    issTrail, 
    satellites, 
    selectedSatellite, 
    showConeOverlay, 
    satelliteFilter,
    viewMode,
    selectedConstellation
  } = state;

  // Filter based on active selection
  const filteredSatellites = satellites.filter(sat => {
    if (satelliteFilter === 'all') return true;
    if (satelliteFilter === 'major') {
      return sat.type === 'space-station' || sat.type === 'weather' || sat.type === 'earth-obs' || sat.type === 'gps';
    }
    return sat.type === satelliteFilter;
  });

  // Calculate visible constellations and their sub-stellar map coordinates
  const visibleConstellations = useMemo(() => {
    if (!location) return [];
    const now = Date.now();
    return CONSTELLATIONS.map(c => {
      const subStellar = getSubStellarPoint(c.ra, c.dec, now);
      const coords = getLocalCoordinates(c.ra, c.dec, location.lat, location.lon, now);
      return { ...c, subStellar, coords };
    })
    .filter(c => c.coords.el > 0);
  }, [location]);

  const issIcon = useRef(createISSIcon()).current;
  const observerIcon = useRef(createObserverIcon()).current;

  // Build ISS trail positions
  const trailPositions = issTrail.map(p => [p.lat, p.lon]);

  // ISS cone footprint
  const issCone = issPosition && showConeOverlay
    ? calculateConeFootprint(issPosition.lat, issPosition.lon, 408)
    : null;

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={location ? [location.lat, location.lon] : [20, 0]}
        zoom={location ? 4 : 2}
        className="w-full h-full"
        style={{ background: '#0a0a0f' }}
        zoomControl={true}
        attributionControl={true}
      >
        {/* Dark space tile layer */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={19}
          subdomains="abcd"
        />

        <MapController location={location} />

        {/* Observer location marker */}
        {location && (
          <Marker position={[location.lat, location.lon]} icon={observerIcon}>
            <Popup>
              <div className="font-crimson text-sm">
                <p className="font-bold text-amber">{location.name}</p>
                <p className="text-muted text-xs mt-1">
                  <span className="font-mono">{location.lat.toFixed(4)}°N</span>, <span className="font-mono">{location.lon.toFixed(4)}°E</span>
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Satellite Tracking View Mode Overlays */}
        {viewMode === 'satellites' && (
          <>
            {/* ISS trail */}
            {trailPositions.length > 1 && (
              <Polyline
                positions={trailPositions}
                color="#00d4ff"
                weight={2}
                opacity={0.4}
                dashArray="4, 6"
              />
            )}

            {/* ISS cone of visibility */}
            {issCone && (
              <Polygon
                positions={issCone}
                pathOptions={{
                  color: 'rgba(0, 212, 255, 0.5)',
                  fillColor: 'rgba(0, 212, 255, 0.06)',
                  fillOpacity: 1,
                  weight: 1.5,
                  dashArray: '6, 4',
                  className: 'cone-overlay',
                }}
              />
            )}

            {/* ISS marker */}
            {issPosition && (
              <Marker
                position={[issPosition.lat, issPosition.lon]}
                icon={issIcon}
                zIndexOffset={1000}
              >
                <Popup>
                  <div className="font-crimson text-sm">
                    <p className="font-bold text-cyan text-base">🛸 ISS</p>
                    <p className="text-muted-light mt-1">
                      Lat: <span className="font-mono text-white">{issPosition.lat.toFixed(4)}°</span>
                    </p>
                    <p className="text-muted-light">
                      Lon: <span className="font-mono text-white">{issPosition.lon.toFixed(4)}°</span>
                    </p>
                    <p className="text-muted-light">
                      Alt: <span className="font-mono text-white">408 km</span>
                    </p>
                    <p className="text-muted-light">
                      Speed: <span className="font-mono text-white">7.66 km/s</span>
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Selected Satellite orbit & cone footprint */}
            {selectedSatellite && (
              <>
                {/* Orbital arc */}
                <Polyline
                  positions={generateOrbitalArc(selectedSatellite.satlat, selectedSatellite.satlon)}
                  className="orbital-path"
                />
                
                {/* Cone overlay */}
                {showConeOverlay && (
                  <Polygon
                    positions={calculateConeFootprint(selectedSatellite.satlat, selectedSatellite.satlon, selectedSatellite.satalt)}
                    pathOptions={{
                      color: SAT_TYPE_CONFIG[selectedSatellite.type]?.color || '#f59e0b',
                      fillColor: 'rgba(245, 158, 11, 0.05)',
                      fillOpacity: 1,
                      weight: 1,
                      dashArray: '4, 4',
                    }}
                  />
                )}
              </>
            )}

            {/* Satellite markers */}
            {filteredSatellites.map((sat) => {
              const isSelected = selectedSatellite?.satid === sat.satid;
              const satIcon = createSatIcon(sat.type, isSelected);

              return (
                <Marker
                  key={sat.satid}
                  position={[sat.satlat, sat.satlon]}
                  icon={satIcon}
                  eventHandlers={{
                    click: () => actions.selectSatellite(isSelected ? null : sat),
                  }}
                >
                  <Popup>
                    <div className="font-crimson text-sm min-w-[180px]">
                      <div className="flex items-center gap-2 mb-2">
                        <span>{SAT_TYPE_CONFIG[sat.type] ? '' : '🛰️'}</span>
                        <p className="font-bold text-amber text-sm">{sat.satname}</p>
                      </div>
                      <p className="text-muted-light text-xs">
                        NORAD: <span className="font-mono text-white">{sat.satid}</span>
                      </p>
                      <p className="text-muted-light text-xs">
                        Alt: <span className="font-mono text-white">{sat.satalt?.toFixed(1)} km</span>
                      </p>
                      <p className="text-muted-light text-xs">
                        Speed: <span className="font-mono text-white">{sat.velocity?.toFixed(2)} km/s</span>
                      </p>
                      <p className="text-muted-light text-xs">
                        Type: <span className="capitalize">{sat.type?.replace('-', ' ')}</span>
                      </p>
                      <button
                        onClick={() => actions.selectSatellite(isSelected ? null : sat)}
                        className="mt-2 w-full text-center text-xs text-cyan border border-cyan/30 rounded px-2 py-1 hover:bg-cyan/10 transition-colors"
                      >
                        {isSelected ? 'Deselect' : 'Track this satellite'}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </>
        )}

        {/* Constellations Tracking View Mode Overlays */}
        {viewMode === 'constellations' && visibleConstellations.map((constell) => {
          const isSelected = selectedConstellation?.id === constell.id;
          
          // Calculate the full shape (stars and lines) for this constellation dynamically
          const shape = getConstellationShape(constell, Date.now());

          // Subtle center anchor icon (a tiny glowing dot instead of a star emoji/marker)
          const centerIcon = L.divIcon({
            className: 'constell-center-icon',
            html: `<div style="
              width: 8px; height: 8px;
              border-radius: 50%;
              background: ${isSelected ? '#f59e0b' : '#00d4ff'};
              box-shadow: 0 0 6px ${isSelected ? '#f59e0b' : '#00d4ff'};
              opacity: 0.8;
            "></div>`,
            iconSize: [8, 8],
            iconAnchor: [4, 4],
            popupAnchor: [0, -6],
          });

          const constellCone = isSelected && showConeOverlay
            ? calculateConeFootprint(constell.subStellar.lat, constell.subStellar.lon, 4000, 10)
            : null;

          return (
            <Fragment key={constell.id}>
              {/* Constellation visibility cone */}
              {constellCone && (
                <Polygon
                  positions={constellCone}
                  pathOptions={{
                    color: 'rgba(245, 158, 11, 0.4)',
                    fillColor: 'rgba(245, 158, 11, 0.05)',
                    fillOpacity: 1,
                    weight: 1.5,
                    dashArray: '6, 4',
                    className: 'cone-overlay',
                  }}
                />
              )}

              {/* Line linking observer to sub-stellar point */}
              {isSelected && location && (
                <Polyline
                  positions={[
                    [location.lat, location.lon],
                    [constell.subStellar.lat, constell.subStellar.lon],
                  ]}
                  pathOptions={{
                    color: '#f59e0b',
                    weight: 1.5,
                    dashArray: '4, 4',
                  }}
                />
              )}

              {/* Outlines of actual constellation shape */}
              {shape.connections.map(([idx1, idx2], lineIdx) => {
                const star1 = shape.stars[idx1];
                const star2 = shape.stars[idx2];
                if (!star1 || !star2) return null;
                return (
                  <Polyline
                    key={`constell-line-${constell.id}-${lineIdx}`}
                    positions={[
                      [star1.lat, star1.lon],
                      [star2.lat, star2.lon],
                    ]}
                    pathOptions={{
                      color: isSelected ? '#f59e0b' : '#00d4ff',
                      weight: isSelected ? 2.0 : 1.0,
                      opacity: isSelected ? 0.95 : 0.35,
                      dashArray: isSelected ? 'none' : '2, 3',
                    }}
                  />
                );
              })}

              {/* Individual star nodes of actual constellation shape */}
              {shape.stars.map((star, starIdx) => (
                <Circle
                  key={`constell-star-${constell.id}-${starIdx}`}
                  center={[star.lat, star.lon]}
                  radius={isSelected ? 14000 : 8000}
                  pathOptions={{
                    color: isSelected ? '#ffffff' : '#a5f3fc',
                    fillColor: '#ffffff',
                    fillOpacity: 0.9,
                    weight: 1,
                  }}
                >
                  <Popup>
                    <div className="font-crimson text-xs min-w-[120px]">
                      <p className="font-bold text-cyan text-sm">{star.name}</p>
                      <p className="text-muted text-[10px] mt-0.5">
                        RA: <span className="font-mono">{star.ra.toFixed(2)}h</span> · Dec: <span className="font-mono">{star.dec.toFixed(2)}°</span>
                      </p>
                    </div>
                  </Popup>
                </Circle>
              ))}

              {/* Clickable central anchor marker */}
              <Marker
                position={[constell.subStellar.lat, constell.subStellar.lon]}
                icon={centerIcon}
                eventHandlers={{
                  click: () => actions.selectConstellation(isSelected ? null : constell),
                }}
              >
                <Popup>
                  <div className="font-crimson text-sm min-w-[180px]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span>🌌</span>
                      <p className="font-bold text-amber text-sm">{constell.name}</p>
                    </div>
                    <p className="text-muted text-xs mb-1">
                      {constell.abbr} · {constell.description}
                    </p>
                    <p className="text-muted-light text-xs mt-1">
                      Azimuth: <span className="font-mono text-white">{constell.coords.az.toFixed(0)}° {azimuthToCompass(constell.coords.az)}</span>
                    </p>
                    <p className="text-muted-light text-xs">
                      Elevation: <span className="font-mono text-white">{constell.coords.el.toFixed(0)}°</span>
                    </p>
                    
                    {/* NASA Science Hub Link */}
                    <a
                      href="https://science.nasa.gov/universe/constellations/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2.5 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-navy/60 border border-border text-xs text-text rounded-lg hover:border-amber/50 hover:text-amber transition-colors text-center w-full"
                    >
                      🚀 Explore NASA Constellations
                    </a>

                    <button
                      onClick={() => actions.selectConstellation(isSelected ? null : constell)}
                      className="mt-2 w-full text-center text-xs text-amber border border-amber/30 rounded px-2 py-1 hover:bg-amber/10 transition-colors"
                    >
                      {isSelected ? 'Deselect' : 'Track this constellation'}
                    </button>
                  </div>
                </Popup>
              </Marker>
            </Fragment>
          );
        })}
      </MapContainer>

      {/* Map overlay: ISS live badge */}
      {viewMode === 'satellites' && issPosition && (
        <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy/90 border border-cyan/30 backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-cyan animate-pulse" style={{ boxShadow: '0 0 6px #00d4ff' }} />
          <span className="text-cyan text-xs font-crimson font-semibold">ISS LIVE</span>
        </div>
      )}

      {/* Satellite / Constellation count & Filter badge */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-navy/90 border border-border backdrop-blur-sm shadow-lg">
        {viewMode === 'constellations' ? (
          <span className="text-amber text-xs font-crimson font-semibold shrink-0">
            <span className="font-mono">{visibleConstellations.length}</span> CONSTELLATIONS VISIBLE
          </span>
        ) : (
          <>
            <span className="text-amber text-xs font-crimson font-semibold shrink-0 hidden sm:inline">
              <span className="font-mono">{filteredSatellites.length}/{satellites.length}</span> OVERHEAD
            </span>
            <select
              value={satelliteFilter}
              onChange={(e) => actions.setSatelliteFilter(e.target.value)}
              className="text-xs font-crimson bg-panel/90 border border-border/60 rounded px-1.5 py-0.5 text-text focus:outline-none focus:border-cyan cursor-pointer transition-colors"
            >
              <option value="major">✨ Major</option>
              <option value="space-station">🛸 Stations</option>
              <option value="tv">📺 TV Sats</option>
              <option value="gps">🧭 GPS</option>
              <option value="comms">📡 Comms</option>
              <option value="weather">🌦 Weather</option>
              <option value="debris">💫 Debris</option>
              <option value="all">All</option>
            </select>
          </>
        )}
      </div>
    </div>
  );
}
