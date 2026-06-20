import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  getAllSourceSnapshots,
  getTLEFreshness,
  getEventLog,
  subscribe,
  TLE_THRESHOLDS
} from '../../services/apiMonitor.js';
import { Activity, Shield, RefreshCw, Terminal, Clock, Server } from 'lucide-react';

export default function DiagnosticsPanel() {
  const [telemetry, setTelemetry] = useState(() => ({
    sources: getAllSourceSnapshots(),
    tle: getTLEFreshness(),
    log: getEventLog(),
  }));

  useEffect(() => {
    // Subscribe to real-time apiMonitor updates
    return subscribe(() => {
      setTelemetry({
        sources: getAllSourceSnapshots(),
        tle: getTLEFreshness(),
        log: getEventLog(),
      });
    });
  }, []);

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'ok':
        return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      case 'degraded':
        return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse';
      case 'down':
        return 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-ping';
      default:
        return 'bg-zinc-500';
    }
  };

  const getStatusLabelClass = (status) => {
    switch (status) {
      case 'ok':
        return 'text-emerald-400 font-bold';
      case 'degraded':
        return 'text-amber-400 font-bold';
      case 'down':
        return 'text-rose-400 font-bold';
      default:
        return 'text-zinc-400';
    }
  };

  const getTleStatusBadge = (status) => {
    switch (status) {
      case 'fresh':
        return {
          label: 'FRESH',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          desc: 'High precision orbital propagation'
        };
      case 'stale':
        return {
          label: 'STALE',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          desc: 'Minor trajectory drift expected'
        };
      case 'very-stale':
        return {
          label: 'CRITICAL DRIFT',
          color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          desc: 'Significant propagation error. Sync recommended.'
        };
      default:
        return {
          label: 'UNKNOWN',
          color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
          desc: 'No orbital sync events recorded'
        };
    }
  };

  const formatTimeSince = (timestamp) => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="flex flex-col h-full bg-panel/40 overflow-hidden font-sans select-none">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        
        {/* ── SECTION 1: DATA SOURCE STATUS ── */}
        <section className="space-y-2.5">
          <div className="flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-wider text-muted px-1">
            <Server className="w-3.5 h-3.5" />
            <span>Data Source Status</span>
          </div>

          <div className="space-y-2.5">
            {telemetry.sources.map((src) => {
              const timeSinceSuccess = formatTimeSince(src.lastSuccessAt);
              const responseTime = src.lastResponseMs !== null ? `${src.lastResponseMs} ms` : '—';
              const errorText = src.errorMessage;
              
              return (
                <div
                  key={src.id}
                  className="p-3.5 flex flex-col gap-2 transition-all duration-300"
                  style={{
                    background: 'rgba(15, 22, 38, 0.55)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.03)',
                    borderRadius: '16px',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)',
                  }}
                >
                  {/* Title & Status Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-text-primary">{src.label}</span>
                      <span className="text-[9px] text-muted">{src.description}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-black/25 px-2.5 py-1 rounded-full border border-white/[0.04]">
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusColorClass(src.status)}`} />
                      <span className={`text-[9px] font-sans font-bold uppercase tracking-wider ${getStatusLabelClass(src.status)}`}>
                        {src.status}
                      </span>
                    </div>
                  </div>

                  {/* Telemetry Numbers */}
                  <div className="grid grid-cols-3 gap-2 border-t border-white/[0.04] pt-2 mt-0.5 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-muted">Response</span>
                      <span className="text-[10px] font-mono font-semibold text-text-primary mt-0.5">{responseTime}</span>
                    </div>
                    <div className="flex flex-col items-center border-x border-white/[0.04]">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-muted">Last Success</span>
                      <span className="text-[10px] font-mono font-semibold text-text-primary mt-0.5">{timeSinceSuccess}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-muted">Fail Ratio</span>
                      <span className="text-[10px] font-mono font-semibold text-text-primary mt-0.5">
                        {src.totalCalls > 0 
                          ? `${Math.round((src.totalFailures / src.totalCalls) * 100)}%` 
                          : '0%'}
                      </span>
                    </div>
                  </div>

                  {/* Error Notification */}
                  {errorText && (
                    <div className="mt-1 px-2.5 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[9px] font-mono text-rose-400 break-words">
                      Error: {errorText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── SECTION 2: TLE FRESHNESS METRIC ── */}
        <section className="space-y-2.5">
          <div className="flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-wider text-muted px-1">
            <Clock className="w-3.5 h-3.5" />
            <span>TLE Freshness Metric</span>
          </div>

          {(() => {
            const badge = getTleStatusBadge(telemetry.tle.status);
            const syncTime = telemetry.tle.lastSyncedAt 
              ? new Date(telemetry.tle.lastSyncedAt).toLocaleTimeString() 
              : 'N/A';
            const ageMs = telemetry.tle.lastSyncedAt ? Date.now() - telemetry.tle.lastSyncedAt : 0;
            const progress = telemetry.tle.lastSyncedAt 
              ? Math.max(0, 100 - (ageMs / TLE_THRESHOLDS.staleMs) * 100) 
              : 0;

            return (
              <div
                className="p-4 flex flex-col gap-3"
                style={{
                  background: 'rgba(15, 22, 38, 0.55)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  borderRadius: '16px',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)',
                }}
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-text-primary">Orbital Element Epoch</span>
                    <span className="text-[9px] text-muted">{badge.desc}</span>
                  </div>

                  <span className={`text-[8px] font-bold tracking-wider px-2 py-0.5 rounded border ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-black/35 rounded-full overflow-hidden border border-white/[0.04]">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        telemetry.tle.status === 'fresh' 
                          ? 'bg-emerald-500' 
                          : telemetry.tle.status === 'stale' 
                            ? 'bg-amber-500' 
                            : 'bg-rose-500'
                      }`}
                      style={{ width: `${telemetry.tle.lastSyncedAt ? progress : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] text-muted font-mono">
                    <span>EPOCH AGE: {telemetry.tle.lastSyncedAt ? formatTimeSince(telemetry.tle.lastSyncedAt) : 'Unknown'}</span>
                    <span>LAST SYNC: {syncTime}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* ── SECTION 3: REAL-TIME EVENT LOGGER ── */}
        <section className="space-y-2.5">
          <div className="flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-wider text-muted px-1">
            <Terminal className="w-3.5 h-3.5" />
            <span>Real-time Event Logger</span>
          </div>

          <div
            className="p-3 font-mono text-[9px] text-zinc-300 flex flex-col gap-1.5 max-h-72 overflow-y-auto"
            style={{
              background: 'rgba(10, 14, 23, 0.7)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)',
            }}
          >
            {telemetry.log.length === 0 ? (
              <div className="text-zinc-500 text-center py-4 italic">No network logging events recorded yet.</div>
            ) : (
              telemetry.log.map((entry, idx) => {
                const timeStr = new Date(entry.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                let colorClass = 'text-emerald-400';
                if (entry.level === 'warn') colorClass = 'text-amber-400';
                if (entry.level === 'error') colorClass = 'text-rose-400';

                return (
                  <div key={idx} className="flex gap-2 items-start leading-relaxed border-b border-white/[0.02] pb-1.5 last:border-b-0 last:pb-0">
                    <span className="text-zinc-500 shrink-0 select-none font-bold">[{timeStr}]</span>
                    <span className={`${colorClass} break-all`}>{entry.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
