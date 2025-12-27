import { Book, Heart, Shield, BookOpen, Scroll, Triangle, Check, Video, Star, ChevronRight, GraduationCap } from "lucide-react";
import customCandleIcon from "@assets/Untitled design (6)_1755630328619.png";
import { useModalStore, useModalCompletionStore, useDailyCompletionStore } from "@/lib/types";
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
    <div className="pb-20" data-bridge-container>
      
      {/* Main Torah Section - Connected to top bar */}
      <div 
        className="rounded-b-3xl p-3"
        style={{
          background: 'linear-gradient(180deg, rgba(186,137,160,0.12) 0%, rgba(186,137,160,0.06) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
        }}
      >
        {/* Daily Inspiration - Pirkei Avot */}
        {(pirkeiAvot || sectionErrors.pirkeiAvot || (!torahLoading && torahSummary)) && (
          <div className="bg-white/70 rounded-2xl p-3 mb-3 border border-blush/10 relative"
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
              {/* Image */}
              {currentTorahClass.imageUrl ? (
                <img 
                  src={currentTorahClass.imageUrl} 
                  alt={currentTorahClass.title} 
                  className="w-10 h-10 rounded-xl object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="bg-gradient-feminine p-2 rounded-full">
                  <GraduationCap className="text-white" size={16} />
                </div>
              )}
              
              {/* Title and Subtitle */}
              <div className="flex-grow">
                <h3 className="platypi-bold text-sm text-black">{currentTorahClass.title}</h3>
                {currentTorahClass.subtitle && (
                  <p className="platypi-regular text-xs text-black/70">{currentTorahClass.subtitle}</p>
                )}
              </div>
              
              {/* Arrow indicator */}
              <ChevronRight className="text-black/40" size={18} />
            </div>
          </button>
        )}

        {/* Gems of Gratitude Bar */}
        <div 
          className={`w-full rounded-xl mt-3 overflow-hidden border border-blush/20 p-3 transition-colors ${
            isModalComplete('gems-of-gratitude') ? 'bg-sage/20' : 'bg-white/80'
          }`}
          data-testid="bar-gems-of-gratitude"
        >
          <div className="flex items-center gap-3 mb-3">
            {/* Icon */}
            <div className={`p-2 rounded-full ${
              isModalComplete('gems-of-gratitude') ? 'bg-sage' : 'bg-gradient-feminine'
            }`}>
              <Star className="text-white" size={16} />
            </div>
            
            {/* Title and Subtitle */}
            <div className="flex-grow">
              <h3 className="platypi-bold text-sm text-black">Gems of Gratitude</h3>
              <p className="platypi-regular text-xs text-black/70">Daily Inspiring Thought</p>
            </div>
          </div>
          
          {/* Two Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!isModalComplete('gems-of-gratitude')) {
                  trackModalComplete('gems-of-gratitude');
                  markModalComplete('gems-of-gratitude');
                  completeTask('torah');
                  setShowHeartExplosion(true);
                  setTimeout(() => {
                    setShowHeartExplosion(false);
                    if (checkAndShowCongratulations()) {
                      openModal('congratulations', 'torah');
                    }
                  }, 1000);
                }
              }}
              disabled={isModalComplete('gems-of-gratitude')}
              className={`flex-1 py-2 px-3 rounded-xl text-sm platypi-medium transition-all ${
                isModalComplete('gems-of-gratitude')
                  ? 'bg-sage/30 text-sage cursor-default'
                  : 'bg-gradient-feminine text-white hover:scale-105'
              }`}
              data-testid="button-gems-complete"
            >
              {isModalComplete('gems-of-gratitude') ? 'Completed' : 'Complete'}
            </button>
            <button
              onClick={() => openModal('individual-tehillim', 'tefilla', 100)}
              className="flex-1 py-2 px-3 rounded-xl text-sm platypi-medium bg-lavender/20 text-lavender hover:bg-lavender/30 transition-all"
              data-testid="button-tehillim-100"
            >
              Tehillim 100
            </button>
          </div>
        </div>
      </div>

      {/* Daily Torah Content - Separate Section */}
      <div className="p-2 space-y-1">
        <div className="grid grid-cols-2 gap-2 mb-1">
          {torahItems.map(({ id, icon: Icon, title, subtitle, gradient, iconBg, iconColor, border, contentType }) => {
            const isCompleted = isModalComplete(id);
            
            // Get content for each button
            let hasContent = false;
            let displaySubtitle = subtitle;
            let readingTime = '';
            
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
                  displaySubtitle = 'Temporarily unavailable';
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
                  displaySubtitle = 'Temporarily unavailable';
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
                  displaySubtitle = 'Temporarily unavailable';
                } else if (isLoading) {
                  displaySubtitle = 'Loading...';
                }
                break;
              case 'speakers':
                // Filter vorts to only show currently active ones based on date range
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
                  displaySubtitle = 'Temporarily unavailable';
                } else if (isLoading) {
                  displaySubtitle = 'Loading...';
                }
                // Determine content type dynamically: video > audio > text > none
                if (hasContent && firstVort) {
                  if (firstVort.videoUrl) {
                    contentType = 'video';
                  } else if (firstVort.audioUrl) {
                    contentType = 'audio';
                  } else if (firstVort.content || firstVort.imageUrl) {
                    contentType = 'text';
                  } else {
                    contentType = ''; // No icon if no content
                  }
                } else {
                  contentType = ''; // No icon if no content
                }
                break;
            }
            
            const showComingSoon = !hasContent && !isLoading && !isError;
            
            return (
              <button
                key={id}
                className={`${isCompleted ? 'bg-sage/20' : hasContent ? gradient : 'bg-gray-100'} rounded-3xl p-3 text-center ${hasContent ? 'glow-hover' : ''} transition-gentle shadow-lg border ${hasContent ? border : 'border-gray-200'} relative ${!hasContent ? 'cursor-not-allowed' : ''}`}
                onClick={(event) => {
                  if (!hasContent) return;
                  
                  // For halacha content, open directly in fullscreen
                  if (id === 'halacha') {
                    handleDirectFullscreen(id, event);
                  } else if (id === 'speakers') {
                    // For speakers, open the first available vort
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
                  <div className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center z-10">
                    <div className="bg-white/90 rounded-xl px-3 py-1.5 shadow-lg">
                      <p className="platypi-bold text-xs text-black">Coming Soon</p>
                    </div>
                  </div>
                )}
                
                {/* Content Type Indicator - only show if there's content and a valid type */}
                {contentType && hasContent && (
                  <div className="absolute top-2 left-2 bg-white text-black text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                    {contentType === 'video' ? (
                      <Video className="w-2.5 h-2.5" />
                    ) : contentType === 'audio' ? (
                      <Triangle className="w-2.5 h-2.5 fill-current rotate-90" />
                    ) : contentType === 'text' ? (
                      <span className="platypi-bold text-xs">T</span>
                    ) : null}
                  </div>
                )}
                
                <div className={`${isCompleted ? 'bg-sage' : hasContent ? iconBg : 'bg-gray-300'} p-2 rounded-full mx-auto mb-2 w-fit`}>
                  {id === 'halacha' ? (
                    <img 
                      src={customCandleIcon} 
                      alt="Learn Shabbos" 
                      className={`w-[18px] h-[18px] object-contain ${showComingSoon ? 'opacity-60' : ''}`}
                      loading="lazy"
                    />
                  ) : (
                    <Icon className={`${hasContent ? iconColor : 'text-gray-500'}`} size={18} strokeWidth={1.5} />
                  )}
                </div>
                <h3 className={`platypi-bold text-xs text-black mb-1 tracking-wide ${showComingSoon ? 'opacity-60' : ''}`}>{title}</h3>
                <div className={`platypi-regular text-xs text-black/60 leading-relaxed ${showComingSoon ? 'opacity-60' : ''}`}>
                  {isCompleted ? (
                    'Completed'
                  ) : (
                    <>
                      <div>{displaySubtitle}</div>
                      {readingTime && (
                        <div className="text-xs text-black/50 mt-0.5">({readingTime})</div>
                      )}
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

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
