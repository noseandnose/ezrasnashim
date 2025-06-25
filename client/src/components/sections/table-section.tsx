import { Utensils, Lightbulb, Mic, Play, Flame, Clock, Circle, BookOpen, Star, Wine, Sparkles, Heart, Gift, Calendar, Moon, MapPin } from "lucide-react";
import { useModalStore } from "../../lib/types";
import { useShabbosTime } from "../../hooks/use-shabbos-times";
import { useGeolocation } from "../../hooks/use-jewish-times";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../../ui/card";

export default function TableSection() {
  const { openModal } = useModalStore();
  const { data: shabbosData, isLoading: shabbosLoading } = useShabbosTime();
  
  // Trigger geolocation when component mounts
  useGeolocation();

  // Fetch today's table inspiration content
  const today = new Date().toISOString().split('T')[0];
  const { data: inspirationContent } = useQuery<any>({
    queryKey: [`/api/table/inspiration/${today}`],
    queryFn: async () => {
      const response = await fetch(`/api/table/inspiration/${today}`);
      if (!response.ok) return null;
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 60 * 60 * 1000 // 1 hour
  });

  // Get week key for weekly content
  const getWeekKey = () => {
    const date = new Date();
    const year = date.getFullYear();
    const week = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7);
    return `${year}-W${week}`;
  };

  // Fetch weekly recipe and parsha content
  const { data: recipeContent } = useQuery<any>({
    queryKey: [`/api/table/recipe/${getWeekKey()}`],
    queryFn: async () => {
      const response = await fetch(`/api/table/recipe/${getWeekKey()}`);
      if (!response.ok) return null;
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
    cacheTime: 60 * 60 * 1000
  });

  const { data: parshaContent } = useQuery<any>({
    queryKey: [`/api/table/vort/${getWeekKey()}`],
    queryFn: async () => {
      const response = await fetch(`/api/table/vort/${getWeekKey()}`);
      if (!response.ok) return null;
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
    cacheTime: 60 * 60 * 1000
  });

  const tableItems = [
    {
      id: 'recipe',
      icon: Utensils,
      title: 'Shabbas Recipe',
      subtitle: recipeContent?.title || 'Weekly Recipe',
      color: 'text-peach'
    },
    {
      id: 'inspiration',
      icon: Lightbulb,
      title: 'Table Inspiration',
      subtitle: inspirationContent?.title || 'Daily Inspiration',
      color: 'text-blush'
    },
    {
      id: 'parsha',
      icon: Mic,
      title: 'Parsha Vort',
      subtitle: parshaContent?.title || 'Weekly Vort',
      color: 'text-peach',
      extraIcon: Play
    }
  ];

  return (
    <div className="p-2 space-y-1">
      {/* Header */}
      <div className="text-center">
        <h2 className="font-serif text-lg text-warm-gray mb-1">Shabbos Table</h2>
      </div>

      {/* Shabbos Times Section */}
      <div className="bg-gradient-soft rounded-3xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-feminine p-3 rounded-full">
              <Flame className="text-white" size={20} />
            </div>
            <h3 className="font-serif text-lg text-warm-gray">This Shabbos</h3>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end space-x-1 bg-gradient-to-l from-blush/10 to-transparent rounded-lg px-2 py-1 border border-blush/20">
              <BookOpen className="text-warm-gray" size={12} />
              <p className="font-serif text-sm text-warm-gray font-medium">{shabbosData?.parsha || "Loading..."}</p>
            </div>
          </div>
        </div>
        
        {/* Location Display */}
        <div className="flex items-center justify-center space-x-1 mb-4">
          <MapPin className="text-warm-gray/60" size={12} />
          <p className="font-sans text-xs text-warm-gray/60">{shabbosData?.location || "Loading location..."}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/70 rounded-xl p-2 text-center border border-blush/10">
            <p className="font-sans text-xs text-warm-gray/70">Candle Lighting</p>
            <div className="flex items-center justify-center space-x-1">
              <Flame className="text-blush" size={14} />
              <p className="font-serif text-base text-warm-gray font-medium">{shabbosData?.candleLighting || "Loading..."}</p>
            </div>
          </div>
          <div className="bg-white/70 rounded-xl p-2 text-center border border-blush/10">
            <p className="font-sans text-xs text-warm-gray/70">Havdalah</p>
            <div className="flex items-center justify-center space-x-1">
              <Moon className="text-lavender" size={14} />
              <p className="font-serif text-base text-warm-gray font-medium">{shabbosData?.havdalah || "Loading..."}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Shabbos Content Grid */}
      <div className="grid grid-cols-2 gap-2">
        {tableItems.map(({ id, icon: Icon, title, subtitle, color }) => (
          <button
            key={id}
            className="bg-white rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10"
            onClick={() => openModal(id)}
          >
            <div className="bg-gradient-feminine p-2 rounded-full mx-auto mb-2 w-fit">
              <Icon className="text-white" size={18} strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-xs text-warm-gray mb-1">{title}</h3>
            <p className="font-sans text-xs text-warm-gray/60 leading-relaxed">{subtitle}</p>
          </button>
        ))}
      </div>
      {/* Bottom padding to prevent last element from being cut off by navigation */}
      <div className="h-16"></div>
    </div>
  );
}
