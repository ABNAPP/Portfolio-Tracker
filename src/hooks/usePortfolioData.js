import { useState, useEffect, useRef, useCallback } from 'react';
import { onSnapshot, setDoc } from 'firebase/firestore';
import { db, getPortfolioDoc, firebaseError } from '../config/firebase';

// Helper to get localStorage key for a user
const getStorageKey = (uid, key) => `pf_${uid}_${key}`;

/**
 * Hook for syncing portfolio data with Firestore
 * Falls back to localStorage if Firestore is unavailable or user is not logged in
 */
export const usePortfolioData = (user, key, defaultValue) => {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  // Save to localStorage as backup
  const saveToLocalStorage = useCallback((value, uid) => {
    try {
      if (uid) {
        localStorage.setItem(getStorageKey(uid, key), JSON.stringify(value));
      }
    } catch (err) {
      console.warn(`[PortfolioData] Failed to save to localStorage:`, err);
    }
  }, [key]);

  // Load from localStorage as fallback
  const loadFromLocalStorage = useCallback((uid) => {
    try {
      if (uid) {
        const stored = localStorage.getItem(getStorageKey(uid, key));
        if (stored) {
          return JSON.parse(stored);
        }
      }
      // Try old localStorage format (without uid)
      const oldKey = key.includes('_v') ? key : `pf_${key}_v24`;
      const oldStored = localStorage.getItem(oldKey);
      if (oldStored) {
        return JSON.parse(oldStored);
      }
    } catch (err) {
      console.warn(`[PortfolioData] Failed to load from localStorage:`, err);
    }
    return defaultValue;
  }, [key, defaultValue]);

  // Save to Firestore
  const saveToFirestore = useCallback(async (value, uid) => {
    if (!db || !uid || firebaseError) {
      console.warn(`[PortfolioData] Cannot save to Firestore - db: ${!!db}, uid: ${!!uid}, firebaseError: ${!!firebaseError}`);
      return;
    }

    try {
      const docRef = getPortfolioDoc(uid);
      if (!docRef) {
        console.warn(`[PortfolioData] getPortfolioDoc returned null for uid: ${uid}`);
        return;
      }
      
      console.log(`[PortfolioData] Saving ${key} to Firestore for user ${uid}`);
      await setDoc(
        docRef,
        { [key]: value, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      console.log(`[PortfolioData] Successfully saved ${key} to Firestore`);
    } catch (err) {
      console.error(`[PortfolioData] Failed to save to Firestore:`, err);
      console.error(`[PortfolioData] Error code:`, err.code);
      console.error(`[PortfolioData] Error message:`, err.message);
      throw err;
    }
  }, [key]);

  // Set up Firestore listener
  useEffect(() => {
    if (!user || !user.uid || !db || firebaseError) {
      // No user or no Firestore - use localStorage
      const localData = loadFromLocalStorage(user?.uid);
      setData(localData);
      setLoading(false);
      setError(null);
      return;
    }

    // Clean up previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    console.log(`[PortfolioData] Setting up Firestore listener for ${key}, user: ${user.uid}`);
    setLoading(true);
    setError(null);

    try {
      // Double-check that db is available before proceeding
      if (!db) {
        console.warn(`[PortfolioData] db is null, falling back to localStorage for ${key}`);
        const localData = loadFromLocalStorage(user.uid);
        setData(localData);
        setLoading(false);
        return;
      }

      const docRef = getPortfolioDoc(user.uid);
      if (!docRef) {
        // Fallback to localStorage
        console.warn(`[PortfolioData] getPortfolioDoc returned null, falling back to localStorage for ${key}`);
        const localData = loadFromLocalStorage(user.uid);
        setData(localData);
        setLoading(false);
        return;
      }

      // Set up real-time listener with error handling
      unsubscribeRef.current = onSnapshot(
        docRef,
        (snapshot) => {
          try {
            if (snapshot.exists()) {
              const firestoreData = snapshot.data();
              const newData = firestoreData[key] !== undefined ? firestoreData[key] : defaultValue;
              console.log(`[PortfolioData] Received update for ${key} from Firestore`);
              setData(newData);
              saveToLocalStorage(newData, user.uid);
              setError(null);
            } else {
              // Document doesn't exist - try loading from localStorage and create doc
              console.log(`[PortfolioData] Document doesn't exist for ${key}, loading from localStorage`);
              const localData = loadFromLocalStorage(user.uid);
              console.log(`[PortfolioData] Loaded from localStorage:`, localData !== defaultValue ? 'has data' : 'default');
              setData(localData);
              // Always try to save to Firestore, even if it's default (to create the document)
              // But only if db is still available
              if (db) {
                saveToFirestore(localData, user.uid).then(() => {
                  console.log(`[PortfolioData] Successfully migrated ${key} to Firestore`);
                }).catch(err => {
                  console.warn(`[PortfolioData] Failed to sync local data to Firestore:`, err);
                  if (err.code === 'permission-denied') {
                    console.error(`[PortfolioData] PERMISSION DENIED - Check Firestore security rules!`);
                  }
                });
              }
            }
            setLoading(false);
          } catch (err) {
            console.error(`[PortfolioData] Error in snapshot callback for ${key}:`, err);
            setError(err);
            const localData = loadFromLocalStorage(user.uid);
            setData(localData);
            setLoading(false);
          }
        },
        (err) => {
          console.error(`[PortfolioData] Firestore listener error for ${key}:`, err);
          setError(err);
          // Fallback to localStorage on error
          try {
            const localData = loadFromLocalStorage(user.uid);
            setData(localData);
          } catch (localErr) {
            console.error(`[PortfolioData] Failed to load from localStorage:`, localErr);
            setData(defaultValue);
          }
          setLoading(false);
        }
      );
    } catch (err) {
      console.error(`[PortfolioData] Failed to set up listener for ${key}:`, err);
      setError(err);
      try {
        const localData = loadFromLocalStorage(user.uid);
        setData(localData);
      } catch (localErr) {
        console.error(`[PortfolioData] Failed to load from localStorage:`, localErr);
        setData(defaultValue);
      }
      setLoading(false);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user, key, defaultValue, loadFromLocalStorage, saveToLocalStorage, saveToFirestore]);

  // Update function that saves to both Firestore and localStorage
  const updateData = useCallback((newData) => {
    setData(prevData => {
      const valueToStore = typeof newData === 'function' ? newData(prevData) : newData;
      
      console.log(`[PortfolioData] updateData called for ${key}, user: ${user?.uid}`);
      
      // Save to localStorage immediately
      if (user?.uid) {
        saveToLocalStorage(valueToStore, user.uid);
      }

      // Save to Firestore asynchronously - ALWAYS try to save if user is logged in
      if (user?.uid && db && !firebaseError) {
        saveToFirestore(valueToStore, user.uid).then(() => {
          console.log(`[PortfolioData] Successfully saved ${key} update to Firestore`);
        }).catch(err => {
          console.error(`[PortfolioData] Failed to save ${key} to Firestore:`, err);
          if (err.code === 'permission-denied') {
            console.error(`[PortfolioData] PERMISSION DENIED - Firestore security rules may not be configured!`);
            setError(new Error('Firestore permission denied. Please check security rules.'));
          } else {
            setError(err);
          }
        });
      } else {
        console.warn(`[PortfolioData] Not saving to Firestore - user: ${!!user?.uid}, db: ${!!db}, firebaseError: ${!!firebaseError}`);
      }

      return valueToStore;
    });
  }, [user, key, saveToLocalStorage, saveToFirestore]);

  return [data, updateData, loading, error];
};
