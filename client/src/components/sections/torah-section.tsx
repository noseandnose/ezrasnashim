import { Book, Heart, Shield, BookOpen, Star, Scroll, Triangle, Check, Video } from "lucide-react";
import customCandleIcon from "@assets/Untitled design (6)_1755630328619.png";
import { useModalStore, useModalCompletionStore, useDailyCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import type { Section } from "@/pages/home";
import { useState } from "react";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import { useTrackModalComplete } from "@/hooks/use-analytics";

// Calculate reading time based on word count (average 200 words per minute)
const calculateReadingTime = (text: string): string => {
  if (!text) return "0 min";
  
  const wordCount = text.trim().split(/\s+/).length;
  const readingTimeMinutes = Math.ceil(wordCount / 200);
  
  if (readingTimeMinutes === 1) {
    return "1 min";
  } else {
    return `${readingTimeMinutes} min`;
  }
};

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

export default function TorahSection({}: TorahSectionProps) {
  const { openModal } = useModalStore();
  const markModalComplete = useModalCompletionStore(state => state.markModalComplete);
  const isModalComplete = useModalCompletionStore(state => state.isModalComplete);
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);
  const [pirkeiAvotExpanded, setPirkeiAvotExpanded] = useState(false);
  
  // Fetch today's Pirkei Avot for daily inspiration
  const today = new Date().toISOString().split('T')[0];
  const { data: pirkeiAvot, isError: pirkeiError } = useQuery<{text: string; chapter: number; source: string}>({
    queryKey: ['/api/torah/pirkei-avot', today],
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Fetch all weekly Parsha vorts to support multiple shiurim
  const { data: parshaVorts } = useQuery<Array<{
    id: number;
    parsha?: string; 
    hebrew_parsha?: string; 
    title?: string; 
    speaker?: string;
    content?: string;
    audioUrl?: string;
    videoUrl?: string;
    imageUrl?: string;
    speakerWebsite?: string;
    thankYouMessage?: string;
    fromDate?: string;
    untilDate?: string;
  }>>({
    queryKey: ['/api/table/vort'],
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 4 * 60 * 60 * 1000 // 4 hours
    // No select - keep all vorts for multiple shiurim support
  });

  // Fetch today's Halacha content for reading time calculation
  const { data: halachaContent, isError: halachaError, isLoading: halachaLoading } = useQuery<{title?: string; content?: string; footnotes?: string}>({
    queryKey: ['/api/torah/halacha', today],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Fetch today's Chizuk content
  const { data: chizukContent, isError: chizukError, isLoading: chizukLoading } = useQuery<{title?: string; audioUrl?: string; speaker?: string}>({
    queryKey: ['/api/torah/chizuk', today],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Fetch today's Emuna content
  const { data: emunaContent, isError: emunaError, isLoading: emunaLoading } = useQuery<{title?: string; audioUrl?: string; speaker?: string}>({
    queryKey: ['/api/torah/emuna', today],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Fetch today's Featured content
  const { data: featuredContent, isError: featuredError, isLoading: featuredLoading } = useQuery<{title?: string; content?: string; audioUrl?: string; videoUrl?: string; provider?: string; footnotes?: string}>({
    queryKey: ['/api/torah/featured', today],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

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
      id: 'featured',
      icon: Star,
      title: 'Shmirat Halashon',
      subtitle: 'Special Topics',
      gradient: 'bg-white',
      iconBg: 'bg-gradient-feminine',
      iconColor: 'text-white',
      border: 'border-blush/10',
      contentType: 'dynamic' // Will be determined based on content
    }
  ];

  return (
    <div className="pb-20">
      
      {/* Main Torah Section - Connected to top bar */}
      <div className="bg-gradient-soft rounded-b-3xl p-3 shadow-lg">
        {/* Daily Inspiration - Pirkei Avot */}
        {(pirkeiAvot || pirkeiError) && (
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
            {pirkeiError ? (
              <p className="text-sm text-black/60 platypi-regular">Daily inspiration temporarily unavailable. Please check back later.</p>
            ) : (
              <div className="relative">
                <p className="koren-siddur-english text-base text-black font-bold leading-relaxed text-justify">
                  {!pirkeiAvot?.text ? 'Loading...' : 
                    pirkeiAvot.text.length > 250 && !pirkeiAvotExpanded 
                      ? pirkeiAvot.text.slice(0, 250) + '...' 
                      : pirkeiAvot.text
                  }
                </p>
                {pirkeiAvot?.text && pirkeiAvot.text.length > 250 && (
                  <button
                    onClick={() => setPirkeiAvotExpanded(!pirkeiAvotExpanded)}
                    className="absolute -bottom-1 right-0 bg-gradient-feminine rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                    style={{ width: '10px', height: '10px' }}
                    data-testid="button-toggle-pirkei-avot"
                  >
                    {pirkeiAvotExpanded ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
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
                isError = halachaError;
                isLoading = halachaLoading;
                hasContent = !!halachaContent?.content && !isError;
                if (hasContent && !isCompleted && halachaContent) {
                  readingTime = calculateReadingTime(halachaContent.content || '');
                  const camelCaseTitle = toCamelCase(halachaContent.title || '');
                  displaySubtitle = camelCaseTitle || 'Learn Shabbos';
                } else if (isError) {
                  displaySubtitle = 'Temporarily unavailable';
                } else if (isLoading) {
                  displaySubtitle = 'Loading...';
                }
                break;
              case 'chizuk':
                isError = chizukError;
                isLoading = chizukLoading;
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
                isError = emunaError;
                isLoading = emunaLoading;
                hasContent = !!emunaContent?.audioUrl && !isError;
                if (hasContent && !isCompleted && emunaContent) {
                  displaySubtitle = toCamelCase(emunaContent.title || '') || subtitle;
                } else if (isError) {
                  displaySubtitle = 'Temporarily unavailable';
                } else if (isLoading) {
                  displaySubtitle = 'Loading...';
                }
                break;
              case 'featured':
                isError = featuredError;
                isLoading = featuredLoading;
                // Check if any content exists (text, audio, or video)
                hasContent = !isError && !!(featuredContent?.content || featuredContent?.audioUrl || featuredContent?.videoUrl);
                if (hasContent && !isCompleted && featuredContent) {
                  const camelCaseTitle = toCamelCase(featuredContent.title || '');
                  displaySubtitle = camelCaseTitle || 'Special Topics';
                  // Calculate reading time only for text content
                  if (featuredContent.content && !featuredContent.audioUrl && !featuredContent.videoUrl) {
                    readingTime = calculateReadingTime(featuredContent.content || '');
                  }
                } else if (isError) {
                  displaySubtitle = 'Temporarily unavailable';
                } else if (isLoading) {
                  displaySubtitle = 'Loading...';
                }
                // Determine content type dynamically: video > audio > text > none
                if (hasContent && featuredContent) {
                  if (featuredContent.videoUrl) {
                    contentType = 'video';
                  } else if (featuredContent.audioUrl) {
                    contentType = 'audio';
                  } else if (featuredContent.content) {
                    contentType = 'text';
                  } else {
                    contentType = ''; // No icon if no content
                  }
                } else {
                  contentType = ''; // No icon if no content
                }
                break;
            }
            
            return (
              <button
                key={id}
                className={`${isCompleted ? 'bg-sage/20' : hasContent ? gradient : 'bg-gray-100'} rounded-3xl p-3 text-center ${hasContent ? 'glow-hover' : ''} transition-gentle shadow-lg border ${hasContent ? border : 'border-gray-200'} relative ${!hasContent ? 'cursor-not-allowed' : ''}`}
                onClick={(event) => {
                  if (!hasContent) return;
                  
                  // For halacha and featured content, open directly in fullscreen
                  if (id === 'halacha' || id === 'featured') {
                    handleDirectFullscreen(id, event);
                  } else {
                    // For other content types, use regular modal
                    openModal(id, 'torah');
                  }
                }}
                disabled={!hasContent}
              >
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
                      className="w-[18px] h-[18px] object-contain"
                    />
                  ) : (
                    <Icon className={`${hasContent ? iconColor : 'text-gray-500'}`} size={18} strokeWidth={1.5} />
                  )}
                </div>
                <h3 className="platypi-bold text-xs text-black mb-1 tracking-wide">{title}</h3>
                <div className="platypi-regular text-xs text-black/60 leading-relaxed">
                  {isCompleted ? (
                    'Completed'
                  ) : !hasContent && !isLoading && !isError ? (
                    'Coming Soon'
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

        {/* Featured Speaker Bars - Support multiple shiurim with date validation */}
        {(() => {
          // Filter vorts to only show currently active ones based on date range
          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
          const activeVorts = (Array.isArray(parshaVorts) ? parshaVorts.filter(parsha => {
            if (!parsha.fromDate || !parsha.untilDate) return false;
            return today >= parsha.fromDate && today <= parsha.untilDate;
          }) : []) || [];

          return activeVorts.length > 0 ? (
            // Render multiple bars for each available shiur
            activeVorts.map((parsha, index) => {
              // Determine content type for dynamic icon
              const hasVideo = !!parsha?.videoUrl;
              const hasAudio = !!parsha?.audioUrl;
              const hasText = !!parsha?.content || !!parsha?.imageUrl;
              const hasAnyContent = hasVideo || hasAudio || hasText;
              
              return (
                <div key={parsha.id || index} className="w-full bg-white rounded-2xl p-3 shadow-lg border border-blush/10 mb-3 relative">
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => {
                      if (parsha?.title || parsha?.audioUrl) {
                        openModal('parsha-vort', 'torah', undefined, parsha.id);
                      }
                    }}
                  >
                    <div className="bg-gradient-feminine p-2 rounded-full">
                      <BookOpen className="text-white" size={16} strokeWidth={1.5} />
                    </div>
                    <div className="text-left flex-grow">
                      <h3 className="platypi-bold text-sm text-black">Featured Speakers</h3>
                      <p className="platypi-regular text-xs text-black/60">
                        Daily Torah Inspiration
                        {parsha?.speaker && ` • ${parsha.speaker}`}
                      </p>
                    </div>
                    {/* Dynamic content type icon - only show if there's content */}
                    {hasAnyContent && (
                      <div className="bg-white text-black text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                        {hasVideo ? (
                          <Video className="w-2.5 h-2.5" />
                        ) : hasAudio ? (
                          <Triangle className="w-2.5 h-2.5 fill-current rotate-90" />
                        ) : hasText ? (
                          <span className="platypi-bold text-xs">T</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            // Show single "Coming Soon" bar when no content available
            <div className="w-full bg-white rounded-2xl p-3 shadow-lg border border-blush/10 mb-3 relative">
              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center z-10">
                <div className="bg-white/90 rounded-xl px-4 py-2 shadow-lg">
                  <p className="platypi-bold text-sm text-black">Coming Soon</p>
                </div>
              </div>
              
              {/* Content (unclickable) - no play icon when no content */}
              <div className="flex items-center gap-3 opacity-60 cursor-not-allowed">
                <div className="bg-gray-300 p-2 rounded-full">
                  <BookOpen className="text-gray-500" size={16} strokeWidth={1.5} />
                </div>
                <div className="text-left flex-grow">
                  <h3 className="platypi-bold text-sm text-black">Featured Speakers</h3>
                  <p className="platypi-regular text-xs text-black/60">Daily Torah Inspiration</p>
                </div>
                {/* No play icon when there's no content */}
              </div>
            </div>
          );
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
