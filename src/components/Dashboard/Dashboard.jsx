import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp, ACHIEVEMENT_DEFS } from '../../context/AppContext.jsx';
import { useISSTracker } from '../../hooks/useISSTracker.js';
import { useSatellites } from '../../hooks/useSatellites.js';
import { usePassPredictions } from '../../hooks/usePassPredictions.js';
import { useAsteroids } from '../../hooks/useAsteroids.js';
import GlobeMap from './GlobeMap.jsx';
import Globe3D from './Globe3D.jsx';
import SatellitePanel from './SatellitePanel.jsx';
import PassCountdown from '../PassCountdown/PassCountdown.jsx';
import LookUpCard from '../LookUpCard/LookUpCard.jsx';
import NightReport from '../NightReport/NightReport.jsx';
import LocationSearch from '../LandingPage/LocationSearch.jsx';
import JournalPanel from '../JournalPanel/JournalPanel.jsx';
import {
  Map, List, Star, Compass, Radio, RotateCcw,
  Eye, EyeOff, Satellite, Settings, ChevronLeft, Globe, Trophy, Sun, Moon
} from 'lucide-react';

const MOBILE_VIEWS = [
  { id: 'map', label: 'Map', icon: Map },
  { id: 'satellites', label: 'Satellites', icon: Satellite },
  { id: 'report', label: 'Tonight', icon: Star },
  { id: 'lookup', label: 'Look Up', icon: Compass },
  { id: 'journal', label: 'Journal', icon: Trophy },
];

/**
 * Dashboard — Main layout after location is selected.
 * Desktop: 3-column layout (sidebar | map | right panel)
 * Mobile: tab-based stacked layout
 */
