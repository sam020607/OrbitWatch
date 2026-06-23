import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Line, Stars } from '@react-three/drei';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import * as THREE from 'three';

// Subcomponent: The 3D Exploded Satellite parts
function SatelliteParts({ explodeFactor, activePart, setActivePart }) {
  const groupRef = useRef();

  // Slow rotation for the entire assembly
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.08;
    }
  });

  // Material configs
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: '#334155',
    roughness: 0.2,
    metalness: 0.8,
  });

  const goldFoilMaterial = new THREE.MeshStandardMaterial({
    color: '#d4af37',
    roughness: 0.15,
    metalness: 0.9,
    bumpScale: 0.05,
  });

  const solarMaterial = new THREE.MeshStandardMaterial({
    color: '#0b132b',
    emissive: '#1c2541',
    roughness: 0.1,
    metalness: 0.9,
  });

  const emitterMaterial = new THREE.MeshBasicMaterial({
    color: '#06b6d4',
  });

  // Part positions based on explodeFactor
  const centerPos = [0, 0, 0];
  const leftSolarPos = [-1.8 - (explodeFactor * 2.2), 0, 0];
  const rightSolarPos = [1.8 + (explodeFactor * 2.2), 0, 0];
  const antennaPos = [0, 0, 1.0 + (explodeFactor * 1.5)];
  const thrusterPos = [0, 0, -1.0 - (explodeFactor * 1.5)];
  const payloadPos = [0, -0.9 - (explodeFactor * 1.2), 0];

  return (
    <group ref={groupRef}>
      {/* 1. Core Avionics Box (Center Bus) */}
      <group 
        position={centerPos} 
        onClick={(e) => { e.stopPropagation(); setActivePart('core'); }}
      >
        <mesh material={goldFoilMaterial}>
          <boxGeometry args={[1.2, 1.2, 1.4]} />
        </mesh>
        {/* Antenna mount base */}
        <mesh position={[0, 0, 0.75]} material={metalMaterial}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} rotation={[Math.PI / 2, 0, 0]} />
        </mesh>
        
        {/* Holographic Label for Core */}
        {explodeFactor > 0.3 && (
          <Html position={[0, 0.9, 0]} center distanceFactor={8}>
            <button 
              onClick={() => setActivePart('core')}
              className={`px-2 py-0.5 rounded border text-[9px] font-mono tracking-widest uppercase transition-all duration-200 ${
                activePart === 'core' 
                  ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-[0_0_10px_#06b6d4]' 
                  : 'bg-slate-950/80 text-cyan-400 border-cyan-500/30 hover:border-cyan-400'
              }`}
            >
              Avionics Core
            </button>
          </Html>
        )}
      </group>

      {/* 2. Left Solar Array */}
      <group 
        position={leftSolarPos}
        onClick={(e) => { e.stopPropagation(); setActivePart('solar'); }}
      >
        {/* Connection rod */}
        <mesh position={[0.9, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={metalMaterial}>
          <cylinderGeometry args={[0.06, 0.06, 0.8, 12]} />
        </mesh>
        {/* Array Plate */}
        <mesh material={solarMaterial}>
          <boxGeometry args={[1.6, 0.05, 1.2]} />
        </mesh>
        {/* Cells detail */}
        <mesh position={[0, 0.03, 0]} material={metalMaterial}>
          <gridHelper args={[1.5, 8, '#ffffff', '#ffffff']} rotation={[0, 0, 0]} />
        </mesh>
        
        {/* Connection blueprint lines during dissection */}
        {explodeFactor > 0.1 && (
          <Line 
            points={[[0.9, 0, 0], [0.9 + (explodeFactor * 2.2), 0, 0]]} 
            color="#06b6d4" 
            lineWidth={0.5} 
            dashed 
            dashScale={5}
          />
        )}

        {explodeFactor > 0.3 && (
          <Html position={[0, 0.4, 0]} center distanceFactor={8}>
            <button 
              onClick={() => setActivePart('solar')}
              className={`px-2 py-0.5 rounded border text-[9px] font-mono tracking-widest uppercase transition-all duration-200 ${
                activePart === 'solar' 
                  ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-[0_0_10px_#06b6d4]' 
                  : 'bg-slate-950/80 text-cyan-400 border-cyan-500/30 hover:border-cyan-400'
              }`}
            >
              Solar Array L
            </button>
          </Html>
        )}
      </group>

      {/* 3. Right Solar Array */}
      <group 
        position={rightSolarPos}
        onClick={(e) => { e.stopPropagation(); setActivePart('solar'); }}
      >
        {/* Connection rod */}
        <mesh position={[-0.9, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={metalMaterial}>
          <cylinderGeometry args={[0.06, 0.06, 0.8, 12]} />
        </mesh>
        {/* Array Plate */}
        <mesh material={solarMaterial}>
          <boxGeometry args={[1.6, 0.05, 1.2]} />
        </mesh>
        {/* Cells detail */}
        <mesh position={[0, 0.03, 0]} material={metalMaterial}>
          <gridHelper args={[1.5, 8, '#ffffff', '#ffffff']} rotation={[0, 0, 0]} />
        </mesh>

        {/* Connection blueprint lines during dissection */}
        {explodeFactor > 0.1 && (
          <Line 
            points={[[-0.9, 0, 0], [-0.9 - (explodeFactor * 2.2), 0, 0]]} 
            color="#06b6d4" 
            lineWidth={0.5} 
            dashed 
            dashScale={5}
          />
        )}

        {explodeFactor > 0.3 && (
          <Html position={[0, 0.4, 0]} center distanceFactor={8}>
            <button 
              onClick={() => setActivePart('solar')}
              className={`px-2 py-0.5 rounded border text-[9px] font-mono tracking-widest uppercase transition-all duration-200 ${
                activePart === 'solar' 
                  ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-[0_0_10px_#06b6d4]' 
                  : 'bg-slate-950/80 text-cyan-400 border-cyan-500/30 hover:border-cyan-400'
              }`}
            >
              Solar Array R
            </button>
          </Html>
        )}
      </group>

      {/* 4. High-Gain Communications Dish */}
      <group 
        position={antennaPos}
        onClick={(e) => { e.stopPropagation(); setActivePart('antenna'); }}
      >
        {/* Connection shaft */}
        <mesh position={[0, 0, -0.4]} rotation={[Math.PI / 2, 0, 0]} material={metalMaterial}>
          <cylinderGeometry args={[0.08, 0.08, 0.6, 12]} />
        </mesh>
        {/* Dish */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={metalMaterial}>
          <coneGeometry args={[0.7, 0.3, 32, 1, true]} />
        </mesh>
        {/* Feeder horn */}
        <mesh position={[0, 0, 0.35]} rotation={[Math.PI / 2, 0, 0]} material={metalMaterial}>
          <cylinderGeometry args={[0.02, 0.05, 0.4, 8]} />
        </mesh>

        {/* Connection blueprint lines during dissection */}
        {explodeFactor > 0.1 && (
          <Line 
            points={[[0, 0, -0.4], [0, 0, -0.4 - (explodeFactor * 1.5)]]} 
            color="#06b6d4" 
            lineWidth={0.5} 
            dashed 
            dashScale={5}
          />
        )}

        {explodeFactor > 0.3 && (
          <Html position={[0, 0, 0.6]} center distanceFactor={8}>
            <button 
              onClick={() => setActivePart('antenna')}
              className={`px-2 py-0.5 rounded border text-[9px] font-mono tracking-widest uppercase transition-all duration-200 ${
                activePart === 'antenna' 
                  ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-[0_0_10px_#06b6d4]' 
                  : 'bg-slate-950/80 text-cyan-400 border-cyan-500/30 hover:border-cyan-400'
              }`}
            >
              Comms Dish
            </button>
          </Html>
        )}
      </group>

      {/* 5. Ion Propulsion Thruster */}
      <group 
        position={thrusterPos}
        onClick={(e) => { e.stopPropagation(); setActivePart('propulsion'); }}
      >
        {/* Engine bracket */}
        <mesh position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]} material={metalMaterial}>
          <cylinderGeometry args={[0.2, 0.2, 0.4, 12]} />
        </mesh>
        {/* Thruster cone */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={metalMaterial}>
          <cylinderGeometry args={[0.25, 0.4, 0.5, 16]} />
        </mesh>
        {/* Glow emitter */}
        <mesh position={[0, 0, -0.26]} rotation={[Math.PI / 2, 0, 0]} material={emitterMaterial}>
          <cylinderGeometry args={[0.18, 0.18, 0.05, 12]} />
        </mesh>

        {/* Connection blueprint lines during dissection */}
        {explodeFactor > 0.1 && (
          <Line 
            points={[[0, 0, 0.3], [0, 0, 0.3 + (explodeFactor * 1.5)]]} 
            color="#06b6d4" 
            lineWidth={0.5} 
            dashed 
            dashScale={5}
          />
        )}

        {explodeFactor > 0.3 && (
          <Html position={[0, 0, -0.6]} center distanceFactor={8}>
            <button 
              onClick={() => setActivePart('propulsion')}
              className={`px-2 py-0.5 rounded border text-[9px] font-mono tracking-widest uppercase transition-all duration-200 ${
                activePart === 'propulsion' 
                  ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-[0_0_10px_#06b6d4]' 
                  : 'bg-slate-950/80 text-cyan-400 border-cyan-500/30 hover:border-cyan-400'
              }`}
            >
              Ion Thruster
            </button>
          </Html>
        )}
      </group>

      {/* 6. Sensor Payload (Scientific Camera) */}
      <group 
        position={payloadPos}
        onClick={(e) => { e.stopPropagation(); setActivePart('payload'); }}
      >
        {/* Pivot arm */}
        <mesh position={[0, 0.5, 0]} material={metalMaterial}>
          <cylinderGeometry args={[0.08, 0.08, 0.6, 12]} />
        </mesh>
        {/* Camera body */}
        <mesh material={goldFoilMaterial}>
          <cylinderGeometry args={[0.4, 0.4, 0.6, 16]} rotation={[0, 0, Math.PI / 2]} />
        </mesh>
        {/* Lenses */}
        <mesh position={[-0.32, 0, 0.15]} rotation={[0, 0, Math.PI / 2]} material={metalMaterial}>
          <cylinderGeometry args={[0.12, 0.12, 0.1, 12]} />
        </mesh>
        <mesh position={[-0.32, 0, -0.15]} rotation={[0, 0, Math.PI / 2]} material={metalMaterial}>
          <cylinderGeometry args={[0.15, 0.15, 0.1, 12]} />
        </mesh>

        {/* Connection blueprint lines during dissection */}
        {explodeFactor > 0.1 && (
          <Line 
            points={[[0, 0.5, 0], [0, 0.5 + (explodeFactor * 1.2), 0]]} 
            color="#06b6d4" 
            lineWidth={0.5} 
            dashed 
            dashScale={5}
          />
        )}

        {explodeFactor > 0.3 && (
          <Html position={[0, -0.6, 0]} center distanceFactor={8}>
            <button 
              onClick={() => setActivePart('payload')}
              className={`px-2 py-0.5 rounded border text-[9px] font-mono tracking-widest uppercase transition-all duration-200 ${
                activePart === 'payload' 
                  ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-[0_0_10px_#06b6d4]' 
                  : 'bg-slate-950/80 text-cyan-400 border-cyan-500/30 hover:border-cyan-400'
              }`}
            >
              Sensor Payload
            </button>
          </Html>
        )}
      </group>
    </group>
  );
}

const PARTS_INFO = {
  core: {
    title: 'Avionics Core & Chassis',
    desc: 'The central satellite bus built with lightweight gold-foil carbon composite. Houses power control units, OBC (On-Board Computers), lithium-ion battery blocks, and altitude star trackers for stable orientation.',
  },
  solar: {
    title: 'GaAs Solar Arrays',
    desc: 'Dual solar array wings utilizing high-efficiency Gallium Arsenide (GaAs) triple-junction photovoltaic cells. Generates up to 14kW of electricity, feeding the power distribution units and recharging core batteries.',
  },
  antenna: {
    title: 'High-Gain Ka-Band Comms',
    desc: 'Dual-reflector parabolic dish antenna transmitting high-bandwidth data downlink to ground stations. Features an active gimbal motor allowing tracking pointing during rapid LEO orbital flybys.',
  },
  propulsion: {
    title: 'Xenon Ion Thruster',
    desc: 'Highly efficient electrostatic ion engine generating low thrust at massive specific impulse. Uses ionized Xenon gas accelerated through high-voltage grids for altitude maintenance and de-orbit positioning.',
  },
  payload: {
    title: 'Multispectral Camera Suite',
    desc: 'High-resolution payload with triple-aperture lenses capturing scientific visual, thermal infrared, and shortwave infrared spectrums for climate monitoring and vegetation index telemetry.',
  }
};

export default function SatelliteDissection() {
  const sectionRef = useRef(null);
  const [activePart, setActivePart] = useState('core');
  
  // Track scroll position specifically inside this section to drive the "auto-explosion"
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  // Standard spring smoothing for scroll-bound translation values
  const scrollExplode = useTransform(scrollYProgress, [0.2, 0.65], [0, 1]);
  const smoothExplode = useSpring(scrollExplode, { damping: 25, stiffness: 60 });
  
  // Local state value for fallback / manual interaction
  const [explodeFactor, setExplodeFactor] = useState(0);

  // Sync scroll animation value to local state so we can read it easily for HTML UI overlays
  useEffect(() => {
    return smoothExplode.onChange((v) => {
      setExplodeFactor(Math.max(0, Math.min(1, v)));
    });
  }, [smoothExplode]);

  return (
    <div 
      ref={sectionRef} 
      className="relative w-full min-h-[140vh] bg-gradient-to-b from-[#0a0d15] to-[#04060b] flex flex-col items-center py-20 px-6 overflow-hidden z-10"
    >
      {/* Title */}
      <div className="w-full max-w-4xl text-center mb-10 z-10 pointer-events-none">
        <span className="text-[10px] font-mono tracking-[0.35em] text-cyan-400 uppercase block mb-2">
          Holographic Blueprint
        </span>
        <h2 className="text-3xl md:text-5xl font-sans font-light tracking-tight text-white mb-4">
          Satellite Assembly Dissection
        </h2>
        <p className="text-white/50 text-xs md:text-sm max-w-lg mx-auto font-light leading-relaxed">
          Scroll to explode the assembly and inspect individual subsystems. Click on glowing labels or elements to scan specs.
        </p>
      </div>

      {/* Main Split Interface */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
        
        {/* Left Column: 3D Interactive Canvas */}
        <div className="lg:col-span-8 relative w-full h-[500px] md:h-[650px] rounded-3xl bg-slate-950/40 border border-white/5 overflow-hidden backdrop-blur-md shadow-2xl flex items-center justify-center">
          <Canvas 
            camera={{ position: [0, 2.5, 4.5], fov: 45 }}
            style={{ width: '100%', height: '100%' }}
            gl={{ preserveDrawingBuffer: true }}
          >
            <ambientLight intensity={0.65} />
            <pointLight position={[10, 10, 10]} intensity={2.0} decay={0} />
            <pointLight position={[-10, -10, -10]} intensity={0.8} decay={0} />
            <directionalLight position={[0, 5, 0]} intensity={1.2} color="#06b6d4" />
            
            <Suspense fallback={null}>
              <Stars radius={100} depth={50} count={200} factor={4} saturation={0.5} fade speed={1} />
              <SatelliteParts 
                explodeFactor={explodeFactor} 
                activePart={activePart} 
                setActivePart={setActivePart} 
              />
            </Suspense>
            
            <OrbitControls 
              enableZoom={true} 
              enablePan={false}
              minDistance={3.5}
              maxDistance={7}
              maxPolarAngle={Math.PI / 1.8}
            />
          </Canvas>
          
          {/* Compass HUD decoration */}
          <div className="absolute top-4 left-4 p-4 border border-cyan-500/20 rounded-xl font-mono text-[9px] text-cyan-400/80 pointer-events-none flex flex-col gap-1">
            <span>ORIENT_LOCK: TRACKING</span>
            <span>MODEL: ZENITH_OBS_SAT</span>
            <span>SCALE: 1:22</span>
          </div>

          {/* Assembly Status bar */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between font-mono text-[9px] text-white/50 bg-slate-950/60 py-2 px-4 border border-white/5 rounded-lg">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span> 
              EXPLODE STATE: {Math.round(explodeFactor * 100)}%
            </span>
            <span>ROTATION LOCK: OFF</span>
          </div>
        </div>

        {/* Right Column: Information Display Panel */}
        <div className="lg:col-span-4 flex flex-col justify-center h-full">
          <motion.div 
            key={activePart}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="p-6 md:p-8 rounded-3xl bg-slate-950/70 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col justify-between min-h-[300px]"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-mono tracking-[0.2em] text-cyan-400 uppercase">
                  Subsystem Profile
                </span>
                <span className="text-[9px] font-mono text-white/20">// SCAN_OK</span>
              </div>
              <h3 className="text-xl md:text-2xl font-sans font-light tracking-tight text-white mb-4">
                {PARTS_INFO[activePart].title}
              </h3>
              <p className="text-white/60 text-xs md:text-sm leading-relaxed font-light mb-6">
                {PARTS_INFO[activePart].desc}
              </p>
            </div>
            
            {/* Spec readout details */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-5">
              <div>
                <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest block mb-0.5">STATUS</span>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> ACTIVE
                </span>
              </div>
              <div>
                <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest block mb-0.5">TELEMETRY</span>
                <span className="text-[11px] font-mono text-white font-semibold">100% NOMINAL</span>
              </div>
            </div>
          </motion.div>

          {/* Interactive Manual Controls */}
          <div className="mt-4 p-4 rounded-2xl bg-slate-950/30 border border-white/5 backdrop-blur-md flex flex-col gap-2">
            <div className="flex justify-between font-mono text-[9px] text-white/40">
              <span>EXPLODE ASSEMBLY</span>
              <span>SLIDER CONTROL</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={explodeFactor}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setExplodeFactor(val);
              }}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

      </div>

      {/* Blueprint background grid decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] border-t border-white/5 z-0" 
           style={{ 
             backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', 
             backgroundSize: '24px 24px' 
           }} 
      />
    </div>
  );
}
