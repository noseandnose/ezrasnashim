import { Book, Heart, Shield, BookOpen, Star, Scroll, Triangle } from "lucide-react";
import customCandleIcon from "@assets/Untitled design (6)_1755630328619.png";
import { useModalStore, useModalCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import type { Section } from "@/pages/home";

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
  const { isModalComplete } = useModalCompletionStore();
  
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
  const { data: featuredContent, isError: featuredError, isLoading: featuredLoading } = useQuery<{title?: string; content?: string; provider?: string; footnotes?: string}>({
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
      title: 'Learn Shabbas',
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
      contentType: 'text'
    }
  ];

  return (
    <div className="pb-20">
      {/* Spacer for fixed header */}
      <div style={{ height: 'max(52px, calc(env(safe-area-inset-top, 0px) + 42px))' }} />
      
      {/* Main Torah Section - Connected to top bar */}
      <div className="bg-gradient-soft rounded-b-3xl p-3 shadow-lg">
        {/* Daily Inspiration - Pirkei Avot */}
        {(pirkeiAvot || pirkeiError) && (
          <div className="bg-white/70 rounded-2xl p-3 mb-3 border border-blush/10"
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
            </div>
            <p className="koren-siddur-english text-base text-black font-bold leading-relaxed text-justify">
              {pirkeiError ? (
                <span className="text-sm text-black/60 platypi-regular">Daily inspiration temporarily unavailable. Please check back later.</span>
              ) : (
                pirkeiAvot?.text || 'Loading...'
              )}
            </p>
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
                hasContent = !!featuredContent?.content && !isError;
                if (hasContent && !isCompleted && featuredContent) {
                  readingTime = calculateReadingTime(featuredContent.content || '');
                  const camelCaseTitle = toCamelCase(featuredContent.title || '');
                  displaySubtitle = camelCaseTitle || 'Special Topics';
                } else if (isError) {
                  displaySubtitle = 'Temporarily unavailable';
                } else if (isLoading) {
                  displaySubtitle = 'Loading...';
                }
                // Always show text indicator for featured content
                contentType = hasContent ? 'text' : contentType;
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
                {/* Content Type Indicator */}
                {contentType && hasContent && (
                  <div className="absolute top-2 left-2 bg-white text-black text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                    {contentType === 'audio' ? (
                      <Triangle className="w-2.5 h-2.5 fill-current rotate-90" />
                    ) : (
                      <span className="platypi-bold text-xs">T</span>
                    )}
                  </div>
                )}
                
                <div className={`${isCompleted ? 'bg-sage' : hasContent ? iconBg : 'bg-gray-300'} p-2 rounded-full mx-auto mb-2 w-fit`}>
                  {id === 'halacha' ? (
                    <img 
                      src={customCandleIcon} 
                      alt="Learn Shabbas" 
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

        {/* Parsha Vort Bars - Support multiple shiurim with date validation */}
        {(() => {
          // Filter vorts to only show currently active ones based on date range
          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
          const activeVorts = (Array.isArray(parshaVorts) ? parshaVorts.filter(parsha => {
            if (!parsha.fromDate || !parsha.untilDate) return false;
            return today >= parsha.fromDate && today <= parsha.untilDate;
          }) : []) || [];

          return activeVorts.length > 0 ? (
            // Render multiple bars for each available shiur
            activeVorts.map((parsha, index) => (
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
                    <h3 className="platypi-bold text-sm text-black">
                      {parsha?.hebrew_parsha || parsha?.parsha || 'Parsha Shiur'}
                    </h3>
                    <p className="platypi-regular text-xs text-black/60">
                      {parsha?.title || 'Weekly Torah insight'}
                      {parsha?.speaker && ` • ${parsha.speaker}`}
                    </p>
                  </div>
                  <div className="bg-white text-black text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                    <Triangle className="w-2.5 h-2.5 fill-current rotate-90" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Show single "Coming Soon" bar when no shiurim available
            <div className="w-full bg-white rounded-2xl p-3 shadow-lg border border-blush/10 mb-3 relative">
              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center z-10">
                <div className="bg-white/90 rounded-xl px-4 py-2 shadow-lg">
                  <p className="platypi-bold text-sm text-black">Coming Soon</p>
                </div>
              </div>
              
              {/* Content (unclickable) */}
              <div className="flex items-center gap-3 opacity-60 cursor-not-allowed">
                <div className="bg-gray-300 p-2 rounded-full">
                  <BookOpen className="text-gray-500" size={16} strokeWidth={1.5} />
                </div>
                <div className="text-left flex-grow">
                  <h3 className="platypi-bold text-sm text-black">Parsha Shiur</h3>
                  <p className="platypi-regular text-xs text-black/60">Weekly Torah insight</p>
                </div>
                <div className="bg-gray-200 text-gray-500 text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                  <Triangle className="w-2.5 h-2.5 fill-current rotate-90" />
                </div>
              </div>
            </div>
          );
        })()}

        {/* Bottom padding */}
        <div className="h-16"></div>
      </div>
    </div>
  );
}
