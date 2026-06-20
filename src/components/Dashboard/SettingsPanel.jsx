import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import { User, LogOut, Sliders, Settings, Info } from 'lucide-react';

/* ─── Animated Toggle Switch ─────────────────────────────────────────────── */
function Toggle({ checked, onChange, id }) {
  return (
    <button
      id={id}
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${checked ? 'bg-accent/80' : 'bg-white/10'}`}
      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <motion.div
        className="w-3.5 h-3.5 rounded-full bg-white shadow-md"
        layout
        animate={{ x: checked ? 16 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

export default function SettingsPanel() {
  const { user, signOut, setShowAuthModal } = useAuth();

  // Local settings states synced with localStorage
  const [showGrid, setShowGrid] = useState(() => localStorage.getItem('orbitwatch_settings_show_grid') !== 'false');
  const [showStars, setShowStars] = useState(() => localStorage.getItem('orbitwatch_settings_show_stars') !== 'false');
  const [showRadar, setShowRadar] = useState(() => localStorage.getItem('orbitwatch_settings_show_radar') !== 'false');
  const [showCities, setShowCities] = useState(() => localStorage.getItem('orbitwatch_settings_show_cities') !== 'false');
  const [globeRotate, setGlobeRotate] = useState(() => localStorage.getItem('orbitwatch_settings_globe_rotate') !== 'false');
  const [globeSpeed, setGlobeSpeed] = useState(() => parseFloat(localStorage.getItem('orbitwatch_settings_globe_speed') || '0.3'));

  // Trigger storage sync and event dispatch
  const updateSetting = (key, value, setter) => {
    setter(value);
    localStorage.setItem(key, value.toString());
    window.dispatchEvent(new Event('orbitwatch-settings-changed'));
  };

  const initials = user
    ? (user.displayName || user.email || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '';

  return (
    <div className="flex flex-col h-full bg-panel/40 overflow-hidden font-sans select-none">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* ── SECTION 1: ACCOUNT INTEGRATION ── */}
        <section className="space-y-2.5">
          <div className="flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-wider text-muted px-1">
            <User className="w-3.5 h-3.5" />
            <span>Account Session</span>
          </div>

          <div
            className="p-4 flex flex-col gap-3 transition-all duration-300"
            style={{
              background: 'rgba(15, 22, 38, 0.55)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)',
            }}
          >
            {user ? (
              // Logged in user profile card
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-sans shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #4d8dff 0%, #6b6fd6 100%)',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {initials}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-text-primary truncate">{user.displayName || 'Operator'}</span>
                    <span className="text-[10px] text-muted truncate mt-0.5">{user.email}</span>
                  </div>
                </div>

                <button
                  id="settings-signout-btn"
                  onClick={async () => await signOut()}
                  className="px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50 transition-all font-sans text-[10px] font-semibold uppercase tracking-wider focus:outline-none flex items-center gap-1 shrink-0"
                >
                  <LogOut className="w-3 h-3" />
                  Sign Out
                </button>
              </div>
            ) : (
              // Guest Mode Call to Action
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-cyan mt-0.5 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white">Guest Session Active</span>
                    <span className="text-[10px] text-muted leading-relaxed mt-1">
                      You are operating in Guest mode. Sign in to synchronize your Observer Journal, spotting logs, and custom telemetry alerts across your devices.
                    </span>
                  </div>
                </div>

                <button
                  id="settings-signin-btn"
                  onClick={() => setShowAuthModal(true)}
                  className="w-full mt-1 py-2 rounded-lg font-sans font-semibold text-[11px] uppercase tracking-wider transition-all focus:outline-none flex items-center justify-center gap-1.5"
                  style={{
                    background: 'linear-gradient(135deg, #4d8dff 0%, #3575d9 100%)',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(77,141,255,0.2)',
                  }}
                >
                  <User className="w-3.5 h-3.5" />
                  Sign In / Register
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── SECTION 2: MAP PREFERENCES ── */}
        <section className="space-y-2.5">
          <div className="flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-wider text-muted px-1">
            <Sliders className="w-3.5 h-3.5" />
            <span>Map Overlay Settings</span>
          </div>

          <div
            className="p-4 flex flex-col gap-3.5"
            style={{
              background: 'rgba(15, 22, 38, 0.55)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)',
            }}
          >
            {/* Grid coordinates */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-text-primary">Graticule Grid Lines</span>
                <span className="text-[9px] text-muted mt-0.5">Render lat/long coordinate lines on map</span>
              </div>
              <Toggle
                id="toggle-grid-lines"
                checked={showGrid}
                onChange={(val) => updateSetting('orbitwatch_settings_show_grid', val, setShowGrid)}
              />
            </div>

            {/* Ocean stars */}
            <div className="flex items-center justify-between border-t border-white/[0.04] pt-3">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-text-primary">Oceanic Stars</span>
                <span className="text-[9px] text-muted mt-0.5">Show ambient twinkling stars in open ocean basins</span>
              </div>
              <Toggle
                id="toggle-oceanic-stars"
                checked={showStars}
                onChange={(val) => updateSetting('orbitwatch_settings_show_stars', val, setShowStars)}
              />
            </div>

            {/* Radar sweep */}
            <div className="flex items-center justify-between border-t border-white/[0.04] pt-3">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-text-primary">Observer Radar Sweep</span>
                <span className="text-[9px] text-muted mt-0.5">Render rotating sweep overlay centered on user</span>
              </div>
              <Toggle
                id="toggle-radar-sweep"
                checked={showRadar}
                onChange={(val) => updateSetting('orbitwatch_settings_show_radar', val, setShowRadar)}
              />
            </div>

            {/* City lights */}
            <div className="flex items-center justify-between border-t border-white/[0.04] pt-3">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-text-primary">Ambient City Lights</span>
                <span className="text-[9px] text-muted mt-0.5">Render glowing dots for global populated areas</span>
              </div>
              <Toggle
                id="toggle-city-lights"
                checked={showCities}
                onChange={(val) => updateSetting('orbitwatch_settings_show_cities', val, setShowCities)}
              />
            </div>
          </div>
        </section>

        {/* ── SECTION 3: 3D GLOBE PREFERENCES ── */}
        <section className="space-y-2.5">
          <div className="flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-wider text-muted px-1">
            <Settings className="w-3.5 h-3.5" />
            <span>3D Globe Settings</span>
          </div>

          <div
            className="p-4 flex flex-col gap-3.5"
            style={{
              background: 'rgba(15, 22, 38, 0.55)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)',
            }}
          >
            {/* Auto-rotation */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-text-primary">Globe Auto-Rotation</span>
                <span className="text-[9px] text-muted mt-0.5">Slowly rotate the globe in ambient tracking mode</span>
              </div>
              <Toggle
                id="toggle-globe-rotation"
                checked={globeRotate}
                onChange={(val) => updateSetting('orbitwatch_settings_globe_rotate', val, setGlobeRotate)}
              />
            </div>

            {/* Rotation speed */}
            <div className="flex flex-col gap-2 border-t border-white/[0.04] pt-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-text-primary">Auto-Rotation Speed</span>
                  <span className="text-[9px] text-muted mt-0.5">Configure ambient rotation speed scalar</span>
                </div>
                <span className="text-[10px] font-mono text-cyan bg-cyan/10 px-2 py-0.5 rounded border border-cyan/20">
                  {globeSpeed.toFixed(1)}x
                </span>
              </div>
              
              <div className="flex gap-1.5 mt-1">
                {[0.1, 0.3, 0.5, 1.0].map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => updateSetting('orbitwatch_settings_globe_speed', speed, setGlobeSpeed)}
                    disabled={!globeRotate}
                    className={`flex-1 py-1 rounded text-[9px] font-mono font-bold transition-all focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed
                      ${globeSpeed === speed && globeRotate
                        ? 'bg-accent/20 text-accent border border-accent/40' 
                        : 'bg-white/5 text-muted border border-transparent hover:bg-white/10 hover:text-white'}`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
