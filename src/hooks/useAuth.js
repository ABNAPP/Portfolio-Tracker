import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth, firebaseError } from '../config/firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/9366ed46-4065-4258-92ec-f1b8aa3b48a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.js:14',message:'useAuth useEffect entry',data:{authType:typeof auth,authIsNull:auth===null,authIsUndefined:auth===undefined,hasFirebaseError:!!firebaseError},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,D'})}).catch(()=>{});
    // #endregion
    // If Firebase failed to initialize, set loading to false immediately
    if (firebaseError || !auth) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/9366ed46-4065-4258-92ec-f1b8aa3b48a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.js:16',message:'auth check failed',data:{authType:typeof auth,authIsNull:auth===null,authIsUndefined:auth===undefined,hasFirebaseError:!!firebaseError,firebaseErrorMessage:firebaseError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,D'})}).catch(()=>{});
      // #endregion
      console.error('[Auth] Firebase not initialized:', firebaseError?.message);
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Set up auth state listener
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/9366ed46-4065-4258-92ec-f1b8aa3b48a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.js:25',message:'setting up onAuthStateChanged',data:{authType:typeof auth,authIsNull:auth===null,authIsUndefined:auth===undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'})}).catch(()=>{});
    // #endregion
    const unsubscribe = onAuthStateChanged(
      auth,
      (authUser) => {
        if (authUser) {
          console.log('[Auth] User logged in:', authUser.uid, authUser.email || 'no email');
        } else {
          console.log('[Auth] No user (showing login screen)');
        }
        
        if (isMounted) {
          setUser(authUser);
          setLoading(false);
        }
      },
      (error) => {
        console.error('Auth state change error:', error.code, error.message);
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
      console.log('Auth: user registered', userCredential.user.uid, userCredential.user.email);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Auth: registration error', error.code, error.message);
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
      console.log('Auth: user logged in', userCredential.user.uid, userCredential.user.email);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Auth: login error', error.code, error.message);
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
      console.log('Auth: user logged out');
      return { success: true };
    } catch (error) {
      console.error('Auth: logout error', error.code, error.message);
      return { success: false, error: error.message };
    }
  };

  return { user, loading, register, login, logout, firebaseError };
};

