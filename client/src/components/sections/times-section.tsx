import { Sun, Calendar, Plus, MapPin, Clock, Moon, Sunrise, Sunset, Star, Timer } from "lucide-react";
import { useJewishTimes, useGeolocation, useLocationStore } from "@/hooks/use-jewish-times";
import { useModalStore } from "@/lib/types";

export default function TimesSection() {
  const { data: times, isLoading } = useJewishTimes();
  const { openModal } = useModalStore();
  const { coordinates, permissionDenied } = useGeolocation();

  const getLocationDisplay = () => {
    if (permissionDenied) {
      return "Tap to set location manually";
    }
    if (coordinates && times?.location) {
      return `${times.location} (tap to change)`;
    }
    if (coordinates) {
      return "Current Location (tap to change)";
    }
    return "Detecting location... (tap to set manually)";
  };

  return (
    <div className="h-full p-2">
      <div className="space-y-2 h-full">
        {/* Today's Times */}
        <div className="content-card rounded-2xl p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Sun className="text-peach mr-2" size={20} />
              <h3 className="platypi-semibold text-sm">Today's Times</h3>
            </div>
            <button 
              className="text-xs text-blush cursor-pointer hover:text-blush/80 hover:bg-blush/10 px-3 py-2 rounded-lg transition-colors border border-blush/30 platypi-medium"
              onClick={() => {
                console.log('Location clicked - opening modal');
                openModal('location', 'times');
              }}
            >
              🌍 {getLocationDisplay()}
            </button>
          </div>
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
                <span>{times?.shkia || "Loading..."}</span>
              </div>
              <div className="flex justify-between">
                <span>Tzait Hakochavim</span>
                <span>{times?.tzaitHakochavim || "Loading..."}</span>
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
          onClick={() => openModal('date-calculator', 'times')}
        >
          <div className="flex items-center space-x-3">
            <Calendar className="text-xl text-blush" size={24} />
            <div className="flex-1">
              <h3 className="platypi-semibold text-sm">Hebrew Date Calculator</h3>
              <p className="text-xs text-gray-600">Add events to calendar</p>
            </div>
            <Plus className="text-gray-400" size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
