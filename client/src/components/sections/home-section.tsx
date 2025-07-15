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
  const { data: sponsor } = useQuery<Sponsor>({
    queryKey: ['daily-sponsor', today],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sponsors/daily/${today}`);
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

  const currentPrayer = getCurrentPrayer();

  // Get the proper icon component
  const PrayerIcon = currentPrayer.icon;

  return (
    <div className="overflow-y-auto h-full pb-20">
      {/* Unified Top Section with Greeting, Times, and Today Info - Connected to top bar */}
      <div className="bg-gradient-soft rounded-b-3xl p-3 shadow-lg -mt-1">
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
        
        {/* Sponsor Section */}
        <div className="bg-white/50 rounded-xl p-2 border border-blush/10 mb-3">
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
            <p className="font-sans text-xs text-black font-bold mb-0.5">{currentPrayer.title}</p>
            <p className="font-serif text-xs text-black font-bold leading-tight">{currentPrayer.subtitle}</p>
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
      </div>
      {/* Main Action Buttons */}
      <div className="p-2 space-y-1">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigateToSection('torah')}
            className="rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 bg-white relative"
          >
            <div className="absolute top-2 left-2">
              <HeartProgress completed={torahCompleted} size={18} />
            </div>
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${torahCompleted ? 'bg-sage' : 'bg-gradient-feminine'}`}>
              <BookOpen className="text-white" size={18} strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-xs text-black mb-1 font-bold">Daily Torah</h3>
            <p className="font-sans text-xs text-black/60 leading-relaxed">Halacha, Emuna & Chizuk</p>
          </button>

          <button
            onClick={() => navigateToSection('tefilla')}
            className="rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 bg-white relative"
          >
            <div className="absolute top-2 left-2">
              <HeartProgress completed={tefillaCompleted} size={18} />
            </div>
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${tefillaCompleted ? 'bg-sage' : 'bg-gradient-to-br from-blush to-lavender'}`}>
              <Heart className="text-white" size={18} strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-xs text-black mb-1 font-bold">Daily Tefilla</h3>
            <p className="font-sans text-xs text-black/60 leading-relaxed">Tehillim & Prayers</p>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigateToSection('tzedaka')}
            className="rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 bg-white relative"
          >
            <div className="absolute top-2 left-2">
              <HeartProgress completed={tzedakaCompleted} size={18} />
            </div>
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${tzedakaCompleted ? 'bg-sage' : 'bg-gradient-to-br from-muted-lavender to-rose-blush'}`}>
              <Coins className="text-white" size={18} strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-xs text-black mb-1 font-bold">Daily Tzedaka</h3>
            <p className="font-sans text-xs text-black/60 leading-relaxed">Support Causes</p>
          </button>

          <div className="rounded-3xl p-3 text-center shadow-lg border border-blush/10 bg-white flex items-center justify-center h-full">
            <DailyProgress />
          </div>
        </div>
      </div>
    </div>
  );
}