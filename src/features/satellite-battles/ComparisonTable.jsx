import React from 'react';
import MetricRow from './MetricRow.jsx';

export default function ComparisonTable({ comparison }) {
  if (!comparison) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center mb-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan/20 to-danger/20 animate-spin-slow opacity-50" />
          <span className="text-white/20 font-black italic text-2xl">VS</span>
        </div>
        <p className="text-white/40 font-mono text-sm uppercase tracking-widest text-center max-w-xs">
          Select two satellites above to initiate data comparison sequence
        </p>
      </div>
    );
  }

  const metricsList = [
    comparison.altitude,
    comparison.velocity,
    comparison.period
  ];

  return (
    <div className="w-full h-full flex flex-col relative z-10 p-6 md:p-10">
      
      {/* Decorative header */}
      <div className="flex items-center justify-between mb-10">
        <div className="h-[2px] bg-gradient-to-r from-transparent to-cyan w-1/4" />
        <h2 className="text-white font-playfair italic font-bold text-2xl px-4 tracking-wider" style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>
          BATTLE TELEMETRY
        </h2>
        <div className="h-[2px] bg-gradient-to-l from-transparent to-danger w-1/4" />
      </div>

      <div className="space-y-4">
        {metricsList.map((m, i) => (
          <MetricRow key={i} metric={m} />
        ))}
      </div>
      
    </div>
  );
}
