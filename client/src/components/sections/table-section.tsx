import { Utensils, Lightbulb, Mic, Play, Flame, Clock, Circle, BookOpen, Star, Wine, Sparkles, Heart, Gift, Calendar, Moon, MapPin, ShoppingBag, MessageSquare } from "lucide-react";
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
  
  // Get shared location state and trigger geolocation if needed
  const { coordinates, permissionDenied } = useGeolocation();
  
  // Show location prompt if permission denied and no coordinates
  const showLocationPrompt = permissionDenied && !coordinates;

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



  // Fetch daily recipe content
  const { data: recipeContent } = useQuery<Record<string, any>>({
    queryKey: [`/api/table/recipe`],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/table/recipe`);
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



  return (
    <div className="overflow-y-auto h-full pb-20">
      {/* Main Table Section - Connected to top bar - Only This Shabbos */}
      <div className="bg-gradient-soft rounded-b-3xl p-3 shadow-lg -mt-1">
        {/* Location Permission Prompt */}
        {showLocationPrompt && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-3">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="text-yellow-600" size={16} />
              <h4 className="font-serif text-sm font-bold text-yellow-800">Location Required</h4>
            </div>
            <p className="font-sans text-xs text-yellow-700 mb-3">
              Please enable location access for accurate Jewish prayer times, or click below to set your location manually.
            </p>
            <button 
              onClick={() => openModal('location')}
              className="bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-yellow-700 transition-colors"
            >
              Set Location Manually
            </button>
          </div>
        )}
        
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
        {/* Top Row: Daily Recipe and Date Converter */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Daily Recipe Button */}
          <button
            className={`rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 ${
              isModalComplete('recipe') ? 'bg-sage/20' : 'bg-white'
            }`}
            onClick={() => openModal('recipe')}
          >
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
              isModalComplete('recipe') ? 'bg-sage' : 'bg-gradient-feminine'
            }`}>
              <Utensils className="text-white" size={18} strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-xs text-black mb-1 font-bold">Daily Recipe</h3>
            <p className="font-sans text-xs text-black/60 leading-relaxed">
              {isModalComplete('recipe') ? 'Completed' : (recipeContent?.title || 'Weekly Recipe')}
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

        {/* Bottom Row: Table Inspiration and Parshas Pinchas */}
        <div className="grid grid-cols-2 gap-2">
          {/* Table Inspiration Button */}
          <button
            className={`rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 ${
              isModalComplete('inspiration') ? 'bg-sage/20' : 'bg-white'
            }`}
            onClick={() => openModal('inspiration')}
          >
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
              isModalComplete('inspiration') ? 'bg-sage' : 'bg-gradient-feminine'
            }`}>
              <Lightbulb className="text-white" size={18} strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-xs text-black mb-1 font-bold">Creative Jewish Living</h3>
            <p className="font-sans text-xs text-black/60 leading-relaxed">
              {isModalComplete('inspiration') ? 'Completed' : (inspirationContent?.title || 'Creative Living Ideas')}
            </p>
          </button>

          {/* Community Feedback Button */}
          <button
            className="rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 bg-white"
            onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSdh0b9n0l-bnJSMW2t4GdPuhzl1_8PK7mj8uaDixUkK1onT3A/viewform?usp=dialog', '_blank')}
          >
            <div className="p-2 rounded-full mx-auto mb-2 w-fit bg-gradient-feminine">
              <MessageSquare className="text-white" size={18} strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-xs text-black mb-1 font-bold">Community Feedback</h3>
            <p className="font-sans text-xs text-black/60 leading-relaxed">
              Help us help you
            </p>
          </button>
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
