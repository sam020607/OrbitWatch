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
    });

    // Generate sparkling particles on the globe surface to make it look alive/glittering
    const SPARKLE_COUNT = 90;
    const sparklesGroup = new THREE.Group();
    const sparklesData = [];
    const globeRadius = globeEl.current.getGlobeRadius();
    const sparkleGeo = new THREE.SphereGeometry(0.35, 6, 6);

    const colors = [0xffffff, 0x4db8ff, 0xffaa44, 0x88ffcc];

    for (let i = 0; i < SPARKLE_COUNT; i++) {
      const lat = (Math.random() - 0.5) * 140; // latitude (-70 to 70)
      const lng = (Math.random() - 0.5) * 360; // longitude (-180 to 180)
      
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      
      const r = globeRadius * 1.0025; // slightly above surface
      const x = -(r * Math.sin(phi) * Math.sin(theta));
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.cos(theta);
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: Math.random()
      });
      
      const mesh = new THREE.Mesh(sparkleGeo, material);
      mesh.position.set(x, y, z);
      
      sparklesGroup.add(mesh);
      sparklesData.push({
        mesh,
        material,
        phase: Math.random() * Math.PI * 2,
        speed: 0.025 + Math.random() * 0.045
      });
    }
    globeEl.current.scene().add(sparklesGroup);

    // Boost lighting contrast for that dramatic lit/shadow terminator
    const scene = globeEl.current.scene();
    scene.children.forEach((child) => {
      if (child.isAmbientLight) {
        child.intensity = 0.25; // lower ambient for deeper shadows (realism terminator)
      }
      if (child.isDirectionalLight) {
        child.intensity = 2.0; // higher directional intensity for bright daylight contrast
        child.position.set(1.5, 0.3, 0.5); // light source on the right side
      }
    });

    // Unified Animation Loop
    function animate() {
      if (cloudsMesh) {
        cloudsMesh.rotation.y += (CLOUDS_ROTATION_SPEED * Math.PI) / 180;
      }

      // Animate sparkles (pulsing opacity & scale to create a glittering effect)
      sparklesData.forEach(s => {
        s.phase += s.speed;
        s.material.opacity = 0.15 + Math.abs(Math.sin(s.phase)) * 0.85;
        const scale = 0.65 + Math.abs(Math.sin(s.phase)) * 0.7;
        s.mesh.scale.set(scale, scale, scale);
      });

      animationFrameId = requestAnimationFrame(animate);
    }
    animate();

    // Clean up animation on unmount or mobile change
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (globeEl.current) {
        const scene = globeEl.current.scene();
        if (cloudsMesh) scene.remove(cloudsMesh);
        scene.remove(sparklesGroup);
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
