import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Timer, Eye, Navigation, AlertTriangle } from 'lucide-react';
import { formatCountdown, formatTime, formatDuration, secondsUntil, azimuthToCompass, magnitudeToDescription } from '../../utils/orbitMath.js';

/**
 * PassCountdown — Prominent countdown timer to the next ISS pass.
 * Shows: countdown HH:MM:SS, azimuth, max elevation, start/end times.
 * Pulsing cyan ring animation when < 5 minutes away.
 * Auto-advances to next pass after each one completes.
 */
export default function PassCountdown() {
  const { state } = useApp();
  const { issNextPasses } = state;

  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [passIdx, setPassIdx] = useState(0);

  // Tick every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Find the current or next pass
  const upcomingPasses = issNextPasses.filter(p => p.endUTC > now);
  const currentPass = upcomingPasses[Math.min(passIdx, upcomingPasses.length - 1)];

  // Auto-advance to next pass when one ends
  useEffect(() => {
    if (currentPass && currentPass.endUTC < now) {
      setPassIdx(prev => Math.min(prev + 1, upcomingPasses.length - 1));
    }
  }, [now, currentPass, upcomingPasses.length]);

  if (!currentPass) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <Timer className="w-8 h-8 text-muted mb-3 opacity-40" />
        <p className="text-muted text-sm">No pass data available</p>
        <p className="text-muted text-xs mt-1">Select a location to see ISS passes</p>
      </div>
    );
  }

  const secsToStart = secondsUntil(currentPass.startUTC);
  const secsToEnd = secondsUntil(currentPass.endUTC);
  const isVisible = now >= currentPass.startUTC && now <= currentPass.endUTC;
  const isImminent = secsToStart > 0 && secsToStart < 300; // < 5 min

  const countdownLabel = isVisible
    ? 'VISIBLE NOW — ends in'
    : 'ISS passes over you in';

  const countdownSecs = isVisible ? secsToEnd : secsToStart;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Timer className="w-4 h-4 text-cyan" />
        <h2 className="text-xs font-mono font-bold tracking-widest uppercase text-muted-light">
          Next ISS Pass
        </h2>
        {isImminent && (
          <span className="ml-auto badge badge-cyan animate-pulse" style={{ fontSize: 9 }}>
            INCOMING
          </span>
        )}
        {isVisible && (
          <span className="ml-auto badge badge-green" style={{ fontSize: 9 }}>
            VISIBLE NOW
          </span>
        )}
      </div>

      {/* Countdown timer */}
      <div className={`relative flex flex-col items-center justify-center py-5 rounded-xl border transition-all duration-1000
        ${isVisible
          ? 'border-success/40 bg-success/5'
          : isImminent
            ? 'border-cyan/60 bg-cyan/5 animate-pulse-glow'
            : 'border-border bg-navy/30'
        }`}
      >
        {/* Pulsing outer ring for imminent */}
        {isImminent && (
          <div className="absolute inset-0 rounded-xl border-2 border-cyan/20 animate-ping" />
        )}

        <p className="text-muted-light text-xs font-mono mb-2 text-center px-4">{countdownLabel}</p>

        <div
          className="font-mono text-4xl font-bold tracking-wider"
          style={{
            color: isVisible ? '#10b981' : '#00d4ff',
            textShadow: `0 0 20px ${isVisible ? 'rgba(16,185,129,0.6)' : 'rgba(0,212,255,0.6)'}`,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatCountdown(countdownSecs)}
        </div>

        {/* Magnitude */}
        {currentPass.mag != null && (
          <p className="mt-2 text-xs text-muted font-mono">
            Brightness: <span className="text-amber">{magnitudeToDescription(currentPass.mag)}</span>
            <span className="text-muted ml-1">({currentPass.mag > 0 ? '+' : ''}{currentPass.mag?.toFixed(1)} mag)</span>
          </p>
        )}
      </div>

      {/* Pass details grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard icon={<Navigation className="w-3 h-3" />} label="Max Elevation">
          <span className="font-mono text-lg font-bold text-cyan">{currentPass.maxEl}°</span>
        </StatCard>
        <StatCard icon={<Eye className="w-3 h-3" />} label="Peak Direction">
          <span className="font-mono text-lg font-bold text-amber">{currentPass.maxAzCompass}</span>
          <span className="font-mono text-xs text-muted ml-1">{currentPass.maxAz}°</span>
        </StatCard>
        <StatCard label="AOS (Start)" sub={`from ${currentPass.startAzCompass}`}>
          <span className="font-mono text-sm font-bold text-text">{formatTime(currentPass.startUTC)}</span>
        </StatCard>
        <StatCard label="LOS (End)" sub={`to ${currentPass.endAzCompass}`}>
          <span className="font-mono text-sm font-bold text-text">{formatTime(currentPass.endUTC)}</span>
        </StatCard>
      </div>

      {/* Duration bar */}
      <div>
        <div className="flex justify-between text-xs font-mono text-muted mb-1">
          <span>Duration</span>
          <span className="text-muted-light">{formatDuration(currentPass.duration)}</span>
        </div>
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          {isVisible ? (
            <div
              className="h-full bg-success rounded-full transition-all duration-1000"
              style={{ width: `${((currentPass.duration - secsToEnd) / currentPass.duration) * 100}%` }}
            />
          ) : (
            <div className="h-full bg-cyan/40 rounded-full" style={{ width: '100%' }} />
          )}
        </div>
      </div>

      {/* Look up instruction */}
      <div className="px-3 py-2 rounded-lg bg-navy/50 border border-border text-center">
        <p className="text-xs text-muted-light font-sans leading-relaxed">
          {isVisible
            ? `🌟 Look ${currentPass.maxAzCompass} — ${currentPass.maxEl}° above the horizon`
            : `🧭 Point ${currentPass.startAzCompass} at ${currentPass.maxEl}° elevation at ${formatTime(currentPass.startUTC)}`
          }
        </p>
      </div>

      {/* Upcoming passes nav */}
      {upcomingPasses.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-muted text-xs font-mono">More tonight:</span>
          <div className="flex gap-1 flex-wrap">
            {upcomingPasses.slice(0, 4).map((p, i) => (
              <button
                key={i}
                onClick={() => setPassIdx(i)}
                className={`text-xs font-mono px-2 py-0.5 rounded border transition-all
                  ${i === passIdx
                    ? 'border-cyan text-cyan bg-cyan/10'
                    : 'border-border text-muted hover:border-border-light hover:text-muted-light'
                  }`}
              >
                {formatTime(p.startUTC)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, sub, children }) {
  return (
    <div className="flex flex-col gap-1 px-3 py-2 rounded-lg bg-navy/40 border border-border">
      <div className="flex items-center gap-1 text-muted" style={{ fontSize: 10 }}>
        {icon}
        <span className="font-mono tracking-wide uppercase">{label}</span>
        {sub && <span className="ml-auto text-muted opacity-70">{sub}</span>}
      </div>
      <div className="flex items-baseline gap-1">{children}</div>
    </div>
  );
}
