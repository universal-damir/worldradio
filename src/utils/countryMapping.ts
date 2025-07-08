// Country name to coordinates mapping for globe positioning
export interface CountryCoordinates {
  lat: number;
  lng: number;
  name: string;
}

export const countryCoordinates: Record<string, CountryCoordinates> = {
  'United States': { lat: 39.8283, lng: -98.5795, name: 'United States' },
  'Germany': { lat: 51.1657, lng: 10.4515, name: 'Germany' },
  'United Kingdom': { lat: 55.3781, lng: -3.4360, name: 'United Kingdom' },
  'France': { lat: 46.2276, lng: 2.2137, name: 'France' },
  'Italy': { lat: 41.8719, lng: 12.5674, name: 'Italy' },
  'Spain': { lat: 40.4637, lng: -3.7492, name: 'Spain' },
  'Netherlands': { lat: 52.1326, lng: 5.2913, name: 'Netherlands' },
  'Canada': { lat: 56.1304, lng: -106.3468, name: 'Canada' },
  'Australia': { lat: -25.2744, lng: 133.7751, name: 'Australia' },
  'Japan': { lat: 36.2048, lng: 138.2529, name: 'Japan' },
  'South Korea': { lat: 35.9078, lng: 127.7669, name: 'South Korea' },
  'Brazil': { lat: -14.2350, lng: -51.9253, name: 'Brazil' },
  'Mexico': { lat: 23.6345, lng: -102.5528, name: 'Mexico' },
  'Argentina': { lat: -38.4161, lng: -63.6167, name: 'Argentina' },
  'India': { lat: 20.5937, lng: 78.9629, name: 'India' },
  'China': { lat: 35.8617, lng: 104.1954, name: 'China' },
  'Russia': { lat: 61.5240, lng: 105.3188, name: 'Russia' },
  'Poland': { lat: 51.9194, lng: 19.1451, name: 'Poland' },
  'Sweden': { lat: 60.1282, lng: 18.6435, name: 'Sweden' },
  'Norway': { lat: 60.4720, lng: 8.4689, name: 'Norway' },
  'Denmark': { lat: 56.2639, lng: 9.5018, name: 'Denmark' },
  'Finland': { lat: 61.9241, lng: 25.7482, name: 'Finland' },
  'Portugal': { lat: 39.3999, lng: -8.2245, name: 'Portugal' },
  'Greece': { lat: 39.0742, lng: 21.8243, name: 'Greece' },
  'Turkey': { lat: 38.9637, lng: 35.2433, name: 'Turkey' },
  'Egypt': { lat: 26.0975, lng: 31.2357, name: 'Egypt' },
  'South Africa': { lat: -30.5595, lng: 22.9375, name: 'South Africa' },
  'Nigeria': { lat: 9.0820, lng: 8.6753, name: 'Nigeria' },
  'Kenya': { lat: -0.0236, lng: 37.9062, name: 'Kenya' },
  'Thailand': { lat: 15.8700, lng: 100.9925, name: 'Thailand' },
  'Indonesia': { lat: -0.7893, lng: 113.9213, name: 'Indonesia' },
  'Philippines': { lat: 12.8797, lng: 121.7740, name: 'Philippines' },
  'Malaysia': { lat: 4.2105, lng: 101.9758, name: 'Malaysia' },
  'Singapore': { lat: 1.3521, lng: 103.8198, name: 'Singapore' },
  'Vietnam': { lat: 14.0583, lng: 108.2772, name: 'Vietnam' },
  'Chile': { lat: -35.6751, lng: -71.5430, name: 'Chile' },
  'Peru': { lat: -9.1900, lng: -75.0152, name: 'Peru' },
  'Colombia': { lat: 4.5709, lng: -74.2973, name: 'Colombia' },
  'Venezuela': { lat: 6.4238, lng: -66.5897, name: 'Venezuela' },
  'Uruguay': { lat: -32.5228, lng: -55.7658, name: 'Uruguay' },
  'Costa Rica': { lat: 9.7489, lng: -83.7534, name: 'Costa Rica' },
  'Jamaica': { lat: 18.1096, lng: -77.2975, name: 'Jamaica' },
  'Ireland': { lat: 53.4129, lng: -8.2439, name: 'Ireland' },
  'Belgium': { lat: 50.5039, lng: 4.4699, name: 'Belgium' },
  'Switzerland': { lat: 46.8182, lng: 8.2275, name: 'Switzerland' },
  'Austria': { lat: 47.5162, lng: 14.5501, name: 'Austria' },
  'Czech Republic': { lat: 49.8175, lng: 15.4730, name: 'Czech Republic' },
  'Hungary': { lat: 47.1625, lng: 19.5033, name: 'Hungary' },
  'Romania': { lat: 45.9432, lng: 24.9668, name: 'Romania' },
  'Bulgaria': { lat: 42.7339, lng: 25.4858, name: 'Bulgaria' },
  'Croatia': { lat: 45.1000, lng: 15.2000, name: 'Croatia' },
  'Slovenia': { lat: 46.1512, lng: 14.9955, name: 'Slovenia' },
  'Slovakia': { lat: 48.6690, lng: 19.6990, name: 'Slovakia' },
  'Estonia': { lat: 58.5953, lng: 25.0136, name: 'Estonia' },
  'Latvia': { lat: 56.8796, lng: 24.6032, name: 'Latvia' },
  'Lithuania': { lat: 55.1694, lng: 23.8813, name: 'Lithuania' },
  'Israel': { lat: 31.0461, lng: 34.8516, name: 'Israel' },
  'Lebanon': { lat: 33.8547, lng: 35.8623, name: 'Lebanon' },
  'Jordan': { lat: 30.5852, lng: 36.2384, name: 'Jordan' },
  'Morocco': { lat: 31.7917, lng: -7.0926, name: 'Morocco' },
  'Tunisia': { lat: 33.8869, lng: 9.5375, name: 'Tunisia' },
  'Ghana': { lat: 7.9465, lng: -1.0232, name: 'Ghana' },
  'Cameroon': { lat: 7.3697, lng: 12.3547, name: 'Cameroon' },
  'Ethiopia': { lat: 9.1450, lng: 40.4897, name: 'Ethiopia' },
  'Madagascar': { lat: -18.7669, lng: 46.8691, name: 'Madagascar' },
  'Mauritius': { lat: -20.3484, lng: 57.5522, name: 'Mauritius' },
  'Botswana': { lat: -22.3285, lng: 24.6849, name: 'Botswana' },
  'Zimbabwe': { lat: -19.0154, lng: 29.1549, name: 'Zimbabwe' },
  'New Zealand': { lat: -40.9006, lng: 174.8860, name: 'New Zealand' },
  'Fiji': { lat: -16.5780, lng: 179.4144, name: 'Fiji' },
  'Papua New Guinea': { lat: -6.3150, lng: 143.9555, name: 'Papua New Guinea' },
  'Iceland': { lat: 64.9631, lng: -19.0208, name: 'Iceland' },
  'Luxembourg': { lat: 49.8153, lng: 6.1296, name: 'Luxembourg' },
  'Malta': { lat: 35.9375, lng: 14.3754, name: 'Malta' },
  'Cyprus': { lat: 35.1264, lng: 33.4299, name: 'Cyprus' },
  'Albania': { lat: 41.1533, lng: 20.1683, name: 'Albania' },
  'Macedonia': { lat: 41.6086, lng: 21.7453, name: 'Macedonia' },
  'Montenegro': { lat: 42.7087, lng: 19.3744, name: 'Montenegro' },
  'Serbia': { lat: 44.0165, lng: 21.0059, name: 'Serbia' },
  'Bosnia and Herzegovina': { lat: 43.9159, lng: 17.6791, name: 'Bosnia and Herzegovina' },
};

// Helper function to get coordinates for a country
export const getCountryCoordinates = (countryName: string): CountryCoordinates | null => {
  // Direct match first
  if (countryCoordinates[countryName]) {
    return countryCoordinates[countryName];
  }
  
  // Try partial match (case insensitive)
  const normalizedInput = countryName.toLowerCase();
  for (const [key, value] of Object.entries(countryCoordinates)) {
    if (key.toLowerCase().includes(normalizedInput) || normalizedInput.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return null;
};

// Convert lat/lng to 3D coordinates on a sphere
export const latLngToVector3 = (lat: number, lng: number, radius: number = 1) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return { x, y, z };
}; 