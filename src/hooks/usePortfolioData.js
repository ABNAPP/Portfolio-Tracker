import { useState, useEffect, useRef, useCallback } from 'react';
import { onSnapshot, setDoc, doc } from 'firebase/firestore';
import { db, firebaseError, setFirestorePermissionError } from '../config/firebase';
import { logger } from '../utils/logger';

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
 * - Firestore is the ONLY source-of-truth (read via onSnapshot)
 * - User must be logged in to use this hook
 * - No localStorage fallback - Firestore only
 * - Firestore path: users/{uid}/portfolio/data (matches Firestore rules)
 */
export const usePortfolioData = (user, key, defaultValue) => {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);
  const previousUidRef = useRef(null); // Track previous UID to detect changes

  // Save to Firestore using the single source-of-truth helper
  const saveToFirestore = useCallback(async (value, uid) => {
    if (!db || !uid || firebaseError) {
      logger.warn(`[PortfolioData] Cannot save to Firestore - db: ${!!db}, uid: ${!!uid}, firebaseError: ${!!firebaseError}`);
      throw new Error('Cannot save to Firestore: Firebase not available');
    }

    const docRef = portfolioDocRef(db, uid);
    if (!docRef) {
      logger.warn(`[PortfolioData] portfolioDocRef returned null for uid: ${uid}`);
      throw new Error('Document reference is null');
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

    // If user is NOT logged in: set default value
    if (!isLoggedIn) {
      logger.log(`[PortfolioData] 👤 User is logged out - setting default value for ${key}`);
      setData(defaultValue);
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
      logger.error(`[PortfolioData] ❌ portfolioDocRef returned null`);
      setData(defaultValue);
      setLoading(false);
      setError(new Error('Document reference is null'));
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
              setError(null);
            } else {
              logger.warn(`[PortfolioData] ⚠️ Field "${key}" NOT found in Firestore document`);
              logger.warn(`[PortfolioData] - Available fields: ${fields.join(', ')}`);
              logger.warn(`[PortfolioData] - Using default value`);
              
              // Field doesn't exist - use default value
              setData(defaultValue);
              setError(null);
            }
          } else {
            // Document doesn't exist yet
            logger.log(`[PortfolioData] ⚠️ Document doesn't exist at ${path}`);
            logger.log(`[PortfolioData] - Using default value`);
            
            // Document doesn't exist - use default value
            setData(defaultValue);
            setError(null);
          }
          
          setLoading(false);
        } catch (err) {
          logger.error(`[PortfolioData] ❌ Error in onSnapshot callback for ${key}:`, err);
          setError(err);
          setData(defaultValue);
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
        setData(defaultValue);
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
  }, [user?.uid, key, defaultValue, firebaseError]);

  // Update function that saves to Firestore
  const updateData = useCallback((newData) => {
    const currentUid = user?.uid;
    logger.log(`[PortfolioData] updateData called for ${key}, user: ${currentUid || 'logged out'}`);

    // Update local state optimistically
    setData(prevData => {
      const valueToStore = typeof newData === 'function' ? newData(prevData) : newData;
      
      // Save to Firestore if user is logged in (fire and forget, but log errors)
      if (currentUid && db && !firebaseError) {
        // Use setDoc with merge to ensure data is persisted
        saveToFirestore(valueToStore, currentUid).then(() => {
          logger.log(`[PortfolioData] ✅ Successfully saved ${key} update to Firestore`);
          // onSnapshot will confirm the update, ensuring consistency
        }).catch(err => {
          logger.error(`[PortfolioData] ❌ Failed to save ${key} to Firestore:`, err);
          logger.error(`[PortfolioData] - Error details:`, err);
          setError(err);
          // Note: onSnapshot will eventually sync the correct state from Firestore
        });
      } else {
        logger.warn(`[PortfolioData] Cannot save ${key} - user not logged in or Firebase not available`);
      }

      return valueToStore;
    });
  }, [user?.uid, key, saveToFirestore]);

  return [data, updateData, loading, error];
};
