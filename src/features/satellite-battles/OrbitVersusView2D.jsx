import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Circle, CircleMarker, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import * as satellite from 'satellite.js';
import { footprintRadius } from '../battle-telemetry/lib/orbitalMath';

function MapEventsHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function OrbitTrack2D({ tle, color, currentLat, currentLon, currentAlt }) {
  const { pastPoints, futurePoints } = useMemo(() => {
    if (!tle) return { pastPoints: [], futurePoints: [] };

    try {
      const lines = tle.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return { pastPoints: [], futurePoints: [] };
      const satrec = satellite.twoline2satrec(lines[lines.length - 2], lines[lines.length - 1]);

      const periodMins = (2 * Math.PI) / satrec.no;
      const periodSecs = periodMins * 60;

      const numPoints = 120;
      const halfPoints = numPoints / 2;

      const pPoints = [];
      const fPoints = [];
      const now = Date.now();

      for (let i = -halfPoints; i <= halfPoints; i++) {
        const offsetSecs = (i / halfPoints) * (periodSecs / 2);
        const date = new Date(now + offsetSecs * 1000);
        const gmst = satellite.gstime(date);
        const posAndVel = satellite.propagate(satrec, date);
        const pos = posAndVel.position;

        if (pos) {
          const obsGeo = satellite.eciToGeodetic(pos, gmst);
          const lat = obsGeo.latitude * 180 / Math.PI;
          let lon = obsGeo.longitude * 180 / Math.PI;
          
          while (lon < -180) lon += 360;
          while (lon > 180) lon -= 360;

          if (i < 0) {
            pPoints.push([lat, lon]);
          } else {
            fPoints.push([lat, lon]);
          }
        }
      }

      // Stitch current position
      if (currentLat !== undefined && currentLon !== undefined) {
        pPoints.push([currentLat, currentLon]);
        fPoints.unshift([currentLat, currentLon]);
      }

      return { pastPoints: pPoints, futurePoints: fPoints };
    } catch (e) {
      console.error('Error generating 2D orbits:', e);
      return { pastPoints: [], futurePoints: [] };
    }
  }, [tle, currentLat, currentLon]);

  const footprintRadiusMeters = useMemo(() => {
    if (currentAlt === undefined) return 0;
    return footprintRadius(currentAlt, 10) * 1000; // Leaflet circle takes meters
  }, [currentAlt]);

  if (!tle) return null;

  return (
    <>
      {/* Past segment: Faded */}
      {pastPoints.length > 0 && (
        <Polyline 
          positions={pastPoints}
          color={color}
          weight={1.5}
          opacity={0.3}
          dashArray="4, 8"
        />
      )}

      {/* Future segment: Bright */}
      {futurePoints.length > 0 && (
        <Polyline 
          positions={futurePoints}
          color={color}
          weight={2}
          opacity={0.8}
        />
      )}

      {/* Ground projected coverage footprint circle */}
      {currentLat !== undefined && currentLon !== undefined && footprintRadiusMeters > 0 && (
        <Circle 
          center={[currentLat, currentLon]}
          radius={footprintRadiusMeters}
          pathOptions={{ 
            fillColor: color, 
            fillOpacity: 0.08, 
            color: color, 
            weight: 1, 
            dashArray: '3, 6' 
          }}
        />
      )}

      {/* Current Position Dot Marker */}
      {currentLat !== undefined && currentLon !== undefined && (
        <CircleMarker
          center={[currentLat, currentLon]}
          radius={4.5}
          pathOptions={{ 
            fillColor: color, 
            fillOpacity: 1, 
            color: '#ffffff', 
            weight: 1.2 
          }}
        />
      )}
    </>
  );
}

