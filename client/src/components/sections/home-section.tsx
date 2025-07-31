import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Heart, BookOpen, HandHeart, Coins, MapPin, ArrowRight, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useModalStore, useDailyCompletionStore } from "@/lib/types";
import { useJewishTimes } from "@/hooks/use-jewish-times";
import { useHebrewDate, useHebrewDateWithShkia } from "@/hooks/use-hebrew-date";
import HeartProgress from "@/components/heart-progress";
import DailyProgress from "@/components/daily-progress";
import type { Section } from "@/pages/home";
import { useMemo } from "react";

interface Sponsor {
  name: string;
  inHonorMemoryOf?: string;
  message?: string;
}

interface HomeSectionProps {
  onSectionChange?: (section: Section) => void;
}

export default function HomeSection({ onSectionChange }: HomeSectionProps) {
  const { openModal } = useModalStore();
  const { torahCompleted, tefillaCompleted, tzedakaCompleted } = useDailyCompletionStore();
  const jewishTimesQuery = useJewishTimes();
  const { data: hebrewDate } = useHebrewDateWithShkia(jewishTimesQuery.data?.shkia);

  // Get time-appropriate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Fetch today's sponsor
  const today = new Date().toISOString().split('T')[0];
  const { data: sponsor, isLoading: sponsorLoading, error: sponsorError } = useQuery<Sponsor>({
    queryKey: ['daily-sponsor', today, 'v2'], // Added version to bust cache
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sponsors/daily/${today}?t=${Date.now()}`); // Cache busting
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data;
    },
    staleTime: 0, // No caching - always fresh
    gcTime: 1000, // Short cache time
    refetchOnMount: true,
    refetchOnWindowFocus: true // Refresh when window gets focus
  });



  const navigateToSection = (section: Section) => {
    if (onSectionChange) {
      onSectionChange(section);
    }
  };

  // Time-based prayer logic (same as Tefilla section)
  const getCurrentPrayer = () => {
    if (!jewishTimesQuery.data || jewishTimesQuery.isLoading) {
      return { title: "Morning Brochas", subtitle: "Loading times...", modal: "morning-brochas", icon: Sparkles };
    }

    const now = new Date();
    const times = jewishTimesQuery.data;
    const neitz = new Date(`${now.toDateString()} ${times.sunrise}`);
    const minchaGedola = new Date(`${now.toDateString()} ${times.minchaGedolah}`);
    const shkia = new Date(`${now.toDateString()} ${times.shkia}`);

    if (now >= neitz && now < minchaGedola) {
      // Morning Brochas time
      return {
        title: "Morning Brochas",
        subtitle: `${times.sunrise} - ${times.minchaGedolah}`,
        modal: "morning-brochas" as const,
        icon: Sparkles
      };
    } else if (now >= minchaGedola && now < shkia) {
      // Mincha time
      return {
        title: "Mincha",
        subtitle: `${times.minchaGedolah} - ${times.shkia}`,
        modal: "mincha" as const,
        icon: Clock
      };
    } else {
      // Maariv time (from Shkia until next morning's Neitz)
      return {
        title: "Maariv",
        subtitle: `${times.shkia} - ${times.sunrise}`,
        modal: "maariv" as const,
        icon: Star
      };
    }
  };

  const currentPrayer = useMemo(() => getCurrentPrayer(), [jewishTimesQuery.data, jewishTimesQuery.isLoading]);

  // Get the proper icon component
  const PrayerIcon = currentPrayer.icon;

  return (
    <div className="overflow-y-auto h-full pb-20">
      {/* Unified Top Section with Greeting, Times, and Today Info - Connected to top bar */}
      <div className="bg-gradient-soft rounded-b-3xl p-3 shadow-lg -mt-1">
        {/* Greeting and Date in one row */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="platypi-bold text-xl text-black tracking-wide">{getGreeting()}</h1>
          <div className="text-right">
            <p className="platypi-regular text-xs text-black">{hebrewDate || "Loading..."}</p>
            <button 
              onClick={() => openModal('location')}
              className="flex items-center justify-end space-x-1 hover:bg-white/80 px-2 py-1 rounded-xl transition-colors border border-gray-200 bg-white/60"
            >
              <MapPin className="text-gray-600" size={10} />
              <p className="platypi-medium text-xs text-gray-700">{jewishTimesQuery.data?.location ? jewishTimesQuery.data.location.split(',')[0].trim() : "Set Location"}</p>
            </button>
          </div>
        </div>
        
        {/* Sponsor Section */}
        <button 
          onClick={() => {
            if (sponsor) {
              openModal('sponsor-details');
            }
          }}
          disabled={sponsorLoading || !sponsor}
          className={`w-full bg-white/50 rounded-xl p-2 border border-blush/10 mb-3 text-left transition-colors ${
            sponsor ? 'hover:bg-white/70 cursor-pointer' : 'cursor-default opacity-70'
          }`}
        >
          <div className="flex items-center space-x-1 mb-1">
            <Heart className="text-black/60" size={12} strokeWidth={1.5} />
            <h4 className="platypi-semibold text-xs text-black tracking-wide">
              Today is sponsored {sponsorLoading && '(Loading...)'}
            </h4>
          </div>
          <p className="platypi-regular text-xs text-black/80 leading-tight">
            {sponsorLoading ? 
              'Loading sponsor information...' :
              sponsor ? 
                (sponsor.inHonorMemoryOf ? sponsor.inHonorMemoryOf : `by ${sponsor.name}`) :
                "By Just One Chesed"
            }
          </p>

        </button>

        {/* Times Section - Time-based Prayer and Shkia */}
        <div className="grid grid-cols-2 gap-2">
          {/* Time-based Prayer - Dynamic based on current time */}
          <button 
            onClick={() => openModal(currentPrayer.modal)}
            className="bg-white/80 rounded-xl p-3 text-center border border-blush/20 hover:scale-105 transition-all duration-300 hover:bg-white/95"
          >
            <div className="flex items-center justify-center mb-1">
              <div className="bg-gradient-feminine p-1.5 rounded-full mr-1">
                <PrayerIcon className="text-white" size={12} />
              </div>
            </div>
            <p className="platypi-bold text-lg text-black mb-0.5">{currentPrayer.title}</p>
            <p className="platypi-bold text-base text-black leading-tight">{currentPrayer.subtitle}</p>
          </button>

          {/* Shkia - Display Only */}
          <div className="bg-white/80 rounded-xl p-3 text-center border border-blush/20">
            <div className="flex items-center justify-center mb-1">
              <div className="bg-gradient-feminine p-1.5 rounded-full">
                <Clock className="text-white" size={12} />
              </div>
            </div>
            <p className="platypi-bold text-lg text-black mb-0.5">Shkia</p>
            <p className="platypi-bold text-base text-black">{jewishTimesQuery.data?.shkia || "Loading..."}</p>
          </div>
        </div>
      </div>
      {/* Main Action Buttons */}
      <div className="p-2 space-y-2">
        {/* Daily Torah Bar */}
        <button
          onClick={() => navigateToSection('torah')}
          className="w-full rounded-2xl p-4 text-left hover:scale-[1.02] transition-all duration-300 shadow-lg border border-blush/10 bg-white flex items-center space-x-4"
        >
          <div className={`p-3 rounded-full ${torahCompleted ? 'bg-sage' : 'bg-gradient-feminine'}`}>
            <BookOpen className="text-white" size={20} strokeWidth={1.5} />
          </div>
          <div className="flex-grow">
            <h3 className="platypi-bold text-sm text-black">Daily Torah</h3>
            <p className="platypi-regular text-xs text-black/60">Halacha, Emuna & Chizuk</p>
          </div>
          <HeartProgress completed={torahCompleted} size={20} />
        </button>

        {/* Daily Tefilla Bar */}
        <button
          onClick={() => navigateToSection('tefilla')}
          className="w-full rounded-2xl p-4 text-left hover:scale-[1.02] transition-all duration-300 shadow-lg border border-blush/10 bg-white flex items-center space-x-4"
        >
          <div className={`p-3 rounded-full ${tefillaCompleted ? 'bg-sage' : 'bg-gradient-to-br from-blush to-lavender'}`}>
            <Heart className="text-white" size={20} strokeWidth={1.5} />
          </div>
          <div className="flex-grow">
            <h3 className="platypi-bold text-sm text-black">Daily Tefilla</h3>
            <p className="platypi-regular text-xs text-black/60">Tehillim & Prayers</p>
          </div>
          <HeartProgress completed={tefillaCompleted} size={20} />
        </button>

        {/* Daily Tzedaka Bar */}
        <button
          onClick={() => navigateToSection('tzedaka')}
          className="w-full rounded-2xl p-4 text-left hover:scale-[1.02] transition-all duration-300 shadow-lg border border-blush/10 bg-white flex items-center space-x-4"
        >
          <div className={`p-3 rounded-full ${tzedakaCompleted ? 'bg-sage' : 'bg-gradient-to-br from-muted-lavender to-rose-blush'}`}>
            <Coins className="text-white" size={20} strokeWidth={1.5} />
          </div>
          <div className="flex-grow">
            <h3 className="platypi-bold text-sm text-black">Daily Tzedaka</h3>
            <p className="platypi-regular text-xs text-black/60">Support Causes</p>
          </div>
          <HeartProgress completed={tzedakaCompleted} size={20} />
        </button>

        {/* Daily Progress Tracker - Big Button */}
        <div 
          id="daily-progress-garden"
          className="rounded-2xl p-6 shadow-lg border border-blush/10 bg-white flex flex-col items-center justify-center min-h-[200px] mt-4"
        >
          <h3 className="platypi-bold text-lg text-black mb-3">Daily Progress Garden</h3>
          <DailyProgress />
          <p className="platypi-regular text-xs text-black/60 text-center mt-3 leading-relaxed">
            Complete one item from each task to see your daily progress Bloom
          </p>
        </div>
      </div>
    </div>
  );
}