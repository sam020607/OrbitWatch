import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, ShieldAlert } from 'lucide-react';

export default function BattleSummaryPanel({ summary }) {
  const { lines, verdict } = summary;

  return (
    <div className="w-full flex flex-col p-4 sm:p-6 md:p-8 bg-[#0a0d15]/40 backdrop-blur-md border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden mt-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
        <Terminal className="w-4 h-4 text-cyan" />
        <span className="text-[10px] font-mono text-cyan uppercase tracking-widest font-bold">Orbital Tactical Analysis</span>
      </div>

      {/* Bulleted Logs */}
      <div className="flex flex-col gap-3.5 mb-6">
        {lines.map((line, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            className="flex items-start gap-2.5"
          >
            <span className="text-[10px] font-mono text-cyan/70 mt-1 select-none">&gt;&gt;</span>
            <p className="text-xs font-sans leading-relaxed text-white/80">
              {line}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Verdict Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: lines.length * 0.1 }}
        className="relative overflow-hidden rounded-xl border border-cyan/25 bg-[#0f243a]/20 p-4 flex items-center gap-3"
      >
        {/* Glow */}
        <div className="absolute inset-0 bg-cyan/5 filter blur-md pointer-events-none" />
        
        <ShieldAlert className="w-5 h-5 text-cyan shrink-0 animate-pulse" />
        <span className="text-xs font-mono font-bold tracking-wider text-cyan uppercase">
          {verdict}
        </span>
      </motion.div>
    </div>
  );
}
