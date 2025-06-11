import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Heart, BookOpen, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useModalStore } from "@/lib/types";
import { useJewishTimes } from "@/hooks/use-jewish-times";

interface Sponsor {
  name: string;
  message?: string;
}

interface HomeSectionProps {
  onSectionChange?: (section: 'torah' | 'tefilla' | 'table' | 'shop') => void;
}

export default function HomeSection({ onSectionChange }: HomeSectionProps) {
  const { openModal } = useModalStore();
  const jewishTimesQuery = useJewishTimes();

  // Fetch today's sponsor
  const { data: sponsor } = useQuery<Sponsor>({
    queryKey: ['/api/sponsors/daily', new Date().toISOString().split('T')[0]],
  });

  const navigateToSection = (section: 'torah' | 'tefilla' | 'table' | 'shop') => {
    if (onSectionChange) {
      onSectionChange(section);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Compact Today Section - Combined sponsor and key info */}
      <Card className="p-3 bg-gradient-to-r from-blush/10 to-peach/10 border-blush/20">
        <div className="space-y-2">
          {/* Today's Sponsor - Compact */}
          <div className="flex items-center space-x-2">
            <Heart className="text-blush flex-shrink-0" size={16} />
            <p className="text-xs text-gray-600 truncate">
              {sponsor ? 
                `Today's learning sponsored by ${sponsor.name}` :
                "Today's learning sponsored by the Cohen family"
              }
            </p>
          </div>
          
          {/* Key Zmanim - Horizontal layout */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              <Clock className="text-sage" size={14} />
              <span className="text-gray-600">Shkia:</span>
              <span className="font-medium text-gray-800">{jewishTimesQuery.data?.shkia || "Loading..."}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-gray-600">Mincha:</span>
              <span className="font-medium text-gray-800">{jewishTimesQuery.data?.minchaKetanah || "Loading..."}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Action Buttons - Extra Prominent */}
      <div className="grid gap-5 mt-2">
        {/* Torah Button */}
        <Button
          onClick={() => navigateToSection('torah')}
          className="h-20 gradient-blush-peach text-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-200 justify-start px-8 transform hover:scale-[1.02]"
        >
          <div className="flex items-center justify-start w-full space-x-5">
            <BookOpen size={32} className="flex-shrink-0" />
            <div className="text-left flex-grow">
              <div className="font-bold text-lg">Torah</div>
              <div className="text-sm opacity-95">Daily Halacha, Mussar & Chizuk</div>
            </div>
          </div>
        </Button>

        {/* Tefilla Button */}
        <Button
          onClick={() => navigateToSection('tefilla')}
          className="h-20 gradient-sage text-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-200 justify-start px-8 transform hover:scale-[1.02]"
        >
          <div className="flex items-center justify-start w-full space-x-5">
            <Heart size={32} className="flex-shrink-0" />
            <div className="text-left flex-grow">
              <div className="font-bold text-lg">Tefilla</div>
              <div className="text-sm opacity-95">Tehillim, Mincha & Women's Prayers</div>
            </div>
          </div>
        </Button>

        {/* Tzedaka Button - Opens tzedaka modal */}
        <Button
          onClick={() => openModal('sponsor-day')}
          className="h-20 gradient-lavender text-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-200 justify-start px-8 transform hover:scale-[1.02]"
        >
          <div className="flex items-center justify-start w-full space-x-5">
            <HandHeart size={32} className="flex-shrink-0" />
            <div className="text-left flex-grow">
              <div className="font-bold text-lg">Tzedaka</div>
              <div className="text-sm opacity-95">Support & Sponsor Learning</div>
            </div>
          </div>
        </Button>
      </div>
    </div>
  );
}