import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  browserLocalPersistence,
  setPersistence,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../firebase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(undefined); // undefined = loading
  const [authError, setAuthError] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Listen to auth state — Firebase restores session from localStorage automatically
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null);
    });
    return unsub;
  }, []);

  // Ensure persistence is set to local (survives browser restart)
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(console.error);
  }, []);

  const clearError = () => setAuthError(null);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(friendlyError(err));
      throw err;
    }
  };

  const signInWithGithub = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, githubProvider);
    } catch (err) {
      setAuthError(friendlyError(err));
      throw err;
    }
  };

  const signUpWithEmail = async (email, password, displayName) => {
    setAuthError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
    } catch (err) {
      setAuthError(friendlyError(err));
      throw err;
    }
  };

  const signInWithEmail = async (email, password) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setAuthError(friendlyError(err));
      throw err;
    }
  };

  const signOut = async () => {
    setAuthError(null);
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading: user === undefined,
      authError,
      clearError,
      signInWithGoogle,
      signInWithGithub,
      signUpWithEmail,
      signInWithEmail,
      signOut,
      showAuthModal,
      setShowAuthModal,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Map Firebase error codes to human-friendly messages */
function friendlyError(err) {
  const code = err?.code || '';
  if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential'))
    return 'Invalid email or password.';
  if (code.includes('email-already-in-use'))
    return 'An account with this email already exists. Try signing in.';
  if (code.includes('weak-password'))
    return 'Password must be at least 6 characters.';
  if (code.includes('invalid-email'))
    return 'Please enter a valid email address.';
  if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request'))
    return null; // user dismissed — not an error
  if (code.includes('account-exists-with-different-credential'))
    return 'An account already exists with this email using a different sign-in method.';
  if (code.includes('popup-blocked'))
    return 'Popup was blocked. Please allow popups for this site.';
  return err?.message || 'Something went wrong. Please try again.';
}