export default function Dashboard({ onReset }) {
  const { state, actions } = useApp();
  const { location, issPosition, satellites, selectedSatellite, showConeOverlay, newUnlockedAchievements, theme } = state;

  // Activate all data hooks
  useISSTracker(!!location);
  useSatellites();
  usePassPredictions();
  useAsteroids();

  const [mobileView, setMobileView] = useState('map');
  const [rightPanel, setRightPanel] = useState('countdown'); // 'countdown' | 'lookup' | 'report'
  const [showSearch, setShowSearch] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);

  function handleNewLocation(loc) {
    actions.setLocation(loc);
    actions.setLocationName(loc.name);
    setShowSearch(false);
  }

  // Right panel tab
  const rightTabs = [
    { id: 'countdown', label: 'Countdown', icon: Radio },
    { id: 'lookup', label: 'Look Up', icon: Compass },
    { id: 'report', label: 'Tonight', icon: Star },
    { id: 'journal', label: 'Journal', icon: Trophy },
  ];

  return (
    <div className="flex flex-col h-screen bg-space overflow-hidden">
      {/* ── Top Navigation Bar ── */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-navy/90 backdrop-blur-md shrink-0"
        style={{ zIndex: 100 }}>
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Satellite className="w-5 h-5 text-cyan" style={{ filter: 'drop-shadow(0 0 4px #00d4ff)' }} />
          <span className="font-playfair font-bold text-text text-sm hidden sm:block">
            Project <span className="text-cyan">Zenith</span>
          </span>
        </div>

        {/* Location display */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg border border-border bg-panel/80 cursor-pointer hover:border-border-light transition-colors"
          onClick={() => setShowSearch(s => !s)}
        >
          <div className="w-2 h-2 rounded-full bg-amber animate-pulse" />
          <span className="font-crimson text-sm font-semibold text-text truncate max-w-[200px]">
            {location?.name || 'No location'}
          </span>
          <span className="text-muted text-xs font-mono hidden md:block">
            {location ? `${location.lat.toFixed(2)}°, ${location.lon.toFixed(2)}°` : ''}
          </span>
        </div>

        {/* ISS live indicator */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-cyan/20 bg-cyan/5">
          <div className={`w-1.5 h-1.5 rounded-full ${issPosition ? 'bg-cyan animate-pulse' : 'bg-muted'}`} />
          <span className="font-crimson text-xs font-semibold text-muted-light hidden sm:block">
            ISS {issPosition ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Cone toggle */}
          <button
            onClick={actions.toggleConeOverlay}
            className={`p-1.5 rounded-md border transition-all ${showConeOverlay ? 'border-cyan/40 text-cyan bg-cyan/5' : 'border-border text-muted'}`}
            title="Toggle visibility cones"
          >
            {showConeOverlay ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Satellite count */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md border border-amber/20 bg-amber/5">
            <Satellite className="w-3 h-3 text-amber" />
            <span className="font-mono text-xs text-amber">{satellites.length}</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={actions.toggleTheme}
            className="p-1.5 rounded-md border border-border text-muted hover:text-text hover:border-border-light transition-all"
            title="Toggle space theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4 text-cyan" /> : <Sun className="w-4 h-4 text-amber" />}
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="p-1.5 rounded-md border border-border text-muted hover:text-text hover:border-border-light transition-all"
            title="Reset to landing page"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Location search dropdown */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-14 left-0 right-0 z-[200] p-4 bg-navy/95 border-b border-border backdrop-blur-md"
          >
            <LocationSearch onLocationSelect={handleNewLocation} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left Sidebar (desktop) ── */}
        <aside className="hidden lg:flex flex-col w-72 border-r border-border bg-panel/80 shrink-0 overflow-hidden">
          <SatellitePanel />
        </aside>

        {/* ── Center: Map ── */}
        <main className="flex-1 relative overflow-hidden">
          {is3DMode ? (
            <Globe3D className="w-full h-full" />
          ) : (
            <GlobeMap className="w-full h-full" />
          )}

          {/* 3D Globe / 2D Map Toggle Button */}
          <button
            onClick={() => setIs3DMode(!is3DMode)}
            className="absolute bottom-16 lg:bottom-5 right-5 z-[1000] flex items-center gap-2 px-3 py-2 rounded-lg bg-navy/90 border border-cyan/40 text-cyan hover:border-cyan text-xs font-crimson font-semibold backdrop-blur-sm shadow-lg transition-all"
            title={is3DMode ? 'Switch to flat map' : 'Switch to 3D globe'}
          >
            {is3DMode ? (
              <>
                <Map className="w-3.5 h-3.5" />
                <span>View Flat Map</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5" />
                <span>View on Globe</span>
              </>
            )}
          </button>

          {/* Mobile: bottom tab bar */}
          <div className="lg:hidden absolute bottom-0 left-0 right-0 z-[1000]">
            <div className="flex bg-navy/95 border-t border-border backdrop-blur-md">
              {MOBILE_VIEWS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setMobileView(id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 transition-colors
                    ${mobileView === id ? 'text-cyan border-t-2 border-cyan -mt-0.5' : 'text-muted'}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-crimson font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </main>

        {/* ── Right Panel (desktop) ── */}
        <aside className="hidden lg:flex flex-col w-80 border-l border-border bg-panel/80 shrink-0 overflow-hidden">
          {/* Panel tabs */}
          <div className="flex border-b border-border bg-navy/30 shrink-0">
            {rightTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setRightPanel(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-crimson font-semibold transition-all
                  ${rightPanel === id ? 'tab-active' : 'text-muted hover:text-muted-light'}`}
              >
                <Icon className="w-3 h-3" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={rightPanel}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {rightPanel === 'countdown' && <PassCountdown />}
                {rightPanel === 'lookup' && <LookUpCard />}
                {rightPanel === 'report' && <NightReport />}
                {rightPanel === 'journal' && <JournalPanel />}
              </motion.div>
            </AnimatePresence>
          </div>
        </aside>
      </div>

      {/* ── Mobile Overlay Panels ── */}
      <AnimatePresence>
        {mobileView !== 'map' && (
          <motion.div
            key={mobileView}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="lg:hidden absolute inset-x-0 bottom-12 top-14 z-[500] bg-panel/97 backdrop-blur-md border-t border-border overflow-y-auto"
          >
            {mobileView === 'satellites' && <SatellitePanel />}
            {mobileView === 'report' && <NightReport />}
            {mobileView === 'journal' && <JournalPanel />}
            {mobileView === 'lookup' && (
              <div className="divide-y divide-border">
                <PassCountdown />
                <LookUpCard />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Achievement Unlock Toast Celebrations ── */}
      {newUnlockedAchievements && newUnlockedAchievements.length > 0 && (() => {
        const activeId = newUnlockedAchievements[0];
        const ach = ACHIEVEMENT_DEFS.find(a => a.id === activeId);
        if (!ach) return null;

        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: 'spring', damping: 15 }}
              className="w-full max-w-sm bg-panel border-2 border-amber/60 rounded-2xl p-6 flex flex-col items-center gap-4 text-center shadow-[0_0_50px_rgba(245,158,11,0.4)] relative overflow-hidden scanlines"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber to-transparent animate-pulse" />
              
              <div className="w-16 h-16 rounded-full bg-amber/20 border border-amber/40 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-bounce mt-2">
                {ach.icon}
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-mono text-amber tracking-[0.25em] uppercase font-bold text-glow-amber">
                  Achievement Unlocked
                </span>
                <h3 className="text-xl font-playfair font-bold text-text mt-1 text-shadow-amber">
                  {ach.title}
                </h3>
              </div>

              <p className="text-sm text-muted-light font-crimson px-2">
                {ach.description}
              </p>

              <button
                onClick={actions.dismissAchievementToast}
                className="mt-2 w-full py-2 bg-amber border border-amber text-xs font-crimson font-bold text-navy rounded-lg hover:bg-transparent hover:text-amber hover:border-amber transition-all shadow-md uppercase tracking-wider"
              >
                Awesome!
              </button>
            </motion.div>
          </div>
        );
      })()}
    </div>
  );
}
