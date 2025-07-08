import { RadioStation } from '../types/radio';

// Multiple API endpoints for redundancy
const API_ENDPOINTS = [
  'https://de1.api.radio-browser.info/json',
  'https://nl1.api.radio-browser.info/json',
  'https://at1.api.radio-browser.info/json'
];

let currentEndpointIndex = 0;

const getNextApiEndpoint = (): string => {
  const endpoint = API_ENDPOINTS[currentEndpointIndex];
  currentEndpointIndex = (currentEndpointIndex + 1) % API_ENDPOINTS.length;
  return endpoint;
};

// Helper function to check if a URL is HTTPS or can be safely loaded
const isSecureUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Allow HTTPS URLs
  if (url.startsWith('https://')) return true;
  
  // In production (HTTPS), block HTTP URLs to avoid mixed content
  if (window.location.protocol === 'https:' && url.startsWith('http://')) {
    return false;
  }
  
  // In development (HTTP), allow HTTP URLs
  return true;
};

// Helper function to attempt HTTPS upgrade for HTTP URLs
const upgradeToHttps = (url: string): string => {
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
};

// Filter stations to only include those with secure URLs
const filterSecureStations = (stations: RadioStation[]): RadioStation[] => {
  const filteredStations = stations
    .map(station => {
      // Try to upgrade HTTP to HTTPS
      if (station.url_resolved?.startsWith('http://')) {
        station.url_resolved = upgradeToHttps(station.url_resolved);
      }
      if (station.url?.startsWith('http://')) {
        station.url = upgradeToHttps(station.url);
      }
      return station;
    })
    .filter(station => {
      const primaryUrl = station.url_resolved || station.url;
      return isSecureUrl(primaryUrl);
    });

  return filteredStations;
};

// Reduced country list to avoid overwhelming the API
const DIVERSE_COUNTRIES = [
  'United States', 'Germany', 'United Kingdom', 'France', 'Italy', 'Spain', 'Netherlands',
  'Canada', 'Australia', 'Japan', 'Brazil', 'Mexico', 'Poland', 'Sweden', 'Norway',
  'Portugal', 'Greece', 'Turkey', 'South Africa', 'Thailand', 'Singapore',
  'Ireland', 'Belgium', 'Switzerland', 'Austria', 'Denmark', 'Finland'
];

