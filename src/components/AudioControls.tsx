import React from 'react';
import { Play, Pause, Volume2, SkipForward, Loader2 } from 'lucide-react';

interface AudioControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  onTogglePlayPause: () => void;
  onVolumeChange: (volume: number) => void;
  onNext: () => void;
  hasStation: boolean;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  isPlaying,
  isLoading,
  volume,
  onTogglePlayPause,
  onVolumeChange,
  onNext,
  hasStation,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center space-x-6">
        <button
          onClick={onTogglePlayPause}
          disabled={isLoading}
          className="w-16 h-16 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 relative overflow-hidden"
        >
          {isLoading && (
            <div className="absolute inset-0 bg-blue-800 opacity-20 animate-pulse" />
          )}
          {isLoading ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-8 h-8 text-white" />
          ) : (
            <Play className="w-8 h-8 text-white ml-1" />
          )}
        </button>

        {hasStation && (
          <button
            onClick={onNext}
            disabled={isLoading}
            className="w-12 h-12 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 relative overflow-hidden"
            title="Next Station"
          >
            {isLoading && (
              <div className="absolute inset-0 bg-emerald-800 opacity-30 animate-pulse" />
            )}
            <SkipForward className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-center space-x-4">
        <Volume2 className="w-5 h-5 text-gray-600" />
        <div className="relative w-32">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-slider"
            style={{
              background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${volume * 100}%, #E5E7EB ${volume * 100}%, #E5E7EB 100%)`,
            }}
          />
        </div>
        <span className="text-sm text-gray-600 w-12">{Math.round(volume * 100)}%</span>
      </div>
    </div>
  );
};