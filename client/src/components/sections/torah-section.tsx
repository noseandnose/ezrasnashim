import { Book, Heart, Shield, BookOpen, Scroll, Triangle, Check, Video, Star, ChevronRight, GraduationCap } from "lucide-react";
import customCandleIcon from "@assets/Untitled design (6)_1755630328619.png";
import { useModalStore, useModalCompletionStore, useDailyCompletionStore } from "@/lib/types";
import { useJewishTimes } from "@/hooks/use-jewish-times";

// TEMPORARY: Section background images
import sectionMorningBg from "@assets/Morning_Background_1767032607494.png";
import sectionAfternoonBg from "@assets/Afternoon_Background_1767032607493.png";
import sectionNightBg from "@assets/background_night_1767034895431.png";
import type { Section } from "@/pages/home";
import { useState, useRef, useCallback, memo } from "react";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import { useTrackModalComplete } from "@/hooks/use-analytics";
import { useTorahSummary } from "@/hooks/use-torah-summary";

// Convert string to camel case
const toCamelCase = (str: string): string => {
  if (!str) return '';
  return str.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

interface TorahSectionProps {
  onSectionChange?: (section: Section) => void;
}

function TorahSectionComponent({}: TorahSectionProps) {
  const { openModal } = useModalStore();
  const markModalComplete = useModalCompletionStore(state => state.markModalComplete);
  const isModalComplete = useModalCompletionStore(state => state.isModalComplete);
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);
  const [pirkeiAvotExpanded, setPirkeiAvotExpanded] = useState(false);
  const pirkeiExpandButtonRef = useRef<HTMLButtonElement>(null);
  
  // Get Jewish times for isAfterTzais check
  const { data: jewishTimes } = useJewishTimes();
  
  // TEMPORARY: Check if current time is after tzais hakochavim (nightfall)
  const isAfterTzais = () => {
    const tzaisStr = jewishTimes?.tzaitHakochavim;
    if (!tzaisStr) return new Date().getHours() >= 18; // Fallback to 6 PM
    const now = new Date();
    const match = tzaisStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return now.getHours() >= 18;
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3]?.toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    else if (period === 'AM' && hours === 12) hours = 0;
    else if (!period && hours < 12) hours += 12; // 24-hour format fallback
    const tzaisTime = new Date(now);
    tzaisTime.setHours(hours, minutes, 0, 0);
    return now >= tzaisTime;
  };

  // TEMPORARY: Get time-appropriate background for main section
  const getSectionBackground = () => {
    const hour = new Date().getHours();
    if (hour < 12) return sectionMorningBg;
    if (isAfterTzais()) return sectionNightBg;
    return sectionAfternoonBg;
  };
    
  // Toggle handler for Pirkei Avot expand button
  const handlePirkeiAvotToggle = useCallback((event?: React.MouseEvent | { stopPropagation?: () => void }) => {
    if (event?.stopPropagation) {
      event.stopPropagation();
    }
    setPirkeiAvotExpanded(prev => !prev);
  }, []);
  
  // Fetch all Torah content in a single batched request
  const { data: torahSummary, isLoading: torahLoading } = useTorahSummary();
  
  // Extract data from the batched response
  const pirkeiAvot = torahSummary?.pirkeiAvot;
  const parshaVorts = torahSummary?.parshaVorts || [];
  const halachaContent = torahSummary?.halacha;
  const chizukContent = torahSummary?.chizuk;
  const emunaContent = torahSummary?.emuna;
  const featuredContent = torahSummary?.featured;
  const torahClasses = torahSummary?.torahClasses || [];
  const gemsOfGratitude = torahSummary?.gemsOfGratitude;
  
  // Extract per-section errors for UI fallbacks
  const sectionErrors = torahSummary?.errors || {};

  // Get the first available Torah class for display
  const currentTorahClass = torahClasses?.[0];

  // Handle direct fullscreen opening for specific modals (bypassing modal completely)
  const handleDirectFullscreen = (modalType: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Open modal first to trigger state and data loading, then the modal will auto-redirect to fullscreen
    openModal(modalType, 'torah');
  };

  // Handle Pirkei Avot completion
  const handlePirkeiAvotComplete = () => {
    // Guard: Only allow completion if already completed (no-op) or if content exists
    if (isModalComplete('pirkei-avot')) {
      return; // Already completed, do nothing
    }
    
    // Guard: Require Pirkei Avot content to be loaded
    if (!pirkeiAvot?.text) {
      return; // No content available, don't allow completion
    }
    
    trackModalComplete('pirkei-avot');
    markModalComplete('pirkei-avot');
    completeTask('torah');
    setShowHeartExplosion(true);
    
    setTimeout(() => {
      setShowHeartExplosion(false);
      
      // Check if all tasks are completed and show congratulations
      if (checkAndShowCongratulations()) {
        openModal('congratulations', 'torah');
      }
    }, 1000);
  };

  const torahItems = [
    {
      id: 'chizuk',
      icon: Heart,
      title: 'Daily Chizuk',
      subtitle: '5 minute inspiration',
      gradient: 'bg-white',
      iconBg: 'bg-gradient-feminine',
      iconColor: 'text-white',
      border: 'border-blush/10',
      contentType: 'audio'
    },
    {
      id: 'emuna',
      icon: Shield,
      title: 'Daily Emuna',
      subtitle: 'Faith & Trust',
      gradient: 'bg-white',
      iconBg: 'bg-gradient-feminine',
      iconColor: 'text-white',
      border: 'border-blush/10',
      contentType: 'audio'
    },
    {
      id: 'halacha',
      icon: Book,
      title: 'Learn Shabbos',
      subtitle: 'Halachic insights',
      gradient: 'bg-white',
      iconBg: 'bg-gradient-feminine',
      iconColor: 'text-white',
      border: 'border-blush/10',
      contentType: 'text'
    },
    {
      id: 'speakers',
      icon: BookOpen,
      title: 'Parsha Inspiration',
      subtitle: 'Weekly Torah wisdom',
      gradient: 'bg-white',
      iconBg: 'bg-gradient-feminine',
      iconColor: 'text-white',
      border: 'border-blush/10',
      contentType: 'dynamic' // Will be determined based on content
    }
  ];

  return (
    <div className="pb-20 relative overflow-hidden min-h-screen" data-bridge-container>
      {/* TEMPORARY: Full page background image */}
      <img 
        src={getSectionBackground()} 
        alt="" 
        aria-hidden="true"
        className="fixed inset-0 w-full h-full object-cover pointer-events-none"
        style={{ zIndex: 0, opacity: 0.3 }}
      />
      
      {/* Main Torah Section */}
      <div 
        className="rounded-b-3xl p-3 relative"
        style={{
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          zIndex: 2
        }}
      >
        {/* Daily Inspiration - Pirkei Avot */}
        {(pirkeiAvot || sectionErrors.pirkeiAvot || (!torahLoading && torahSummary)) && (
          <div className="bg-white/85 rounded-2xl p-3 mb-3 border border-blush/10 relative"
               style={{
                 animation: 'gentle-glow-pink 3s ease-in-out infinite'
               }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-feminine p-1.5 rounded-full">
                <Scroll className="text-white" size={16} />
              </div>
              <h3 className="platypi-bold text-sm text-black">Pirkei Avot</h3>
              {pirkeiAvot && (
                <span className="text-xs text-black/60 platypi-regular">{pirkeiAvot.source?.replace('.', ':') || ''}</span>
              )}
              
              {/* Complete Button */}
              <button
                onClick={handlePirkeiAvotComplete}
                disabled={isModalComplete('pirkei-avot') || !pirkeiAvot?.text}
                className={`ml-auto px-3 py-1 rounded-lg text-xs platypi-medium transition-all ${
                  isModalComplete('pirkei-avot')
                    ? 'bg-sage text-white cursor-not-allowed'
                    : !pirkeiAvot?.text
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-feminine text-white hover:scale-105 active:scale-95'
                }`}
                data-testid="button-complete-pirkei-avot"
              >
                {isModalComplete('pirkei-avot') ? (
                  <span className="flex items-center gap-1">
                    <Check size={14} />
                    Done
                  </span>
                ) : (
                  'Complete'
                )}
              </button>
            </div>
            {sectionErrors.pirkeiAvot || (!pirkeiAvot && !torahLoading) ? (
              <p className="text-sm text-black/60 platypi-regular">Daily inspiration temporarily unavailable. Please check back later.</p>
            ) : (
              <div className="relative">
                <p 
                  className="koren-siddur-english text-base text-black font-bold leading-relaxed text-justify"
                  dir="auto"
                  style={{ unicodeBidi: 'plaintext' }}
                >
                  {!pirkeiAvot?.text ? 'Loading...' : 
                    pirkeiAvot.text.length > 250 && !pirkeiAvotExpanded 
                      ? pirkeiAvot.text.slice(0, 250) + '...' 
                      : pirkeiAvot.text
                  }
                </p>
                {pirkeiAvot?.text && pirkeiAvot.text.length > 250 && (
                  <button
                    ref={pirkeiExpandButtonRef}
                    onClick={handlePirkeiAvotToggle}
                    className="absolute -bottom-1 right-0 bg-gradient-feminine rounded-full shadow-sm hover:scale-110 transition-transform p-0 overflow-visible"
                    style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px', padding: 0 }}
                    data-testid="button-toggle-pirkei-avot"
                  >
                    <svg 
                      width="10" 
                      height="10" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="black" 
                      strokeWidth="4" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                    >
                      <polyline points={pirkeiAvotExpanded ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Torah Classes Bar - Only shown when content exists */}
        {currentTorahClass && (
          <button 
            onClick={() => openModal('torah-class', 'torah')}
            className="w-full bg-white/80 rounded-xl mt-3 overflow-hidden border border-blush/20 p-3 text-left hover:bg-white/90 transition-colors"
            style={{ animation: 'gentle-glow-pink 3s ease-in-out infinite' }}
            data-testid="button-torah-class"
          >
            <div className="flex items-center gap-3">
              {/* Image or Icon with completion state */}
              {currentTorahClass.imageUrl ? (
                <img 
                  src={currentTorahClass.imageUrl} 
                  alt={currentTorahClass.title} 
                  className="w-10 h-10 rounded-xl object-cover"
                  loading="lazy"
                />
              ) : (
                <div className={`p-2 rounded-full ${isModalComplete('torah-class') ? 'bg-sage' : 'bg-gradient-feminine'}`}>
                  <GraduationCap className="text-white" size={16} />
                </div>
              )}
              
              {/* Title and Subtitle */}
              <div className="flex-grow">
                <h3 className="platypi-bold text-sm text-black">{currentTorahClass.title}</h3>
                <p className="platypi-regular text-xs text-black/70">
                  {isModalComplete('torah-class') ? 'Completed' : (currentTorahClass.subtitle || '')}
                </p>
              </div>
              
              {/* Checkmark when completed, arrow when not */}
              {isModalComplete('torah-class') ? (
                <Check className="text-sage" size={18} />
              ) : (
                <ChevronRight className="text-black/40" size={18} />
              )}
            </div>
          </button>
        )}

      </div>

      {/* Daily Torah Content - 2x2 Grid with Apple Glass Style */}
      <div className="p-2 grid grid-cols-2 gap-2">
          {torahItems.map(({ id, icon: Icon, title, subtitle }) => {
            const modalId = id === 'speakers' ? 'parsha-vort' : id;
            const isCompleted = isModalComplete(modalId);
            
            let hasContent = false;
            let displaySubtitle = subtitle;
            let isError = false;
            let isLoading = false;
            
            switch(id) {
              case 'halacha':
                isError = !!sectionErrors.halacha;
                isLoading = torahLoading;
                hasContent = !!halachaContent?.content && !isError;
                if (hasContent && !isCompleted && halachaContent) {
                  const camelCaseTitle = toCamelCase(halachaContent.title || '');
                  displaySubtitle = camelCaseTitle || 'Learn Shabbos';
                } else if (isError) {
                  displaySubtitle = 'Unavailable';
                } else if (isLoading) {
                  displaySubtitle = 'Loading...';
                }
                break;
              case 'chizuk':
                isError = !!sectionErrors.chizuk;
                isLoading = torahLoading;
                hasContent = !!chizukContent?.audioUrl && !isError;
                if (hasContent && !isCompleted && chizukContent) {
                  displaySubtitle = toCamelCase(chizukContent.title || '') || subtitle;
                } else if (isError) {
                  displaySubtitle = 'Unavailable';
                } else if (isLoading) {
                  displaySubtitle = 'Loading...';
                }
                break;
              case 'emuna':
                isError = !!sectionErrors.emuna;
                isLoading = torahLoading;
                hasContent = !!emunaContent?.audioUrl && !isError;
                if (hasContent && !isCompleted && emunaContent) {
                  displaySubtitle = toCamelCase(emunaContent.title || '') || subtitle;
                } else if (isError) {
                  displaySubtitle = 'Unavailable';
                } else if (isLoading) {
                  displaySubtitle = 'Loading...';
                }
                break;
              case 'speakers':
                const todayStr = new Date().toISOString().split('T')[0];
                const activeVortsForButton = (Array.isArray(parshaVorts) ? parshaVorts.filter(parsha => {
                  if (!parsha.fromDate || !parsha.untilDate) return false;
                  return todayStr >= parsha.fromDate && todayStr <= parsha.untilDate;
                }) : []) || [];
                const firstVort = activeVortsForButton[0];
                
                isError = !!sectionErrors.parshaVorts;
                isLoading = torahLoading;
                hasContent = activeVortsForButton.length > 0 && !isError;
                if (hasContent && !isCompleted && firstVort) {
                  displaySubtitle = firstVort.speaker ? `by ${firstVort.speaker}` : 'Weekly Torah wisdom';
                } else if (isError) {
                  displaySubtitle = 'Unavailable';
                } else if (isLoading) {
                  displaySubtitle = 'Loading...';
                }
                break;
            }
            
            const showComingSoon = !hasContent && !isLoading && !isError;
            
            return (
              <button
                key={id}
                className={`w-full h-full rounded-xl p-3 text-center transition-all duration-300 relative ${
                  !hasContent ? 'cursor-not-allowed opacity-60' : 'hover:scale-105'
                }`}
                style={{
                  background: hasContent ? 'rgba(255, 255, 255, 0.85)' : 'rgba(200, 200, 200, 0.5)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                }}
                onClick={(event) => {
                  if (!hasContent) return;
                  
                  if (id === 'halacha') {
                    handleDirectFullscreen(id, event);
                  } else if (id === 'speakers') {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const activeVortsForClick = (Array.isArray(parshaVorts) ? parshaVorts.filter(parsha => {
                      if (!parsha.fromDate || !parsha.untilDate) return false;
                      return todayStr >= parsha.fromDate && todayStr <= parsha.untilDate;
                    }) : []) || [];
                    if (activeVortsForClick[0]) {
                      openModal('parsha-vort', 'torah', undefined, activeVortsForClick[0].id);
                    }
                  } else {
                    // For other content types, use regular modal
                    openModal(id, 'torah');
                  }
                }}
                disabled={!hasContent}
                data-modal-type={id}
                data-modal-section="torah"
                data-testid={`button-torah-${id}`}
              >
                {/* Coming Soon Overlay */}
                {showComingSoon && (
                  <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center z-10">
                    <div className="bg-white/90 rounded-xl px-3 py-1.5 shadow-lg">
                      <p className="platypi-bold text-xs text-black">Coming Soon</p>
                    </div>
                  </div>
                )}
                
                {/* Icon + Title Badge (like home page prayer buttons) */}
                <div 
                  className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full mb-1"
                  style={{
                    background: isCompleted 
                      ? 'rgba(139, 169, 131, 0.35)'
                      : hasContent 
                        ? 'linear-gradient(135deg, rgba(232, 180, 188, 0.35) 0%, rgba(200, 162, 200, 0.35) 100%)'
                        : 'rgb(209, 213, 219)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                  }}
                >
                  {id === 'halacha' ? (
                    <img 
                      src={customCandleIcon} 
                      alt="" 
                      className="w-[10px] h-[10px] object-contain"
                      loading="lazy"
                    />
                  ) : isCompleted ? (
                    <Check className="text-black" size={10} />
                  ) : (
                    <Icon className="text-black" size={10} />
                  )}
                  <p className="platypi-bold text-[10px] text-black">{title}</p>
                </div>
                
                {/* Subtitle */}
                <p className={`platypi-bold text-xs leading-tight ${!hasContent ? 'text-gray-400' : 'text-black'}`}>
                  {isCompleted ? 'Completed' : displaySubtitle}
                </p>
              </button>
            );
          })}
      </div>

      {/* Full-width bars section */}
      <div className="p-2 space-y-2">
        {/* Inspiration Hub Bar - Uses featured content */}
        {(() => {
          const hasVideo = !!featuredContent?.videoUrl;
          const hasAudio = !!featuredContent?.audioUrl;
          const hasText = !!featuredContent?.content;
          const hasAnyContent = hasVideo || hasAudio || hasText;

          return hasAnyContent ? (
            <div className="w-full bg-white rounded-2xl p-3 shadow-lg border border-blush/10 mb-3 relative">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={(event) => {
                  handleDirectFullscreen('featured', event);
                }}
                data-modal-type="featured"
                data-modal-section="torah"
                data-testid="button-shmirat-halashon-bar"
              >
                <div className="bg-gradient-feminine p-2 rounded-full">
                  <Star className="text-white" size={16} strokeWidth={1.5} />
                </div>
                <div className="text-left flex-grow">
                  <h3 className="platypi-bold text-sm text-black">Inspiration Hub</h3>
                  <p className="platypi-regular text-xs text-black/60">
                    {featuredContent?.title ? toCamelCase(featuredContent.title) : 'Special Topics'}
                  </p>
                </div>
                {/* Dynamic content type icon */}
                <div className="bg-white text-black text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                  {hasVideo ? (
                    <Video className="w-2.5 h-2.5" />
                  ) : hasAudio ? (
                    <Triangle className="w-2.5 h-2.5 fill-current rotate-90" />
                  ) : hasText ? (
                    <span className="platypi-bold text-xs">T</span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null;
        })()}

        {/* Gems of Gratitude Button - Only show when database content exists */}
        {gemsOfGratitude && (
          <button
            onClick={() => openModal('gems-of-gratitude', 'torah')}
            className="w-full rounded-xl overflow-hidden border transition-colors text-left mb-3 bg-white/80 border-blush/20"
            data-testid="button-gems-of-gratitude"
          >
            <div className="flex items-center gap-3 p-3">
              {/* Icon */}
              <div className={`p-2 rounded-full ${
                isModalComplete('gems-of-gratitude') ? 'bg-sage' : 'bg-gradient-feminine'
              }`}>
                <Star className="text-white" size={16} />
              </div>
              
              {/* Title and Subtitle */}
              <div className="flex-grow">
                <h3 className="platypi-bold text-sm text-black">Gems of Gratitude</h3>
                <p className="platypi-regular text-xs text-black/70">Daily Inspiring Thoughts</p>
              </div>
              
              {/* Arrow or Checkmark */}
              {isModalComplete('gems-of-gratitude') ? (
                <Check className="text-sage" size={18} />
              ) : (
                <ChevronRight className="text-black/40" size={18} />
              )}
            </div>
          </button>
        )}

        {/* Bottom padding */}
        <div className="h-16"></div>
      </div>

      {/* Heart Explosion Animation */}
      <HeartExplosion 
        trigger={showHeartExplosion}
        onComplete={() => setShowHeartExplosion(false)} 
      />
    </div>
  );
}

export default memo(TorahSectionComponent);
