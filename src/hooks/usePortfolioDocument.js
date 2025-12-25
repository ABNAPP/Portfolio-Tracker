import { useEffect, useRef } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db, firebaseError, setFirestorePermissionError } from '../config/firebase';
import { logger } from '../utils/logger';

/**
 * Shared listener manager for portfolio document
 * Ensures only ONE onSnapshot listener per user UID
 */
const listenerManager = new Map();
const logOnceCache = new Set();

/**
 * Log once per key (to reduce console spam)
 */
function logOnce(key, level, ...args) {
  const cacheKey = `${level}:${key}`;
  if (!logOnceCache.has(cacheKey)) {
    logOnceCache.add(cacheKey);
    if (level === 'log') {
      logger.log(...args);
    } else if (level === 'warn') {
      logger.warn(...args);
    }
  }
}

/**
 * Subscribe to portfolio document updates
 * Returns a subscription ID that can be used to unsubscribe
 */
export function subscribeToPortfolioDocument(uid, callback) {
  if (!uid || !db || firebaseError) {
    callback({}, false, null);
    return null;
  }

  // Check if listener already exists for this UID
  if (!listenerManager.has(uid)) {
    // Create new listener
    const docRef = doc(db, 'users', uid, 'portfolio', 'data');
    const logKey = `[PortfolioDoc]`;
    
    // Log listener start only once per UID
    logOnce(`listener-start-${uid}`, 'log', `${logKey} 📡 Starting shared listener for users/${uid}/portfolio/data`);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        try {
          const data = snapshot.exists() ? snapshot.data() : {};
          const subscribers = listenerManager.get(uid)?.subscribers || new Map();
          
          // Update all subscribers with the document data
          subscribers.forEach((subCallback) => {
            subCallback(data, false, null);
          });
        } catch (err) {
          logger.error(`${logKey} ❌ Error in snapshot callback:`, err);
          const subscribers = listenerManager.get(uid)?.subscribers || new Map();
          subscribers.forEach((subCallback) => {
            subCallback({}, false, err);
          });
        }
      },
      (err) => {
        logger.error(`${logKey} ❌ onSnapshot error:`, err);
        
        if (err.code === 'permission-denied' || err.code === 'PERMISSION_DENIED' || 
            (err.message && err.message.includes('Missing or insufficient permissions'))) {
          setFirestorePermissionError(err);
        }
        
        const subscribers = listenerManager.get(uid)?.subscribers || new Map();
        subscribers.forEach((subCallback) => {
          subCallback({}, false, err);
        });
      }
    );

    // Store listener info
    listenerManager.set(uid, {
      unsubscribe,
      subscribers: new Map(),
      started: true
    });
  }

  // Generate unique subscription ID
  const subscriptionId = `${uid}-${Date.now()}-${Math.random()}`;
  
  // Add subscriber
  const listenerInfo = listenerManager.get(uid);
  listenerInfo.subscribers.set(subscriptionId, callback);

  // Don't trigger callback here - let the first snapshot callback handle it
  // This prevents initial state updates that could cause loops

  return subscriptionId;
}

/**
 * Update callback for an existing subscription
 */
export function updateSubscriptionCallback(uid, subscriptionId, newCallback) {
  if (!uid || !listenerManager.has(uid)) {
    return;
  }

  const listenerInfo = listenerManager.get(uid);
  if (listenerInfo.subscribers.has(subscriptionId)) {
    listenerInfo.subscribers.set(subscriptionId, newCallback);
  }
}

/**
 * Unsubscribe from portfolio document updates
 */
export function unsubscribeFromPortfolioDocument(uid, subscriptionId) {
  if (!uid || !listenerManager.has(uid)) {
    return;
  }

  const listenerInfo = listenerManager.get(uid);
  listenerInfo.subscribers.delete(subscriptionId);

  // If no more subscribers, clean up the listener
  if (listenerInfo.subscribers.size === 0) {
    logOnce(`listener-cleanup-${uid}`, 'log', `[PortfolioDoc] 🧹 Cleaning up shared listener for ${uid.substring(0, 8)}... (no more subscribers)`);
    listenerInfo.unsubscribe();
    listenerManager.delete(uid);
  }
}

