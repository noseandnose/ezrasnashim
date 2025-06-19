import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Heart, BookOpen, HandHeart, Coins, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useModalStore } from "@/lib/types";
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
  });

  const navigateToSection = (section: Section) => {
    if (onSectionChange) {
      onSectionChange(section);
    }
  };

  return (
    <div className="p-1 space-y-1 overflow-y-auto h-full pb-20">
      {/* Dynamic Greeting */}
      <div className="text-center">
        <h1 className="font-serif text-2xl text-warm-gray mb-1 tracking-wide">{getGreeting()}</h1>
      </div>

      {/* Today's Information & Sponsor */}
      <div className="bg-gradient-soft rounded-3xl p-3 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-feminine p-2 rounded-full">
              <Clock className="text-white" size={18} strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-lg text-warm-gray tracking-wide">Today</h3>
          </div>
          <p className="font-sans text-xs text-warm-gray/70">{hebrewDate || "Loading..."}</p>
        </div>
        
        {/* Location Display */}
        <div className="flex items-center justify-center space-x-1 mb-3">
          <MapPin className="text-warm-gray/60" size={12} />
          <p className="font-sans text-xs text-warm-gray/60">{jewishTimesQuery.data?.location || "Loading location..."}</p>
        </div>
        
        {/* Times Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button 
            onClick={() => openModal('mincha')}
            className="bg-white/70 rounded-xl p-2 text-center border border-blush/10 hover:scale-105 transition-all duration-300 hover:bg-white/90"
          >
            <p className="font-sans text-xs text-warm-gray/70">Mincha</p>
            <div className="flex items-center justify-center space-x-1">
              <BookOpen className="text-sage" size={14} />
              <p className="font-serif text-base text-warm-gray font-medium">{jewishTimesQuery.data?.minchaGedolah || "Loading..."}</p>
            </div>
          </button>
          <div className="bg-white/70 rounded-xl p-2 text-center border border-blush/10">
            <p className="font-sans text-xs text-warm-gray/70">Shkia</p>
            <div className="flex items-center justify-center space-x-1">
              <Clock className="text-blush" size={14} />
              <p className="font-serif text-base text-warm-gray font-medium">{jewishTimesQuery.data?.shkia || "Loading..."}</p>
            </div>
          </div>
        </div>

        {/* Sponsor Section */}
        <div className="bg-white/50 rounded-xl p-3 border border-blush/10">
          <div className="flex items-center space-x-2 mb-2">
            <Heart className="text-warm-gray/60" size={16} strokeWidth={1.5} />
            <h4 className="font-serif text-sm text-warm-gray tracking-wide">Today's Sponsor</h4>
          </div>
          <p className="font-sans text-xs text-warm-gray/80 leading-relaxed">
            {sponsor ? 
              (sponsor.message || `Today has been lovingly sponsored by ${sponsor.name}`) :
              "Today has been sponsored by the Cohen family - In memory of Sarah bas Avraham"
            }
          </p>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="space-y-1">
        <button
          onClick={() => navigateToSection('torah')}
          className="w-full bg-white rounded-2xl p-3 shadow-soft hover:scale-105 transition-all duration-300 border border-blush/10"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-feminine p-2 rounded-full">
              <BookOpen className="text-white" size={18} strokeWidth={1.5} />
            </div>
            <div className="text-left flex-grow">
              <h3 className="font-serif text-lg text-warm-gray">Daily Torah</h3>
              <p className="font-sans text-xs text-warm-gray/70">Daily Halacha, Mussar & Chizuk</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigateToSection('tefilla')}
          className="w-full bg-white rounded-2xl p-3 shadow-soft hover:scale-105 transition-all duration-300 border border-blush/10"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blush to-lavender p-2 rounded-full">
              <Heart className="text-white" size={18} strokeWidth={1.5} />
            </div>
            <div className="text-left flex-grow">
              <h3 className="font-serif text-lg text-warm-gray">Daily Tefilla</h3>
              <p className="font-sans text-xs text-warm-gray/70">Tehillim, Mincha & Women's Prayers</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigateToSection('tzedaka')}
          className="w-full bg-white rounded-2xl p-3 shadow-soft hover:scale-105 transition-all duration-300 border border-blush/10"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-muted-lavender to-rose-blush p-2 rounded-full">
              <Coins className="text-white" size={18} strokeWidth={1.5} />
            </div>
            <div className="text-left flex-grow">
              <h3 className="font-serif text-lg text-warm-gray">Daily Tzedaka</h3>
              <p className="font-sans text-xs text-warm-gray/70">Support Torah Learning & Charity</p>
            </div>
          </div>
        </button>

        {/* Discount Promotion Bar */}
        <div className="mt-2">
          <DiscountBar />
        </div>
      </div>
    </div>
  );
}