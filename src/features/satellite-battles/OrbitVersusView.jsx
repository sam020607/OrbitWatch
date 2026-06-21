import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Line, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { generateOrbitalArc } from '../../utils/orbitMath.js';

const EARTH_RADIUS = 2;

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 90) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function Earth() {
  const earthTexture = useTexture('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg');
  const earthRef = useRef(null);

  useFrame(({ clock }) => {
    if (earthRef.current) {
      // earthRef.current.rotation.y = clock.getElapsedTime() * 0.1; // Auto-rotate disabled for battle mode
    }
  });

  return (
    <group ref={earthRef}>
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial 
          map={earthTexture}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Atmosphere Glow */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS + 0.05, 64, 64]} />
        <meshBasicMaterial 
          color="#4d8dff" 
          transparent 
          opacity={0.15} 
          side={THREE.BackSide} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function OrbitRing({ sat, color }) {
  const points = useMemo(() => {
    if (!sat) return [];
    const radius = EARTH_RADIUS + (sat.satalt / 40000) * 0.8 + 0.1;
    const arc = generateOrbitalArc(sat.satlat || 0, sat.satlon || 0);
    return arc.map(p => latLonToVector3(p[0], p[1], radius));
  }, [sat]);

  const satPosition = useMemo(() => {
    if (!sat) return null;
    const radius = EARTH_RADIUS + (sat.satalt / 40000) * 0.8 + 0.1;
    return latLonToVector3(sat.satlat || 0, sat.satlon || 0, radius);
  }, [sat]);

  if (!sat || points.length === 0) return null;

  return (
    <group>
      <Line 
        points={points}
        color={color}
        lineWidth={2}
        transparent
        opacity={0.8}
      />
      {satPosition && (
        <mesh position={satPosition}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color={color} />
          {/* subtle glow */}
          <mesh>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={0.3} blending={THREE.AdditiveBlending} />
          </mesh>
        </mesh>
      )}
    </group>
  );
}

export default function OrbitVersusView({ satA, satB }) {
  return (
    <div className="w-full h-full relative" style={{ background: 'radial-gradient(circle at center, #0a0d15 0%, #000 100%)' }}>
      <Canvas camera={{ position: [0, 3, 7], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 3, 5]} intensity={1.5} />
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
        
        <Earth />
        
        {/* We keep the orbits static relative to the world, Earth rotates inside them */}
        <OrbitRing sat={satA} color="#4d8dff" />
        <OrbitRing sat={satB} color="#e0584f" />
        
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={15}
          autoRotate={false}
          autoRotateSpeed={0.5}
        />
      </Canvas>
      
      {/* Overlay labels */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ background: '#4d8dff', boxShadow: '0 0 10px #4d8dff' }} />
        <span className="text-[10px] font-mono text-white/70 uppercase tracking-wider">{satA?.satname || 'A'}</span>
      </div>
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className="text-[10px] font-mono text-white/70 uppercase tracking-wider">{satB?.satname || 'B'}</span>
        <div className="w-3 h-3 rounded-full" style={{ background: '#e0584f', boxShadow: '0 0 10px #e0584f' }} />
      </div>
    </div>
  );
}
