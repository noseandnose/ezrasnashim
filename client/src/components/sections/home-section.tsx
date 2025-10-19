import { useQuery } from "@tanstack/react-query";
import { Clock, Heart, BookOpen, HandHeart, Coins, MapPin, Sunrise, Sun, Moon, Star } from "lucide-react";
import { useModalStore, useDailyCompletionStore } from "@/lib/types";
import { useJewishTimes, useGeolocation } from "@/hooks/use-jewish-times";
import { useHebrewDateWithShkia } from "@/hooks/use-hebrew-date";
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
  
  // Load location immediately on startup for accurate times
  const jewishTimesQuery = useJewishTimes();
  const { coordinates, permissionDenied } = useGeolocation();
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
  const { data: sponsor, isLoading: sponsorLoading } = useQuery<Sponsor>({
    queryKey: ['daily-sponsor', today],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sponsors/daily/${today}`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data;
    },
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
    gcTime: 2 * 60 * 60 * 1000, // Keep in cache for 2 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false // Don't refetch on focus
  });



  const navigateToSection = (section: Section) => {
    if (onSectionChange) {
      onSectionChange(section);
    }
  };

  // Time-based prayer logic (identical to Tefilla section)
  const getCurrentPrayer = () => {
    if (!jewishTimesQuery.data || jewishTimesQuery.isLoading) {
      return { title: "Shacharis", subtitle: "Loading times...", modal: "morning-brochas", icon: Sunrise };
    }

    const now = new Date();
    const times = jewishTimesQuery.data;
    
    // Helper function to parse time strings like "6:30 AM" into today's date
    const parseTimeToday = (timeStr: string) => {
      if (!timeStr) return null;
      
      // Parse the time string (e.g., "6:30 AM" or "7:45 PM")
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!match) return null;
      
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const period = match[3].toUpperCase();
      
      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      // Create a date object for today with the specified time
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    };
    
    const alos = parseTimeToday(times.alosHashachar);
    const chatzos = parseTimeToday(times.chatzos);
    const minchaGedola = parseTimeToday(times.minchaGedolah);
    const shkia = parseTimeToday(times.shkia);
    const plagHamincha = parseTimeToday(times.plagHamincha);
    
    // Handle null times gracefully
    if (!alos || !chatzos || !minchaGedola || !shkia || !plagHamincha) {
      return {
        title: "Shacharis",
        subtitle: "Times unavailable",
        modal: "morning-brochas" as const,
        icon: Sunrise
      };
    }

    if (now >= alos && now < chatzos) {
      // Shacharis time - from Alos Hashachar until Chatzos
      return {
        title: "Shacharis",
        subtitle: `${times.alosHashachar} - ${times.chatzos}`,
        modal: "morning-brochas" as const,
        icon: Sunrise
      };
    } else if (now >= minchaGedola && now < shkia) {
      // Mincha time - from Mincha Gedolah until Shkia
      return {
        title: "Mincha",
        subtitle: `${times.minchaGedolah} - ${times.shkia}`,
        modal: "mincha" as const,
        icon: Sun
      };
    } else if (now >= shkia && now < plagHamincha) {
      // Gap between Shkia and Plag Hamincha - show when Maariv will be available
      return {
        title: "Maariv",
        subtitle: `from ${times.plagHamincha} until ${times.alosHashachar}`,
        modal: "maariv" as const,
        icon: Moon,
        disabled: true
      };
    } else if (now >= plagHamincha || now < alos) {
      // Maariv time - from Plag Hamincha until next Alos Hashachar
      return {
        title: "Maariv",
        subtitle: `${times.plagHamincha} - ${times.alosHashachar}`,
        modal: "maariv" as const,
        icon: Moon
      };
    } else {
      // Between Chatzos and Mincha Gedolah - show when Mincha will be available
      return {
        title: "Mincha",
        subtitle: `from ${times.minchaGedolah} until ${times.shkia}`,
        modal: "mincha" as const,
        icon: Sun,
        disabled: true
      };
    }
  };

  const currentPrayer = useMemo(() => getCurrentPrayer(), [jewishTimesQuery.data, jewishTimesQuery.isLoading]);

  // Get the proper icon component
  const PrayerIcon = currentPrayer.icon;

  return (
    <div className="pb-20">
      {/* Spacer for fixed header - reduced to eliminate gap */}
      <div className="bg-gradient-soft" style={{ height: 'max(30px, calc(env(safe-area-inset-top, 0px) + 20px))' }} />
      
      {/* Unified Top Section with Greeting, Times, and Today Info - Connected to top bar */}
      <div className="bg-gradient-soft rounded-b-3xl p-3 shadow-lg">
        {/* Greeting and Date in one row */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="platypi-bold text-xl text-black tracking-wide">{getGreeting()}</h1>
          <div className="text-right">
            <p className="platypi-regular text-xs text-black">{hebrewDate || "Loading..."}</p>
            <button 
              onClick={() => openModal('location', 'home')}
              className={`flex items-center justify-end space-x-1 hover:bg-white/80 px-2 py-1 rounded-xl transition-colors h-auto ${(permissionDenied || !coordinates) ? 'animate-pulse border-2 border-blush bg-blush/10' : 'border border-gray-200 bg-white/60'}`}
              style={{ height: 'auto', minHeight: 'auto' }}
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
              openModal('sponsor-details', 'home');
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
          <div className="relative">
            <button 
              onClick={() => !currentPrayer.disabled && openModal(currentPrayer.modal, 'tefilla')}
              disabled={currentPrayer.disabled}
              className={`w-full rounded-xl p-3 text-center border transition-all duration-300 ${
                currentPrayer.disabled 
                  ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed' 
                  : 'bg-white/80 border-blush/20 hover:scale-105 hover:bg-white/95'
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                <div className={`p-1.5 rounded-full mr-1 ${
                  currentPrayer.disabled 
                    ? 'bg-gray-300' 
                    : 'bg-gradient-feminine'
                }`}>
                  <PrayerIcon className={currentPrayer.disabled ? "text-gray-500" : "text-white"} size={12} />
                </div>
              </div>
              <p className={`platypi-bold text-sm mb-0.5 ${currentPrayer.disabled ? 'text-gray-500' : 'text-black'}`}>
                {currentPrayer.title}
              </p>
              <p className={`platypi-bold text-xs leading-tight ${currentPrayer.disabled ? 'text-gray-400' : 'text-black'}`}>
                {currentPrayer.subtitle}
              </p>
            </button>
          </div>

          {/* Shkia - Clickable to open Events */}
          <div className="relative">
            <button 
              onClick={() => openModal('events', 'home')}
              className="w-full bg-white/80 rounded-xl p-3 text-center border border-blush/20 hover:scale-105 hover:bg-white/95 transition-all duration-300"
            >
              <div className="flex items-center justify-center mb-1">
                <div className="bg-gradient-feminine p-1.5 rounded-full relative">
                  <Clock className="text-white" size={12} />
                  {/* Small star inside circle */}
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-r from-blush to-muted-lavender rounded-full flex items-center justify-center">
                    <Star className="text-white" size={6} fill="currentColor" />
                  </div>
                </div>
              </div>
              <p className="platypi-bold text-sm text-black mb-0.5">Shkia</p>
              <p className="platypi-bold text-xs text-black">{jewishTimesQuery.data?.shkia || "Loading..."}</p>
            </button>
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
          <HeartProgress 
            completed={torahCompleted} 
            size={20} 
            animationClass={torahCompleted ? 'heartbeat-green' : 'heartbeat-pink'}
          />
        </button>

        {/* Daily Tefilla Bar */}
        <button
          onClick={() => navigateToSection('tefilla')}
          className="w-full rounded-2xl p-4 text-left hover:scale-[1.02] transition-all duration-300 shadow-lg border border-blush/10 bg-white flex items-center space-x-4"
        >
          <div className={`p-3 rounded-full ${tefillaCompleted ? 'bg-sage' : 'bg-gradient-to-br from-blush to-lavender'}`}>
            <HandHeart className="text-white" size={20} strokeWidth={1.5} />
          </div>
          <div className="flex-grow">
            <h3 className="platypi-bold text-sm text-black">Daily Tefilla</h3>
            <p className="platypi-regular text-xs text-black/60">Tehillim, Prayers and Brochas</p>
          </div>
          <HeartProgress 
            completed={tefillaCompleted} 
            size={20} 
            animationClass={tefillaCompleted ? 'heartbeat-green' : 'heartbeat-pink'}
          />
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
          <HeartProgress 
            completed={tzedakaCompleted} 
            size={20} 
            animationClass={tzedakaCompleted ? 'heartbeat-green' : 'heartbeat-pink'}
          />
        </button>

        {/* Daily Progress Tracker - Compact Version */}
        <div 
          id="daily-progress-garden"
          className="rounded-2xl pl-4 pr-1 py-3 shadow-lg border border-blush/10 bg-white mt-4 flex items-center justify-between min-h-[90px]"
        >
          {/* Left side: Title and subtitle */}
          <div className="flex flex-col justify-center flex-1">
            <h3 className="platypi-bold text-lg text-black mb-1 text-left">Daily Progress Garden</h3>
            <p className="platypi-regular text-xs text-black/80 leading-relaxed text-left max-w-[160px]">
              Complete one item from each Mitzva to see your daily progress Bloom
            </p>
          </div>
          
          {/* Right side: Progress image */}
          <div className="flex items-center justify-center">
            <DailyProgress />
          </div>
        </div>
      </div>
    </div>
  );
}