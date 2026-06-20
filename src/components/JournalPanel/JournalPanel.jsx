import { useState, useMemo } from 'react';
import { useApp, ACHIEVEMENT_DEFS } from '../../context/AppContext.jsx';
import { Trash2, Trophy, BookOpen, Award, Calendar, MapPin, Clock } from 'lucide-react';

export default function JournalPanel() {
  const { state, actions } = useApp();
  const { observedLog = [], unlockedAchievements = {} } = state;
  const [activeSubTab, setActiveSubTab] = useState('logs'); // 'logs' | 'achievements'

  // Level calculation: 3 observations per level
  const totalSpottings = observedLog.length;
  const levelVal = Math.floor(totalSpottings / 3) + 1;
  const nextLevelSpottings = levelVal * 3;
  const prevLevelSpottings = (levelVal - 1) * 3;
  const levelProgress = totalSpottings >= nextLevelSpottings
    ? 100
    : ((totalSpottings - prevLevelSpottings) / 3) * 100;

  const getLevelTitle = (lvl) => {
    if (lvl === 1) return 'Sky Cadet 🔭';
    if (lvl === 2) return 'Orbit Tracker 📡';
    if (lvl === 3) return 'Cosmic Sentinel ☄️';
    return 'Star Alliance Commander 🌌';
  };

  // Format date
  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getObjectIcon = (type, name) => {
    if (type === 'constellation') return '🌌';
    if (type === 'asteroid') return '☄️';
    if (name?.toLowerCase().includes('iss') || name?.toLowerCase().includes('space station') || name?.toLowerCase().includes('tiangong')) return '🛸';
    return '📡';
  };

  const unlockedCount = Object.keys(unlockedAchievements).length;

  return (
    <div className="flex flex-col h-full bg-panel/40">
      {/* ── Level & Stats HUD ── */}
      <div
        className="mx-4 mt-4 p-4 shrink-0 flex flex-col gap-3"
        style={{
          background: 'rgba(15, 22, 38, 0.55)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Level Info */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-sans text-muted uppercase tracking-wider font-semibold block">Observer Rank</span>
            <span className="text-sm font-playfair font-bold text-cyan">
              {getLevelTitle(levelVal)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-sans text-muted uppercase tracking-wider font-semibold block">Level</span>
            <span className="font-mono text-base font-bold text-text">{levelVal}</span>
          </div>
        </div>

        {/* Progression Bar */}
        <div>
          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-cyan transition-all duration-500"
              style={{
                width: `${levelProgress}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted font-sans uppercase tracking-wider font-semibold mt-1">
            <span>{totalSpottings} spottings logged</span>
            <span>{nextLevelSpottings - totalSpottings} more to next rank</span>
          </div>
        </div>

        {/* Micro Dashboard Stats */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div
            className="p-2 flex items-center gap-2"
            style={{
              background: 'rgba(15, 22, 38, 0.55)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            <BookOpen className="w-4 h-4 text-cyan" />
            <div>
              <span className="text-[9px] text-muted font-sans uppercase tracking-wider font-bold block leading-none">SPOTTINGS</span>
              <span className="font-mono text-xs font-bold text-text leading-none">{totalSpottings}</span>
            </div>
          </div>
          <div
            className="p-2 flex items-center gap-2"
            style={{
              background: 'rgba(15, 22, 38, 0.55)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            <Award className="w-4 h-4 text-cyan" />
            <div>
              <span className="text-[9px] text-muted font-sans uppercase tracking-wider font-bold block leading-none">ACHIEVEMENTS</span>
              <span className="font-mono text-xs font-bold text-text leading-none">
                {unlockedCount} / {ACHIEVEMENT_DEFS.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-Tabs Selector ── */}
      <div className="flex border-b border-border bg-panel shrink-0 mt-4">
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`flex-1 py-2 text-[11px] font-sans uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-all
            ${activeSubTab === 'logs' ? 'tab-active' : 'text-muted hover:text-text'}`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>My Journal</span>
        </button>
        <button
          onClick={() => setActiveSubTab('achievements')}
          className={`flex-1 py-2 text-[11px] font-sans uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-all
            ${activeSubTab === 'achievements' ? 'tab-active' : 'text-muted hover:text-text'}`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Achievements</span>
        </button>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeSubTab === 'logs' ? (
          observedLog.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center p-8 text-center my-4"
              style={{
                background: 'rgba(15, 22, 38, 0.55)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              }}
            >
              <BookOpen className="w-10 h-10 text-muted mb-3 opacity-30" />
              <p className="text-muted text-sm font-sans uppercase tracking-wider font-semibold">Your Spotting Journal is empty</p>
              <p className="text-muted text-[11px] font-sans uppercase tracking-wider font-semibold mt-1.5 leading-relaxed max-w-[200px]">
                Log observations by clicking <span className="text-cyan font-bold">"I Spotted This!"</span> inside the Look Up card.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {observedLog.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 flex flex-col gap-2 relative group hover:border-white/20 transition-all"
                  style={{
                    background: 'rgba(15, 22, 38, 0.55)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {/* Delete button */}
                  <button
                    onClick={() => actions.deleteObservation(log.id)}
                    className="absolute top-3.5 right-3.5 text-muted hover:text-red transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete log entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-lg shrink-0">{getObjectIcon(log.type, log.name)}</span>
                    <div className="min-w-0 pr-6">
                      <p className="text-xs font-sans uppercase tracking-wider font-bold text-text truncate">
                        {log.name}
                      </p>
                      <span className="text-[9px] font-mono text-cyan uppercase tracking-wider font-semibold">
                        {log.type}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-[10px] text-muted font-sans uppercase tracking-wider font-semibold border-t border-border/20 pt-2 mt-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-muted shrink-0" />
                      <span>{formatDate(log.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-muted shrink-0" />
                      <span className="truncate">{log.locationName}</span>
                    </div>
                  </div>

                  {log.notes && (
                    <div
                      className="mt-1 px-2.5 py-1.5 text-[11px] text-text font-sans break-words"
                      style={{
                        background: 'rgba(15, 22, 38, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        borderRadius: '8px',
                      }}
                    >
                      "{log.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {ACHIEVEMENT_DEFS.map((ach) => {
              const unlockedAt = unlockedAchievements[ach.id];
              const isUnlocked = !!unlockedAt;
              const cardBg = isUnlocked ? 'rgba(15, 22, 38, 0.55)' : 'rgba(15, 22, 38, 0.35)';
              const cardBorder = isUnlocked ? '1.5px solid var(--color-cyan, #4d8dff)' : '1px solid rgba(255, 255, 255, 0.06)';
              const cardShadow = isUnlocked ? 'inset 0 1px 0 rgba(255, 255, 255, 0.12)' : 'inset 0 1px 0 rgba(255, 255, 255, 0.05)';

              return (
                <div
                  key={ach.id}
                  className={`p-3.5 flex gap-3.5 transition-all relative overflow-hidden ${!isUnlocked ? 'opacity-55' : ''}`}
                  style={{
                    background: cardBg,
                    border: cardBorder,
                    borderRadius: '16px',
                    boxShadow: cardShadow,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                >
                  <div className={`w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-xl shadow-inner
                    ${isUnlocked ? 'bg-cyan/15 border border-cyan/30' : 'bg-border/30 border border-border/20'}`}
                  >
                    {ach.icon}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-0.5 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-sans uppercase tracking-wider font-bold truncate text-text">
                        {ach.title}
                      </h4>
                      {isUnlocked && (
                        <span className="text-[8px] font-mono text-cyan uppercase shrink-0 font-bold">
                          🏆 UNLOCKED
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[10.5px] text-muted font-sans leading-relaxed">
                      {ach.description}
                    </p>

                    <span className="text-[9px] font-mono text-muted uppercase tracking-wider block mt-1">
                      {isUnlocked ? `Date: ${formatDate(unlockedAt)}` : `Req: ${ach.requirement}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
