import { Sun, Calendar, Plus, MapPin } from "lucide-react";
import { useJewishTimes, useLocationStore } from "@/hooks/use-jewish-times";
import { useModalStore } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function TimesSection() {
  const { data: times, isLoading } = useJewishTimes();
  const { openModal } = useModalStore();
  const { location, setLocation, setGeonameid } = useLocationStore();
  const [locationInput, setLocationInput] = useState("");

  // Try geolocation first, fallback to NYC
  useEffect(() => {
    if (!location) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              // Use reverse geocoding to find nearest major city
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&addressdetails=1`
              );
              const data = await response.json();
              
              // Map common cities to their geonameids
              const cityGeonameMap: { [key: string]: string } = {
                'New York': '5128581',
                'Los Angeles': '5368361',
                'Chicago': '4887398',
                'Brooklyn': '5110302',
                'Queens': '5133273',
                'Philadelphia': '4560349',
                'Miami': '4164138',
                'Boston': '4930956',
                'Washington': '4140963',
                'Atlanta': '4180439'
              };
              
              const city = data.address?.city || data.address?.town || data.display_name?.split(',')[0];
              const geonameid = cityGeonameMap[city] || '5128581'; // Default to NYC
              
              setGeonameid(geonameid);
              setLocation(city || 'Current Location');
            } catch (error) {
              // Fallback to NYC
              setGeonameid("5128581");
              setLocation("New York City, NY");
            }
          },
          () => {
            // Geolocation denied, use NYC
            setGeonameid("5128581");
            setLocation("New York City, NY");
          }
        );
      } else {
        // No geolocation support, use NYC
        setGeonameid("5128581");
        setLocation("New York City, NY");
      }
    }
  }, [location, setGeonameid, setLocation]);

  const handleLocationSearch = async () => {
    if (!locationInput.trim()) return;
    
    // Simple city mapping for common locations
    const cityGeonameMap: { [key: string]: string } = {
      'new york': '5128581',
      'nyc': '5128581',
      'brooklyn': '5110302',
      'queens': '5133273',
      'manhattan': '5125771',
      'bronx': '5110253',
      'los angeles': '5368361',
      'la': '5368361',
      'chicago': '4887398',
      'philadelphia': '4560349',
      'philly': '4560349',
      'miami': '4164138',
      'boston': '4930956',
      'washington dc': '4140963',
      'dc': '4140963',
      'atlanta': '4180439',
      'baltimore': '4347778',
      'detroit': '4990729',
      'houston': '4699066',
      'dallas': '4684888',
      'phoenix': '5308655',
      'san francisco': '5391959',
      'sf': '5391959',
      'seattle': '5809844',
      'denver': '5419384',
      'las vegas': '5506956',
      'orlando': '4167147',
      'tampa': '4174757'
    };
    
    const searchKey = locationInput.trim().toLowerCase();
    const geonameid = cityGeonameMap[searchKey];
    
    if (geonameid) {
      setGeonameid(geonameid);
      setLocation(locationInput.trim());
      setLocationInput("");
    } else {
      // If not found in our map, try NYC as fallback
      setGeonameid("5128581");
      setLocation("New York City, NY (default)");
      setLocationInput("");
    }
  };

  return (
    <div className="h-full p-4">
      <div className="space-y-3 h-full">
        {/* Location Input */}
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Enter your location..."
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              className="pl-10 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLocationSearch();
                }
              }}
            />
          </div>
          <Button 
            onClick={handleLocationSearch}
            size="sm"
            className="bg-peach hover:bg-peach/90 text-white"
          >
            Find
          </Button>
        </div>
        
        {/* Current Location Display */}
        {location && (
          <div className="text-xs text-gray-600 text-center py-2">
            📍 {location}
          </div>
        )}
        
        {/* Today's Times */}
        <div className="content-card rounded-2xl p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center">
            <Sun className="text-peach mr-2" size={20} />
            Today's Times
          </h3>
          {isLoading ? (
            <div className="space-y-2 text-xs">
              <div className="animate-pulse">Loading times...</div>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Sunrise</span>
                <span>{times?.sunrise || "Loading..."}</span>
              </div>
              <div className="flex justify-between">
                <span>Shkia (Sunset)</span>
                <span>{times?.sunset || "Loading..."}</span>
              </div>
              <div className="flex justify-between">
                <span>Mincha Gedolah</span>
                <span>{times?.minchaGedolah || "Loading..."}</span>
              </div>
              <div className="flex justify-between">
                <span>Mincha Ketana</span>
                <span>{times?.minchaKetana || "Loading..."}</span>
              </div>
              <div className="flex justify-between">
                <span>Candle Lighting</span>
                <span>{times?.candleLighting || "Loading..."}</span>
              </div>
              <div className="flex justify-between">
                <span>Havdalah</span>
                <span>{times?.havdalah || "Loading..."}</span>
              </div>
            </div>
          )}
        </div>

        {/* Hebrew Date Calculator */}
        <div 
          className="content-card rounded-2xl p-4 cursor-pointer"
          onClick={() => openModal('date-calculator')}
        >
          <div className="flex items-center space-x-3">
            <Calendar className="text-xl text-blush" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Hebrew Date Calculator</h3>
              <p className="text-xs text-gray-600">Add events to calendar</p>
            </div>
            <Plus className="text-gray-400" size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
