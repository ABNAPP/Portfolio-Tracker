import { useState, useEffect, useRef, useCallback } from 'react';
import { onSnapshot, setDoc, doc } from 'firebase/firestore';
import { db, firebaseError, setFirestorePermissionError } from '../config/firebase';
import { logger } from '../utils/logger';

// Helper to get localStorage key for a user
const getStorageKey = (uid, key) => `pf_${uid}_${key}`;

/**
 * SINGLE SOURCE OF TRUTH for Firestore document reference
 * Used for ALL operations: getDoc, onSnapshot, setDoc, updateDoc
 * 
 * IMPORTANT: Firestore doc() requires separate path segments, NOT a string path
 * Correct: doc(db, 'users', uid, 'portfolio', 'data')
 * Wrong: doc(db, 'users/${uid}/portfolio/data')
 * 
 * This path matches Firestore rules: users/{userId}/portfolio/{document=**}
 * 
 * @param {object} db - Firestore database instance
 * @param {string} uid - User ID
 * @returns {object|null} Firestore document reference or null
 */
const portfolioDocRef = (db, uid) => {
  if (!db || !uid) {
    return null;
  }
  try {
    // Exact path: users/{uid}/portfolio/data
    // This matches Firestore rules: users/{userId}/portfolio/{document=**}
    // Use separate segments as Firestore requires
    return doc(db, 'users', uid, 'portfolio', 'data');
  } catch (err) {
    logger.error(`[PortfolioData] portfolioDocRef error:`, err);
    return null;
  }
};

/**
 * Get Firestore document path as string (for logging/debugging only)
 * This matches exactly what portfolioDocRef uses
 * This path matches Firestore rules: users/{userId}/portfolio/{document=**}
 */
const getPortfolioDocPath = (uid) => {
  if (!uid) return null;
  return `users/${uid}/portfolio/data`;
};

/**
 * Hook for syncing portfolio data with Firestore
 * 
 * RULES:
 * - When user is logged in: Firestore is source-of-truth (read via onSnapshot)
 * - When user is logged out: localStorage is source-of-truth (old format without uid)
 * - Firestore path: users/{uid}/portfolio/data (matches Firestore rules)
 */
