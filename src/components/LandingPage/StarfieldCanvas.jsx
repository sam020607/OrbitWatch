import { useEffect, useRef } from 'react';

/**
 * Animated star field rendered on an HTML canvas.
 * Stars twinkle and slowly drift for a living universe feel.
 */
export default function StarfieldCanvas() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const starsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width, height;

    // Generate stars
    function initStars() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      starsRef.current = Array.from({ length: 300 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.8 + 0.2,
        alpha: Math.random(),
        alphaDir: Math.random() > 0.5 ? 1 : -1,
        speed: Math.random() * 0.015 + 0.005,
        drift: (Math.random() - 0.5) * 0.05,
        color: pickStarColor(),
      }));
    }

    function pickStarColor() {
      const palette = [
        '#ffffff', '#ffffff', '#ffffff', // mostly white
        '#c9e8ff', // blue-white
        '#ffe8c9', // yellow-white
        '#ffc9c9', // red-white
        '#00d4ff', // cyan accent
      ];
      return palette[Math.floor(Math.random() * palette.length)];
    }

    function drawStar(star) {
      ctx.save();
      ctx.globalAlpha = Math.abs(star.alpha);
      ctx.fillStyle = star.color;
      ctx.shadowColor = star.color;
      ctx.shadowBlur = star.r > 1.2 ? 4 : 0;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      // Deep space gradient background
      const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height));
      grad.addColorStop(0, '#0d1b2a');
      grad.addColorStop(0.5, '#0a0a0f');
      grad.addColorStop(1, '#050508');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle nebula blobs
      drawNebula(ctx, width * 0.2, height * 0.3, 180, 'rgba(0, 100, 200, 0.04)');
      drawNebula(ctx, width * 0.8, height * 0.6, 220, 'rgba(100, 0, 150, 0.03)');
      drawNebula(ctx, width * 0.5, height * 0.8, 150, 'rgba(0, 200, 150, 0.03)');

      starsRef.current.forEach(star => {
        // Twinkle
        star.alpha += star.speed * star.alphaDir;
        if (star.alpha >= 1 || star.alpha <= 0.1) star.alphaDir *= -1;
        // Slow drift
        star.x += star.drift;
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        drawStar(star);
      });

      // Shooting star occasionally
      if (Math.random() < 0.001) shootingStar(ctx, width, height);

      animRef.current = requestAnimationFrame(animate);
    }

    function drawNebula(ctx, x, y, r, color) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.7, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }

    let shootingStarActive = null;

    function shootingStar(ctx, w, h) {
      if (shootingStarActive) return;
      const x = Math.random() * w * 0.7;
      const y = Math.random() * h * 0.4;
      const len = 80 + Math.random() * 120;
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.5;
      let progress = 0;

      function draw() {
        if (progress >= 1) { shootingStarActive = null; return; }
        const x2 = x + Math.cos(angle) * len * progress;
        const y2 = y + Math.sin(angle) * len * progress;
        const grad = ctx.createLinearGradient(x, y, x2, y2);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.6)');
        grad.addColorStop(1, 'rgba(255,255,255,0.9)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        progress += 0.05;
        requestAnimationFrame(draw);
      }

      shootingStarActive = true;
      draw();
    }

    initStars();
    animate();

    const handleResize = () => { initStars(); };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
