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
    <div className="p-4 space-y-5">
      {/* Today's Sponsor */}
      <Card className="p-4 bg-gradient-to-r from-blush/10 to-peach/10 border-blush/20">
        <div className="flex items-center space-x-3">
          <Heart className="text-blush" size={20} />
          <div>
            <h3 className="font-semibold text-gray-800">Today's Learning</h3>
            <p className="text-sm text-gray-600">
              {sponsor ? 
                `Sponsored by ${sponsor.name}${sponsor.message ? ` - ${sponsor.message}` : ''}` :
                "Sponsored by the Cohen family - In memory of Sarah bas Avraham"
              }
            </p>
          </div>
        </div>
      </Card>

      {/* Today Section - Streamlined */}
      <Card className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Clock className="text-sage" size={20} />
          <h3 className="font-semibold text-gray-800">Today</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Shkia:</span>
            <span className="font-medium">{jewishTimesQuery.data?.shkia || "Loading..."}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Mincha:</span>
            <span className="font-medium">{jewishTimesQuery.data?.minchaKetanah || "Loading..."}</span>
          </div>
        </div>
        {/* Today's Message - Condensed */}
        <div className="pt-3 border-t border-gray-100 mt-3">
          <p className="text-sm text-gray-600 italic">
            "May your day be filled with Torah learning, meaningful tefillah, and acts of chesed."
          </p>
        </div>
      </Card>

      {/* Main Action Buttons - Balanced Prominence */}
      <div className="grid gap-4">
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