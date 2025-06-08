import { Scroll, Clock, HandHeart, ChevronRight } from "lucide-react";
import { useModalStore } from "@/lib/types";

export default function TefillaSection() {
  const { openModal } = useModalStore();

  return (
    <div className="h-full p-4">
      <div className="space-y-3 h-full">
        {/* Tehillim Cycle */}
        <div 
          className="content-card rounded-2xl p-4 cursor-pointer"
          onClick={() => openModal('tehillim')}
        >
          <div className="flex items-center space-x-3">
            <Scroll className="text-xl text-blush" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Tehillim Cycle</h3>
              <p className="text-xs text-gray-600">Today: Chapters 140-150</p>
            </div>
            <span className="text-xs bg-blush/20 text-blush px-2 py-1 rounded-full">Day 30</span>
          </div>
        </div>

        {/* Mincha */}
        <div 
          className="content-card rounded-2xl p-4 cursor-pointer"
          onClick={() => openModal('mincha')}
        >
          <div className="flex items-center space-x-3">
            <Clock className="text-xl text-peach" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Mincha</h3>
              <p className="text-xs text-gray-600">12:30 PM - 4:32 PM</p>
            </div>
          </div>
        </div>

        {/* Women's Prayers */}
        <div 
          className="content-card rounded-2xl p-4 cursor-pointer"
          onClick={() => openModal('womens-prayers')}
        >
          <div className="flex items-center space-x-3">
            <HandHeart className="text-xl text-blush" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Women's Prayers</h3>
              <p className="text-xs text-gray-600">Blessings, Tefillos & Personal</p>
            </div>
            <ChevronRight className="text-gray-400" size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
