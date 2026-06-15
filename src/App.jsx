import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider } from './context/AppContext.jsx';
import LandingPage from './components/LandingPage/LandingPage.jsx';
import Dashboard from './components/Dashboard/Dashboard.jsx';

/**
 * App root.
 * Two views: Landing page (location selection) and Dashboard (satellite tracking).
 * AppProvider wraps everything for global state access.
 */
export default function App() {
  const [hasLocation, setHasLocation] = useState(false);

  return (
    <AppProvider>
      <AnimatePresence mode="wait">
        {!hasLocation ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            <LandingPage onLocationSet={() => setHasLocation(true)} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full"
          >
            <Dashboard onReset={() => setHasLocation(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </AppProvider>
  );
}
