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
  const isIntentionalSwitchRef = useRef<boolean>(false);
  const lastShuffleTimeRef = useRef<number>(0);
  const debounceDelayMs = 1000; // Prevent rapid clicking
  
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
      isIntentionalSwitchRef.current = false;
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
    // Don't treat intentional switches as failures
    if (isIntentionalSwitchRef.current) {
      console.log(`🔄 Ignoring error during intentional switch: ${message}`);
      return;
    }
    
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
    console.log(`🎵 Attempting to play station: ${station.name}`);
    
    // Mark as intentional switch
    isIntentionalSwitchRef.current = true;
    
    // Clear any existing timeouts
    clearLoadingTimeout();
    clearRetryDelay();

    // Stop static immediately and wait a bit
    if (staticGeneratorRef.current) {
      console.log('🔇 Stopping static sound...');
      staticGeneratorRef.current.stopStatic();
      // Wait for static to fully stop
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
      console.log('🔊 Created new audio element');
    }

    // Completely reset the audio element
    console.log('🔄 Resetting audio element...');
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.src = '';
    
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
      console.log(`⏰ Station ${station.name} timed out after 10 seconds`);
      // Reset intentional switch flag before handling timeout
      isIntentionalSwitchRef.current = false;
      handleStationFailure(`Station "${station.name}" took too long to load`);
    }, 10000);

    try {
      // Set new source and volume
      const stationUrl = station.url_resolved || station.url;
      console.log(`🔗 Setting station URL: ${stationUrl}`);
      audioRef.current.src = stationUrl;
      audioRef.current.volume = playerState.volume;

      // Clear any existing event listeners to prevent conflicts
      audioRef.current.onloadstart = null;
      audioRef.current.oncanplay = null;
      audioRef.current.onplay = null;
      audioRef.current.onpause = null;
      audioRef.current.onerror = null;

      // Setup fresh event listeners
      audioRef.current.onloadstart = () => {
        console.log(`📡 Loading started for: ${station.name}`);
        setPlayerState(prev => ({ ...prev, isLoading: true }));
      };

      audioRef.current.oncanplay = () => {
        console.log(`✅ Can play: ${station.name}`);
        clearLoadingTimeout();
        resetRetryCounter();
        isIntentionalSwitchRef.current = false; // Reset flag on successful load
        setPlayerState(prev => ({ ...prev, isLoading: false }));
      };

      audioRef.current.onplay = () => {
        console.log(`▶️ Playing: ${station.name}`);
        clearLoadingTimeout();
        resetRetryCounter();
        isIntentionalSwitchRef.current = false; // Reset flag on successful play
        setPlayerState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
      };

      audioRef.current.onpause = () => {
        console.log(`⏸️ Paused: ${station.name}`);
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
      };

      audioRef.current.onerror = (e) => {
        console.error(`❌ Audio error for ${station.name}:`, e);
        clearLoadingTimeout();
        // Reset intentional switch flag before handling error
        isIntentionalSwitchRef.current = false;
        handleStationFailure(`Failed to load station "${station.name}"`);
      };

      // Load and start playing
      console.log(`🚀 Starting playback for: ${station.name}`);
      audioRef.current.load(); // Explicitly load the new source
      await audioRef.current.play();
      
      console.log(`📊 Incrementing click count for: ${station.name}`);
      RadioAPI.incrementClickCount(station.stationuuid);
      
    } catch (error) {
      console.error(`💥 Play station error for ${station.name}:`, error);
      clearLoadingTimeout();
      // Reset intentional switch flag before handling error
      isIntentionalSwitchRef.current = false;
      handleStationFailure(`Failed to play station "${station.name}"`);
    }
  };

  const shuffleStationWithRetry = async () => {
    console.log(`🎲 Shuffling station (retry ${retryCountRef.current}/${maxRetries})`);
    
    // Only play static if we have a current station (not on first load)
    if (playerState.currentStation && staticGeneratorRef.current) {
      console.log('🔊 Playing tuning static...');
      staticGeneratorRef.current.playStatic(playerState.volume * 0.4);
    }

    if (stationPool.length === 0) {
      console.log('📡 Loading station pool...');
      await loadStationPool();
    }

    if (stationPool.length > 0) {
      const randomIndex = Math.floor(Math.random() * stationPool.length);
      const station = stationPool[randomIndex];
      console.log(`🎯 Selected station: ${station.name} from ${station.country}`);
      await playStation(station);
    } else {
      console.log('❌ No stations available in pool');
      handleStationFailure('No stations available');
    }
  };

  const shuffleStation = async () => {
    // Debounce rapid clicking
    const now = Date.now();
    if (now - lastShuffleTimeRef.current < debounceDelayMs) {
      console.log(`🚫 Shuffle debounced (${debounceDelayMs}ms cooldown)`);
      return;
    }
    lastShuffleTimeRef.current = now;
    
    // Reset retry counter for manual shuffles
    resetRetryCounter();
    clearRetryDelay();
    isIntentionalSwitchRef.current = false; // Reset flag for new shuffle
    await shuffleStationWithRetry();
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !playerState.currentStation) return;

    // Clear timeouts when user manually controls playback
    clearLoadingTimeout();
    clearRetryDelay();
    isIntentionalSwitchRef.current = false; // Reset flag

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
    isIntentionalSwitchRef.current = false; // Reset flag
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