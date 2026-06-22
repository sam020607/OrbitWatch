import React, { useRef, useEffect } from 'react';

// Nebula color presets for each step (0 to 6)
const NEBULA_PRESETS = [
  { c1: { r: 10, g: 18, b: 44 }, c2: { r: 20, g: 14, b: 43 } }, // Step 0: Deep Navy & Indigo
  { c1: { r: 21, g: 10, b: 43 }, c2: { r: 14, g: 24, b: 54 } }, // Step 1: Deep Indigo & Purple
  { c1: { r: 4, g: 31, b: 43 },  c2: { r: 13, g: 23, b: 46 } }, // Step 2: Teal & Dark Blue
  { c1: { r: 3, g: 36, b: 36 },  c2: { r: 21, g: 13, b: 43 } }, // Step 3: Teal & Indigo
  { c1: { r: 9, g: 7, b: 36 },   c2: { r: 3, g: 26, b: 48 } },  // Step 4: Indigo & Deep Blue
  { c1: { r: 28, g: 20, b: 10 }, c2: { r: 6, g: 16, b: 38 } },  // Step 5: Amber Tint & Navy
  { c1: { r: 3, g: 33, b: 43 },  c2: { r: 11, g: 18, b: 54 } }, // Step 6: Cyber Teal & Electric Blue
];

// Camera path targets for each step (0 to 6)
const CAMERA_PRESETS = [
  { x: 0, y: 0, scale: 1.0 },
  { x: -50, y: 30, scale: 1.06 },
  { x: 40, y: -30, scale: 1.12 },
  { x: -60, y: -25, scale: 1.08 },
  { x: 30, y: 50, scale: 1.18 },
  { x: -30, y: -40, scale: 1.14 },
  { x: 0, y: 0, scale: 1.05 },
];

