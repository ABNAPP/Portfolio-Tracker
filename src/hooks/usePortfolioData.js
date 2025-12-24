import { useState, useEffect, useRef, useCallback } from 'react';
import { onSnapshot, setDoc } from 'firebase/firestore';
import { db, getPortfolioDoc, PORTFOLIO_DOC_PATH, firebaseError, setFirestorePermissionError } from '../config/firebase';
import { logger } from '../utils/logger';

// Helper to get localStorage key for a user
const getStorageKey = (uid, key) => `pf_${uid}_${key}`;

/**
 * Hook for syncing portfolio data with Firestore
 * Falls back to localStorage if Firestore is unavailable or user is not logged in
 * 
 * IMPORTANT: When user logs in and document doesn't exist in Firestore,
 * we do NOT automatically load from localStorage. We wait for data to be written to Firestore.
 * localStorage fallback only happens when:
 * - User is not logged in (logout state)
 * - Firestore is unavailable
 * - Error reading from Firestore
 */
export const usePortfolioData = (user, key, defaultValue) => {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);
  const currentUidRef = useRef(null); // Track current UID to detect user changes

  // Save to localStorage as backup (only when user is logged in)
  const saveToLocalStorage = useCallback((value, uid) => {
    try {
      if (uid) {
        localStorage.setItem(getStorageKey(uid, key), JSON.stringify(value));
      }
    } catch (err) {
      logger.warn(`[PortfolioData] Failed to save to localStorage:`, err);
    }
  }, [key]);

  // Load from localStorage as fallback (only when user is NOT logged in or Firestore unavailable)
  const loadFromLocalStorage = useCallback((uid) => {
    try {
      if (uid) {
        const stored = localStorage.getItem(getStorageKey(uid, key));
        if (stored) {
          return JSON.parse(stored);
        }
      }
      // Try old localStorage format (without uid) - for backward compatibility
      const oldKey = key.includes('_v') ? key : `pf_${key}_v24`;
      const oldStored = localStorage.getItem(oldKey);
      if (oldStored) {
        return JSON.parse(oldStored);
      }
    } catch (err) {
      logger.warn(`[PortfolioData] Failed to load from localStorage:`, err);
    }
    return defaultValue;
  }, [key, defaultValue]);

  // Save to Firestore
  const saveToFirestore = useCallback(async (value, uid) => {
    if (!db || !uid || firebaseError) {
      logger.warn(`[PortfolioData] Cannot save to Firestore - db: ${!!db}, uid: ${!!uid}, firebaseError: ${!!firebaseError}`);
      return;
    }

    try {
      const docRef = getPortfolioDoc(uid);
      if (!docRef) {
        logger.warn(`[PortfolioData] getPortfolioDoc returned null for uid: ${uid}`);
        return;
      }
      
      const path = PORTFOLIO_DOC_PATH(uid);
      logger.log(`[PortfolioData] Saving ${key} to Firestore - UID: ${uid}, Path: ${path}`);
      
      await setDoc(
        docRef,
        { [key]: value, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      
      logger.log(`[PortfolioData] Successfully saved ${key} to Firestore - Path: ${path}`);
    } catch (err) {
      logger.error(`[PortfolioData] Failed to save to Firestore:`, err);
      logger.error(`[PortfolioData] Error code:`, err.code);
      logger.error(`[PortfolioData] Error message:`, err.message);
      
      // Check for permission errors and set global error
      if (err.code === 'permission-denied' || err.code === 'PERMISSION_DENIED' || 
          (err.message && err.message.includes('Missing or insufficient permissions'))) {
        setFirestorePermissionError(err);
      }
      
      throw err;
    }
  }, [key]);

  // Set up Firestore listener
  useEffect(() => {
    const currentUid = user?.uid;
    const hasUser = currentUid && !firebaseError;
    const hasDb = !!db;

    // Clean up previous listener if UID changed
    if (unsubscribeRef.current && currentUidRef.current !== currentUid) {
      logger.log(`[PortfolioData] UID changed from ${currentUidRef.current} to ${currentUid} - cleaning up old listener`);
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Update current UID reference
    currentUidRef.current = currentUid;

    // If no user or no Firestore - use localStorage fallback (logout state)
    if (!hasUser || !hasDb) {
      logger.log(`[PortfolioData] No user or no Firestore - using localStorage fallback for ${key}`);
      logger.log(`[PortfolioData] - hasUser: ${hasUser}, hasDb: ${hasDb}, uid: ${currentUid}`);
      
      const localData = loadFromLocalStorage(currentUid);
      setData(localData);
      setLoading(false);
      setError(null);
      
      // Clean up listener if it exists
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      return;
    }

    // User is logged in and Firestore is available - set up listener
    logger.log(`[PortfolioData] Setting up Firestore listener for ${key}`);
    logger.log(`[PortfolioData] - UID: ${currentUid}`);
    
    const path = PORTFOLIO_DOC_PATH(currentUid);
    logger.log(`[PortfolioData] - Firestore Path: ${path}`);

    setLoading(true);
    setError(null);

    try {
      const docRef = getPortfolioDoc(currentUid);
      if (!docRef) {
        logger.warn(`[PortfolioData] getPortfolioDoc returned null, falling back to localStorage for ${key}`);
        const localData = loadFromLocalStorage(currentUid);
        setData(localData);
        setLoading(false);
        return;
      }

      // Set up real-time listener with error handling
      unsubscribeRef.current = onSnapshot(
        docRef,
        (snapshot) => {
          try {
            const path = PORTFOLIO_DOC_PATH(currentUid);
            logger.log(`[PortfolioData] onSnapshot callback triggered for ${key}`);
            logger.log(`[PortfolioData] - Path: ${path}`);
            logger.log(`[PortfolioData] - snapshot.exists(): ${snapshot.exists()}`);

            if (snapshot.exists()) {
              const firestoreData = snapshot.data();
              logger.log(`[PortfolioData] - Firestore data fields:`, Object.keys(firestoreData));
              
              // Extract the specific key from Firestore document
              const newData = firestoreData[key] !== undefined ? firestoreData[key] : defaultValue;
              
              logger.log(`[PortfolioData] - Extracted ${key}:`, newData !== defaultValue ? 'has data' : 'default/empty');
              
              setData(newData);
              // Save to localStorage as backup
              saveToLocalStorage(newData, currentUid);
              setError(null);
            } else {
              // Document doesn't exist in Firestore
              // IMPORTANT: Do NOT load from localStorage here (that's for logout state only)
              // Just set default value and wait for data to be written to Firestore
              logger.log(`[PortfolioData] Document doesn't exist at ${path}`);
              logger.log(`[PortfolioData] - Setting default value, waiting for data to be written`);
              
              setData(defaultValue);
              setError(null);
              // DO NOT save default to localStorage here - we want to wait for actual data
            }
            
            setLoading(false);
          } catch (err) {
            logger.error(`[PortfolioData] Error in snapshot callback for ${key}:`, err);
            setError(err);
            // On error, fallback to localStorage as safety measure
            const localData = loadFromLocalStorage(currentUid);
            setData(localData);
            setLoading(false);
          }
        },
        (err) => {
          logger.error(`[PortfolioData] Firestore listener error for ${key}:`, err);
          logger.error(`[PortfolioData] - Error code:`, err.code);
          logger.error(`[PortfolioData] - Error message:`, err.message);
          
          // Check for permission errors and set global error
          if (err.code === 'permission-denied' || err.code === 'PERMISSION_DENIED' || 
              (err.message && err.message.includes('Missing or insufficient permissions'))) {
            setFirestorePermissionError(err);
          }
          
          setError(err);
          // Fallback to localStorage on error
          try {
            const localData = loadFromLocalStorage(currentUid);
            setData(localData);
          } catch (localErr) {
            logger.error(`[PortfolioData] Failed to load from localStorage:`, localErr);
            setData(defaultValue);
          }
          setLoading(false);
        }
      );
    } catch (err) {
      logger.error(`[PortfolioData] Failed to set up listener for ${key}:`, err);
      
      // Check for permission errors
      if (err.code === 'permission-denied' || err.code === 'PERMISSION_DENIED' || 
          (err.message && err.message.includes('Missing or insufficient permissions'))) {
        setFirestorePermissionError(err);
      }
      
      setError(err);
      // Fallback to localStorage on setup error
      try {
        const localData = loadFromLocalStorage(currentUid);
        setData(localData);
      } catch (localErr) {
        logger.error(`[PortfolioData] Failed to load from localStorage:`, localErr);
        setData(defaultValue);
      }
      setLoading(false);
    }

    // Cleanup function - unsubscribe when component unmounts or dependencies change
    return () => {
      if (unsubscribeRef.current) {
        logger.log(`[PortfolioData] Cleaning up Firestore listener for ${key}, UID: ${currentUidRef.current}`);
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user?.uid, key, defaultValue, loadFromLocalStorage, saveToLocalStorage, firebaseError]);

  // Update function that saves to both Firestore and localStorage
  const updateData = useCallback((newData) => {
    setData(prevData => {
      const valueToStore = typeof newData === 'function' ? newData(prevData) : newData;
      const currentUid = user?.uid;
      
      logger.log(`[PortfolioData] updateData called for ${key}, user: ${currentUid}`);
      
      // Save to localStorage immediately as backup
      if (currentUid) {
        saveToLocalStorage(valueToStore, currentUid);
      }

      // Save to Firestore asynchronously - ALWAYS try to save if user is logged in
      if (currentUid && db && !firebaseError) {
        saveToFirestore(valueToStore, currentUid).then(() => {
          logger.log(`[PortfolioData] Successfully saved ${key} update to Firestore`);
        }).catch(err => {
          logger.error(`[PortfolioData] Failed to save ${key} to Firestore:`, err);
          // Permission errors are already handled in saveToFirestore
          setError(err);
        });
      } else {
        logger.warn(`[PortfolioData] Not saving to Firestore - user: ${!!currentUid}, db: ${!!db}, firebaseError: ${!!firebaseError}`);
      }

      return valueToStore;
    });
  }, [user?.uid, key, saveToLocalStorage, saveToFirestore]);

  return [data, updateData, loading, error];
};
