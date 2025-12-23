import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase Configuration
// Uses environment variables with VITE_ prefix
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

// Initialize Firebase - ensure we only initialize once
let app, auth, db;

try {
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
  
  const isDev = isLocalDev();
  console.log(`[Firebase] ${isDev ? 'LOCAL DEV' : 'PRODUCTION'} - Auth and Firestore initialized`);
} catch (error) {
  console.error('[Firebase] Error initializing Firebase:', error);
  throw error;
}

export { app, auth, db };

