import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Heart, BookOpen, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useModalStore } from "@/lib/types";
import { useJewishTimes } from "@/hooks/use-jewish-times";
import { useHebrewDate } from "@/hooks/use-hebrew-date";
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
    <div className="p-2 space-y-2 overflow-y-auto">
      {/* Gentle Welcome */}
      <div className="text-center">
        <h1 className="font-serif text-3xl text-warm-gray mb-2 tracking-wide">Welcome to Ezras Nashim</h1>
      </div>

      {/* Today's Sponsor */}
      <div className="gradient-soft-glow rounded-3xl p-5 border border-rose-blush/15 glow-hover transition-gentle">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-rose-blush/20 p-2 rounded-full">
            <Heart className="text-rose-blush" size={16} strokeWidth={1.5} />
          </div>
          <h3 className="font-serif text-sm text-warm-gray tracking-wide">Today's Sponsor</h3>
        </div>
        <p className="font-sans text-sm text-warm-gray/80 leading-relaxed">
          {sponsor ? 
            (sponsor.message || `Today has been lovingly sponsored by ${sponsor.name}`) :
            "Today has been sponsored by the Cohen family - In memory of Sarah bas Avraham"
          }
        </p>
      </div>

      {/* Today's Information */}
      <div className="bg-soft-white rounded-3xl p-4 shadow-lg border border-rose-blush/10 glow-hover transition-gentle">
        <div className="flex items-center space-x-3 mb-3">
          <div className="gradient-quiet-joy p-2 rounded-full">
            <Clock className="text-white" size={18} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-serif text-base text-warm-gray">Today</h3>
            <p className="font-sans text-xs text-warm-gray/70">{hebrewDate || "Loading Hebrew date..."}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-gradient-to-br from-blush/8 to-ivory rounded-2xl p-4 text-center">
            <p className="font-sans text-xs text-warm-gray/70 mb-2">Shkia</p>
            <p className="font-serif text-lg text-warm-gray font-medium">{jewishTimesQuery.data?.shkia || "Loading..."}</p>
          </div>
          <div className="bg-gradient-to-br from-lavender/8 to-ivory rounded-2xl p-4 text-center">
            <p className="font-sans text-xs text-warm-gray/70 mb-2">Mincha</p>
            <p className="font-serif text-lg text-warm-gray font-medium">{jewishTimesQuery.data?.minchaGedolah || "Loading..."}</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-ivory to-blush/5 rounded-2xl p-3 text-center">
          <p className="font-sans text-xs text-warm-gray/80 italic leading-relaxed">
            "May your day be filled with Torah learning, meaningful tefillah, and acts of chesed."
          </p>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={() => navigateToSection('torah')}
          className="w-full bg-white rounded-3xl p-4 shadow-lg hover:scale-105 transition-all duration-300 border border-blush/10"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-feminine p-3 rounded-full">
              <BookOpen className="text-white" size={20} strokeWidth={1.5} />
            </div>
            <div className="text-left flex-grow">
              <h3 className="font-serif text-base text-warm-gray mb-1">Torah Learning</h3>
              <p className="font-sans text-xs text-warm-gray/70">Daily Halacha, Mussar & Chizuk</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigateToSection('tefilla')}
          className="w-full bg-white rounded-3xl p-4 shadow-lg hover:scale-105 transition-all duration-300 border border-blush/10"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blush to-lavender p-3 rounded-full">
              <Heart className="text-white" size={20} strokeWidth={1.5} />
            </div>
            <div className="text-left flex-grow">
              <h3 className="font-serif text-base text-warm-gray mb-1">Tefilla & Prayer</h3>
              <p className="font-sans text-xs text-warm-gray/70">Tehillim, Mincha & Women's Prayers</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigateToSection('tzedaka')}
          className="w-full bg-white rounded-3xl p-4 shadow-lg hover:scale-105 transition-all duration-300 border border-blush/10"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-lavender to-sage p-3 rounded-full">
              <HandHeart className="text-white" size={20} strokeWidth={1.5} />
            </div>
            <div className="text-left flex-grow">
              <h3 className="font-serif text-base text-warm-gray mb-1">Tzedaka & Giving</h3>
              <p className="font-sans text-xs text-warm-gray/70">Support Torah Learning & Charity</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}