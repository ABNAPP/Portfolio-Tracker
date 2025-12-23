import React, { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Error Boundary component to catch and handle React errors gracefully
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    
    // You could also send to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const { fallback, t } = this.props;
      
      // Default translations if not provided
      const translations = t || {
        error_title: 'Något gick fel',
        error_message: 'Ett oväntat fel uppstod. Försök att ladda om sidan eller återställ appen.',
        error_technical: 'Teknisk information',
        error_try_again: 'Försök igen',
        error_reload: 'Ladda om sidan'
      };
      
      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback;
      }
      
      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl p-8 max-w-md w-full text-center border dark:border-slate-700">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {translations.error_title}
            </h1>
            
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {translations.error_message}
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 text-left bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-slate-600 dark:text-slate-300">
                  {translations.error_technical}
                </summary>
                <pre className="mt-2 text-xs text-rose-500 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {translations.error_try_again}
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors flex items-center gap-2"
              >
                <RefreshCw size={16} />
                {translations.error_reload}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
