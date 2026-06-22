import { useRef, useEffect, useState } from 'react';
import Globe from 'react-globe.gl';

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
    controls.autoRotateSpeed = 0.35;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Angle camera down slightly for "from orbit" look
    // Mobile zoom level (altitude ~2.8) vs Desktop (altitude ~2.2)
    const altitude = isMobile ? 2.8 : 2.2;
    globeEl.current.pointOfView({ lat: 15, lng: 20, altitude }, 0);
  }, [isMobile]);

  return (
    <Globe
      ref={globeEl}
      width={dimensions.width}
      height={dimensions.height}
      backgroundColor="rgba(0,0,0,0)"
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
      bumpImageUrl={isMobile ? undefined : "//unpkg.com/three-globe/example/img/earth-topology.png"}
      atmosphereColor="#3a9fd6"
      atmosphereAltitude={0.18}
      animateIn={true}
    />
  );
}
