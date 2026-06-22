import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Line, useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import * as satellite from 'satellite.js';
import { getOrbitParams, footprintRadius } from '../battle-telemetry/lib/orbitalMath';

const EARTH_RADIUS = 2;

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 90) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function Earth({ onEarthClick, clickedLocation }) {
  const earthTexture = useTexture('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg');
  const earthRef = useRef(null);

  const handleMeshClick = (e) => {
    e.stopPropagation();
    const clickedPoint = e.point.clone();
    const radius = clickedPoint.length();
    
    const phi = Math.acos(Math.max(-1, Math.min(1, clickedPoint.y / radius)));
    const lat = 90 - phi * (180 / Math.PI);
    
    const theta = Math.atan2(clickedPoint.z, -clickedPoint.x);
    const lon = theta * (180 / Math.PI) - 90;
    
    // Normalize longitude
    let lonNormalized = lon;
    while (lonNormalized < -180) lonNormalized += 360;
    while (lonNormalized > 180) lonNormalized -= 360;

    onEarthClick(lat, lonNormalized);
  };

  const observerPos = useMemo(() => {
    if (!clickedLocation) return null;
    return latLonToVector3(clickedLocation.lat, clickedLocation.lon, EARTH_RADIUS + 0.01);
  }, [clickedLocation]);

  return (
    <group ref={earthRef}>
      {/* Earth Sphere */}
      <mesh onClick={handleMeshClick}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial 
          map={earthTexture}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Atmosphere Glow */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS + 0.03, 64, 64]} />
        <meshBasicMaterial 
          color="#4d8dff" 
          transparent 
          opacity={0.1} 
          side={THREE.BackSide} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Clicked Observer Pin */}
      {observerPos && (
        <mesh position={observerPos}>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshBasicMaterial color="#3fd6a0" />
          <mesh>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color="#3fd6a0" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
          </mesh>
        </mesh>
      )}
    </group>
  );
}

