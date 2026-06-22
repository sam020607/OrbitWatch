import { useRef, useEffect, useState } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';

export default function HeroGlobe() {
  const globeEl = useRef();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    // Mobile zoom level (altitude ~2.6) vs Desktop (altitude ~1.6)
    const altitude = isMobile ? 2.6 : 1.6;
    globeEl.current.pointOfView({ lat: 5, lng: 15, altitude }, 0);

    // Add a transparent rotating cloud layer above the globe surface
    const CLOUDS_IMG_URL = '//unpkg.com/three-globe/example/img/clouds.png';
    const CLOUDS_ALT = 0.004; // fraction of globe radius
    const CLOUDS_ROTATION_SPEED = -0.006; // deg/frame, slightly different from globe for parallax

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
          opacity: 0.55,
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
      if (child.isAmbientLight) child.intensity = 0.6;
      if (child.isDirectionalLight) {
        child.intensity = 1.4;
        child.position.set(-1, 0.3, 1);
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
    <Globe
      ref={globeEl}
      width={dimensions.width}
      height={dimensions.height}
      backgroundColor="rgba(0,0,0,0)"
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
      bumpImageUrl={isMobile ? undefined : "//unpkg.com/three-globe/example/img/earth-topology.png"}
      showAtmosphere={true}
      atmosphereColor="#4db8ff"
      atmosphereAltitude={0.22}
      animateIn={true}
    />
  );
}
