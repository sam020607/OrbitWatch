import { useEffect, useRef, useCallback, Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Polygon, Circle, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../../context/AppContext.jsx';
import { generateOrbitalArc, calculateConeFootprint } from '../../utils/orbitMath.js';
import { SAT_TYPE_CONFIG } from '../../data/mockSatellites.js';

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
 */
export default function GlobeMap({ className = '' }) {
  const { state, actions } = useApp();
  const { location, issPosition, issTrail, satellites, selectedSatellite, showConeOverlay, satelliteFilter } = state;

  // Filter based on active selection
  const filteredSatellites = satellites.filter(sat => {
    if (satelliteFilter === 'all') return true;
    if (satelliteFilter === 'major') {
      return sat.type === 'space-station' || sat.type === 'weather' || sat.type === 'earth-obs' || sat.type === 'gps';
    }
    return sat.type === satelliteFilter;
  });

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
              <div className="font-mono text-sm">
                <p className="font-bold text-amber">{location.name}</p>
                <p className="text-muted text-xs mt-1">
                  {location.lat.toFixed(4)}°N, {location.lon.toFixed(4)}°E
                </p>
              </div>
            </Popup>
          </Marker>
        )}

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
              <div className="font-mono text-sm">
                <p className="font-bold text-cyan text-base">🛸 ISS</p>
                <p className="text-muted-light mt-1">
                  Lat: <span className="text-white">{issPosition.lat.toFixed(4)}°</span>
                </p>
                <p className="text-muted-light">
                  Lon: <span className="text-white">{issPosition.lon.toFixed(4)}°</span>
                </p>
                <p className="text-muted-light">
                  Alt: <span className="text-white">408 km</span>
                </p>
                <p className="text-muted-light">
                  Speed: <span className="text-white">7.66 km/s</span>
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* ISS orbital arc */}
        {issPosition && (
          <Polyline
            positions={generateOrbitalArc(issPosition.lat, issPosition.lon, 51.6)}
            color="#00d4ff"
            weight={1.5}
            opacity={0.4}
            dashArray="8, 4"
            className="orbital-path"
          />
        )}

        {/* Satellite markers + orbital arcs */}
        {filteredSatellites.map((sat) => {
          const isSelected = selectedSatellite?.satid === sat.satid;
          const satIcon = createSatIcon(sat.type, isSelected);
          const arcPositions = generateOrbitalArc(sat.satlat, sat.satlon, 51.6);
          const satCone = isSelected && showConeOverlay
            ? calculateConeFootprint(sat.satlat, sat.satlon, sat.satalt || 550)
            : null;

          return (
            <Fragment key={sat.satid}>
              {/* Orbital arc */}
              <Polyline
                positions={arcPositions}
                color={isSelected ? '#00d4ff' : (SAT_TYPE_CONFIG[sat.type]?.color || '#f59e0b')}
                weight={isSelected ? 1.5 : 1}
                opacity={isSelected ? 0.5 : 0.2}
                dashArray="6, 4"
              />

              {/* Visibility cone for selected */}
              {satCone && (
                <Polygon
                  positions={satCone}
                  pathOptions={{
                    color: 'rgba(245, 158, 11, 0.5)',
                    fillColor: 'rgba(245, 158, 11, 0.05)',
                    fillOpacity: 1,
                    weight: 1,
                    dashArray: '4, 4',
                  }}
                />
              )}

              {/* Satellite marker */}
              <Marker
                position={[sat.satlat, sat.satlon]}
                icon={satIcon}
                eventHandlers={{
                  click: () => actions.selectSatellite(isSelected ? null : sat),
                }}
              >
                <Popup>
                  <div className="font-mono text-sm min-w-[180px]">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{SAT_TYPE_CONFIG[sat.type] ? '' : '🛰️'}</span>
                      <p className="font-bold text-amber text-sm">{sat.satname}</p>
                    </div>
                    <p className="text-muted-light text-xs">
                      NORAD: <span className="text-white">{sat.satid}</span>
                    </p>
                    <p className="text-muted-light text-xs">
                      Alt: <span className="text-white">{sat.satalt?.toFixed(1)} km</span>
                    </p>
                    <p className="text-muted-light text-xs">
                      Speed: <span className="text-white">{sat.velocity?.toFixed(2)} km/s</span>
                    </p>
                    <p className="text-muted-light text-xs">
                      Type: <span className="text-white capitalize">{sat.type?.replace('-', ' ')}</span>
                    </p>
                    <button
                      onClick={() => actions.selectSatellite(isSelected ? null : sat)}
                      className="mt-2 w-full text-center text-xs text-cyan border border-cyan/30 rounded px-2 py-1 hover:bg-cyan/10"
                    >
                      {isSelected ? 'Deselect' : 'Track this satellite'}
                    </button>
                  </div>
                </Popup>
              </Marker>
            </Fragment>
          );
        })}
      </MapContainer>

      {/* Map overlay: ISS live badge */}
      {issPosition && (
        <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy/90 border border-cyan/30 backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-cyan animate-pulse" style={{ boxShadow: '0 0 6px #00d4ff' }} />
          <span className="text-cyan text-xs font-mono">ISS LIVE</span>
        </div>
      )}

      {/* Satellite count & Filter badge */}
      {satellites.length > 0 && (
        <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-navy/90 border border-border backdrop-blur-sm shadow-lg">
          <span className="text-amber text-xs font-mono shrink-0 hidden sm:inline">
            {filteredSatellites.length}/{satellites.length} OVERHEAD
          </span>
          <select
            value={satelliteFilter}
            onChange={(e) => actions.setSatelliteFilter(e.target.value)}
            className="text-xs font-mono bg-panel/90 border border-border/60 rounded px-1.5 py-0.5 text-text focus:outline-none focus:border-cyan cursor-pointer transition-colors"
          >
            <option value="major">✨ Major</option>
            <option value="space-station">🛸 Stations</option>
            <option value="tv">📺 TV Sats</option>
            <option value="gps">🧭 GPS</option>
            <option value="comms">📡 Comms</option>
            <option value="weather">🌦 Weather</option>
            <option value="debris">💫 Debris</option>
            <option value="all">🌐 All</option>
          </select>
        </div>
      )}
    </div>
  );
}
