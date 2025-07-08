import { useState } from 'react';
import { Radio, Heart } from 'lucide-react';
import { RadioStation, FavoriteStation } from './types/radio';
import { useRadioPlayer } from './hooks/useRadioPlayer';
import { StationInfo } from './components/StationInfo';
import { ErrorMessage } from './components/ErrorMessage';
import { FavoritesList } from './components/FavoritesList';

function App() {
  const {
    playerState,
    favorites,
    playStation,
    shuffleStation,
    togglePlayPause,
    setVolume,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    clearError,
  } = useRadioPlayer();

  const [showFavorites, setShowFavorites] = useState(false);

  const handleToggleFavorite = () => {
    if (!playerState.currentStation) return;

    if (isFavorite(playerState.currentStation.stationuuid)) {
      removeFromFavorites(playerState.currentStation.stationuuid);
    } else {
      addToFavorites(playerState.currentStation);
    }
  };

  const handlePlayFavorite = async (station: FavoriteStation) => {
    // Convert FavoriteStation to RadioStation format
    const radioStation: RadioStation = {
      ...station,
      url: station.url,
      url_resolved: station.url,
      homepage: '',
      favicon: '',
      countrycode: '',
      state: '',
      language: '',
      languagecodes: '',
      votes: 0,
      lastchangetime: '',
      lastchangetime_iso8601: '',
      codec: '',
      bitrate: 0,
      hls: 0,
      lastcheckok: 1,
      lastchecktime: '',
      lastchecktime_iso8601: '',
      lastcheckoktime: '',
      lastcheckoktime_iso8601: '',
      lastlocalchecktime: '',
      clicktimestamp: '',
      clicktimestamp_iso8601: '',
      clickcount: 0,
      clicktrend: 0,
      ssl_error: 0,
      geo_lat: 0,
      geo_long: 0,
      has_extended_info: false,
    };
    
    // Play the station
    await playStation(radioStation);
    
    // Close the favorites modal
    setShowFavorites(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-x-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6 bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <Radio className="w-4 h-4 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-800">WorldRadio</h1>
            <p className="text-xs md:text-sm text-gray-600">Shuffle</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowFavorites(true)}
          className="relative p-2 md:p-3 bg-white rounded-full shadow-md md:shadow-lg hover:shadow-xl transition-shadow"
        >
          <Heart className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
          {favorites.length > 0 && (
            <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-5 h-5 md:w-6 md:h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {favorites.length}
            </span>
          )}
        </button>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-6 py-4 md:py-8 max-w-4xl">
        <div className="w-full">
          {/* Station Info with integrated controls */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg md:shadow-2xl p-4 md:p-8 mb-6 md:mb-8">
            <StationInfo
              station={playerState.currentStation}
              isFavorite={playerState.currentStation ? isFavorite(playerState.currentStation.stationuuid) : false}
              onToggleFavorite={handleToggleFavorite}
              isPlaying={playerState.isPlaying}
              isLoading={playerState.isLoading}
              volume={playerState.volume}
              onTogglePlayPause={playerState.currentStation ? togglePlayPause : shuffleStation}
              onVolumeChange={setVolume}
              onNext={shuffleStation}
              hasStation={!!playerState.currentStation}
            />
          </div>

          {/* Instructions - only show when no station */}
          {!playerState.currentStation && !playerState.isLoading && (
            <div className="text-center mt-8 md:mt-12 px-4">
              <p className="text-gray-500 text-base md:text-lg mb-4">
                🌍 Discover radio stations from around the world
              </p>
              <p className="text-gray-400 mb-2 text-sm md:text-base">
                Press play to explore diverse stations from 70+ countries
              </p>
              <p className="text-gray-400 text-xs md:text-sm">
                Experience music, news, and culture from every continent
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 md:py-8 text-gray-500 px-4">
        <p className="text-xs md:text-sm">
          Powered by{' '}
          <a 
            href="https://radio-browser.info" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Radio Browser
          </a>
        </p>
      </footer>

      {/* Error Message */}
      {playerState.error && (
        <ErrorMessage
          error={playerState.error}
          onClose={clearError}
          onRetry={shuffleStation}
        />
      )}

      {/* Favorites Modal */}
      <FavoritesList
        favorites={favorites}
        onPlayStation={handlePlayFavorite}
        onRemoveFavorite={removeFromFavorites}
        isVisible={showFavorites}
        onClose={() => setShowFavorites(false)}
      />
    </div>
  );
}

export default App;