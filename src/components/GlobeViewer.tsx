import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import { getCountryCoordinates } from '../utils/countryMapping';

interface GlobeViewerProps {
  selectedCountry?: string;
  className?: string;
  size?: number;
}

export const GlobeViewer: React.FC<GlobeViewerProps> = ({ 
  selectedCountry, 
  className,
  size = 300 
}) => {
  const globeRef = useRef<any>(null);
  const [countries, setCountries] = useState([]);
  const [isRotating, setIsRotating] = useState(false);
  const [locationPoints, setLocationPoints] = useState<any[]>([]);

  // Load world countries data
  useEffect(() => {
    // Fetch countries GeoJSON data
    fetch('//unpkg.com/world-atlas/countries-110m.json')
      .then(res => res.json())
      .then(data => {
        setCountries(data.features);
      })
      .catch(err => {
        console.error('Failed to load countries data:', err);
      });
  }, []);

  // Handle country selection and rotation
  useEffect(() => {
    if (!selectedCountry || !globeRef.current) {
      setLocationPoints([]);
      return;
    }

    const coordinates = getCountryCoordinates(selectedCountry);
    if (!coordinates) {
      setLocationPoints([]);
      return;
    }

    setIsRotating(true);
    
    // Create a point marker for the selected country
    setLocationPoints([{
      lat: coordinates.lat,
      lng: coordinates.lng,
      name: selectedCountry,
      color: 'red'
    }]);
    
    // Smoothly rotate to the selected country
    globeRef.current.pointOfView({
      lat: coordinates.lat,
      lng: coordinates.lng,
      altitude: 2
    }, 1500); // 1.5 second animation

    // Stop rotation indicator after animation
    setTimeout(() => setIsRotating(false), 1500);
  }, [selectedCountry]);

  // Country highlight function
  const getCountryColor = (country: any) => {
    if (!selectedCountry) return 'rgba(34, 139, 34, 0.7)'; // Forest green for better contrast
    
    // Normalize country names for comparison
    const countryName = country.properties.NAME || country.properties.NAME_EN || '';
    const normalizedCountryName = countryName.toLowerCase().trim();
    const normalizedSelectedCountry = selectedCountry.toLowerCase().trim();
    
    // Check for exact match or partial match
    const isSelected = normalizedCountryName === normalizedSelectedCountry ||
                      normalizedCountryName.includes(normalizedSelectedCountry) ||
                      normalizedSelectedCountry.includes(normalizedSelectedCountry);
    
    return isSelected ? 'rgba(255, 34, 34, 0.9)' : 'rgba(34, 139, 34, 0.7)';
  };

  // Country stroke color function
  const getCountryStroke = (country: any) => {
    if (!selectedCountry) return 'rgba(255, 255, 255, 0.9)'; // White borders for better definition
    
    const countryName = country.properties.NAME || country.properties.NAME_EN || '';
    const normalizedCountryName = countryName.toLowerCase().trim();
    const normalizedSelectedCountry = selectedCountry.toLowerCase().trim();
    
    const isSelected = normalizedCountryName === normalizedSelectedCountry ||
                      normalizedCountryName.includes(normalizedSelectedCountry) ||
                      normalizedSelectedCountry.includes(normalizedSelectedCountry);
    
    return isSelected ? 'rgba(255, 50, 50, 1)' : 'rgba(255, 255, 255, 0.9)';
  };

  return (
    <div className={`globe-container ${className || ''}`}>
      <div 
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          margin: '0 auto'
        }}
      >
        <Globe
          ref={globeRef}
          width={size}
          height={size}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          backgroundColor="rgba(0,0,0,0)"
          
          // Countries layer
          polygonsData={countries}
          polygonCapColor={getCountryColor}
          polygonSideColor={getCountryColor}
          polygonStrokeColor={getCountryStroke}
          polygonAltitude={0.01}
          
          // Points layer for location markers
          pointsData={locationPoints}
          pointColor={(point: any) => point.color}
          pointAltitude={0.02}
          pointRadius={0.8}
          pointResolution={12}
          
          // Animation settings
          enablePointerInteraction={false}
          animateIn={false}
        />
      </div>
      
      {selectedCountry && (
        <div className="text-center mt-4">
          <p className="text-sm font-medium text-gray-700">
            📍 {selectedCountry}
          </p>
          {isRotating && (
            <p className="text-xs text-blue-500 animate-pulse mt-1">
              Locating country...
            </p>
          )}
        </div>
      )}
    </div>
  );
}; 