export const usePortfolioData = (user, key, defaultValue) => {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);
  const previousUidRef = useRef(null); // Track previous UID to detect changes

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

  // Load from localStorage as fallback
  // Priority: 1) uid-specific key, 2) old format (without uid) for backward compatibility
  const loadFromLocalStorage = useCallback((uid) => {
    try {
      // First try uid-specific key (for logged-in users)
      if (uid) {
        const stored = localStorage.getItem(getStorageKey(uid, key));
        if (stored) {
          logger.log(`[PortfolioData] Loaded from localStorage (uid-specific): ${getStorageKey(uid, key)}`);
          return JSON.parse(stored);
        }
      }
      
      // Then try old localStorage format (without uid) - for backward compatibility and logged-out state
      const oldKey = key.includes('_v') ? key : `pf_${key}_v24`;
      const oldStored = localStorage.getItem(oldKey);
      if (oldStored) {
        logger.log(`[PortfolioData] Loaded from localStorage (old format): ${oldKey}`);
        return JSON.parse(oldStored);
      }
    } catch (err) {
      logger.warn(`[PortfolioData] Failed to load from localStorage:`, err);
    }
    return defaultValue;
  }, [key, defaultValue]);

  // Save to Firestore using the single source-of-truth helper
  const saveToFirestore = useCallback(async (value, uid) => {
    if (!db || !uid || firebaseError) {
      logger.warn(`[PortfolioData] Cannot save to Firestore - db: ${!!db}, uid: ${!!uid}, firebaseError: ${!!firebaseError}`);
      return;
    }

    const docRef = portfolioDocRef(db, uid);
    if (!docRef) {
      logger.warn(`[PortfolioData] portfolioDocRef returned null for uid: ${uid}`);
      return;
    }

    const path = getPortfolioDocPath(uid);
    logger.log(`[PortfolioData] ===== WRITE =====`);
    logger.log(`[PortfolioData] - Field: ${key}`);
    logger.log(`[PortfolioData] - currentUser.uid: ${uid}`);
    logger.log(`[PortfolioData] - Firestore path: ${path}`);
    logger.log(`[PortfolioData] - Path matches rules: users/{userId}/portfolio/{document=**}`);

    try {
      await setDoc(
        docRef,
        { [key]: value, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      
      logger.log(`[PortfolioData] ✅ WRITE: Successfully saved ${key} to Firestore`);
      logger.log(`[PortfolioData] - Path: ${path}`);
    } catch (err) {
      logger.error(`[PortfolioData] ❌ WRITE: Failed to save ${key} to Firestore:`, err);
      logger.error(`[PortfolioData] - Error code: ${err.code}, message: ${err.message}`);
      
      // Check for permission errors and set global error
      if (err.code === 'permission-denied' || err.code === 'PERMISSION_DENIED' || 
          (err.message && err.message.includes('Missing or insufficient permissions'))) {
        setFirestorePermissionError(err);
      }
      
      throw err;
    }
  }, [key]);

  // Main effect: Set up Firestore listener when user is logged in
  useEffect(() => {
    const currentUid = user?.uid;
    const isLoggedIn = currentUid && db && !firebaseError;

    // DEV DEBUG: Log current state
    logger.log(`[PortfolioData] ===== useEffect triggered =====`);
    logger.log(`[PortfolioData] - Field: ${key}`);
    logger.log(`[PortfolioData] - currentUser.uid: ${currentUid || 'null (logged out)'}`);
    logger.log(`[PortfolioData] - isLoggedIn: ${isLoggedIn}`);
    logger.log(`[PortfolioData] - previousUid: ${previousUidRef.current || 'none'}`);

    // If UID changed, cleanup previous listener
    if (unsubscribeRef.current && previousUidRef.current !== null && previousUidRef.current !== currentUid) {
      logger.log(`[PortfolioData] 🔄 UID changed: ${previousUidRef.current} → ${currentUid}`);
      logger.log(`[PortfolioData] - Unsubscribing previous listener`);
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // If user is NOT logged in: use localStorage (logout state)
    if (!isLoggedIn) {
      logger.log(`[PortfolioData] 👤 User is logged out - using localStorage for ${key}`);
      // When logged out, uid is null, so loadFromLocalStorage will try old format
      const localData = loadFromLocalStorage(null);
      setData(localData);
      setLoading(false);
      setError(null);
      
      // Clean up any existing listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      previousUidRef.current = currentUid;
      return;
    }

    // User IS logged in: Firestore is source-of-truth
    logger.log(`[PortfolioData] 🔐 User is logged in - setting up Firestore listener for ${key}`);
    
    const path = getPortfolioDocPath(currentUid);
    logger.log(`[PortfolioData] - Firestore path: ${path}`);
    logger.log(`[PortfolioData] - Path matches rules: users/{userId}/portfolio/{document=**}`);
    logger.log(`[PortfolioData] - Using portfolioDocRef() helper (same as WRITE)`);

    const docRef = portfolioDocRef(db, currentUid);
    if (!docRef) {
      logger.error(`[PortfolioData] ❌ portfolioDocRef returned null - falling back to localStorage`);
      const localData = loadFromLocalStorage(currentUid);
      setData(localData);
      setLoading(false);
      previousUidRef.current = currentUid;
      return;
    }

    setLoading(true);
    setError(null);

    // Set up onSnapshot listener
    logger.log(`[PortfolioData] 📡 Setting up onSnapshot listener for ${key}`);
    logger.log(`[PortfolioData] - Reading from: ${path}`);
    logger.log(`[PortfolioData] - Using same docRef as WRITE operations`);

    unsubscribeRef.current = onSnapshot(
      docRef,
      (snapshot) => {
        try {
          logger.log(`[PortfolioData] ===== READ (onSnapshot callback) =====`);
          logger.log(`[PortfolioData] - Field: ${key}`);
          logger.log(`[PortfolioData] - currentUser.uid: ${currentUid}`);
          logger.log(`[PortfolioData] - Firestore path: ${path}`);
          logger.log(`[PortfolioData] - snapshot.exists(): ${snapshot.exists()}`);

          if (snapshot.exists()) {
            const firestoreData = snapshot.data();
            const fields = Object.keys(firestoreData);
            logger.log(`[PortfolioData] - Firestore data fields: ${fields.join(', ')}`);

            // Extract the specific key from Firestore document
            if (firestoreData[key] !== undefined) {
              logger.log(`[PortfolioData] ✅ Found field "${key}" in Firestore`);
              logger.log(`[PortfolioData] - Data preview: ${JSON.stringify(firestoreData[key]).substring(0, 100)}...`);
              
              setData(firestoreData[key]);
              // Save to localStorage as backup (uid-specific)
              saveToLocalStorage(firestoreData[key], currentUid);
              setError(null);
            } else {
              logger.warn(`[PortfolioData] ⚠️ Field "${key}" NOT found in Firestore document`);
              logger.warn(`[PortfolioData] - Available fields: ${fields.join(', ')}`);
              logger.warn(`[PortfolioData] - Loading from localStorage as fallback`);
              
              // Field doesn't exist - try loading from localStorage (tries both uid-specific and old format)
              const localData = loadFromLocalStorage(currentUid);
              setData(localData);
              setError(null);
            }
          } else {
            // Document doesn't exist yet
            logger.log(`[PortfolioData] ⚠️ Document doesn't exist at ${path}`);
            logger.log(`[PortfolioData] - Loading from localStorage as fallback (tries both uid-specific and old format)`);
            
            // Document doesn't exist - load from localStorage (tries both uid-specific and old format)
            const localData = loadFromLocalStorage(currentUid);
            setData(localData);
            setError(null);
          }
          
          setLoading(false);
        } catch (err) {
          logger.error(`[PortfolioData] ❌ Error in onSnapshot callback for ${key}:`, err);
          setError(err);
          // On error, fallback to localStorage
          const localData = loadFromLocalStorage(currentUid);
          setData(localData);
          setLoading(false);
        }
      },
      (err) => {
        logger.error(`[PortfolioData] ❌ onSnapshot error for ${key}:`, err);
        logger.error(`[PortfolioData] - Error code: ${err.code}, message: ${err.message}`);
        
        // Check for permission errors
        if (err.code === 'permission-denied' || err.code === 'PERMISSION_DENIED' || 
            (err.message && err.message.includes('Missing or insufficient permissions'))) {
          logger.error(`[PortfolioData] - Permission denied! Check Firestore rules match path: ${path}`);
          setFirestorePermissionError(err);
        }
        
        setError(err);
        // Fallback to localStorage on error
        try {
          const localData = loadFromLocalStorage(currentUid);
          setData(localData);
        } catch (localErr) {
          logger.error(`[PortfolioData] Failed to load from localStorage:`, localErr);
          // Keep current state on localStorage error
        }
        setLoading(false);
      }
    );

    // Update previous UID reference
    previousUidRef.current = currentUid;

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        logger.log(`[PortfolioData] 🧹 Cleaning up Firestore listener for ${key}, UID: ${previousUidRef.current}`);
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
      
      logger.log(`[PortfolioData] updateData called for ${key}, user: ${currentUid || 'logged out'}`);
      
      // Save to localStorage immediately as backup
      if (currentUid) {
        saveToLocalStorage(valueToStore, currentUid);
      }

      // Save to Firestore if user is logged in
      if (currentUid && db && !firebaseError) {
        saveToFirestore(valueToStore, currentUid).then(() => {
          logger.log(`[PortfolioData] ✅ Successfully saved ${key} update to Firestore`);
        }).catch(err => {
          logger.error(`[PortfolioData] ❌ Failed to save ${key} to Firestore:`, err);
          setError(err);
        });
      }

      return valueToStore;
    });
  }, [user?.uid, key, saveToLocalStorage, saveToFirestore]);

  return [data, updateData, loading, error];
};
