import { RadioStation } from '../types/radio';

const API_BASE_URL = 'https://nl1.api.radio-browser.info/json';

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
      const isSecure = isSecureUrl(primaryUrl);
      
      // Log filtered stations in production to help with debugging
      if (!isSecure && window.location.protocol === 'https:') {
        console.warn(`🔒 Filtered out station "${station.name}" due to mixed content (HTTP URL: ${primaryUrl})`);
      }
      
      return isSecure;
    });

  // Log filtering statistics
  if (stations.length > filteredStations.length) {
    console.info(`🔒 Mixed Content Filter: ${stations.length - filteredStations.length} stations filtered out, ${filteredStations.length} secure stations remaining`);
  }

  return filteredStations;
};

// List of countries for diverse station selection
const DIVERSE_COUNTRIES = [
  'United States', 'Germany', 'United Kingdom', 'France', 'Italy', 'Spain', 'Netherlands',
  'Canada', 'Australia', 'Japan', 'South Korea', 'Brazil', 'Mexico', 'Argentina',
  'India', 'China', 'Russia', 'Poland', 'Sweden', 'Norway', 'Denmark', 'Finland',
  'Portugal', 'Greece', 'Turkey', 'Egypt', 'South Africa', 'Nigeria', 'Kenya',
  'Thailand', 'Indonesia', 'Philippines', 'Malaysia', 'Singapore', 'Vietnam',
  'Chile', 'Peru', 'Colombia', 'Venezuela', 'Uruguay', 'Costa Rica', 'Jamaica',
  'Ireland', 'Belgium', 'Switzerland', 'Austria', 'Czech Republic', 'Hungary',
  'Romania', 'Bulgaria', 'Croatia', 'Slovenia', 'Slovakia', 'Estonia', 'Latvia',
  'Lithuania', 'Israel', 'Lebanon', 'Jordan', 'Morocco', 'Tunisia', 'Ghana',
  'Cameroon', 'Ethiopia', 'Madagascar', 'Mauritius', 'Botswana', 'Zimbabwe',
  'New Zealand', 'Fiji', 'Papua New Guinea', 'Iceland', 'Luxembourg', 'Malta',
  'Cyprus', 'Albania', 'Macedonia', 'Montenegro', 'Serbia', 'Bosnia and Herzegovina'
];

export class RadioAPI {
  private static async fetchWithErrorHandling(url: string): Promise<any> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API fetch error:', error);
      throw new Error('Failed to fetch radio stations. Please try again.');
    }
  }

  static async getRandomStations(count: number = 50): Promise<any[]> {
    const url = `${API_BASE_URL}/stations/search?limit=${count * 2}&order=random&hidebroken=true&has_extended_info=true`;
    const stations = await this.fetchWithErrorHandling(url);
    const secureStations = filterSecureStations(stations);
    return secureStations.slice(0, count);
  }

  static async getDiverseStations(count: number = 100): Promise<any[]> {
    try {
      const stationsPerCountry = Math.max(1, Math.floor(count / 30)); // Get from ~30 countries
      const selectedCountries = this.shuffleArray([...DIVERSE_COUNTRIES]).slice(0, 30);
      
      const promises = selectedCountries.map(async (country) => {
        try {
          const stations = await this.getStationsByCountry(country, stationsPerCountry * 2); // Fetch more to account for filtering
          return stations;
        } catch (error) {
          console.warn(`Failed to fetch stations from ${country}:`, error);
          return [];
        }
      });

      const results = await Promise.allSettled(promises);
      const allStations = results
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => (result as PromiseFulfilledResult<any[]>).value);

      // Apply secure filtering
      const secureStations = filterSecureStations(allStations);

      // If we don't have enough diverse stations, fill with random ones
      if (secureStations.length < count * 0.7) {
        const randomStations = await this.getRandomStations(count - secureStations.length);
        secureStations.push(...randomStations);
      }

      // Shuffle the final list and return requested count
      return this.shuffleArray(secureStations).slice(0, count);
    } catch (error) {
      console.error('Failed to get diverse stations, falling back to random:', error);
      return this.getRandomStations(count);
    }
  }

  static async getStationsByCountry(country: string, count: number = 20): Promise<any[]> {
    const url = `${API_BASE_URL}/stations/search?country=${encodeURIComponent(country)}&limit=${count * 2}&order=votes&reverse=true&hidebroken=true`;
    const stations = await this.fetchWithErrorHandling(url);
    const secureStations = filterSecureStations(stations);
    return secureStations.slice(0, count);
  }

  static async getStationsByGenre(genre: string, count: number = 20): Promise<any[]> {
    const url = `${API_BASE_URL}/stations/search?tag=${encodeURIComponent(genre)}&limit=${count * 2}&order=votes&reverse=true&hidebroken=true`;
    const stations = await this.fetchWithErrorHandling(url);
    const secureStations = filterSecureStations(stations);
    return secureStations.slice(0, count);
  }

  static async getTopStations(count: number = 50): Promise<any[]> {
    const url = `${API_BASE_URL}/stations/topvote/${count * 2}`;
    const stations = await this.fetchWithErrorHandling(url);
    const secureStations = filterSecureStations(stations);
    return secureStations.slice(0, count);
  }

  static async getStationsByLanguage(language: string, count: number = 20): Promise<any[]> {
    const url = `${API_BASE_URL}/stations/search?language=${encodeURIComponent(language)}&limit=${count * 2}&order=votes&reverse=true&hidebroken=true`;
    const stations = await this.fetchWithErrorHandling(url);
    const secureStations = filterSecureStations(stations);
    return secureStations.slice(0, count);
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
      this.getStationsByCountry(country, Math.ceil(count * 2 / countries.length)) // Fetch more to account for filtering
    );

    const results = await Promise.allSettled(promises);
    const allStations = results
      .filter((result) => result.status === 'fulfilled')
      .flatMap((result) => (result as PromiseFulfilledResult<any[]>).value);
    
    const secureStations = filterSecureStations(allStations);
    return secureStations.slice(0, count);
  }

  static async incrementClickCount(stationuuid: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/url/${stationuuid}`);
    } catch (error) {
      console.error('Failed to increment click count:', error);
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