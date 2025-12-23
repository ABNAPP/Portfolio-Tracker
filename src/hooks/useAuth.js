import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth, firebaseError } from '../config/firebase';
import { logger } from '../utils/logger';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Firebase failed to initialize, set loading to false immediately
    if (firebaseError || !auth) {
      logger.error('[Auth] Firebase not initialized:', firebaseError?.message);
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(
      auth,
      (authUser) => {
        if (authUser) {
          logger.log('[Auth] User logged in:', authUser.uid, authUser.email || 'no email');
        } else {
          logger.log('[Auth] No user (showing login screen)');
        }
        
        if (isMounted) {
          setUser(authUser);
          setLoading(false);
        }
      },
      (error) => {
        logger.error('Auth state change error:', error.code, error.message);
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Register new user with email and password
  const register = async (email, password) => {
    if (!auth || firebaseError) {
      return { success: false, error: 'Firebase is not configured. Please check environment variables.', code: 'firebase/not-initialized' };
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      logger.log('Auth: user registered', userCredential.user.uid, userCredential.user.email);
      return { success: true, user: userCredential.user };
    } catch (error) {
      logger.error('Auth: registration error', error.code, error.message);
      return { success: false, error: error.message, code: error.code };
    }
  };

  // Login with email and password
  const login = async (email, password) => {
    if (!auth || firebaseError) {
      return { success: false, error: 'Firebase is not configured. Please check environment variables.', code: 'firebase/not-initialized' };
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      logger.log('Auth: user logged in', userCredential.user.uid, userCredential.user.email);
      return { success: true, user: userCredential.user };
    } catch (error) {
      logger.error('Auth: login error', error.code, error.message);
      return { success: false, error: error.message, code: error.code };
    }
  };

  // Logout current user
  const logout = async () => {
    if (!auth || firebaseError) {
      return { success: false, error: 'Firebase is not configured.' };
    }
    try {
      await signOut(auth);
      logger.log('Auth: user logged out');
      return { success: true };
    } catch (error) {
      logger.error('Auth: logout error', error.code, error.message);
      return { success: false, error: error.message };
    }
  };

  return { user, loading, register, login, logout, firebaseError };
};

