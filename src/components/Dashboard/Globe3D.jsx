import React, { useRef, useMemo, Suspense, Fragment } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture, Stars, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useApp } from '../../context/AppContext.jsx';
import { generateOrbitalArc } from '../../utils/orbitMath.js';
import { SAT_TYPE_CONFIG } from '../../data/mockSatellites.js';
import { CONSTELLATIONS, getSubStellarPoint, getLocalCoordinates, getConstellationShape } from '../../data/constellations.js';

// Constants for Globe scaling
const EARTH_RADIUS = 2.0;

/**
 * Converts Latitude and Longitude to a Three.js Vector3 point on a sphere.
 */
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.sin(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.cos(theta);

  return new THREE.Vector3(x, y, z);
}

/**
 * Textured Earth mesh component.
 */
function EarthMesh({ onClick }) {
  // Load standard photorealistic Earth texture from Three.js examples CDN
  const earthTexture = useTexture('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg');

  return (
    <mesh rotation={[0, -Math.PI / 2, 0]} onClick={onClick}>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      <meshPhongMaterial
        map={earthTexture}
        shininess={15}
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  );
}

/**
 * Fallback Earth mesh if texture load fails (renders a styled dark navy globe).
 */
function FallbackEarth({ onClick }) {
  return (
    <mesh onClick={onClick}>
      <sphereGeometry args={[EARTH_RADIUS, 32, 32]} />
      <meshPhongMaterial
        color="#0d1b2a"
        emissive="#0a0a0f"
        shininess={10}
        flatShading
      />
    </mesh>
  );
}

/**
 * Interactive 3D scene elements.
 */
