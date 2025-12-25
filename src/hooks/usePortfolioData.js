import { useState, useEffect, useRef, useCallback } from 'react';
import { setDoc, doc } from 'firebase/firestore';
import { db, firebaseError, setFirestorePermissionError } from '../config/firebase';
import { logger } from '../utils/logger';
import { subscribeToPortfolioDocument, unsubscribeFromPortfolioDocument } from './usePortfolioDocument';

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
  const subscriptionIdRef = useRef(null);
  const previousUidRef = useRef(null);
  const callbackRef = useRef(null);
  
  // Extract uid as string to avoid object reference issues
  const uid = user?.uid || null;
  const hasFirebaseError = !!firebaseError;
  
  // Store latest key and defaultValue in refs to use in callback
  const keyRef = useRef(key);
  const defaultValueRef = useRef(defaultValue);
  keyRef.current = key;
  defaultValueRef.current = defaultValue;
  
  // Track previous values to prevent unnecessary state updates
  const lastErrorRef = useRef(null);
  const lastLoadingRef = useRef(true);

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

    try {
      await setDoc(
        docRef,
        { [key]: value, updatedAt: new Date().toISOString() },
        { merge: true }
      );
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

  // Create stable callback that uses refs for latest values
  callbackRef.current = (documentData, loadingState, err) => {
    const currentKey = keyRef.current;
    const currentDefault = defaultValueRef.current;
    
    // Extract the specific field from the document
    if (err) {
      // Only update error state if error actually changed
      if (lastErrorRef.current !== err) {
        setError(err);
        lastErrorRef.current = err;
      }
      // Only update data if it's not already the default
      setData(prevData => {
        try {
          if (JSON.stringify(prevData) === JSON.stringify(currentDefault)) {
            return prevData;
          }
        } catch (e) {
          if (prevData === currentDefault) {
            return prevData;
          }
        }
        return currentDefault;
      });
      // Only update loading if it's not already false
      if (lastLoadingRef.current !== false) {
        setLoading(false);
        lastLoadingRef.current = false;
      }
    } else {
      const fieldValue = documentData[currentKey] !== undefined ? documentData[currentKey] : currentDefault;
      
      // Only update state if value actually changed (prevent infinite loops)
      setData(prevData => {
        // Faster comparison: check if same reference first (for objects/arrays)
        if (prevData === fieldValue) {
          return prevData;
        }
        
        // For primitives, direct comparison
        if (typeof prevData !== 'object' || prevData === null) {
          return prevData === fieldValue ? prevData : fieldValue;
        }
        
        // For objects/arrays, use JSON.stringify but with try-catch
        try {
          if (JSON.stringify(prevData) === JSON.stringify(fieldValue)) {
            return prevData; // No change, return previous to prevent re-render
          }
        } catch (e) {
          // If JSON.stringify fails, do shallow comparison
          if (prevData === fieldValue) {
            return prevData;
          }
        }
        return fieldValue;
      });
      
      // Only update error state if it's not already null
      if (lastErrorRef.current !== null) {
        setError(null);
        lastErrorRef.current = null;
      }
      
      // Only update loading state if it actually changed
      if (lastLoadingRef.current !== loadingState) {
        setLoading(loadingState);
        lastLoadingRef.current = loadingState;
      }
    }
  };

  // Subscribe to shared portfolio document listener
  useEffect(() => {
    const isLoggedIn = uid && db && !hasFirebaseError;

    // Clean up previous subscription if UID changed
    if (subscriptionIdRef.current && previousUidRef.current !== uid) {
      unsubscribeFromPortfolioDocument(previousUidRef.current, subscriptionIdRef.current);
      subscriptionIdRef.current = null;
    }

    // If user is NOT logged in: set default value once and return
    if (!isLoggedIn) {
      // Only set state if we're actually changing from logged in to logged out
      if (previousUidRef.current !== null) {
        setData(defaultValueRef.current);
        setLoading(false);
        setError(null);
        // Reset refs when logging out
        lastErrorRef.current = null;
        lastLoadingRef.current = false;
      }
      previousUidRef.current = uid;
      return;
    }

    // Only subscribe if we don't already have a subscription for this UID
    // Note: callbackRef.current uses refs (keyRef, defaultValueRef) internally,
    // so it will always read the latest values even if the callback function
    // reference doesn't change. No need to update callback in subscription.
    if (!subscriptionIdRef.current) {
      // Subscribe to shared document listener
      const subscriptionId = subscribeToPortfolioDocument(uid, callbackRef.current);
      subscriptionIdRef.current = subscriptionId;
    }
    
    previousUidRef.current = uid;

    // Cleanup function
    return () => {
      if (subscriptionIdRef.current && previousUidRef.current) {
        unsubscribeFromPortfolioDocument(previousUidRef.current, subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
    };
  }, [uid, hasFirebaseError]); // Stable dependencies: only uid (string) and firebaseError flag

  // Update function that saves to Firestore
  const updateData = useCallback((newData) => {
    // Update local state optimistically
    setData(prevData => {
      const valueToStore = typeof newData === 'function' ? newData(prevData) : newData;
      
      // Save to Firestore if user is logged in (fire and forget, but log errors)
      if (uid && db && !hasFirebaseError) {
        // Use setDoc with merge to ensure data is persisted
        saveToFirestore(valueToStore, uid).then(() => {
          // onSnapshot will confirm the update, ensuring consistency
        }).catch(err => {
          logger.error(`[PortfolioData] ❌ Failed to save ${key} to Firestore:`, err);
          setError(err);
          // Note: onSnapshot will eventually sync the correct state from Firestore
        });
      }

      return valueToStore;
    });
  }, [uid, hasFirebaseError, key, saveToFirestore]);

  return [data, updateData, loading, error];
};