export class RadioAPI {
  private static async fetchWithRetry(url: string, maxRetries: number = 3): Promise<any> {
    let lastError: Error = new Error('Unknown error');
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Add proper headers for CORS and API requirements
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'WorldRadio/1.0'
          },
          mode: 'cors',
          cache: 'default'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
        
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry for certain errors
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          // CORS or network error - try different endpoint on next call
          break;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw new Error(`Failed to fetch after ${maxRetries} attempts: ${lastError?.message}`);
  }

  private static async fetchWithErrorHandling(endpoint: string, path: string): Promise<any> {
    try {
      const url = `${endpoint}${path}`;
      return await this.fetchWithRetry(url, 2); // Reduced retries for faster fallback
    } catch (error) {
      console.error('API fetch error:', error);
      throw error;
    }
  }

  static async getRandomStations(count: number = 50): Promise<any[]> {
    const path = `/stations/search?limit=${Math.min(count * 2, 100)}&order=random&hidebroken=true&has_extended_info=true`;
    
    // Try different endpoints until one works
    for (const endpoint of API_ENDPOINTS) {
      try {
        const stations = await this.fetchWithErrorHandling(endpoint, path);
        const secureStations = filterSecureStations(stations);
        return secureStations.slice(0, count);
      } catch (error) {
        continue;
      }
    }
    
    throw new Error('All API endpoints failed. Please check your internet connection.');
  }

  static async getDiverseStations(count: number = 100): Promise<any[]> {
    try {
      // Reduced concurrent requests to avoid overwhelming the API
      const stationsPerCountry = Math.max(2, Math.floor(count / 15));
      const selectedCountries = this.shuffleArray([...DIVERSE_COUNTRIES]).slice(0, 15);
      
      // Process countries in smaller batches to avoid CORS issues
      const batchSize = 5;
      const allStations: any[] = [];
      
      for (let i = 0; i < selectedCountries.length; i += batchSize) {
        const batch = selectedCountries.slice(i, i + batchSize);
        
        const promises = batch.map(async (country) => {
          try {
            const stations = await this.getStationsByCountry(country, stationsPerCountry);
            return stations;
          } catch (error) {
            return [];
          }
        });

        const batchResults = await Promise.allSettled(promises);
        const batchStations = batchResults
          .filter((result) => result.status === 'fulfilled')
          .flatMap((result) => (result as PromiseFulfilledResult<any[]>).value);
        
        allStations.push(...batchStations);
        
        // Small delay between batches to be nice to the API
        if (i + batchSize < selectedCountries.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Apply secure filtering
      const secureStations = filterSecureStations(allStations);

      // If we don't have enough diverse stations, fill with random ones
      if (secureStations.length < count * 0.5) {
        try {
          const randomStations = await this.getRandomStations(count - secureStations.length);
          secureStations.push(...randomStations);
        } catch (error) {
          // Silently continue with what we have
        }
      }

      // Shuffle the final list and return requested count
      return this.shuffleArray(secureStations).slice(0, count);
    } catch (error) {
      console.error('Failed to get diverse stations, falling back to random:', error);
      return this.getRandomStations(count);
    }
  }

  static async getStationsByCountry(country: string, count: number = 20): Promise<any[]> {
    const path = `/stations/search?country=${encodeURIComponent(country)}&limit=${Math.min(count * 2, 50)}&order=votes&reverse=true&hidebroken=true`;
    
    // Try different endpoints until one works
    for (const endpoint of API_ENDPOINTS) {
      try {
        const stations = await this.fetchWithErrorHandling(endpoint, path);
        const secureStations = filterSecureStations(stations);
        return secureStations.slice(0, count);
      } catch (error) {
        continue;
      }
    }
    
    return [];
  }

  static async getStationsByGenre(genre: string, count: number = 20): Promise<any[]> {
    const path = `/stations/search?tag=${encodeURIComponent(genre)}&limit=${Math.min(count * 2, 50)}&order=votes&reverse=true&hidebroken=true`;
    
    // Try different endpoints until one works
    for (const endpoint of API_ENDPOINTS) {
      try {
        const stations = await this.fetchWithErrorHandling(endpoint, path);
        const secureStations = filterSecureStations(stations);
        return secureStations.slice(0, count);
      } catch (error) {
        continue;
      }
    }
    
    return [];
  }

  static async getTopStations(count: number = 50): Promise<any[]> {
    const path = `/stations/topvote/${Math.min(count * 2, 100)}`;
    
    // Try different endpoints until one works
    for (const endpoint of API_ENDPOINTS) {
      try {
        const stations = await this.fetchWithErrorHandling(endpoint, path);
        const secureStations = filterSecureStations(stations);
        return secureStations.slice(0, count);
      } catch (error) {
        continue;
      }
    }
    
    return [];
  }

  static async getStationsByLanguage(language: string, count: number = 20): Promise<any[]> {
    const path = `/stations/search?language=${encodeURIComponent(language)}&limit=${Math.min(count * 2, 50)}&order=votes&reverse=true&hidebroken=true`;
    
    // Try different endpoints until one works
    for (const endpoint of API_ENDPOINTS) {
      try {
        const stations = await this.fetchWithErrorHandling(endpoint, path);
        const secureStations = filterSecureStations(stations);
        return secureStations.slice(0, count);
      } catch (error) {
        continue;
      }
    }
    
    return [];
  }

  static async getStationsByContinent(continent: string, count: number = 30): Promise<any[]> {
    const continentCountries: { [key: string]: string[] } = {
      'Europe': ['Germany', 'France', 'Italy', 'Spain', 'United Kingdom', 'Netherlands', 'Poland', 'Sweden', 'Norway'],
      'Asia': ['Japan', 'South Korea', 'China', 'India', 'Thailand', 'Indonesia', 'Philippines', 'Malaysia', 'Singapore'],
      'Africa': ['South Africa', 'Nigeria', 'Kenya', 'Egypt', 'Morocco', 'Ghana', 'Tunisia', 'Ethiopia'],
      'Americas': ['United States', 'Canada', 'Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia', 'Peru'],
      'Oceania': ['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea']
    };

    const countries = continentCountries[continent] || [];
    const promises = countries.map(country => 
      this.getStationsByCountry(country, Math.ceil(count * 2 / countries.length))
    );

    const results = await Promise.allSettled(promises);
    const allStations = results
      .filter((result) => result.status === 'fulfilled')
      .flatMap((result) => (result as PromiseFulfilledResult<any[]>).value);
    
    const secureStations = filterSecureStations(allStations);
    return secureStations.slice(0, count);
  }

  static async incrementClickCount(stationuuid: string): Promise<void> {
    // Try different endpoints for click tracking
    for (const endpoint of API_ENDPOINTS) {
      try {
        await fetch(`${endpoint}/url/${stationuuid}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'WorldRadio/1.0'
          },
          mode: 'cors'
        });
        return; // Success - exit early
      } catch (error) {
        continue;
      }
    }
  }

  // Helper method to shuffle array
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}