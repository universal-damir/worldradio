import { useState, useRef, useEffect } from 'react';
import { RadioStation, PlayerState, FavoriteStation } from '../types/radio';
import { RadioAPI } from '../services/radioAPI';
import { RadioStaticGenerator } from '../utils/audioEffects';

export const useRadioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const staticGeneratorRef = useRef<RadioStaticGenerator | null>(null);
  const loadingTimeoutRef = useRef<number | null>(null);
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

  const playStation = async (station: RadioStation) => {
    // Clear any existing timeout
    clearLoadingTimeout();

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

    // Set 6-second timeout for loading
    loadingTimeoutRef.current = setTimeout(() => {
      console.log(`Station ${station.name} failed to load within 6 seconds, skipping...`);
      
      // Stop static
      if (staticGeneratorRef.current) {
        staticGeneratorRef.current.stopStatic();
      }
      
      // Set error message
      setPlayerState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Station took too long to load. Trying another one...',
      }));
      
      // Auto-skip to next station
      setTimeout(() => {
        shuffleStation();
      }, 1000);
    }, 6000);

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
        setPlayerState(prev => ({ ...prev, isLoading: false }));
        // Stop static when station is ready to play
        if (staticGeneratorRef.current) {
          staticGeneratorRef.current.stopStatic();
        }
      };

      audioRef.current.onplay = () => {
        clearLoadingTimeout();
        setPlayerState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
        // Ensure static is stopped when playing
        if (staticGeneratorRef.current) {
          staticGeneratorRef.current.stopStatic();
        }
      };

      audioRef.current.onpause = () => {
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
      };

      audioRef.current.onerror = () => {
        clearLoadingTimeout();
        // Stop static on error
        if (staticGeneratorRef.current) {
          staticGeneratorRef.current.stopStatic();
        }
        setPlayerState(prev => ({
          ...prev,
          isPlaying: false,
          isLoading: false,
          error: 'Failed to load station. Trying another one...',
        }));
        // Auto-skip on error
        setTimeout(() => shuffleStation(), 1500);
      };

      // Start playing
      await audioRef.current.play();
      
      // Increment click count
      RadioAPI.incrementClickCount(station.stationuuid);
      
    } catch (error) {
      clearLoadingTimeout();
      setPlayerState(prev => ({
        ...prev,
        isPlaying: false,
        isLoading: false,
        error: 'Failed to play station. Please try another one.',
      }));
    }
  };

  const shuffleStation = async () => {
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
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !playerState.currentStation) return;

    // Clear timeout when user manually controls playback
    clearLoadingTimeout();

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