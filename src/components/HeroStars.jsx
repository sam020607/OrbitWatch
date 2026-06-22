import { useEffect, useRef } from 'react';

export default function HeroStars() {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let stars = [];
    
    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement.clientHeight || window.innerHeight;
      initStars();
    };

    const initStars = () => {
      stars = [];
      const count = 200;
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.1 + 0.3,
          alpha: Math.random(),
          speed: 0.005 + Math.random() * 0.012,
          growing: Math.random() > 0.5
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      stars.forEach(star => {
        // Fade in and out
        if (star.growing) {
          star.alpha += star.speed;
          if (star.alpha >= 0.95) {
            star.alpha = 0.95;
            star.growing = false;
          }
        } else {
          star.alpha -= star.speed;
          if (star.alpha <= 0.15) {
            star.alpha = 0.15;
            star.growing = true;
          }
        }
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fill();
      });
      
      animationFrameId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none" 
    />
  );
}
