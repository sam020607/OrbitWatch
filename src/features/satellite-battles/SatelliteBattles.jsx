import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSatelliteCompare } from './useSatelliteCompare.js';
import SatelliteSelector from './SatelliteSelector.jsx';
import OrbitVersusView from './OrbitVersusView.jsx';
import OrbitVersusView2D from './OrbitVersusView2D.jsx';
import { fetchCelesTrakTLE } from '../../api/celestrakApi.js';
import {
  propagateSatellite,
  currentSeparation,
  orbitSimilarity,
  footprintRadius,
  haversineDistance,
  coverageOverlapPercent,
  predictPasses,
  getOrbitParams
} from '../battle-telemetry/lib/orbitalMath';
import { computeBattleScore } from '../battle-telemetry/lib/battleScoring';
import { generateBattleSummary } from '../battle-telemetry/lib/textGenerator';
import AnalysisDashboard from '../battle-telemetry/AnalysisDashboard';
import ScoreBoard from '../battle-telemetry/ScoreBoard';
import BattleSummaryPanel from '../battle-telemetry/BattleSummaryPanel';
import LocationAnalysisCard from '../battle-telemetry/LocationAnalysisCard';
import OrbitalMathWorker from '../battle-telemetry/lib/orbitalMath.worker?worker';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function SatelliteBattles({ is3DMode }) {
  const { 
    satellites, 
    satA, 
    satB, 
    setSatA, 
    setSatB 
  } = useSatelliteCompare();

  // TLE state
  const [tleA, setTleA] = useState(null);
  const [tleB, setTleB] = useState(null);
  const [isLoadingTle, setIsLoadingTle] = useState(false);
  const [tleError, setTleError] = useState(null);

  // Live propagated positions (lat, lon, alt, eci, satrec)
  const [posA, setPosA] = useState(null);
  const [posB, setPosB] = useState(null);
  const [liveSeparation, setLiveSeparation] = useState(0);
  const [similarity, setSimilarity] = useState(0);
  const [overlap, setOverlap] = useState(0);

  // Closest approach (Web Worker output)
  const [closestApproach, setClosestApproach] = useState(null);
  const workerRef = useRef(null);

  // Observer clicked location analysis
  const [clickedLocation, setClickedLocation] = useState(null);
  const [passA, setPassA] = useState(null);
  const [passB, setPassB] = useState(null);

  // Fetch TLE data when satellites are selected
  useEffect(() => {
    let active = true;
    
    const loadTles = async () => {
      if (!satA || !satB) {
        setTleA(null);
        setTleB(null);
        setPosA(null);
        setPosB(null);
        setLiveSeparation(0);
        setSimilarity(0);
        setOverlap(0);
        setClosestApproach(null);
        setClickedLocation(null);
        return;
      }

      setIsLoadingTle(true);
      setTleError(null);

      try {
        const [tA, tB] = await Promise.all([
          fetchCelesTrakTLE(satA.satid),
          fetchCelesTrakTLE(satB.satid)
        ]);

        if (!active) return;

        if (!tA || !tB) {
          throw new Error('Failed to synchronize telemetry channels.');
        }

        setTleA(tA);
        setTleB(tB);
      } catch (err) {
        if (active) {
          setTleError(err.message || 'Telemetry sync failed.');
          console.error(err);
        }
      } finally {
        if (active) {
          setIsLoadingTle(false);
        }
      }
    };

    loadTles();

    return () => {
      active = false;
    };
  }, [satA, satB]);

  // Live SGP4 1Hz tick propagation
  useEffect(() => {
    if (!tleA || !tleB) return;

    const tick = () => {
      const now = new Date();
      const resA = propagateSatellite(tleA, now);
      const resB = propagateSatellite(tleB, now);

      if (resA && resB) {
        setPosA(resA);
        setPosB(resB);

        const sep = currentSeparation(resA.positionEci, resB.positionEci);
        setLiveSeparation(sep);

        const rA = footprintRadius(resA.alt, 10);
        const rB = footprintRadius(resB.alt, 10);
        const d = haversineDistance(resA.lat, resA.lon, resB.lat, resB.lon);
        const pct = coverageOverlapPercent(d, rA, rB);
        setOverlap(pct);

        // Orbit similarity is static based on orbital elements
        const sim = orbitSimilarity(resA.satrec, resB.satrec);
        setSimilarity(sim);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [tleA, tleB]);

  // Handle Closest Approach Web Worker (runs every 60s)
  useEffect(() => {
    if (!tleA || !tleB) {
      setClosestApproach(null);
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      return;
    }

    const worker = new OrbitalMathWorker();
    workerRef.current = worker;

    const calculateClosestApproach = () => {
      worker.postMessage({
        tleA,
        tleB,
        startTime: Date.now()
      });
    };

    worker.onmessage = (e) => {
      const data = e.data;
      if (data && !data.error) {
        setClosestApproach(data);
      } else {
        console.warn('[Web Worker] Error calculated:', data?.error);
      }
    };

    calculateClosestApproach();
    const interval = setInterval(calculateClosestApproach, 60000);

    return () => {
      clearInterval(interval);
      worker.terminate();
      if (workerRef.current === worker) {
        workerRef.current = null;
      }
    };
  }, [tleA, tleB]);

  // Click-to-analyze location updates
  const handleLocationClick = (lat, lon) => {
    setClickedLocation({ lat, lon });
  };

  // Run pass predictions when clicked location or TLEs update
  useEffect(() => {
    if (!clickedLocation || !posA || !posB) {
      setPassA(null);
      setPassB(null);
      return;
    }

    const pA = predictPasses(posA.satrec, clickedLocation.lat, clickedLocation.lon);
    const pB = predictPasses(posB.satrec, clickedLocation.lat, clickedLocation.lon);
    setPassA(pA);
    setPassB(pB);
  }, [clickedLocation, tleA, tleB, posA, posB]);

  // Deriving scoring and summary texts
  const scoreResult = useMemo(() => {
    if (!posA || !posB) return null;
    return computeBattleScore(posA.satrec, posB.satrec, clickedLocation);
  }, [posA, posB, clickedLocation]);

  const summaryResult = useMemo(() => {
    if (!satA || !satB || !posA || !posB || !scoreResult) return null;
    return generateBattleSummary(satA, satB, posA.satrec, posB.satrec, scoreResult, clickedLocation);
  }, [satA, satB, posA, posB, scoreResult, clickedLocation]);

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-[#07090e] overflow-hidden relative text-white">
      
      {/* LEFT PANEL: 3D/2D Visualization */}
      <div className="w-full md:w-1/2 h-[45vh] md:h-full relative border-b md:border-b-0 md:border-r border-white/10 shrink-0">
        {is3DMode ? (
          <OrbitVersusView 
            satA={satA} 
            satB={satB} 
            posA={posA}
            posB={posB}
            tleA={tleA}
            tleB={tleB}
            liveSep={liveSeparation}
            closestApproach={closestApproach}
            onLocationClick={handleLocationClick}
            clickedLocation={clickedLocation}
          />
        ) : (
          <OrbitVersusView2D 
            satA={satA} 
            satB={satB} 
            posA={posA}
            posB={posB}
            tleA={tleA}
            tleB={tleB}
            liveSep={liveSeparation}
            closestApproach={closestApproach}
            onLocationClick={handleLocationClick}
            clickedLocation={clickedLocation}
          />
        )}

        {/* Click to analyze location overlay card */}
        {clickedLocation && satA && satB && (
          <LocationAnalysisCard 
            lat={clickedLocation.lat}
            lon={clickedLocation.lon}
            satA={satA}
            satB={satB}
            passA={passA}
            passB={passB}
            onClose={() => setClickedLocation(null)}
          />
        )}
      </div>

      {/* RIGHT PANEL: Battle Interface */}
      <div className="w-full md:w-1/2 h-[55vh] md:h-full flex flex-col relative overflow-y-auto overflow-x-hidden scrollbar-thin bg-[#07090e]">
        
        {/* Header / Selectors */}
        <div className="w-full flex justify-between items-start gap-4 p-6 shrink-0 relative z-20"
             style={{ background: 'linear-gradient(to bottom, rgba(7,9,14,0.95) 0%, rgba(7,9,14,0) 100%)' }}>
          <div className="flex-1">
            <SatelliteSelector 
              satellites={satellites} 
              selectedSat={satA} 
              onSelect={setSatA} 
              label="Fighter 1"
              side="left"
            />
          </div>
          <div className="flex-1">
            <SatelliteSelector 
              satellites={satellites} 
              selectedSat={satB} 
              onSelect={setSatB} 
              label="Fighter 2"
              side="right"
            />
          </div>
        </div>

        {/* Content / Telemetry Dashboard */}
        <div className="flex-1 w-full relative px-6 pb-6">
          {!satA || !satB ? (
            /* Select Prompt */
            <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px] mt-10">
              <div className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center mb-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan/20 to-danger/20 animate-spin-slow opacity-50" />
                <span className="text-white/20 font-black italic text-2xl">VS</span>
              </div>
              <p className="text-white/40 font-mono text-sm uppercase tracking-widest text-center max-w-xs leading-relaxed">
                Select two satellites above to initiate data comparison sequence
              </p>
            </div>
          ) : isLoadingTle ? (
            /* Sleek Telemetry loading state */
            <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px] mt-10">
              <Loader2 className="w-10 h-10 text-cyan animate-spin mb-4" />
              <p className="text-cyan font-mono text-xs uppercase tracking-widest text-center">
                Syncing Telemetry Channels...
              </p>
            </div>
          ) : tleError ? (
            /* Telemetry Fetch error */
            <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px] mt-10 px-4">
              <ShieldAlert className="w-10 h-10 text-danger mb-4" />
              <p className="text-danger font-mono text-xs uppercase tracking-widest text-center mb-2">
                Telemetry Sync Failure
              </p>
              <p className="text-white/50 text-xs text-center max-w-xs">
                {tleError}
              </p>
              <button 
                onClick={() => { setSatA(null); setSatB(null); }}
                className="mt-6 px-5 py-2 rounded-full border border-danger/40 text-[10px] font-bold uppercase tracking-wider text-danger hover:bg-danger/10 transition-all"
              >
                Reset Battle
              </button>
            </div>
          ) : (
            /* Telemetry analysis layout loaded */
            <div className="space-y-4">
              {/* Live interaction summary panel */}
              {posA && posB && (
                <AnalysisDashboard 
                  satA={satA}
                  satB={satB}
                  paramsA={getOrbitParams(posA.satrec)}
                  paramsB={getOrbitParams(posB.satrec)}
                  similarity={similarity}
                  overlap={overlap}
                  currentSeparation={liveSeparation}
                  closestApproach={closestApproach}
                />
              )}

              {/* Summary Insights Panel */}
              {summaryResult && (
                <BattleSummaryPanel summary={summaryResult} />
              )}

              {/* Categorized wins scoreboard */}
              {scoreResult && (
                <ScoreBoard 
                  satA={satA}
                  satB={satB}
                  scoreResult={scoreResult}
                />
              )}
            </div>
          )}
        </div>

        {/* Action Bar */}
        {satA && satB && !isLoadingTle && (
          <div className="p-6 shrink-0 border-t border-white/5 flex justify-center bg-[#07090e]/50 backdrop-blur-md relative z-20">
            <button 
              onClick={() => { setSatA(null); setSatB(null); }}
              className="px-6 py-2 rounded-full border border-white/10 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all"
            >
              Reset Battle
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
