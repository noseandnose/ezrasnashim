import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Heart, BookOpen, HandHeart, Coins, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useModalStore, useDailyCompletionStore } from "@/lib/types";
import { useJewishTimes } from "@/hooks/use-jewish-times";
import { useHebrewDate } from "@/hooks/use-hebrew-date";
import DiscountBar from "@/components/discount-bar";
import type { Section } from "@/pages/home";

interface Sponsor {
  name: string;
  message?: string;
}

interface HomeSectionProps {
  onSectionChange?: (section: Section) => void;
}

export default function HomeSection({ onSectionChange }: HomeSectionProps) {
  const { openModal } = useModalStore();
  const { torahCompleted, tefillaCompleted, tzedakaCompleted } = useDailyCompletionStore();
  const jewishTimesQuery = useJewishTimes();
  const { data: hebrewDate } = useHebrewDate();

  // Get time-appropriate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Fetch today's sponsor
  const today = new Date().toISOString().split('T')[0];
  const { data: sponsor } = useQuery<Sponsor>({
    queryKey: ['daily-sponsor', today],
    queryFn: async () => {
      const response = await fetch(`/api/sponsors/daily/${today}`);
      if (!response.ok) return null;
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000 // 1 hour
  });

  const navigateToSection = (section: Section) => {
    if (onSectionChange) {
      onSectionChange(section);
    }
  };

  return (
    <div className="overflow-y-auto h-full pb-20">
      {/* Unified Top Section with Greeting, Times, and Today Info - Connected to top bar */}
      <div className="bg-gradient-soft rounded-b-3xl p-3 shadow-lg mx-1">
        {/* Greeting and Date in one row */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-serif text-xl text-black tracking-wide font-bold">{getGreeting()}</h1>
          <div className="text-right">
            <p className="font-serif text-xs text-black">{hebrewDate || "Loading..."}</p>
            <div className="flex items-center justify-end space-x-1">
              <MapPin className="text-black/60" size={10} />
              <p className="font-sans text-xs text-black/60">{jewishTimesQuery.data?.location || "Loading..."}</p>
            </div>
          </div>
        </div>
        
        {/* Times Section - Mincha and Shkia */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Mincha - Clickable with Arrow Icon */}
          <button 
            onClick={() => openModal('mincha')}
            className="bg-white/80 rounded-xl p-3 text-center border border-blush/20 hover:scale-105 transition-all duration-300 hover:bg-white/95"
          >
            <div className="flex items-center justify-center mb-1">
              <div className="bg-gradient-feminine p-1.5 rounded-full mr-1">
                <ArrowRight className="text-white" size={12} />
              </div>
            </div>
            <p className="font-sans text-xs text-black font-bold mb-0.5">Mincha</p>
            <p className="font-serif text-sm text-black font-bold">{jewishTimesQuery.data?.minchaGedolah || "Loading..."}</p>
          </button>

          {/* Shkia - Display Only */}
          <div className="bg-white/80 rounded-xl p-3 text-center border border-blush/20">
            <div className="flex items-center justify-center mb-1">
              <div className="bg-gradient-feminine p-1.5 rounded-full">
                <Clock className="text-white" size={12} />
              </div>
            </div>
            <p className="font-sans text-xs text-black font-bold mb-0.5">Shkia</p>
            <p className="font-serif text-sm text-black font-bold">{jewishTimesQuery.data?.shkia || "Loading..."}</p>
          </div>
        </div>

        {/* Sponsor Section */}
        <div className="bg-white/50 rounded-xl p-2 border border-blush/10">
          <div className="flex items-center space-x-1 mb-1">
            <Heart className="text-black/60" size={12} strokeWidth={1.5} />
            <h4 className="font-serif text-xs text-black tracking-wide font-bold">Today's Sponsor</h4>
          </div>
          <p className="font-sans text-xs text-black/80 leading-tight">
            {sponsor ? 
              (sponsor.message || `Today sponsored by ${sponsor.name}`) :
              "Sponsored by the Cohen family"
            }
          </p>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="space-y-1 p-1">
        <button
          onClick={() => navigateToSection('torah')}
          className="w-full bg-white rounded-2xl p-2.5 shadow-soft hover:scale-105 transition-all duration-300 border border-blush/10"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-feminine p-2 rounded-full">
              <BookOpen className="text-white" size={16} strokeWidth={1.5} />
            </div>
            <div className="text-left flex-grow">
              <h3 className="font-serif text-base text-black font-bold">Daily Torah</h3>
              <p className="font-sans text-xs text-black/70">Halacha, Mussar & Chizuk</p>
            </div>
            {torahCompleted && (
              <Heart className="gradient-heart" size={18} />
            )}
          </div>
        </button>

        <button
          onClick={() => navigateToSection('tefilla')}
          className="w-full bg-white rounded-2xl p-2.5 shadow-soft hover:scale-105 transition-all duration-300 border border-blush/10"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blush to-lavender p-2 rounded-full">
              <Heart className="text-white" size={16} strokeWidth={1.5} />
            </div>
            <div className="text-left flex-grow">
              <h3 className="font-serif text-base text-black font-bold">Daily Tefilla</h3>
              <p className="font-sans text-xs text-black/70">Tehillim, Mincha & Prayers</p>
            </div>
            {tefillaCompleted && (
              <Heart className="gradient-heart" size={18} />
            )}
          </div>
        </button>

        <button
          onClick={() => navigateToSection('tzedaka')}
          className="w-full bg-white rounded-2xl p-2.5 shadow-soft hover:scale-105 transition-all duration-300 border border-blush/10"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-muted-lavender to-rose-blush p-2 rounded-full">
              <Coins className="text-white" size={16} strokeWidth={1.5} />
            </div>
            <div className="text-left flex-grow">
              <h3 className="font-serif text-base text-black font-bold">Daily Tzedaka</h3>
              <p className="font-sans text-xs text-black/70">Support Torah & Charity</p>
            </div>
            {tzedakaCompleted && (
              <Heart className="gradient-heart" size={18} />
            )}
          </div>
        </button>

        {/* Discount Promotion Bar */}
        <div className="mt-1">
          <DiscountBar />
        </div>
      </div>
    </div>
  );
}