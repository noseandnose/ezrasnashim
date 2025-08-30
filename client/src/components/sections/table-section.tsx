import { Utensils, Lightbulb, Mic, Play, Flame, Clock, Circle, BookOpen, Star, Wine, Sparkles, Heart, Gift, Calendar, Moon, MapPin, ShoppingBag, MessageSquare, Zap, Lightbulb as Candle } from "lucide-react";
import customCandleIcon from "@assets/Untitled design (6)_1755630328619.png";
import DiscountBar from "@/components/discount-bar";
import { useModalStore, useModalCompletionStore } from "@/lib/types";
import { useShabbosTime } from "@/hooks/use-shabbos-times";
import { useGeolocation, useJewishTimes } from "@/hooks/use-jewish-times";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

export default function TableSection() {
  const { openModal } = useModalStore();
  const { isModalComplete } = useModalCompletionStore();
  const { data: shabbosData, isLoading: shabbosLoading, error: shabbosError } = useShabbosTime();
  

  
  // Get shared location state and trigger geolocation if needed
  const { coordinates, permissionDenied } = useGeolocation();
  
  // Get Jewish times (includes shkia)
  const { data: jewishTimes } = useJewishTimes();
  
  // Show location prompt if permission denied and no coordinates
  const showLocationPrompt = permissionDenied && !coordinates;
  
  // Determine loading states - match the behavior from Times section
  const isShabbosDataLoading = shabbosLoading && !!coordinates;
  const showShabbosError = !coordinates && permissionDenied;
  


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

  // Calculate days until Shabbat using Jewish day (sunset to sunset)
  const getDaysUntilShabbat = (shkiaTime?: string) => {
    const now = new Date();
    let currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // If we have shkia time and it's after shkia, advance to next day
    if (shkiaTime) {
      try {
        const [time, period] = shkiaTime.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        
        // Convert to 24-hour format
        let shkiaHours = hours;
        if (period === 'PM' && hours !== 12) shkiaHours += 12;
        if (period === 'AM' && hours === 12) shkiaHours = 0;
        
        // Create shkia date for today
        const shkiaDate = new Date(now);
        shkiaDate.setHours(shkiaHours, minutes, 0, 0);
        
        // If current time is after shkia, advance to next Jewish day
        if (now > shkiaDate) {
          currentDay = (currentDay + 1) % 7;
        }
      } catch (error) {
        // If parsing fails, fall back to regular day calculation
      }
    }
    
    if (currentDay === 6) return 7; // Saturday: 7 days until next Shabbat
    return 6 - currentDay; // Days remaining until Saturday
  };

  const daysUntilShabbat = getDaysUntilShabbat(jewishTimes?.shkia);



  return (
    <div className="overflow-y-auto h-full pb-20">
      {/* Main Table Section - Connected to top bar - Only This Shabbos */}
      <div className="bg-gradient-soft rounded-b-3xl p-3 shadow-lg -mt-1">
        {/* Location Permission Prompt */}
        {showLocationPrompt && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-3">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="text-yellow-600" size={16} />
              <h4 className="platypi-bold text-sm platypi-bold text-yellow-800">Location Required</h4>
            </div>
            <p className="platypi-regular text-xs text-yellow-700 mb-3">
              Please enable location access for accurate davening times, or click below to set your location manually.
            </p>
            <button 
              onClick={() => openModal('location', 'table')}
              className="bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs platypi-medium hover:bg-yellow-700 transition-colors"
            >
              Set Location Manually
            </button>
          </div>
        )}
        
        {/* Shabbos Times Section */}
        <div className="bg-white/70 rounded-2xl p-3 border border-blush/10"
             style={{
               animation: 'gentle-glow-pink 3s ease-in-out infinite'
             }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-feminine rounded-full">
                <span className="text-white platypi-bold text-lg">
                  {daysUntilShabbat}
                </span>
              </div>
              <h3 className="platypi-bold text-lg text-black">
                Days Until Shabbas {showShabbosError ? "" : 
                 shabbosData?.parsha?.replace("Parashat ", "") || 
                 (isShabbosDataLoading ? "" : "")}
              </h3>
            </div>
          </div>
          
          {/* Location Display */}

          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/70 rounded-xl p-2 text-center border border-blush/10">
              <p className="platypi-regular text-xs text-black/70 platypi-bold">Candle Lighting</p>
              <div className="flex items-center justify-center space-x-1">
                <img 
                  src={customCandleIcon} 
                  alt="Candle lighting" 
                  className="w-5 h-4 object-contain"
                />
                <p className="platypi-bold text-base text-black platypi-medium">
                  {showShabbosError ? "--:--" : 
                   shabbosData?.candleLighting || 
                   (isShabbosDataLoading ? "Loading..." : "--:--")}
                </p>
              </div>
            </div>
            <div className="bg-white/70 rounded-xl p-2 text-center border border-blush/10">
              <p className="platypi-regular text-xs text-black/70 platypi-bold">Havdalah</p>
              <div className="flex items-center justify-center space-x-1">
                <Flame className="text-lavender" size={14} />
                <p className="platypi-bold text-base text-black platypi-medium">
                  {showShabbosError ? "--:--" : 
                   shabbosData?.havdalah || 
                   (isShabbosDataLoading ? "Loading..." : "--:--")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shabbos Content Grid - Separate Section */}
      <div className="py-2 space-y-1">
        {/* Top Row: Daily Recipe and Date Converter */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Daily Recipe Button */}
          <button
            className={`rounded-3xl p-3 text-center transition-all duration-300 shadow-lg border border-blush/10 relative ${
              !recipeContent 
                ? 'bg-gray-100 cursor-not-allowed' 
                : isModalComplete('recipe') ? 'bg-sage/20 hover:scale-105' : 'bg-white hover:scale-105'
            }`}
            onClick={() => {
              if (recipeContent) {
                // Open directly in fullscreen without setting activeModal
                const fullscreenEvent = new CustomEvent('openDirectFullscreen', {
                  detail: {
                    modalKey: 'recipe',
                    content: recipeContent
                  }
                });
                window.dispatchEvent(fullscreenEvent);
              }
            }}
            disabled={!recipeContent}
          >
            {/* Banner overlay for when no content */}
            {!recipeContent && (
              <div className="absolute inset-0 bg-black/20 rounded-3xl flex items-center justify-center z-10">
                <div className="bg-white/90 px-2 py-1 rounded-lg">
                  <p className="platypi-regular text-xs text-black platypi-medium">Recipe coming soon</p>
                </div>
              </div>
            )}
            
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
              !recipeContent 
                ? 'bg-gray-300' 
                : isModalComplete('recipe') ? 'bg-sage' : 'bg-gradient-feminine'
            }`}>
              <Utensils className={`${!recipeContent ? 'text-gray-500' : 'text-white'}`} size={18} strokeWidth={1.5} />
            </div>
            <h3 className={`platypi-bold text-xs mb-1 platypi-bold ${!recipeContent ? 'text-gray-500' : 'text-black'}`}>
              Daily Recipe
            </h3>
            <p className={`platypi-regular text-xs leading-relaxed ${!recipeContent ? 'text-gray-400' : 'text-black/60'}`}>
              {!recipeContent ? 'Coming Soon' : isModalComplete('recipe') ? 'Completed' : recipeContent.title}
            </p>
          </button>

          {/* Jewish Date Converter Button */}
          <button
            className="rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 bg-white"
            onClick={() => openModal('date-calculator-fullscreen', 'table')}
          >
            <div className="p-2 rounded-full mx-auto mb-2 w-fit bg-gradient-feminine">
              <Calendar className="text-white" size={18} strokeWidth={1.5} />
            </div>
            <h3 className="platypi-bold text-xs text-black mb-1 platypi-bold">Jewish Date</h3>
            <p className="platypi-regular text-xs text-black/60 leading-relaxed">
              Convert & Download
            </p>
          </button>
        </div>

        {/* Bottom Row: Table Inspiration and Parshas Pinchas */}
        <div className="grid grid-cols-2 gap-2">
          {/* Table Inspiration Button */}
          <button
            className={`rounded-3xl p-3 text-center transition-all duration-300 shadow-lg border border-blush/10 relative ${
              !inspirationContent 
                ? 'bg-gray-100 cursor-not-allowed' 
                : isModalComplete('inspiration') ? 'bg-sage/20 hover:scale-105' : 'bg-white hover:scale-105'
            }`}
            onClick={() => {
              if (inspirationContent) {
                // Open directly in fullscreen without setting activeModal
                const fullscreenEvent = new CustomEvent('openDirectFullscreen', {
                  detail: {
                    modalKey: 'inspiration',
                    content: inspirationContent
                  }
                });
                window.dispatchEvent(fullscreenEvent);
              }
            }}
            disabled={!inspirationContent}
          >
            {/* Banner overlay for when no content */}
            {!inspirationContent && (
              <div className="absolute inset-0 bg-black/20 rounded-3xl flex items-center justify-center z-10">
                <div className="bg-white/90 px-2 py-1 rounded-lg">
                  <p className="platypi-regular text-xs text-black platypi-medium">Content loaded on Thursdays</p>
                </div>
              </div>
            )}
            
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
              !inspirationContent 
                ? 'bg-gray-300' 
                : isModalComplete('inspiration') ? 'bg-sage' : 'bg-gradient-feminine'
            }`}>
              <Star className={`${!inspirationContent ? 'text-gray-500' : 'text-white'}`} size={18} strokeWidth={1.5} />
            </div>
            <h3 className={`platypi-bold text-xs mb-1 platypi-bold ${!inspirationContent ? 'text-gray-500' : 'text-black'}`}>
              Special Feature
            </h3>
            <p className={`platypi-regular text-xs leading-relaxed ${!inspirationContent ? 'text-gray-400' : 'text-black/60'}`}>
              {!inspirationContent ? 'Coming Soon' : isModalComplete('inspiration') ? 'Completed' : inspirationContent.title}
            </p>
          </button>

          {/* Community Feedback Button */}
          <button
            className="rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 bg-white"
            onClick={() => window.open('https://tally.so/r/3xqAEy', '_blank')}
          >
            <div className="p-2 rounded-full mx-auto mb-2 w-fit bg-gradient-feminine">
              <MessageSquare className="text-white" size={18} strokeWidth={1.5} />
            </div>
            <h3 className="platypi-bold text-xs text-black mb-1 platypi-bold">Community Feedback</h3>
            <p className="platypi-regular text-xs text-black/60 leading-relaxed">
              Help Us, Help You
            </p>
          </button>
        </div>
        
        {/* Discount Promotion Bar */}
        <div className="mt-4">
          <DiscountBar />
        </div>
        
        {/* Bottom padding to prevent last element from being cut off by navigation */}
        <div className="h-16"></div>
      </div>
    </div>
  );
}
