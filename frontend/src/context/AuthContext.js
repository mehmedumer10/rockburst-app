// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  deleteDoc,
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { initializeApp } from 'firebase/app';

// ── Firebase config ── put your real values here (or import from firebaseConfig.js)
const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const storage = getStorage(app);

const AuthContext = createContext(null);

// Shape used whenever we need to create a brand-new profile document
// (email signup, Google signup, or self-healing a missing doc).
const defaultProfile = (overrides = {}) => ({
  displayName:      '',
  email:            '',
  organization:     '',
  country:          '',
  bio:              '',
  photoURL:         '',
  totalPredictions: 0,
  createdAt:        new Date().toISOString(),
  ...overrides,
});

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tracks the unsubscribe function for the current profile listener so we
  // can tear it down cleanly whenever the signed-in user changes.
  const profileUnsubRef = useRef(null);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (firebaseUser) => {
      // Stop listening to the previous user's profile doc, if any.
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
        profileUnsubRef.current = null;
      }

      setUser(firebaseUser);

      if (firebaseUser) {
        // Store token for axios calls
        const token = await firebaseUser.getIdToken();
        localStorage.setItem('token', token);

        const userDocRef = doc(db, 'users', firebaseUser.uid);

        // Real-time profile listener (instead of a one-time getDoc).
        // This is what makes things like "totalPredictions" on the
        // dashboard update automatically the moment the backend writes
        // a new value to Firestore, without needing a page refresh.
        profileUnsubRef.current = onSnapshot(
          userDocRef,
          async (snap) => {
            if (snap.exists()) {
              setProfile(snap.data());
            } else {
              // Self-heal: covers the rare case where a profile doc
              // doesn't exist yet (e.g. a race right after a brand new
              // Google sign-in) so the app never gets stuck with a
              // permanently null profile.
              const fresh = defaultProfile({
                displayName: firebaseUser.displayName || '',
                email:       firebaseUser.email || '',
                photoURL:    firebaseUser.photoURL || '',
              });
              try {
                await setDoc(userDocRef, fresh, { merge: true });
              } catch (e) {
                console.error('Failed to self-heal profile doc:', e);
              }
              setProfile(fresh);
            }
            setLoading(false);
          },
          (err) => {
            console.error('Profile listener error:', err);
            setLoading(false);
          }
        );
      } else {
        localStorage.removeItem('token');
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (profileUnsubRef.current) profileUnsubRef.current();
    };
  }, []);

  // Get a fresh token (used by axios calls in pages).
  // forceRefresh defaults to false — forcing a refresh on every single
  // call adds latency and can intermittently fail/rate-limit when several
  // requests fire close together (e.g. right after submitting a prediction).
  // Pass `true` explicitly only when you specifically need a brand new token.
  const getToken = async (forceRefresh = false) => {
    if (!user) return null;
    return user.getIdToken(forceRefresh);
  };

  // Sign up with email
  const signup = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await setDoc(
      doc(db, 'users', cred.user.uid),
      defaultProfile({ displayName, email }),
      { merge: true }
    );
    return cred;
  };

  // Sign in with email
  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  // Google sign-in
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const cred = await signInWithPopup(auth, provider);

      // Create the Firestore profile doc if this is the user's first time.
      // (The onSnapshot listener above will also self-heal this if it's
      // ever missing, but doing it here means it's correct immediately,
      // using the real Google display name/photo rather than placeholders.)
      const userDocRef = doc(db, 'users', cred.user.uid);
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        await setDoc(
          userDocRef,
          defaultProfile({
            displayName: cred.user.displayName || '',
            email:       cred.user.email,
            photoURL:    cred.user.photoURL || '',
          }),
          { merge: true }
        );
      }

      return cred;
    } catch (err) {
      console.error('Google sign-in failed:', err.code, err.message);

      // Re-throw a clearer message so the Login/Signup page can surface it
      // (e.g. via toast) instead of the sign-in silently doing nothing.
      if (err.code === 'auth/popup-blocked') {
        throw new Error('Your browser blocked the Google sign-in popup. Please allow popups for this site and try again.');
      }
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        throw new Error('Google sign-in was cancelled before it could finish.');
      }
      if (err.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for Google sign-in. Add it under Firebase Console → Authentication → Settings → Authorized domains.');
      }
      if (err.code === 'auth/account-exists-with-different-credential') {
        throw new Error('An account already exists with this email using a different sign-in method. Try logging in with email/password instead.');
      }
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('token');
  };

  // Update profile fields.
  // Uses setDoc(..., { merge: true }) instead of updateDoc so this can
  // never fail with "No document to update" — if the profile doc is
  // missing or incomplete for any reason, this call creates/repairs it
  // instead of throwing (which is what was silently breaking profile saves).
  const updateUserProfile = async (fields) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), fields, { merge: true });
    if (fields.displayName) {
      await updateProfile(user, { displayName: fields.displayName });
    }
    setProfile(p => ({ ...p, ...fields }));
  };

  // Upload profile picture
  const uploadProfilePicture = async (file) => {
    if (!user) return;
    const fileRef = storageRef(storage, `avatars/${user.uid}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    await updateProfile(user, { photoURL: url });
    await setDoc(doc(db, 'users', user.uid), { photoURL: url }, { merge: true });
    setProfile(p => ({ ...p, photoURL: url }));
  };

  // Remove profile picture
  const removeProfilePicture = async () => {
    if (!user) return;
    try {
      await deleteObject(storageRef(storage, `avatars/${user.uid}`));
    } catch (_) { /* ignore if no file */ }
    await updateProfile(user, { photoURL: '' });
    await setDoc(doc(db, 'users', user.uid), { photoURL: '' }, { merge: true });
    setProfile(p => ({ ...p, photoURL: '' }));
  };

  // Delete account
  const deleteAccount = async (password) => {
    if (!user) return;
    // Re-authenticate first
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    // Delete Firestore data
    await deleteDoc(doc(db, 'users', user.uid));
    // Delete Firebase user
    await deleteUser(user);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    profile,
    loading,
    getToken,
    signup,
    login,
    loginWithGoogle,
    logout,
    updateUserProfile,
    uploadProfilePicture,
    removeProfilePicture,
    deleteAccount,
  };

  // Don't render children until auth state is known
  if (loading) return null;

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);