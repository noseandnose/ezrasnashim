import { Book, Heart, Play, Shield, BookOpen, Sparkles, Star, Scroll, Triangle } from "lucide-react";
import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
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

export default function TorahSection({ onSectionChange }: TorahSectionProps) {
  const { openModal } = useModalStore();
  const { torahCompleted } = useDailyCompletionStore();
  const { isModalComplete } = useModalCompletionStore();
  
  // Fetch today's Pirkei Avot for daily inspiration
  const today = new Date().toISOString().split('T')[0];
  const { data: pirkeiAvot } = useQuery<{text: string; chapter: number; source: string}>({
    queryKey: ['/api/torah/pirkei-avot', today],
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000 // 1 hour
  });

  // Fetch weekly Parsha vort using current date
  const { data: parshaContent } = useQuery<{parsha?: string; hebrew_parsha?: string; title?: string; speaker?: string}>({
    queryKey: ['/api/table/vort'],
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 4 * 60 * 60 * 1000 // 4 hours
  });

  // Fetch today's Halacha content for reading time calculation
  const { data: halachaContent } = useQuery<{title?: string; content?: string; footnotes?: string}>({
    queryKey: ['/api/torah/halacha', today],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000 // 30 minutes
  });

  // Fetch today's Chizuk content
  const { data: chizukContent } = useQuery<{title?: string; audioUrl?: string; speaker?: string}>({
    queryKey: ['/api/torah/chizuk', today],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  // Fetch today's Emuna content
  const { data: emunaContent } = useQuery<{title?: string; audioUrl?: string; speaker?: string}>({
    queryKey: ['/api/torah/emuna', today],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  // Fetch today's Featured content
  const { data: featuredContent } = useQuery<{title?: string; content?: string; provider?: string; footnotes?: string}>({
    queryKey: ['/api/torah/featured', today],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

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
    <div className="overflow-y-auto h-full pb-20">
      {/* Main Torah Section - Connected to top bar */}
      <div className="bg-gradient-soft rounded-b-3xl p-3 shadow-lg">
        {/* Daily Inspiration - Pirkei Avot */}
        {pirkeiAvot && (
          <div className="bg-white/70 rounded-2xl p-3 mb-3 border border-blush/10">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-feminine p-1.5 rounded-full">
                <Scroll className="text-white" size={16} />
              </div>
              <h3 className="platypi-bold text-sm text-black">Pirkei Avot</h3>
              <span className="text-xs text-black/60 platypi-regular">{pirkeiAvot.source.replace('.', ':')}</span>
            </div>
            <p className="koren-siddur-english text-base text-black font-bold leading-relaxed text-justify">
              {pirkeiAvot.text}
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
            let content = null;
            let hasContent = false;
            let displaySubtitle = subtitle;
            
            switch(id) {
              case 'halacha':
                content = halachaContent;
                hasContent = !!halachaContent?.content;
                if (hasContent && !isCompleted && halachaContent) {
                  const readingTime = calculateReadingTime(halachaContent.content || '');
                  const camelCaseTitle = toCamelCase(halachaContent.title || '');
                  displaySubtitle = camelCaseTitle ? 
                    `${camelCaseTitle} (${readingTime})` : 
                    `Learn Shabbos (${readingTime})`;
                }
                break;
              case 'chizuk':
                content = chizukContent;
                hasContent = !!chizukContent?.audioUrl;
                if (hasContent && !isCompleted && chizukContent) {
                  displaySubtitle = toCamelCase(chizukContent.title || '') || subtitle;
                }
                break;
              case 'emuna':
                content = emunaContent;
                hasContent = !!emunaContent?.audioUrl;
                if (hasContent && !isCompleted && emunaContent) {
                  displaySubtitle = toCamelCase(emunaContent.title || '') || subtitle;
                }
                break;
              case 'featured':
                content = featuredContent;
                hasContent = !!featuredContent?.content;
                if (hasContent && !isCompleted && featuredContent) {
                  const readingTime = calculateReadingTime(featuredContent.content || '');
                  const camelCaseTitle = toCamelCase(featuredContent.title || '');
                  displaySubtitle = camelCaseTitle ? 
                    `${camelCaseTitle} (${readingTime})` : 
                    `Special Topics (${readingTime})`;
                }
                // Always show text indicator for featured content
                contentType = hasContent ? 'text' : contentType;
                break;
            }
            
            return (
              <button
                key={id}
                className={`${isCompleted ? 'bg-sage/20' : hasContent ? gradient : 'bg-gray-100'} rounded-3xl p-3 text-center ${hasContent ? 'glow-hover' : ''} transition-gentle shadow-lg border ${hasContent ? border : 'border-gray-200'} relative ${!hasContent ? 'cursor-not-allowed' : ''}`}
                onClick={() => hasContent && openModal(id, 'torah')}
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
                  <Icon className={`${hasContent ? iconColor : 'text-gray-500'}`} size={18} strokeWidth={1.5} />
                </div>
                <h3 className="platypi-bold text-xs text-black mb-1 tracking-wide">{title}</h3>
                <p className="platypi-regular text-xs text-black/60 leading-relaxed">
                  {!hasContent ? 'Coming Soon' : isCompleted ? 'Completed' : displaySubtitle}
                </p>
              </button>
            );
          })}
        </div>

        {/* Shabbas Vort Bonus Bar - Coming Soon */}
        <div className="w-full bg-white rounded-2xl p-3 shadow-lg border border-blush/10 mb-3 relative">
          {/* Coming Soon Overlay */}
          <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center z-10">
            <div className="bg-white/90 rounded-xl px-4 py-2 shadow-lg">
              <p className="platypi-bold text-sm text-black">Coming Soon</p>
            </div>
          </div>
          
          {/* Content (grayed out) */}
          <div className="flex items-center gap-3 opacity-60">
            <div className="bg-gradient-feminine p-2 rounded-full">
              <BookOpen className="text-white" size={16} strokeWidth={1.5} />
            </div>
            <div className="text-left flex-grow">
              <h3 className="platypi-bold text-sm text-black">
                {parshaContent?.hebrew_parsha || parshaContent?.parsha || 'Parsha Shiur'}
              </h3>
              <p className="platypi-regular text-xs text-black/60">
                {parshaContent?.title || 'Weekly Torah insight'}
                {parshaContent?.speaker && ` • ${parshaContent.speaker}`}
              </p>
            </div>
            <div className="bg-white text-black text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
              <Triangle className="w-2.5 h-2.5 fill-current rotate-90" />
            </div>
          </div>
        </div>

        {/* Bottom padding */}
        <div className="h-16"></div>
      </div>
    </div>
  );
}
