import { useRef, useEffect, useState } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';

export default function HeroGlobe() {
  const containerRef = useRef();
  const globeEl = useRef();
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
      setIsMobile(window.innerWidth < 768);
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(containerRef.current);

    window.addEventListener('resize', updateSize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  useEffect(() => {
    if (!globeEl.current) return;
    const controls = globeEl.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    // Close, dramatic crop — tighter altitude = bigger/closer globe
    // Mobile zoom level (altitude ~1.8) vs Desktop (altitude ~1.45)
    const altitude = isMobile ? 1.8 : 1.45;
    globeEl.current.pointOfView({ lat: 5, lng: 15, altitude }, 0);

    // Add a transparent rotating cloud layer above the globe surface
    const CLOUDS_IMG_URL = '//unpkg.com/three-globe/example/img/clouds.png';
    const CLOUDS_ALT = 0.005; // slightly higher cloud height for more depth
    const CLOUDS_ROTATION_SPEED = -0.008; // slightly faster cloud drift

    let cloudsMesh = null;
    let animationFrameId = null;

    new THREE.TextureLoader().load(CLOUDS_IMG_URL, (cloudsTexture) => {
      if (!globeEl.current) return;
      const globeRadius = globeEl.current.getGlobeRadius();
      cloudsMesh = new THREE.Mesh(
        new THREE.SphereGeometry(globeRadius * (1 + CLOUDS_ALT), 75, 75),
        new THREE.MeshPhongMaterial({
          map: cloudsTexture,
          transparent: true,
          opacity: 0.65, // thicker clouds for more visible depth
        })
      );
      globeEl.current.scene().add(cloudsMesh);

      function rotateClouds() {
        if (cloudsMesh) {
          cloudsMesh.rotation.y += (CLOUDS_ROTATION_SPEED * Math.PI) / 180;
        }
        animationFrameId = requestAnimationFrame(rotateClouds);
      }
      rotateClouds();
    });

    // Boost lighting contrast for that dramatic lit/shadow terminator
    const scene = globeEl.current.scene();
    scene.children.forEach((child) => {
      if (child.isAmbientLight) {
        child.intensity = 0.25; // lower ambient for deeper shadows (realism terminator)
      }
      if (child.isDirectionalLight) {
        child.intensity = 2.0; // higher directional intensity for bright daylight contrast
        child.position.set(-1.2, 0.4, 0.8); // shadow direction
      }
    });

    // Clean up animation on unmount or mobile change
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (cloudsMesh && globeEl.current) {
        globeEl.current.scene().remove(cloudsMesh);
      }
    };
  }, [isMobile]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl={isMobile ? undefined : "//unpkg.com/three-globe/example/img/earth-topology.png"}
        showAtmosphere={true}
        atmosphereColor="#3a9fd6"
        atmosphereAltitude={0.25} // thicker atmospheric glow
        animateIn={true}
      />
    </div>
  );
}
