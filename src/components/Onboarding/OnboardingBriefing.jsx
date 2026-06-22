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
  CheckCircle2
} from 'lucide-react';

export default function OnboardingBriefing({ onComplete, observerLocation }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);
  const [bootSequence, setBootSequence] = useState(0); // For startup glitches

  // Startup boot logs simulation
  useEffect(() => {
    const timer1 = setTimeout(() => setBootSequence(1), 300);
    const timer2 = setTimeout(() => setBootSequence(2), 700);
    const timer3 = setTimeout(() => setBootSequence(3), 1100);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const slides = [
    {
      title: "SYSTEM INITIALIZATION",
      subtitle: "COORDINATES LOCKED",
      icon: <Compass className="w-6 h-6 text-cyan" />,
      description: "Welcome to Project Zenith Control Terminal. Your ground station coordinates have been successfully calibrated. You are now synced with global satellite ephemeris streams.",
      widget: (
        <div className="relative w-full h-44 flex flex-col items-center justify-center bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
          {/* Pulsing radar lines */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div className="w-32 h-32 rounded-full border border-cyan animate-ping" />
            <div className="absolute w-24 h-24 rounded-full border border-cyan/60 animate-pulse" />
            <div className="absolute w-12 h-12 rounded-full border border-cyan/40" />
          </div>
          
          {/* Tech readout */}
          <div className="relative z-10 font-mono text-center space-y-1.5 p-4">
            <div className="text-[10px] text-cyan/70 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Telemetry Link: STABLE
            </div>
            <div className="text-sm font-bold text-white tracking-widest">
              LAT: {observerLocation?.lat?.toFixed(4) || "0.0000"}°
            </div>
            <div className="text-sm font-bold text-white tracking-widest">
              LON: {observerLocation?.lon?.toFixed(4) || "0.0000"}°
            </div>
            <div className="text-[9px] text-white/40 uppercase tracking-wider">
              Station ID: {observerLocation?.name || "GENERIC_OBSERVER"}
            </div>
          </div>
          
          {/* Subtle grid decoration */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        </div>
      )
    },
    {
      title: "ORBITAL TELEMETRY",
      subtitle: "REAL-TIME TRACKING MAPS",
      icon: <Globe className="w-6 h-6 text-cyan" />,
      description: "Track space infrastructure across standard 2D projections or fully interactive 3D globes. Observe ground footprint overlaps, visibility ranges, and orbital path predictions.",
      widget: (
        <div className="relative w-full h-44 flex items-center justify-center bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
          {/* Simulated orbit path and satellite */}
          <div className="relative w-36 h-36 rounded-full border border-dashed border-white/20 flex items-center justify-center">
            {/* The Earth globe */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan/20 to-blue-600/40 border border-cyan/30 flex items-center justify-center relative shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              <Globe className="w-8 h-8 text-cyan/40 animate-pulse" />
            </div>
            
            {/* Rotating satellite indicator */}
            <motion.div 
              className="absolute w-full h-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-cyan shadow-[0_0_10px_#06b6d4] relative">
                  <div className="absolute -inset-1 rounded-full border border-cyan/60 animate-ping" />
                </div>
                <span className="text-[7px] font-mono text-cyan tracking-widest mt-1 bg-black/80 px-1 rounded border border-cyan/20">SAT-1</span>
              </div>
            </motion.div>
          </div>
        </div>
      )
    },
    {
      title: "SATELLITE BATTLES",
      subtitle: "HEAD-TO-HEAD DUEL METRICS",
      icon: <Zap className="w-6 h-6 text-cyan" />,
      description: "Initiate comparisons between any two spacecraft. Analyze Euclidean separation, compute closest approaches using background Web Workers, and review scores across 5 core orbit categories.",
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
            
            {/* Pulsing VS badge in background */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -mt-6">
              <span className="text-[10px] font-mono font-black italic tracking-widest text-white/25">VS ARENA</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "OBSERVER JOURNAL",
      subtitle: "ASTRONOMICAL RECORD KEEPER",
      icon: <Award className="w-6 h-6 text-cyan" />,
      description: "Log your real-world sightings directly into your encrypted browser database. Earn achievements, track planet visibilities, and climb the observer ranks.",
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
            <div className="min-h-[72px] flex items-center">
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
                  className="px-4 py-2 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-xs font-semibold text-white/80 transition-all active:scale-95 flex items-center gap-2"
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
                className="text-[10px] font-mono tracking-widest text-white/30 uppercase text-center hover:text-white/60 transition-colors focus:outline-none cursor-pointer"
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
