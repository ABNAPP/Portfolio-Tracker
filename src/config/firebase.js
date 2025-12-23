import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc } from 'firebase/firestore';

// Firebase Configuration
// Uses environment variables with VITE_ prefix, with fallback to default config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBcklKADSt7jclx9TfekSuHJH_797FikME",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "portfolio-tracker-771a9.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "portfolio-tracker-771a9",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "portfolio-tracker-771a9.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "274252523468",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:274252523468:web:2d4d3743789f2e48b75f69",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-6M10S608P1"
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

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missing = required.filter(key => !firebaseConfig[key]);
  
  if (missing.length > 0) {
    return {
      valid: false,
      missing,
      message: `Firebase configuration is missing: ${missing.join(', ')}. Please add environment variables in Vercel.`
    };
  }
  
  return { valid: true };
};

// Initialize Firebase - ensure we only initialize once
let app = null;
let auth = null;
let db = null; // Will be initialized below
let analytics = null;
let firebaseError = null;

// Ensure db is always defined (even if null) to avoid "db is not defined" errors
if (typeof db === 'undefined') {
  db = null;
}

try {
  // Validate configuration first
  const validation = validateFirebaseConfig();
  
  if (!validation.valid) {
    firebaseError = new Error(validation.message);
    console.error('[Firebase] Configuration error:', validation.message);
    console.error('[Firebase] Missing variables:', validation.missing);
    console.error('[Firebase] Please add the following environment variables in Vercel:');
    validation.missing.forEach(key => {
      console.error(`  - VITE_FIREBASE_${key.toUpperCase().replace(/([A-Z])/g, '_$1')}`);
    });
  } else {
    const existingApps = getApps();
    
    if (existingApps.length > 0) {
      app = existingApps[0];
      console.log('[Firebase] Reusing existing Firebase app');
    } else {
      app = initializeApp(firebaseConfig);
      console.log('[Firebase] ✅ Initialized');
    }
    
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Initialize Analytics if supported and measurementId is available
    if (typeof window !== 'undefined') {
      isSupported().then((supported) => {
        if (supported && firebaseConfig.measurementId) {
          try {
            analytics = getAnalytics(app);
            console.log('[Firebase] Analytics initialized');
          } catch (error) {
            console.warn('[Firebase] Analytics initialization failed:', error);
          }
        } else {
          console.log('[Firebase] Analytics not supported or measurementId not provided');
        }
      });
    }
    
    const isDev = isLocalDev();
    console.log(`[Firebase] ${isDev ? 'LOCAL DEV' : 'PRODUCTION'} - Auth and Firestore initialized`);
  }
} catch (error) {
  firebaseError = error;
  console.error('[Firebase] Error initializing Firebase:', error);
  console.error('[Firebase] Error details:', error.message);
}

export { app, auth, db, analytics, firebaseError };

// Helper functions for Firestore paths
// These functions check if db is available before using it
export const getPortfolioDoc = (uid) => {
  if (!db || !uid) {
    console.warn('[Firebase] getPortfolioDoc: db not initialized or uid missing');
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
    console.warn('[Firebase] getTransactionsCollection: db not initialized or uid missing');
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
    console.warn('[Firebase] getChartDataCollection: db not initialized or uid missing');
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
    console.warn('[Firebase] getHistoryProfilesCollection: db not initialized or uid missing');
    return null;
  }
  try {
    return collection(db, 'users', uid, 'historyProfiles');
  } catch (err) {
    console.error('[Firebase] getHistoryProfilesCollection error:', err);
    return null;
  }
};

