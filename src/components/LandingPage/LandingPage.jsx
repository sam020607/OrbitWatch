import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Satellite, MapPin, Globe } from 'lucide-react';
import StarfieldCanvas from './StarfieldCanvas.jsx';
import LocationSearch from './LocationSearch.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { reverseGeocode } from '../../api/geocodeApi.js';

// Custom Leaflet locator marker icon
const locatorIcon = L.divIcon({
  className: 'locator-marker-icon',
  html: `<div style="
    width: 16px; height: 16px;
    border-radius: 50%;
    border: 3px solid #00d4ff;
    background: rgba(0, 212, 255, 0.4);
    box-shadow: 0 0 12px #00d4ff, 0 0 24px rgba(0, 212, 255, 0.4);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Click locator map handler component
function GlobeClickLocator({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

const POPULAR_LOCATIONS = [
  { name: 'New York', lat: 40.7128, lon: -74.0060 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { name: 'São Paulo', lat: -23.5505, lon: -46.6333 },
];

const FEATURE_ITEMS = [
  { icon: '🛰️', label: 'Live ISS Tracking' },
  { icon: '🌙', label: 'Night Sky Report' },
  { icon: '⏱️', label: 'Pass Countdowns' },
  { icon: '🧭', label: 'Look-Up Directions' },
];

/**
 * Full-screen landing page with animated starfield, hero text, and location search.
 */
export default function LandingPage({ onLocationSet }) {
  const { actions } = useApp();
  const [mounted, setMounted] = useState(false);
  const [method, setMethod] = useState('search'); // 'search' | 'globe'
  const [clickedCoords, setClickedCoords] = useState(null); // { lat, lon }
  const [resolvingName, setResolvingName] = useState(false);
  const [resolvedName, setResolvedName] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleLocationSelect(location) {
    actions.setLocation(location);
    actions.setLocationName(location.name);
    onLocationSet(location);
  }

  async function handleGlobeClick(lat, lon) {
    setClickedCoords({ lat, lon });
    setResolvingName(true);
    try {
      const name = await reverseGeocode(lat, lon);
      setResolvedName(name);
    } catch (err) {
      setResolvedName(`${lat.toFixed(4)}°, ${lon.toFixed(4)}°`);
    } finally {
      setResolvingName(false);
    }
  }

  function confirmGlobeLocation() {
    if (!clickedCoords) return;
    handleLocationSelect({
      lat: clickedCoords.lat,
      lon: clickedCoords.lon,
      name: resolvedName || `${clickedCoords.lat.toFixed(2)}°, ${clickedCoords.lon.toFixed(2)}°`,
      country: ''
    });
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Starfield background */}
      <StarfieldCanvas />

      {/* Gradient overlays */}
      <div className="fixed inset-0 bg-gradient-radial from-navy/30 via-transparent to-transparent pointer-events-none" style={{ zIndex: 1 }} />
      <div className="fixed bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-space to-transparent pointer-events-none" style={{ zIndex: 1 }} />

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-12" style={{ zIndex: 2 }}>

        {/* Orbiting satellite graphic */}
        <AnimatePresence>
          {mounted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="relative mb-8"
            >
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Central planet */}
                <div className="w-16 h-16 rounded-full"
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, #1e3a5f, #0d1b2a)',
                    boxShadow: '0 0 30px rgba(0, 212, 255, 0.3), inset -4px -4px 10px rgba(0,0,0,0.5)',
                  }}
                />
                {/* Orbit ring */}
                <div className="absolute inset-0 rounded-full border border-cyan/20"
                  style={{ transform: 'rotateX(60deg)' }}
                />
                {/* Orbiting satellite dot */}
                <motion.div
                  className="absolute"
                  style={{ top: '50%', left: '50%', marginTop: -4, marginLeft: -4 }}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                >
                  <div style={{ transformOrigin: '4px 4px', transform: 'translateX(52px)' }}>
                    <div className="w-2 h-2 rounded-full bg-cyan"
                      style={{ boxShadow: '0 0 8px #00d4ff, 0 0 16px #00d4ff' }}
                    />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logo & Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-6"
        >
          <div className="flex flex-col items-center justify-center gap-1.5 mb-2">
            <span className="text-cyan text-xs font-playfair italic tracking-[0.25em] uppercase" style={{ filter: 'drop-shadow(0 0 4px rgba(0, 212, 255, 0.5))' }}>
              The Celestial Eye
            </span>
            <div className="flex items-center gap-3">
              <Satellite className="w-7 h-7 text-cyan" style={{ filter: 'drop-shadow(0 0 8px #00d4ff)' }} />
              <h1 className="text-4xl md:text-5xl font-bold font-playfair text-white tracking-tight"
                style={{ textShadow: '0 0 30px rgba(0, 212, 255, 0.4)' }}>
                Project <span className="text-cyan">Zenith</span>
              </h1>
              <Satellite className="w-7 h-7 text-cyan transform -scale-x-100" style={{ filter: 'drop-shadow(0 0 8px #00d4ff)' }} />
            </div>
          </div>
          <p className="text-muted-light text-base md:text-lg font-light tracking-wide max-w-lg mx-auto mt-2">
            Real-time satellite tracking & personal sky visibility — anywhere on Earth
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-3 mb-10"
        >
          {FEATURE_ITEMS.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-navy/60 backdrop-blur-sm text-sm text-muted-light"
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Popular locations quick-select */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="flex flex-wrap justify-center gap-2 mb-6"
        >
          <span className="text-muted text-xs self-center font-crimson font-semibold uppercase tracking-wider" style={{ fontSize: 10 }}>Quick:</span>
          {POPULAR_LOCATIONS.map(loc => (
            <button
              key={loc.name}
              onClick={() => handleLocationSelect({ ...loc, name: loc.name, country: '' })}
              className="px-3 py-0.5 rounded-full text-xs border border-border text-muted-light
                         hover:border-cyan/50 hover:text-cyan hover:bg-cyan/5 transition-all duration-200"
            >
              {loc.name}
            </button>
          ))}
        </motion.div>

        {/* Selection Method Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex bg-navy/60 border border-border/80 rounded-lg p-1 mb-6"
        >
          <button
            onClick={() => setMethod('search')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-crimson font-bold transition-all
              ${method === 'search' ? 'bg-cyan text-space font-bold' : 'text-muted-light hover:text-text'}`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Text Search</span>
          </button>
          <button
            onClick={() => setMethod('globe')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-crimson font-bold transition-all
              ${method === 'globe' ? 'bg-cyan text-space font-bold' : 'text-muted-light hover:text-text'}`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Interactive Globe</span>
          </button>
        </motion.div>

        {/* Content based on selection method */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="w-full max-w-xl flex flex-col items-center mb-6 min-h-[160px]"
        >
          {method === 'search' ? (
            <LocationSearch onLocationSelect={handleLocationSelect} />
          ) : (
            <div className="flex flex-col items-center gap-4 w-full">
              {/* Circular Globe container */}
              <div className="relative w-64 h-64 rounded-full overflow-hidden border-2 border-border/80 bg-space shadow-[0_0_20px_rgba(0,212,255,0.15)] z-[10]">
                {/* Globe clipping ring overlay */}
                <div className="absolute inset-0 rounded-full border border-cyan/25 pointer-events-none z-[1000]" />
                
                <MapContainer
                  center={[10, 0]}
                  zoom={1}
                  className="w-full h-full"
                  style={{ background: '#0a0a0f' }}
                  zoomControl={false}
                  attributionControl={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    maxZoom={10}
                    subdomains="abcd"
                  />
                  <GlobeClickLocator onClick={handleGlobeClick} />
                  {clickedCoords && (
                    <Marker position={[clickedCoords.lat, clickedCoords.lon]} icon={locatorIcon} />
                  )}
                </MapContainer>
              </div>

              {/* Coordinates status & confirm */}
              <div className="text-center h-14 flex flex-col justify-center items-center">
                {resolvingName ? (
                  <p className="text-xs font-crimson font-semibold text-cyan animate-pulse">Resolving location coordinates...</p>
                ) : clickedCoords ? (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-crimson text-text font-bold truncate max-w-[320px]">
                      📍 {resolvedName}
                    </p>
                    <button
                      onClick={confirmGlobeLocation}
                      className="px-4 py-1 rounded bg-cyan text-space text-xs font-crimson font-bold hover:opacity-95 transition-all shadow-[0_0_12px_rgba(0,212,255,0.4)]"
                    >
                      Confirm Observer Location
                    </button>
                  </div>
                ) : (
                  <p className="text-xs font-crimson text-muted max-w-[280px]">
                    Click anywhere on the globe above to select your coordinate location
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
