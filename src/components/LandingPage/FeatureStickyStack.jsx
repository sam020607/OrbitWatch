import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { BorderTrail } from '../motion-primitives/border-trail.jsx';
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card';

// Radar Widget Component
const RadarWidget = () => (
  <div className="relative w-full h-full flex items-center justify-center bg-slate-950/40 rounded-2xl overflow-hidden border border-white/5">
    {/* Grid Lines */}
    <div className="absolute w-[80%] aspect-square rounded-full border border-white/10 flex items-center justify-center">
      <div className="w-[70%] aspect-square rounded-full border border-white/5 flex items-center justify-center">
        <div className="w-[50%] aspect-square rounded-full border border-white/5"></div>
      </div>
    </div>
    <div className="absolute w-full h-px bg-white/10"></div>
    <div className="absolute w-px h-full bg-white/10"></div>
    
    {/* Radar Sweep */}
    <div className="absolute w-[80%] aspect-square rounded-full overflow-hidden">
      <div 
        className="w-full h-full origin-center animate-spin" 
        style={{ 
          animationDuration: '6s', 
          background: 'conic-gradient(from 0deg, transparent 50%, rgba(58, 123, 217, 0.15) 100%)' 
        }}
      ></div>
    </div>
    
    {/* Glowing Targets */}
    <div className="absolute top-[30%] left-[40%] w-2 h-2 rounded-full bg-cyan-400 animate-ping [animation-duration:2s]"></div>
    <div className="absolute top-[30%] left-[40%] w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
    
    <div className="absolute bottom-[25%] right-[35%] w-2 h-2 rounded-full bg-blue-500 animate-ping [animation-duration:3s]"></div>
    <div className="absolute bottom-[25%] right-[35%] w-1.5 h-1.5 rounded-full bg-blue-500"></div>
    
    {/* Sweep Line */}
    <span className="absolute bottom-4 left-4 text-[9px] font-mono text-cyan-400/70 tracking-widest uppercase">SCANNING...</span>
  </div>
);

