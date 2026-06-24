import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext.jsx';
import { azimuthToCompass } from '../../utils/orbitMath.js';
import { getLocalCoordinates } from '../../data/constellations.js';
import { Compass, Target, X, RefreshCw, ExternalLink, Bell, BellOff, Clock } from 'lucide-react';
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
  const [activeModal, setActiveModal] = useState(null);

  // Pass alert state — keyed by pass startUTC timestamp
  const [alertedPasses, setAlertedPasses] = useState(new Set()); // Set<startUTC>
  const [alertTimers, setAlertTimers] = useState(new Map());    // Map<startUTC, timeoutId>
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [inAppAlert, setInAppAlert] = useState(null); // { name, time } for fallback banner

  const ALERT_LEAD_SECS = 5 * 60; // 5 minutes before AOS

  const scheduleAlert = (pass) => {
    const fireAt = (pass.startUTC - ALERT_LEAD_SECS) * 1000;
    const msUntil = fireAt - Date.now();
    if (msUntil <= 0) return null; // already past

    const tid = setTimeout(() => {
      const msg = `ISS overhead in 5 minutes! Look ${pass.startAzCompass} at ${pass.maxEl}° elevation.`;
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('🚀 ISS Pass Alert — OrbitWatch', { body: msg, icon: '/favicon.ico' });
      } else {
        setInAppAlert({ msg, startUTC: pass.startUTC });
        setTimeout(() => setInAppAlert(null), 12000);
      }
      // Remove from alerted set after firing
      setAlertedPasses(prev => { const s = new Set(prev); s.delete(pass.startUTC); return s; });
      setAlertTimers(prev => { const m = new Map(prev); m.delete(pass.startUTC); return m; });
    }, msUntil);
    return tid;
  };

  const requestAndScheduleAlert = async (pass) => {
    let perm = notifPermission;
    if (perm === 'default') {
      perm = await Notification.requestPermission();
      setNotifPermission(perm);
    }
    const tid = scheduleAlert(pass);
    if (tid !== null) {
      setAlertedPasses(prev => new Set([...prev, pass.startUTC]));
      setAlertTimers(prev => new Map([...prev, [pass.startUTC, tid]]));
    }
  };

  const cancelAlert = (pass) => {
    const tid = alertTimers.get(pass.startUTC);
    if (tid) clearTimeout(tid);
    setAlertedPasses(prev => { const s = new Set(prev); s.delete(pass.startUTC); return s; });
    setAlertTimers(prev => { const m = new Map(prev); m.delete(pass.startUTC); return m; });
  };

  // 1. APOD state
  const [apodLoading, setApodLoading] = useState(false);
  const [apodError, setApodError] = useState(null);

  // Detect video APODs by media_type OR URL pattern (handles stale cached data missing media_type)
  const isApodVideo = (data) => {
    if (!data) return false;
    if (data.media_type === 'video') return true;
    const url = data.url || '';
    return url.includes('youtube') || url.includes('youtu.be') || url.includes('embed');
  };

  // Extract YouTube video ID from embed/watch URLs
  const getYouTubeId = (url = '') => {
    const m = url.match(/(?:embed\/|v=|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  };

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
        <div className="flex items-center gap-2 pb-2 border-b border-white/[0.03]">
          <Compass className="w-5 h-5 text-cyan animate-pulse" />
          <h2 className="text-sm font-playfair font-bold text-text">Look Up Menu</h2>
        </div>

        {/* Space Fun Fact */}
        <div 
          onClick={() => setActiveModal('fact')}
          className="glass-panel p-4 flex flex-col gap-2 relative overflow-hidden transition-all duration-300 hover:border-border-light cursor-pointer hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-sans text-cyan tracking-[0.1em] uppercase font-bold flex items-center gap-1">
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
            <p className="text-sm font-sans text-text leading-relaxed text-left line-clamp-3">
              "{spaceFacts[factIndex]}"
            </p>
          </div>
        </div>

        {/* NASA Astronomy Picture of the Day */}
        <div 
          onClick={() => setActiveModal('apod')}
          className="glass-panel overflow-hidden border border-border flex flex-col transition-all duration-300 hover:border-border-light cursor-pointer hover:scale-[1.01]"
        >
          <div className="p-3 border-b border-white/[0.03] bg-panel flex items-center justify-between">
            <span className="text-[10px] font-sans text-cyan tracking-[0.1em] uppercase font-bold flex items-center gap-1">
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
              {/* Image / Video Container */}
              <div className="relative group overflow-hidden h-40 bg-space">
                {isApodVideo(apodData) ? (
                  // Video APOD — embed iframe directly (pointer-events-none so card click still works)
                  // Use ?autoplay=0&controls=0&rel=0 for a clean preview look
                  getYouTubeId(apodData.url) ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${getYouTubeId(apodData.url)}?autoplay=0&controls=0&rel=0&modestbranding=1&showinfo=0`}
                      title={apodData.title}
                      className="w-full h-full border-0 pointer-events-none scale-110"
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted text-xs font-mono">▶ Video</div>
                  )
                ) : (
                  <img
                    src={apodData.hdurl || apodData.url}
                    alt={apodData.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-space via-transparent to-transparent opacity-85" />
                {isApodVideo(apodData) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center">
                      <span className="text-white text-lg ml-0.5">▶</span>
                    </div>
                  </div>
                )}
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
            className="glass-panel p-4 border border-border flex flex-col gap-3 relative overflow-hidden transition-all duration-300 hover:border-border-light cursor-pointer hover:scale-[1.01]"
          >
            <div className="absolute top-0 right-0 p-2 opacity-5">
              <Compass className="w-24 h-24 text-cyan" />
            </div>

            <div className="flex items-center justify-between border-b border-white/[0.02] pb-2">
              <span className="text-[10px] font-sans text-cyan tracking-[0.1em] uppercase font-bold">
                🛰️ Satellite of the Day
              </span>
              <span className="text-[9px] font-mono text-cyan/70">ID: {satelliteOfTheDay.satid}</span>
            </div>

            <div className="flex flex-col gap-1 z-10 text-left">
              <h3 className="text-sm font-sans uppercase tracking-wider font-bold text-text">{satelliteOfTheDay.satname}</h3>
              <p className="text-[10px] font-mono text-muted">
                Launched: {satelliteOfTheDay.launchDate} · Altitude: {satelliteOfTheDay.satalt} km
              </p>
              <div className="mt-2">
                <p className="text-xs font-sans text-muted leading-relaxed line-clamp-3">
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
                  
                  {/* Full Image or Video */}
                  <div className="relative w-full flex-1 bg-space flex items-center justify-center min-h-[300px]">
                    {isApodVideo(apodData) ? (
                      <iframe
                        src={apodData.url}
                        title={apodData.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full min-h-[300px] h-[400px] border-0"
                      />
                    ) : (
                      <img
                        src={apodData.hdurl || apodData.url}
                        alt={apodData.title}
                        className="w-full h-full object-contain max-h-[80vh]"
                      />
                    )}
                    {!isApodVideo(apodData) && (
                      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-panel via-panel/85 to-transparent pointer-events-none" />
                    )}
                    <div className="absolute bottom-4 left-6 right-6 text-left z-10">
                      <span className="text-[10px] font-sans text-cyan tracking-[0.1em] uppercase font-bold">
                        NASA APOD
                      </span>
                      <h3 className="text-xl font-playfair font-bold text-text mt-1">{apodData.title}</h3>
                      <div className="text-[10px] text-muted font-mono mt-1 flex items-center gap-2 flex-wrap">
                        <span>Date: {apodData.date}</span>
                        {apodData.copyright && <span>· Copyright: {apodData.copyright}</span>}
                        {apodData.hdurl && apodData.media_type !== 'video' && (
                          <a
                            href={apodData.hdurl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan hover:underline inline-flex items-center gap-0.5 ml-1 pointer-events-auto"
                          >
                            View HD <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {apodData.media_type === 'video' && (
                          <a
                            href={apodData.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan hover:underline inline-flex items-center gap-0.5 ml-1 pointer-events-auto"
                          >
                            Open on YouTube <ExternalLink className="w-2.5 h-2.5" />
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

                  <span className="text-[10px] font-sans text-cyan tracking-[0.1em] uppercase font-bold">
                    🛰️ Satellite of the Day
                  </span>

                  <div className="flex flex-col gap-1 text-left border-b border-white/[0.02] pb-3 shrink-0">
                    <h3 className="text-xl font-playfair font-bold text-text">{satelliteOfTheDay.satname}</h3>
                    <p className="text-xs font-mono text-muted">
                      NORAD ID: {satelliteOfTheDay.satid} · Launch Date: {satelliteOfTheDay.launchDate}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-panel p-4 rounded-xl border border-white/[0.03] text-left text-xs font-sans shrink-0">
                    <div>
                      <span className="text-muted text-[10px] uppercase block tracking-wider font-semibold">Operational Type</span>
                      <span className="text-text font-mono font-bold capitalize">{satelliteOfTheDay.type?.replace('-', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-muted text-[10px] uppercase block tracking-wider font-semibold">Orbital Altitude</span>
                      <span className="text-text font-mono font-bold">{satelliteOfTheDay.satalt} km</span>
                    </div>
                    <div>
                      <span className="text-muted text-[10px] uppercase block tracking-wider font-semibold">Orbital Velocity</span>
                      <span className="text-text font-mono font-bold">{satelliteOfTheDay.velocity} km/s</span>
                    </div>
                    <div>
                      <span className="text-muted text-[10px] uppercase block tracking-wider font-semibold">Int. Designator</span>
                      <span className="text-text font-mono font-bold">{satelliteOfTheDay.intDesignator}</span>
                    </div>
                  </div>

                  <div className="text-left flex-1 overflow-hidden flex flex-col gap-2 min-h-[150px]">
                    <h4 className="text-xs font-mono text-cyan tracking-wider uppercase font-bold border-b border-white/[0.03] pb-1 shrink-0">Description</h4>
                    <div className="overflow-y-auto pr-1 flex-1">
                      <p className="text-sm font-sans text-muted leading-relaxed">
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
                      className="flex-1 py-2.5 bg-white text-xs font-sans font-bold text-[var(--bg)] rounded-full hover:opacity-90 transition-all text-center flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-sm"
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
        <h2 className="font-playfair italic text-2xl tracking-normal text-text">
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
        <p className="text-cyan font-playfair italic text-2xl font-bold">{name}</p>
        {viewMode === 'asteroids' && selectedAsteroid ? (
          <div className="w-full flex flex-col items-center mt-2 gap-2">
            {displayData.is_potentially_hazardous && (
              <div className="w-full px-3 py-1.5 rounded-lg border border-red/40 bg-red/10 text-red text-center text-xs font-sans font-bold uppercase tracking-wider">
                ⚠️ Potentially Hazardous Asteroid
              </div>
            )}
            <p className="text-muted text-xs font-sans uppercase tracking-wider font-semibold">
              RA: <span className="font-mono text-text font-bold">{displayData.ra?.toFixed(1)}h</span> · Dec: <span className="font-mono text-text font-bold">{displayData.dec?.toFixed(1)}°</span>
            </p>
            <div className="w-full grid grid-cols-2 gap-2 bg-panel p-2.5 rounded-xl border border-white/[0.03] mt-1 text-left text-xs font-sans">
              <div>
                <span className="text-muted text-[10px] uppercase block tracking-wider font-semibold">Est. Diameter</span>
                <span className="text-text font-mono text-xs">
                  {displayData.diameter_min?.toFixed(0)}-{displayData.diameter_max?.toFixed(0)} m
                </span>
                <span className="text-muted text-[10px] font-mono block">
                  ({(displayData.diameter_min * 3.28084).toFixed(0)}-{(displayData.diameter_max * 3.28084).toFixed(0)} ft)
                </span>
              </div>
              <div>
                <span className="text-muted text-[10px] uppercase block tracking-wider font-semibold">Rel. Velocity</span>
                <span className="text-text font-mono text-xs block">
                  {displayData.velocity_kms?.toFixed(2)} km/s
                </span>
                <span className="text-muted text-[10px] font-mono block">
                  ({(displayData.velocity_kms * 3600).toFixed(0)} km/h)
                </span>
              </div>
              <div className="col-span-2 border-t border-white/[0.02] pt-2 mt-1">
                <span className="text-muted text-[10px] uppercase block tracking-wider font-semibold">Miss Distance</span>
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
              className="mt-2 flex items-center justify-center gap-1.5 px-3 py-1 bg-panel border border-white/[0.03] text-[11px] text-text rounded-md hover:border-white/[0.05] transition-colors w-full uppercase font-sans tracking-wider"
            >
              <span>☄️ View JPL Small-Body Database</span>
            </a>
          </div>
        ) : viewMode === 'constellations' ? (
          <>
            <p className="text-muted text-xs font-sans uppercase tracking-wider font-semibold mt-0.5">
              RA: <span className="font-mono text-text font-bold">{displayData.ra}h</span> · Dec: <span className="font-mono text-text font-bold">{displayData.dec}°</span> · {displayData.abbr}
            </p>
            <a
              href={`https://en.wikipedia.org/wiki/${name.replace(' ', '_')}_(constellation)`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-1.5 px-3 py-1 bg-panel border border-white/[0.03] text-[11px] text-text rounded-md hover:border-white/[0.05] transition-colors uppercase font-sans tracking-wider"
            >
              <span>📖 Explore on Wikipedia</span>
            </a>
          </>
        ) : displayData.alt && (
          <p className="text-muted text-xs font-sans uppercase tracking-wider font-semibold mt-0.5">
            <span className="font-mono text-text font-bold">{displayData.alt?.toFixed(0)} km</span> altitude · <span className="font-mono text-text font-bold">{displayData.velocity?.toFixed(2)} km/s</span>
          </p>
        )}
      </div>

      {/* Compass Rose SVG */}
      <div className="flex justify-center">
        <svg width="180" height="180" viewBox="0 0 180 180" className="overflow-visible">
          {/* Outer ring */}
          <circle cx="90" cy="90" r="80" fill="none" stroke="var(--surface-border)" strokeWidth="1" />
          <circle cx="90" cy="90" r="80" fill="var(--surface)" />

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
                stroke="var(--surface-border)" strokeWidth={isMajor ? 1.5 : 0.5}
              />
            );
          })}

          {/* Cardinal labels */}
          {[
            { label: 'N', angle: -90, color: 'var(--accent)' },
            { label: 'E', angle: 0, color: 'var(--text-secondary)' },
            { label: 'S', angle: 90, color: 'var(--text-secondary)' },
            { label: 'W', angle: 180, color: 'var(--text-secondary)' },
          ].map(({ label, angle, color }) => {
            const rad = angle * (Math.PI / 180);
            const x = 90 + 58 * Math.cos(rad);
            const y = 90 + 58 * Math.sin(rad) + 4;
            return (
              <text key={label} x={x} y={y} textAnchor="middle" fill={color}
                fontSize="11" fontFamily="Inter, sans-serif" fontWeight="700">
                {label}
              </text>
            );
          })}

          {/* Inner circles */}
          <circle cx="90" cy="90" r="45" fill="none" stroke="var(--surface-border)" strokeWidth="0.5" strokeDasharray="3,3" />
          <circle cx="90" cy="90" r="20" fill="none" stroke="var(--surface-border)" strokeWidth="0.5" />

          {/* Compass needle */}
          <line
            x1="90" y1="90" x2={nx} y2={ny}
            stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"
          />
          <line
            x1="90" y1="90"
            x2={90 - (nx - 90) * 0.35}
            y2={90 - (ny - 90) * 0.35}
            stroke="var(--surface-border)" strokeWidth="1.5" strokeLinecap="round"
          />

          {/* Center dot */}
          <circle cx="90" cy="90" r="4" fill="var(--accent)" />

          {/* Azimuth label */}
          <text x="90" y="165" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="700">
            <tspan fontFamily="monospace">{az.toFixed(0)}°</tspan>
            <tspan fontFamily="sans-serif" dx="4">{compass}</tspan>
          </text>
        </svg>
      </div>

      {/* Elevation Arc */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-muted text-[11px] font-sans uppercase tracking-wider font-semibold">Elevation above horizon</p>
        <div className="flex items-end gap-3">
          <ElevationArc elevation={el} />
          <div className="text-center pb-2">
            <p className="font-mono text-3xl font-bold text-cyan">
              {el.toFixed(0)}°
            </p>
            <p className="text-muted text-[10px] font-sans uppercase tracking-wider font-semibold">{getElevationLabel(el)}</p>
          </div>
        </div>
      </div>

      {/* Plain English instruction */}
      <div className="px-4 py-3 rounded-xl border border-border bg-panel text-center">
        <Target className="w-4 h-4 text-cyan mx-auto mb-1" />
        <p className="text-text text-xs leading-relaxed font-sans uppercase tracking-wider font-medium">
          Point <span className="text-cyan font-bold">{compass}</span>{' '}
          at <span className="font-mono font-bold text-text">{el.toFixed(0)}°</span> above the horizon
        </p>
        <p className="text-muted text-[11px] font-sans uppercase tracking-wider font-semibold mt-1">
          {getElevationHint(el)}
        </p>
      </div>

      {/* ── ISS Pass Alert section (ISS only) ── */}
      {selectedSatellite?.satid === 25544 && (() => {
        const nowSec = Math.floor(Date.now() / 1000);
        const upcoming = (issNextPasses || []).filter(p => p.endUTC > nowSec).slice(0, 4);
        if (upcoming.length === 0) return null;

        const formatPassTime = (utcSec) => {
          const d = new Date(utcSec * 1000);
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };
        const formatMinutesAway = (utcSec) => {
          const diff = utcSec - nowSec;
          if (diff <= 0) return 'NOW';
          const h = Math.floor(diff / 3600);
          const m = Math.floor((diff % 3600) / 60);
          return h > 0 ? `${h}h ${m}m` : `${m}m`;
        };

        return (
          <div className="glass-tile p-3 flex flex-col gap-2.5">
            {/* In-app alert banner */}
            {inAppAlert && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber/40 bg-amber/10 text-amber text-xs font-sans font-bold animate-pulse">
                <Bell className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{inAppAlert.msg}</span>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-amber" />
              <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-amber">Pass Alerts</span>
              {notifPermission === 'denied' && (
                <span className="ml-auto text-[9px] font-sans text-red uppercase tracking-wider font-bold">Notifications blocked</span>
              )}
            </div>

            {/* Per-pass rows */}
            <div className="flex flex-col gap-1.5">
              {upcoming.map((pass) => {
                const isSet = alertedPasses.has(pass.startUTC);
                const minsToStart = Math.floor((pass.startUTC - nowSec) / 60);
                const isPast5Min = minsToStart <= 5; // too close to set 5-min lead
                const isVisible = nowSec >= pass.startUTC && nowSec <= pass.endUTC;

                return (
                  <div
                    key={pass.startUTC}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
                    style={{
                      background: isSet ? 'rgba(224,168,71,0.08)' : 'rgba(15,22,38,0.4)',
                      border: isSet ? '1px solid rgba(224,168,71,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {/* Time + direction */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-xs font-bold text-text">{formatPassTime(pass.startUTC)}</span>
                        {isVisible ? (
                          <span className="text-[9px] font-sans font-bold text-cyan uppercase tracking-wider animate-pulse">LIVE</span>
                        ) : (
                          <span className="text-[9px] font-sans text-muted uppercase tracking-wider">in {formatMinutesAway(pass.startUTC)}</span>
                        )}
                      </div>
                      <div className="text-[9px] font-sans text-muted mt-0.5">
                        Max {pass.maxEl}° · from {pass.startAzCompass}
                      </div>
                    </div>

                    {/* Alert toggle button */}
                    {isVisible || isPast5Min ? (
                      <span className="text-[9px] font-sans text-muted uppercase tracking-wider italic">
                        {isVisible ? 'Overhead' : 'Too soon'}
                      </span>
                    ) : isSet ? (
                      <button
                        onClick={() => cancelAlert(pass)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-sans font-bold uppercase tracking-wider transition-all"
                        style={{ background: 'rgba(224,168,71,0.18)', color: '#e0a847', border: '1px solid rgba(224,168,71,0.35)' }}
                        title="Cancel alert"
                      >
                        <BellOff className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => requestAndScheduleAlert(pass)}
                        disabled={notifPermission === 'denied'}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-sans font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: 'rgba(77,141,255,0.12)', color: '#4d8dff', border: '1px solid rgba(77,141,255,0.25)' }}
                        title="Alert me 5 min before"
                      >
                        <Bell className="w-3 h-3" />
                        <span>Alert</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-[9px] font-sans text-muted text-center tracking-wider">
              Alerts fire 5 min before AOS — requires browser notification permission
            </p>
          </div>
        );
      })()}

      {/* Spotting Log Gamification Action */}
      <div className="border-t border-white/[0.02] pt-4 mt-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-[10px] font-sans text-muted uppercase tracking-wider font-bold block">Observed Status</span>
            {observedLog.filter(l => l.targetId === String(displayData?.id) && l.type === displayData?.type).length > 0 ? (
              <span className="text-xs font-sans text-cyan uppercase tracking-wider font-bold flex items-center gap-1 mt-0.5">
                ✓ Spotted {observedLog.filter(l => l.targetId === String(displayData?.id) && l.type === displayData?.type).length}x before
              </span>
            ) : (
              <span className="text-xs font-sans text-muted uppercase tracking-wider font-semibold italic mt-0.5">Not observed yet</span>
            )}
          </div>

          {!showNotesForm ? (
            <button
              onClick={() => setShowNotesForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan text-white text-[11px] font-sans uppercase tracking-wider font-bold rounded-full hover:opacity-90 transition-colors shadow-sm"
            >
              <span>🔭 I Spotted This!</span>
            </button>
          ) : (
            <button
              onClick={() => { setShowNotesForm(false); setNotesText(''); }}
              className="text-xs font-sans uppercase tracking-wider font-bold text-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {showNotesForm && (
          <div className="bg-panel p-2.5 rounded-lg border border-white/[0.03] flex flex-col gap-2 mt-2">
            <label className="text-[10px] font-sans text-muted uppercase tracking-wider block">
              Spotting Notes (Optional)
            </label>
            <textarea
              placeholder="e.g. Very bright overhead, clear sky, spotted with naked eye!"
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              className="w-full text-xs font-sans bg-panel border border-white/[0.03] rounded p-1.5 text-text placeholder-muted/50 focus:outline-none focus:border-cyan h-16 resize-none"
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
              className="w-full py-2 bg-white text-xs font-sans font-bold text-[var(--bg)] rounded-full hover:opacity-90 transition-colors text-center uppercase tracking-wider shadow-sm"
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
      <line x1="10" y1="75" x2="130" y2="75" stroke="var(--surface-border)" strokeWidth="1" />
      <text x="135" y="78" fontSize="9" fill="var(--text-secondary)" fontFamily="monospace">0°</text>

      {/* Zenith label */}
      <text x="70" y="8" textAnchor="middle" fontSize="9" fill="var(--text-secondary)" fontFamily="monospace">90°</text>
      <text x="70" y="17" textAnchor="middle" fontSize="7" fill="var(--text-secondary)" fontFamily="sans-serif">zenith</text>

      {/* Arc background (full half-circle) */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="var(--surface-border)" strokeWidth="1.5" strokeDasharray="3,3"
      />

      {/* Elevation arc */}
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
        fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"
      />

      {/* Angle tick marks */}
      {[30, 45, 60].map(deg => {
        const a = (180 - deg) * (Math.PI / 180);
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        return (
          <g key={deg}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--surface-border)" strokeWidth="0.5" strokeDasharray="2,2" />
            <text x={x - 2} y={y - 3} fontSize="7" fill="var(--text-secondary)" fontFamily="monospace">{deg}°</text>
          </g>
        );
      })}

      {/* Satellite/Constellation dot */}
      <circle cx={satX} cy={satY} r="5" fill="var(--accent)" />

      {/* Observer dot */}
      <circle cx={cx} cy={cy} r="4" fill="var(--accent)" />
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
