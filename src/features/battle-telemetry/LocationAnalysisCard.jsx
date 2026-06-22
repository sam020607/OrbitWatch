import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, Eye, Clock } from 'lucide-react';
import { formatCountdown, formatDuration } from '../../utils/orbitMath';

export default function LocationAnalysisCard({
  lat,
  lon,
  satA,
  satB,
  passA,
  passB,
  onClose
}) {
  // Local state for ticking countdowns
  const [countdownA, setCountdownA] = useState(0);
  const [countdownB, setCountdownB] = useState(0);

  useEffect(() => {
    if (passA && passA.nextPass !== null) {
      setCountdownA(Math.ceil(passA.nextPass));
    } else {
      setCountdownA(0);
    }
  }, [passA]);

  useEffect(() => {
    if (passB && passB.nextPass !== null) {
      setCountdownB(Math.ceil(passB.nextPass));
    } else {
      setCountdownB(0);
    }
  }, [passB]);

  // Handle client-side countdown timer ticking
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownA(c => Math.max(0, c - 1));
      setCountdownB(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div 
      className="absolute bottom-4 left-4 right-4 sm:left-6 sm:bottom-6 sm:right-auto sm:w-[360px] z-[500] rounded-2xl overflow-hidden border border-white/10"
      style={{
        background: 'rgba(10, 14, 22, 0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/2">
        <div className="flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-cyan" />
          <span className="text-[10px] font-mono text-white/80 font-bold uppercase tracking-wider">
            Location: {lat.toFixed(3)}°N, {lon.toFixed(3)}°E
          </span>
        </div>
        <button 
          onClick={onClose}
          className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        <p className="text-[9px] font-sans text-white/40 uppercase tracking-widest mb-1">
          Pass Prediction (Next 24h)
        </p>

        {/* Sat A Row */}
        <div className="flex flex-col p-3 rounded-xl bg-[#121824]/60 border border-[#4d8dff]/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#4d8dff] font-playfair truncate max-w-[150px]">
              {satA?.satname || 'Satellite A'}
            </span>
            <span className="text-[8px] font-mono text-white/30 uppercase">FIGHTER 1</span>
          </div>
          {passA && passA.nextPass !== null ? (
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-white/30 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[8px] text-white/30 uppercase tracking-wider font-sans">Next Pass</span>
                  <span className="text-xs font-mono font-bold text-white">
                    {countdownA === 0 ? 'OVERHEAD' : formatCountdown(countdownA)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-white/30 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[8px] text-white/30 uppercase tracking-wider font-sans">Duration</span>
                  <span className="text-xs font-mono font-bold text-white">
                    {formatDuration(passA.visibility || 0)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <span className="text-[10px] font-mono text-white/30 mt-1 italic">
              No passes predicted in the next 24h
            </span>
          )}
        </div>

        {/* Sat B Row */}
        <div className="flex flex-col p-3 rounded-xl bg-[#121824]/60 border border-[#e0584f]/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#e0584f] font-playfair truncate max-w-[150px]">
              {satB?.satname || 'Satellite B'}
            </span>
            <span className="text-[8px] font-mono text-white/30 uppercase">FIGHTER 2</span>
          </div>
          {passB && passB.nextPass !== null ? (
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-white/30 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[8px] text-white/30 uppercase tracking-wider font-sans">Next Pass</span>
                  <span className="text-xs font-mono font-bold text-white">
                    {countdownB === 0 ? 'OVERHEAD' : formatCountdown(countdownB)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-white/30 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[8px] text-white/30 uppercase tracking-wider font-sans">Duration</span>
                  <span className="text-xs font-mono font-bold text-white">
                    {formatDuration(passB.visibility || 0)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <span className="text-[10px] font-mono text-white/30 mt-1 italic">
              No passes predicted in the next 24h
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
