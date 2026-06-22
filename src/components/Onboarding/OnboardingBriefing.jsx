import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, 
  Globe, 
  Zap, 
  Award, 
  ArrowRight, 
  ArrowLeft, 
  Terminal, 
  Cpu, 
  Navigation,
  CheckCircle2,
  Sliders,
  Activity,
  RotateCcw,
  List,
  Flame,
  Moon,
  Search,
  Eye
} from 'lucide-react';

export default function OnboardingBriefing({ onComplete, observerLocation }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);
  const [bootSequence, setBootSequence] = useState(0);

  // Map simulation state
  const [simMode, setSimMode] = useState('3D');
  const [simGrid, setSimGrid] = useState(true);

  // Startup boot logs simulation
  useEffect(() => {
    const timer1 = setTimeout(() => setBootSequence(1), 350);
    const timer2 = setTimeout(() => setBootSequence(2), 750);
    const timer3 = setTimeout(() => setBootSequence(3), 1150);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const slides = [
    {
      title: "01 / BASE CALIBRATION",
      subtitle: "OBSERVER STATION CONFIGURATION",
      icon: <Compass className="w-6 h-6 text-cyan" />,
      description: "Welcome to Project Zenith Control Terminal. Your observation coordinate profile is locked in. The Reset Session button (white circle at sidebar bottom) allows you to clear the current coordinates and recalibrate to a new location at any time.",
      widget: (
        <div className="relative w-full h-44 flex flex-col items-center justify-center bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
          {/* Pulsing radar lines */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div className="w-32 h-32 rounded-full border border-cyan animate-ping" />
            <div className="absolute w-24 h-24 rounded-full border border-cyan/60 animate-pulse" />
          </div>
          
          {/* Tech readout */}
          <div className="relative z-10 font-mono text-center space-y-1.5 p-4">
            <div className="text-[10px] text-cyan/70 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Calibrated Coordinates Locked
            </div>
            <div className="text-sm font-bold text-white tracking-widest">
              LAT: {observerLocation?.lat?.toFixed(4) || "0.0000"}°
            </div>
            <div className="text-sm font-bold text-white tracking-widest">
              LON: {observerLocation?.lon?.toFixed(4) || "0.0000"}°
            </div>
            
            {/* Interactive Reset Mockup */}
            <div className="mt-2.5 flex justify-center">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] text-white/50 tracking-wider">
                <RotateCcw className="w-2.5 h-2.5 animate-spin-slow text-amber-500" />
                <span>Reset Session Pill (Sidebar Bottom)</span>
              </div>
            </div>
          </div>
          
          {/* Subtle grid decoration */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        </div>
      )
    },
    {
      title: "02 / VISUALIZATION DECK",
      subtitle: "2D MAP vs. 3D GLOBE OVERLAYS",
      icon: <Globe className="w-6 h-6 text-cyan" />,
      description: "Toggle between 2D flat mercator maps (Leaflet) and 3D space globes (ThreeJS) using the mode selector in the top-left of the map screen. Use the overlay toggle switches to configure latitude graticule lines, Open Ocean twinkling stars, rotating sonar sweeps, and global city lights.",
      widget: (
        <div className="relative w-full h-44 flex flex-col items-center justify-center bg-black/40 rounded-2xl border border-white/5 p-4 overflow-hidden space-y-3">
          {/* Toggle selectors mockup */}
          <div className="flex items-center gap-3 relative z-10 w-full justify-center">
            <button 
              onClick={() => setSimMode(simMode === '2D' ? '3D' : '2D')}
              className="px-3 py-1 rounded bg-cyan/10 border border-cyan/40 text-[9px] font-mono font-bold text-cyan tracking-wider hover:bg-cyan/20 transition-all"
            >
              MODE: {simMode}
            </button>
            <button 
              onClick={() => setSimGrid(!simGrid)}
              className={`px-3 py-1 rounded border text-[9px] font-mono font-bold tracking-wider transition-all ${
                simGrid ? 'bg-white/10 border-white/30 text-white' : 'bg-transparent border-white/10 text-white/40'
              }`}
            >
              GRID: {simGrid ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Interactive display simulation */}
          <div className="w-full max-w-[260px] h-20 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center relative overflow-hidden">
            {simGrid && (
              <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
            )}
            
            <div className="relative z-10 text-center font-mono text-[9px] text-white/60 space-y-1">
              <div>Visualizing: {simMode === '3D' ? 'ThreeJS Spherical Globe' : 'Leaflet 2D Mercator Map'}</div>
              <div className="text-cyan animate-pulse">
                {simGrid ? ' Graticule Coordinates Enabled' : ' Coordinates Disabled'}
              </div>
            </div>
            
            {/* Twinkling ocean star mockup */}
            <div className="absolute top-2 left-6 w-1 h-1 bg-white rounded-full animate-ping opacity-60" />
            <div className="absolute bottom-3 right-8 w-1.5 h-1.5 bg-cyan rounded-full animate-pulse" />
          </div>
        </div>
      )
    },
    {
      title: "03 / PASS FORECASTING",
      subtitle: "OVERHEAD OBJECTS & COUNTDOWNS",
      icon: <List className="w-6 h-6 text-cyan" />,
      description: "The Overhead Objects panel displays active satellites crossing your sky, complete with speed, altitude, and visibility indicators. The Next ISS Pass panel renders a live countdown timer showing the precise hours, minutes, and seconds until the space station rises above your horizon.",
      widget: (
        <div className="relative w-full h-44 flex items-center justify-between bg-black/40 rounded-2xl border border-white/5 p-4 overflow-hidden gap-4">
          {/* Scrollable list mockup */}
          <div className="flex-1 h-full border border-white/5 rounded-xl bg-black/50 p-2 space-y-1.5 overflow-hidden font-mono text-[8px]">
            <div className="text-cyan/60 border-b border-white/5 pb-1 uppercase tracking-widest text-[7px] font-bold">OVERHEAD SCAN</div>
            <div className="flex justify-between text-white/80 bg-white/5 p-1 rounded">
              <span>ISS (ZARYA)</span>
              <span className="text-cyan font-bold">7.6 km/s</span>
            </div>
            <div className="flex justify-between text-white/50 p-1">
              <span>STARLINK-3212</span>
              <span>421 km</span>
            </div>
            <div className="flex justify-between text-white/50 p-1">
              <span>CSS (TIANGONG)</span>
              <span>380 km</span>
            </div>
          </div>
          
          {/* Ticking countdown clock mockup */}
          <div className="w-[120px] h-full border border-white/5 rounded-xl bg-black/50 p-3 flex flex-col justify-center items-center font-mono space-y-1">
            <span className="text-[7px] text-white/40 tracking-widest uppercase">NEXT ISS PASS</span>
            <div className="text-sm font-bold text-cyan tracking-widest animate-pulse">02:14:52</div>
            <span className="text-[6px] text-green-400 uppercase bg-green-950/40 border border-green-900/40 px-1.5 py-0.5 rounded-full">
              VISIBLE PASS
            </span>
          </div>
        </div>
      )
    },
    {
      title: "04 / SATELLITE BATTLES",
      subtitle: "HEAD-TO-HEAD DUEL METRICS",
      icon: <Flame className="w-6 h-6 text-cyan" />,
      description: "Choose any two satellites to initiate an orbital battle. Watch their paths split on the map (past track in faded opacity, future in bright). The dashboard computes live Euclidean separation and uses dedicated Web Workers to compute the closest encounter distance and ticking countdown.",
      widget: (
        <div className="relative w-full h-44 flex items-center justify-center bg-black/40 rounded-2xl border border-white/5 overflow-hidden px-4">
          <div className="w-full flex justify-between items-center relative max-w-xs">
            {/* Sat A */}
            <div className="flex flex-col items-center space-y-1">
              <div className="w-9 h-9 rounded-full bg-cyan/10 border border-cyan/30 flex items-center justify-center">
                <span className="text-xs font-mono font-bold text-cyan">A</span>
              </div>
              <span className="text-[8px] font-mono text-white/50 tracking-wider">ISS</span>
            </div>

            {/* Connecting line */}
            <div className="flex-1 h-[1px] bg-gradient-to-r from-cyan/50 via-white/20 to-danger/50 relative mx-2">
              <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 border border-white/10 px-2 py-0.5 rounded text-[8px] font-mono text-white/70 tracking-widest animate-pulse">
                980 km
              </div>
              <div className="absolute inset-0 bg-cyan/20 animate-pulse" />
            </div>

            {/* Sat B */}
            <div className="flex flex-col items-center space-y-1">
              <div className="w-9 h-9 rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center">
                <span className="text-xs font-mono font-bold text-danger">B</span>
              </div>
              <span className="text-[8px] font-mono text-white/50 tracking-wider">TIANGONG</span>
            </div>
            
            {/* Scoreboard Preview */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -mt-6">
              <span className="text-[10px] font-mono font-black italic tracking-widest text-white/25">MIDAS SCORE: 3 - 2</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "05 / CELESTIAL ANALYSIS",
      subtitle: "TONIGHT'S SKY & LOOK UP RADAR",
      icon: <Moon className="w-6 h-6 text-cyan" />,
      description: "Select the Look Up panel to lock on to a satellite and track its coordinates. The circular compass displays real-time Azimuth (degree direction) and Elevation (height above horizon). Toggle Tonight's Sky (Night Report) to review moon phase percentages, visible planets, and forecasted meteor shower counts.",
      widget: (
        <div className="relative w-full h-44 flex items-center justify-between bg-black/40 rounded-2xl border border-white/5 p-4 overflow-hidden gap-4">
          {/* Compass Radar */}
          <div className="w-32 h-32 rounded-full border border-white/10 flex items-center justify-center relative">
            <div className="absolute top-1 font-mono text-[7px] text-white/40">N</div>
            <div className="absolute bottom-1 font-mono text-[7px] text-white/40">S</div>
            <div className="absolute left-1 font-mono text-[7px] text-white/40">W</div>
            <div className="absolute right-1 font-mono text-[7px] text-white/40">E</div>
            
            {/* Dial line */}
            <div className="w-[1px] h-20 bg-cyan/50 origin-bottom rotate-[45deg] relative -mt-10" />
            <div className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full bg-cyan animate-pulse shadow-[0_0_10px_#06b6d4]" />
            <div className="absolute inset-2 rounded-full border border-dashed border-white/5" />
          </div>

          {/* Moon/Night report */}
          <div className="flex-1 h-full border border-white/5 rounded-xl bg-black/50 p-2.5 flex flex-col justify-center space-y-1.5 font-mono text-[8px]">
            <div className="text-cyan/60 uppercase tracking-widest text-[7px] font-bold">NIGHT REPORT</div>
            <div className="flex items-center gap-1.5 text-white/70">
              <span className="text-[10px]">🌗</span>
              <span>Waning Gibbous (68%)</span>
            </div>
            <div className="flex justify-between text-white/55">
              <span>Jupiter Visibility:</span>
              <span className="text-green-400">Excellent</span>
            </div>
            <div className="flex justify-between text-white/55">
              <span>Lyrids Showers:</span>
              <span className="text-cyan font-bold">12/hr</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "06 / SKY RECORD KEEPER",
      subtitle: "OBSERVER JOURNAL & ACHIEVEMENTS",
      icon: <Award className="w-6 h-6 text-cyan" />,
      description: "When observing a satellite overhead, click the 'Log Spotting' button to record the observation into your local encrypted database. Unlock badges (First Contact, Space Explorer, Asteroid Hazard) as you complete logs, and level up your official Observer Rank.",
      widget: (
        <div className="relative w-full h-44 flex items-center justify-center bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex flex-col items-center space-y-2">
            {/* Glowing badge */}
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500/20 to-yellow-300/10 border border-amber-500/40 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.15)]">
              <Award className="w-7 h-7 text-amber-400 animate-pulse" />
              <div className="absolute -inset-1.5 rounded-full border border-amber-500/10 animate-pulse" />
            </div>
            <div className="text-center font-mono">
              <span className="text-[9px] text-amber-400 font-bold uppercase tracking-widest bg-amber-950/50 border border-amber-900/40 px-2 py-0.5 rounded-full">
                RANK UNLOCKED
              </span>
              <p className="text-xs text-white/80 font-bold tracking-wider mt-1">STARGAZER II</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "07 / CORE DIAGNOSTICS & SETTINGS",
      subtitle: "SYSTEM READOUTS & KEY VAULT",
      icon: <Activity className="w-6 h-6 text-cyan" />,
      description: "Open the Diagnostics panel to view live API status (N2YO, CelesTrak, NASA APOD) and monitor active memory and Web Worker threads. Use the Settings panel to add your custom API credential keys, adjust the globe auto-rotation speed, or toggle interface overlays.",
      widget: (
        <div className="relative w-full h-44 flex flex-col justify-between bg-black/40 rounded-2xl border border-white/5 p-3 overflow-hidden gap-2 font-mono text-[7px] text-green-400/90">
          <div className="border-b border-white/5 pb-1 flex justify-between items-center text-white/40 text-[6px] tracking-widest uppercase">
            <span>Core Admin Diagnostics console</span>
            <span className="text-green-500 flex items-center gap-1">
              <span className="w-1 h-1 bg-green-500 rounded-full animate-ping" />
              SYS_OK
            </span>
          </div>
          
          <div className="flex-1 space-y-1">
            <div className="flex justify-between border-b border-white/[0.02] pb-0.5">
              <span>[API] n2yo.com/telemetry_gate_0</span>
              <span className="text-green-500 font-bold">ONLINE (200 OK)</span>
            </div>
            <div className="flex justify-between border-b border-white/[0.02] pb-0.5">
              <span>[THREAD] closest_approach_worker.ts</span>
              <span className="text-cyan font-bold">READY (POOL 1)</span>
            </div>
            <div className="flex justify-between border-b border-white/[0.02] pb-0.5">
              <span>[VAULT] credentials_storage_aes</span>
              <span className="text-white/60 font-bold">ENCRYPTED</span>
            </div>
          </div>
          
          {/* Mock Settings Input Fields */}
          <div className="flex gap-2 border-t border-white/5 pt-1.5">
            <div className="flex-1 h-3 rounded bg-black/60 border border-white/10 flex items-center px-1 text-[6px] text-white/30 truncate">
              VITE_GEMINI_API_KEY=••••••••••••
            </div>
            <div className="px-1.5 py-0.5 rounded bg-cyan/20 border border-cyan/40 text-cyan text-[5px] font-bold uppercase tracking-wider">
              SAVED
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleLaunch();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleLaunch = () => {
    setIsLaunching(true);
    // Play a cinematic launch sequence countdown/effects before completion
    setTimeout(() => {
      onComplete();
    }, 1800);
  };

  if (bootSequence < 3) {
    return (
      <div className="fixed inset-0 bg-[#070a12] z-[9999] flex flex-col justify-center items-center font-mono text-xs text-cyan/70 select-none">
        <div className="w-80 space-y-2 border border-cyan/15 bg-black/40 p-5 rounded-xl backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-cyan rounded-br-lg" />
          <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-cyan rounded-bl-lg" />
          <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-cyan rounded-tr-lg" />
          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-cyan rounded-tl-lg" />
          
          <div className="flex items-center gap-2 text-cyan font-bold tracking-wider mb-3">
            <Cpu className="w-4 h-4 animate-spin-slow" />
            <span>ZENITH BOOT SEQUENCE</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span>CRITICAL ELEMENTS CALIBRATION</span>
              <span className="text-green-400 font-bold">READY</span>
            </div>
            {bootSequence >= 1 && (
              <div className="flex justify-between items-center">
                <span>ORBIT PROPAGATION ENGINE</span>
                <span className="text-green-400 font-bold">CALIBRATED</span>
              </div>
            )}
            {bootSequence >= 2 && (
              <div className="flex justify-between items-center">
                <span>MISSION BRIEFING LAYER</span>
                <span className="text-cyan animate-pulse">DEPLOYING...</span>
              </div>
            )}
          </div>
          
          {/* Micro Progress bar */}
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-4">
            <motion.div 
              className="h-full bg-cyan"
              initial={{ width: 0 }}
              animate={{ width: bootSequence === 1 ? '40%' : bootSequence === 2 ? '80%' : '100%' }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#070a12] z-[9999] flex flex-col justify-center items-center select-none overflow-hidden font-sans">
      
      {/* Cinematic Starfield & Scanlines Background */}
      <div className="absolute inset-0 bg-space-stars opacity-40 pointer-events-none z-0" />
      <div className="absolute inset-0 pointer-events-none z-1 bg-radial-vignette" />
      <div className="absolute inset-0 pointer-events-none z-2"
           style={{
             backgroundImage: 'linear-gradient(rgba(18, 24, 38, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
             backgroundSize: '100% 4px',
           }}
      />

      {/* Cybernetic HUD elements */}
      <div className="absolute top-6 left-6 text-white/20 font-mono text-[9px] uppercase tracking-[0.25em] z-10 flex items-center gap-2">
        <Terminal className="w-3.5 h-3.5" />
        <span>System: SECURE_ONBOARDING_INIT</span>
      </div>
      <div className="absolute bottom-6 right-6 text-white/20 font-mono text-[9px] uppercase tracking-[0.25em] z-10 flex items-center gap-2">
        <Navigation className="w-3.5 h-3.5 animate-pulse text-cyan" />
        <span>LOCATION LOCKED</span>
      </div>

      <AnimatePresence mode="wait">
        {!isLaunching ? (
          <motion.div
            key="briefing-container"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: 'spring', stiffness: 100, damping: 18 }}
            className="w-[90%] max-w-[460px] liquid-glass p-8 rounded-[24px] z-10 shadow-[0_0_50px_rgba(6,182,212,0.1)] flex flex-col items-stretch space-y-6"
          >
            {/* Header / Subtitle row */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-cyan">
                  {slides[currentSlide].icon}
                  <span className="text-[10px] font-mono font-bold tracking-[0.3em] uppercase">
                    {slides[currentSlide].title}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white uppercase"
                    style={{ fontFamily: "'Helvetica Now Var', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                  {slides[currentSlide].subtitle}
                </h2>
              </div>
              
              {/* Slide Counter badge */}
              <div className="px-2.5 py-1 rounded bg-white/5 border border-white/10 font-mono text-[10px] text-white/40 tracking-wider">
                {currentSlide + 1}/{slides.length}
              </div>
            </div>

            {/* Description Text */}
            <div className="min-h-[84px] flex items-center">
              <p className="text-white/60 text-xs md:text-sm leading-relaxed">
                {slides[currentSlide].description}
              </p>
            </div>

            {/* Micro-Animation Widget Wrapper */}
            <div className="w-full relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`widget-${currentSlide}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="w-full"
                >
                  {slides[currentSlide].widget}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer Navigation controls */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5 shrink-0 z-20">
              
              {/* Back Button */}
              {currentSlide > 0 ? (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-xs font-semibold text-white/80 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
              ) : (
                <div /> // Spacing placeholder
              )}

              {/* Dot Indicators */}
              <div className="flex items-center gap-1.5">
                {slides.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      currentSlide === i ? 'w-5 bg-cyan' : 'w-1.5 bg-white/20'
                    }`}
                  />
                ))}
              </div>

              {/* Next/Finish Button */}
              <button
                onClick={handleNext}
                className="px-5 py-2 rounded-full bg-cyan text-black hover:bg-cyan/95 text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.35)] active:scale-95 flex items-center gap-1.5 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] cursor-pointer"
              >
                {currentSlide === slides.length - 1 ? (
                  <>
                    Initialize
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Skip Option */}
            {currentSlide < slides.length - 1 && (
              <button 
                onClick={handleLaunch}
                className="text-[10px] font-mono tracking-widest text-white/30 uppercase text-center hover:text-white/60 transition-colors focus:outline-none cursor-pointer animate-pulse"
              >
                Skip Briefing Sequence
              </button>
            )}
          </motion.div>
        ) : (
          /* Cinematic Launch sequence overlay */
          <motion.div
            key="launch-sequence"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col justify-center items-center space-y-6 z-10"
          >
            {/* Glowing portal pulse */}
            <div className="relative w-20 h-20 rounded-full border-2 border-cyan/40 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-cyan animate-ping opacity-60" />
              <Cpu className="w-8 h-8 text-cyan animate-spin-slow" />
            </div>
            
            <div className="text-center font-mono space-y-2">
              <div className="text-xs text-cyan tracking-[0.3em] font-bold uppercase animate-pulse">
                INITIALIZING MISSION CONTROL
              </div>
              <p className="text-[9px] text-white/40 tracking-[0.25em] uppercase">
                Synchronizing live satellite networks...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
