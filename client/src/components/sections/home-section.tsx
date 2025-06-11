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

export default function HomeSection() {
  const { openModal } = useModalStore();
  const jewishTimesQuery = useJewishTimes();

  // Fetch today's sponsor
  const { data: sponsor } = useQuery<Sponsor>({
    queryKey: ['/api/sponsors/daily', new Date().toISOString().split('T')[0]],
  });

  const navigateToSection = (section: string) => {
    // TODO: Implement navigation to specific sections
    // This will trigger section changes in the parent component
    console.log(`Navigate to ${section}`);
  };

  return (
    <div className="p-4 space-y-6">
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

      {/* Today's Zmanim */}
      <Card className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Clock className="text-sage" size={20} />
          <h3 className="font-semibold text-gray-800">Today's Zmanim</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Shkia:</span>
            <span className="font-medium">{jewishTimesQuery.data?.shkia || "Loading..."}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Mincha Gedolah:</span>
            <span className="font-medium">{jewishTimesQuery.data?.minchaGedolah || "Loading..."}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Mincha Ketanah:</span>
            <span className="font-medium">{jewishTimesQuery.data?.minchaKetanah || "Loading..."}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tzais:</span>
            <span className="font-medium">{jewishTimesQuery.data?.tzaitHakochavim || "Loading..."}</span>
          </div>
        </div>
        {jewishTimesQuery.data?.location && (
          <p className="text-xs text-gray-500 mt-2">{jewishTimesQuery.data.location}</p>
        )}
      </Card>

      {/* Date-Specific Information */}
      <Card className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Calendar className="text-lavender" size={20} />
          <h3 className="font-semibold text-gray-800">Today's Date</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Hebrew Date:</span>
            <span className="font-medium">{jewishTimesQuery.data?.hebrewDate || "15 Kislev 5785"}</span>
          </div>
          {/* TODO: Integrate with database for dynamic date-specific info */}
          <div className="flex justify-between">
            <span className="text-gray-600">Omer Count:</span>
            <span className="font-medium text-gray-400">Not in Omer period</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Special Day:</span>
            <span className="font-medium text-gray-400">Regular weekday</span>
          </div>
          {/* Placeholder for Rosh Chodesh, fast days, etc. */}
        </div>
      </Card>

      {/* Main Action Buttons */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800 text-center">Explore Ezras Nashim</h3>
        
        <div className="grid gap-4">
          {/* Torah Button */}
          <Button
            onClick={() => navigateToSection('torah')}
            className="h-16 gradient-blush-peach text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <BookOpen size={24} />
              <div className="text-left">
                <div className="font-semibold">Torah</div>
                <div className="text-xs opacity-90">Daily Halacha, Mussar & Chizuk</div>
              </div>
            </div>
          </Button>

          {/* Tefilla Button */}
          <Button
            onClick={() => navigateToSection('tefilla')}
            className="h-16 gradient-sage text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <Heart size={24} />
              <div className="text-left">
                <div className="font-semibold">Tefilla</div>
                <div className="text-xs opacity-90">Tehillim, Mincha & Women's Prayers</div>
              </div>
            </div>
          </Button>

          {/* Tzedaka Button */}
          <Button
            onClick={() => openModal('sponsor-day')}
            className="h-16 gradient-lavender text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <HandHeart size={24} />
              <div className="text-left">
                <div className="font-semibold">Tzedaka</div>
                <div className="text-xs opacity-90">Support & Sponsor Learning</div>
              </div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}