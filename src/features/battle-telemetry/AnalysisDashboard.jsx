import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Globe, Zap, ShieldAlert, Radio } from 'lucide-react';
import { formatCountdown } from '../../utils/orbitMath';

export function AnimatedCounter({ value, decimals = 1, unit = '' }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = displayValue;
    const end = value || 0;
    const duration = 800; // 800ms
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress * (2 - progress); // easeOutQuad
      const current = start + (end - start) * ease;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setDisplayValue(end);
      }
    }

    requestAnimationFrame(update);
  }, [value]);

  return (
    <span>
      {displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {unit && <span className="text-sm font-sans text-white/40 ml-1">{unit}</span>}
    </span>
  );
}

export function CircularProgressRing({ percentage, color = '#4d8dff', size = 70 }) {
  const radius = size * 0.4;
  const strokeWidth = size * 0.08;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: 1, ease: 'easeOut' }}
        strokeLinecap="round"
      />
    </svg>
  );
}

// Function to classify orbit based on altitude and eccentricity
function classifyOrbit(alt, ecc) {
  if (ecc >= 0.25) return 'HEO';
  if (alt < 2000) return 'LEO';
  if (alt >= 2000 && alt < 35000) return 'MEO';
  if (alt >= 35000 && alt < 36500) return 'GEO';
  return 'HEO';
}

function getOrbitFullName(type) {
  switch (type) {
    case 'LEO': return 'Low Earth Orbit';
    case 'MEO': return 'Medium Earth Orbit';
    case 'GEO': return 'Geostationary Orbit';
    case 'HEO': return 'Highly Elliptical Orbit';
    default: return 'Satellite Orbit';
  }
}

