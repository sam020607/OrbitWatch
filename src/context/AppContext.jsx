import { createContext, useContext, useReducer, useMemo } from 'react';

/** ─── Initial State ─────────────────────────────────────────────────────── */
const initialState = {
  // Location
  location: null,          // { lat, lon, name, country }
  locationName: '',

  // ISS
  issPosition: null,       // { lat, lon, timestamp }
  issTrail: [],            // Last 20 positions for trail

  // Satellites
  satellites: [],          // Array of satellite objects
  selectedSatellite: null, // Currently selected satellite

  // Passes
  issNextPasses: [],       // Next ISS passes for observer
  satellitePasses: {},     // { satId: [passes] }

  // Astronomy
  nightSkyData: null,      // Planets, stars
  moonPhase: null,         // Moon phase info

  // UI State
  isLoading: false,
  loadingMessage: '',
  error: null,
  activeView: 'map',       // 'map' | 'report' | 'lookup'
  showConeOverlay: true,
  satelliteFilter: 'major', // 'major' | 'all' | 'tv' | 'gps' | 'comms' | 'weather' | 'space-station' | 'debris' | 'earth-obs'
  viewMode: 'satellites',   // 'satellites' | 'constellations' | 'asteroids'
  selectedConstellation: null, // Currently selected constellation
  asteroids: [],            // Array of asteroid objects
  selectedAsteroid: null,   // Currently selected asteroid
  asteroidFilter: 'all',    // 'all' | 'phas' | 'close'
};

/** ─── Reducer ───────────────────────────────────────────────────────────── */
function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LOCATION':
      return { ...state, location: action.payload, issTrail: [], selectedSatellite: null, selectedConstellation: null, selectedAsteroid: null };

    case 'SET_LOCATION_NAME':
      return { ...state, locationName: action.payload };

    case 'SET_ISS_POSITION': {
      const pos = action.payload;
      const trail = [...state.issTrail, pos].slice(-30); // keep last 30 positions
      return { ...state, issPosition: pos, issTrail: trail };
    }

    case 'SET_SATELLITES':
      return { ...state, satellites: action.payload };

    case 'SELECT_SATELLITE':
      return { ...state, selectedSatellite: action.payload, selectedConstellation: null, selectedAsteroid: null, activeView: action.payload ? 'lookup' : state.activeView };

    case 'SET_ISS_PASSES':
      return { ...state, issNextPasses: action.payload };

    case 'SET_SAT_PASSES':
      return { ...state, satellitePasses: { ...state.satellitePasses, [action.satId]: action.payload } };

    case 'SET_NIGHT_SKY':
      return { ...state, nightSkyData: action.payload };

    case 'SET_MOON_PHASE':
      return { ...state, moonPhase: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, loadingMessage: action.message || '' };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.payload };

    case 'TOGGLE_CONE_OVERLAY':
      return { ...state, showConeOverlay: !state.showConeOverlay };

    case 'SET_SATELLITE_FILTER':
      return { ...state, satelliteFilter: action.payload };

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload, selectedSatellite: null, selectedConstellation: null, selectedAsteroid: null };

    case 'SELECT_CONSTELLATION':
      return { ...state, selectedConstellation: action.payload, selectedSatellite: null, selectedAsteroid: null, activeView: action.payload ? 'lookup' : state.activeView };

    case 'SET_ASTEROIDS':
      return { ...state, asteroids: action.payload };

    case 'SELECT_ASTEROID':
      return { ...state, selectedAsteroid: action.payload, selectedSatellite: null, selectedConstellation: null, activeView: action.payload ? 'lookup' : state.activeView };

    case 'SET_ASTEROID_FILTER':
      return { ...state, asteroidFilter: action.payload };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

/** ─── Context ───────────────────────────────────────────────────────────── */
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Convenience action creators (memoized to prevent infinite render loops)
  const actions = useMemo(() => ({
    setLocation: (location) => dispatch({ type: 'SET_LOCATION', payload: location }),
    setLocationName: (name) => dispatch({ type: 'SET_LOCATION_NAME', payload: name }),
    setISSPosition: (pos) => dispatch({ type: 'SET_ISS_POSITION', payload: pos }),
    setSatellites: (sats) => dispatch({ type: 'SET_SATELLITES', payload: sats }),
    selectSatellite: (sat) => dispatch({ type: 'SELECT_SATELLITE', payload: sat }),
    setISSPasses: (passes) => dispatch({ type: 'SET_ISS_PASSES', payload: passes }),
    setSatPasses: (satId, passes) => dispatch({ type: 'SET_SAT_PASSES', satId, payload: passes }),
    setNightSky: (data) => dispatch({ type: 'SET_NIGHT_SKY', payload: data }),
    setMoonPhase: (data) => dispatch({ type: 'SET_MOON_PHASE', payload: data }),
    setLoading: (v, msg) => dispatch({ type: 'SET_LOADING', payload: v, message: msg }),
    setError: (e) => dispatch({ type: 'SET_ERROR', payload: e }),
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
    setActiveView: (v) => dispatch({ type: 'SET_ACTIVE_VIEW', payload: v }),
    toggleConeOverlay: () => dispatch({ type: 'TOGGLE_CONE_OVERLAY' }),
    setSatelliteFilter: (filter) => dispatch({ type: 'SET_SATELLITE_FILTER', payload: filter }),
    setViewMode: (mode) => dispatch({ type: 'SET_VIEW_MODE', payload: mode }),
    selectConstellation: (constell) => dispatch({ type: 'SELECT_CONSTELLATION', payload: constell }),
    setAsteroids: (asteroids) => dispatch({ type: 'SET_ASTEROIDS', payload: asteroids }),
    selectAsteroid: (asteroid) => dispatch({ type: 'SELECT_ASTEROID', payload: asteroid }),
    setAsteroidFilter: (filter) => dispatch({ type: 'SET_ASTEROID_FILTER', payload: filter }),
    reset: () => dispatch({ type: 'RESET' }),
  }), [dispatch]);

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
