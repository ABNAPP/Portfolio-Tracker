import { useState, useEffect, useRef, useCallback } from 'react';
import { onSnapshot, collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db, firebaseError, setFirestorePermissionError } from '../config/firebase';
import { logger } from '../utils/logger';

/**
 * Hook for syncing a Firestore collection with React state
 * 
 * @param {object} user - Current user object
 * @param {function} getCollectionRef - Function that returns collection reference (uid) => collection
 * @param {string} collectionName - Name of collection for logging
 * @param {array} defaultValue - Default value if collection is empty
 * @param {string} orderByField - Optional field to order by (default: 'date' descending)
 * @returns {[array, function, function, function, boolean, object]} - [data, addItem, updateItem, deleteItem, loading, error]
 */
export const useFirestoreCollection = (user, getCollectionRef, collectionName, defaultValue = [], orderByField = 'date') => {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);
  const previousUidRef = useRef(null);

  // Main effect: Set up Firestore listener when user is logged in
  useEffect(() => {
    const currentUid = user?.uid;
    const isLoggedIn = currentUid && db && !firebaseError;

    logger.log(`[${collectionName}] ===== useEffect triggered =====`);
    logger.log(`[${collectionName}] - currentUser.uid: ${currentUid || 'null (logged out)'}`);
    logger.log(`[${collectionName}] - isLoggedIn: ${isLoggedIn}`);

    // If UID changed, cleanup previous listener
    if (unsubscribeRef.current && previousUidRef.current !== null && previousUidRef.current !== currentUid) {
      logger.log(`[${collectionName}] 🔄 UID changed: ${previousUidRef.current} → ${currentUid}`);
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // If user is NOT logged in: set empty data
    if (!isLoggedIn) {
      logger.log(`[${collectionName}] 👤 User is logged out - setting empty data`);
      setData(defaultValue);
      setLoading(false);
      setError(null);
      
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      previousUidRef.current = currentUid;
      return;
    }

    // User IS logged in: Firestore is source-of-truth
    logger.log(`[${collectionName}] 🔐 User is logged in - setting up Firestore listener`);

    const collectionRef = getCollectionRef(currentUid);
    if (!collectionRef) {
      logger.error(`[${collectionName}] ❌ getCollectionRef returned null`);
      setData(defaultValue);
      setLoading(false);
      previousUidRef.current = currentUid;
      return;
    }

    setLoading(true);
    setError(null);

    // Create query with ordering
    const q = query(collectionRef, orderBy(orderByField, 'desc'));

    // Set up onSnapshot listener
    logger.log(`[${collectionName}] 📡 Setting up onSnapshot listener`);

    unsubscribeRef.current = onSnapshot(
      q,
      (snapshot) => {
        try {
          logger.log(`[${collectionName}] ===== READ (onSnapshot callback) =====`);
          logger.log(`[${collectionName}] - snapshot.size: ${snapshot.size}`);

          const items = [];
          snapshot.forEach((docSnapshot) => {
            items.push({
              id: docSnapshot.id,
              ...docSnapshot.data()
            });
          });

          logger.log(`[${collectionName}] ✅ Loaded ${items.length} items from Firestore`);
          setData(items);
          setError(null);
          setLoading(false);
        } catch (err) {
          logger.error(`[${collectionName}] ❌ Error in onSnapshot callback:`, err);
          setError(err);
          setData(defaultValue);
          setLoading(false);
        }
      },
      (err) => {
        logger.error(`[${collectionName}] ❌ onSnapshot error:`, err);
        logger.error(`[${collectionName}] - Error code: ${err.code}, message: ${err.message}`);
        
        // Check for permission errors
        if (err.code === 'permission-denied' || err.code === 'PERMISSION_DENIED' || 
            (err.message && err.message.includes('Missing or insufficient permissions'))) {
          logger.error(`[${collectionName}] - Permission denied! Check Firestore rules`);
          setFirestorePermissionError(err);
        }
        
        setError(err);
        setData(defaultValue);
        setLoading(false);
      }
    );

    previousUidRef.current = currentUid;

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        logger.log(`[${collectionName}] 🧹 Cleaning up Firestore listener, UID: ${previousUidRef.current}`);
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user?.uid, getCollectionRef, collectionName, defaultValue, orderByField]);

  // Add item to collection
  const addItem = useCallback(async (item) => {
    const currentUid = user?.uid;
    if (!db || !currentUid || firebaseError) {
      logger.warn(`[${collectionName}] Cannot add item - db: ${!!db}, uid: ${!!currentUid}, firebaseError: ${!!firebaseError}`);
      throw new Error('Cannot add item: Firebase not available');
    }

    const collectionRef = getCollectionRef(currentUid);
    if (!collectionRef) {
      throw new Error('Collection reference is null');
    }

    try {
      logger.log(`[${collectionName}] ===== ADD =====`);
      const docRef = await addDoc(collectionRef, item);
      logger.log(`[${collectionName}] ✅ Successfully added item with ID: ${docRef.id}`);
      return docRef.id;
    } catch (err) {
      logger.error(`[${collectionName}] ❌ Failed to add item:`, err);
      if (err.code === 'permission-denied' || err.code === 'PERMISSION_DENIED' || 
          (err.message && err.message.includes('Missing or insufficient permissions'))) {
        setFirestorePermissionError(err);
      }
      throw err;
    }
  }, [user?.uid, getCollectionRef, collectionName]);

  // Update item in collection
  const updateItem = useCallback(async (itemId, updates) => {
    const currentUid = user?.uid;
    if (!db || !currentUid || firebaseError) {
      logger.warn(`[${collectionName}] Cannot update item - db: ${!!db}, uid: ${!!currentUid}, firebaseError: ${!!firebaseError}`);
      throw new Error('Cannot update item: Firebase not available');
    }

    const collectionRef = getCollectionRef(currentUid);
    if (!collectionRef) {
      throw new Error('Collection reference is null');
    }

    try {
      logger.log(`[${collectionName}] ===== UPDATE =====`);
      logger.log(`[${collectionName}] - Item ID: ${itemId}`);
      const docRef = doc(collectionRef, itemId);
      await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
      logger.log(`[${collectionName}] ✅ Successfully updated item: ${itemId}`);
    } catch (err) {
      logger.error(`[${collectionName}] ❌ Failed to update item:`, err);
      if (err.code === 'permission-denied' || err.code === 'PERMISSION_DENIED' || 
          (err.message && err.message.includes('Missing or insufficient permissions'))) {
        setFirestorePermissionError(err);
      }
      throw err;
    }
  }, [user?.uid, getCollectionRef, collectionName]);

  // Delete item from collection
  const deleteItem = useCallback(async (itemId) => {
    const currentUid = user?.uid;
    if (!db || !currentUid || firebaseError) {
      logger.warn(`[${collectionName}] Cannot delete item - db: ${!!db}, uid: ${!!currentUid}, firebaseError: ${!!firebaseError}`);
      throw new Error('Cannot delete item: Firebase not available');
    }

    const collectionRef = getCollectionRef(currentUid);
    if (!collectionRef) {
      throw new Error('Collection reference is null');
    }

    try {
      logger.log(`[${collectionName}] ===== DELETE =====`);
      logger.log(`[${collectionName}] - Item ID: ${itemId}`);
      const docRef = doc(collectionRef, itemId);
      await deleteDoc(docRef);
      logger.log(`[${collectionName}] ✅ Successfully deleted item: ${itemId}`);
    } catch (err) {
      logger.error(`[${collectionName}] ❌ Failed to delete item:`, err);
      if (err.code === 'permission-denied' || err.code === 'PERMISSION_DENIED' || 
          (err.message && err.message.includes('Missing or insufficient permissions'))) {
        setFirestorePermissionError(err);
      }
      throw err;
    }
  }, [user?.uid, getCollectionRef, collectionName]);

  // Set entire collection (for batch updates)
  const setCollection = useCallback(async (items) => {
    // This is a helper that adds/updates all items
    // Note: Firestore doesn't have a native "set entire collection" operation
    // This would need to be implemented as batch writes if needed
    logger.warn(`[${collectionName}] setCollection is not implemented - use addItem/updateItem/deleteItem instead`);
  }, [collectionName]);

  return [data, addItem, updateItem, deleteItem, loading, error];
};

export default useFirestoreCollection;
