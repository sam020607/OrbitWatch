import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, MapPin, Globe } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { reverseGeocode } from '../../api/geocodeApi.js';
import LocationSearch from './LocationSearch.jsx';
import { useApp } from '../../context/AppContext.jsx';

const POPULAR_LOCATIONS = [
  { name: 'New York', lat: 40.7128, lon: -74.0060 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { name: 'São Paulo', lat: -23.5505, lon: -46.6333 },
];

// Custom Leaflet locator marker icon (cool blue to match cinematic theme)
const locatorIcon = L.divIcon({
  className: 'locator-marker-icon',
  html: `<div style="
    width: 16px; height: 16px;
    border-radius: 50%;
    border: 3px solid #3a7bd9;
    background: rgba(58, 123, 217, 0.4);
    box-shadow: 0 0 12px #3a7bd9, 0 0 24px rgba(58, 123, 217, 0.4);
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

// Globe animation and interaction controller
function GlobeController({ onInteraction, center }) {
  const map = useMap();

  useEffect(() => {
    const handleInteraction = () => {
      onInteraction();
    };

    map.on('dragstart', handleInteraction);
    map.on('zoomstart', handleInteraction);
    map.on('mousedown', handleInteraction);
    map.on('touchstart', handleInteraction);

    return () => {
      map.off('dragstart', handleInteraction);
      map.off('zoomstart', handleInteraction);
      map.off('mousedown', handleInteraction);
      map.off('touchstart', handleInteraction);
    };
  }, [map, onInteraction]);

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom(), { animate: true, duration: 0.1 });
    }
  }, [center, map]);

  return null;
}

/**
 * Cinematic landing page with a photorealistic Earth, interactive rotating globe,
 * compact 6-card feature grid, a scrollable statement, and technical explanation details.
 */
export default function LandingPage({ onLocationSet }) {
  const { state, actions } = useApp();
  const { theme } = state;
  const [mounted, setMounted] = useState(false);
  const [method, setMethod] = useState('search'); // 'search' | 'globe'
  const [clickedCoords, setClickedCoords] = useState(null); // { lat, lon }
  const [resolvingName, setResolvingName] = useState(false);
  const [resolvedName, setResolvedName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-rotation state
  const [globeCenter, setGlobeCenter] = useState([10, 0]);
  const [isRotating, setIsRotating] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Globe slow rotation interval
  useEffect(() => {
    if (method !== 'globe' || !isRotating) return;

    const interval = setInterval(() => {
      setGlobeCenter(prev => {
        const nextLng = prev[1] - 0.6; // Slowly rotate west-to-east
        const wrappedLng = nextLng < -180 ? nextLng + 360 : nextLng;
        return [prev[0], wrappedLng];
      });
    }, 80);

    return () => clearInterval(interval);
  }, [method, isRotating]);

  function handleLocationSelect(location) {
    actions.setLocation(location);
    actions.setLocationName(location.name);
    onLocationSet(location);
  }

  async function handleGlobeClick(lat, lon) {
    setIsRotating(false); // Stop rotation on manual click
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
    <div className="w-full min-h-screen bg-[#070a12] text-[#f5f7fa] overflow-y-auto overflow-x-hidden scroll-smooth">
      
      {/* Hero Section Container (Dynamic height with min-height 85vh to prevent large gaps) */}
      <div id="hero-section" className="relative w-full min-h-[85vh] pt-16 pb-24 flex flex-col justify-start items-center overflow-hidden border-b border-white/5 bg-[#070a12]">
        
        {/* Theme toggle in top-right */}
        <div className="absolute top-4 right-4 z-[100]">
          <button
            onClick={actions.toggleTheme}
            className="p-2 rounded-full border border-white/10 bg-[#0d1320]/80 text-slate-400 hover:text-[#f5f7fa] hover:border-white/20 transition-all shadow-md"
            title="Toggle space theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-slate-300" />}
          </button>
        </div>

        {/* Content Container (Tightened pb) */}
        <div className="relative w-full max-w-4xl flex-1 flex flex-col items-center justify-center px-4 pt-8 pb-16 z-10">
          
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-6 select-none"
          >
            <h1 
              className="text-5xl md:text-7xl font-playfair font-normal text-[#f5f7fa] tracking-tight leading-[1.15]"
              style={{
                textShadow: '0 0 80px rgba(127, 179, 224, 0.35), 0 0 40px rgba(127, 179, 224, 0.15)'
              }}
            >
              <div>Know what's</div>
              <div className="italic font-normal">overhead.</div>
            </h1>

            {/* Project Zenith title and Celestial Eye subtext */}
            <div className="flex flex-col items-center gap-1.5 mt-5 select-none animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-playfair tracking-wide text-white font-semibold"
                  style={{ textShadow: '0 0 20px rgba(255,255,255,0.15)' }}>
                Project Zenith
              </h2>
              <span className="text-xs font-sans tracking-[0.25em] uppercase text-slate-400 font-semibold">
                The Celestial Eye
              </span>
              <p className="text-slate-400 text-sm md:text-base font-light max-w-md mx-auto mt-1">
                Real-time satellite tracking & personal sky visibility — anywhere on Earth
              </p>
            </div>
          </motion.div>

          {/* Selection Method Tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="relative flex bg-[#0d1320]/50 border border-white/10 rounded-full p-1 mb-6 z-20"
          >
            <button
              onClick={() => setMethod('search')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-sans font-semibold transition-all
                ${method === 'search' ? '' : 'text-slate-400 hover:text-[#f5f7fa]'}`}
              style={method === 'search' ? { backgroundColor: '#f5f7fa', color: '#070a12' } : {}}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Text Search</span>
            </button>
            <button
              onClick={() => setMethod('globe')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-sans font-semibold transition-all
                ${method === 'globe' ? '' : 'text-slate-400 hover:text-[#f5f7fa]'}`}
              style={method === 'globe' ? { backgroundColor: '#f5f7fa', color: '#070a12' } : {}}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Interactive Globe</span>
            </button>
          </motion.div>

          {/* Content based on selection method */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="relative w-full max-w-xl flex flex-col items-center mb-4 min-h-[140px] z-30"
          >
            {method === 'search' ? (
              <div className="w-full flex flex-col items-center gap-4">
                <LocationSearch 
                  onLocationSelect={handleLocationSelect} 
                  variant="hero" 
                  onQueryChange={setSearchQuery}
                />
                
                {/* Popular locations quick-select */}
                {!searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative flex flex-wrap justify-center gap-2 mt-2 z-10"
                  >
                    <span className="text-slate-500 text-xs self-center font-sans tracking-wider" style={{ fontSize: 10 }}>QUICK:</span>
                    {POPULAR_LOCATIONS.map(loc => (
                      <button
                        key={loc.name}
                        onClick={() => handleLocationSelect({ ...loc, name: loc.name, country: '' })}
                        className="px-3 py-1 rounded-full text-xs border border-white/10 text-slate-300 bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all duration-200"
                      >
                        {loc.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 w-full">
                {/* Circular Globe container */}
                <div className="relative w-60 h-60 rounded-full overflow-hidden border border-white/10 bg-[#0d1320] shadow-[0_0_30px_rgba(58,123,217,0.25)] z-[10]">
                  {/* 3D Spherical Shading Overlay for globe effect */}
                  <div className="absolute inset-0 rounded-full pointer-events-none z-[400]"
                       style={{
                         background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.08) 0%, rgba(0, 0, 0, 0.35) 60%, rgba(0, 0, 0, 0.75) 100%)',
                         boxShadow: 'inset 0 0 25px rgba(0, 0, 0, 0.8)'
                       }}
                  />
                  
                  {/* Globe clipping ring outline */}
                  <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none z-[1000]" />
                  
                  <MapContainer
                    center={[10, globeCenter[1]]}
                    zoom={1}
                    className="w-full h-full"
                    style={{ background: 'rgba(7, 10, 18, 0.95)' }}
                    zoomControl={false}
                    attributionControl={false}
                  >
                    <TileLayer
                      key={theme}
                      url={theme === 'light'
                        ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      }
                      maxZoom={10}
                      subdomains="abcd"
                    />
                    <GlobeClickLocator onClick={handleGlobeClick} />
                    <GlobeController onInteraction={() => setIsRotating(false)} center={[10, globeCenter[1]]} />
                    {clickedCoords && (
                      <Marker position={[clickedCoords.lat, clickedCoords.lon]} icon={locatorIcon} />
                    )}
                  </MapContainer>
                </div>

                {/* Coordinates status & confirm */}
                <div className="text-center h-14 flex flex-col justify-center items-center">
                  {resolvingName ? (
                    <p className="text-xs font-sans font-semibold text-[#7fb3e0] animate-pulse">Resolving location coordinates...</p>
                  ) : clickedCoords ? (
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-sans text-[#f5f7fa] font-bold truncate max-w-[320px]">
                        📍 {resolvedName}
                      </p>
                      <button
                        onClick={confirmGlobeLocation}
                        className="px-4 py-1.5 rounded-full text-xs font-sans font-semibold bg-white/90 hover:bg-white text-[#070a12] transition-colors shadow-sm active:scale-95"
                      >
                        Confirm Observer Location
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-xs font-sans text-slate-400 max-w-[280px]">
                        Click anywhere on the rotating globe to select your coordinate location
                      </p>
                      {!isRotating && (
                        <button
                          onClick={() => setIsRotating(true)}
                          className="text-[10px] font-sans text-[#7fb3e0] hover:underline"
                        >
                          Resume Auto-Rotation 🔄
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Earth image: large, bottom-center, cropped to top ~40-50% bleeding off the bottom */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 200 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[160%] sm:w-[130%] md:w-[100%] lg:w-[85%] max-w-[1200px] pointer-events-none translate-y-[52%] aspect-square rounded-full overflow-hidden z-1 flex justify-center items-start"
          >
            <div className="relative w-full h-full rounded-full"
                 style={{
                   boxShadow: '0 -40px 100px rgba(58, 123, 217, 0.45), inset 0 20px 50px rgba(58, 123, 217, 0.15)'
                 }}
            >
              <img 
                src="/earth_view_from_space.png" 
                alt="Earth view from space" 
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        )}

        {/* Scroll cue indicator */}
        <motion.div 
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 cursor-pointer select-none"
          animate={{ 
            y: [0, 6, 0],
            opacity: [0.35, 0.8, 0.35]
          }}
          transition={{ 
            duration: 2.0,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          onClick={() => {
            const heroEl = document.getElementById('hero-section');
            if (heroEl) {
              const rect = heroEl.getBoundingClientRect();
              window.scrollTo({
                top: window.scrollY + rect.height,
                behavior: 'smooth'
              });
            }
          }}
        >
          <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-white/40 mb-0.5">explore the data</span>
          <svg 
            className="w-4 h-4 text-white/50" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </motion.div>
      </div>

      {/* 6-Card Feature Grid Section (Expanded real features list) */}
      <section className="relative w-full py-16 bg-[#070a12] border-b border-white/5 px-6 flex justify-center items-center z-10">
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Card 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="p-5 border border-white/10 rounded-[18px] backdrop-blur-[20px] hover:border-white/20 transition-colors"
              style={{ backgroundColor: 'rgba(20, 30, 50, 0.45)' }}
            >
              <h4 className="text-white font-bold text-sm font-sans mb-1">Live Tracking</h4>
              <p className="text-white/70 text-xs font-sans leading-relaxed">
                Track satellites, constellations (Starlink etc.), and near-Earth asteroids in real time.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-5 border border-white/10 rounded-[18px] backdrop-blur-[20px] hover:border-white/20 transition-colors"
              style={{ backgroundColor: 'rgba(20, 30, 50, 0.45)' }}
            >
              <h4 className="text-white font-bold text-sm font-sans mb-1">Real-Time Telemetry</h4>
              <p className="text-white/70 text-xs font-sans leading-relaxed">
                Access actual altitude, speed, and positioning details for every tracked object.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="p-5 border border-white/10 rounded-[18px] backdrop-blur-[20px] hover:border-white/20 transition-colors"
              style={{ backgroundColor: 'rgba(20, 30, 50, 0.45)' }}
            >
              <h4 className="text-white font-bold text-sm font-sans mb-1">Space Fact of the Moment</h4>
              <p className="text-white/70 text-xs font-sans leading-relaxed">
                Discover fascinating cosmic trivia with our rotating space facts database.
              </p>
            </motion.div>

            {/* Card 4 */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-5 border border-white/10 rounded-[18px] backdrop-blur-[20px] hover:border-white/20 transition-colors"
              style={{ backgroundColor: 'rgba(20, 30, 50, 0.45)' }}
            >
              <h4 className="text-white font-bold text-sm font-sans mb-1">NASA APOD Feature</h4>
              <p className="text-white/70 text-xs font-sans leading-relaxed">
                View the daily featured scientific image complete with official NASA explanations.
              </p>
            </motion.div>

            {/* Card 5 */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="p-5 border border-white/10 rounded-[18px] backdrop-blur-[20px] hover:border-white/20 transition-colors"
              style={{ backgroundColor: 'rgba(20, 30, 50, 0.45)' }}
            >
              <h4 className="text-white font-bold text-sm font-sans mb-1">What's Visible Tonight</h4>
              <p className="text-white/70 text-xs font-sans leading-relaxed">
                Check moon phases, upcoming satellite passes, and planet visibilities for your location.
              </p>
            </motion.div>

            {/* Card 6 */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-5 border border-white/10 rounded-[18px] backdrop-blur-[20px] hover:border-white/20 transition-colors"
              style={{ backgroundColor: 'rgba(20, 30, 50, 0.45)' }}
            >
              <h4 className="text-white font-bold text-sm font-sans mb-1">Observer Journal</h4>
              <p className="text-white/70 text-xs font-sans leading-relaxed">
                Log your real-world sky sightings, raise your observer rank, and unlock achievements.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* SECTION 1 — Statement (Padding Tightened to 64px) */}
      <section className="relative w-full py-16 bg-[#070a12] border-b border-white/5 px-6 flex justify-center items-center">
        <div className="w-full max-w-[900px] text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl lg:text-[52px] font-playfair font-normal text-[#f5f7fa] leading-[1.15] tracking-tight"
          >
            Real skies, read in <span className="italic font-normal">real time</span>, for anyone who's ever looked up and <span className="italic font-normal">wondered</span> what that was.
          </motion.h2>
        </div>
      </section>

      {/* SECTION 2 — "Precision x Wonder" (Padding Tightened to 64px, left col updated with precision real features) */}
      <section className="relative w-full py-16 bg-[#070a12] px-6 flex justify-center items-center">
        <div className="w-full max-w-4xl flex flex-col items-start">
          
          {/* Section Header with Duplicate/Offset Glitch look */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="relative mb-10 h-[45px] md:h-[55px] w-full"
          >
            {/* Back Copy (Offset in blue) */}
            <div 
              className="absolute top-[5px] left-[5px] text-3xl md:text-[40px] font-bold font-sans tracking-tight text-[#3a7bd9] opacity-40 select-none pointer-events-none"
            >
              Precision x Wonder
            </div>
            {/* Front Copy (Solid white) */}
            <div 
              className="absolute top-0 left-0 text-3xl md:text-[40px] font-bold font-sans tracking-tight text-white"
            >
              Precision x Wonder
            </div>
          </motion.div>

          {/* Two-Column Layout */}
          <div className="w-full flex flex-col lg:flex-row gap-10 lg:gap-12 items-start justify-between">
            
            {/* Left Column (Frosted Glass Cards, 40% Width) */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="w-full lg:w-[42%] flex flex-col gap-4"
            >
              {/* Card 1: Live Tracking */}
              <div 
                className="p-5 border border-white/10 rounded-[18px] backdrop-blur-[20px]"
                style={{ backgroundColor: 'rgba(20, 30, 50, 0.45)' }}
              >
                <h4 className="text-white font-bold text-sm font-sans mb-1.5">
                  Live Tracking
                </h4>
                <p className="text-white/70 text-xs font-sans leading-relaxed">
                  Track satellites, constellations (Starlink etc.), and near-Earth asteroids in real time.
                </p>
              </div>

              {/* Card 2: Real-time Telemetry */}
              <div 
                className="p-5 border border-white/10 rounded-[18px] backdrop-blur-[20px]"
                style={{ backgroundColor: 'rgba(20, 30, 50, 0.45)' }}
              >
                <h4 className="text-white font-bold text-sm font-sans mb-1.5">
                  Real-Time Telemetry
                </h4>
                <p className="text-white/70 text-xs font-sans leading-relaxed">
                  Access actual altitude, speed, and positioning details for every tracked object.
                </p>
              </div>

              {/* Card 3: What's Visible Tonight */}
              <div 
                className="p-5 border border-white/10 rounded-[18px] backdrop-blur-[20px]"
                style={{ backgroundColor: 'rgba(20, 30, 50, 0.45)' }}
              >
                <h4 className="text-white font-bold text-sm font-sans mb-1.5">
                  What's Visible Tonight
                </h4>
                <p className="text-white/70 text-xs font-sans leading-relaxed">
                  Check moon phases, upcoming satellite passes, and planet visibilities for your location.
                </p>
              </div>
            </motion.div>

            {/* Right Column (Wider, Body Paragraph, 60% Width) */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="w-full lg:w-[53%] mt-2"
            >
              <p className="text-[15px] md:text-[16px] text-white/70 leading-[1.65] font-sans">
                Every satellite tracked by Project Zenith uses real-time, high-precision orbital element data (TLEs) fetched directly from global ephemeris networks. Rather than rendering generalized path approximations, the platform runs active mathematical calculations to compute the exact position, altitude, and velocity of each spacecraft relative to your coordinates. What you witness on your screen is not just a mockup—it is the actual object's actual position in real time as it orbits the Earth.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
