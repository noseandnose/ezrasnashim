import { Utensils, Lightbulb, Mic, Play, Flame, Clock, Circle, BookOpen, Star, Wine, Sparkles, Heart, Gift, Calendar, Moon, MapPin, ShoppingBag } from "lucide-react";
import DiscountBar from "@/components/discount-bar";
import { useModalStore, useModalCompletionStore } from "@/lib/types";
import { useShabbosTime } from "@/hooks/use-shabbos-times";
import { useGeolocation } from "@/hooks/use-jewish-times";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

export default function TableSection() {
  const { openModal } = useModalStore();
  const { isModalComplete } = useModalCompletionStore();
  const { data: shabbosData, isLoading: shabbosLoading } = useShabbosTime();
  
  // Trigger geolocation when component mounts
  useGeolocation();

  // Fetch today's table inspiration content
  const today = new Date().toISOString().split('T')[0];
  const { data: inspirationContent } = useQuery<Record<string, any>>({
    queryKey: [`/api/table/inspiration/${today}`],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/table/inspiration/${today}`);
      if (!response.ok) return null;
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000 // 1 hour
  });

  // Get week key for weekly content
  const getWeekKey = () => {
    const date = new Date();
    const year = date.getFullYear();
    const week = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7);
    return `${year}-W${week}`;
  };

  // Fetch weekly recipe and parsha content
  const { data: recipeContent } = useQuery<Record<string, any>>({
    queryKey: [`/api/table/recipe/${getWeekKey()}`],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/table/recipe/${getWeekKey()}`);
      if (!response.ok) return null;
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000
  });

  // Fetch shop items
  const { data: shopItems } = useQuery<Record<string, any>[]>({
    queryKey: ['/api/shop'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/shop`);
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000
  });

  // Calculate days until Shabbat (Saturday = 6, Sunday = 0)
  const getDaysUntilShabbat = () => {
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    if (today === 6) return 7; // Saturday: 7 days until next Shabbat
    return 6 - today; // Days remaining until Saturday
  };

  const daysUntilShabbat = getDaysUntilShabbat();

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
    }
  ];

  return (
    <div className="overflow-y-auto h-full pb-20">
      {/* Main Table Section - Connected to top bar - Only This Shabbos */}
      <div className="bg-gradient-soft rounded-b-3xl p-3 shadow-lg -mt-1">
        {/* Shabbos Times Section */}
        <div className="bg-white/70 rounded-2xl p-3 border border-blush/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-feminine rounded-full">
                <span className="text-white font-serif font-bold text-lg">
                  {daysUntilShabbat}
                </span>
              </div>
              <h3 className="font-serif text-lg text-black font-bold">This Shabbos</h3>
            </div>
            <div className="text-right">
              <p className="font-serif text-sm text-black font-medium">{shabbosData?.parsha || "Loading..."}</p>
            </div>
          </div>
          
          {/* Location Display */}
          <div className="flex items-center justify-center space-x-1 mb-4">
            <MapPin className="text-black/60" size={12} />
            <p className="font-sans text-xs text-black/60">{shabbosData?.location || "Loading location..."}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/70 rounded-xl p-2 text-center border border-blush/10">
              <p className="font-sans text-xs text-black/70 font-bold">Candle Lighting</p>
              <div className="flex items-center justify-center space-x-1">
                <Flame className="text-blush" size={14} />
                <p className="font-serif text-base text-black font-medium">{shabbosData?.candleLighting || "Loading..."}</p>
              </div>
            </div>
            <div className="bg-white/70 rounded-xl p-2 text-center border border-blush/10">
              <p className="font-sans text-xs text-black/70 font-bold">Havdalah</p>
              <div className="flex items-center justify-center space-x-1">
                <Moon className="text-lavender" size={14} />
                <p className="font-serif text-base text-black font-medium">{shabbosData?.havdalah || "Loading..."}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shabbos Content Grid - Separate Section */}
      <div className="p-2 space-y-1">
        {/* Top Row: Shabbat and Date Converter */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Shabbat Countdown Button */}
          <button
            className="rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 bg-white"
            onClick={() => openModal('shabbat-countdown')}
          >
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-feminine rounded-full mx-auto mb-2">
              <span className="text-white font-serif font-bold text-sm">
                {daysUntilShabbat}
              </span>
            </div>
            <h3 className="font-serif text-xs text-black mb-1 font-bold">
              {shabbosData?.parsha || "Loading..."}
            </h3>
            <p className="font-sans text-xs text-black/60 leading-relaxed">
              {shabbosData?.candleLighting && shabbosData?.havdalah 
                ? `${shabbosData.candleLighting} - ${shabbosData.havdalah}`
                : "Loading times..."
              }
            </p>
          </button>

          {/* Jewish Date Converter Button */}
          <button
            className="rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 bg-white"
            onClick={() => openModal('date-calculator')}
          >
            <div className="p-2 rounded-full mx-auto mb-2 w-fit bg-gradient-feminine">
              <Calendar className="text-white" size={18} strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-xs text-black mb-1 font-bold">Jewish Date</h3>
            <p className="font-sans text-xs text-black/60 leading-relaxed">
              Convert & Download
            </p>
          </button>
        </div>

        {/* Bottom Row: Recipe and Inspiration */}
        <div className="grid grid-cols-2 gap-2">
          {tableItems.map(({ id, icon: Icon, title, subtitle, color }) => {
            const isCompleted = isModalComplete(id);
            return (
              <button
                key={id}
                className={`rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 ${
                  isCompleted ? 'bg-sage/20' : 'bg-white'
                }`}
                onClick={() => openModal(id)}
              >
                <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
                  isCompleted ? 'bg-sage' : 'bg-gradient-feminine'
                }`}>
                  <Icon className="text-white" size={18} strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-xs text-black mb-1 font-bold">{title}</h3>
                <p className="font-sans text-xs text-black/60 leading-relaxed">
                  {isCompleted ? 'Completed' : subtitle}
                </p>
              </button>
            );
          })}
        </div>
        
        {/* Discount Promotion Bar */}
        <div className="mt-4 px-2">
          <DiscountBar />
        </div>
        
        {/* Bottom padding to prevent last element from being cut off by navigation */}
        <div className="h-16"></div>
      </div>
    </div>
  );
}