function SceneContent() {
  const { state, actions } = useApp();
  const {
    location,
    issPosition,
    issTrail,
    satellites,
    selectedSatellite,
    showConeOverlay,
    satelliteFilter,
    viewMode,
    selectedConstellation
  } = state;

  const earthRef = useRef();

  // Filter based on active selection
  const filteredSatellites = useMemo(() => {
    return satellites.filter(sat => {
      if (satelliteFilter === 'all') return true;
      if (satelliteFilter === 'major') {
        return sat.type === 'space-station' || sat.type === 'weather' || sat.type === 'earth-obs' || sat.type === 'gps';
      }
      return sat.type === satelliteFilter;
    });
  }, [satellites, satelliteFilter]);

  // Calculate visible constellations
  const visibleConstellations = useMemo(() => {
    if (!location) return [];
    const now = Date.now();
    return CONSTELLATIONS.map(c => {
      const subStellar = getSubStellarPoint(c.ra, c.dec, now);
      const coords = getLocalCoordinates(c.ra, c.dec, location.lat, location.lon, now);
      return { ...c, subStellar, coords };
    })
    .filter(c => c.coords.el > 0);
  }, [location]);

  // Convert observer position
  const observerPos = useMemo(() => {
    if (!location) return null;
    return latLonToVector3(location.lat, location.lon, EARTH_RADIUS + 0.02);
  }, [location]);

  // Convert ISS position
  const issPos = useMemo(() => {
    if (viewMode !== 'satellites' || !issPosition) return null;
    return latLonToVector3(issPosition.lat, issPosition.lon, EARTH_RADIUS + 0.15); // ~300km altitude representation
  }, [viewMode, issPosition]);

  // Convert ISS Trail positions to 3D
  const trailPoints = useMemo(() => {
    if (viewMode !== 'satellites' || issTrail.length < 2) return [];
    return issTrail.map(p => latLonToVector3(p.lat, p.lon, EARTH_RADIUS + 0.15));
  }, [viewMode, issTrail]);

  // Convert Selected Satellite Orbit to 3D
  const orbitPoints = useMemo(() => {
    if (viewMode !== 'satellites' || !selectedSatellite) return [];
    const arcPoints = generateOrbitalArc(selectedSatellite.satlat, selectedSatellite.satlon);
    const radius = EARTH_RADIUS + (selectedSatellite.satalt / 40000) * 0.4 + 0.05;
    return arcPoints.map(p => latLonToVector3(p[0], p[1], radius));
  }, [viewMode, selectedSatellite]);

  // Slow orbital rotation effect for background stars and earth grids
  useFrame(({ clock }) => {
    if (earthRef.current) {
      earthRef.current.rotation.y = clock.getElapsedTime() * 0.005;
    }
  });

  const handleEarthClick = (e) => {
    e.stopPropagation();
    if (viewMode === 'satellites') {
      actions.selectSatellite(null);
    } else {
      actions.selectConstellation(null);
    }
  };

  const isIssSelected = selectedSatellite?.satid === 25544;
  const handleIssClick = (e) => {
    e.stopPropagation();
    actions.selectSatellite(isIssSelected ? null : { satname: 'ISS', satid: 25544, satalt: 408, velocity: 7.66, type: 'space-station' });
  };

  return (
    <group ref={earthRef}>
      {/* ── Earth Base Globe ── */}
      <Suspense fallback={<FallbackEarth onClick={handleEarthClick} />}>
        <EarthMesh onClick={handleEarthClick} />
      </Suspense>

      {/* ── Glowing Atmospheric Grid Overlay ── */}
      <mesh raycast={() => null}>
        <sphereGeometry args={[EARTH_RADIUS + 0.008, 32, 32]} />
        <meshBasicMaterial
          color="#00d4ff"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* ── Observer Pin ── */}
      {observerPos && (
        <group position={observerPos}>
          {/* Glowing Beacon */}
          <mesh raycast={() => null}>
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshBasicMaterial color="#f59e0b" />
          </mesh>
          <mesh raycast={() => null}>
            <ringGeometry args={[0.05, 0.06, 32]} />
            <meshBasicMaterial color="#f59e0b" side={THREE.DoubleSide} transparent opacity={0.6} />
          </mesh>
          {/* Label */}
          <Html distanceFactor={6}>
            <div className="bg-navy/95 border border-amber/40 rounded px-1.5 py-0.5 text-[8px] text-amber font-crimson font-bold select-none whitespace-nowrap -translate-x-1/2 -translate-y-6 pointer-events-none shadow-md">
              📍 Observer: {location.name}
            </div>
          </Html>
        </group>
      )}

      {/* ── Satellites Mode Overlays ── */}
      {viewMode === 'satellites' && (
        <>
          {/* ISS Trail */}
          {trailPoints.length > 1 && (
            <Line
              points={trailPoints}
              color="#00d4ff"
              lineWidth={1.5}
              dashed
              dashSize={0.08}
              gapSize={0.04}
              raycast={() => null}
            />
          )}

          {/* ISS Model Dot */}
          {issPos && (
            <group position={issPos}>
              <mesh onClick={handleIssClick}>
                <sphereGeometry args={[0.045, 16, 16]} />
                <meshBasicMaterial color="#00d4ff" />
              </mesh>
              {/* Pulsing halo */}
              <mesh onClick={handleIssClick}>
                <sphereGeometry args={[0.07, 16, 16]} />
                <meshBasicMaterial color="#00d4ff" transparent opacity={0.2} />
              </mesh>
              {/* HTML Hover Label */}
              <Html distanceFactor={6}>
                <div className="bg-panel/90 border border-cyan/40 rounded px-1.5 py-0.5 text-[9px] text-cyan font-crimson font-bold select-none whitespace-nowrap -translate-x-1/2 -translate-y-6 pointer-events-none shadow-md">
                  🛸 ISS
                </div>
              </Html>
            </group>
          )}

          {/* Selected Satellite Orbit plane line */}
          {orbitPoints.length > 1 && (
            <Line
              points={orbitPoints}
              color="#00d4ff"
              lineWidth={2}
              raycast={() => null}
            />
          )}

          {/* Satellite markers */}
          {filteredSatellites.map(sat => {
            const isSelected = selectedSatellite?.satid === sat.satid;
            const radius = EARTH_RADIUS + (sat.satalt / 40000) * 0.4 + 0.05;
            const satPos = latLonToVector3(sat.satlat, sat.satlon, radius);
            const color = isSelected ? '#00d4ff' : (SAT_TYPE_CONFIG[sat.type]?.color || '#f59e0b');

            const handleSatClick = (e) => {
              e.stopPropagation();
              actions.selectSatellite(isSelected ? null : sat);
            };

            return (
              <group key={sat.satid} position={satPos}>
                {/* Node */}
                <mesh onClick={handleSatClick}>
                  <sphereGeometry args={[isSelected ? 0.035 : 0.022, 8, 8]} />
                  <meshBasicMaterial color={color} />
                </mesh>

                {/* Selected Satellite HUD Halo & Label */}
                {isSelected && (
                  <>
                    <mesh onClick={handleSatClick}>
                      <sphereGeometry args={[0.06, 16, 16]} />
                      <meshBasicMaterial color="#00d4ff" transparent opacity={0.25} />
                    </mesh>
                    <Html distanceFactor={6}>
                      <div className="bg-panel/95 border border-cyan rounded px-2 py-1 text-[9px] text-text font-crimson font-bold select-none shadow-xl -translate-x-1/2 -translate-y-8 select-none">
                        <p className="text-cyan">{sat.satname}</p>
                        <p className="text-muted-light font-mono text-[7px] mt-0.5">{sat.satalt.toFixed(0)} km · {sat.velocity.toFixed(2)} km/s</p>
                      </div>
                    </Html>
                  </>
                )}
              </group>
            );
          })}
        </>
      )}

      {/* ── Constellations Mode Overlays ── */}
      {viewMode === 'constellations' && visibleConstellations.map(constell => {
        const isSelected = selectedConstellation?.id === constell.id;
        const constellRadius = EARTH_RADIUS + 1.2; // Celestial sphere representation
        const centerPos = latLonToVector3(constell.subStellar.lat, constell.subStellar.lon, constellRadius);
        
        // Calculate stars and connection lines
        const shape = getConstellationShape(constell, Date.now());
        const starPoints3D = shape.stars.map(s => latLonToVector3(s.lat, s.lon, constellRadius));

        const handleConstellClick = (e) => {
          e.stopPropagation();
          actions.selectConstellation(isSelected ? null : constell);
        };

        return (
          <Fragment key={constell.id}>
            {/* Outline connection lines */}
            {shape.connections.map(([idx1, idx2], lineIdx) => {
              const p1 = starPoints3D[idx1];
              const p2 = starPoints3D[idx2];
              if (!p1 || !p2) return null;
              return (
                <Line
                  key={`3d-line-${constell.id}-${lineIdx}`}
                  points={[p1, p2]}
                  color={isSelected ? '#f59e0b' : '#00d4ff'}
                  lineWidth={isSelected ? 1.8 : 0.8}
                  opacity={isSelected ? 1.0 : 0.3}
                  transparent
                  raycast={() => null}
                />
              );
            })}

            {/* Individual star nodes */}
            {starPoints3D.map((pt, idx) => (
              <mesh key={`3d-star-${constell.id}-${idx}`} position={pt} raycast={() => null}>
                <sphereGeometry args={[isSelected ? 0.018 : 0.01, 8, 8]} />
                <meshBasicMaterial color={isSelected ? '#ffffff' : '#a5f3fc'} />
              </mesh>
            ))}

            {/* Subtle center anchor glowing point (Not a star emoji) */}
            <group position={centerPos}>
              <mesh onClick={handleConstellClick}>
                <sphereGeometry args={[0.024, 8, 8]} />
                <meshBasicMaterial color={isSelected ? '#f59e0b' : '#00d4ff'} />
              </mesh>
              
              {/* Selected tooltip banner */}
              {isSelected && (
                <>
                  <mesh onClick={handleConstellClick}>
                    <sphereGeometry args={[0.05, 8, 8]} />
                    <meshBasicMaterial color="#f59e0b" transparent opacity={0.3} />
                  </mesh>
                  <Html distanceFactor={6}>
                    <div className="bg-panel/95 border border-amber/60 rounded px-2 py-1 text-[9px] text-text font-crimson font-bold select-none shadow-xl -translate-x-1/2 -translate-y-8 select-none">
                      <p className="text-amber">🌌 {constell.name}</p>
                      <p className="text-muted-light text-[7px] mt-0.5">RA: {constell.ra}h · Dec: {constell.dec}°</p>
                    </div>
                  </Html>
                </>
              )}
            </group>

            {/* Projection line linking observer pin to constellation center */}
            {isSelected && observerPos && (
              <Line
                points={[observerPos, centerPos]}
                color="#f59e0b"
                lineWidth={1}
                dashed
                dashSize={0.06}
                gapSize={0.03}
                raycast={() => null}
              />
            )}
          </Fragment>
        );
      })}
    </group>
  );
}

