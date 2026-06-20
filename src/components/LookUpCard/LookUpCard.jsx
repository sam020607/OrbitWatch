import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext.jsx';
import { azimuthToCompass } from '../../utils/orbitMath.js';
import { getLocalCoordinates } from '../../data/constellations.js';
import { Compass, Target, X, RefreshCw, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { fetchAstronomyPictureOfTheDay } from '../../api/nasaApodApi.js';
import { MOCK_SATELLITES } from '../../data/mockSatellites.js';
import satelliteDescriptions from '../../data/satelliteDescriptions.json';
import spaceFacts from '../../data/spaceFacts.json';

/**
 * LookUpCard — Compass rose + elevation arc for a selected satellite or constellation.
 * Shows exact azimuth heading and elevation to look at in the sky.
 */
export default function LookUpCard() {
  const { state, actions } = useApp();
  const { selectedSatellite, selectedConstellation, selectedAsteroid, viewMode, issNextPasses, location, observedLog = [], apodData } = state;
  const [now] = [Math.floor(Date.now() / 1000)];

  // Determine what to show
  let displayData = null;
  let title = '';

  if (viewMode === 'asteroids' && selectedAsteroid) {
    const coords = location 
      ? getLocalCoordinates(selectedAsteroid.ra, selectedAsteroid.dec, location.lat, location.lon)
      : { az: 0, el: 0 };
    displayData = {
      az: coords.az,
      el: coords.el,
      name: selectedAsteroid.name,
      id: selectedAsteroid.id,
      diameter_min: selectedAsteroid.diameter_min,
      diameter_max: selectedAsteroid.diameter_max,
      velocity_kms: selectedAsteroid.velocity_kms,
      miss_distance_ld: selectedAsteroid.miss_distance_ld,
      miss_distance_km: selectedAsteroid.miss_distance_km,
      is_potentially_hazardous: selectedAsteroid.is_potentially_hazardous,
      nasa_jpl_url: selectedAsteroid.nasa_jpl_url,
      ra: selectedAsteroid.ra,
      dec: selectedAsteroid.dec,
      type: 'asteroid'
    };
    title = 'Asteroid Direction';
  } else if (viewMode === 'constellations' && selectedConstellation) {
    const coords = location 
      ? getLocalCoordinates(selectedConstellation.ra, selectedConstellation.dec, location.lat, location.lon)
      : { az: 0, el: 0 };
    displayData = {
      az: coords.az,
      el: coords.el,
      name: selectedConstellation.name,
      description: selectedConstellation.description,
      abbr: selectedConstellation.abbr,
      ra: selectedConstellation.ra,
      dec: selectedConstellation.dec,
      id: selectedConstellation.id,
      type: 'constellation'
    };
    title = 'Constellation Direction';
  } else if (selectedSatellite) {
    // For a selected satellite, compute approximate elevation
    const approxEl = Math.max(10, Math.min(85, 90 - (selectedSatellite.satalt / 450) * 50));
    const approxAz = ((selectedSatellite.satlat * 3 + selectedSatellite.satlon + 180) % 360);
    displayData = {
      az: approxAz,
      el: approxEl,
      name: selectedSatellite.satname,
      alt: selectedSatellite.satalt,
      velocity: selectedSatellite.velocity,
      id: selectedSatellite.satid,
      type: 'satellite'
    };
    title = 'Satellite Direction';
  }

  const [showNotesForm, setShowNotesForm] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [activeModal, setActiveModal] = useState(null); // null | 'fact' | 'apod' | 'sat'

  // 1. APOD state
  const [apodLoading, setApodLoading] = useState(false);
  const [apodError, setApodError] = useState(null);

  useEffect(() => {
    if (!displayData && !apodData && !apodLoading) {
      setApodLoading(true);
      fetchAstronomyPictureOfTheDay()
        .then(data => {
          console.log('[LookUpCard] Successfully fetched APOD:', data);
          actions.setApodData(data);
          setApodLoading(false);
        })
        .catch(err => {
          console.error(err);
          setApodError('Failed to load APOD');
          setApodLoading(false);
        });
    }
  }, [displayData, apodData]);

  // 2. Space Facts state
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    const rand = Math.floor(Math.random() * spaceFacts.length);
    setFactIndex(rand);
  }, []);

  const handleNextFact = () => {
    let nextIndex = Math.floor(Math.random() * spaceFacts.length);
    if (nextIndex === factIndex && spaceFacts.length > 1) {
      nextIndex = (nextIndex + 1) % spaceFacts.length;
    }
    setFactIndex(nextIndex);
  };

  // 3. Satellite of the Day
  const satelliteOfTheDay = useMemo(() => {
    if (MOCK_SATELLITES.length === 0) return null;
    const today = new Date();
    const seed = today.getFullYear() * 1000 + (today.getMonth() + 1) * 31 + today.getDate();
    const index = seed % MOCK_SATELLITES.length;
    const sat = MOCK_SATELLITES[index];
    const descInfo = satelliteDescriptions[String(sat.satid)] || {
      description: "A research and observation platform operating in low Earth orbit."
    };
    return {
      ...sat,
      description: descInfo.description
    };
  }, []);

  if (!displayData) {
    console.log('[LookUpCard] Rendering Celestial Dashboard. APOD Data:', apodData);
    return (
      <div className="flex flex-col gap-5 p-4">
        {/* Header */}
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Compass className="w-5 h-5 text-cyan animate-pulse" />
          <h2 className="text-sm font-playfair font-bold text-text">Look Up Menu</h2>
        </div>

        {/* Space Fun Fact */}
        <div 
          onClick={() => setActiveModal('fact')}
          className="glass-panel p-4 glow-cyan flex flex-col gap-2 relative overflow-hidden transition-all duration-300 hover:border-cyan hover:shadow-lg cursor-pointer hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-cyan tracking-[0.2em] uppercase font-bold text-glow-cyan flex items-center gap-1">
              ✨ Space Fact of the Moment
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation(); // prevent modal opening
                handleNextFact();
              }}
              className="p-1 rounded text-muted hover:text-cyan transition-colors"
              title="Next Fact"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-1">
            <p className="text-sm font-crimson text-text leading-relaxed text-left line-clamp-3">
              "{spaceFacts[factIndex]}"
            </p>
          </div>
        </div>

        {/* NASA Astronomy Picture of the Day */}
        <div 
          onClick={() => setActiveModal('apod')}
          className="glass-panel overflow-hidden border border-border flex flex-col transition-all duration-300 hover:border-cyan hover:shadow-lg cursor-pointer hover:scale-[1.01]"
        >
          <div className="p-3 border-b border-border bg-navy/30 flex items-center justify-between">
            <span className="text-[10px] font-mono text-cyan tracking-[0.2em] uppercase font-bold text-glow-cyan flex items-center gap-1">
              📷 NASA APOD
            </span>
            {apodData && (
              <span className="text-[9px] font-mono text-muted">{apodData.date}</span>
            )}
          </div>

          {apodLoading ? (
            <div className="p-6 flex flex-col items-center justify-center gap-2">
              <div className="spinner border-top-color-amber w-8 h-8"></div>
              <p className="text-xs text-muted font-crimson">Retrieving cosmic capture...</p>
            </div>
          ) : apodError || !apodData ? (
            <div className="p-4 text-center">
              <p className="text-xs text-danger font-crimson">Failed to load picture of the day.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Image Container */}
              <div className="relative group overflow-hidden h-40 bg-space">
                <img 
                  src={apodData.url} 
                  alt={apodData.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-space via-transparent to-transparent opacity-85" />
                <div className="absolute bottom-2 left-3 right-3 text-left">
                  <h3 className="text-sm font-playfair font-bold text-white truncate">{apodData.title}</h3>
                  {apodData.copyright && (
                    <p className="text-[9px] text-gray-300 font-mono">© {apodData.copyright}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Satellite of the Day */}
        {satelliteOfTheDay && (
          <div 
            onClick={() => setActiveModal('sat')}
            className="glass-panel p-4 border border-border flex flex-col gap-3 relative overflow-hidden transition-all duration-300 hover:border-cyan hover:shadow-lg cursor-pointer hover:scale-[1.01]"
          >
            <div className="absolute top-0 right-0 p-2 opacity-5">
              <Compass className="w-24 h-24 text-amber" />
            </div>

            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-[10px] font-mono text-cyan tracking-[0.2em] uppercase font-bold text-glow-cyan">
                🛰️ Satellite of the Day
              </span>
              <span className="text-[9px] font-mono text-cyan/70">ID: {satelliteOfTheDay.satid}</span>
            </div>

            <div className="flex flex-col gap-1 z-10 text-left">
              <h3 className="text-sm font-playfair font-bold text-text">{satelliteOfTheDay.satname}</h3>
              <p className="text-[10px] font-mono text-muted">
                Launched: {satelliteOfTheDay.launchDate} · Altitude: {satelliteOfTheDay.satalt} km
              </p>
              <div className="mt-2">
                <p className="text-xs font-crimson text-muted-light leading-relaxed line-clamp-3">
                  {satelliteOfTheDay.description}
                </p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation(); // prevent modal opening
                actions.setViewMode('satellites');
                actions.selectSatellite(satelliteOfTheDay);
              }}
              className="mt-2 w-full py-2 bg-cyan/15 border border-cyan/40 hover:bg-cyan hover:text-space text-xs font-crimson font-bold text-cyan rounded-lg transition-all text-center flex items-center justify-center gap-1.5 shadow-sm uppercase tracking-wider"
            >
              <span>Track on Map 🔭</span>
            </button>
          </div>
        )}

        {/* Modals */}
        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {activeModal === 'fact' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-space/85 backdrop-blur-md"
                onClick={() => setActiveModal(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="relative w-full max-w-lg bg-panel border border-border rounded-2xl p-6 shadow-2xl flex flex-col gap-4 scanlines"
                  onClick={e => e.stopPropagation()}
                >
                  <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-muted hover:text-text transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-mono text-cyan tracking-[0.2em] uppercase font-bold text-glow-cyan">
                    ✨ Space Fact
                  </span>
                  <div className="overflow-y-auto pr-1 flex-1 max-h-[60vh]">
                    <p className="text-base md:text-lg font-crimson text-text leading-relaxed italic text-left">
                      "{spaceFacts[factIndex]}"
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {activeModal === 'apod' && apodData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-space/85 backdrop-blur-md"
                onClick={() => setActiveModal(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="relative w-full max-w-3xl bg-panel border border-border rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] scanlines"
                  onClick={e => e.stopPropagation()}
                >
                  <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 z-50 p-1.5 rounded-full bg-space/60 border border-border/40 text-muted hover:text-text transition-colors shadow-md">
                    <X className="w-4 h-4" />
                  </button>
                  
                  {/* Full Image */}
                  <div className="relative w-full flex-1 bg-space flex items-center justify-center min-h-[300px]">
                    <img 
                      src={apodData.url} 
                      alt={apodData.title}
                      className="w-full h-full object-contain max-h-[80vh]" 
                    />
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-panel via-panel/85 to-transparent pointer-events-none" />
                    <div className="absolute bottom-4 left-6 right-6 text-left z-10">
                      <span className="text-[10px] font-mono text-amber tracking-[0.2em] uppercase font-bold text-glow-amber">
                        NASA APOD
                      </span>
                      <h3 className="text-xl font-playfair font-bold text-text mt-1">{apodData.title}</h3>
                      <div className="text-[10px] text-muted font-mono mt-1 flex items-center gap-2 flex-wrap">
                        <span>Date: {apodData.date}</span>
                        {apodData.copyright && <span>· Copyright: {apodData.copyright}</span>}
                        {apodData.hdurl && (
                          <a 
                            href={apodData.hdurl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-cyan hover:underline inline-flex items-center gap-0.5 ml-1 pointer-events-auto"
                          >
                            View HD <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {activeModal === 'sat' && satelliteOfTheDay && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-space/85 backdrop-blur-md"
                onClick={() => setActiveModal(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="relative w-full max-w-lg bg-panel border border-border rounded-2xl p-6 shadow-2xl flex flex-col gap-4 scanlines"
                  onClick={e => e.stopPropagation()}
                >
                  <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-muted hover:text-text transition-colors">
                    <X className="w-4 h-4" />
                  </button>

                  <span className="text-[10px] font-mono text-amber tracking-[0.2em] uppercase font-bold text-glow-amber">
                    🛰️ Satellite of the Day
                  </span>

                  <div className="flex flex-col gap-1 text-left border-b border-border/40 pb-3 shrink-0">
                    <h3 className="text-xl font-playfair font-bold text-text">{satelliteOfTheDay.satname}</h3>
                    <p className="text-xs font-mono text-muted">
                      NORAD ID: {satelliteOfTheDay.satid} · Launch Date: {satelliteOfTheDay.launchDate}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-navy/40 p-4 rounded-xl border border-border/60 text-left text-xs font-crimson shrink-0">
                    <div>
                      <span className="text-muted text-[10px] uppercase block tracking-wider">Operational Type</span>
                      <span className="text-text font-mono font-bold capitalize">{satelliteOfTheDay.type?.replace('-', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-muted text-[10px] uppercase block tracking-wider">Orbital Altitude</span>
                      <span className="text-text font-mono font-bold">{satelliteOfTheDay.satalt} km</span>
                    </div>
                    <div>
                      <span className="text-muted text-[10px] uppercase block tracking-wider">Orbital Velocity</span>
                      <span className="text-text font-mono font-bold">{satelliteOfTheDay.velocity} km/s</span>
                    </div>
                    <div>
                      <span className="text-muted text-[10px] uppercase block tracking-wider">Int. Designator</span>
                      <span className="text-text font-mono font-bold">{satelliteOfTheDay.intDesignator}</span>
                    </div>
                  </div>

                  <div className="text-left flex-1 overflow-hidden flex flex-col gap-2 min-h-[150px]">
                    <h4 className="text-xs font-mono text-cyan tracking-wider uppercase font-bold border-b border-border/20 pb-1 shrink-0">Description</h4>
                    <div className="overflow-y-auto pr-1 flex-1">
                      <p className="text-sm font-crimson text-muted-light leading-relaxed">
                        {satelliteOfTheDay.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-2 shrink-0">
                    <button
                      onClick={() => {
                        actions.setViewMode('satellites');
                        actions.selectSatellite(satelliteOfTheDay);
                        setActiveModal(null);
                      }}
                      className="flex-1 py-2.5 bg-amber border border-amber text-xs font-crimson font-bold text-navy rounded-lg hover:bg-transparent hover:text-amber hover:border-amber transition-all text-center flex items-center justify-center gap-1.5 shadow-md uppercase tracking-wider"
                    >
                      <span>Track on Map 🔭</span>
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
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
        <h2 className="text-xs font-crimson font-bold tracking-widest uppercase text-muted-light">
          {title}
        </h2>
        {(selectedSatellite || selectedConstellation || selectedAsteroid) && (
          <button
            onClick={() => {
              if (selectedSatellite) actions.selectSatellite(null);
              if (selectedConstellation) actions.selectConstellation(null);
              if (selectedAsteroid) actions.selectAsteroid(null);
            }}
            className="ml-auto text-muted hover:text-text transition-colors"
            aria-label="Close look-up card"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Target name */}
      <div className="text-center flex flex-col items-center w-full">
        <p className="text-cyan font-crimson font-bold text-base">{name}</p>
        {viewMode === 'asteroids' && selectedAsteroid ? (
          <div className="w-full flex flex-col items-center mt-2 gap-2">
            {displayData.is_potentially_hazardous && (
              <div className="w-full px-3 py-1.5 rounded-lg border border-red/40 bg-red/10 text-red text-center text-xs font-crimson font-bold animate-pulse">
                ⚠️ Potentially Hazardous Asteroid
              </div>
            )}
            <p className="text-muted text-xs font-crimson">
              RA: <span className="font-mono">{displayData.ra?.toFixed(1)}h</span> · Dec: <span className="font-mono">{displayData.dec?.toFixed(1)}°</span>
            </p>
            <div className="w-full grid grid-cols-2 gap-2 bg-navy/40 p-2.5 rounded-xl border border-border mt-1 text-left text-xs font-crimson">
              <div>
                <span className="text-muted text-[10px] uppercase block tracking-wider">Est. Diameter</span>
                <span className="text-text font-mono text-xs">
                  {displayData.diameter_min?.toFixed(0)}-{displayData.diameter_max?.toFixed(0)} m
                </span>
                <span className="text-muted text-[10px] font-mono block">
                  ({(displayData.diameter_min * 3.28084).toFixed(0)}-{(displayData.diameter_max * 3.28084).toFixed(0)} ft)
                </span>
              </div>
              <div>
                <span className="text-muted text-[10px] uppercase block tracking-wider">Rel. Velocity</span>
                <span className="text-text font-mono text-xs block">
                  {displayData.velocity_kms?.toFixed(2)} km/s
                </span>
                <span className="text-muted text-[10px] font-mono block">
                  ({(displayData.velocity_kms * 3600).toFixed(0)} km/h)
                </span>
              </div>
              <div className="col-span-2 border-t border-border/40 pt-2 mt-1">
                <span className="text-muted text-[10px] uppercase block tracking-wider">Miss Distance</span>
                <span className="text-text font-mono text-xs block">
                  {displayData.miss_distance_ld?.toFixed(2)} LD
                </span>
                <span className="text-muted text-[10px] font-mono block">
                  ({displayData.miss_distance_km?.toLocaleString()} km)
                </span>
              </div>
            </div>
            <a
              href={displayData.nasa_jpl_url || `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${displayData.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-1.5 px-3 py-1 bg-navy/60 border border-border text-[11px] text-text rounded-md hover:border-amber/50 hover:text-amber transition-colors w-full"
            >
              <span>☄️ View JPL Small-Body Database</span>
            </a>
          </div>
        ) : viewMode === 'constellations' ? (
          <>
            <p className="text-muted text-xs font-crimson mt-0.5">
              RA: <span className="font-mono">{displayData.ra}h</span> · Dec: <span className="font-mono">{displayData.dec}°</span> · {displayData.abbr}
            </p>
            <a
              href={`https://en.wikipedia.org/wiki/${name.replace(' ', '_')}_(constellation)`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-1.5 px-3 py-1 bg-navy/60 border border-border text-[11px] text-text rounded-md hover:border-amber/50 hover:text-amber transition-colors"
            >
              <span>📖 Explore on Wikipedia</span>
            </a>
          </>
        ) : displayData.alt && (
          <p className="text-muted text-xs font-crimson mt-0.5">
            <span className="font-mono">{displayData.alt?.toFixed(0)} km</span> altitude · <span className="font-mono">{displayData.velocity?.toFixed(2)} km/s</span>
          </p>
        )}
      </div>

      {/* Compass Rose SVG */}
      <div className="flex justify-center">
        <svg width="180" height="180" viewBox="0 0 180 180" className="overflow-visible">
          {/* Outer ring */}
          <circle cx="90" cy="90" r="80" fill="none" stroke="#2a174d" strokeWidth="1" />
          <circle cx="90" cy="90" r="80" fill="rgba(19,9,36,0.6)" />

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
                stroke={isMajor ? '#3d266a' : '#2a174d'} strokeWidth={isMajor ? 1.5 : 0.5}
              />
            );
          })}

          {/* Cardinal labels */}
          {[
            { label: 'N', angle: -90, color: '#ff6b6b' },
            { label: 'E', angle: 0, color: '#a3aed0' },
            { label: 'S', angle: 90, color: '#a3aed0' },
            { label: 'W', angle: 180, color: '#a3aed0' },
          ].map(({ label, angle, color }) => {
            const rad = angle * (Math.PI / 180);
            const x = 90 + 58 * Math.cos(rad);
            const y = 90 + 58 * Math.sin(rad) + 4;
            return (
              <text key={label} x={x} y={y} textAnchor="middle" fill={color}
                fontSize="11" fontFamily="Crimson Text, Georgia, serif" fontWeight="700">
                {label}
              </text>
            );
          })}

          {/* Inner circles */}
          <circle cx="90" cy="90" r="45" fill="none" stroke="#2a174d" strokeWidth="0.5" strokeDasharray="3,3" />
          <circle cx="90" cy="90" r="20" fill="rgba(232, 181, 104, 0.05)" stroke="#e8b568" strokeWidth="0.5" />

          {/* Compass needle */}
          <line
            x1="90" y1="90" x2={nx} y2={ny}
            stroke="#e8b568" strokeWidth="2.5" strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 4px rgba(232, 181, 104, 0.8))' }}
          />
          <line
            x1="90" y1="90"
            x2={90 - (nx - 90) * 0.35}
            y2={90 - (ny - 90) * 0.35}
            stroke="#2a174d" strokeWidth="1.5" strokeLinecap="round"
          />

          {/* Center dot */}
          <circle cx="90" cy="90" r="5" fill="#e8b568"
            style={{ filter: 'drop-shadow(0 0 6px rgba(232, 181, 104, 1))' }}
          />

          {/* Azimuth label */}
          <text x="90" y="165" textAnchor="middle" fill="#e8b568" fontSize="11" fontWeight="700">
            <tspan fontFamily="Space Mono, monospace">{az.toFixed(0)}°</tspan>
            <tspan fontFamily="Crimson Text, Georgia, serif" dx="4">{compass}</tspan>
          </text>
        </svg>
      </div>

      {/* Elevation Arc */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-muted text-xs font-crimson uppercase tracking-wider">Elevation above horizon</p>
        <div className="flex items-end gap-3">
          <ElevationArc elevation={el} />
          <div className="text-center pb-2">
            <p className="font-mono text-3xl font-bold text-amber"
              style={{ textShadow: '0 0 15px rgba(245,158,11,0.6)' }}>
              {el.toFixed(0)}°
            </p>
            <p className="text-muted text-xs font-crimson">{getElevationLabel(el)}</p>
          </div>
        </div>
      </div>

      {/* Plain English instruction */}
      <div className="px-4 py-3 rounded-xl border border-cyan/30 bg-cyan/5 text-center">
        <Target className="w-4 h-4 text-cyan mx-auto mb-1" />
        <p className="text-text text-sm leading-relaxed font-crimson">
          Point <span className="text-cyan font-bold">{compass}</span>{' '}
          at <span className="text-amber font-mono font-bold">{el.toFixed(0)}°</span> above the horizon
        </p>
        <p className="text-muted text-xs font-crimson mt-1">
          {getElevationHint(el)}
        </p>
      </div>

      {/* Spotting Log Gamification Action */}
      <div className="border-t border-border/40 pt-4 mt-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-[10px] font-crimson text-muted uppercase tracking-wider block">Observed Status</span>
            {observedLog.filter(l => l.targetId === String(displayData?.id) && l.type === displayData?.type).length > 0 ? (
              <span className="text-xs font-crimson text-cyan font-bold flex items-center gap-1">
                ✓ Spotted {observedLog.filter(l => l.targetId === String(displayData?.id) && l.type === displayData?.type).length}x before
              </span>
            ) : (
              <span className="text-xs font-crimson text-muted italic">Not observed yet</span>
            )}
          </div>

          {!showNotesForm ? (
            <button
              onClick={() => setShowNotesForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan/10 border border-cyan/30 text-[11px] text-cyan rounded-md hover:bg-cyan/20 hover:border-cyan transition-colors"
            >
              <span>🔭 I Spotted This!</span>
            </button>
          ) : (
            <button
              onClick={() => { setShowNotesForm(false); setNotesText(''); }}
              className="text-xs font-crimson text-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {showNotesForm && (
          <div className="bg-navy/40 p-2.5 rounded-lg border border-border/60 flex flex-col gap-2 mt-2">
            <label className="text-[10px] font-crimson text-muted uppercase tracking-wider block">
              Spotting Notes (Optional)
            </label>
            <textarea
              placeholder="e.g. Very bright overhead, clear sky, spotted with naked eye!"
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              className="w-full text-xs font-crimson bg-panel border border-border rounded p-1.5 text-text placeholder-muted/50 focus:outline-none focus:border-cyan h-16 resize-none"
              maxLength={200}
            />
            <button
              onClick={() => {
                const observation = {
                  id: Math.random().toString(36).substr(2, 9),
                  targetId: String(displayData.id),
                  name: displayData.name,
                  type: displayData.type,
                  timestamp: new Date().toISOString(),
                  locationName: location?.name || 'Unknown Location',
                  lat: location?.lat,
                  lon: location?.lon,
                  notes: notesText.trim(),
                  isHazardous: displayData.type === 'asteroid' && !!displayData.is_potentially_hazardous
                };
                actions.logObservation(observation);
                setShowNotesForm(false);
                setNotesText('');
              }}
              className="w-full py-1.5 bg-cyan border border-cyan text-xs font-crimson font-bold text-navy rounded-md hover:bg-transparent hover:text-cyan transition-colors text-center"
            >
              Log Observation
            </button>
          </div>
        )}
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

  // Satellite/Constellation position dot
  const satX = cx + r * Math.cos(endRad);
  const satY = cy + r * Math.sin(endRad);

  return (
    <svg width="140" height="85" viewBox="0 0 140 85">
      {/* Horizon line */}
      <line x1="10" y1="75" x2="130" y2="75" stroke="#2a174d" strokeWidth="1" />
      <text x="135" y="78" fontSize="9" fill="#a3aed0" fontFamily="Space Mono, monospace">0°</text>

      {/* Zenith label */}
      <text x="70" y="8" textAnchor="middle" fontSize="9" fill="#a3aed0" fontFamily="Space Mono, monospace">90°</text>
      <text x="70" y="17" textAnchor="middle" fontSize="7" fill="#a3aed0" fontFamily="Crimson Text, Georgia, serif">zenith</text>

      {/* Arc background (full half-circle) */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#2a174d" strokeWidth="1.5" strokeDasharray="3,3"
      />

      {/* Elevation arc */}
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
        fill="none" stroke="#e8b568" strokeWidth="2.5" strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 4px rgba(232, 181, 104, 0.7))' }}
      />

      {/* Angle tick marks */}
      {[30, 45, 60].map(deg => {
        const a = (180 - deg) * (Math.PI / 180);
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        return (
          <g key={deg}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="#2a174d" strokeWidth="0.5" strokeDasharray="2,2" />
            <text x={x - 2} y={y - 3} fontSize="7" fill="#a3aed0" fontFamily="Space Mono, monospace">{deg}°</text>
          </g>
        );
      })}

      {/* Satellite/Constellation dot */}
      <circle cx={satX} cy={satY} r="5" fill="#e8b568"
        style={{ filter: 'drop-shadow(0 0 5px rgba(232, 181, 104, 0.9))' }}
      />

      {/* Observer dot */}
      <circle cx={cx} cy={cy} r="4" fill="#e8b568"
        style={{ filter: 'drop-shadow(0 0 5px rgba(232, 181, 104, 0.9))' }}
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
