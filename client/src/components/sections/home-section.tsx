import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Heart, BookOpen, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useModalStore } from "@/lib/types";
import { useJewishTimes } from "@/hooks/use-jewish-times";
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

  // Fetch today's sponsor
  const { data: sponsor } = useQuery<Sponsor>({
    queryKey: ['/api/sponsors/daily', new Date().toISOString().split('T')[0]],
  });

  const navigateToSection = (section: Section) => {
    if (onSectionChange) {
      onSectionChange(section);
    }
  };

  return (
    <div className="p-4 space-y-3 overflow-y-auto">
      {/* Today's Sponsor - 2 lines total */}
      <Card className="p-3 bg-gradient-to-r from-pink-50 to-peach-50 border-pink-200">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Heart className="text-pink-600" size={16} />
            <h3 className="font-semibold text-pink-800 text-sm">Today's Learning</h3>
          </div>
          <p className="text-xs text-pink-700 leading-tight pl-6">
            {sponsor ? 
              `Sponsored by ${sponsor.name}${sponsor.message ? ` - ${sponsor.message}` : ''}` :
              "Sponsored by the Cohen family - In memory of Sarah bas Avraham"
            }
          </p>
        </div>
      </Card>

      {/* Today Section - Ultra Compact */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Clock className="text-sage" size={16} />
            <h3 className="font-semibold text-gray-800 text-sm">Today</h3>
          </div>
        </div>
        <div className="flex justify-between text-xs mb-2">
          <div className="flex items-center space-x-1">
            <span className="text-gray-600">Shkia:</span>
            <span className="font-medium">{jewishTimesQuery.data?.shkia || "Loading..."}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-600">Mincha:</span>
            <span className="font-medium">{jewishTimesQuery.data?.minchaKetanah || "Loading..."}</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 italic leading-tight">
          "May your day be filled with Torah learning, meaningful tefillah, and acts of chesed."
        </p>
      </Card>

      {/* Main Action Buttons - Balanced Prominence */}
      <div className="grid gap-3 mt-2">
        {/* Torah Button */}
        <Button
          onClick={() => navigateToSection('torah')}
          className="h-18 gradient-blush-peach text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 justify-start px-6"
        >
          <div className="flex items-center justify-start w-full space-x-4">
            <BookOpen size={28} className="flex-shrink-0" />
            <div className="text-left flex-grow">
              <div className="font-bold text-base">Torah</div>
              <div className="text-sm opacity-90">Daily Halacha, Mussar & Chizuk</div>
            </div>
          </div>
        </Button>

        {/* Tefilla Button */}
        <Button
          onClick={() => navigateToSection('tefilla')}
          className="h-18 gradient-sage text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 justify-start px-6"
        >
          <div className="flex items-center justify-start w-full space-x-4">
            <Heart size={28} className="flex-shrink-0" />
            <div className="text-left flex-grow">
              <div className="font-bold text-base">Tefilla</div>
              <div className="text-sm opacity-90">Tehillim, Mincha & Women's Prayers</div>
            </div>
          </div>
        </Button>

        {/* Tzedaka Button */}
        <Button
          onClick={() => navigateToSection('tzedaka')}
          className="h-18 gradient-lavender text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 justify-start px-6"
        >
          <div className="flex items-center justify-start w-full space-x-4">
            <HandHeart size={28} className="flex-shrink-0" />
            <div className="text-left flex-grow">
              <div className="font-bold text-base">Tzedaka</div>
              <div className="text-sm opacity-90">Support & Sponsor Learning</div>
            </div>
          </div>
        </Button>
      </div>
    </div>
  );
}