/**
 * Globe3D — Three.js 3D Viewport wrapper.
 */
export default function Globe3D({ className = '' }) {
  const { actions } = useApp();

  return (
    <div className={`relative bg-space ${className}`}>
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0, 3, 5], fov: 45 }}
        style={{ width: '100%', height: '100%', outline: 'none' }}
        onPointerMissed={() => {
          actions.selectSatellite(null);
          actions.selectConstellation(null);
        }}
      >
        {/* Lights */}
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <directionalLight position={[-5, 5, -5]} intensity={0.4} />

        {/* Space Starfield Background */}
        <Stars
          radius={80}
          depth={40}
          count={2500}
          factor={4}
          saturation={0.5}
          fade
          speed={0.5}
        />

        {/* 3D Scene */}
        <SceneContent />

        {/* Camera interaction */}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          minDistance={2.5}
          maxDistance={12}
          autoRotate={false}
        />
      </Canvas>

      {/* Decorative HUD corners */}
      <div className="absolute top-4 left-4 border-t-2 border-l-2 border-cyan/40 w-4 h-4 pointer-events-none" />
      <div className="absolute top-4 right-4 border-t-2 border-r-2 border-cyan/40 w-4 h-4 pointer-events-none" />
      <div className="absolute bottom-4 left-4 border-b-2 border-l-2 border-cyan/40 w-4 h-4 pointer-events-none" />
      <div className="absolute bottom-4 right-4 border-b-2 border-r-2 border-cyan/40 w-4 h-4 pointer-events-none" />
    </div>
  );
}
