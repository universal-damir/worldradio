import React from 'react';
import { Music, Heart, MapPin } from 'lucide-react';
import { RadioStation } from '../types/radio';
import { GlobeViewer } from './GlobeViewer';
import { AudioControls } from './AudioControls';

interface StationInfoProps {
  station: RadioStation | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  // Audio controls props
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  onTogglePlayPause: () => void;
  onVolumeChange: (volume: number) => void;
  onNext: () => void;
  hasStation: boolean;
}

export const StationInfo: React.FC<StationInfoProps> = ({
  station,
  isFavorite,
  onToggleFavorite,
  isPlaying,
  isLoading,
  volume,
  onTogglePlayPause,
  onVolumeChange,
  onNext,
  hasStation,
}) => {
  const getCountryFlag = (countryCode: string) => {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    return String.fromCodePoint(
      ...[...countryCode.toUpperCase()].map(char => 0x1F1E6 + char.charCodeAt(0) - 65)
    );
  };

  if (!station) {
    return (
      <div className="flex flex-col space-y-6 md:space-y-8">
        {/* Globe Section - Non-interactive */}
        <div className="flex justify-center mb-4 md:mb-8">
          <div className="bg-gray-50 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-lg md:shadow-xl w-full max-w-sm md:max-w-none">
            <div className="text-center mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Live Location</h3>
              <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto"></div>
            </div>
            <div className="globe-wrapper pointer-events-none touch-none select-none" style={{ touchAction: 'none' }}>
              <GlobeViewer size={280} className="opacity-50 md:opacity-75" />
            </div>
          </div>
        </div>

        {/* Audio Controls - Separate container */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-lg p-4 md:p-6 mx-2 md:mx-0">
          <AudioControls
            isPlaying={isPlaying}
            isLoading={isLoading}
            volume={volume}
            onTogglePlayPause={onTogglePlayPause}
            onVolumeChange={onVolumeChange}
            onNext={onNext}
            hasStation={hasStation}
          />
        </div>

        {/* Instructions */}
        <div className="text-center px-4 md:px-0 py-4 md:py-0">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Music className="w-6 h-6 md:w-8 md:h-8 text-blue-500 flex-shrink-0" />
            <p className="text-gray-600 text-base md:text-xl">Press play to discover amazing radio stations</p>
          </div>
          <p className="text-gray-400 text-sm md:text-base">
            🌍 Explore music from around the world
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 md:space-y-8">
      {/* Globe Section - Non-interactive, positioned above controls */}
      <div className="flex justify-center">
        <div className="bg-gray-50 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-lg md:shadow-xl w-full max-w-sm md:max-w-none">
          <div className="text-center mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Live Location</h3>
            <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto"></div>
          </div>
          <div className="globe-wrapper pointer-events-none touch-none select-none" style={{ touchAction: 'none' }}>
            <GlobeViewer 
              selectedCountry={station.country} 
              size={280}
              className="mx-auto"
            />
          </div>
          {/* Country label directly under globe */}
          <div className="text-center mt-4">
            <p className="text-sm font-medium text-gray-700">
              📍 {station.country}
            </p>
          </div>
        </div>
      </div>

      {/* Audio Controls - Separate container with proper spacing */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-lg p-4 md:p-6 mx-2 md:mx-0">
        <AudioControls
          isPlaying={isPlaying}
          isLoading={isLoading}
          volume={volume}
          onTogglePlayPause={onTogglePlayPause}
          onVolumeChange={onVolumeChange}
          onNext={onNext}
          hasStation={hasStation}
        />
      </div>

      {/* Station Info - Below the controls with better mobile layout */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-lg p-4 md:p-6 mx-2 md:mx-0">
        <div className="text-center space-y-4 md:space-y-6">
          {/* Station name with favorite button */}
          <div className="flex items-start justify-center space-x-3 md:space-x-4">
            <h2 className="text-xl md:text-3xl font-bold text-gray-800 leading-tight text-center flex-1 min-w-0">
              {station.name}
            </h2>
            <button
              onClick={onToggleFavorite}
              className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 hover:bg-gray-100 rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-all duration-200 border flex-shrink-0 mt-1"
            >
              {isFavorite ? (
                <Heart className="w-5 h-5 md:w-6 md:h-6 text-red-500 fill-current" />
              ) : (
                <Heart className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
              )}
            </button>
          </div>

          {/* Country info */}
          <div className="flex items-center justify-center space-x-2 text-gray-600 px-4">
            <MapPin className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
            <span className="flex items-center space-x-2 min-w-0">
              <span className="text-xl md:text-2xl flex-shrink-0">{getCountryFlag(station.countrycode)}</span>
              <span className="text-base md:text-lg font-medium truncate">{station.country}</span>
              {station.state && <span className="text-gray-500 text-sm md:text-base truncate">, {station.state}</span>}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};