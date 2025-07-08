import React from 'react';
import { Shuffle, Loader2 } from 'lucide-react';

interface ShuffleButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export const ShuffleButton: React.FC<ShuffleButtonProps> = ({ onClick, isLoading }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="group relative w-56 h-20 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed rounded-3xl flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
      
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-800 to-purple-800 opacity-40 animate-pulse" />
      )}
      
      <div className="flex flex-col items-center space-y-2 text-white">
        {isLoading ? (
          <Loader2 className="w-10 h-10 animate-spin" />
        ) : (
          <Shuffle className="w-10 h-10" />
        )}
        <div className="text-center">
          <div className="text-2xl font-bold">
            {isLoading ? 'Discovering...' : 'Start Exploring'}
          </div>
          <div className="text-sm opacity-90">
            {isLoading ? 'Finding stations worldwide' : 'Discover global radio'}
          </div>
        </div>
      </div>
    </button>
  );
};