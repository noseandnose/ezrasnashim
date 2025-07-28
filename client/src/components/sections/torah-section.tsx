import { Book, Heart, Play, Shield, BookOpen, Sparkles, Star, Scroll, Triangle } from "lucide-react";
import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import type { Section } from "@/pages/home";

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

  const torahItems = [
    {
      id: 'chizuk',
      icon: Heart,
      title: 'Chizuk',
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
      title: 'Emuna',
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
      title: 'Halacha',
      subtitle: 'Learn Shabbos',
      gradient: 'bg-white',
      iconBg: 'bg-gradient-feminine',
      iconColor: 'text-white',
      border: 'border-blush/10',
      contentType: 'text'
    },
    {
      id: 'featured',
      icon: Star,
      title: 'Featured',
      subtitle: 'Special Topics',
      gradient: 'bg-white',
      iconBg: 'bg-gradient-feminine',
      iconColor: 'text-white',
      border: 'border-blush/10',
      contentType: 'audio'
    }
  ];

  return (
    <div className="overflow-y-auto h-full pb-20">
      {/* Main Torah Section - Connected to top bar */}
      <div className="bg-gradient-soft rounded-b-3xl p-3 shadow-lg -mt-1">
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
            <p className="platypi-regular text-xs text-black/90 leading-relaxed text-justify">
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
            return (
              <button
                key={id}
                className={`${isCompleted ? 'bg-sage/20' : gradient} rounded-3xl p-3 text-center glow-hover transition-gentle shadow-lg border ${border} relative`}
                onClick={() => openModal(id)}
              >
                {/* Content Type Indicator */}
                {contentType && (
                  <div className="absolute top-2 left-2 bg-white text-black text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                    {contentType === 'audio' ? (
                      <Triangle className="w-2.5 h-2.5 fill-current rotate-90" />
                    ) : (
                      <span className="platypi-bold text-xs">T</span>
                    )}
                  </div>
                )}
                
                <div className={`${isCompleted ? 'bg-sage' : iconBg} p-2 rounded-full mx-auto mb-2 w-fit`}>
                  <Icon className={`${iconColor}`} size={18} strokeWidth={1.5} />
                </div>
                <h3 className="platypi-bold text-xs text-black mb-1 tracking-wide">{title}</h3>
                <p className="platypi-regular text-xs text-black/60 leading-relaxed">
                  {isCompleted ? 'Completed' : subtitle}
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
