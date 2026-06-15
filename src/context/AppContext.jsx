import { createContext, useContext, useReducer, useCallback } from 'react';

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
};

/** ─── Reducer ───────────────────────────────────────────────────────────── */
function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LOCATION':
      return { ...state, location: action.payload, issTrail: [], selectedSatellite: null };

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
      return { ...state, selectedSatellite: action.payload, activeView: action.payload ? 'lookup' : state.activeView };

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

  // Convenience action creators
  const actions = {
    setLocation: useCallback((location) => dispatch({ type: 'SET_LOCATION', payload: location }), []),
    setLocationName: useCallback((name) => dispatch({ type: 'SET_LOCATION_NAME', payload: name }), []),
    setISSPosition: useCallback((pos) => dispatch({ type: 'SET_ISS_POSITION', payload: pos }), []),
    setSatellites: useCallback((sats) => dispatch({ type: 'SET_SATELLITES', payload: sats }), []),
    selectSatellite: useCallback((sat) => dispatch({ type: 'SELECT_SATELLITE', payload: sat }), []),
    setISSPasses: useCallback((passes) => dispatch({ type: 'SET_ISS_PASSES', payload: passes }), []),
    setSatPasses: useCallback((satId, passes) => dispatch({ type: 'SET_SAT_PASSES', satId, payload: passes }), []),
    setNightSky: useCallback((data) => dispatch({ type: 'SET_NIGHT_SKY', payload: data }), []),
    setMoonPhase: useCallback((data) => dispatch({ type: 'SET_MOON_PHASE', payload: data }), []),
    setLoading: useCallback((v, msg) => dispatch({ type: 'SET_LOADING', payload: v, message: msg }), []),
    setError: useCallback((e) => dispatch({ type: 'SET_ERROR', payload: e }), []),
    clearError: useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []),
    setActiveView: useCallback((v) => dispatch({ type: 'SET_ACTIVE_VIEW', payload: v }), []),
    toggleConeOverlay: useCallback(() => dispatch({ type: 'TOGGLE_CONE_OVERLAY' }), []),
    reset: useCallback(() => dispatch({ type: 'RESET' }), []),
  };

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
