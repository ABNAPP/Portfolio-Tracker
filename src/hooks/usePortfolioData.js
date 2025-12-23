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
      return;
    }

    try {
      const docRef = getPortfolioDoc(uid);
      if (!docRef) return;
      
      await setDoc(
        docRef,
        { [key]: value, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      console.error(`[PortfolioData] Failed to save to Firestore:`, err);
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
      const docRef = getPortfolioDoc(user.uid);
      if (!docRef) {
        // Fallback to localStorage
        const localData = loadFromLocalStorage(user.uid);
        setData(localData);
        setLoading(false);
        return;
      }

      // Set up real-time listener
      unsubscribeRef.current = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const firestoreData = snapshot.data();
            const newData = firestoreData[key] !== undefined ? firestoreData[key] : defaultValue;
            console.log(`[PortfolioData] Received update for ${key} from Firestore`);
            setData(newData);
            saveToLocalStorage(newData, user.uid);
            setError(null);
          } else {
            // Document doesn't exist - try loading from localStorage and create doc
            const localData = loadFromLocalStorage(user.uid);
            setData(localData);
            if (localData !== defaultValue) {
              saveToFirestore(localData, user.uid).catch(err => {
                console.warn(`[PortfolioData] Failed to sync local data to Firestore:`, err);
              });
            }
          }
          setLoading(false);
        },
        (err) => {
          console.error(`[PortfolioData] Firestore listener error for ${key}:`, err);
          setError(err);
          // Fallback to localStorage on error
          const localData = loadFromLocalStorage(user.uid);
          setData(localData);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error(`[PortfolioData] Failed to set up listener for ${key}:`, err);
      setError(err);
      const localData = loadFromLocalStorage(user.uid);
      setData(localData);
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
      
      // Save to localStorage immediately
      if (user?.uid) {
        saveToLocalStorage(valueToStore, user.uid);
      }

      // Save to Firestore asynchronously
      if (user?.uid && db && !firebaseError) {
        saveToFirestore(valueToStore, user.uid).catch(err => {
          console.warn(`[PortfolioData] Failed to save ${key} to Firestore:`, err);
          setError(err);
        });
      }

      return valueToStore;
    });
  }, [user, key, saveToLocalStorage, saveToFirestore]);

  return [data, updateData, loading, error];
};
