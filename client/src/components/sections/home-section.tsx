import { Clock, Heart, BookOpen, HandHeart, Coins, MapPin, Sunrise, Sun, Moon, Sparkles, Settings, Plus, Minus } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import { useJewishTimes, useGeolocation } from "@/hooks/use-jewish-times";
import { useHebrewDateWithShkia } from "@/hooks/use-hebrew-date";
import { useHomeSummary } from "@/hooks/use-home-summary";
import HeartProgress from "@/components/heart-progress";
import type { Section } from "@/pages/home";
import { useMemo } from "react";
import { getLocalDateString } from "@/lib/dateUtils";
import DOMPurify from "dompurify";
import grassImage from "@assets/Daily_Progress_Garden_(5)_1766474472398.png";
import torahFlower from "@assets/Torah_1766474274420.png";
import tefillaFlower from "@assets/Tefilla_1766474274425.png";
import tzedakaFlower from "@assets/Tzedaka_1766474274426.png";

interface HomeSectionProps {
  onSectionChange?: (section: Section) => void;
}

export default function HomeSection({ onSectionChange }: HomeSectionProps) {
  const { openModal } = useModalStore();
  const { torahCompleted, tefillaCompleted, tzedakaCompleted } = useDailyCompletionStore();
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
  // Torah and Tzedaka flowers get priority slots so Tefilla flowers don't cover them
  const flowerPositions = useMemo(() => {
    const positions: { type: 'torah' | 'tefilla' | 'tzedaka'; left: number; bottom: number; flipped: boolean; scale: number }[] = [];
    
    // Seeded random for consistent but varied positions
    let seed = 42;
    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    
    // Flower radius in percentage units (based on w-12 = 48px in ~350px container ≈ 14%)
    const FLOWER_RADIUS = 7;
    // Minimum distance between flower centers (95% of combined radii = max 5% overlap)
    const MIN_DISTANCE_FACTOR = 0.95;
    
    // Check if a position collides with existing flowers (more than 5% overlap)
    const checkCollision = (left: number, bottom: number, scale: number) => {
      const newRadius = FLOWER_RADIUS * scale;
      for (const existing of positions) {
        const existingRadius = FLOWER_RADIUS * existing.scale;
        const minDistance = (newRadius + existingRadius) * MIN_DISTANCE_FACTOR;
        const dx = left - existing.left;
        const dy = bottom - existing.bottom;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) {
          return true; // Collision detected
        }
      }
      return false;
    };
    
    // Helper to add a flower position with collision avoidance
    const addFlower = (type: 'torah' | 'tefilla' | 'tzedaka', index: number) => {
      const scale = 0.40 + (seededRandom() * 0.35); // 0.40 to 0.75 scale (5% bigger, more variation)
      const flipped = seededRandom() > 0.5;
      
      // Try up to 20 times to find a non-colliding position
      for (let attempt = 0; attempt < 20; attempt++) {
        // Random position: right side only (40-92%), lower portion (5-40%)
        const left = 40 + seededRandom() * 52; // 40-92%
        const bottom = 5 + seededRandom() * 35; // 5-40%
        
        if (!checkCollision(left, bottom, scale)) {
          positions.push({ type, left, bottom, flipped, scale });
          return;
        }
      }
      
      // Fallback: place anyway with smaller scale to fit
      const left = 40 + seededRandom() * 52;
      const bottom = 5 + seededRandom() * 35;
      positions.push({ type, left, bottom, flipped, scale: scale * 0.7 });
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

  // Get time-appropriate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Use batched home summary for better performance
  const { data: homeSummary, isLoading: sponsorLoading } = useHomeSummary();
  const sponsor = homeSummary?.sponsor;

  // Today's Special state and data
  const today = new Date().toISOString().split('T')[0];
  const [todaysSpecialExpanded, setTodaysSpecialExpanded] = useState(false);
  const [todaysSpecialLanguage, setTodaysSpecialLanguage] = useState<'english' | 'hebrew'>('hebrew');
  const [todaysSpecialFontSize, setTodaysSpecialFontSize] = useState(16);
  const [showTodaysSpecialSettings, setShowTodaysSpecialSettings] = useState(false);

  const { data: todaysSpecial } = useQuery<{
    title?: string;
    subtitle?: string;
    imageUrl?: string;
    contentEnglish?: string;
    contentHebrew?: string;
    linkTitle?: string;
    url?: string;
  }>({
    queryKey: ['/api/home/todays-special', today],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

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
          <div className="relative">
            <button 
              onClick={() => !currentPrayer.disabled && openModal(currentPrayer.modal, 'tefilla')}
              disabled={currentPrayer.disabled}
              className={`w-full rounded-xl p-3 text-center border transition-all duration-300 ${
                currentPrayer.disabled 
                  ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed' 
                  : 'bg-white/80 border-blush/20 hover:scale-105 hover:bg-white/95'
              }`}
              data-modal-type={currentPrayer.modal}
              data-modal-section="tefilla"
              data-testid="button-home-prayer"
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
              data-modal-type="events"
              data-modal-section="home"
              data-testid="button-home-events"
            >
              <div className="flex items-center justify-center mb-1">
                <div className="bg-gradient-feminine p-1.5 rounded-full">
                  <Clock className="text-white" size={12} />
                </div>
              </div>
              <p className="platypi-bold text-sm text-black mb-0.5">Shkia</p>
              <p className="platypi-bold text-xs text-black">{jewishTimesQuery.data?.shkia || "Loading..."}</p>
            </button>
          </div>
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

        {/* Daily Progress Tracker - Compact Version */}
        <div 
          id="daily-progress-garden"
          className="rounded-2xl shadow-lg border border-blush/10 bg-white mt-4 min-h-[100px] relative overflow-hidden"
        >
          {/* Grass - covers entire section, BEHIND flowers */}
          <img 
            src={grassImage} 
            alt="" 
            className="absolute inset-0 w-full h-full z-[1]"
            style={{ objectFit: 'cover' }}
          />
          
          {/* Flowers - scattered ON TOP of grass */}
          {flowerPositions
            .slice()
            .sort((a, b) => {
              // Flowers further back (higher bottom %) render first, closer ones render on top
              return a.bottom - b.bottom;
            })
            .map((flower, index) => (
            <img 
              key={`${flower.type}-${index}`}
              src={flower.type === 'torah' ? torahFlower : flower.type === 'tefilla' ? tefillaFlower : tzedakaFlower} 
              alt={`${flower.type} flower`} 
              className="absolute w-12 h-12 z-[2]"
              style={{ 
                left: `${flower.left}%`,
                bottom: `${flower.bottom}%`,
                transform: `scale(${flower.scale})${flower.flipped ? ' scaleX(-1)' : ''}`
              }}
            />
          ))}
          
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
        </div>
      </div>
    </div>
  );
}