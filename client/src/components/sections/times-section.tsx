import { Sun, Calendar, Plus, MapPin } from "lucide-react";
import { useJewishTimes, useLocationStore } from "@/hooks/use-jewish-times";
import { useModalStore } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function TimesSection() {
  const { data: times, isLoading } = useJewishTimes();
  const { openModal } = useModalStore();
  const { location, setLocation, setCoordinates } = useLocationStore();
  const [locationInput, setLocationInput] = useState("");

  // Try to get user's geolocation on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Don't set fallback coordinates - let user enter location
        }
      );
    }
  }, [setCoordinates]);

  const handleLocationSearch = async () => {
    if (!locationInput.trim()) return;
    
    try {
      // Use a geocoding service to get coordinates from location name
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationInput.trim())}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setCoordinates({ lat: parseFloat(lat), lng: parseFloat(lon) });
        setLocation(locationInput.trim());
        setLocationInput("");
      }
    } catch (error) {
      console.error('Geocoding error:', error);
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
