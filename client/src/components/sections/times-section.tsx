import { Sun, Calendar, Plus, MapPin, Clock, Moon, Sunrise, Sunset, Star, Timer } from "lucide-react";
import { useJewishTimes, useGeolocation, useLocationStore } from "./../hooks/use-jewish-times";
import { useModalStore } from "./../lib/types";

export default function TimesSection() {
  const { data: times, isLoading } = useJewishTimes();
  const { openModal } = useModalStore();
  const { coordinates, permissionDenied } = useGeolocation();

  const getLocationDisplay = () => {
    if (permissionDenied) {
      return "New York City, NY (default - enable location for accurate times)";
    }
    if (coordinates) {
      return times?.location || "Current Location";
    }
    return "Detecting location...";
  };

  return (
    <div className="h-full p-2">
      <div className="space-y-2 h-full">
        {/* Today's Times */}
        <div className="content-card rounded-2xl p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Sun className="text-peach mr-2" size={20} />
              <h3 className="font-semibold text-sm">Today's Times</h3>
            </div>
            <div className="text-xs text-gray-600">
              📍 {getLocationDisplay()}
            </div>
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