// Telemetry Widget Component
const TelemetryWidget = () => {
  const [coords, setCoords] = useState({ lat: "40.7128", lon: "-74.0060", alt: "418.2" });
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCoords({
        lat: (40.7128 + (Math.random() - 0.5) * 0.01).toFixed(4),
        lon: (-74.0060 + (Math.random() - 0.5) * 0.01).toFixed(4),
        alt: (418.2 + (Math.random() - 0.5) * 0.5).toFixed(1)
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full p-4 flex flex-col justify-between bg-slate-950/40 rounded-2xl border border-white/5 font-mono text-xs text-white/60">
      <div className="flex justify-between border-b border-white/10 pb-2">
        <span className="text-[9px] text-white/40">TELEMETRY STREAM</span>
        <span className="text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> LIVE
        </span>
      </div>
      
      <div className="space-y-1.5 py-3">
        <div className="flex justify-between">
          <span className="text-[10px] text-white/40">LATITUDE</span>
          <span className="text-white font-bold">{coords.lat}° N</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] text-white/40">LONGITUDE</span>
          <span className="text-white font-bold">{coords.lon}° W</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] text-white/40">ALTITUDE</span>
          <span className="text-cyan-400 font-bold">{coords.alt} KM</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] text-white/40">VELOCITY</span>
          <span className="text-white font-bold">27,584 KM/H</span>
        </div>
      </div>
      
      {/* Animated Waveform */}
      <div className="h-10 w-full flex items-end gap-0.5 overflow-hidden pt-2 border-t border-white/5">
        {[...Array(24)].map((_, idx) => (
          <div 
            key={idx}
            className="flex-1 bg-cyan-500/40 rounded-t"
            style={{ 
              height: `${15 + Math.sin(idx * 0.5) * 20 + Math.random() * 25}%`,
              transition: 'height 0.3s ease'
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

// Fact Widget Component (3D Galaxy Constellation Wireframe)
const FactWidget = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-950/40 rounded-2xl border border-white/5 overflow-hidden">
      <div className="absolute w-[80%] aspect-square rounded-full border border-dashed border-white/5 animate-spin [animation-duration:30s]"></div>
      <div className="absolute w-[60%] aspect-square rounded-full border border-dashed border-white/10 animate-spin [animation-duration:15s] [animation-direction:reverse]"></div>
      
      <svg className="w-[85%] h-[85%] absolute rotate-12" viewBox="0 0 100 100">
        {/* Constellation Lines */}
        <line x1="20" y1="35" x2="40" y2="45" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        <line x1="40" y1="45" x2="65" y2="35" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        <line x1="65" y1="35" x2="80" y2="60" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        <line x1="40" y1="45" x2="50" y2="75" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        <line x1="50" y1="75" x2="80" y2="60" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        
        {/* Stars */}
        <circle cx="20" cy="35" r="1.5" fill="#fff" className="animate-pulse" />
        <circle cx="40" cy="45" r="2" fill="var(--accent, #3a7bd9)" />
        <circle cx="65" cy="35" r="1.5" fill="#fff" className="animate-pulse" />
        <circle cx="80" cy="60" r="2.5" fill="var(--accent, #3a7bd9)" />
        <circle cx="50" cy="75" r="2" fill="#fff" />
      </svg>
      
      <div className="text-center z-10 px-3 bg-slate-950/60 py-2 rounded-xl backdrop-blur-md border border-white/10 max-w-[90%]">
        <span className="text-[8px] font-mono tracking-widest text-cyan-400 block mb-0.5 font-bold">COSMIC DATA</span>
        <span className="text-[10px] text-white/90 font-sans italic leading-tight">Light takes 8.3 minutes to travel from Sun to Earth</span>
      </div>
    </div>
  );
};

// APOD Widget Component
const APODWidget = () => (
  <div className="relative w-full h-full rounded-2xl border border-white/5 overflow-hidden group">
    {/* Deep Space Background */}
    <div 
      className="absolute inset-0 bg-cover bg-center transition-transform duration-[4000ms] group-hover:scale-110"
      style={{ 
        backgroundImage: `url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=400&q=80')`,
        filter: 'brightness(0.65)'
      }}
    ></div>
    
    {/* HUD Overlay */}
    <div className="absolute inset-0 p-3 flex flex-col justify-between border border-white/10 rounded-2xl pointer-events-none font-mono text-[9px] text-white/60">
      <div className="flex justify-between items-start">
        <span>CAM_01 // APOD</span>
        <span className="text-red-500 animate-pulse font-bold">● REC</span>
      </div>
      
      {/* Viewfinder Target */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
        <div className="absolute w-4 h-px bg-white/40"></div>
        <div className="absolute h-4 w-px bg-white/40"></div>
        <div className="w-7 h-7 rounded-full border border-white/20 border-dashed"></div>
      </div>
      
      <div className="flex justify-between items-end">
        <span>ISO 1200</span>
        <span>F/4.0</span>
      </div>
    </div>
  </div>
);

// Moon/Star Widget Component
const MoonWidget = () => (
  <div className="relative w-full h-full flex items-center justify-center bg-slate-950/40 rounded-2xl border border-white/5 overflow-hidden">
    {/* Moon Shape */}
    <div className="relative w-20 h-20 rounded-full bg-slate-900 border border-white/5 overflow-hidden flex items-center">
      {/* Light Side */}
      <div className="absolute right-0 w-10 h-20 bg-slate-100/90 shadow-[inset_-6px_0_12px_rgba(255,255,255,0.7)]"></div>
      {/* Crater Details */}
      <div className="absolute w-2.5 h-2.5 rounded-full bg-black/10 top-[20%] right-[30%]"></div>
      <div className="absolute w-3.5 h-3.5 rounded-full bg-black/10 top-[50%] right-[15%]"></div>
      <div className="absolute w-2 h-2 rounded-full bg-black/10 bottom-[20%] right-[25%]"></div>
    </div>
    
    {/* Compass Ring */}
    <div className="absolute w-[85%] aspect-square rounded-full border border-white/5 flex justify-center items-start text-[8px] font-mono text-white/30 pt-1 pointer-events-none">
      <span>N</span>
    </div>
  </div>
);

// Observer Badge Widget Component
const JournalWidget = () => (
  <div className="relative w-full h-full flex flex-col justify-center items-center p-4 bg-slate-950/40 rounded-2xl border border-white/5">
    {/* Holographic Badge */}
    <div className="w-16 h-16 relative flex items-center justify-center">
      {/* Hexagon Outer */}
      <div 
        className="absolute inset-0 bg-cyan-500/5 border border-cyan-500/30 rounded-xl rotate-45"
        style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
      ></div>
      {/* Inner Ring */}
      <div className="w-12 h-12 rounded-full border border-dashed border-cyan-500/40 flex items-center justify-center animate-spin" style={{ animationDuration: '15s' }}></div>
      <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/40 absolute flex items-center justify-center">
        <span className="text-white text-xs font-bold font-mono">01</span>
      </div>
    </div>
    
    <h5 className="text-white font-mono text-[10px] font-bold uppercase tracking-wider mt-3">PILOT LOG ACTIVE</h5>
    <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden max-w-[100px]">
      <div className="bg-cyan-500 h-full w-[65%]"></div>
    </div>
    <span className="text-[8px] font-mono text-cyan-400/70 mt-1 uppercase">65% TO SPECIALIST</span>
  </div>
);

const renderWidget = (widgetType) => {
  switch (widgetType) {
    case 'radar': return <RadarWidget />;
    case 'telemetry': return <TelemetryWidget />;
    case 'fact': return <FactWidget />;
    case 'apod': return <APODWidget />;
    case 'visible': return <MoonWidget />;
    case 'journal': return <JournalWidget />;
    default: return null;
  }
};

const FEATURES = [
  {
    title: "Live Tracking",
    subtitle: "ORBITAL CORRELATION",
    description: "Track active satellites, rocket stages, constellations (Starlink, OneWeb), and near-Earth asteroids in real time with high-precision propagation models.",
    details: [
      { label: "Active Satellites", value: "6,400+" },
      { label: "Tracked Asteroids", value: "1,200+" },
      { label: "Update Rate", value: "10Hz" }
    ],
    widget: "radar"
  },
  {
    title: "Real-Time Telemetry",
    subtitle: "DATA STREAMS",
    description: "Access instantaneous altitude, velocity, latitude, longitude, and elevation angle details for any selected object in the sky above you.",
    details: [
      { label: "Velocity Accuracy", value: "±0.1 m/s" },
      { label: "Orbit Types", value: "LEO, MEO, GEO" },
      { label: "Data Latency", value: "<150ms" }
    ],
    widget: "telemetry"
  },
  {
    title: "Space Fact of the Moment",
    subtitle: "COSMIC DATA ARCHIVE",
    description: "Expand your cosmic knowledge with fascinating, verified astronomical and spaceflight trivia selected from our rotating database.",
    details: [
      { label: "Database Size", value: "500+ Facts" },
      { label: "Sources", value: "NASA, ESA, IAU" },
      { label: "Refresh", value: "On Load" }
    ],
    widget: "fact"
  },
  {
    title: "NASA APOD Feature",
    subtitle: "ASTRONOMY PICTURE OF THE DAY",
    description: "Explore the universe through the eyes of NASA's astronomers. View the daily featured image with complete scientific descriptions and historical context.",
    details: [
      { label: "Image Quality", value: "HD / RAW" },
      { label: "Archive Depth", value: "28 Years" },
      { label: "API Integration", value: "NASA Open API" }
    ],
    widget: "apod"
  },
  {
    title: "What's Visible Tonight",
    subtitle: "LOCAL SKY OBSERVATION",
    description: "Know exactly when and where to look. Get precise local pass predictions, moon phases, and visibility ratings for planets and key constellations.",
    details: [
      { label: "Moon Phase", value: "Waxing Gibbous" },
      { label: "Next Major Pass", value: "ISS (21:40)" },
      { label: "Sight Rating", value: "Optimal" }
    ],
    widget: "visible"
  },
  {
    title: "Observer Journal",
    subtitle: "PILOT LOG & LOGBOOK",
    description: "Log your real-world sightings, submit photos, track celestial events you've witnessed, level up your observer rank, and earn specialized mission badges.",
    details: [
      { label: "Observer Rank", value: "Specialist" },
      { label: "Unlocked Badges", value: "12 / 40" },
      { label: "Next Milestone", value: "ISS Spotter" }
    ],
    widget: "journal"
  }
];

const StickyCard = ({
  i,
  title,
  subtitle,
  description,
  details,
  widget,
  progress,
  range,
  targetScale,
}) => {
  const container = useRef(null);
  
  // Custom spring mapping for ultra-smooth fluid inertia
  const rawScale = useTransform(progress, range, [1, targetScale]);
  const scale = useSpring(rawScale, { damping: 35, stiffness: 65, mass: 0.1 });

  return (
    <div
      ref={container}
      className="sticky top-0 h-[100vh] flex items-center justify-center pointer-events-none"
    >
      <CardContainer 
        containerClassName="py-0 w-full flex justify-center items-center pointer-events-none" 
        className="w-[92%] max-w-[760px] pointer-events-auto"
      >
        <motion.div
          style={{
            scale,
            y: i * 22,
            transformStyle: "preserve-3d",
          }}
          className="w-full flex"
        >
          <CardBody className="relative flex flex-col md:flex-row w-full min-h-[460px] md:min-h-[350px] h-auto md:h-[350px] origin-top overflow-hidden border border-white/10 rounded-[28px] bg-slate-950/75 backdrop-blur-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-6 md:p-8">
            <BorderTrail
              className="bg-gradient-to-l from-cyan-300 via-blue-500 to-cyan-300 dark:from-cyan-400 dark:via-blue-500 dark:to-blue-700"
              size={120}
            />
            {/* Left Column: Info */}
            <div className="flex-1 flex flex-col justify-between h-full pr-0 md:pr-6 [transform-style:preserve-3d]">
              <div>
                <CardItem translateZ="20" className="flex items-center gap-2 mb-2 w-full">
                  <span className="text-[9px] font-mono tracking-[0.25em] text-cyan-400 uppercase">{subtitle}</span>
                  <span className="text-[9px] font-mono text-white/20">// 0{i + 1}</span>
                </CardItem>
                <CardItem translateZ="40" className="block w-full">
                  <h3 className="text-xl md:text-2xl font-sans font-light tracking-tight text-white mb-3">
                    {title}
                  </h3>
                </CardItem>
                <CardItem translateZ="30" className="block w-full">
                  <p className="text-white/60 text-xs md:text-sm leading-relaxed font-light">
                    {description}
                  </p>
                </CardItem>
              </div>
              
              <CardItem translateZ="30" className="grid grid-cols-3 gap-3 border-t border-white/5 pt-4 mt-4 w-full">
                {details.map((d, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="text-[8px] font-mono text-white/30 uppercase tracking-wider">{d.label}</span>
                    <span className="text-[11px] md:text-xs font-sans font-semibold text-white mt-0.5">{d.value}</span>
                  </div>
                ))}
              </CardItem>
            </div>

            {/* Right Column: Mini Dashboard Interactive Graphic */}
            <CardItem translateZ="50" className="w-full md:w-[240px] h-[150px] md:h-full mt-4 md:mt-0 flex-shrink-0 [transform-style:preserve-3d]">
              {renderWidget(widget)}
            </CardItem>
          </CardBody>
        </motion.div>
      </CardContainer>
    </div>
  );
};

export default function FeatureStickyStack() {
  const container = useRef(null);
  
  // Track scroll position over the height of the component
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={container} className="relative w-full flex flex-col items-center">
      {/* Scroll indicator block */}
      <div className="w-full max-w-4xl px-6 pt-16 pb-12 flex flex-col items-center text-center">
        <span className="text-[10px] font-mono tracking-[0.35em] text-cyan-400/80 uppercase mb-2">
          SYSTEM MATRIX
        </span>
        <h2 className="text-2xl md:text-4xl font-sans font-light tracking-tight text-white mb-4">
          Core Capabilities Stack
        </h2>
        <span className="text-[10px] uppercase text-white/40 tracking-wider flex items-center gap-1.5">
          Scroll to unfold features <span className="animate-bounce">↓</span>
        </span>
      </div>

      {/* Sticky Deck Container */}
      <div className="w-full relative">
        {FEATURES.map((feat, i) => {
          // Cards scale down slightly as they stack to create 3D depth
          const targetScale = Math.max(0.75, 1 - (FEATURES.length - i - 1) * 0.04);
          
          // Map scroll progress range for this card
          const start = i * 0.15;
          
          return (
            <StickyCard
              key={`feat_${i}`}
              i={i}
              {...feat}
              progress={scrollYProgress}
              range={[start, 1]}
              targetScale={targetScale}
            />
          );
        })}
      </div>
      
      {/* Spacer to allow scrolling through the sticky state */}
      <div className="h-[120vh] pointer-events-none"></div>
    </div>
  );
}