export default function OrbitVersusView2D({
  satA,
  satB,
  posA,
  posB,
  tleA,
  tleB,
  liveSep,
  closestApproach,
  onLocationClick,
  clickedLocation
}) {
  // Compute separation midpoint for 2D distance label
  const sepLabelInfo = useMemo(() => {
    if (!posA || !posB) return null;
    const midLat = (posA.lat + posB.lat) / 2;
    const midLon = (posA.lon + posB.lon) / 2;

    const customIcon = L.divIcon({
      className: 'sep-label-2d',
      html: `<div class="bg-black/90 text-cyan border border-cyan/40 px-2 py-0.5 rounded text-[8px] font-mono font-bold shadow-lg backdrop-blur-sm whitespace-nowrap tracking-wider" style="text-shadow: 0 0 5px rgba(0, 255, 255, 0.4);">${liveSep.toFixed(1)} km</div>`,
      iconSize: [60, 20],
      iconAnchor: [30, 10]
    });

    return { pos: [midLat, midLon], icon: customIcon };
  }, [posA, posB, liveSep]);

  // Compute closest approach marker lat/lon
  const closestApproachMarker = useMemo(() => {
    if (!closestApproach || !tleA) return null;

    try {
      const lines = tleA.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return null;
      const satrec = satellite.twoline2satrec(lines[lines.length - 2], lines[lines.length - 1]);
      
      const date = new Date(closestApproach.timestamp);
      const gmst = satellite.gstime(date);
      const posAndVel = satellite.propagate(satrec, date);
      const pos = posAndVel.position;

      if (pos) {
        const obsGeo = satellite.eciToGeodetic(pos, gmst);
        const lat = obsGeo.latitude * 180 / Math.PI;
        let lon = obsGeo.longitude * 180 / Math.PI;
        while (lon < -180) lon += 360;
        while (lon > 180) lon -= 360;

        const customIcon = L.divIcon({
          className: 'ca-label-2d',
          html: `<div class="bg-black/90 text-danger border border-danger/40 px-1.5 py-0.5 rounded text-[7px] font-mono font-bold shadow-lg backdrop-blur-sm whitespace-nowrap tracking-wider flex flex-col items-center"><span class="opacity-60 text-[5px]">CLOSEST ENCOUNTER</span><span>${closestApproach.distanceKm.toFixed(1)} km</span></div>`,
          iconSize: [80, 25],
          iconAnchor: [40, 12]
        });

        return { pos: [lat, lon], icon: customIcon };
      }
      return null;
    } catch (e) {
      console.error('Error generating 2D closest approach marker:', e);
      return null;
    }
  }, [closestApproach, tleA]);

  const observerIcon = useMemo(() => {
    return L.divIcon({
      className: 'observer-marker-2d',
      html: `<div class="w-3.5 h-3.5 rounded-full bg-[#3fd6a0] border border-white flex items-center justify-center shadow-[0_0_8px_#3fd6a0]"><div class="w-1.5 h-1.5 bg-black rounded-full"></div></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
  }, []);

  return (
    <div className="w-full h-full relative" style={{ background: '#07090e' }}>
      
      {/* atmosphere vignette styling overlay */}
      <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-l-2xl shadow-[inset_0_0_80px_rgba(0,0,0,0.85)] z-[400]" />

      <MapContainer
        center={[20, 0]}
        zoom={2}
        className="w-full h-full z-0"
        zoomControl={false}
        attributionControl={false}
        worldCopyJump={true}
        minZoom={1.5}
        maxZoom={8}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
        />
        
        {/* Sat A track and footprint */}
        <OrbitTrack2D 
          tle={tleA} 
          color="#4d8dff" 
          currentLat={posA?.lat} 
          currentLon={posA?.lon} 
          currentAlt={posA?.alt} 
        />

        {/* Sat B track and footprint */}
        <OrbitTrack2D 
          tle={tleB} 
          color="#e0584f" 
          currentLat={posB?.lat} 
          currentLon={posB?.lon} 
          currentAlt={posB?.alt} 
        />

        {/* Separation line in 2D */}
        {posA && posB && (
          <Polyline 
            positions={[[posA.lat, posA.lon], [posB.lat, posB.lon]]}
            color="#ffffff"
            weight={1}
            dashArray="3, 6"
            opacity={0.5}
          />
        )}

        {/* Separation Label */}
        {sepLabelInfo && (
          <Marker position={sepLabelInfo.pos} icon={sepLabelInfo.icon} />
        )}

        {/* Closest Approach Marker */}
        {closestApproachMarker && (
          <Marker position={closestApproachMarker.pos} icon={closestApproachMarker.icon} />
        )}

        {/* Observer click location marker */}
        {clickedLocation && (
          <Marker position={[clickedLocation.lat, clickedLocation.lon]} icon={observerIcon} />
        )}

        {/* Capture Map Click events */}
        <MapEventsHandler onMapClick={onLocationClick} />
      </MapContainer>

      {/* Overlay Legend */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-[400] bg-black/40 px-2.5 py-1 rounded-full border border-white/5 backdrop-blur-sm">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#4d8dff', boxShadow: '0 0 8px #4d8dff' }} />
        <span className="text-[9px] font-mono text-white/70 uppercase tracking-wider">{satA?.satname || 'A'}</span>
      </div>
      <div className="absolute top-4 right-4 flex items-center gap-2 z-[400] bg-black/40 px-2.5 py-1 rounded-full border border-white/5 backdrop-blur-sm">
        <span className="text-[9px] font-mono text-white/70 uppercase tracking-wider">{satB?.satname || 'B'}</span>
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#e0584f', boxShadow: '0 0 8px #e0584f' }} />
      </div>
    </div>
  );
}