function OrbitRing({ tle, satName, color, currentLat, currentLon, currentAlt }) {
  // Generate accurate orbital points from TLE
  const { pastPoints, futurePoints, currentPos } = useMemo(() => {
    if (!tle) return { pastPoints: [], futurePoints: [], currentPos: null };

    try {
      const lines = tle.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return { pastPoints: [], futurePoints: [], currentPos: null };
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
          const lon = obsGeo.longitude * 180 / Math.PI;
          const alt = obsGeo.height;

          const radius = EARTH_RADIUS + (alt / 6371) * EARTH_RADIUS;
          const vec = latLonToVector3(lat, lon, radius);

          if (i < 0) {
            pPoints.push(vec);
          } else {
            fPoints.push(vec);
          }
        }
      }

      // Add the current position at the boundary
      let curVec = null;
      if (currentLat !== undefined && currentLon !== undefined && currentAlt !== undefined) {
        const radius = EARTH_RADIUS + (currentAlt / 6371) * EARTH_RADIUS;
        curVec = latLonToVector3(currentLat, currentLon, radius);
        // Tie the past and future segments together at the current position
        pPoints.push(curVec);
        fPoints.unshift(curVec);
      }

      return { pastPoints: pPoints, futurePoints: fPoints, currentPos: curVec };
    } catch (e) {
      console.error('Error computing 3D orbit tracks:', e);
      return { pastPoints: [], futurePoints: [], currentPos: null };
    }
  }, [tle, currentLat, currentLon, currentAlt]);

  // Footprint size ground disk
  const footprintRing = useMemo(() => {
    if (currentLat === undefined || currentLon === undefined || currentAlt === undefined) return null;
    
    const r = footprintRadius(currentAlt, 10);
    const theta = r / 6371; // central angle in radians
    const discRadius = EARTH_RADIUS * Math.sin(theta);
    const subSatPos = latLonToVector3(currentLat, currentLon, EARTH_RADIUS + 0.005);
    const dir = subSatPos.clone().normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);

    return { pos: subSatPos, radius: discRadius, quaternion };
  }, [currentLat, currentLon, currentAlt]);

  const [pulseScale, setPulseScale] = useState(1);

  // Pulse effect for marker
  useEffect(() => {
    let animId;
    let start = performance.now();
    
    function animate(now) {
      const elapsed = now - start;
      const scale = 1 + 0.4 * Math.sin((elapsed / 300) * Math.PI); // cycle every 600ms
      setPulseScale(scale);
      animId = requestAnimationFrame(animate);
    }
    
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  if (pastPoints.length === 0 || futurePoints.length === 0 || !currentPos) return null;

  return (
    <group>
      {/* Past segment: Faded track */}
      <Line 
        points={pastPoints}
        color={color}
        lineWidth={1.5}
        transparent
        opacity={0.25}
      />

      {/* Future segment: Bright track */}
      <Line 
        points={futurePoints}
        color={color}
        lineWidth={2.5}
        transparent
        opacity={0.85}
      />

      {/* Satellite pulsing point marker */}
      <mesh position={currentPos}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color={color} />
        {/* Pulsing outer ring */}
        <mesh scale={[pulseScale, pulseScale, pulseScale]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.25} blending={THREE.AdditiveBlending} />
        </mesh>
        
        {/* Sleek name label */}
        <Html distanceFactor={6} center style={{ pointerEvents: 'none' }} y={25}>
          <div 
            className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider uppercase border text-white/90"
            style={{ 
              background: 'rgba(10, 14, 22, 0.85)',
              borderColor: color + '50',
              boxShadow: `0 0 10px ${color}33`
            }}
          >
            {satName}
          </div>
        </Html>
      </mesh>

      {/* Ground projected coverage footprint circle */}
      {footprintRing && (
        <mesh position={footprintRing.pos} quaternion={footprintRing.quaternion}>
          <ringGeometry args={[0, footprintRing.radius, 32]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.12} 
            depthWrite={false} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      )}
    </group>
  );
}

export default function OrbitVersusView({
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
  // Compute separation line points and midpoint
  const sepLineDetails = useMemo(() => {
    if (!posA || !posB) return null;
    const radA = EARTH_RADIUS + (posA.alt / 6371) * EARTH_RADIUS;
    const radB = EARTH_RADIUS + (posB.alt / 6371) * EARTH_RADIUS;
    const vecA = latLonToVector3(posA.lat, posA.lon, radA);
    const vecB = latLonToVector3(posB.lat, posB.lon, radB);
    const midpoint = new THREE.Vector3().addVectors(vecA, vecB).multiplyScalar(0.5);
    return { points: [vecA, vecB], midpoint };
  }, [posA, posB]);

  // Compute closest approach marker position (projected onto Earth's orbit altitude for Sat A)
  const closestApproachMarker = useMemo(() => {
    if (!closestApproach || !tleA) return null;

    try {
      const lines = tleA.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return null;
      const satrec = satellite.twoline2satrec(lines[lines.length - 2], lines[lines.length - 1]);
      
      // Propagate Sat A to the closest approach timestamp
      const date = new Date(closestApproach.timestamp);
      const gmst = satellite.gstime(date);
      const posAndVel = satellite.propagate(satrec, date);
      const pos = posAndVel.position;

      if (pos) {
        const obsGeo = satellite.eciToGeodetic(pos, gmst);
        const lat = obsGeo.latitude * 180 / Math.PI;
        const lon = obsGeo.longitude * 180 / Math.PI;
        const alt = obsGeo.height;

        const radius = EARTH_RADIUS + (alt / 6371) * EARTH_RADIUS;
        const vec = latLonToVector3(lat, lon, radius);
        return { vec, distance: closestApproach.distanceKm };
      }
      return null;
    } catch (e) {
      console.error('Error computing closest approach 3D marker:', e);
      return null;
    }
  }, [closestApproach, tleA]);

  return (
    <div className="w-full h-full relative" style={{ background: 'radial-gradient(circle at center, #07090e 0%, #000 100%)' }}>
      
      {/* Atmosphere Vignette styling overlay */}
      <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-l-2xl shadow-[inset_0_0_80px_rgba(0,0,0,0.85)] z-10" />

      <Canvas camera={{ position: [0, 3, 7], fov: 45, far: 2000 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 3, 5]} intensity={1.8} />
        <Stars radius={100} depth={50} count={2500} factor={4} saturation={0} fade speed={1} />
        
        {/* Globe model */}
        <Earth onEarthClick={onLocationClick} clickedLocation={clickedLocation} />
        
        {/* Sat A Orbits */}
        {satA && (
          <OrbitRing 
            tle={tleA} 
            satName={satA.satname} 
            color="#4d8dff" 
            currentLat={posA?.lat} 
            currentLon={posA?.lon} 
            currentAlt={posA?.alt} 
          />
        )}

        {/* Sat B Orbits */}
        {satB && (
          <OrbitRing 
            tle={tleB} 
            satName={satB.satname} 
            color="#e0584f" 
            currentLat={posB?.lat} 
            currentLon={posB?.lon} 
            currentAlt={posB?.alt} 
          />
        )}

        {/* Separation Line + Distance Label */}
        {sepLineDetails && (
          <group>
            <Line 
              points={sepLineDetails.points} 
              color="#ffffff" 
              lineWidth={1.2} 
              dashed 
              dashScale={2} 
              transparent 
              opacity={0.5} 
            />
            <Html position={sepLineDetails.midpoint} center style={{ pointerEvents: 'none' }}>
              <div 
                className="bg-black/90 text-cyan border border-cyan/40 px-2 py-0.5 rounded text-[8px] font-mono font-bold shadow-lg backdrop-blur-sm whitespace-nowrap tracking-wider"
                style={{ textShadow: '0 0 5px rgba(0, 255, 255, 0.4)' }}
              >
                {liveSep.toFixed(1)} km
              </div>
            </Html>
          </group>
        )}

        {/* Closest Approach Marker */}
        {closestApproachMarker && (
          <group>
            <mesh position={closestApproachMarker.vec}>
              <boxGeometry args={[0.04, 0.04, 0.04]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
              <Html distanceFactor={6} center style={{ pointerEvents: 'none' }} y={-22}>
                <div 
                  className="bg-black/90 text-danger border border-danger/40 px-2 py-0.5 rounded text-[7px] font-mono font-bold shadow-lg backdrop-blur-sm whitespace-nowrap tracking-wider flex flex-col items-center"
                >
                  <span className="opacity-60 text-[6px]">CLOSEST ENCOUNTER</span>
                  <span>{closestApproachMarker.distance.toFixed(1)} km</span>
                </div>
              </Html>
            </mesh>
          </group>
        )}
        
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          minDistance={2.5}
          maxDistance={120}
          autoRotate={false}
        />
      </Canvas>
      
      {/* Overlay Legend */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-20 bg-black/40 px-2.5 py-1 rounded-full border border-white/5 backdrop-blur-sm">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#4d8dff', boxShadow: '0 0 8px #4d8dff' }} />
        <span className="text-[9px] font-mono text-white/70 uppercase tracking-wider">{satA?.satname || 'A'}</span>
      </div>
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20 bg-black/40 px-2.5 py-1 rounded-full border border-white/5 backdrop-blur-sm">
        <span className="text-[9px] font-mono text-white/70 uppercase tracking-wider">{satB?.satname || 'B'}</span>
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#e0584f', boxShadow: '0 0 8px #e0584f' }} />
      </div>
    </div>
  );
}
