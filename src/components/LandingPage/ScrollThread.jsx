import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const ScrollThread = ({ containerRef }) => {
  const [scrollHeight, setScrollHeight] = useState(0);
  const leftTextRef = useRef(null);
  const rightTextRef = useRef(null);

  // Hook into scroll progress of the container
  const { scrollYProgress } = useScroll({
    container: containerRef,
    layoutEffect: false,
  });

  // Calculate total height of the scroll container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setScrollHeight(container.scrollHeight);
    };

    updateHeight();

    window.addEventListener("resize", updateHeight);
    const observer = new ResizeObserver(updateHeight);
    observer.observe(container);

    return () => {
      window.removeEventListener("resize", updateHeight);
      observer.disconnect();
    };
  }, [containerRef]);

  // Telemetry updates (high performance, no React re-renders)
  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      if (leftTextRef.current) {
        // Calculate orbit percentage
        leftTextRef.current.textContent = `ORB: ${Math.round(v * 100)}%`;
      }
      if (rightTextRef.current) {
        // Dynamic altitude telemetry (LEO tracking from 160km to 2000km)
        const alt = Math.round(160 + v * 1840);
        rightTextRef.current.textContent = `ALT: ${alt} KM`;
      }
    });
  }, [scrollYProgress]);

  // Motion transforms for the tracker dots and glowing elements
  const dotY = useTransform(scrollYProgress, (v) => v * scrollHeight);

  // Generate tick marks every 300px
  const tickSpacing = 300;
  const ticksCount = Math.floor(scrollHeight / tickSpacing);
  const ticks = Array.from({ length: ticksCount }, (_, i) => (i + 1) * tickSpacing);

  if (scrollHeight === 0) return null;

  return (
    <>
      {/* Left Scroll Thread */}
      <div 
        className="absolute top-0 bottom-0 left-2 md:left-6 w-8 pointer-events-none z-20"
        style={{ height: scrollHeight }}
      >
        {/* Dynamic Telemetry Line */}
        <svg
          width="32"
          height={scrollHeight}
          viewBox={`0 0 32 ${scrollHeight}`}
          fill="none"
          className="overflow-visible"
        >
          {/* Base Track Line */}
          <line
            x1="16"
            y1="0"
            x2="16"
            y2={scrollHeight}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1"
          />

          {/* Draw progress thread */}
          <motion.path
            d={`M 16 0 L 16 ${scrollHeight}`}
            stroke="rgba(77, 141, 255, 0.45)"
            strokeWidth="1.5"
            style={{ pathLength: scrollYProgress }}
          />

          {/* Parallel dashed technical line */}
          <motion.path
            d={`M 20 0 L 20 ${scrollHeight}`}
            stroke="rgba(77, 141, 255, 0.2)"
            strokeWidth="1"
            strokeDasharray="4 8"
            style={{ pathLength: scrollYProgress }}
          />

          {/* Tick Marks & Grid coordinate text */}
          {ticks.map((y, idx) => (
            <g key={`left-tick-${y}`} className="opacity-40">
              <line x1="8" y1={y} x2="16" y2={y} stroke="#4d8dff" strokeWidth="1" />
              <text
                x="0"
                y={y + 3}
                fill="rgba(255, 255, 255, 0.3)"
                fontSize="7"
                fontFamily="monospace"
                textAnchor="end"
              >
                {`TRK_${String(idx + 1).padStart(2, "0")}`}
              </text>
            </g>
          ))}
        </svg>

        {/* Tracker Dot HUD */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center pointer-events-none"
          style={{ y: dotY }}
        >
          {/* Outer glowing pulsing circle */}
          <div className="absolute w-6 h-6 rounded-full border border-cyan/40 bg-cyan/5 animate-pulse" />
          {/* Inner core dot */}
          <div className="absolute w-2 h-2 rounded-full bg-cyan shadow-[0_0_8px_var(--color-cyan)]" />

          {/* Text Telemetry box overlay */}
          <div 
            ref={leftTextRef}
            className="absolute left-8 px-2 py-1 rounded bg-[#0a0d15]/90 border border-white/10 text-[9px] font-mono text-cyan uppercase tracking-wider whitespace-nowrap shadow-md"
          >
            ORB: 0%
          </div>
        </motion.div>
      </div>

      {/* Right Scroll Thread */}
      <div 
        className="absolute top-0 bottom-0 right-2 md:right-6 w-8 pointer-events-none z-20"
        style={{ height: scrollHeight }}
      >
        {/* Dynamic Telemetry Line */}
        <svg
          width="32"
          height={scrollHeight}
          viewBox={`0 0 32 ${scrollHeight}`}
          fill="none"
          className="overflow-visible"
        >
          {/* Base Track Line */}
          <line
            x1="16"
            y1="0"
            x2="16"
            y2={scrollHeight}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1"
          />

          {/* Draw progress thread */}
          <motion.path
            d={`M 16 0 L 16 ${scrollHeight}`}
            stroke="rgba(77, 141, 255, 0.45)"
            strokeWidth="1.5"
            style={{ pathLength: scrollYProgress }}
          />

          {/* Parallel dashed technical line */}
          <motion.path
            d={`M 12 0 L 12 ${scrollHeight}`}
            stroke="rgba(77, 141, 255, 0.2)"
            strokeWidth="1"
            strokeDasharray="4 8"
            style={{ pathLength: scrollYProgress }}
          />

          {/* Tick Marks & Grid coordinate text */}
          {ticks.map((y, idx) => (
            <g key={`right-tick-${y}`} className="opacity-40">
              <line x1="16" y1={y} x2="24" y2={y} stroke="#4d8dff" strokeWidth="1" />
              <text
                x="32"
                y={y + 3}
                fill="rgba(255, 255, 255, 0.3)"
                fontSize="7"
                fontFamily="monospace"
                textAnchor="start"
              >
                {`LAT_${Math.round(80 - (y / scrollHeight) * 160)}°`}
              </text>
            </g>
          ))}
        </svg>

        {/* Tracker Dot HUD */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center pointer-events-none"
          style={{ y: dotY }}
        >
          {/* Outer glowing pulsing circle */}
          <div className="absolute w-6 h-6 rounded-full border border-cyan/40 bg-cyan/5 animate-pulse" />
          {/* Inner core dot */}
          <div className="absolute w-2 h-2 rounded-full bg-cyan shadow-[0_0_8px_var(--color-cyan)]" />

          {/* Text Telemetry box overlay */}
          <div 
            ref={rightTextRef}
            className="absolute right-8 px-2 py-1 rounded bg-[#0a0d15]/90 border border-white/10 text-[9px] font-mono text-cyan uppercase tracking-wider whitespace-nowrap shadow-md"
          >
            ALT: 160 KM
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default ScrollThread;
