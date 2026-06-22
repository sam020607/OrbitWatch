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
    controls.autoRotate = false; // Rotating the globe itself for realistic terminator culling
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    // Close, dramatic camera crop - bigger globe peeking in
    const altitude = isMobile ? 1.8 : 1.45;
    globeEl.current.pointOfView({ lat: 5, lng: 15, altitude }, 0);

    // Bulletproof helper to retrieve the globe material
    const getGlobeMaterial = () => {
      if (!globeEl.current) return null;
      if (typeof globeEl.current.globeMaterial === 'function') {
        return globeEl.current.globeMaterial();
      }
      if (globeEl.current.globeMaterial) {
        return globeEl.current.globeMaterial;
      }
      let foundMaterial = null;
      const scene = globeEl.current.scene();
      if (scene) {
        scene.traverse((child) => {
          if (child.isMesh && child.material && !child.material.transparent) {
            foundMaterial = child.material;
          }
        });
      }
      return foundMaterial;
    };

    let materialConfigured = false;

    // Add a transparent rotating cloud layer above the globe surface
    const CLOUDS_IMG_URL = '//unpkg.com/three-globe/example/img/clouds.png';
    const CLOUDS_ALT = 0.005; // Cloud height offset
    const CLOUDS_ROTATION_SPEED = -0.008; // Drift speed relative to globe rotation

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
          opacity: 0.65,
        })
      );
      globeEl.current.scene().add(cloudsMesh);
    });

    // Real global city coordinates (warm amber glimmers) - aligned with the flat map
    const CITY_LIGHTS = [
      // North America
      [40.7128, -74.0060], [34.0522, -118.2437], [41.8781, -87.6298], [29.7604, -95.3698], [45.5017, -73.5673],
      [19.4326, -99.1332], [25.7617, -80.1918], [37.7749, -122.4194], [47.6062, -122.3321], [43.6532, -79.3832],
      // South America
      [-23.5505, -46.6333], [-22.9068, -43.1729], [-34.6037, -58.3816], [-12.0464, -77.0428], [4.7110, -74.0721],
      [-33.4489, -70.6693], [-10.9631, -61.5186], [-1.8312, -78.1834],
      // Europe
      [51.5074, -0.1278], [48.8566, 2.3522], [52.5200, 13.4050], [41.9028, 12.4964], [40.4168, -3.7037],
      [55.7558, 37.6173], [52.3676, 4.9041], [50.8503, 4.3517], [48.2082, 16.3738], [59.3293, 18.0686],
      // Africa
      [30.0444, 31.2357], [-26.2041, 28.0473], [6.5244, 3.3792], [33.5731, -7.5898], [9.0300, 38.7400],
      [-1.2921, 36.8219], [-4.3250, 15.3222], [14.6937, -17.4441],
      // Asia & Middle East
      [35.6762, 139.6503], [37.5665, 126.9780], [31.2304, 121.4737], [39.9042, 116.4074], [22.3964, 114.1095],
      [19.0760, 72.8777], [28.6139, 77.2090], [13.7563, 100.5018], [-6.2088, 106.8456], [14.5995, 120.9842],
      [1.3521, 103.8198], [25.2048, 55.2708], [24.7136, 46.6753], [35.6892, 51.3890], [24.8607, 67.0011],
      [23.8103, 90.4125], [16.8409, 96.1735], [10.8231, 106.6297],
      // Oceania
      [-33.8688, 151.2093], [-37.8136, 144.9631], [-36.8485, 174.7633], [-27.4698, 153.0251]
    ];

    // Seeded random generator to match flat-map star placements
    function seededRandom(seed) {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    }

    // Ocean coordinate bounding boxes (silver glimmers) - aligned with the flat map
    const oceanBoxes = [
      [10, 55, 140, 178], [10, 55, -178, -125],
      [-55, -5, 150, 178], [-55, -5, -178, -85],
      [10, 60, -60, -25], [-50, -5, -35, 10],
      [-45, -5, 40, 105], [-75, -55, -180, 180],
      [5, 22, 55, 95], [30, 45, -5, 30],
      [52, 66, 160, 180], [52, 66, -180, -140],
      [55, 75, -70, -50], [60, 80, -25, 45],
      [52, 65, -95, -75], [72, 83, -160, -110],
      [76, 83, 60, 175]
    ];

    const sparklesGroup = new THREE.Group();
    const sparklesData = [];
    const globeRadius = globeEl.current.getGlobeRadius();

    // Generate programmatic soft-glowing Canvas radial-gradient textures
    function createGlowTexture(colorStr) {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, '#ffffff'); // Intense core
      gradient.addColorStop(0.2, '#ffffff');
      gradient.addColorStop(0.5, colorStr); // Colored halo
      gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)'); // Smooth fadeout
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, Math.PI * 2);
      ctx.fill();
      
      return new THREE.CanvasTexture(canvas);
    }

    const landGlowTexture = createGlowTexture('#ffa726'); // Warm amber
    const oceanGlowTexture = createGlowTexture('#e2e8f0'); // Silver-white

    const addSparkle = (lat, lng, isOceanStar) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      
      const r = globeRadius * 1.0025; // Slightly above surface to prevent clipping
      const x = -(r * Math.sin(phi) * Math.sin(theta));
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.cos(theta);
      
      const material = new THREE.SpriteMaterial({
        map: isOceanStar ? oceanGlowTexture : landGlowTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0
      });
      
      const sprite = new THREE.Sprite(material);
      sprite.position.set(x, y, z);
      
      const baseScale = isOceanStar ? 1.0 : 1.3;
      sprite.scale.set(baseScale, baseScale, 1.0);
      
      sparklesGroup.add(sprite);
      sparklesData.push({
        sprite,
        material,
        isOcean: isOceanStar,
        baseScale,
        phase: Math.random() * Math.PI * 2,
        speed: 0.03 + Math.random() * 0.04
      });
    };

    // 1. Add land city lights
    CITY_LIGHTS.forEach(([lat, lng]) => {
      addSparkle(lat, lng, false);
    });

    // 2. Add ocean glimmers
    let seed = 100;
    oceanBoxes.forEach((box) => {
      const [minLat, maxLat, minLon, maxLon] = box;
      const area = (maxLat - minLat) * (maxLon - minLon);
      const starCount = Math.max(8, Math.floor(area / 180));
      
      for (let i = 0; i < starCount; i++) {
        const lat = minLat + seededRandom(seed++) * (maxLat - minLat);
        const lon = minLon + seededRandom(seed++) * (maxLon - minLon);
        addSparkle(lat, lon, true);
      }
    });

    globeEl.current.scene().add(sparklesGroup);

    // Setup high-contrast lighting
    let lightsConfigured = false;
    const lightDir = new THREE.Vector3(2.0, 0.5, 1.5).normalize(); // Solar lighting from bottom-right crescent angle

    // Unified Animation Loop
    function animate() {
      // Configure globe material once it is loaded
      if (!materialConfigured) {
        const globeMaterial = getGlobeMaterial();
        if (globeMaterial) {
          globeMaterial.shininess = 35;
          globeMaterial.specular = new THREE.Color(0x222222); // Subtler specular reflections
          if (!isMobile) {
            globeMaterial.bumpScale = 0.8; // Soft topographic details
          }
          materialConfigured = true;
        }
      }

      // Adjust standard lights dynamically once WebGL mounts them
      if (!lightsConfigured) {
        const scene = globeEl.current.scene();
        if (scene) {
          scene.traverse((child) => {
            if (child.isAmbientLight) {
              child.intensity = 0.15; // Softer shadows in space
              lightsConfigured = true;
            }
            if (child.isDirectionalLight) {
              child.intensity = 2.2; // Dimmed, elegant sunlight
              child.position.set(2.0, 0.5, 1.5);
              lightsConfigured = true;
            }
          });
        }
      }

      // Rotate the globe on its axis
      if (globeEl.current) {
        globeEl.current.rotation.y += 0.0012;
      }

      // Rotate sparkles in sync with globe
      if (sparklesGroup) {
        sparklesGroup.rotation.y += 0.0012;
      }

      // Rotate clouds slightly faster for drift effect
      if (cloudsMesh) {
        cloudsMesh.rotation.y += 0.0012 + (CLOUDS_ROTATION_SPEED * Math.PI) / 180;
      }

      // Animate individual sparkles based on their world position relative to sunlight
      sparklesData.forEach((s) => {
        const worldPos = new THREE.Vector3();
        s.sprite.getWorldPosition(worldPos);
        const normal = worldPos.clone().normalize();
        const dot = normal.dot(lightDir);

        s.phase += s.speed;

        // Twinkle only on the dark side (dot < -0.1)
        if (dot < -0.1) {
          const baseOpacity = s.isOcean ? 0.45 : 0.65;
          s.material.opacity = (0.1 + Math.abs(Math.sin(s.phase)) * 0.9) * baseOpacity;
          
          const scale = s.baseScale * (0.7 + Math.abs(Math.sin(s.phase)) * 0.5);
          s.sprite.scale.set(scale, scale, 1.0);
        } else {
          // Hide completely on the sunlit day side
          s.material.opacity = 0;
          s.sprite.scale.set(0, 0, 1.0);
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    }
    animate();

    // Clean up animation & resources on unmount
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
        atmosphereAltitude={0.15} // Tight atmosphere glow to prevent washing out surface colors
        animateIn={true}
      />
    </div>
  );
}