export default function OnboardingSpaceBackground({ currentSlide = 0 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let dpr = window.devicePixelRatio || 1;

    // Handle screen resize
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      dpr = window.devicePixelRatio || 1;
    };
    window.addEventListener('resize', handleResize);

    // 1. Generate Starfield (with coordinates spanning wider than the viewport to allow panning)
    const numStars = 320;
    const stars = [];
    for (let i = 0; i < numStars; i++) {
      stars.push({
        // Star positions relative to a virtual canvas larger than screen size
        x: (Math.random() - 0.5) * width * 2.5,
        y: (Math.random() - 0.5) * height * 2.5,
        size: Math.random() * 1.5 + 0.4,
        baseAlpha: Math.random() * 0.7 + 0.2,
        alpha: Math.random() * 0.9,
        twinkleSpeed: Math.random() * 0.03 + 0.005,
        twinkleDelay: Math.random() * Math.PI * 2,
        color: Math.random() > 0.85 ? 'rgba(165, 243, 252, ' : 'rgba(255, 255, 255, ', // Cyan vs White stars
      });
    }

    // 2. Generate 3D Earth City Lights (scattered on unit sphere)
    const numCities = 240;
    const cities = [];
    for (let i = 0; i < numCities; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1); // uniform sphere sampling
      cities.push({
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.sin(phi) * Math.sin(theta),
        z: Math.cos(phi),
        intensity: Math.random() * 0.75 + 0.25,
      });
    }

    // 3. Generate Mock Constellations
    const constellations = [
      // Constellation 1: Cluster of connected stars
      {
        nodes: [
          { x: -width * 0.4, y: -height * 0.4 },
          { x: -width * 0.3, y: -height * 0.48 },
          { x: -width * 0.22, y: -height * 0.35 },
          { x: -width * 0.15, y: -height * 0.4 },
          { x: -width * 0.1, y: -height * 0.25 },
        ],
        opacity: 0.15,
      },
      // Constellation 2
      {
        nodes: [
          { x: width * 0.2, y: -height * 0.6 },
          { x: width * 0.35, y: -height * 0.52 },
          { x: width * 0.38, y: -height * 0.7 },
          { x: width * 0.5, y: -height * 0.65 },
        ],
        opacity: 0.12,
      },
    ];

    // State variables for smooth camera/color interpolation
    const presetIndex = Math.min(Math.max(0, currentSlide), NEBULA_PRESETS.length - 1);
    
    let camX = CAMERA_PRESETS[presetIndex].x;
    let camY = CAMERA_PRESETS[presetIndex].y;
    let scale = CAMERA_PRESETS[presetIndex].scale;
    
    let c1 = { ...NEBULA_PRESETS[presetIndex].c1 };
    let c2 = { ...NEBULA_PRESETS[presetIndex].c2 };

    // Orbits properties (semi-transparent ellipses that rotate in 3D)
    const orbits = [
      { radiusX: 280, radiusY: 90, rotation: 0.2, speed: 0.0003, satSpeed: 0.008, satT: Math.random() * 10, color: 'rgba(6, 182, 212, 0.18)' },
      { radiusX: 360, radiusY: 130, rotation: -0.3, speed: -0.0002, satSpeed: 0.005, satT: Math.random() * 10, color: 'rgba(6, 182, 212, 0.12)' },
      { radiusX: 420, radiusY: 100, rotation: 0.6, speed: 0.0001, satSpeed: 0.004, satT: Math.random() * 10, color: 'rgba(77, 141, 255, 0.1)' },
    ];

    let idleEarthRotation = 0;
    let lastTime = performance.now();

    // ───────────────── ANIMATION LOOP ─────────────────
    const animate = (currentTime) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // 1. Interpolate camera view towards target preset
      const targetPreset = CAMERA_PRESETS[presetIndex];
      const targetCam = CAMERA_PRESETS[Math.min(currentSlide, CAMERA_PRESETS.length - 1)];
      const targetNebula = NEBULA_PRESETS[Math.min(currentSlide, NEBULA_PRESETS.length - 1)];

      const ease = 0.04; // Smooth interpolation speed
      camX += (targetCam.x - camX) * ease;
      camY += (targetCam.y - camY) * ease;
      scale += (targetCam.scale - scale) * ease;

      c1.r += (targetNebula.c1.r - c1.r) * ease;
      c1.g += (targetNebula.c1.g - c1.g) * ease;
      c1.b += (targetNebula.c1.b - c1.b) * ease;

      c2.r += (targetNebula.c2.r - c2.r) * ease;
      c2.g += (targetNebula.c2.g - c2.g) * ease;
      c2.b += (targetNebula.c2.b - c2.b) * ease;

      // Slowly crawl Earth rotation
      idleEarthRotation += 0.0004;

      // Clear Screen
      ctx.clearRect(0, 0, width, height);

      // ───────────────── DRAW NEBULA ─────────────────
      // Draw layered, morphing radial gradients at the back
      const nebulaColor1 = `rgb(${Math.round(c1.r)}, ${Math.round(c1.g)}, ${Math.round(c1.b)})`;
      const nebulaColor2 = `rgb(${Math.round(c2.r)}, ${Math.round(c2.g)}, ${Math.round(c2.b)})`;

      ctx.save();
      // Background base
      ctx.fillStyle = '#030509';
      ctx.fillRect(0, 0, width, height);

      // Gradient 1 (Indigo/Purple cloud at bottom-right)
      const grad1 = ctx.createRadialGradient(
        width * 0.7 + camX * 0.4, height * 0.75 + camY * 0.4, 0,
        width * 0.7 + camX * 0.4, height * 0.75 + camY * 0.4, Math.max(width, height) * 0.6
      );
      grad1.addColorStop(0, `rgba(${Math.round(c1.r)}, ${Math.round(c1.g)}, ${Math.round(c1.b)}, 0.45)`);
      grad1.addColorStop(0.5, `rgba(${Math.round(c1.r)}, ${Math.round(c1.g)}, ${Math.round(c1.b)}, 0.15)`);
      grad1.addColorStop(1, 'rgba(3, 5, 9, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      // Gradient 2 (Cyan/Teal cloud at top-left)
      const grad2 = ctx.createRadialGradient(
        width * 0.2 + camX * 0.6, height * 0.2 + camY * 0.6, 0,
        width * 0.2 + camX * 0.6, height * 0.2 + camY * 0.6, Math.max(width, height) * 0.5
      );
      grad2.addColorStop(0, `rgba(${Math.round(c2.r)}, ${Math.round(c2.g)}, ${Math.round(c2.b)}, 0.4)`);
      grad2.addColorStop(0.6, `rgba(${Math.round(c2.r)}, ${Math.round(c2.g)}, ${Math.round(c2.b)}, 0.1)`);
      grad2.addColorStop(1, 'rgba(3, 5, 9, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // ───────────────── CAMERA TRANSFORM ─────────────────
      ctx.save();
      // Centered transform matrix
      ctx.translate(width / 2, height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2 + camX, -height / 2 + camY);

      // ───────────────── DRAW STARFIELD ─────────────────
      const time = currentTime / 1000;
      stars.forEach(star => {
        // Slow drift
        star.x += 0.04;
        // Twinkling simulation
        const twinkleAlpha = star.baseAlpha + Math.sin(time * star.twinkleSpeed * 100 + star.twinkleDelay) * 0.18;
        ctx.fillStyle = `${star.color}${Math.max(0.05, Math.min(twinkleAlpha, 1.0))})`;
        ctx.fillRect(width / 2 + star.x, height / 2 + star.y, star.size, star.size);
      });

      // ───────────────── DRAW CONSTELLATIONS ─────────────────
      ctx.strokeStyle = 'rgba(77, 141, 255, 0.05)';
      ctx.lineWidth = 0.8;
      const constellationOffset = 0.15; // move slightly slower than background stars
      const cOffsetX = camX * constellationOffset;
      const cOffsetY = camY * constellationOffset;

      constellations.forEach(c => {
        ctx.save();
        ctx.translate(cOffsetX, cOffsetY);
        ctx.strokeStyle = `rgba(77, 141, 255, ${c.opacity})`;
        ctx.beginPath();
        c.nodes.forEach((node, idx) => {
          if (idx === 0) ctx.moveTo(width / 2 + node.x, height / 2 + node.y);
          else ctx.lineTo(width / 2 + node.x, height / 2 + node.y);
        });
        ctx.stroke();

        // Draw small nodes
        ctx.fillStyle = 'rgba(165, 243, 252, 0.4)';
        c.nodes.forEach(node => {
          ctx.beginPath();
          ctx.arc(width / 2 + node.x, height / 2 + node.y, 2, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      });

      // ───────────────── DRAW EARTH & ORBITS ─────────────────
      // Earth coordinate calculations
      const earthRadius = Math.min(width, height) * 0.3;
      const earthX = width * 0.82;
      const earthY = height * 0.82;

      // A. Earth Atmosphere Limb (behind Earth)
      ctx.save();
      const atmosGrad = ctx.createRadialGradient(
        earthX - earthRadius * 0.15, earthY - earthRadius * 0.15, earthRadius * 0.8,
        earthX - earthRadius * 0.15, earthY - earthRadius * 0.15, earthRadius * 1.12
      );
      atmosGrad.addColorStop(0, 'rgba(0, 180, 255, 0.38)');
      atmosGrad.addColorStop(0.2, 'rgba(0, 140, 255, 0.25)');
      atmosGrad.addColorStop(0.65, 'rgba(0, 80, 255, 0.08)');
      atmosGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = atmosGrad;
      ctx.beginPath();
      ctx.arc(earthX, earthY, earthRadius * 1.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // B. Floating Orbital Rings & Satellites
      orbits.forEach(orbit => {
        orbit.rotation += orbit.speed;
        orbit.satT += orbit.satSpeed;

        ctx.save();
        ctx.translate(earthX, earthY);
        ctx.rotate(orbit.rotation);

        // Draw Orbit Path Ring
        ctx.strokeStyle = orbit.color;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.ellipse(0, 0, orbit.radiusX, orbit.radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Draw Active Mock Satellite on Orbit Path
        const satX = orbit.radiusX * Math.cos(orbit.satT);
        const satY = orbit.radiusY * Math.sin(orbit.satT);
        
        ctx.fillStyle = '#22d3ee'; // cyan glowing marker
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(satX, satY, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // C. Earth Core Sphere
      ctx.save();
      // Create clipping mask for Earth body
      ctx.beginPath();
      ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
      ctx.clip();

      // Draw dark shadow base
      ctx.fillStyle = '#06080e';
      ctx.fillRect(earthX - earthRadius, earthY - earthRadius, earthRadius * 2, earthRadius * 2);

      // Draw City Lights (Visible on shadow side)
      // Rotational angle combines slide targets and continuous crawling
      const earthAngle = - (currentSlide * (Math.PI / 10)) - idleEarthRotation;
      const cosRot = Math.cos(earthAngle);
      const sinRot = Math.sin(earthAngle);

      // Sunlit illumination vector (top-left, pointing slightly forward)
      const lx = -0.75;
      const ly = -0.45;
      const lz = 0.48;

      cities.forEach(city => {
        // Spherical rotate around Y axis
        const rx = city.x * cosRot - city.z * sinRot;
        const rz = city.x * sinRot + city.z * cosRot;
        const ry = city.y;

        // Front-facing culling (rz > 0)
        if (rz > 0) {
          // Dot product relative to light source
          const dot = rx * lx + ry * ly + rz * lz;

          // Display city lights on shadow side
          if (dot < 0.25) {
            let opacity = city.intensity * 0.75;
            if (dot > -0.05) {
              // Fade lights gradually at day-night terminator boundary
              opacity *= (0.25 - dot) / 0.3;
            }

            const px = earthX + rx * earthRadius;
            const py = earthY + ry * earthRadius;

            ctx.fillStyle = `rgba(253, 186, 116, ${Math.max(0, opacity)})`;
            ctx.fillRect(px, py, 1.2, 1.2);
          }
        }
      });

      // Draw Daylight illumination crescent mask
      const dayGrad = ctx.createRadialGradient(
        earthX - earthRadius * 0.6, earthY - earthRadius * 0.6, earthRadius * 0.2,
        earthX - earthRadius * 0.4, earthY - earthRadius * 0.4, earthRadius * 1.55
      );
      dayGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');       // Sun reflect specular peak
      dayGrad.addColorStop(0.1, 'rgba(200, 225, 255, 0.9)');
      dayGrad.addColorStop(0.35, 'rgba(30, 120, 255, 0.7)');       // Rich blue oceans
      dayGrad.addColorStop(0.55, 'rgba(0, 70, 180, 0.4)');
      dayGrad.addColorStop(0.70, 'rgba(0, 15, 60, 0.15)');
      dayGrad.addColorStop(0.78, 'rgba(0, 0, 0, 0.96)');           // Sharp terminator transition
      dayGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.98)');            // Shadowed side
      
      ctx.fillStyle = dayGrad;
      ctx.fillRect(earthX - earthRadius, earthY - earthRadius, earthRadius * 2, earthRadius * 2);

      // Draw atmosphere limb gradient overlay to smooth out Earth perimeter edge
      const edgeGrad = ctx.createRadialGradient(
        earthX, earthY, earthRadius * 0.95,
        earthX, earthY, earthRadius
      );
      edgeGrad.addColorStop(0, 'rgba(0, 130, 255, 0)');
      edgeGrad.addColorStop(0.4, 'rgba(0, 150, 255, 0.15)');
      edgeGrad.addColorStop(1.0, 'rgba(165, 243, 252, 0.5)'); // atmospheric limb
      
      ctx.fillStyle = edgeGrad;
      ctx.fillRect(earthX - earthRadius, earthY - earthRadius, earthRadius * 2, earthRadius * 2);
      ctx.restore(); // Restore clip mask

      ctx.restore(); // Restore camera scaling transform

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentSlide]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none w-full h-full">
      {/* HTML5 Canvas Background */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
      
      {/* Vignette Overlay */}
      <div className="absolute inset-0 bg-radial-vignette opacity-70 mix-blend-multiply pointer-events-none" />
      
      {/* CRT Scanline Scan lines */}
      <div className="absolute inset-0 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(18, 24, 38, 0) 50%, rgba(0, 0, 0, 0.12) 50%)',
             backgroundSize: '100% 4px',
             opacity: 0.75
           }}
      />
    </div>
  );
}