export default function AnalysisDashboard({
  satA,
  satB,
  paramsA,
  paramsB,
  similarity,
  overlap,
  currentSeparation: liveSep,
  closestApproach
}) {
  const classA = useMemo(() => classifyOrbit(paramsA?.alt || 0, paramsA?.ecc || 0), [paramsA]);
  const classB = useMemo(() => classifyOrbit(paramsB?.alt || 0, paramsB?.ecc || 0), [paramsB]);

  const [caCountdown, setCaCountdown] = useState(0);

  // Sync closest approach countdown
  useEffect(() => {
    if (closestApproach) {
      setCaCountdown(Math.ceil(closestApproach.timeUntil));
    }
  }, [closestApproach]);

  // Client-side ticking for countdown
  useEffect(() => {
    if (caCountdown <= 0) return;
    const timer = setInterval(() => {
      setCaCountdown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [caCountdown]);

  // Dynamic comments
  const similarityComment = useMemo(() => {
    if (similarity >= 90) return 'Near-identical paths';
    if (similarity >= 70) return 'Highly comparable';
    if (similarity >= 40) return 'Moderate overlap';
    return 'Divergent orbits';
  }, [similarity]);

  const overlapComment = useMemo(() => {
    if (overlap <= 0.1) return 'No Footprint Intersection';
    if (overlap >= 99.9) return 'Full Footprint Intersection';
    return 'Sweeping Shared Terrains';
  }, [overlap]);

  return (
    <div className="w-full flex flex-col relative z-10 p-4 sm:p-6 md:p-8 bg-[#0a0d15]/40 backdrop-blur-md border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden">
      
      {/* Decorative radar background */}
      <div className="absolute -right-20 -bottom-20 w-80 h-80 opacity-[0.03] pointer-events-none">
        <div className="radar-sweep-line w-full h-full" />
      </div>

      {/* Header with Classification Badges */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 border-b border-white/5 pb-4">
        {/* Sat A Badge */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-[#4d8dff] shadow-[0_0_8px_#4d8dff]" />
          <div className="flex flex-col text-left">
            <span className="font-playfair font-bold text-sm text-white">{satA?.satname}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-[#4d8dff]/15 text-[#4d8dff] border border-[#4d8dff]/30 tracking-wider">
                {classA}
              </span>
              <span className="text-[9px] font-sans text-white/40">{getOrbitFullName(classA)}</span>
            </div>
          </div>
        </div>

        {/* VS Label */}
        <div className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] font-bold">
          vs Analysis
        </div>

        {/* Sat B Badge */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end text-right sm:text-right">
          <div className="flex flex-col text-right">
            <span className="font-playfair font-bold text-sm text-white">{satB?.satname}</span>
            <div className="flex items-center gap-1.5 mt-0.5 justify-end">
              <span className="text-[9px] font-sans text-white/40">{getOrbitFullName(classB)}</span>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-[#e0584f]/15 text-[#e0584f] border border-[#e0584f]/30 tracking-wider">
                {classB}
              </span>
            </div>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#e0584f] shadow-[0_0_8px_#e0584f]" />
        </div>
      </div>

      {/* Grid of 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: Orbit Similarity */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col p-4 rounded-xl border border-white/5 bg-[#121824]/40 hover:border-white/10 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest font-sans flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan" /> Orbit Similarity
            </span>
            <span className="text-[9px] font-mono text-cyan bg-cyan/10 px-1.5 py-0.5 rounded">MATCH RATE</span>
          </div>
          <div className="flex items-baseline mt-1">
            <span className="font-mono text-3xl font-bold text-white">
              <AnimatedCounter value={similarity} decimals={1} unit="%" />
            </span>
          </div>
          <span className="text-[10px] font-sans text-white/40 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan/60" />
            {similarityComment}
          </span>
        </motion.div>

        {/* Card 2: Coverage Overlap */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col p-4 rounded-xl border border-white/5 bg-[#121824]/40 hover:border-white/10 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest font-sans flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#3fd6a0]" /> Coverage Overlap
            </span>
            <span className="text-[9px] font-mono text-[#3fd6a0] bg-[#3fd6a0]/10 px-1.5 py-0.5 rounded">SHARED AREA</span>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <div className="shrink-0">
              <CircularProgressRing percentage={overlap} color="#3fd6a0" size={50} />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-3xl font-bold text-white">
                <AnimatedCounter value={overlap} decimals={1} unit="%" />
              </span>
              <span className="text-[10px] font-sans text-white/40 mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3fd6a0]/60" />
                {overlapComment}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Closest Encounter */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-col p-4 rounded-xl border border-white/5 bg-[#121824]/40 hover:border-white/10 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest font-sans flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-danger animate-pulse" /> Closest Encounter
            </span>
            <span className="text-[9px] font-mono text-danger bg-danger/10 px-1.5 py-0.5 rounded">FORECAST</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-2xl font-bold text-white truncate">
              {closestApproach ? (
                <AnimatedCounter value={closestApproach.distanceKm} decimals={1} unit=" km" />
              ) : (
                '-- km'
              )}
            </span>
            <span className="text-[10px] font-mono text-white/50 mt-1 flex items-center gap-1.5">
              <span className="text-[9px] text-white/30 uppercase tracking-wider">Countdown:</span>
              <span className="text-danger font-bold text-xs tracking-wider">
                {closestApproach ? formatCountdown(caCountdown) : '00:00:00'}
              </span>
            </span>
          </div>
        </motion.div>

        {/* Card 4: Current Separation */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-col p-4 rounded-xl border border-white/5 bg-[#121824]/40 hover:border-white/10 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest font-sans flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-white/60 animate-pulse" /> Current Separation
            </span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4d8dff] animate-ping" />
              <span className="text-[8px] font-mono text-[#4d8dff] bg-[#4d8dff]/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Live 1Hz</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-2xl font-bold text-[#4d8dff]">
              <AnimatedCounter value={liveSep} decimals={1} unit=" km" />
            </span>
            <span className="text-[10px] font-sans text-white/40 mt-1.5">
              Instantaneous Euclidean distance between ECI vectors
            </span>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
