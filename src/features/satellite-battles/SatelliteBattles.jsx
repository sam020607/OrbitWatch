import React, { useState } from 'react';
import { useSatelliteCompare } from './useSatelliteCompare.js';
import SatelliteSelector from './SatelliteSelector.jsx';
import ComparisonTable from './ComparisonTable.jsx';
import OrbitVersusView from './OrbitVersusView.jsx';
import OrbitVersusView2D from './OrbitVersusView2D.jsx';
import { Map, Globe } from 'lucide-react';

export default function SatelliteBattles({ is3DMode }) {
  const { 
    satellites, 
    satA, 
    satB, 
    setSatA, 
    setSatB, 
    comparison 
  } = useSatelliteCompare();

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-[#0a0d15] overflow-hidden relative text-white">
      
      {/* LEFT PANEL: 3D/2D Visualization */}
      <div className="w-full md:w-1/2 h-[40vh] md:h-full relative border-b md:border-b-0 md:border-r border-white/10 shrink-0">
        {is3DMode ? (
          <OrbitVersusView satA={satA} satB={satB} />
        ) : (
          <OrbitVersusView2D satA={satA} satB={satB} />
        )}
      </div>

      {/* RIGHT PANEL: Battle Interface */}
      <div className="w-full md:w-1/2 h-[60vh] md:h-full flex flex-col relative overflow-y-auto overflow-x-hidden scrollbar-thin">
        
        {/* Header / Selectors */}
        <div className="w-full flex justify-between items-start gap-4 p-6 shrink-0 relative z-20"
             style={{ background: 'linear-gradient(to bottom, rgba(10,13,21,0.95) 0%, rgba(10,13,21,0) 100%)' }}>
          <div className="flex-1">
            <SatelliteSelector 
              satellites={satellites} 
              selectedSat={satA} 
              onSelect={setSatA} 
              label="Fighter 1"
              side="left"
            />
          </div>
          <div className="flex-1">
            <SatelliteSelector 
              satellites={satellites} 
              selectedSat={satB} 
              onSelect={setSatB} 
              label="Fighter 2"
              side="right"
            />
          </div>
        </div>

        {/* Content / Metrics */}
        <div className="flex-1 w-full relative">
          <ComparisonTable comparison={comparison} />
        </div>

        {/* Action Bar (Placeholder for share, etc) */}
        {comparison && (
          <div className="p-6 shrink-0 border-t border-white/5 flex justify-center bg-[#0a0d15]/50 backdrop-blur-md">
            <button 
              onClick={() => { setSatA(null); setSatB(null); }}
              className="px-6 py-2 rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white hover:border-white/50 transition-colors"
            >
              Reset Battle
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
