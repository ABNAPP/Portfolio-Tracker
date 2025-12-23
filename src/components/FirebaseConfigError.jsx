import { AlertCircle, ExternalLink } from 'lucide-react';

export const FirebaseConfigError = ({ error }) => {
  const missingVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_MEASUREMENT_ID'
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <AlertCircle className="text-red-500 flex-shrink-0" size={32} />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Firebase Configuration Error
          </h1>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-gray-700 dark:text-gray-300">
            Firebase environment variables saknas eller är ogiltiga. Appen kan inte starta utan korrekt konfiguration.
          </p>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300 font-mono">
                {error.message || error}
              </p>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
              Så här fixar du det:
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>Gå till ditt projekt i Vercel Dashboard</li>
              <li>Klicka på <strong>Settings</strong> → <strong>Environment Variables</strong></li>
              <li>Lägg till följande variabler:</li>
            </ol>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">
              Environment Variables som behövs:
            </h4>
            <ul className="space-y-1">
              {missingVars.map((varName) => (
                <li key={varName} className="text-xs font-mono text-gray-700 dark:text-gray-300">
                  {varName}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Var hittar jag dessa värden?</strong>
              <br />
              Gå till{' '}
              <a
                href="https://console.firebase.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                Firebase Console
                <ExternalLink size={14} />
              </a>
              {' '}→ Välj ditt projekt → Project Settings → Your apps → Web app → Config
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Efter att du har lagt till environment variables i Vercel, behöver du göra en ny deployment.
              Vercel kommer automatiskt att bygga om projektet med de nya variablerna.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

