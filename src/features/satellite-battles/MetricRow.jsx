import React from 'react';
import { motion } from 'framer-motion';

export default function MetricRow({ metric }) {
  const { valA, valB, diff, winner, label, unit, higherIsBetter } = metric;
  
  // Calculate relative percentages for progress bars
  const maxVal = Math.max(valA, valB);
  // Prevent division by zero
  const safeMax = maxVal > 0 ? maxVal : 1; 
  
  const pctA = Math.max(5, (valA / safeMax) * 100);
  const pctB = Math.max(5, (valB / safeMax) * 100);

  // Format values
  const formatVal = (v) => {
    if (v === null || v === undefined) return '--';
    if (v > 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
    return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const strA = formatVal(valA);
  const strB = formatVal(valB);
  const diffStr = Math.abs(diff).toLocaleString(undefined, { maximumFractionDigits: 1 });

  return (
    <div className="w-full flex flex-col mb-6">
      {/* Label and Difference Badge */}
      <div className="flex items-center justify-center relative mb-2">
        <h3 className="text-white/60 font-sans text-[11px] font-bold uppercase tracking-[0.2em] z-10 bg-[#0a0d15] px-4">
          {label}
        </h3>
        {/* Horizontal dividing line behind label */}
        <div className="absolute w-full h-[1px] bg-white/5 top-1/2 -translate-y-1/2" />
        
        {/* Diff badge - positioned in center, above the line slightly */}
        <div className="absolute top-1/2 -translate-y-1/2 mt-4 z-20">
          <div className="bg-black/60 backdrop-blur-sm border border-white/10 px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider"
               style={{ 
                 color: winner === 'A' ? '#4d8dff' : (winner === 'B' ? '#e0584f' : 'white') 
               }}>
            Δ {diffStr} {unit}
          </div>
        </div>
      </div>

      {/* Bars Container */}
      <div className="flex items-center justify-between w-full gap-4 mt-2">
        
        {/* Left Side (A) */}
        <div className="flex-1 flex flex-col items-end">
          <span className={`font-mono text-xl font-bold mb-1 ${winner === 'A' ? 'text-white' : 'text-white/50'}`}>
            {strA} <span className="text-xs text-white/30">{unit}</span>
          </span>
          <div className="w-full h-3 bg-white/5 rounded-l-full overflow-hidden flex justify-end">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${pctA}%` }}
              transition={{ duration: 1, type: "spring", bounce: 0.2 }}
              className="h-full rounded-l-full relative"
              style={{ 
                background: winner === 'A' ? 'linear-gradient(90deg, #3575d9 0%, #4d8dff 100%)' : '#334155',
                boxShadow: winner === 'A' ? '0 0 10px rgba(77, 141, 255, 0.5)' : 'none'
              }}
            >
              {winner === 'A' && (
                <motion.div 
                  className="absolute inset-0 bg-white opacity-20"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                />
              )}
            </motion.div>
          </div>
        </div>

        {/* VS Divider */}
        <div className="shrink-0 w-8 flex justify-center text-white/20 font-black italic text-sm pt-4">
          VS
        </div>

        {/* Right Side (B) */}
        <div className="flex-1 flex flex-col items-start">
          <span className={`font-mono text-xl font-bold mb-1 ${winner === 'B' ? 'text-white' : 'text-white/50'}`}>
            {strB} <span className="text-xs text-white/30">{unit}</span>
          </span>
          <div className="w-full h-3 bg-white/5 rounded-r-full overflow-hidden flex justify-start">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${pctB}%` }}
              transition={{ duration: 1, type: "spring", bounce: 0.2 }}
              className="h-full rounded-r-full relative"
              style={{ 
                background: winner === 'B' ? 'linear-gradient(270deg, #bd3e36 0%, #e0584f 100%)' : '#334155',
                boxShadow: winner === 'B' ? '0 0 10px rgba(224, 88, 79, 0.5)' : 'none'
              }}
            >
              {winner === 'B' && (
                <motion.div 
                  className="absolute inset-0 bg-white opacity-20"
                  animate={{ x: ['100%', '-100%'] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                />
              )}
            </motion.div>
          </div>
        </div>

      </div>
    </div>
  );
}
