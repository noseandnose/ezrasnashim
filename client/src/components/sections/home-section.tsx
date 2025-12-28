import { Clock, Heart, BookOpen, HandHeart, Coins, MapPin, Sunrise, Sun, Moon, Sparkles, Settings, Plus, Minus, Info } from "lucide-react";
import { useWeather, getWeatherEmoji, useTemperatureUnit } from "@/hooks/use-weather";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, memo } from "react";
import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import { useJewishTimes, useGeolocation } from "@/hooks/use-jewish-times";
import { useHebrewDateWithShkia } from "@/hooks/use-hebrew-date";
import { useHomeSummary } from "@/hooks/use-home-summary";
import { useAuth } from "@/hooks/use-auth";
import HeartProgress from "@/components/heart-progress";
import type { Section } from "@/pages/home";
import { useMemo } from "react";
import { getLocalDateString } from "@/lib/dateUtils";
import DOMPurify from "dompurify";
import grassImage from "@assets/Grass2_1766588526836.png";
import torahFlower from "@assets/Torah_1766581824736.png";
import tefillaFlower from "@assets/Tefilla_1766581824746.png";
import tzedakaFlower from "@assets/Tzedaka_1766581824745.png";
import morningBackground from "@assets/Morning_1766585201516.png";
import afternoonBackground from "@assets/Afternoon_1766585201516.png";
import nightBackground from "@assets/Evening_1766585201513.png";
import milestone10Tree from "@assets/10_1766688255354.png";
import milestone20Tree from "@assets/20_1766688255353.png";
import milestone30Tree from "@assets/30_1766688255351.png";
import prayerMorningBg from "@assets/Morning_1766585505566.png";
import prayerAfternoonBg from "@assets/Afternoon_1766585505566.png";
import prayerNightBg from "@assets/Night_1766585505565.png";
import shkiaMorningBg from "@assets/Morning_1766586713115.png";
import shkiaAfternoonBg from "@assets/Afternoon_1766588062516.png";
import shkiaNightBg from "@assets/Night_1766586713110.png";

// TEMPORARY: New section background images for testing
import sectionMorningBg from "@assets/Morning_1766933137711.jpg";
import sectionAfternoonBg from "@assets/Afternoon_1766933137711.jpg";
import sectionNightBg from "@assets/Night_1766933137710.jpg";

interface HomeSectionProps {
  onSectionChange?: (section: Section) => void;
}

