import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Satellite } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SatelliteSelector({ 
  satellites, 
  selectedSat, 
  onSelect, 
  label = "Select Satellite", 
  side = "left" // 'left' or 'right' for styling 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query) return satellites.slice(0, 50); // limit to 50 initially
    const q = query.toLowerCase();
    return satellites.filter(s => 
      s.satname.toLowerCase().includes(q) || 
      (s.satid && s.satid.toString().includes(q))
    ).slice(0, 50);
  }, [satellites, query]);

  const gradientStr = side === 'left' 
    ? 'linear-gradient(135deg, #4d8dff 0%, #3575d9 100%)' 
    : 'linear-gradient(135deg, #e0584f 0%, #bd3e36 100%)';
  
  const shadowStr = side === 'left'
    ? '0 0 20px rgba(77, 141, 255, 0.4)'
    : '0 0 20px rgba(224, 88, 79, 0.4)';

  return (
    <div ref={ref} className="relative w-full max-w-sm flex flex-col">
      <p className={`text-[10px] font-sans font-bold uppercase tracking-wider mb-2 opacity-80
        ${side === 'left' ? 'text-cyan text-left' : 'text-danger text-right'}`}
      >
        {label}
      </p>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-full h-14 rounded-xl flex items-center justify-between px-4 transition-all duration-300
          border ${isOpen ? 'border-white/40' : 'border-white/10'}`}
        style={{
          background: 'rgba(15, 22, 30, 0.8)',
          backdropFilter: 'blur(12px)',
          boxShadow: selectedSat ? shadowStr : 'none'
        }}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: selectedSat ? gradientStr : 'rgba(255,255,255,0.1)' }}
          >
            <Satellite className="w-4 h-4 text-white" />
          </div>
          <div className={`flex flex-col ${side === 'left' ? 'items-start' : 'items-start'} overflow-hidden`}>
            <span className="font-playfair font-bold text-white text-base truncate">
              {selectedSat ? selectedSat.satname : "Choose Fighter"}
            </span>
            {selectedSat && (
              <span className="text-[10px] font-mono text-white/50 truncate">
                NORAD: {selectedSat.satid}
              </span>
            )}
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute top-[calc(100%+8px)] left-0 w-full z-50 rounded-xl overflow-hidden border border-white/20"
            style={{
              background: 'rgba(10, 14, 22, 0.95)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
            }}
          >
            <div className="p-3 border-b border-white/10 relative">
              <Search className="w-4 h-4 text-white/40 absolute left-6 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search satellite..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
                autoFocus
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto scrollbar-thin">
              {filtered.length === 0 ? (
                <div className="p-4 text-center text-white/50 text-sm">No satellites found</div>
              ) : (
                filtered.map(sat => (
                  <button
                    key={sat.satid}
                    onClick={() => {
                      onSelect(sat);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left border-b border-white/5 last:border-0"
                  >
                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                      <Satellite className="w-3 h-3 text-white/70" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-white truncate">{sat.satname}</span>
                      <span className="text-[10px] text-white/50 font-mono">ID: {sat.satid}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
