import { useState, useEffect, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  updateProfile,
  signInAnonymously
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, signInWithPopup, googleProvider, fbSignOut } from '../lib/firebase';
import { getOrCreateUserKeys, StoredKeyPair } from '../lib/crypto';
import { UserProfile } from '../types';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [keyPair, setKeyPair] = useState<StoredKeyPair | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync profile & keys to Firestore
  const syncProfile = useCallback(async (fbUser: FirebaseUser) => {
    try {
      // Get or generate E2EE key pair for this user
      const keys = await getOrCreateUserKeys(fbUser.uid);
      setKeyPair(keys);

      const userDocRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userDocRef);

      const profileData: UserProfile = {
        uid: fbUser.uid,
        displayName: fbUser.displayName || 'Telegram User',
        email: fbUser.email || `${fbUser.uid.slice(0, 8)}@telecrypt.local`,
        photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
        username: fbUser.displayName ? fbUser.displayName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20) : `user_${fbUser.uid.slice(0, 6)}`,
        bio: 'Secured with TeleCrypt End-to-End Encryption 🔒',
        publicKey: JSON.stringify(keys.publicKeyJWK),
        status: 'online',
        lastSeen: new Date().toISOString(),
        createdAt: userSnap.exists() ? (userSnap.data().createdAt || new Date().toISOString()) : new Date().toISOString()
      };

      await setDoc(userDocRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setUserProfile(profileData);
    } catch (err) {
      console.error('Failed to sync profile', err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncProfile(user);
      } else {
        setUserProfile(null);
        setKeyPair(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [syncProfile]);

  // Handle presence offline on tab close
  useEffect(() => {
    if (!currentUser) return;
    const handleUnload = () => {
      const userDocRef = doc(db, 'users', currentUser.uid);
      updateDoc(userDocRef, {
        status: 'offline',
        lastSeen: new Date().toISOString()
      }).catch(() => {});
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [currentUser]);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      setAuthError(message);
      console.warn('Google sign in error', err);
    }
  };

  // Quick Demo Account Sign-in (allows testing multi-user E2EE & calling in two tabs)
  const signInAsDemo = async (customName = 'Pavel Durov') => {
    setAuthError(null);
    try {
      const cred = await signInAnonymously(auth);
      if (cred.user) {
        await updateProfile(cred.user, {
          displayName: customName,
          photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(customName)}`
        });
        await syncProfile(cred.user);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Demo sign in failed';
      setAuthError(message);
    }
  };

  const logout = async () => {
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
          status: 'offline',
          lastSeen: new Date().toISOString()
        });
      } catch {
        // ignore on sign out
      }
    }
    await fbSignOut(auth);
  };

  const updateProfileData = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      console.error('Failed to update profile', err);
    }
  };

  return {
    currentUser,
    userProfile,
    keyPair,
    loading,
    authError,
    signInWithGoogle,
    signInAsDemo,
    logout,
    updateProfileData,
    refreshProfile: () => currentUser && syncProfile(currentUser)
  };
}