function HomeSectionComponent({ onSectionChange }: HomeSectionProps) {
  const { openModal } = useModalStore();
  const { torahCompleted, tefillaCompleted, tzedakaCompleted } = useDailyCompletionStore();
  const { user, isAuthenticated } = useAuth();
  // Subscribe to completedModals to trigger re-renders when completions change
  const completedModals = useModalCompletionStore((state) => state.completedModals);
  
  // Get flower counts for each category - recomputes when completedModals changes
  const tefillaFlowerCount = useMemo(() => {
    // Count all tefilla-related completions
    // Get today's date key - must use getLocalDateString to match the store
    const today = getLocalDateString();
    const todaysData = completedModals[today];
    if (!todaysData) return 0;
    
    let count = 0;
    // Tefilla repeatables - matches what's stored locally via markModalComplete:
    // global-tehillim-chain (new aligned key), tehillim-text (legacy), individual-tehillim-X,
    // chain-tehillim-X, nishmas-campaign, al-hamichiya, birkat-hamazon, meditation-X, brocha-X, womens-prayer-X
    if (todaysData.repeatables) {
      Object.entries(todaysData.repeatables).forEach(([key, value]) => {
        if (key.startsWith('individual-tehillim-') || 
            key.startsWith('chain-tehillim-') ||
            key.startsWith('brocha-') ||
            key.startsWith('womens-prayer-') ||
            key === 'global-tehillim-chain' ||  // New aligned identifier
            key === 'tehillim-text' ||  // Legacy identifier for backward compatibility
            key.startsWith('meditation-')) {
          count += value;
        }
      });
      count += todaysData.repeatables['nishmas-campaign'] || 0;
      count += todaysData.repeatables['al-hamichiya'] || 0;
      count += todaysData.repeatables['birkat-hamazon'] || 0;
    }
    // Tefilla singles: mincha, maariv, morning-brochas (defined in SINGLE_COMPLETION_PRAYERS)
    if (todaysData.singles) {
      if (todaysData.singles.has('mincha')) count++;
      if (todaysData.singles.has('maariv')) count++;
      if (todaysData.singles.has('morning-brochas')) count++;
    }
    return count;
  }, [completedModals]);

  const torahFlowerCount = useMemo(() => {
    const today = getLocalDateString();
    const todaysData = completedModals[today];
    if (!todaysData) return 0;
    
    let count = 0;
    // Torah modal IDs: halacha, chizuk, emuna, featured, pirkei-avot, parsha-vort
    // All Torah items are repeatables (not in SINGLE_COMPLETION_PRAYERS set)
    if (todaysData.repeatables) {
      count += todaysData.repeatables['halacha'] || 0;
      count += todaysData.repeatables['chizuk'] || 0;
      count += todaysData.repeatables['emuna'] || 0;
      count += todaysData.repeatables['featured'] || 0;
      count += todaysData.repeatables['pirkei-avot'] || 0;
      count += todaysData.repeatables['parsha-vort'] || 0;
    }
    return count;
  }, [completedModals]);

  const tzedakaFlowerCount = useMemo(() => {
    return tzedakaCompleted ? 1 : 0;
  }, [tzedakaCompleted]);

  // Generate stable but randomized positions for flowers - like a natural garden
  // Each flower has a fixed position based on its type and index (stable across re-renders)
  const flowerPositions = useMemo(() => {
    const positions: { type: 'torah' | 'tefilla' | 'tzedaka'; left: number; bottom: number; flipped: boolean; scale: number; overallIndex: number }[] = [];
    
    // Create a seeded random generator for a specific flower
    const getFlowerRandom = (type: string, index: number, overallIdx: number) => {
      // Unique seed combining type, index, and overall position for more variety
      const baseSeed = type === 'torah' ? 100 : type === 'tefilla' ? 200 : 300;
      let seed = baseSeed + index * 17 + overallIdx * 37;
      return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    };
    
    let overallFlowerIndex = 1; // 1-based overall index for milestone tracking
    
    // Helper to add a flower with truly random position
    const addFlower = (type: 'torah' | 'tefilla' | 'tzedaka', index: number) => {
      const random = getFlowerRandom(type, index, overallFlowerIndex);
      // Random scale for size variation (0.65 to 1.05)
      const scale = 0.65 + (random() * 0.4);
      const flipped = random() > 0.5;
      // Stems start near bottom (10 to 15% from bottom)
      const bottom = 10 + random() * 5;
      // Truly random horizontal position across full width (5% to 95%)
      const left = 5 + random() * 90;
      
      positions.push({ type, left, bottom, flipped, scale, overallIndex: overallFlowerIndex });
      overallFlowerIndex++;
    };
    
    // PRIORITY: Place Torah and Tzedaka flowers first (they're completed less often)
    for (let i = 0; i < torahFlowerCount; i++) {
      addFlower('torah', i);
    }
    
    for (let i = 0; i < tzedakaFlowerCount; i++) {
      addFlower('tzedaka', i);
    }
    
    // Place Tefilla flowers last
    for (let i = 0; i < tefillaFlowerCount; i++) {
      addFlower('tefilla', i);
    }
    
    return positions;
  }, [torahFlowerCount, tefillaFlowerCount, tzedakaFlowerCount]);

  // Load location immediately on startup for accurate times
  const jewishTimesQuery = useJewishTimes();
  const { coordinates, permissionDenied } = useGeolocation();
  const { data: hebrewDate } = useHebrewDateWithShkia(jewishTimesQuery.data?.shkia);
  const { data: weather } = useWeather();
  const { unit: tempUnit, toggle: toggleTempUnit } = useTemperatureUnit();

  // Helper to check if current time is after tzais hakochavim (nightfall)
  const isAfterTzais = (): boolean => {
    const tzaisStr = jewishTimesQuery.data?.tzaitHakochavim;
    if (!tzaisStr) return new Date().getHours() >= 18; // Fallback to 6 PM if no data
    
    const now = new Date();
    const match = tzaisStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return now.getHours() >= 18;
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const isPM = match[3].toUpperCase() === 'PM';
    
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    
    const tzaisTime = new Date(now);
    tzaisTime.setHours(hours, minutes, 0, 0);
    
    return now >= tzaisTime;
  };

  // Get time-appropriate greeting (evening starts at tzais hakochavim)
  const getGreeting = () => {
    const hour = new Date().getHours();
    let greeting = "";
    if (hour < 12) greeting = "Good Morning";
    else if (isAfterTzais()) greeting = "Good Evening";
    else greeting = "Good Afternoon";
    
    // Add user's first name if logged in
    if (isAuthenticated && user?.firstName) {
      greeting += `, ${user.firstName}`;
    }
    
    return greeting;
  };

  // Get time-appropriate background for garden
  const getGardenBackground = () => {
    const hour = new Date().getHours();
    if (hour < 12) return morningBackground;
    if (isAfterTzais()) return nightBackground;
    return afternoonBackground;
  };

  // Get time-appropriate background for prayer button
  const getPrayerButtonBackground = () => {
    const hour = new Date().getHours();
    if (hour < 12) return prayerMorningBg;
    if (isAfterTzais()) return prayerNightBg;
    return prayerAfternoonBg;
  };

  // Get time-appropriate background for shkia button
  const getShkiaButtonBackground = () => {
    const hour = new Date().getHours();
    if (hour < 12) return shkiaMorningBg;
    if (isAfterTzais()) return shkiaNightBg;
    return shkiaAfternoonBg;
  };

  // TEMPORARY: Get time-appropriate background for main section
  const getSectionBackground = () => {
    const hour = new Date().getHours();
    if (hour < 12) return sectionMorningBg;
    if (isAfterTzais()) return sectionNightBg;
    return sectionAfternoonBg;
  };

  // Use batched home summary for better performance (message, sponsor, todaysSpecial in one call)
  const { data: homeSummary, isLoading: sponsorLoading } = useHomeSummary();
  const sponsor = homeSummary?.sponsor;
  const todaysSpecial = homeSummary?.todaysSpecial;

  // Today's Special state
  const [todaysSpecialExpanded, setTodaysSpecialExpanded] = useState(false);
  const [todaysSpecialLanguage, setTodaysSpecialLanguage] = useState<'english' | 'hebrew'>('hebrew');
  const [todaysSpecialFontSize, setTodaysSpecialFontSize] = useState(16);
  const [showTodaysSpecialSettings, setShowTodaysSpecialSettings] = useState(false);

  // Check if Today's Special has content
  const hasTodaysSpecialContent = todaysSpecial && (todaysSpecial.contentEnglish || todaysSpecial.contentHebrew);
  const hasBothLanguages = todaysSpecial?.contentEnglish && todaysSpecial?.contentHebrew;
  
  // Helper function to replace placeholders in Today's Special text
  const replacePlaceholders = (text: string | null | undefined): string => {
    if (!text) return '';
    return text
      .replace(/\{\{shkia\}\}/gi, jewishTimesQuery.data?.shkia || '')
      .replace(/\{\{sunrise\}\}/gi, jewishTimesQuery.data?.sunrise || '')
      .replace(/\{\{mincha\}\}/gi, jewishTimesQuery.data?.minchaGedolah || '')
      .replace(/\{\{candleLighting\}\}/gi, jewishTimesQuery.data?.candleLighting || '')
      .replace(/\{\{havdalah\}\}/gi, jewishTimesQuery.data?.havdalah || '');
  };

  const formatMarkdown = (text: string | null | undefined): string => {
    if (!text) return '';
    const withPlaceholders = replacePlaceholders(text);
    const withBold = withPlaceholders.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const withLineBreaks = withBold.replace(/\n/g, '<br>');
    return DOMPurify.sanitize(withLineBreaks);
  };



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
    <div className="pb-20" data-bridge-container>
      
      {/* Unified Top Section with Greeting, Times, and Today Info - Connected to top bar */}
      <div 
        className="rounded-b-3xl p-3"
        style={{
          background: 'linear-gradient(180deg, rgba(186,137,160,0.12) 0%, rgba(186,137,160,0.06) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
        }}
      >
        {/* Greeting and Date in one row */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="platypi-bold text-xl text-black tracking-wide">{getGreeting()}</h1>
          <div className="text-right">
            <p className="platypi-regular text-xs text-black">{hebrewDate || "Loading..."}</p>
            <button 
              onClick={() => openModal('location', 'home')}
              className={`flex items-center justify-end space-x-1 hover:bg-white/80 px-2 py-1 rounded-xl transition-colors h-auto ${(permissionDenied || !coordinates) ? 'animate-pulse border-2 border-blush bg-blush/10' : 'border border-gray-200 bg-white/60'}`}
              style={{ height: 'auto', minHeight: 'auto' }}
              data-modal-type="location"
              data-modal-section="home"
              data-testid="button-home-location"
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
          <button 
            onClick={() => !currentPrayer.disabled && openModal(currentPrayer.modal, 'tefilla')}
            disabled={currentPrayer.disabled}
            className={`w-full h-full rounded-xl p-3 text-center border transition-all duration-300 overflow-hidden relative ${
              currentPrayer.disabled 
                ? 'border-gray-200 opacity-60 cursor-not-allowed' 
                : 'border-blush/20 hover:scale-105'
            }`}
            data-modal-type={currentPrayer.modal}
            data-modal-section="tefilla"
            data-testid="button-home-prayer"
          >
            {/* Background image */}
            <img 
              src={getPrayerButtonBackground()} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover"
              style={{ zIndex: 0, opacity: 0.3 }}
            />
            {/* Content overlay */}
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-1">
                <div className={`p-1.5 rounded-full mr-1 ${
                  currentPrayer.disabled 
                    ? 'bg-gray-300' 
                    : 'bg-white/60'
                }`}>
                  <PrayerIcon className={currentPrayer.disabled ? "text-gray-500" : "text-black"} size={12} />
                </div>
              </div>
              <p className={`platypi-bold text-sm mb-0.5 ${currentPrayer.disabled ? 'text-gray-500' : 'text-black'}`}>
                {currentPrayer.title}
              </p>
              <p className={`platypi-bold text-xs leading-tight ${currentPrayer.disabled ? 'text-gray-400' : 'text-black'}`}>
                {currentPrayer.subtitle}
              </p>
            </div>
          </button>

          {/* Shkia - Clickable to open Events */}
          <button 
            onClick={() => openModal('events', 'home')}
            className="w-full h-full rounded-xl p-3 text-center border border-blush/20 hover:scale-105 transition-all duration-300 overflow-hidden relative"
            data-modal-type="events"
            data-modal-section="home"
            data-testid="button-home-events"
          >
            {/* Background image */}
            <img 
              src={getShkiaButtonBackground()} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover"
              style={{ zIndex: 0, opacity: 0.3 }}
            />
            {/* Weather badge - Apple glass style, tappable to toggle C/F */}
            {weather && (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTempUnit();
                }}
                className="absolute top-1.5 right-1.5 z-20 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full cursor-pointer active:scale-95 transition-transform"
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                <span className="text-xs">{getWeatherEmoji(weather.weatherCode)}</span>
                <span className="platypi-bold text-[10px] text-black/80">
                  {tempUnit === 'C' ? weather.temperatureC : weather.temperatureF}°{tempUnit}
                </span>
              </div>
            )}
            {/* Content overlay */}
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-1">
                <div className="bg-white/60 p-1.5 rounded-full">
                  <Clock className="text-black" size={12} />
                </div>
              </div>
              <p className="platypi-bold text-sm text-black mb-0.5">Shkia</p>
              <p className="platypi-bold text-xs text-black">{jewishTimesQuery.data?.shkia || "Loading..."}</p>
            </div>
          </button>
        </div>

        {/* Today's Special Expandable Bar - Only shown when content exists */}
        {hasTodaysSpecialContent && todaysSpecial && (
          <div 
            className="bg-white/80 rounded-xl mt-2 overflow-hidden border border-blush/20"
            style={{ animation: 'gentle-glow-pink 3s ease-in-out infinite' }}
          >
            {/* Collapsed/Header Bar */}
            <button
              onClick={() => setTodaysSpecialExpanded(!todaysSpecialExpanded)}
              className="w-full p-3 text-left hover:bg-white/90 transition-colors"
              data-testid="button-todays-special-toggle"
            >
              <div className="flex items-center gap-3">
                {/* Image */}
                {todaysSpecial.imageUrl && (
                  <img 
                    src={todaysSpecial.imageUrl} 
                    alt={todaysSpecial.title || "Today's Special"} 
                    className="w-10 h-10 rounded-xl object-cover"
                    loading="lazy"
                  />
                )}
                {!todaysSpecial.imageUrl && (
                  <div className="bg-gradient-feminine p-2 rounded-full">
                    <Sparkles className="text-white" size={16} />
                  </div>
                )}
                
                {/* Title and Subtitle */}
                <div className="flex-grow">
                  <h3 className="platypi-bold text-sm text-black">{replacePlaceholders(todaysSpecial.title) || "Today's Special"}</h3>
                  {todaysSpecial.subtitle && (
                    <p className="platypi-regular text-xs text-black/70">{replacePlaceholders(todaysSpecial.subtitle)}</p>
                  )}
                </div>
                
                {/* Expand/Collapse indicator */}
                <div className="text-black/40">
                  {todaysSpecialExpanded ? <Minus size={18} /> : <Plus size={18} />}
                </div>
              </div>
            </button>
            
            {/* Expanded Content */}
            {todaysSpecialExpanded && (
              <div className="relative px-3 pb-16 pt-3 border-t border-blush/10">
                {/* Content */}
                <div 
                  className={`text-black leading-relaxed ${
                    todaysSpecialLanguage === 'hebrew' ? 'vc-koren-hebrew' : 'platypi-regular text-left'
                  }`}
                  style={{ fontSize: `${todaysSpecialFontSize}px` }}
                  dir={todaysSpecialLanguage === 'hebrew' ? 'rtl' : 'ltr'}
                  dangerouslySetInnerHTML={{
                    __html: todaysSpecialLanguage === 'hebrew' 
                      ? formatMarkdown(todaysSpecial.contentHebrew || todaysSpecial.contentEnglish)
                      : formatMarkdown(todaysSpecial.contentEnglish || todaysSpecial.contentHebrew)
                  }}
                />
                
                {/* Floating Settings Button - Bottom Left */}
                <button
                  onClick={() => setShowTodaysSpecialSettings(!showTodaysSpecialSettings)}
                  className="absolute bottom-3 left-3 bg-gradient-feminine text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200"
                  data-testid="button-todays-special-settings"
                >
                  <Settings size={14} />
                </button>
                
                {/* Settings Panel - Above floating button */}
                {showTodaysSpecialSettings && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setShowTodaysSpecialSettings(false)}
                    />
                    <div className="absolute bottom-14 left-3 bg-white rounded-2xl shadow-xl border border-gray-200 p-3 z-50 min-w-[180px]">
                      <div className="space-y-3">
                        {/* Language Toggle */}
                        {hasBothLanguages && (
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1.5 text-center">Language</p>
                            <div className="flex bg-gradient-feminine rounded-xl p-0.5">
                              <button
                                onClick={() => {
                                  setTodaysSpecialLanguage('english');
                                  setShowTodaysSpecialSettings(false);
                                }}
                                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1 ${
                                  todaysSpecialLanguage === 'english' 
                                    ? 'bg-white text-black shadow-sm' 
                                    : 'text-white hover:text-gray-100'
                                }`}
                              >
                                English
                              </button>
                              <button
                                onClick={() => {
                                  setTodaysSpecialLanguage('hebrew');
                                  setShowTodaysSpecialSettings(false);
                                }}
                                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1 ${
                                  todaysSpecialLanguage === 'hebrew' 
                                    ? 'bg-white text-black shadow-sm' 
                                    : 'text-white hover:text-gray-100'
                                }`}
                              >
                                עברית
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Font Size Controls */}
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-1.5 text-center">Font Size</p>
                          <div className="flex items-center justify-center gap-2 bg-gradient-feminine rounded-xl p-1.5">
                            <button
                              onClick={() => setTodaysSpecialFontSize(prev => Math.max(12, prev - 2))}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors shadow-sm"
                            >
                              A-
                            </button>
                            <span className="text-xs text-white font-medium px-1">
                              {todaysSpecialFontSize}px
                            </span>
                            <button
                              onClick={() => setTodaysSpecialFontSize(prev => Math.min(24, prev + 2))}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors shadow-sm"
                            >
                              A+
                            </button>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-2 text-center">Tap outside to close</p>
                    </div>
                  </>
                )}
                
                {/* Floating Link Button - Bottom Right */}
                {todaysSpecial.url && todaysSpecial.linkTitle && (
                  <a
                    href={todaysSpecial.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-3 right-3 bg-gradient-feminine text-white rounded-full px-3 py-1 shadow-lg hover:scale-105 transition-all duration-200 platypi-medium text-xs flex items-center justify-center"
                    data-testid="link-todays-special"
                  >
                    {todaysSpecial.linkTitle}
                  </a>
                )}
              </div>
            )}
          </div>
        )}
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

        {/* Daily Progress Tracker - Redesigned Garden */}
        <div 
          id="daily-progress-garden"
          className="rounded-2xl shadow-lg border border-blush/10 mt-4 min-h-[120px] relative overflow-hidden"
        >
          {/* Time-based background - Layer 0 */}
          <img 
            src={getGardenBackground()} 
            alt="" 
            className="absolute inset-0 w-full h-full z-0"
            style={{ objectFit: 'cover', opacity: 0.4 }}
            loading="lazy"
          />
          
          {/* Flowers with stems - Layer 1 (behind grass) */}
          {flowerPositions
            .slice()
            .sort((a, b) => {
              // Flowers further back (lower in garden) render first
              return a.bottom - b.bottom;
            })
            .map((flower, index) => (
            <img 
              key={`${flower.type}-${index}`}
              src={
                flower.overallIndex === 10 ? milestone10Tree :
                flower.overallIndex === 20 ? milestone20Tree :
                flower.overallIndex === 30 ? milestone30Tree :
                flower.type === 'torah' ? torahFlower : 
                flower.type === 'tefilla' ? tefillaFlower : 
                tzedakaFlower
              } 
              alt={
                flower.overallIndex === 10 ? '10th milestone tree!' :
                flower.overallIndex === 20 ? '20th milestone tree!' :
                flower.overallIndex === 30 ? '30th milestone tree!' :
                `${flower.type} flower`
              } 
              className={`absolute ${
                flower.overallIndex === 10 || flower.overallIndex === 20 || flower.overallIndex === 30 ? 'z-[0]' : 
                flower.type === 'torah' || flower.type === 'tzedaka' ? 'z-[2]' : 
                'z-[1]'
              }`}
              style={{ 
                left: `${flower.left}%`,
                bottom: `${flower.bottom}%`,
                width: flower.overallIndex === 10 || flower.overallIndex === 20 || flower.overallIndex === 30
                  ? '95px'  // Trees are fixed size
                  : `${64 * flower.scale}px`,
                height: 'auto',
                transform: `translateX(-50%)${flower.flipped ? ' scaleX(-1)' : ''}`,
                transformOrigin: 'bottom center'
              }}
              loading="lazy"
            />
          ))}
          
          {/* Grass overlay - Layer 4 (covers all flower stems) */}
          <img 
            src={grassImage} 
            alt="" 
            className="absolute bottom-0 left-0 w-full z-[4]"
            style={{ 
              height: '50%',
              objectFit: 'cover',
              objectPosition: 'bottom'
            }}
            loading="lazy"
          />
          
          {/* Title - Layer 3 (topmost) */}
          <div className="absolute top-2 left-2 z-10">
            <div 
              className="px-2 py-1 rounded-lg"
              style={{
                background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(12px) saturate(180%)',
                WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.4)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
              }}
            >
              <h3 className="platypi-bold text-xs text-black">Daily Mitzvah Garden</h3>
            </div>
          </div>
          
          {/* Info icon - Top right corner */}
          <div className="absolute top-2 right-2 z-10">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: '16px',
                    height: '16px',
                    minWidth: '16px',
                    minHeight: '16px',
                    maxWidth: '16px',
                    maxHeight: '16px',
                    padding: 0,
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(12px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                    border: '1px solid rgba(255,255,255,0.4)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                  data-testid="button-garden-info"
                >
                  <Info style={{ width: '10px', height: '10px' }} className="text-black/60" strokeWidth={2} />
                </button>
              </PopoverTrigger>
              <PopoverContent side="bottom" className="max-w-[200px] text-center p-2">
                <p className="text-xs">Each mitzvah plants a flower in your garden. Reach 10, 20, or 30 mitzvos to grow a special tree.</p>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(HomeSectionComponent);