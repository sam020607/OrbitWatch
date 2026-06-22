import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Satellite, Github, Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

/* ─── Google G SVG icon ──────────────────────────────────────────────────── */
function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

/* ─── Floating star particles ────────────────────────────────────────────── */
function Stars() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 1.5 + 0.5,
    duration: Math.random() * 4 + 3,
    delay: Math.random() * 5,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map(s => (
        <motion.div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
          animate={{ opacity: [0.1, 0.9, 0.1] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/* ─── Orbital ring decoration ────────────────────────────────────────────── */
function OrbitalRing({ radius, duration, opacity = 0.12, children }) {
  return (
    <motion.div
      className="absolute rounded-full border border-cyan/20"
      style={{
        width: radius * 2,
        height: radius * 2,
        left: '50%',
        top: '50%',
        x: '-50%',
        y: '-50%',
        opacity,
      }}
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Main Auth Page ─────────────────────────────────────────────────────── */
export default function AuthPage({ isModal = false, onClose }) {
  const { signInWithGoogle, signInWithGithub, signInWithEmail, signUpWithEmail, authError, clearError, user } = useAuth();
  const [mode, setMode]         = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(null); // 'google' | 'github' | 'email' | null
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (user && onClose) {
      onClose();
    }
  }, [user, onClose]);

  const error = localError || authError;

  const clearErrors = () => { setLocalError(null); clearError(); };

  const handleModeSwitch = (m) => {
    setMode(m);
    clearErrors();
    setEmail(''); setPassword(''); setName('');
  };

  const handleGoogle = async () => {
    clearErrors();
    setLoading('google');
    try { await signInWithGoogle(); }
    catch { /* authError set by context */ }
    finally { setLoading(null); }
  };

  const handleGithub = async () => {
    clearErrors();
    setLoading('github');
    try { await signInWithGithub(); }
    catch { /* authError set by context */ }
    finally { setLoading(null); }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    if (!email.trim() || !password.trim()) {
      setLocalError('Please fill in all fields.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setLocalError('Please enter your name.');
      return;
    }
    setLoading('email');
    try {
      if (mode === 'signup') await signUpWithEmail(email, password, name);
      else await signInWithEmail(email, password);
    } catch {
      /* authError set by context */
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      className="fixed inset-0 flex justify-center overflow-y-auto p-4 z-50"
      style={{
        background: isModal ? 'rgba(7, 10, 18, 0.72)' : '#070a12',
        backdropFilter: isModal ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: isModal ? 'blur(16px)' : 'none',
      }}
      onClick={(e) => {
        if (isModal && e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >

      {/* Background — inherits the Earth-from-space body::before / body::after */}
      <Stars />

      {/* Orbital decoration rings */}
      <OrbitalRing radius={320} duration={40} opacity={0.07} />
      <OrbitalRing radius={480} duration={65} opacity={0.05} />
      <OrbitalRing radius={640} duration={90} opacity={0.03} />

      {/* Glow spot behind card */}
      <div className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(77,141,255,0.08) 0%, transparent 70%)',
          left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
        }} />

      {/* ── Auth Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px] my-auto mx-auto"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking card content
      >
        <div style={{
          background: 'rgba(10, 14, 22, 0.82)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
          padding: '40px 36px 36px',
          position: 'relative',
        }}>

          {/* Close button for modal */}
          {isModal && onClose && (
            <button
              id="auth-modal-close-btn"
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-md text-muted hover:text-white hover:bg-white/5 transition-all focus:outline-none cursor-pointer z-20"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Logo */}
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl mb-1"
              style={{
                background: 'rgba(77,141,255,0.1)',
                border: '1px solid rgba(77,141,255,0.25)',
                boxShadow: '0 0 24px rgba(77,141,255,0.15)',
              }}>
              <Satellite className="w-7 h-7 text-cyan" />
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{ border: '1px solid rgba(77,141,255,0.4)' }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <h1 className="font-playfair font-bold text-2xl text-white tracking-tight">
              Project <span className="text-cyan">Zenith</span>
            </h1>
            <p className="text-[13px] font-sans text-muted tracking-wide">
              Control Room · Satellite Tracking
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="flex flex-col gap-3 mb-6">
            <OAuthButton
              id="google-signin-btn"
              icon={<GoogleIcon size={18} />}
              label="Continue with Google"
              loading={loading === 'google'}
              disabled={!!loading}
              onClick={handleGoogle}
              color="rgba(66,133,244,0.12)"
              borderColor="rgba(66,133,244,0.25)"
              hoverColor="rgba(66,133,244,0.2)"
            />
            <OAuthButton
              id="github-signin-btn"
              icon={<Github className="w-[18px] h-[18px]" />}
              label="Continue with GitHub"
              loading={loading === 'github'}
              disabled={!!loading}
              onClick={handleGithub}
              color="rgba(255,255,255,0.06)"
              borderColor="rgba(255,255,255,0.12)"
              hoverColor="rgba(255,255,255,0.1)"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="text-[11px] font-sans text-muted uppercase tracking-widest">or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Mode Tabs */}
          <div className="flex rounded-xl p-1 mb-5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {['signin', 'signup'].map((m) => (
              <button
                key={m}
                id={`auth-tab-${m}`}
                onClick={() => handleModeSwitch(m)}
                className="flex-1 py-2 text-[12px] font-sans font-semibold uppercase tracking-wider rounded-lg transition-all duration-200 focus:outline-none"
                style={{
                  background: mode === m ? 'rgba(77,141,255,0.18)' : 'transparent',
                  color: mode === m ? '#4d8dff' : 'rgba(255,255,255,0.35)',
                  border: mode === m ? '1px solid rgba(77,141,255,0.3)' : '1px solid transparent',
                }}
              >
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Email Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleEmailSubmit}
              className="flex flex-col gap-3"
            >
              {mode === 'signup' && (
                <FormField
                  id="auth-name"
                  icon={<User className="w-4 h-4" />}
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={e => { setName(e.target.value); clearErrors(); }}
                  disabled={!!loading}
                />
              )}
              <FormField
                id="auth-email"
                icon={<Mail className="w-4 h-4" />}
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => { setEmail(e.target.value); clearErrors(); }}
                disabled={!!loading}
                autoComplete="email"
              />
              <div className="relative">
                <FormField
                  id="auth-password"
                  icon={<Lock className="w-4 h-4" />}
                  type={showPw ? 'text' : 'password'}
                  placeholder={mode === 'signup' ? 'Password (6+ characters)' : 'Password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearErrors(); }}
                  disabled={!!loading}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  paddingRight
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors focus:outline-none"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2 px-3 py-2 rounded-lg text-[12px] font-sans"
                    style={{ background: 'rgba(224,88,79,0.12)', border: '1px solid rgba(224,88,79,0.25)', color: '#f87171' }}
                  >
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                id="auth-submit-btn"
                type="submit"
                disabled={!!loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.99 }}
                className="mt-1 w-full py-3 rounded-xl font-sans font-semibold text-[13px] uppercase tracking-wider transition-all focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #4d8dff 0%, #3575d9 100%)',
                  color: '#fff',
                  boxShadow: '0 4px 20px rgba(77,141,255,0.3)',
                }}
              >
                {loading === 'email' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {mode === 'signup' ? 'Creating…' : 'Signing in…'}</>
                ) : (
                  mode === 'signup' ? 'Create Account' : 'Sign In'
                )}
              </motion.button>
            </motion.form>
          </AnimatePresence>

          {/* Footer */}
          <p className="mt-5 text-center text-[11px] font-sans text-muted leading-relaxed">
            By signing in you agree to our{' '}
            <span className="text-cyan/70 cursor-pointer hover:text-cyan transition-colors">Terms</span>
            {' & '}
            <span className="text-cyan/70 cursor-pointer hover:text-cyan transition-colors">Privacy Policy</span>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── OAuth Button ───────────────────────────────────────────────────────── */
function OAuthButton({ id, icon, label, loading, disabled, onClick, color, borderColor, hoverColor }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.button
      id={id}
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-sans font-medium text-[13px] transition-all focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        background: hovered ? hoverColor : color,
        border: `1px solid ${borderColor}`,
        color: 'rgba(255,255,255,0.85)',
      }}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {label}
    </motion.button>
  );
}

/* ─── Form Field ─────────────────────────────────────────────────────────── */
function FormField({ id, icon, type, placeholder, value, onChange, disabled, autoComplete, paddingRight }) {
  return (
    <div className="relative flex items-center">
      <span className="absolute left-3 text-muted pointer-events-none">{icon}</span>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        autoComplete={autoComplete}
        className="w-full font-sans text-[13px] text-white placeholder-muted rounded-xl focus:outline-none transition-all disabled:opacity-60"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: `11px 12px 11px ${paddingRight ? '40px' : '40px'}`,
          paddingRight: paddingRight ? '40px' : '12px',
        }}
        onFocus={e => {
          e.target.style.border = '1px solid rgba(77,141,255,0.4)';
          e.target.style.background = 'rgba(77,141,255,0.05)';
        }}
        onBlur={e => {
          e.target.style.border = '1px solid rgba(255,255,255,0.08)';
          e.target.style.background = 'rgba(255,255,255,0.05)';
        }}
      />
    </div>
  );
}
