import React from 'react';
import { Heart, Play, Trash2, MapPin, X } from 'lucide-react';
import { FavoriteStation } from '../types/radio';

interface FavoritesListProps {
  favorites: FavoriteStation[];
  onPlayStation: (station: FavoriteStation) => void;
  onRemoveFavorite: (stationuuid: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

export const FavoritesList: React.FC<FavoritesListProps> = ({
  favorites,
  onPlayStation,
  onRemoveFavorite,
  isVisible,
  onClose,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
              <Heart className="w-6 h-6 text-red-500 fill-current" />
              <span>Favorites</span>
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          {favorites.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No favorite stations yet</p>
              <p className="text-sm mt-2">Heart stations while listening to save them here</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {favorites.map((station) => (
                <div
                  key={station.stationuuid}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{station.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{station.country}</span>
                    </div>
                    {station.tags && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {station.tags.split(',').slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onPlayStation(station)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRemoveFavorite(station.stationuuid)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};