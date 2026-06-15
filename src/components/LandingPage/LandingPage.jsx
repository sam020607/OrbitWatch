import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Satellite, ChevronDown } from 'lucide-react';
import StarfieldCanvas from './StarfieldCanvas.jsx';
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

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleLocationSelect(location) {
    actions.setLocation(location);
    actions.setLocationName(location.name);
    onLocationSet(location);
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
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <Satellite className="w-8 h-8 text-cyan" style={{ filter: 'drop-shadow(0 0 8px #00d4ff)' }} />
            <h1 className="text-5xl md:text-6xl font-bold font-mono text-white tracking-tight"
              style={{ textShadow: '0 0 30px rgba(0, 212, 255, 0.4)' }}>
              Orbit<span className="text-cyan">Watch</span>
            </h1>
            <Satellite className="w-8 h-8 text-cyan transform -scale-x-100" style={{ filter: 'drop-shadow(0 0 8px #00d4ff)' }} />
          </div>
          <p className="text-muted-light text-lg md:text-xl font-light tracking-wide max-w-lg mx-auto">
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

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="w-full max-w-xl mb-6"
        >
          <LocationSearch onLocationSelect={handleLocationSelect} />
        </motion.div>

        {/* Popular locations quick-select */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-wrap justify-center gap-2"
        >
          <span className="text-muted text-sm self-center">Quick:</span>
          {POPULAR_LOCATIONS.map(loc => (
            <button
              key={loc.name}
              onClick={() => handleLocationSelect({ ...loc, name: loc.name, country: '' })}
              className="px-3 py-1 rounded-full text-sm border border-border text-muted-light
                         hover:border-cyan/50 hover:text-cyan hover:bg-cyan/5 transition-all duration-200"
            >
              {loc.name}
            </button>
          ))}
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none"
        >
          <p className="text-muted text-xs font-mono tracking-widest uppercase">Select a location to begin</p>
          <ChevronDown className="w-5 h-5 text-muted animate-bounce" />
        </motion.div>
      </div>
    </div>
  );
}
