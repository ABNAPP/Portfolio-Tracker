import { useState } from 'react';
import { getDoc, setDoc } from 'firebase/firestore';
import { db, getPortfolioDoc } from '../config/firebase';
import { logger } from '../utils/logger';
import { AlertCircle, Copy, CheckCircle, X } from 'lucide-react';

/**
 * DevTools component - Only visible in development mode
 * Provides debug information and migration helper for copying data between UIDs
 */
export const DevTools = ({ user }) => {
  const [oldUid, setOldUid] = useState('');
  const [migrating, setMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState({ type: null, message: '' });

  // Get projectId from environment
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'N/A';

  // Copy portfolio data from old UID to current UID
  const handleCopyPortfolio = async () => {
    if (!user || !user.uid) {
      setMigrationStatus({
        type: 'error',
        message: 'No user logged in. Please log in first.'
      });
      return;
    }

    if (!oldUid || oldUid.trim() === '') {
      setMigrationStatus({
        type: 'error',
        message: 'Please enter an Old UID'
      });
      return;
    }

    if (oldUid.trim() === user.uid) {
      setMigrationStatus({
        type: 'error',
        message: 'Old UID cannot be the same as current UID'
      });
      return;
    }

    if (!db) {
      setMigrationStatus({
        type: 'error',
        message: 'Firestore is not initialized. Check Firebase configuration.'
      });
      return;
    }

    setMigrating(true);
    setMigrationStatus({ type: null, message: '' });

    try {
      logger.log(`[DevTools] Starting migration from ${oldUid} to ${user.uid}`);

      // Get source document (old UID)
      const sourceDocRef = getPortfolioDoc(oldUid);
      if (!sourceDocRef) {
        throw new Error('Failed to get source document reference');
      }

      const sourceSnapshot = await getDoc(sourceDocRef);

      if (!sourceSnapshot.exists()) {
        setMigrationStatus({
          type: 'error',
          message: `Source document not found: users/${oldUid}/portfolio/data`
        });
        setMigrating(false);
        return;
      }

      const sourceData = sourceSnapshot.data();
      logger.log('[DevTools] Source data:', sourceData);

      // Get destination document reference (current UID)
      const destDocRef = getPortfolioDoc(user.uid);
      if (!destDocRef) {
        throw new Error('Failed to get destination document reference');
      }

      // Copy all fields from source to destination (merge)
      // This preserves any existing data in destination
      await setDoc(destDocRef, {
        ...sourceData,
        migratedAt: new Date().toISOString(),
        migratedFrom: oldUid
      }, { merge: true });

      logger.log(`[DevTools] Successfully copied portfolio data from ${oldUid} to ${user.uid}`);

      setMigrationStatus({
        type: 'success',
        message: `Successfully copied portfolio data from UID: ${oldUid}`
      });

      // Clear old UID after successful migration
      setOldUid('');
    } catch (error) {
      logger.error('[DevTools] Migration error:', error);

      let errorMessage = 'Migration failed: ';
      if (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
        errorMessage += 'Permission denied. Check Firestore Security Rules.';
      } else if (error.code === 'not-found') {
        errorMessage += `Source document not found for UID: ${oldUid}`;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error occurred';
      }

      setMigrationStatus({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setMigrating(false);
    }
  };

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  const hasUser = user && user.uid;
  const hasDb = !!db;

  return (
    <div className="fixed bottom-4 right-4 max-w-md w-full bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg shadow-xl p-4 z-50">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="text-yellow-600 dark:text-yellow-400" size={20} />
        <h3 className="font-bold text-yellow-900 dark:text-yellow-100">Dev Tools (DEV ONLY)</h3>
      </div>

      {/* Debug Panel */}
      <div className="mb-4 space-y-2 text-sm">
        <div className="bg-white dark:bg-slate-800 p-2 rounded border dark:border-slate-700">
          <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Debug Info:</div>
          <div className="space-y-1 text-xs font-mono">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Email: </span>
              <span className="text-gray-900 dark:text-gray-100">{user?.email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">UID: </span>
              <span className="text-gray-900 dark:text-gray-100 break-all">{user?.uid || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Project ID: </span>
              <span className="text-gray-900 dark:text-gray-100">{projectId}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Firestore: </span>
              <span className={hasDb ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {hasDb ? 'Connected' : 'Not Connected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Migration Helper */}
      <div className="space-y-2">
        <div className="font-semibold text-sm text-yellow-900 dark:text-yellow-100 mb-2">
          Migration Helper:
        </div>

        {!hasUser && (
          <div className="text-xs text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded">
            Please log in to use migration helper
          </div>
        )}

        {hasUser && (
          <>
            <div className="space-y-2">
              <input
                type="text"
                value={oldUid}
                onChange={(e) => {
                  setOldUid(e.target.value);
                  setMigrationStatus({ type: null, message: '' });
                }}
                placeholder="Paste Old UID here"
                disabled={!hasDb || migrating}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded 
                         bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />

              <button
                onClick={handleCopyPortfolio}
                disabled={!hasDb || migrating || !oldUid.trim()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium
                         bg-yellow-600 hover:bg-yellow-700 text-white rounded
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
              >
                {migrating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Copying...</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copy portfolio from old UID</span>
                  </>
                )}
              </button>
            </div>

            {migrationStatus.message && (
              <div
                className={`mt-2 p-2 rounded text-xs flex items-start gap-2 ${
                  migrationStatus.type === 'success'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                }`}
              >
                {migrationStatus.type === 'success' ? (
                  <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                ) : (
                  <X size={16} className="flex-shrink-0 mt-0.5" />
                )}
                <span className="flex-1 break-words">{migrationStatus.message}</span>
              </div>
            )}
          </>
        )}

        {!hasDb && (
          <div className="text-xs text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded">
            Firestore is not available. Check Firebase configuration.
          </div>
        )}
      </div>
    </div>
  );
};

