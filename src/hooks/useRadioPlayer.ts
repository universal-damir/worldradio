import { useState, useRef, useEffect } from 'react';
import { RadioStation, PlayerState, FavoriteStation } from '../types/radio';
import { RadioAPI } from '../services/radioAPI';
import { RadioStaticGenerator } from '../utils/audioEffects';

export const useRadioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const staticGeneratorRef = useRef<RadioStaticGenerator | null>(null);
  const loadingTimeoutRef = useRef<number | null>(null);
  const retryCountRef = useRef<number>(0);
  const maxRetries = 5; // Maximum number of consecutive retries
  const retryDelayRef = useRef<number | null>(null);
  
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    isLoading: false,
    volume: 0.7,
    currentStation: null,
    error: null,
  });
  const [favorites, setFavorites] = useState<FavoriteStation[]>([]);
  const [stationPool, setStationPool] = useState<RadioStation[]>([]);

  useEffect(() => {
    // Initialize static generator
    staticGeneratorRef.current = new RadioStaticGenerator();
    staticGeneratorRef.current.init();

    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('worldradio-favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }

    // Load initial station pool
    loadStationPool();

    // Cleanup on unmount
    return () => {
      clearLoadingTimeout();
      clearRetryDelay();
      if (staticGeneratorRef.current) {
        staticGeneratorRef.current.cleanup();
      }
    };
  }, []);

  const loadStationPool = async () => {
    try {
      // Use diverse stations instead of just random ones
      const stations = await RadioAPI.getDiverseStations(150);
      setStationPool(stations);
    } catch (error) {
      console.error('Failed to load station pool:', error);
      // Fallback to random stations if diverse loading fails
      try {
        const fallbackStations = await RadioAPI.getRandomStations(100);
        setStationPool(fallbackStations);
      } catch (fallbackError) {
        console.error('Failed to load fallback stations:', fallbackError);
      }
    }
  };

  const clearLoadingTimeout = () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  };

  const clearRetryDelay = () => {
    if (retryDelayRef.current) {
      clearTimeout(retryDelayRef.current);
      retryDelayRef.current = null;
    }
  };

  const resetRetryCounter = () => {
    retryCountRef.current = 0;
  };

  const handleStationFailure = (message: string) => {
    console.log(`Station failure (attempt ${retryCountRef.current + 1}/${maxRetries}): ${message}`);
    
    // Stop static
    if (staticGeneratorRef.current) {
      staticGeneratorRef.current.stopStatic();
    }

    retryCountRef.current += 1;

    if (retryCountRef.current >= maxRetries) {
      // Too many retries, stop and show error
      setPlayerState(prev => ({
        ...prev,
        isLoading: false,
        isPlaying: false,
        error: 'Unable to find working stations. Please check your internet connection and try again.',
      }));
      retryCountRef.current = 0;
      return;
    }

    // Set temporary error message
    setPlayerState(prev => ({
      ...prev,
      isLoading: false,
      error: `${message} (${retryCountRef.current}/${maxRetries})`,
    }));

    // Retry with increasing delay
    const delay = retryCountRef.current * 2000; // 2s, 4s, 6s, 8s, 10s
    retryDelayRef.current = setTimeout(() => {
      shuffleStationWithRetry();
    }, delay);
  };

  const playStation = async (station: RadioStation) => {
    // Clear any existing timeouts
    clearLoadingTimeout();
    clearRetryDelay();

    // Play static sound while switching
    if (staticGeneratorRef.current) {
      staticGeneratorRef.current.playStatic(playerState.volume * 0.3);
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    setPlayerState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      currentStation: station,
    }));

    // Set 8-second timeout for loading (increased from 6)
    loadingTimeoutRef.current = setTimeout(() => {
      handleStationFailure(`Station "${station.name}" took too long to load`);
    }, 8000);

    try {
      // Stop current playback
      audioRef.current.pause();
      audioRef.current.currentTime = 0;

      // Set new source
      audioRef.current.src = station.url_resolved || station.url;
      audioRef.current.volume = playerState.volume;

      // Setup event listeners
      audioRef.current.onloadstart = () => {
        setPlayerState(prev => ({ ...prev, isLoading: true }));
      };

      audioRef.current.oncanplay = () => {
        clearLoadingTimeout();
        resetRetryCounter(); // Reset on successful load
        setPlayerState(prev => ({ ...prev, isLoading: false }));
        // Stop static when station is ready to play
        if (staticGeneratorRef.current) {
          staticGeneratorRef.current.stopStatic();
        }
      };

      audioRef.current.onplay = () => {
        clearLoadingTimeout();
        resetRetryCounter(); // Reset on successful play
        setPlayerState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
        // Ensure static is stopped when playing
        if (staticGeneratorRef.current) {
          staticGeneratorRef.current.stopStatic();
        }
      };

      audioRef.current.onpause = () => {
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
      };

      audioRef.current.onerror = (e) => {
        clearLoadingTimeout();
        console.error('Audio error:', e);
        handleStationFailure(`Failed to load station "${station.name}"`);
      };

      // Start playing
      await audioRef.current.play();
      
      // Increment click count
      RadioAPI.incrementClickCount(station.stationuuid);
      
    } catch (error) {
      clearLoadingTimeout();
      console.error('Play station error:', error);
      handleStationFailure(`Failed to play station "${station.name}"`);
    }
  };

  const shuffleStationWithRetry = async () => {
    // Play tuning static sound
    if (staticGeneratorRef.current && playerState.currentStation) {
      staticGeneratorRef.current.playStatic(playerState.volume * 0.4);
    }

    if (stationPool.length === 0) {
      await loadStationPool();
    }

    if (stationPool.length > 0) {
      const randomIndex = Math.floor(Math.random() * stationPool.length);
      const station = stationPool[randomIndex];
      await playStation(station);
    } else {
      handleStationFailure('No stations available');
    }
  };

  const shuffleStation = async () => {
    // Reset retry counter for manual shuffles
    resetRetryCounter();
    clearRetryDelay();
    await shuffleStationWithRetry();
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !playerState.currentStation) return;

    // Clear timeouts when user manually controls playback
    clearLoadingTimeout();
    clearRetryDelay();

    if (playerState.isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const setVolume = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    // Update static volume too
    if (staticGeneratorRef.current) {
      staticGeneratorRef.current.setVolume(volume * 0.3);
    }
    setPlayerState(prev => ({ ...prev, volume }));
  };

  const addToFavorites = (station: RadioStation) => {
    const favorite: FavoriteStation = {
      stationuuid: station.stationuuid,
      name: station.name,
      country: station.country,
      tags: station.tags,
      url: station.url,
      addedAt: new Date().toISOString(),
    };

    const updatedFavorites = [...favorites, favorite];
    setFavorites(updatedFavorites);
    localStorage.setItem('worldradio-favorites', JSON.stringify(updatedFavorites));
  };

  const removeFromFavorites = (stationuuid: string) => {
    const updatedFavorites = favorites.filter(fav => fav.stationuuid !== stationuuid);
    setFavorites(updatedFavorites);
    localStorage.setItem('worldradio-favorites', JSON.stringify(updatedFavorites));
  };

  const isFavorite = (stationuuid: string) => {
    return favorites.some(fav => fav.stationuuid === stationuuid);
  };

  const clearError = () => {
    // Also reset retry counter when manually clearing error
    resetRetryCounter();
    clearRetryDelay();
    setPlayerState(prev => ({ ...prev, error: null }));
  };

  return {
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
  };
};