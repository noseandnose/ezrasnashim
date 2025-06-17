import { Utensils, Lightbulb, Mic, Play, Flame, Clock, Circle, BookOpen, Star, Wine, Sparkles, Heart, Gift, Calendar } from "lucide-react";
import { useModalStore } from "@/lib/types";
import { useShabbosTime } from "@/hooks/use-shabbos-times";
import { useGeolocation } from "@/hooks/use-jewish-times";
import { Card } from "@/components/ui/card";

export default function TableSection() {
  const { openModal } = useModalStore();
  const { data: shabbosData, isLoading: shabbosLoading } = useShabbosTime();
  
  // Trigger geolocation when component mounts
  useGeolocation();

  const tableItems = [
    {
      id: 'recipe',
      icon: Utensils,
      title: 'Shabbas Recipe',
      subtitle: 'Honey Glazed Challah',
      color: 'text-peach'
    },
    {
      id: 'inspiration',
      icon: Lightbulb,
      title: 'Table Inspiration',
      subtitle: 'Chanukah Table Setting',
      color: 'text-blush'
    },
    {
      id: 'parsha',
      icon: Mic,
      title: 'Parsha Vort',
      subtitle: 'Parshas Vayeshev - 3 min',
      color: 'text-peach',
      extraIcon: Play
    }
  ];

  return (
    <div className="p-2 space-y-1">
      {/* Header */}
      <div className="text-center">
        <h2 className="font-serif text-lg text-warm-gray mb-1">Shabbos Table</h2>
        <p className="font-sans text-warm-gray/70 text-xs">Prepare for a meaningful Shabbos</p>
      </div>

      {/* Shabbos Times Section */}
      <div className="bg-white rounded-3xl p-4 shadow-lg border border-blush/10">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gradient-feminine p-3 rounded-full">
            <Flame className="text-white" size={20} />
          </div>
          <div>
            <h3 className="font-serif text-lg text-warm-gray">This Shabbos</h3>
            <p className="font-sans text-sm text-warm-gray/70">Candle lighting & Havdalah</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blush/8 to-ivory rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Flame className="text-blush" size={14} />
              <span className="font-sans text-xs text-warm-gray/70">Candle Lighting</span>
            </div>
            <p className="font-serif text-lg text-warm-gray">{shabbosData?.candleLighting || "Loading..."}</p>
          </div>
          <div className="bg-gradient-to-br from-lavender/8 to-ivory rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Star className="text-lavender" size={14} />
              <span className="font-sans text-xs text-warm-gray/70">Havdalah</span>
            </div>
            <p className="font-serif text-lg text-warm-gray">{shabbosData?.havdalah || "Loading..."}</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-ivory to-blush/5 rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <BookOpen className="text-sage" size={14} />
            <span className="font-sans text-xs text-warm-gray/70">This Week's Parsha</span>
          </div>
          <p className="font-serif text-sm text-warm-gray">{shabbosData?.parsha || "Loading..."}</p>
        </div>
      </div>

      {/* Shabbos Content Grid */}
      <div className="grid grid-cols-2 gap-4">
        {tableItems.map(({ id, icon: Icon, title, subtitle, color }) => (
          <button
            key={id}
            className="bg-white rounded-3xl p-6 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10"
            onClick={() => openModal(id)}
          >
            <div className="bg-gradient-feminine p-4 rounded-full mx-auto mb-4 w-fit">
              <Icon className="text-white" size={24} />
            </div>
            <h3 className="font-serif text-sm text-warm-gray mb-2">{title}</h3>
            <p className="font-sans text-xs text-warm-gray/60 leading-relaxed">{subtitle}</p>
          </button>
        ))}
      </div>
      {/* Bottom padding to prevent last element from being cut off by navigation */}
      <div className="h-24"></div>
    </div>
  );
}
