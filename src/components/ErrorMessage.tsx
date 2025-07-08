import React from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  error: string;
  onClose: () => void;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onClose, onRetry }) => {
  const isConnectionError = error.includes('Unable to find working stations') || 
                           error.includes('internet connection');
  
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 animate-pulse">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium mb-1">
            {isConnectionError ? 'Connection Issue' : 'Station Error'}
          </p>
          <p className="text-xs text-red-100 break-words">
            {error}
          </p>
          {isConnectionError && (
            <p className="text-xs text-red-200 mt-2">
              💡 Try checking your internet connection or waiting a moment before retrying.
            </p>
          )}
        </div>
        <div className="flex space-x-1">
          {onRetry && (
            <button
              onClick={onRetry}
              className="p-1 hover:bg-red-600 rounded transition-colors"
              title="Retry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-600 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};