import { Sun, Calendar, Plus } from "lucide-react";
import { useJewishTimes } from "@/hooks/use-jewish-times";
import { useModalStore } from "@/lib/types";

export default function TimesSection() {
  const { data: times, isLoading } = useJewishTimes();
  const { openModal } = useModalStore();

  return (
    <div className="h-full p-4">
      <div className="space-y-3 h-full">
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
                <span>{times?.sunrise || "7:12 AM"}</span>
              </div>
              <div className="flex justify-between">
                <span>Sunset</span>
                <span>{times?.sunset || "4:32 PM"}</span>
              </div>
              <div className="flex justify-between">
                <span>Candle Lighting</span>
                <span>{times?.candleLighting || "4:18 PM"}</span>
              </div>
              <div className="flex justify-between">
                <span>Havdalah</span>
                <span>{times?.havdalah || "5:33 PM"}</span>
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
