import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc } from 'firebase/firestore';

// Firebase Configuration - Read ONLY from environment variables
// No fallback values - production should fail gracefully if vars are missing
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Helper to check if we're in local development
export const isLocalDev = () => {
  if (import.meta.env.PROD === true) {
    return false;
  }
  if (import.meta.env.DEV !== undefined) {
    return import.meta.env.DEV;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost');
  }
  return false;
};

// Validate Firebase configuration - all required variables must be present
const validateFirebaseConfig = () => {
  const required = [
    { key: 'apiKey', envVar: 'VITE_FIREBASE_API_KEY' },
    { key: 'authDomain', envVar: 'VITE_FIREBASE_AUTH_DOMAIN' },
    { key: 'projectId', envVar: 'VITE_FIREBASE_PROJECT_ID' },
    { key: 'storageBucket', envVar: 'VITE_FIREBASE_STORAGE_BUCKET' },
    { key: 'messagingSenderId', envVar: 'VITE_FIREBASE_MESSAGING_SENDER_ID' },
    { key: 'appId', envVar: 'VITE_FIREBASE_APP_ID' }
  ];
  
  const missing = required.filter(({ key }) => !firebaseConfig[key]);
  
  if (missing.length > 0) {
    const missingVars = missing.map(({ envVar }) => envVar).join(', ');
    return {
      valid: false,
      missing: missing.map(({ key }) => key),
      missingVars,
      message: `Firebase configuration is incomplete. Missing environment variables: ${missingVars}. Please add these in Vercel Dashboard → Settings → Environment Variables.`
    };
  }
  
  return { valid: true };
};

// Global error state for Firestore permission errors
let firestorePermissionError = null;

// Function to check if error is a permission error
export const isPermissionError = (error) => {
  if (!error) return false;
  return error.code === 'permission-denied' || 
         error.code === 'PERMISSION_DENIED' ||
         (error.message && error.message.includes('Missing or insufficient permissions')) ||
         (error.message && error.message.includes('permission'));
};

// Function to set Firestore permission error
export const setFirestorePermissionError = (error) => {
  if (isPermissionError(error)) {
    firestorePermissionError = new Error('Firestore permissions saknas. Kontrollera Firestore Rules i Firebase Console.');
    console.error('[Firebase] ❌ Firestore Permission Error');
    console.error('[Firebase]', firestorePermissionError.message);
    console.error('[Firebase] Original error:', error.message);
  }
};

// Function to clear Firestore permission error
export const clearFirestorePermissionError = () => {
  firestorePermissionError = null;
};

// Initialize Firebase - ensure we only initialize once
let app = null;
let auth = null;
let db = null;
let analytics = null;
let firebaseError = null;

try {
  // Validate configuration first
  const validation = validateFirebaseConfig();
  
  if (!validation.valid) {
    firebaseError = new Error(validation.message);
    console.error('[Firebase] ❌ Configuration Error');
    console.error('[Firebase]', validation.message);
    console.error('[Firebase] Missing variables:', validation.missingVars);
    console.error('[Firebase] This must be fixed before the app can function.');
  } else {
    // All required config is present - initialize Firebase
    const existingApps = getApps();
    
    if (existingApps.length > 0) {
      app = existingApps[0];
      console.log('[Firebase] Reusing existing Firebase app');
    } else {
      app = initializeApp(firebaseConfig);
      console.log('[Firebase] ✅ Initialized successfully');
    }
    
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Initialize Analytics if supported and measurementId is available
    if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
      isSupported().then((supported) => {
        if (supported) {
          try {
            analytics = getAnalytics(app);
            console.log('[Firebase] Analytics initialized');
          } catch (error) {
            console.warn('[Firebase] Analytics initialization failed:', error);
          }
        } else {
          console.log('[Firebase] Analytics not supported');
        }
      });
    }
    
    const isDev = isLocalDev();
    console.log(`[Firebase] ${isDev ? 'LOCAL DEV' : 'PRODUCTION'} - Auth and Firestore ready`);
  }
} catch (error) {
  firebaseError = error;
  console.error('[Firebase] ❌ Initialization Error');
  console.error('[Firebase]', error.message);
  if (error.code) {
    console.error('[Firebase] Error code:', error.code);
  }
}

// Get the effective error - either configuration error or permission error
export const getFirebaseError = () => {
  return firestorePermissionError || firebaseError;
};

export { app, auth, db, analytics, firebaseError };

// Helper functions for Firestore paths
// These functions safely return null if db is not initialized
export const getPortfolioDoc = (uid) => {
  if (!db || !uid) {
    return null;
  }
  try {
    return doc(db, 'users', uid, 'portfolio', 'data');
  } catch (err) {
    console.error('[Firebase] getPortfolioDoc error:', err);
    return null;
  }
};

export const getTransactionsCollection = (uid) => {
  if (!db || !uid) {
    return null;
  }
  try {
    return collection(db, 'users', uid, 'transactions');
  } catch (err) {
    console.error('[Firebase] getTransactionsCollection error:', err);
    return null;
  }
};

export const getChartDataCollection = (uid) => {
  if (!db || !uid) {
    return null;
  }
  try {
    return collection(db, 'users', uid, 'chartData');
  } catch (err) {
    console.error('[Firebase] getChartDataCollection error:', err);
    return null;
  }
};

export const getHistoryProfilesCollection = (uid) => {
  if (!db || !uid) {
    return null;
  }
  try {
    return collection(db, 'users', uid, 'historyProfiles');
  } catch (err) {
    console.error('[Firebase] getHistoryProfilesCollection error:', err);
    return null;
  }
};
