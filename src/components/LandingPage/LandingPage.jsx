import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Globe, Music2, Facebook, Twitter, Youtube, Instagram, Github, Linkedin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { reverseGeocode } from '../../api/geocodeApi.js';
import { FadeUp } from '../ui/FadeUp.jsx';
import InkReveal from '../ui/ink-reveal.jsx';
import VaporizeTextCycle, { Tag } from '../ui/vapour-text-effect.tsx';
import LocationSearch from './LocationSearch.jsx';
import FeatureStickyStack from './FeatureStickyStack.jsx';
import { Skiper30 } from '../ui/skiper-30.tsx';
import StringTune, { StringProgress, StringMagnetic } from '@fiddle-digital/string-tune';
import { useApp } from '../../context/AppContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

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
export default function LandingPage({ onLocationSet, onNavigateAbout }) {
  const { state, actions } = useApp();
  const { user, setShowAuthModal } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [method, setMethod] = useState('search'); // 'search' | 'globe'
  const [clickedCoords, setClickedCoords] = useState(null); // { lat, lon }
  const [resolvingName, setResolvingName] = useState(false);
  const [resolvedName, setResolvedName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInkOverlay, setShowInkOverlay] = useState(true);
  const mainRef = useRef(null);

  // Initialize StringTune on client mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let stringTune;

    try {
      stringTune = StringTune.getInstance();
      if (mainRef.current) {
        stringTune.scrollContainer = mainRef.current;
      }
      stringTune.use(StringProgress);
      stringTune.use(StringMagnetic);
      stringTune.start(60);
    } catch (e) {
      console.warn("StringTune init failed:", e);
    }

    return () => {
      try {
        if (stringTune) {
          stringTune.destroy();
        }
      } catch (e) {}
    };
  }, []);

  // Always dark mode — single Earth image
  const earthImg = `${import.meta.env.BASE_URL}earth_view_from_space.png`;

  // Auto-rotation state
  const [globeCenter, setGlobeCenter] = useState([10, 0]);
  const [isRotating, setIsRotating] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    // The Ink Reveal timer has been moved to onViewportEnter of the card
    // so it only starts counting down when the user actually sees the card.
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
    <main ref={mainRef} className="relative w-full overflow-x-hidden flex flex-col items-center font-sans selection:bg-white/20 selection:text-white h-full overflow-y-auto scroll-smooth">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-[0]"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260429_114316_1c7889ad-2885-410e-b493-98119fee0ddb.mp4"
      />
      {/* Cinematic vignette overlay to fade background video edges and hide the right-side landscape leak */}
      <div 
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: 'linear-gradient(to right, var(--bg) 0%, transparent 15%, transparent 85%, var(--bg) 100%)'
        }}
      />
      {/* Bottom grass mask — fades the bottom 20% of the video to solid deep navy, hiding the grass strip */}
      <div 
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: 'linear-gradient(to top, #0a0d15 0%, #0a0d15 8%, rgba(10,13,21,0.85) 14%, rgba(10,13,21,0.5) 18%, transparent 25%)'
        }}
      />

      {/* Scroll Progress Bar */}
      <div 
        string="progress" 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 origin-left z-[9999]"
      />

      <div className="relative z-10 w-full flex flex-col items-center pb-16">
      
      {/* Floating Header */}
      <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-30 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="font-sans text-[10px] font-bold tracking-[0.3em] uppercase text-[var(--text-secondary)] select-none">
            ORBITWATCH // PROJ_ZENITH
          </span>
        </div>
        <div className="pointer-events-auto">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-wider hidden sm:inline-block">
                Operator: <span className="text-white font-bold">{user.displayName || user.email.split('@')[0]}</span>
              </span>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="avatar"
                  className="w-8 h-8 rounded-full border border-white/10"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-sans"
                  style={{
                    background: 'linear-gradient(135deg, #4d8dff 0%, #6b6fd6 100%)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {(user.displayName || user.email || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
              )}
            </div>
          ) : (
            <button
              id="landing-signin-btn"
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all font-sans text-xs font-semibold uppercase tracking-widest text-white focus:outline-none cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <div id="hero-section" className="relative w-full min-h-[85vh] pt-16 pb-16 flex flex-col justify-start items-center overflow-hidden border-b border-[var(--surface-border)] bg-[var(--bg)] transition-colors duration-300">
        
        {/* Content Container (Tightened pb) */}
        <div className="relative w-full max-w-4xl flex-1 flex flex-col items-center justify-center px-4 pt-6 pb-6 z-10">
          
          {/* Headline with Vaporize Effect */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-4 select-none w-full flex flex-col items-center justify-center"
          >
            <div className="relative w-full max-w-[800px] h-[130px] md:h-[160px] flex items-center justify-center">
              <VaporizeTextCycle
                texts={[
                  "Know what's\noverhead.", 
                  "Track active\norbits.", 
                  "Predict visible\npasses.", 
                  "Compare satellite\npaths."
                ]}
                font={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "56px",
                  fontWeight: 400
                }}
                color="rgb(255, 255, 255)"
                spread={4}
                density={6}
                animation={{
                  vaporizeDuration: 1.0,
                  fadeInDuration: 0.8,
                  waitDuration: 1.5
                }}
                direction="left-to-right"
                alignment="center"
                tag={Tag.H1}
              />
            </div>
            
            {/* Static Subtitle always present below the vaporize title */}
            <p className="text-white font-mono text-[10px] md:text-xs uppercase tracking-[0.25em] font-semibold mt-4 animate-fade-in flex items-center justify-center gap-2">
              <span className="text-cyan">Project Zenith</span>
              <span className="text-white/30">•</span>
              <span className="text-white/70 font-light">The Celestial Eye</span>
            </p>

            <p className="text-[var(--text-secondary)] text-xs md:text-sm font-light max-w-md mx-auto mt-2 animate-fade-in opacity-80">
              Real-time satellite tracking &amp; personal sky visibility — anywhere on Earth
            </p>
          </motion.div>

          {/* Selection Method Tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="relative flex bg-[var(--surface)] border border-[var(--surface-border)] rounded-full p-1 mb-4 z-20"
          >
            <button
              onClick={() => setMethod('search')}
              string="magnetic"
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-sans font-semibold transition-all`}
              style={method === 'search' ? { backgroundColor: 'var(--text-primary)', color: 'var(--bg)' } : { color: 'var(--text-secondary)' }}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Text Search</span>
            </button>
            <button
              onClick={() => setMethod('globe')}
              string="magnetic"
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-sans font-semibold transition-all`}
              style={method === 'globe' ? { backgroundColor: 'var(--text-primary)', color: 'var(--bg)' } : { color: 'var(--text-secondary)' }}
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
                  <div className="w-full flex flex-col items-center gap-6">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="relative flex flex-wrap justify-center gap-2 mt-2 z-10"
                    >
                      <span className="text-[var(--text-secondary)] text-xs self-center font-sans tracking-wider" style={{ fontSize: 10 }}>QUICK:</span>
                      {POPULAR_LOCATIONS.map(loc => (
                        <button
                          key={loc.name}
                          string="magnetic"
                          onClick={() => handleLocationSelect({ ...loc, name: loc.name, country: '' })}
                          className="px-3 py-1 rounded-full text-xs border border-[var(--surface-border)] text-[var(--text-primary)] bg-[var(--surface)] hover:bg-[var(--text-primary)] hover:text-[var(--bg)] hover:border-[var(--text-primary)] transition-all duration-200 shadow-sm"
                        >
                          {loc.name}
                        </button>
                      ))}
                    </motion.div>

                    {/* Scroll cue indicator right after the quick tab */}
                    <motion.div 
                      className="flex flex-col items-center gap-1 cursor-pointer select-none z-20"
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
                      <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-[var(--text-secondary)] opacity-60 mb-0.5">explore the data</span>
                      <svg 
                        className="w-4 h-4 text-[var(--text-secondary)] opacity-75" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </motion.div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 w-full">
                {/* Circular Globe container */}
                <div className="relative w-60 h-60 rounded-full overflow-hidden border border-[var(--surface-border)] shadow-[0_0_30px_var(--accent-glow)] z-[10] transition-all duration-300" style={{ background: 'var(--bg)' }}>
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
                    style={{ background: 'var(--color-space)' }}
                    zoomControl={false}
                    attributionControl={false}
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
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
                    <p className="text-xs font-sans font-semibold text-[var(--accent)] animate-pulse">Resolving location coordinates...</p>
                  ) : clickedCoords ? (
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-sans text-[var(--text-primary)] font-bold truncate max-w-[320px]">
                        📍 {resolvedName}
                      </p>
                      <button
                        onClick={confirmGlobeLocation}
                        className="px-4 py-1.5 rounded-full text-xs font-sans font-semibold bg-[var(--text-primary)] hover:opacity-90 text-[var(--bg)] transition-all shadow-sm active:scale-95"
                      >
                        Confirm Observer Location
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-xs font-sans text-[var(--text-secondary)] max-w-[280px]">
                        Click anywhere on the rotating globe to select your coordinate location
                      </p>
                      {!isRotating && (
                        <button
                          onClick={() => setIsRotating(true)}
                          className="text-[10px] font-sans text-[var(--accent)] hover:underline"
                        >
                          Resume Auto-Rotation 🔄
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Scroll cue indicator right after globe controls */}
                <motion.div 
                  className="flex flex-col items-center gap-1 cursor-pointer select-none z-20 mt-2"
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
                  <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-[var(--text-secondary)] opacity-60 mb-0.5">explore the data</span>
                  <svg 
                    className="w-4 h-4 text-[var(--text-secondary)] opacity-75" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Earth image: large, bottom-center, day-side in light theme, night-side in dark theme */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 200 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[160%] sm:w-[130%] md:w-[100%] lg:w-[85%] max-w-[1200px] pointer-events-none aspect-square rounded-full overflow-hidden z-1 flex justify-center items-start"
          >
            <div className="relative w-full h-full rounded-full"
                 style={{
                   boxShadow: '0 -40px 100px var(--accent-glow), inset 0 20px 50px var(--accent-glow)'
                 }}
            >
              <img 
                src={earthImg} 
                alt="Earth view from space" 
                className="w-full h-full object-cover transition-all duration-500"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* 6-Card Feature Grid replaced with a smooth sticky card stack */}
      <section className="relative w-full bg-[var(--bg)] border-b border-[var(--surface-border)] z-10 transition-colors duration-300">
        <FeatureStickyStack />
      </section>

      {/* Parallax Space Gallery */}
      <Skiper30 scrollContainer={mainRef} />

      {/* SECTION 1 — Statement */}
      <section className="relative w-full py-16 bg-[var(--bg)] border-b border-[var(--surface-border)] px-6 flex justify-center items-center transition-colors duration-300">
        <div className="w-full max-w-[900px] text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl lg:text-[52px] font-playfair font-normal text-[var(--text-primary)] leading-[1.15] tracking-tight"
          >
            Real skies, read in <span className="italic font-normal">real time</span>, for anyone who's ever looked up and <span className="italic font-normal">wondered</span> what that was.
          </motion.h2>
        </div>
      </section>

      {/* SECTION 2 — "Precision x Wonder" */}
      <section className="relative w-full py-16 bg-[var(--bg)] px-6 flex justify-center items-center transition-colors duration-300">
        <div className="w-full max-w-4xl flex flex-col items-start">
          
          {/* Section Header with Duplicate/Offset Glitch look */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="relative mb-10 h-[45px] md:h-[55px] w-full"
          >
            {/* Back Copy (Offset in accent blue) */}
            <div 
              className="absolute top-[5px] left-[5px] text-3xl md:text-[40px] font-bold font-sans tracking-tight text-[var(--accent)] opacity-40 select-none pointer-events-none"
            >
              Precision x Wonder
            </div>
            {/* Front Copy (Solid text-primary) */}
            <div 
              className="absolute top-0 left-0 text-3xl md:text-[40px] font-bold font-sans tracking-tight text-[var(--text-primary)]"
            >
              Precision x Wonder
            </div>
          </motion.div>

          {/* Two-Column Layout */}
          <div className="w-full flex flex-col lg:flex-row gap-10 lg:gap-12 items-start justify-between">
            
            {/* Left Column (Animated Video Card, 42% Width) */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              onViewportEnter={() => {
                setTimeout(() => {
                  setShowInkOverlay(false);
                }, 10000);
              }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="w-full lg:w-[42%] relative rounded-[24px] overflow-hidden flex flex-col justify-end p-8 border border-[var(--surface-border)] min-h-[420px] md:min-h-[500px] shadow-lg group transition-all duration-500 hover:shadow-[0_0_60px_rgba(77,141,255,0.2)]"
              style={{ backgroundColor: 'var(--surface)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
            >
              {/* Inner Video */}
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-105 transition-transform duration-1000"
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260514_135830_bb6491d1-9b66-4aec-9722-13b4dfe3fb46.mp4"
              />
              
              {/* Ink Reveal Mask Overlay */}
              <AnimatePresence>
                {showInkOverlay && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 z-[1]"
                  >
                    <InkReveal maskColor={[10, 13, 21]} brushSize={100} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Darkening Gradient Overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d15] via-[#0a0d15]/60 to-[#0a0d15]/10 z-0 pointer-events-none"></div>

              <div className="relative z-10 flex flex-col items-start w-full pointer-events-none">
                <h2 className="flex flex-wrap gap-[0.2em] m-0 text-[26px] md:text-[32px] font-bold leading-[1.05] tracking-[-0.01em] uppercase text-white" style={{ fontFamily: "'Helvetica Now Var', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                  {['WE', 'TRACK', 'WITH', 'PRECISION', 'AND', 'WONDER.'].map((word, i) => (
                    <FadeUp key={i} as="span" delay={0.15 + (i * 0.08)} y={20} once={true}>
                      {word}
                    </FadeUp>
                  ))}
                </h2>
                <FadeUp delay={0.9} y={15} once={true} className="mt-4 text-[14px] leading-[1.6] text-white/80" style={{ fontFamily: "'Helvetica Now Var', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                  OrbitWatch provides real-time satellite tracking and celestial visibility all in one place.
                </FadeUp>
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
              <p className="text-[15px] md:text-[16px] text-[var(--text-secondary)] leading-[1.65] font-sans">
                Every satellite tracked by Project Zenith uses real-time, high-precision orbital element data (TLEs) fetched directly from global ephemeris networks. Rather than rendering generalized path approximations, the platform runs active mathematical calculations to compute the exact position, altitude, and velocity of each spacecraft relative to your coordinates. What you witness on your screen is not just a mockup—it is the actual object's actual position in real time as it orbits the Earth.
              </p>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Liquid Glass Footer Section */}
      <div className="w-full flex flex-col items-center pt-24 md:pt-48 pb-16 z-10"
           style={{
             background: 'linear-gradient(to bottom, var(--bg) 0%, rgba(10, 13, 21, 0.35) 60%, var(--bg) 100%)'
           }}
      >
        <div className="w-full max-w-4xl px-6">
          <motion.footer
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            className="liquid-glass w-full rounded-3xl p-6 md:p-10 text-white/70 mb-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 mb-10">
              <div className="md:col-span-5">
                <div className="flex items-center gap-3 mb-4 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256" fill="currentColor"><path d="M 4.688 136 C 68.373 136 120 187.627 120 251.312 C 120 252.883 119.967 254.445 119.905 256 L 0 256 L 0 136.096 C 1.555 136.034 3.117 136 4.688 136 Z M 251.312 136 C 252.883 136 254.445 136.034 256 136.096 L 256 256 L 136.095 256 C 136.032 254.438 136.001 252.875 136 251.312 C 136 187.627 187.627 136 251.312 136 Z M 119.905 0 C 119.967 1.555 120 3.117 120 4.688 C 120 68.373 68.373 120 4.687 120 C 3.117 120 1.555 119.967 0 119.905 L 0 0 Z M 256 119.905 C 254.445 119.967 252.883 120 251.312 120 C 187.627 120 136 68.373 136 4.687 C 136 3.117 136.033 1.555 136.095 0 L 256 0 Z" /></svg>
                  <span className="text-xl font-medium tracking-wide">TEAM PHOENIX</span>
                </div>
                <p className="text-sm leading-relaxed max-w-sm">
                  Project Zenith: The Celestial Eye. Real-time satellite tracking & personal sky visibility — anywhere on Earth. Brought to you by Team Phoenix.
                </p>
              </div>

              <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* About */}
                <div>
                  <h3 className="text-sm uppercase tracking-wider text-white font-medium mb-4">Navigate</h3>
                  <div className="flex flex-col text-xs space-y-2">
                    <button onClick={onNavigateAbout} className="hover:text-white transition-colors text-left font-sans cursor-pointer bg-transparent border-none p-0 text-white/70">About Us</button>
                  </div>
                </div>
                {/* Team */}
                <div>
                  <h3 className="text-sm uppercase tracking-wider text-white font-medium mb-4">Team Phoenix</h3>
                  <div className="flex flex-col text-xs space-y-4">
                    {/* Member 1 */}
                    <div className="flex flex-col gap-1">
                      <span className="text-white/90 font-medium">Agarim Karnwal</span>
                      <div className="flex items-center gap-3">
                        <a href="https://github.com/Agarimkarnwal" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                          <Github size={12} /> GitHub
                        </a>
                        <a href="https://www.linkedin.com/in/agarim-karnwal-717b04375/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                          <Linkedin size={12} /> LinkedIn
                        </a>
                      </div>
                    </div>
                    {/* Member 2 */}
                    <div className="flex flex-col gap-1">
                      <span className="text-white/90 font-medium">Samriddhi Upadhyay</span>
                      <div className="flex items-center gap-3">
                        <a href="https://github.com/sam020607" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                          <Github size={12} /> GitHub
                        </a>
                        <a href="https://www.linkedin.com/in/samriddhiupadhyay/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                          <Linkedin size={12} /> LinkedIn
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-center">
              <p className="text-[10px] uppercase tracking-widest opacity-40">© {new Date().getFullYear()} Team Phoenix · Project Zenith</p>
            </div>
          </motion.footer>
        </div>
      </div>
    </div>
  </main>
);
}
