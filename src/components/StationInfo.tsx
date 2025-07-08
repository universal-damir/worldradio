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
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="flex justify-center mb-8">
            <div className="bg-gray-50 rounded-3xl p-8 shadow-xl">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Live Location</h3>
                <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto"></div>
              </div>
              <GlobeViewer size={400} className="opacity-50" />
            </div>
          </div>
        </div>

        {/* Audio Controls - Always visible */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
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

        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Music className="w-8 h-8 text-blue-500" />
            <p className="text-gray-600 text-xl">Press play to discover amazing radio stations</p>
          </div>
          <p className="text-gray-400">
            🌍 Explore music from around the world
          </p>
        </div>
      </div>
    );
  }



  return (
    <div className="space-y-8">
      {/* Globe - Now the main focus */}
      <div className="flex justify-center">
        <div className="bg-gray-50 rounded-3xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Live Location</h3>
            <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto"></div>
          </div>
          <GlobeViewer 
            selectedCountry={station.country} 
            size={400}
            className="mx-auto"
          />
        </div>
      </div>

      {/* Audio Controls - Directly under the map */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
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

      {/* Station Info - Below the controls */}
      <div className="text-center space-y-6">
        {/* Station details */}
        <div className="space-y-4">
          {/* Station name with favorite button */}
          <div className="flex items-center justify-center space-x-4">
            <h2 className="text-3xl font-bold text-gray-800 leading-tight">
              {station.name}
            </h2>
            <button
              onClick={onToggleFavorite}
              className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-200 border"
            >
              {isFavorite ? (
                <Heart className="w-5 h-5 text-red-500 fill-current" />
              ) : (
                <Heart className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>

          {/* Country info */}
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <MapPin className="w-5 h-5" />
            <span className="flex items-center space-x-2">
              <span className="text-2xl">{getCountryFlag(station.countrycode)}</span>
              <span className="text-lg font-medium">{station.country}</span>
              {station.state && <span className="text-gray-500">, {station.state}</span>}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};