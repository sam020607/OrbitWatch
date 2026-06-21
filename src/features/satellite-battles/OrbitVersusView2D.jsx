import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet';
import { generateOrbitalArc } from '../../utils/orbitMath.js';

function OrbitTrack2D({ sat, color }) {
  const points = useMemo(() => {
    if (!sat || !sat.satlat || !sat.satlon) return [];
    const arc = generateOrbitalArc(sat.satlat, sat.satlon);
    return arc;
  }, [sat]);

  if (!sat) return null;

  return (
    <>
      {points.length > 0 && (
        <Polyline 
          positions={points}
          color={color}
          weight={2}
          opacity={0.8}
          dashArray="5, 10"
        />
      )}
      {sat.satlat !== undefined && sat.satlon !== undefined && (
        <CircleMarker
          center={[sat.satlat, sat.satlon]}
          radius={5}
          pathOptions={{ 
            fillColor: color, 
            fillOpacity: 1, 
            color: '#ffffff', 
            weight: 1 
          }}
        />
      )}
    </>
  );
}

export default function OrbitVersusView2D({ satA, satB }) {
  return (
    <div className="w-full h-full relative" style={{ background: '#0a0d15' }}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        className="w-full h-full z-0"
        zoomControl={false}
        attributionControl={false}
        worldCopyJump={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
        />
        
        <OrbitTrack2D sat={satA} color="#4d8dff" />
        <OrbitTrack2D sat={satB} color="#e0584f" />
      </MapContainer>

      {/* Overlay labels */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-[400] bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
        <div className="w-3 h-3 rounded-full" style={{ background: '#4d8dff', boxShadow: '0 0 10px #4d8dff' }} />
        <span className="text-[10px] font-mono text-white/70 uppercase tracking-wider">{satA?.satname || 'A'}</span>
      </div>
      <div className="absolute top-4 right-4 flex items-center gap-2 z-[400] bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
        <span className="text-[10px] font-mono text-white/70 uppercase tracking-wider">{satB?.satname || 'B'}</span>
        <div className="w-3 h-3 rounded-full" style={{ background: '#e0584f', boxShadow: '0 0 10px #e0584f' }} />
      </div>
    </div>
  );
}
