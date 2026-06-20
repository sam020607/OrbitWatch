import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Satellite } from 'lucide-react';
import { AppProvider } from './context/AppContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LandingPage from './components/LandingPage/LandingPage.jsx';
import Dashboard from './components/Dashboard/Dashboard.jsx';
import AuthPage from './components/Auth/AuthPage.jsx';

/**
 * Inner app — rendered inside both AuthProvider and AppProvider.
 * Shows the AuthPage if not signed in, then the existing landing → dashboard flow.
 */
function AppInner() {
  const { user, loading, showAuthModal, setShowAuthModal } = useAuth();
  const [hasLocation, setHasLocation] = useState(false);

  // Firebase is resolving the persisted session — show a minimal splash
  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4"
        style={{ background: '#070a12' }}>
        <div className="flex items-center gap-3">
          <Satellite className="w-6 h-6 text-cyan animate-pulse" />
          <span className="font-playfair font-bold text-xl text-white">
            Project <span className="text-cyan">Zenith</span>
          </span>
        </div>
        <Loader2 className="w-5 h-5 text-cyan/50 animate-spin" />
      </div>
    );
  }

  return (
    <AppProvider>
      <div className="relative w-full h-full overflow-hidden bg-[#070a12]">
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

        {/* Global Auth Modal Overlay */}
        <AnimatePresence>
          {showAuthModal && (
            <motion.div
              key="auth-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ zIndex: 9999 }}
              className="fixed inset-0"
            >
              <AuthPage isModal={true} onClose={() => setShowAuthModal(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppProvider>
  );
}

/**
 * App root — wraps everything in AuthProvider so useAuth() is available everywhere.
 */
export default function App() {
  return (
    <AuthProvider>
      <AnimatePresence mode="wait">
        <AppInner />
      </AnimatePresence>
    </AuthProvider>
  );
}
