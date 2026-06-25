import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

export default function ScoreBoard({ satA, satB, scoreResult }) {
  const { categories, scoreA, scoreB, overallWinner } = scoreResult;

  const satAName = satA?.satname || 'FIGHTER A';
  const satBName = satB?.satname || 'FIGHTER B';

  return (
    <div className="w-full flex flex-col p-4 sm:p-6 md:p-8 bg-[#0a0d15]/40 backdrop-blur-md border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden mt-4">
      
      {/* Overall Score Header */}
      <div className="flex flex-col items-center justify-center mb-8">
        <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.25em] mb-2">Tactical Scoreboard</span>
        <div className="flex items-center gap-2 sm:gap-6 select-none">
          <span className="font-playfair font-black text-white/40 text-xs sm:text-lg uppercase tracking-wider text-right max-w-[70px] sm:max-w-[150px] truncate">
            {satAName}
          </span>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <span 
              className="font-mono text-3xl sm:text-5xl font-black transition-all"
              style={{
                color: overallWinner === 'A' ? '#4d8dff' : 'rgba(255,255,255,0.7)',
                textShadow: overallWinner === 'A' ? '0 0 15px rgba(77, 141, 255, 0.6)' : 'none'
              }}
            >
              {scoreA}
            </span>
            <span className="font-sans text-white/20 text-xl sm:text-3xl font-light">—</span>
            <span 
              className="font-mono text-3xl sm:text-5xl font-black transition-all"
              style={{
                color: overallWinner === 'B' ? '#e0584f' : 'rgba(255,255,255,0.7)',
                textShadow: overallWinner === 'B' ? '0 0 15px rgba(224, 88, 79, 0.6)' : 'none'
              }}
            >
              {scoreB}
            </span>
          </div>
          <span className="font-playfair font-black text-white/40 text-xs sm:text-lg uppercase tracking-wider text-left max-w-[70px] sm:max-w-[150px] truncate">
            {satBName}
          </span>
        </div>
        
        {/* Win/Draw Badge */}
        <div className="mt-3">
          {overallWinner === 'A' ? (
            <span className="px-3 py-1 rounded-full text-[9px] font-mono font-bold tracking-widest bg-[#4d8dff]/15 text-[#4d8dff] border border-[#4d8dff]/30 uppercase">
              {satAName} ADVANTAGE
            </span>
          ) : overallWinner === 'B' ? (
            <span className="px-3 py-1 rounded-full text-[9px] font-mono font-bold tracking-widest bg-[#e0584f]/15 text-[#e0584f] border border-[#e0584f]/30 uppercase">
              {satBName} ADVANTAGE
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-[9px] font-mono font-bold tracking-widest bg-white/10 text-white/70 border border-white/25 uppercase">
              TACTICAL DRAW
            </span>
          )}
        </div>
      </div>

      {/* Category Rows Table */}
      <div className="w-full flex flex-col gap-3">
        {categories.map((c, index) => {
          const isAWinner = c.winner === 'A';
          const isBWinner = c.winner === 'B';
          const isTie = c.winner === 'TIE';

          return (
            <motion.div 
              key={c.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="group relative flex items-center justify-between w-full h-14 rounded-xl border border-white/5 bg-[#121824]/20 hover:border-white/10 hover:bg-[#121824]/40 transition-all px-4"
            >
              {/* Left Cell (Sat A Value) */}
              <div 
                className="flex-1 flex flex-col items-start transition-all"
                style={{
                  color: isAWinner ? '#4d8dff' : 'rgba(255,255,255,0.4)',
                  fontWeight: isAWinner ? 'bold' : 'normal'
                }}
              >
                <span className="font-mono text-sm tracking-wide">{c.displayA}</span>
                {isAWinner && (
                  <span className="text-[7px] font-mono tracking-wider uppercase opacity-80">WIN</span>
                )}
              </div>

              {/* Center Cell (Label) */}
              <div className="flex-1 flex flex-col items-center text-center">
                <span className="text-[10px] font-sans font-bold text-white/70 uppercase tracking-widest">
                  {c.label}
                </span>
                
                {/* Tooltip Description on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-black/90 border border-white/10 rounded-lg shadow-xl text-[9px] text-white/70 font-sans pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 backdrop-blur-md">
                  {c.description}
                </div>
              </div>

              {/* Right Cell (Sat B Value) */}
              <div 
                className="flex-1 flex flex-col items-end transition-all"
                style={{
                  color: isBWinner ? '#e0584f' : 'rgba(255,255,255,0.4)',
                  fontWeight: isBWinner ? 'bold' : 'normal'
                }}
              >
                <span className="font-mono text-sm tracking-wide">{c.displayB}</span>
                {isBWinner && (
                  <span className="text-[7px] font-mono tracking-wider uppercase opacity-80">WIN</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      
    </div>
  );
}
