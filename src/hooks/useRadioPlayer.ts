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
  const currentStationIdRef = useRef<string>('');
  const lastShuffleTimeRef = useRef<number>(0);
  const debounceDelayMs = 1000; // Prevent rapid clicking
  const abortControllerRef = useRef<AbortController | null>(null);
  const isManualShuffleRef = useRef<boolean>(false);
  
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
      cleanupAudio();
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

  const cleanupAudio = () => {
    // Cancel any ongoing operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear timeouts
    clearLoadingTimeout();
    clearRetryDelay();
    
    // Clean up audio element
    if (audioRef.current) {
      // Remove ALL event listeners
      audioRef.current.onloadstart = null;
      audioRef.current.oncanplay = null;
      audioRef.current.onplay = null;
      audioRef.current.onpause = null;
      audioRef.current.onerror = null;
      audioRef.current.onended = null;
      audioRef.current.onloadeddata = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current.onstalled = null;
      audioRef.current.onsuspend = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onvolumechange = null;
      audioRef.current.onwaiting = null;
      
      // Stop and reset
      try {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.load();
      } catch (e) {
        console.warn('Error during audio cleanup:', e);
      }
      
      audioRef.current = null;
    }
  };

  const handleStationFailure = (message: string, stationId: string) => {
    // Only handle failures for the current station
    if (stationId !== currentStationIdRef.current) {
      return;
    }
    
    // Don't auto-retry if user is manually shuffling
    if (isManualShuffleRef.current) {
      setPlayerState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return;
    }
    
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
    const stationId = `${station.stationuuid}-${Date.now()}`;
    currentStationIdRef.current = stationId;
    
    // Create new AbortController for this station
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    // Complete cleanup of old audio
    cleanupAudio();

    // Stop static immediately and wait a bit
    if (staticGeneratorRef.current) {
      staticGeneratorRef.current.stopStatic();
      // Wait for static to fully stop
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Create fresh audio element
    audioRef.current = new Audio();
    
    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 200));

    setPlayerState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      currentStation: station,
    }));

    // Set 10-second timeout for loading
    loadingTimeoutRef.current = setTimeout(() => {
      handleStationFailure(`Station "${station.name}" took too long to load`, stationId);
    }, 10000);

    try {
      // Set new source and volume
      const stationUrl = station.url_resolved || station.url;
      audioRef.current.src = stationUrl;
      audioRef.current.volume = playerState.volume;

      // Setup fresh event listeners with station ID validation
      audioRef.current.onloadstart = () => {
        if (stationId !== currentStationIdRef.current) {
          return;
        }
        setPlayerState(prev => ({ ...prev, isLoading: true }));
      };

      audioRef.current.oncanplay = () => {
        if (stationId !== currentStationIdRef.current) {
          return;
        }
        clearLoadingTimeout();
        resetRetryCounter();
        isManualShuffleRef.current = false; // Reset on successful load
        setPlayerState(prev => ({ ...prev, isLoading: false }));
      };

      audioRef.current.onplay = () => {
        if (stationId !== currentStationIdRef.current) {
          return;
        }
        clearLoadingTimeout();
        resetRetryCounter();
        isManualShuffleRef.current = false; // Reset on successful play
        setPlayerState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
      };

      audioRef.current.onpause = () => {
        if (stationId !== currentStationIdRef.current) {
          return;
        }
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
      };

      audioRef.current.onerror = (e) => {
        if (stationId !== currentStationIdRef.current) {
          return;
        }
        clearLoadingTimeout();
        
        // Detect mixed content and other specific errors
        const error = audioRef.current?.error;
        const stationUrl = station.url_resolved || station.url;
        let errorMessage = `Failed to load station "${station.name}"`;
        
        if (error) {
          switch (error.code) {
            case MediaError.MEDIA_ERR_NETWORK:
              if (window.location.protocol === 'https:' && stationUrl.startsWith('http://')) {
                errorMessage = `"${station.name}" uses an insecure connection and cannot be played on this secure site`;
              } else {
                errorMessage = `Network error loading "${station.name}"`;
              }
              break;
            case MediaError.MEDIA_ERR_DECODE:
              errorMessage = `"${station.name}" stream format not supported`;
              break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage = `"${station.name}" stream source not supported`;
              break;
            default:
              errorMessage = `Error playing "${station.name}"`;
          }
        }
        
        handleStationFailure(errorMessage, stationId);
      };

      // Load and start playing
      audioRef.current.load(); // Explicitly load the new source
      await audioRef.current.play();
      
      RadioAPI.incrementClickCount(station.stationuuid);
      
    } catch (error) {
      if (stationId !== currentStationIdRef.current) {
        return;
      }
      clearLoadingTimeout();
      handleStationFailure(`Failed to play station "${station.name}"`, stationId);
    }
  };

  const shuffleStationWithRetry = async () => {
    // Only play static if we have a current station (not on first load)
    if (playerState.currentStation && staticGeneratorRef.current) {
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
      handleStationFailure('No stations available', currentStationIdRef.current || 'no-stations');
    }
  };

  const shuffleStation = async () => {
    // Debounce rapid clicking
    const now = Date.now();
    if (now - lastShuffleTimeRef.current < debounceDelayMs) {
      return;
    }
    lastShuffleTimeRef.current = now;
    
    // Mark as manual shuffle and reset retry counter
    isManualShuffleRef.current = true;
    resetRetryCounter();
    clearRetryDelay();
    
    await shuffleStationWithRetry();
    
    // Reset manual shuffle flag after attempt
    setTimeout(() => {
      isManualShuffleRef.current = false;
    }, 2000); // Give 2 seconds for the station to load before allowing auto-retries
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !playerState.currentStation) return;

    // Clear timeouts when user manually controls playback
    clearLoadingTimeout();
    clearRetryDelay();

    if (playerState.isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error('Failed to resume playback:', error);
      });
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